import React, { useEffect, useRef, useState } from 'react'
import { GraduationCap, ArrowRight, ShieldCheck, LogOut } from 'lucide-react'
import { supabase } from './supabase'
import { loadWorkspace, createWorkspace, saveWorkspace, createSaveQueue, emptyWorkspace } from './cloudStore'
import Platform from './Platform'
import './auth.css'
import { signupMetadata, schoolTypes, schoolSizes } from './signupDetails'

function AuthCard({ children, wide = false }) {
  return <main className="auth-page"><a className="auth-brand" href="/"><span><GraduationCap/></span><span className="auth-wordmark"><strong>Schofy</strong><small>School simplified</small></span></a><section className={`auth-card ${wide?'signup-card':''}`}>{children}</section><p className="auth-foot"><ShieldCheck size={15}/> Your school. Your private workspace.</p></main>
}

function SignupForm({ onLogin }) {
  const [details,setDetails] = useState({fullName:'',jobTitle:'',phone:'',schoolName:'',schoolType:'',schoolSize:'',country:'Ghana',city:''})
  const [email,setEmail] = useState(''), [password,setPassword] = useState(''), [confirmation,setConfirmation] = useState('')
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [sent,setSent] = useState(false)
  const field = (key,value) => setDetails(d=>({...d,[key]:value}))
  async function submit(e) {
    e.preventDefault();setError('');setBusy(true)
    try {
      const metadata=signupMetadata(details,password,confirmation)
      const {data,error:err}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:`${window.location.origin}/workspace`,data:metadata}})
      if(err) throw err
      if(!data.session){setSent(true);setPassword('');setConfirmation('')}
    } catch(err){setError(err.message||'Could not create your account. Please try again.')}
    finally{setBusy(false)}
  }
  if(sent) return <AuthCard><span className="auth-kicker">ONE MORE STEP</span><h1>Check your inbox.</h1><p>If this address is eligible for a new account, a confirmation link will be sent to <strong>{email}</strong>. Open it to verify your email and finish creating your school workspace.</p><div className="signup-next"><strong>Your next steps</strong><ol><li>Open the confirmation email.</li><li>Confirm your email address.</li><li>Start setting up your school in Schofy.</li></ol><small>If you already have an account, sign in instead. Check your spam folder if the email has not arrived.</small></div><button className="auth-primary" onClick={onLogin}>Back to sign in <ArrowRight size={17}/></button></AuthCard>
  return <AuthCard wide><span className="auth-kicker">YOUR SCHOOL’S NEXT CHAPTER</span><h1>Let’s simplify your school.</h1><p>Tell us about your school and create your owner account. Your workspace starts with your school’s details and an empty register, ready for your team’s records.</p><form onSubmit={submit}><fieldset disabled={busy} className="signup-fields"><legend><span>01</span> Your school</legend><div className="signup-grid"><label className="signup-full">School name<input required maxLength={120} autoComplete="organization" placeholder="e.g. Greenfield Academy" value={details.schoolName} onChange={e=>field('schoolName',e.target.value)}/></label><label>School type<select required value={details.schoolType} onChange={e=>field('schoolType',e.target.value)}><option value="" disabled>Select school type</option>{schoolTypes.map(v=><option key={v}>{v}</option>)}</select></label><label>Number of students<select required value={details.schoolSize} onChange={e=>field('schoolSize',e.target.value)}><option value="" disabled>Select student count</option>{schoolSizes.map(v=><option key={v}>{v}</option>)}</select></label><label>Country<input required maxLength={120} autoComplete="country-name" value={details.country} onChange={e=>field('country',e.target.value)}/></label><label>City / town <span className="signup-optional">Optional</span><input maxLength={120} autoComplete="address-level2" placeholder="e.g. Accra" value={details.city} onChange={e=>field('city',e.target.value)}/></label></div></fieldset><fieldset disabled={busy} className="signup-fields"><legend><span>02</span> About you</legend><div className="signup-grid"><label>Full name<input required maxLength={120} autoComplete="name" placeholder="Your first and last name" value={details.fullName} onChange={e=>field('fullName',e.target.value)}/></label><label>Your role at the school<input required maxLength={120} autoComplete="organization-title" placeholder="e.g. School owner or administrator" value={details.jobTitle} onChange={e=>field('jobTitle',e.target.value)}/><small>Your position helps us personalise your school's setup.</small></label><label>Email address<input required type="email" autoComplete="email" placeholder="you@yourschool.com" value={email} onChange={e=>setEmail(e.target.value)}/><small>Used for sign-in and account confirmation.</small></label><label>Phone number <span className="signup-optional">Optional</span><input type="tel" maxLength={40} autoComplete="tel" placeholder="e.g. +233 24 123 4567" value={details.phone} onChange={e=>field('phone',e.target.value)}/></label></div></fieldset><fieldset disabled={busy} className="signup-fields"><legend><span>03</span> Secure your account</legend><div className="signup-grid"><label>Password<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/><small>At least 8 characters. Use a unique password.</small></label><label>Confirm password<input required type="password" autoComplete="new-password" minLength={8} aria-invalid={confirmation.length>0&&confirmation!==password} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/>{confirmation&&confirmation!==password&&<small className="signup-mismatch">Passwords do not match yet.</small>}</label></div></fieldset>{error&&<p className="auth-error" role="alert">{error}</p>}<div className="signup-submit"><p><ShieldCheck size={16}/> You’ll confirm your email before accessing your private workspace.</p><button className="auth-primary" disabled={busy||!supabase}>{busy?'Creating your account…':'Create school account'}<ArrowRight size={17}/></button></div></form><div className="auth-links"><span>Already have an account? <button onClick={onLogin}>Sign in</button></span></div><a className="auth-demo-link" href="/">Explore the demo first ↗</a></AuthCard>
}

