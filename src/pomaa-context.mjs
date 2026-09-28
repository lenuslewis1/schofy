import {policyContext} from './pomaa-workflows.mjs'
export const pomaaModules = ['overview','admissions','students','parents','teachers','classes','attendance','results','timetable','fees','communications','library','transport','hostel','users','settings','staff-attendance','progress','wellbeing']
const list = value => Array.isArray(value) ? value : []
const sum = (rows,key) => rows.reduce((n,r)=>n+(Number(r[key])||0),0)
const pick = (rows,fields) => rows.slice(0,40).map(row=>Object.fromEntries(fields.map(key=>[key,row[key] ?? ''])))

// Send only relevant operational fields. Contact details and health/incident notes stay out.
export function pomaaContext(db, {role='Admin',learnerId='',allowed=pomaaModules,page='overview'}={}) {
  const visible=new Set(allowed.filter(id=>pomaaModules.includes(id))), privateView=['Parent','Student'].includes(role)
  const students=list(db.students).filter(s=>!privateView||s.id===learnerId), names=new Set(students.map(s=>s.name)), ids=new Set(students.map(s=>s.id))
  const scope=rows=>list(rows).filter(r=>!privateView||names.has(r.student)||ids.has(r.studentId))
  const context={school:db.settings?.name || 'School',role,currentPage:page,date:new Date().toISOString().slice(0,10),academicYear:db.settings?.year,period:db.settings?.period,currency:db.settings?.currency || 'GHS',allowedModules:[...visible],sampleLimit:40}
  if(visible.has('students')||privateView) context.students={count:students.length,records:pick(students,['id','name','group','status'])}
  if(visible.has('teachers')) context.staff={count:list(db.teachers).length,records:pick(list(db.teachers),['name','subject','role','status'])}
  if(visible.has('classes')) context.classes=pick(list(db.classes).filter(c=>!privateView||students.some(s=>s.group===c.name)),['name','department','teacher','capacity','credits'])
  if(visible.has('admissions')) context.admissions={count:list(db.admissions).length,records:pick(list(db.admissions),['name','level','status','date'])}
  if(visible.has('attendance')) context.attendance=pick(scope(db.attendance).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))),['studentId','name','date','status'])
  if(visible.has('results')) context.results=pick(scope(db.results),['id','student','subject','assessment','score','maximum','date','term'])
  if(visible.has('progress')) {context.sbaWeight=Number(db.settings?.sbaWeight ?? 30);context.passMark=Number(db.settings?.passMark ?? 50);context.progress=Object.fromEntries(Object.entries(db.progressScores||{}).filter(([key])=>!privateView||[...ids].some(id=>key.endsWith(':'+id))).slice(0,40))}
  if(visible.has('timetable')) context.timetable=pick(list(db.timetable).filter(t=>!privateView||students.some(s=>s.group===t.group)),['subject','group','teacher','day','time','room'])
  if(visible.has('fees')) {const invoices=scope(db.invoices),invoiceIds=new Set(invoices.map(i=>i.id)),payments=list(db.payments).filter(p=>invoiceIds.has(p.invoice));context.finance={billed:sum(invoices,'amount'),collected:sum(payments,'amount'),outstanding:sum(invoices,'amount')-sum(payments,'amount'),invoices:pick(invoices.map(i=>({...i,balance:Number(i.amount)-sum(payments.filter(p=>p.invoice===i.id),'amount')})),['id','student','description','due','amount','balance'])};if(!privateView)context.finance.expenses=sum(list(db.expenses),'amount')}
  if(visible.has('library')) context.library=pick(list(db.library).filter(b=>!privateView||b.status==='Available'||names.has(b.borrower)),['title','author','status','borrower'])
  if(visible.has('transport')) context.transport=pick(list(db.transport),['route','vehicle','driver','capacity','status'])
  if(visible.has('hostel')) context.hostel=pick(list(db.hostel),['building','room','capacity','occupants'])
  if(visible.has('staff-attendance')) context.staffAttendance=pick(list(db.staffAttendance),['staffId','date','status','arrival'])
  if(visible.has('wellbeing')) context.wellbeing={open:list(db.wellbeing).filter(r=>r.status==='Open').length,total:list(db.wellbeing).length,details:'Sensitive welfare notes are excluded.'}
  if(visible.has('communications')) context.communications={draftCount:list(db.messages).length,delivery:'Not connected'}
  context.policies=policyContext(db,role)
  return context
}

export function allowedPomaaActions(actions, allowed, role) {
  return list(actions).slice(0,4).filter(a=>a&&typeof a.label==='string'&&a.label.length<=100&&(
    a.type==='navigate'&&allowed.includes(a.module)||
    a.type==='draft_resource'&&!['Parent','Student'].includes(role)&&allowed.includes(a.module)&&['classes','results','progress','timetable','overview'].includes(a.module)&&typeof a.body==='string'&&a.body.trim().length>0&&a.body.length<=12000||
    a.type==='draft_message'&&allowed.includes('communications')&&!['Parent','Student'].includes(role)&&typeof a.body==='string'&&a.body.trim().length>0&&a.body.length<=5000
  )).map(a=>({type:a.type,label:a.label,module:a.type==='draft_message'?'communications':a.module,body:a.type==='navigate'?'':a.body}))
}
