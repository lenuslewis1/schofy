export async function readImportFile(file){
  if(!file||file.size>5*1024*1024)throw new Error('Choose a file up to 5 MB.')
  const extension=file.name.split('.').pop().toLowerCase();if(!['xlsx','xls','xlsm','ods','csv','tsv','json'].includes(extension))throw new Error('Choose Excel, CSV, TSV, ODS or JSON.')
  let sheets=[]
  if(extension==='json'){let content;try{content=JSON.parse(await file.text())}catch{throw new Error('The JSON file is invalid.')}
    const tables=Array.isArray(content)?[['Records',content]]:content&&typeof content==='object'?Object.entries(content):[];if(!tables.length)throw new Error('JSON needs an array of records or an object containing record arrays.')
    sheets=tables.map(([name,rows])=>{if(!Array.isArray(rows)||rows.some(r=>!r||typeof r!=='object'||Array.isArray(r)))throw new Error('Every JSON table must contain record objects.');const headers=[...new Set(rows.flatMap(row=>Object.keys(row)))];return {name,matrix:[headers,...rows.map(r=>headers.map(h=>r[h]??''))]}})
  }else{const XLSX=await import('xlsx');if(extension==='xls')XLSX.set_cptable(await import('xlsx/dist/cpexcel.full.mjs'))
    let book;try{book=XLSX.read(await file.arrayBuffer(),{type:'array',raw:true,cellDates:true,sheetRows:5002,cellFormula:true,cellHTML:false})}catch{throw new Error('The spreadsheet could not be read. It may be encrypted or damaged.')}
    if(book.SheetNames.length>20)throw new Error('Use a workbook with no more than 20 worksheets.')
    sheets=book.SheetNames.map(name=>{const sheet=book.Sheets[name];if(!sheet['!ref'])return {name,matrix:[]};const range=XLSX.utils.decode_range(sheet['!fullref']||sheet['!ref']);if(range.e.c-range.s.c+1>60||range.e.r-range.s.r+1>5001)throw new Error(`Worksheet ${name} exceeds 60 columns or 5,000 data rows.`);const matrix=[],rawMatrix=[],formulaErrors={};for(let r=range.s.r;r<=range.e.r;r++){const cells=[];for(let c=range.s.c;c<=range.e.c;c++){const cell=sheet[XLSX.utils.encode_cell({r,c})];if(cell?.f&&cell.v===undefined){(formulaErrors[r+1]??=[]).push('A formula has no saved value. Recalculate and save the workbook before importing.');cells.push('')}else if(cell?.t==='d'){const d=cell.v;cells.push(d instanceof Date&&!Number.isNaN(d.valueOf())?d.toISOString().slice(0,10):'')}else cells.push(cell?.t==='s'?String(cell.v):cell?XLSX.utils.format_cell(cell):'')}matrix.push(cells);rawMatrix.push(cells.map((value,i)=>sheet[XLSX.utils.encode_cell({r,c:range.s.c+i})]?.v??value))}return {name,matrix,rawMatrix,formulaErrors,startRow:range.s.r+1}})
  }
  const nonempty=sheets.filter(s=>s.matrix.some(row=>row.some(v=>String(v??'').trim())));if(!nonempty.length)throw new Error('The file has no readable records.');if(nonempty.length>20)throw new Error('Import at most 20 tables at once.')
  if(nonempty.reduce((n,s)=>n+s.matrix.length,0)>5020)throw new Error('The file contains more than 5,000 rows. Split it into smaller imports.')
  return nonempty.map(sheet=>({...sheet,file:file.name}))
}

export function importTable(sheet,headerIndex=0){if(headerIndex<0||headerIndex>=sheet.matrix.length)throw new Error('Select a valid header row.');if(sheet.matrix[headerIndex].length>60)throw new Error('Import at most 60 columns.')
  const seen=new Set(),headers=sheet.matrix[headerIndex].map((v,i)=>{const base=String(v??'').trim()||`Column ${i+1}`;let header=base,n=2;while(seen.has(header))header=`${base} (${n++})`;seen.add(header);return header})
  const rows=sheet.matrix.slice(headerIndex+1).map((cells,i)=>({row:(sheet.startRow||1)+headerIndex+1+i,cells,rawCells:sheet.rawMatrix?.[headerIndex+1+i],errors:[...(sheet.formulaErrors?.[(sheet.startRow||1)+headerIndex+1+i]||[]),...(cells.some(v=>v&&typeof v==='object')?['Nested JSON values cannot be imported as fields.']:[])]})).filter(r=>r.cells.some(v=>String(v??'').trim())||r.errors.length)
  if(rows.length>5000)throw new Error('Import at most 5,000 rows.');return {file:sheet.file,name:sheet.name,aiExtracted:!!sheet.aiExtracted,headers,rows}
}
