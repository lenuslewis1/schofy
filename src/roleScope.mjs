// Role previews are filtered views of the local sample workspace. Signed-in
// accounts remain owners until staff membership and database policies exist.
const list=value=>Array.isArray(value)?value:[]
const same=(a,b)=>String(a??'').trim().toLocaleLowerCase()===String(b??'').trim().toLocaleLowerCase()
const minimalStudent=student=>({id:student.id,name:student.name,group:student.group,status:student.status,guardian:student.guardian,transportRoute:student.transportRoute,hostelRoom:student.hostelRoom})

export function scopeWorkspace(db,{role='Admin',teacherId='',learnerId='',routeId='',building=''}={}){
  if(role==='Admin')return {db,students:list(db.students),label:'Whole school',teacher:null,assignedGroups:[]}
  const students=list(db.students),teachers=list(db.teachers),classes=list(db.classes),timetable=list(db.timetable)
  let visibleStudents=[],visibleClasses=[],visibleTimetable=[],teacher=null,assignedGroups=[]
  if(role==='Teacher'){
    teacher=teachers.find(t=>String(t.id)===String(teacherId))||null
    const assignedLessons=teacher?timetable.filter(t=>same(t.teacherId,teacher.id)||same(t.teacher,teacher.name)):[]
    assignedGroups=[...new Set([
      ...classes.filter(c=>teacher&&(same(c.teacherId,teacher.id)||same(c.teacher,teacher.name))).map(c=>c.name),
      ...assignedLessons.map(t=>t.group),
    ].filter(Boolean))]
    visibleStudents=students.filter(s=>assignedGroups.some(group=>same(s.group,group))).map(minimalStudent)
    visibleClasses=classes.filter(c=>assignedGroups.some(group=>same(c.name,group)))
    visibleTimetable=assignedLessons
  }else if(role==='Student'||role==='Parent'){
    visibleStudents=students.filter(s=>String(s.id)===String(learnerId)).map(minimalStudent)
    visibleClasses=classes.filter(c=>visibleStudents.some(s=>same(s.group,c.name)))
    visibleTimetable=timetable.filter(t=>visibleStudents.some(s=>same(s.group,t.group)))
  }else if(role==='Librarian'){
    const borrowers=new Set(list(db.library).map(book=>String(book.borrower||'').trim().toLocaleLowerCase()).filter(Boolean))
    visibleStudents=students.filter(s=>borrowers.has(String(s.name).trim().toLocaleLowerCase())||borrowers.has(String(s.id).trim().toLocaleLowerCase())).map(minimalStudent)
  }else if(role==='Transport officer'){
    const routes=list(db.transport).filter(r=>String(r.id)===String(routeId))
    visibleStudents=students.filter(s=>s.transportRoute&&routes.some(r=>same(s.transportRoute,r.id)||same(s.transportRoute,r.route))).map(minimalStudent)
  }else if(role==='Hostel manager'){
    const rooms=list(db.hostel).filter(r=>building&&same(r.building,building))
    visibleStudents=students.filter(s=>s.hostelRoom&&rooms.some(r=>same(s.hostelRoom,r.id)||same(s.hostelRoom,r.room)||same(s.hostelRoom,`${r.building} / ${r.room}`))).map(minimalStudent)
  }else if(role==='Accountant'){
    visibleStudents=students.map(minimalStudent)
  }else if(role==='Front desk'||role==='Receptionist'){
    visibleStudents=students
    visibleTimetable=timetable
  }
  const studentIds=new Set(visibleStudents.map(s=>String(s.id))),studentNames=new Set(visibleStudents.map(s=>String(s.name).trim().toLocaleLowerCase()))
  const isStudent=row=>studentIds.has(String(row.studentId))||studentNames.has(String(row.student||row.name||'').trim().toLocaleLowerCase())
  const invoices=list(db.invoices).filter(isStudent),invoiceIds=new Set(invoices.map(i=>String(i.id)))
  const canSeeFees=['Accountant','Student','Parent'].includes(role)
  const canSeeAcademic=['Teacher','Student','Parent'].includes(role)
  const canSeeStudentAttendance=['Teacher','Student','Parent'].includes(role)
  const canSeeProgress=canSeeAcademic
  const canSeeLibrary=['Student','Librarian'].includes(role)
  const view={...db,
    students:visibleStudents,
    classes:visibleClasses,
    timetable:visibleTimetable,
    teachers:[],
    parents:['Front desk','Receptionist'].includes(role)?list(db.parents):[],
    admissions:['Front desk','Receptionist'].includes(role)?list(db.admissions):[],
    attendance:canSeeStudentAttendance?list(db.attendance).filter(isStudent):[],
    results:canSeeAcademic?list(db.results).filter(isStudent):[],
    progressScores:canSeeProgress?Object.fromEntries(Object.entries(db.progressScores||{}).filter(([key])=>studentIds.has(key.split(':').at(-1)))):{},
    invoices:canSeeFees?invoices:[],
    payments:canSeeFees?list(db.payments).filter(p=>invoiceIds.has(String(p.invoice))):[],
    expenses:role==='Accountant'?list(db.expenses):[],
    library:canSeeLibrary?role==='Student'?list(db.library).filter(book=>book.status==='Available'||studentNames.has(String(book.borrower||'').trim().toLocaleLowerCase())):list(db.library):[],
    transport:role==='Transport officer'?list(db.transport).filter(r=>String(r.id)===String(routeId)):[],
    hostel:role==='Hostel manager'?list(db.hostel).filter(r=>building&&same(r.building,building)):[],
    wellbeing:[],
    staffAttendance:[],
    users:[],
    audit:[],
    messages:['Student','Parent'].includes(role)?[]:list(db.messages).filter(m=>role==='Teacher'?m.authorId===teacherId:role==='Accountant'?['Accountant','Finance'].includes(m.author):m.author===role),
    aiResources:list(db.aiResources).filter(r=>role==='Teacher'?r.authorId===teacherId:r.role===role),
  }
  if(role==='Teacher')view.teachers=teacher?[{id:teacher.id,name:teacher.name,subject:teacher.subject,role:teacher.role,status:teacher.status}]:[]
  const route=list(db.transport).find(r=>String(r.id)===String(routeId))
  const label=role==='Teacher'?teacher?`${teacher.name} · ${assignedGroups.length?assignedGroups.join(', '):'No assigned classes'}`:'No teacher selected':role==='Student'||role==='Parent'?visibleStudents[0]?.name||'No learner selected':role==='Librarian'?'Library loans':role==='Transport officer'?route?.route||'No route selected':role==='Hostel manager'?building||'No building selected':role==='Accountant'?'Finance records':'Front office records'
  return {db:view,students:visibleStudents,label,teacher,assignedGroups}
}

