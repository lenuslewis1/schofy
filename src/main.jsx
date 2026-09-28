import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bell, BookOpen, CalendarDays, ChevronDown, CircleDollarSign, ClipboardCheck,
  GraduationCap, LayoutDashboard, Menu, MoreHorizontal, Plus, Search, Settings,
  UserRound, UsersRound, X, ArrowUpRight, Check, Download, SlidersHorizontal,
  ArrowRight, Play, CheckCircle2, TimerReset, MessageCircleMore, BarChart3,
  ShieldCheck, Quote, Star
} from 'lucide-react'
import './styles.css'
import LandingPage from './LandingPage'
import Platform from './Platform'
import AuthWorkspace from './AuthWorkspace'
import './brand.css'

const students = [
  { id: 'NS-24018', name: 'Maya Thompson', initials: 'MT', className: 'Grade 9 · Orion', guardian: 'Nora Thompson', attendance: 96, fees: 'Paid', status: 'Active' },
  { id: 'NS-24021', name: 'Ethan Williams', initials: 'EW', className: 'Grade 8 · Aspen', guardian: 'Paul Williams', attendance: 91, fees: 'Due', status: 'Active' },
  { id: 'NS-24027', name: 'Amara Owusu', initials: 'AO', className: 'Grade 10 · Atlas', guardian: 'Kwame Owusu', attendance: 98, fees: 'Paid', status: 'Active' },
  { id: 'NS-24033', name: 'Noah Mensah', initials: 'NM', className: 'Grade 7 · Cedar', guardian: 'Ama Mensah', attendance: 88, fees: 'Overdue', status: 'Active' },
  { id: 'NS-24039', name: 'Sofia García', initials: 'SG', className: 'Grade 9 · Orion', guardian: 'Elena García', attendance: 94, fees: 'Paid', status: 'Active' },
  { id: 'NS-24045', name: 'Lucas Chen', initials: 'LC', className: 'Grade 11 · Nova', guardian: 'Mei Chen', attendance: 97, fees: 'Part-paid', status: 'Active' },
]

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: UserRound },
  { id: 'teachers', label: 'Teachers', icon: UsersRound },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'fees', label: 'Fees & payments', icon: CircleDollarSign },
  { id: 'results', label: 'Results', icon: GraduationCap },
]

const schedule = [
  { time: '08:00', title: 'Mathematics', room: 'Grade 9 · Room 12', color: '#5271ff' },
  { time: '10:15', title: 'Staff briefing', room: 'Faculty lounge', color: '#ef9a63' },
  { time: '12:30', title: 'Biology practical', room: 'Grade 10 · Lab 2', color: '#29a88c' },
  { time: '15:00', title: 'Basketball practice', room: 'Sports hall', color: '#a274e8' },
]

function Sidebar({ page, setPage, open, setOpen, showLanding }) {
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <button className="brand" onClick={showLanding}><div className="brand-mark"><GraduationCap size={23}/></div><div><strong>Schofy</strong><span>School simplified</span></div></button>
    <button className="close-menu" onClick={() => setOpen(false)} aria-label="Close menu"><X size={22}/></button>
    <nav>
      <p className="nav-label">Workspace</p>
      {navItems.map(item => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => { setPage(item.id); setOpen(false) }}>
        <item.icon size={19}/><span>{item.label}</span>{item.id === 'attendance' && <em>12</em>}
      </button>)}
      <p className="nav-label second">System</p>
      <button onClick={() => setPage('settings')} className={page === 'settings' ? 'active' : ''}><Settings size={19}/><span>Settings</span></button>
    </nav>
    <div className="school-switcher"><div className="crest">NA</div><div><strong>Schofy Academy</strong><span>2026 academic year</span></div><ChevronDown size={16}/></div>
  </aside>
}

function Header({ title, setMenuOpen, setPage }) {
  return <header className="topbar">
    <button className="menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu/></button>
    <div><p>Schofy Academy</p><h1>{title}</h1></div>
    <div className="header-actions">
      <label className="search"><Search size={18}/><input placeholder="Search students, classes..." /></label>
      <button className="primary header-add" onClick={()=>setPage('students')}><Plus size={16}/> Add new</button>
      <button className="icon-button"><Bell size={20}/><i/></button>
      <button className="profile"><span>OL</span><div><strong>Olivia Lewis</strong><small>Administrator</small></div><ChevronDown size={15}/></button>
    </div>
  </header>
}