function AuthForm({ mode, setMode, onRecovered }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
  const titles = { login: 'Welcome back.', signup: 'Make room for better school days.', reset: 'Reset your password.', recovery: 'Choose a new password.' }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      let result
      const redirect = `${window.location.origin}/workspace`
      if (mode === 'login') result = await supabase.auth.signInWithPassword({ email, password })
      if (mode === 'signup') {
        result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect } })
        if (!result.error && !result.data.session) setMessage('Check your email to confirm your account, then sign in.')
      }
      if (mode === 'reset') {
        result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${redirect}?recovery=1` })
        if (!result.error) setMessage('If an account exists for this email, you’ll receive a password reset link.')
      }
      if (mode === 'recovery') {
        result = await supabase.auth.updateUser({ password })
        if (!result.error) { window.history.replaceState({}, '', '/workspace'); onRecovered() }
      }
      if (result?.error) throw result.error
    } catch (err) { setError(err.message || 'Could not complete your request. Please try again.') }
    finally { setBusy(false) }
  }
  function change(next) { setMode(next); setMessage(''); setError(''); setPassword('') }
  if(mode==='signup') return <SignupForm onLogin={()=>change('login')}/>
  return <AuthCard><span className="auth-kicker">YOUR SCHOOL, CONNECTED</span><h1>{titles[mode]}</h1><p>{mode==='signup'?'Create your school owner account.':mode==='recovery'?'Set a new password for your account.':'Sign in to your secure school workspace.'}</p><form onSubmit={submit}>{mode!=='recovery'&&<label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>}{mode!=='reset'&&<label>{mode==='recovery'?'New password':'Password'}<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?undefined:8} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>{mode!=='login'&&<small>At least 8 characters.</small>}</label>}{error&&<p className="auth-error" role="alert">{error}</p>}{message&&<p className="auth-notice" role="status">{message}</p>}<button className="auth-primary" disabled={busy||!supabase}>{busy?'Please wait…':({login:'Sign in',signup:'Create account',reset:'Send reset link',recovery:'Update password'})[mode]}<ArrowRight size={17}/></button></form>{mode==='login'?<div className="auth-links"><button onClick={()=>change('reset')}>Forgot password?</button><span>New to Schofy? <button onClick={()=>change('signup')}>Create an account</button></span></div>:mode!=='recovery'&&<div className="auth-links"><button onClick={()=>change('login')}>Back to sign in</button></div>}<a className="auth-demo-link" href="/">Explore the public demo instead ↗</a></AuthCard>
}

function CloudWorkspace({ session }) {
  const [row, setRow] = useState(null), [db, setDb] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [pending, setPending] = useState(0)
  const [name, setName] = useState(''), [creating, setCreating] = useState(false)
  const current = useRef(null), revision = useRef(0), queue = useRef(null), failed = useRef(false)
  const alive = useRef(true)
  function install(record) {
    failed.current = false; revision.current = record.revision
    current.current = { ...emptyWorkspace(), ...record.data }
    setRow(record); setDb(current.current); setError('')
    queue.current = createSaveQueue(async snapshot => {
      revision.current = await saveWorkspace(supabase, record.id, revision.current, snapshot)
    }, value => { if(alive.current) setPending(value) }, err => {
      failed.current = true
      if(alive.current) setError(`Changes have not been confirmed saved. ${err.message}`)
    })
  }
  async function reload() {
    setLoading(true); setError('')
    try {
      let record = await loadWorkspace(supabase, session.user.id)
      const profile=session.user.user_metadata
      if(!record && profile?.school_setup?.name) {
        try {record=await createWorkspace(supabase,session.user.id,profile.school_setup.name,{...profile,email:session.user.email})}
        catch(err){if(err.code==='23505')record=await loadWorkspace(supabase,session.user.id);else throw err}
      }
      if(alive.current) { if(record) install(record); else {setRow(null);setDb(null)} }
    }
    catch (err) { if(alive.current) setError(err.message) }
    finally { if(alive.current) setLoading(false) }
  }
  useEffect(() => {
    alive.current = true; reload()
    return () => { alive.current = false }
  }, [session.user.id])
  useEffect(() => {
    const warn = e => { if(pending>0 || (error&&db)) { e.preventDefault(); e.returnValue='' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pending,error,db])
  async function signOut() {
    if(pending || failed.current) return
    const {error:err} = await supabase.auth.signOut()
    if(err) setError(err.message)
  }
  async function create(e) {
    e.preventDefault(); setCreating(true); setError('')
    try { install(await createWorkspace(supabase, session.user.id, name)) }
    catch(err) { setError(err.message) }
    finally { setCreating(false) }
  }
  function update(fn, action) {
    if(failed.current || !current.current) return
    const next = fn(structuredClone(current.current))
    next.audit = [{id:crypto.randomUUID(),action,at:new Date().toISOString(),actor:session.user.id},...(next.audit||[])].slice(0,100)
    current.current = next; setDb(next); queue.current.enqueue(structuredClone(next))
  }
  async function commitImport(fn,action){
    if(failed.current||!current.current)throw new Error('Reload your saved workspace before importing.')
    update(fn,action)
    await queue.current.settled()
    if(failed.current)throw new Error('The database save failed. Download your unsaved copy or reload before retrying.')
  }
  if(loading) return <AuthCard><h1>Opening your workspace…</h1><p role="status">Loading your school’s saved records.</p></AuthCard>
  if(!row) return <AuthCard><h1>Your school starts here.</h1><p>Signed in as {session.user.email}. Create a private school workspace with empty records.</p><form onSubmit={create}><label>School name<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} disabled={creating}/></label>{error&&<p role="alert" className="auth-error">{error}</p>}<button className="auth-primary" disabled={creating||!name.trim()}>{creating?'Creating…':'Create school workspace'}<ArrowRight size={17}/></button></form><div className="auth-links"><button onClick={reload}>Refresh</button><button onClick={signOut}>Sign out</button></div></AuthCard>
  return <><div className="cloud-account"><span><ShieldCheck size={15}/>{session.user.email}</span><span role="status">{error?'Save needs attention':pending?'Saving changes…':'All changes saved'}</span><button disabled={pending>0||failed.current} onClick={signOut}><LogOut size={14}/> Sign out</button></div>{error&&<div className="cloud-error" role="alert"><p>{error}</p><p>Editing is paused. Export your unsaved copy before reloading the saved version.</p><button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='schofy-unsaved-backup.json';link.click();URL.revokeObjectURL(url)}}>Download unsaved copy</button><button onClick={reload}>Reload saved version</button></div>}<fieldset className="cloud-platform" disabled={!!error}><Platform remoteStore={[db,update,'',commitImport]} cloudStatus={pending?'Saving changes…':'All changes saved'} showLanding={()=>{if(!pending&&!failed.current) window.location.assign('/')}}/></fieldset></>
}

export default function AuthWorkspace() {
  const [session, setSession] = useState(null), [ready, setReady] = useState(!supabase)
  const [mode, setMode] = useState(window.location.pathname==='/signup'?'signup':'login')
  const [recovery, setRecovery] = useState(new URLSearchParams(window.location.search).has('recovery')||window.location.hash.includes('type=recovery'))
  const [error, setError] = useState('')
  useEffect(() => {
    if(!supabase) return
    let active = true
    supabase.auth.getSession().then(({data,error})=>{if(active){setSession(data.session);setReady(true);if(error)setError(error.message)}}).catch(err=>{if(active){setError(err.message);setReady(true)}})
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,next) => {
      setSession(next);setReady(true)
      if(event==='PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => {active=false;subscription.unsubscribe()}
  }, [])
  if(!supabase) return <AuthCard><h1>Your workspace is almost ready.</h1><p>Supabase has not been connected to this installation yet. Add the project URL and publishable key to the app’s environment to enable secure sign-in.</p><a className="auth-primary" href="/">Back to Schofy <ArrowRight size={17}/></a></AuthCard>
  if(!ready) return <AuthCard><h1>Checking your session…</h1></AuthCard>
  if(error) return <AuthCard><h1>Could not check your session.</h1><p role="alert">{error}</p><button className="auth-primary" onClick={()=>window.location.reload()}>Try again</button></AuthCard>
  if(recovery) return session?<AuthForm mode="recovery" setMode={setMode} onRecovered={()=>setRecovery(false)}/>:<AuthCard><h1>Open your reset link.</h1><p>Use the link in your password reset email to set a new password.</p><button className="auth-primary" onClick={()=>{setRecovery(false);setMode('reset')}}>Send another reset link</button></AuthCard>
  if(session) return <CloudWorkspace key={session.user.id} session={session}/>
  return <AuthForm mode={mode} setMode={setMode}/>
}