export function assertTeacherMutation(before,after,teacherId){
  const visible=scopeWorkspace(before,{role:'Teacher',teacherId}).students
  const ids=new Set(visible.map(s=>String(s.id))),names=new Set(visible.map(s=>String(s.name).trim().toLocaleLowerCase()))
  const belongs=row=>ids.has(String(row.studentId))||names.has(String(row.student||row.name||'').trim().toLocaleLowerCase())
  const permitted=new Set(['attendance','results','progressScores','messages','aiResources','audit'])
  for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
    if(!permitted.has(key)&&JSON.stringify(before[key])!==JSON.stringify(after[key]))throw new Error('Teachers can only change records for their assigned classes.')
  }
  for(const key of ['attendance','results']){
    const old=new Map(list(before[key]).map((record,index)=>[String(record.id??index),record]))
    const next=new Map(list(after[key]).map((record,index)=>[String(record.id??index),record]))
    for(const [id,record] of next)if(JSON.stringify(record)!==JSON.stringify(old.get(id))&&!belongs(record))throw new Error('This learner is outside the selected teacher’s classes.')
    for(const [id,record] of old)if(!next.has(id)&&!belongs(record))throw new Error('A teacher cannot remove another class’s records.')
  }
  for(const [key,value] of Object.entries(after.progressScores||{}))if(JSON.stringify(value)!==JSON.stringify(before.progressScores?.[key])&&!ids.has(key.split(':').at(-1)))throw new Error('This progress record is outside the selected teacher’s classes.')
  for(const key of Object.keys(before.progressScores||{}))if(!(key in (after.progressScores||{}))&&!ids.has(key.split(':').at(-1)))throw new Error('A teacher cannot remove another class’s progress.')
}