function Stat({ label, value, delta, icon: Icon, tone }) {
  return <div className="stat">
    <div className={`stat-icon ${tone}`}><Icon size={21}/></div>
    <div><span>{label}</span><strong>{value}</strong><small><b>↗ {delta}</b> from last term</small></div>
  </div>
}

function AttendanceChart() {
  const data = [82, 91, 88, 96, 92, 86, 94, 98, 93, 95, 91, 97]
  return <div className="chart-wrap">
    <div className="chart-grid"><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div>
    <div className="bars">{data.map((v, i) => <div className="bar-col" key={i}><div className="bar" style={{height: `${v}%`}}><i>{v}%</i></div><span>{['M','T','W','T','F','M','T','W','T','F','M','T'][i]}</span></div>)}</div>
  </div>
}

function Overview({ setPage }) {
  const [selectedDay, setSelectedDay] = useState(26)
  return <div className="page-enter themed-overview">
    <div className="overview-main">
      <section className="school-welcome">
        <div><h2>Good morning, Olivia</h2><p>You have 4 activities scheduled today.<br/>Let’s get the school day started.</p><button onClick={()=>setPage('attendance')}>Review attendance <ArrowRight size={16}/></button></div>
        <div className="welcome-art" aria-hidden="true"><div className="art-orbit"/><div className="art-board"><ClipboardCheck size={76} strokeWidth={1.4}/></div><span className="art-pencil"/><i/></div>
      </section>
      <section className="panel school-at-glance"><div className="panel-head"><h3>School at a glance</h3><button className="link-button" onClick={()=>setPage('results')}>View reports <ArrowUpRight size={15}/></button></div>
        <div className="school-stat-grid">{[
          {label:'Total students',value:'1,248',note:'4.2% from last term',icon:UserRound,tone:'cyan',page:'students'},
          {label:'Teaching staff',value:'86',note:'2.1% from last term',icon:UsersRound,tone:'coral',page:'teachers'},
          {label:'Attendance',value:'94.6%',note:'Today’s attendance',icon:ClipboardCheck,tone:'magenta',page:'attendance'},
          {label:'Fees collected',value:'$184.2k',note:'78% of term fees',icon:CircleDollarSign,tone:'pink',page:'fees'}
        ].map(({label,value,note,icon:Icon,tone,page})=><button className="school-stat" key={label} onClick={()=>setPage(page)}><span className={`stat-tile ${tone}`}><Icon size={35} strokeWidth={1.7}/><strong>{value}</strong></span><b>{label}</b><small>{note}</small></button>)}</div>
      </section>
      <section className="panel school-register"><div className="panel-head"><h3>Student overview</h3><button className="link-button" onClick={()=>setPage('students')}>View all</button></div><div className="register-table"><div className="register-heading"><span>Full name</span><span>Class</span><span>Fee status</span><span/></div>{students.slice(0,5).map(s=><button className="register-row" key={s.id} onClick={()=>setPage('students')}><strong>{s.name}</strong><span>{s.className}</span><span className={`register-status ${s.fees.toLowerCase()}`}><i/>{s.fees}</span><MoreHorizontal size={17}/></button>)}</div></section>
      <section className="panel attendance-panel"><div className="panel-head"><div><h3>Attendance overview</h3><p>Daily attendance across all classes</p></div><span className="attendance-total">94.6%</span></div><AttendanceChart/></section>
    </div>
    <aside className="panel school-day"><div className="panel-head"><h3>School calendar</h3><span className="calendar-month"><CalendarDays size={15}/> September</span></div>
      <div className="calendar-week">{['Thu','Fri','Sat','Sun','Mon','Tue','Wed'].map((day,i)=><button key={day} className={selectedDay===24+i?'selected':''} onClick={()=>setSelectedDay(24+i)} aria-pressed={selectedDay===24+i}><span>{day}</span><strong>{24+i}</strong></button>)}</div>
      <div className="rail-section"><div className="panel-head"><h3>Recently enrolled</h3><button className="link-button" onClick={()=>setPage('students')}>View all</button></div><div className="enrolment-list">{students.slice(0,5).map(s=><div className="enrolment-person" key={s.id}><span className="avatar">{s.initials}</span><div><strong>{s.name}</strong><small>{s.className}</small></div><button aria-label={`View ${s.name}`} onClick={()=>setPage('students')}><ArrowUpRight size={17}/></button></div>)}</div></div>
      <div className="rail-section"><div className="panel-head"><h3>{selectedDay===26?'Today’s schedule':`September ${selectedDay}`}</h3><span className="rail-count">{selectedDay===26?'4 activities':'No activities'}</span></div><div className="schedule-list">{selectedDay===26?schedule.map(item=><div className="schedule-item" key={item.time}><time>{item.time}</time><i style={{background:item.color}}/><div><strong>{item.title}</strong><span>{item.room}</span></div></div>):<p className="calendar-empty">No activities scheduled for this day.</p>}</div></div>
      <div className="rail-section"><div className="panel-head"><h3>Quick actions</h3></div><div className="rail-actions"><button onClick={()=>setPage('attendance')}><ClipboardCheck size={22}/><span>Take attendance</span><ArrowRight size={15}/></button><button onClick={()=>setPage('fees')}><CircleDollarSign size={22}/><span>Record payment</span><ArrowRight size={15}/></button></div></div>
    </aside>
  </div>
}

