import test from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import {readImportFile,importTable} from '../src/import-file.mjs'
import {columnMapping,planImport,applyImport,importTargets} from '../src/import-core.mjs'
import {emptyWorkspace} from '../src/cloudStore.js'
const file=(name,data)=>({name,size:Buffer.byteLength(data),text:async()=>String(data),arrayBuffer:async()=>Buffer.from(data)})
test('CSV automatically maps students, preserves phones and source fields, skips duplicates and invalid rows',async()=>{
 const [sheet]=await readImportFile(file('students.csv','Full name,Class,Phone,House\nQA Learner,Grade 9,0200123456,Blue\nQA Learner,Grade 9,0200123456,Blue\nMissing Class,,0200000000,Red'))
 const table=importTable(sheet),mapping=columnMapping(table.headers,'students'),db=emptyWorkspace(),plan=planImport(db,table,'students',mapping)
 assert.deepEqual([plan.ready,plan.duplicates,plan.invalid],[1,1,1])
 const next=applyImport(db,table,'students',mapping,['students'])
 assert.equal(next.students[0].phone,'0200123456');assert.equal(next.students[0]._importSource.values.House,'Blue');assert.equal(db.students.length,0)
 assert.equal(planImport(next,table,'students',mapping).ready,0)
 assert.throws(()=>applyImport(db,table,'students',mapping,[]),/role/)
})
test('Excel formats retain leading zeros and typed financial amounts',async()=>{
 const book=XLSX.utils.book_new(),sheet=XLSX.utils.aoa_to_sheet([['Full name','Class','Phone'],['QA Excel','Grade 8',200123456]])
 sheet.C2.z='0000000000';XLSX.utils.book_append_sheet(book,sheet,'Students')
 const fee=XLSX.utils.aoa_to_sheet([['Student ID','Description','Amount','Due date'],['QA1','Term fee',1250,new Date('2026-10-01T00:00:00Z')]])
 fee.C2.z='"GHS "#,##0.00';XLSX.utils.book_append_sheet(book,fee,'Invoices')
 const sheets=await readImportFile(file('fictional.xlsx',XLSX.write(book,{type:'buffer',bookType:'xlsx',cellDates:true})))
 const db=emptyWorkspace();db.students=[{id:'QA1',name:'QA Existing'}]
 let table=importTable(sheets[0]);assert.equal(planImport(db,table,'students',columnMapping(table.headers,'students')).entries[0].record.phone,'0200123456')
 table=importTable(sheets[1]);const plan=planImport(db,table,'invoices',columnMapping(table.headers,'invoices'));assert.equal(plan.ready,1);assert.equal(plan.entries[0].record.amount,1250);assert.equal(plan.entries[0].record.due,'2026-10-01')
})
test('linked records require existing people and payment rows cannot overpay cumulatively',()=>{
 const db=emptyWorkspace();db.invoices=[{id:'I1',amount:100}]
 const table={headers:['Invoice ID','Amount','Payment method','Reference','Date'],rows:[['I1','70','Cash','R1','2026-09-26'],['I1','70','Cash','R2','2026-09-26']].map((cells,i)=>({cells,row:i+2}))}
 const plan=planImport(db,table,'payments',columnMapping(table.headers,'payments'));assert.equal(plan.ready,1);assert.equal(plan.invalid,1)
 assert.deepEqual(importTargets('Parent',['students','fees']),[])
})
test('JSON supports named tables and rejects nested field values',async()=>{
 const sheets=await readImportFile(file('records.json',JSON.stringify({Students:[{name:'QA JSON',class:'Grade 7',extra:{x:1}}],Teachers:[{name:'QA Teacher'}]})))
 assert.equal(sheets.length,2);const table=importTable(sheets[0]);assert.equal(planImport(emptyWorkspace(),table,'students',columnMapping(table.headers,'students')).invalid,1)
 await assert.rejects(readImportFile(file('bad.pdf','x')),/Choose/)
 await assert.rejects(readImportFile({name:'large.csv',size:6*1024*1024}),/5 MB/)
})

