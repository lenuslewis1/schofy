import test from 'node:test'
import assert from 'node:assert/strict'
import {scopeWorkspace,assertTeacherMutation} from '../src/roleScope.mjs'

const school={
 settings:{name:'Fictional School',type:'Secondary school',period:'Term 1',year:'2026',currency:'GHS'},
 students:[
  {id:'S1',name:'QA Ada',group:'Class A',email:'ada@example.test',phone:'0200000001',guardian:'QA Parent A',transportRoute:'Route East',hostelRoom:'Cedar / 101'},
  {id:'S2',name:'QA Ben',group:'Class B',email:'ben@example.test',phone:'0200000002',guardian:'QA Parent B',transportRoute:'Route West',hostelRoom:'Maple / 201'},
  {id:'S3',name:'QA Cam',group:'Class A',email:'cam@example.test',phone:'0200000003',guardian:'QA Parent C'},
 ],
 teachers:[{id:'T1',name:'QA Teacher A',subject:'Math'},{id:'T2',name:'QA Teacher B',subject:'Science'}],
 classes:[{id:'C1',name:'Class A',teacher:'QA Teacher A'},{id:'C2',name:'Class B',teacher:'QA Teacher B'}],
 timetable:[{id:'L1',group:'Class A',teacher:'QA Teacher A',subject:'Math'},{id:'L2',group:'Class B',teacher:'QA Teacher B',subject:'Science'}],
 attendance:[{id:'A1',studentId:'S1',name:'QA Ada',date:'2026-10-20',status:'Present'},{id:'A2',studentId:'S2',name:'QA Ben',date:'2026-10-20',status:'Absent'}],
 results:[{id:'R1',student:'QA Ada',subject:'Math',score:80},{id:'R2',student:'QA Ben',subject:'Science',score:72}],
 progressScores:{'Term 1:2026:Math:S1':{sba:80},'Term 1:2026:Science:S2':{sba:72}},
 invoices:[{id:'I1',student:'QA Ada',amount:100},{id:'I2',student:'QA Ben',amount:200}],payments:[{id:'P1',invoice:'I1',amount:30},{id:'P2',invoice:'I2',amount:50}],expenses:[{id:'E1',amount:80}],
 parents:[{id:'PA1',student:'QA Ada'}],admissions:[{id:'AD1',name:'QA Applicant'}],
 library:[{id:'B1',title:'Book A',status:'On loan',borrower:'QA Ada'},{id:'B2',title:'Book B',status:'Available',borrower:''}],
 transport:[{id:'V1',route:'Route East'},{id:'V2',route:'Route West'}],hostel:[{id:'H1',building:'Cedar',room:'101'},{id:'H2',building:'Maple',room:'201'}],
 wellbeing:[{id:'W1',studentId:'S1',note:'Private support note'}],messages:[{id:'M1',author:'Teacher',authorId:'T1',body:'Class A draft'},{id:'M2',author:'Teacher',authorId:'T2',body:'Class B draft'}],aiResources:[],users:[{id:'U1',role:'Admin'}],audit:[{id:'AU1'}]
}
const ids=rows=>rows.map(r=>r.id)
test('teacher sees only explicitly assigned classes and related learner records',()=>{
 const a=scopeWorkspace(school,{role:'Teacher',teacherId:'T1'}),b=scopeWorkspace(school,{role:'Teacher',teacherId:'T2'})
 assert.deepEqual(ids(a.db.students),['S1','S3']);assert.deepEqual(ids(a.db.classes),['C1']);assert.deepEqual(ids(a.db.timetable),['L1']);assert.deepEqual(ids(a.db.attendance),['A1']);assert.deepEqual(ids(a.db.results),['R1']);assert.deepEqual(Object.keys(a.db.progressScores),['Term 1:2026:Math:S1']);assert.deepEqual(ids(a.db.messages),['M1'])
 assert.deepEqual(ids(b.db.students),['S2']);assert.deepEqual(ids(b.db.classes),['C2']);assert.equal(a.db.students[0].phone,undefined);assert.equal(a.db.wellbeing.length,0);assert.equal(a.db.invoices.length,0);assert.equal(a.db.users.length,0)
 assert.equal(school.students[0].email,'ada@example.test')
})
test('timetable assignment counts even without lead class assignment; missing teacher gets no pupils',()=>{
 const changed={...school,timetable:[...school.timetable,{id:'L3',group:'Class B',teacher:'QA Teacher A',subject:'Art'}]}
 const scope=scopeWorkspace(changed,{role:'Teacher',teacherId:'T1'});assert.deepEqual(ids(scope.db.students),['S1','S2','S3']);assert.deepEqual(ids(scope.db.timetable),['L1','L3'])
 const missing=scopeWorkspace(school,{role:'Teacher',teacherId:'missing'});assert.equal(missing.students.length,0);assert.equal(missing.assignedGroups.length,0)
})
test('learner, finance and specialist previews are scoped to their responsibilities',()=>{
 const parent=scopeWorkspace(school,{role:'Parent',learnerId:'S1'}).db
 assert.deepEqual(ids(parent.students),['S1']);assert.deepEqual(ids(parent.invoices),['I1']);assert.deepEqual(ids(parent.payments),['P1']);assert.deepEqual(ids(parent.classes),['C1']);assert.deepEqual(ids(parent.results),['R1']);assert.equal(parent.messages.length,0)
 const accountant=scopeWorkspace(school,{role:'Accountant'}).db
 assert.equal(accountant.students.length,3);assert.equal(accountant.students[0].phone,undefined);assert.equal(accountant.invoices.length,2);assert.equal(accountant.expenses.length,1);assert.equal(accountant.wellbeing.length,0)
 assert.deepEqual(ids(scopeWorkspace(school,{role:'Librarian'}).db.students),['S1'])
 assert.deepEqual(ids(scopeWorkspace(school,{role:'Transport officer',routeId:'V1'}).db.students),['S1'])
 assert.deepEqual(ids(scopeWorkspace(school,{role:'Transport officer',routeId:'V2'}).db.students),['S2'])
 assert.deepEqual(ids(scopeWorkspace(school,{role:'Transport officer'}).db.students),[])
 assert.deepEqual(ids(scopeWorkspace(school,{role:'Hostel manager',building:'Cedar'}).db.students),['S1'])
 assert.deepEqual(ids(scopeWorkspace(school,{role:'Hostel manager',building:'Maple'}).db.students),['S2'])
 assert.deepEqual(ids(scopeWorkspace(school,{role:'Hostel manager'}).db.students),[])
 const desk=scopeWorkspace(school,{role:'Front desk'}).db;assert.equal(desk.students[0].phone,'0200000001');assert.equal(desk.invoices.length,0);assert.equal(desk.admissions.length,1)
})
test('teacher record commits reject other classes and global settings changes',()=>{
 assert.doesNotThrow(()=>assertTeacherMutation(school,{...school,attendance:[...school.attendance,{id:'A3',studentId:'S3',name:'QA Cam',status:'Present'}]},'T1'))
 assert.throws(()=>assertTeacherMutation(school,{...school,attendance:[...school.attendance,{id:'A4',studentId:'S2',name:'QA Ben',status:'Present'}]},'T1'),/outside/)
 assert.throws(()=>assertTeacherMutation(school,{...school,settings:{...school.settings,passMark:90}},'T1'),/assigned classes/)
})