function StudentsPage() {
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const filtered = useMemo(() => students.filter(s => `${s.name} ${s.id} ${s.className}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <div className="page-enter">
    <section className="page-title"><div><h2>Students</h2><p>Manage enrolment, student records and guardians.</p></div><button className="primary" onClick={() => setShowModal(true)}><Plus size={18}/> Add student</button></section>
    <div className="table-toolbar"><label className="table-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search students..."/></label><button><SlidersHorizontal size={17}/> Filter</button><button><Download size={17}/> Export</button></div>
    <div className="data-table"><div className="table-head"><span>Student</span><span>Class</span><span>Guardian</span><span>Attendance</span><span>Fees</span><span></span></div>
      {filtered.map(s => <div className="table-row" key={s.id}><div className="student-cell"><span className="avatar">{s.initials}</span><div><strong>{s.name}</strong><small>{s.id}</small></div></div><span>{s.className}</span><span>{s.guardian}</span><span><b className={s.attendance < 90 ? 'low' : ''}>{s.attendance}%</b></span><span><em className={`badge ${s.fees.toLowerCase().replace('-','')}`}>{s.fees}</em></span><button><MoreHorizontal size={18}/></button></div>)}
      {!filtered.length && <div className="empty">No students match “{query}”.</div>}
    </div>
    {showModal && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowModal(false)}><div className="modal"><div className="modal-head"><div><h3>Add a new student</h3><p>Create a student record for the current academic year.</p></div><button onClick={()=>setShowModal(false)}><X/></button></div><form onSubmit={e=>{e.preventDefault();setShowModal(false)}}><label>Full name<input required placeholder="Student’s full name"/></label><div className="form-row"><label>Student ID<input placeholder="Generated automatically" disabled/></label><label>Class<select><option>Grade 7 · Cedar</option><option>Grade 8 · Aspen</option><option>Grade 9 · Orion</option></select></label></div><label>Guardian email<input type="email" required placeholder="guardian@example.com"/></label><div className="modal-actions"><button type="button" onClick={()=>setShowModal(false)}>Cancel</button><button className="primary" type="submit"><Check size={17}/> Add student</button></div></form></div></div>}
  </div>
}

function GenericPage({ title, icon: Icon }) {
  return <div className="page-enter"><section className="page-title"><div><h2>{title}</h2><p>Manage and review {title.toLowerCase()} across Schofy Academy.</p></div><button className="primary"><Plus size={18}/> Add new</button></section><div className="coming-surface"><div className="large-icon"><Icon size={30}/></div><h3>{title} workspace</h3><p>This module is ready for your school’s specific workflow and data.</p><button className="primary">Configure module</button></div></div>
}

function App() {
  const [screen, setScreen] = useState('landing')
  const [page, setPage] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const title = navItems.find(n=>n.id===page)?.label || 'Settings'
  const generic = navItems.find(n=>n.id===page)
  if (['/workspace','/login','/signup'].includes(window.location.pathname.replace(/\/+$/, ''))) return <AuthWorkspace/>
  if (screen === 'landing') return <LandingPage openPlatform={(destination)=>{setPage(typeof destination==='string'?destination:'overview');setScreen('app');window.scrollTo(0,0)}}/>
  return <Platform initialPage={page} showLanding={()=>{setScreen('landing');window.scrollTo(0,0)}}/>
}

createRoot(document.getElementById('root')).render(<App />)


