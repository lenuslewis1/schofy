import PomaaTools from './PomaaTools'

import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'



import { Sparkles, ArrowUpRight, Send, X, RotateCcw, MessageCircleMore, Check, LoaderCircle } from 'lucide-react'



import { supabase } from './supabase'



import { pomaaContext, allowedPomaaActions } from './pomaa-context.mjs'



import './pomaa.css'







import {importTargets} from './import-core.mjs'



const PomaaImport=lazy(()=>import('./PomaaImport'))



const starters=[['School briefing','Give me a concise briefing on my school records and three useful priorities for today.'],['Fees & follow-up','Help me understand fee balances and what to follow up on.'],['Lesson planning','Help me plan a lesson. Ask me for the class, subject, topic and duration first.'],['Write a message','Help me draft a school announcement. Ask what I want to communicate and who it is for.']]







export default function PomaaAssistant({db,role,identity,allowed,page,go,update,commitImport,live=false}) {



  const [importing,setImporting]=useState(false)



  const [open,setOpen]=useState(false),[status,setStatus]=useState('checking'),[input,setInput]=useState(''),[messages,setMessages]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[review,setReview]=useState(null),[draft,setDraft]=useState(''),[recipient,setRecipient]=useState('Parents'),[channel,setChannel]=useState('SMS'),[saved,setSaved]=useState(''),[model,setModel]=useState('')



  const field=useRef(null),dialog=useRef(null),end=useRef(null),controller=useRef(null),returnFocus=useRef(null),requestLock=useRef(false)



  useEffect(()=>{let active=true;fetch('/api/pomaa/status').then(r=>{if(!r.ok)throw new Error();return r.json()}).then(s=>{if(active){setStatus(s.available?'connected':'unconfigured');setModel(s.model||'')}}).catch(()=>active&&setStatus('offline'));return()=>{active=false;controller.current?.abort()}},[])



  useEffect(()=>{if(open){field.current?.focus();end.current?.scrollIntoView({block:'nearest'})}},[open,messages,busy])



  useEffect(()=>{if(!open)return;const prior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=prior}},[open])



  useEffect(()=>{if(open&&(review||saved))end.current?.scrollIntoView({block:'nearest'})},[open,review,saved])



  function launch(event,prompt){returnFocus.current=event.currentTarget;setOpen(true);if(prompt)setInput(prompt)}



  function close(){setOpen(false);returnFocus.current?.focus()}



  function keyboard(e){if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const nodes=[...dialog.current.querySelectorAll('button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled])')].filter(el=>el.offsetParent!==null);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}



  async function ask(e){e?.preventDefault();const question=input.trim();if(!question||requestLock.current)return;requestLock.current=true;setBusy(true);setError('');setInput('');setReview(null);setSaved('')



    const history=[...messages.map(m=>({role:m.role,content:m.content})),{role:'user',content:question}].slice(-11)



    setMessages(old=>[...old,{role:'user',content:question}]);controller.current=new AbortController()



    try{const headers={'Content-Type':'application/json'};if(live){const {data}=await supabase.auth.getSession();if(!data.session)throw new Error('Sign in again to ask Pomaa about your school.');headers.Authorization=`Bearer ${data.session.access_token}`}



      const response=await fetch('/api/pomaa',{method:'POST',headers,signal:controller.current.signal,body:JSON.stringify({scope:live?'live':'demo',page,messages:history,...(!live?{context:pomaaContext(db,{role,learnerId:identity,allowed,page})}:{})})});const answer=await response.json().catch(()=>({error:'Pomaa’s server is unavailable. Start the app with its server.'}));if(!response.ok)throw new Error(answer.error||'Pomaa could not answer. Please try again.')



      if(typeof answer.reply!=='string')throw new Error('Pomaa returned an incomplete answer. Please try again.')



      setMessages(old=>[...old,{role:'assistant',content:answer.reply,actions:allowedPomaaActions(answer.actions,allowed,role)}]);setStatus('connected')



    }catch(err){if(err.name!=='AbortError'){setError(err.message||'Pomaa is unavailable. Please try again.');setInput(question)}}finally{setBusy(false);requestLock.current=false}



  }



  function actionClick(action){if(action.type==='navigate'){go(action.module);close()}else {setReview(action);setDraft(action.body);setSaved('')}}



  async function saveDraft(e){e.preventDefault();if(review?.type==='draft_resource'){if(!draft.trim()||['Parent','Student'].includes(role)||!allowed.includes(review.module))return;try{await commitImport(d=>({...d,aiResources:[{id:crypto.randomUUID(),title:review.label,module:review.module,body:draft.trim(),role,date:new Date().toISOString()},...(d.aiResources||[])].slice(0,100)}),'Saved reviewed Pomaa resource');setReview(null);setSaved('Reviewed resource saved in AI workflows & resources. School records have not been changed.')}catch(err){setError(err.message)}return;}if(!draft.trim()||!allowed.includes('communications')||['Parent','Student'].includes(role))return;try{await commitImport(d=>({...d,messages:[{id:crypto.randomUUID(),channel,recipient,body:draft.trim(),status:'Draft',date:new Date().toISOString(),author:`${role} · Pomaa assisted`},...(d.messages||[])]}),'Saved reviewed Pomaa message draft');setReview(null);setSaved('Draft saved in Communications. Nothing has been sent.')}catch(err){setError(err.message)}}



  return <>



    {page==='overview'&&<section className="pomaa-intro" aria-label="Pomaa school assistant"><div className="pomaa-orb"><Sparkles size={26}/></div><div className="pomaa-intro-copy"><span className="pomaa-eyebrow">YOUR SCHOOL’S AI ASSISTANT</span><h2>A little help from Pomaa.</h2><p>From the first register to the last school bell. Ask, plan and get things moving.</p><div className="pomaa-intro-topics">{starters.slice(0,3).map(([label,prompt])=><button key={label} onClick={e=>launch(e,prompt)}>{label}<ArrowUpRight size={13}/></button>)}</div></div><button className="pomaa-primary" onClick={e=>launch(e)}><Sparkles size={16}/> Ask Pomaa <ArrowUpRight size={17}/></button></section>}



    <button className="pomaa-launcher" aria-label="Ask Pomaa" aria-expanded={open} onClick={e=>launch(e)}><Sparkles size={20}/><span>Ask Pomaa</span></button>



    {open&&<div className="pomaa-overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><section ref={dialog} className="pomaa-panel" role="dialog" aria-modal="true" aria-labelledby="pomaa-title" onKeyDown={keyboard}><header className="pomaa-header"><span className="pomaa-avatar"><Sparkles size={21}/></span><div><h2 id="pomaa-title">Pomaa</h2><p><i className={status==='connected'?'connected':''}/>{status==='connected'?`AI connected${model?' · '+model:''}`:status==='checking'?'Connecting…':'AI unavailable'} · Your school assistant</p></div><button className="pomaa-icon" aria-label="Start a new Pomaa chat" disabled={busy} onClick={()=>{setMessages([]);setError('');setReview(null);setSaved('');setInput('');field.current?.focus()}}><RotateCcw size={17}/></button><button className="pomaa-icon" aria-label="Close Pomaa" onClick={close}><X size={20}/></button></header>



    <div className="pomaa-context-strip"><span>{db.settings.name}</span><span>{role} · {live?'Saved school records':'Sample workspace'}</span></div>



    {importing?<Suspense fallback={<p>Opening file importer…</p>}><PomaaImport db={db} role={role} allowed={allowed} commitImport={commitImport} live={live} go={module=>{go(module);close()}} back={()=>setImporting(false)}/></Suspense>:<>    <div className="pomaa-conversation" role="log" aria-live="polite" aria-relevant="additions"><div className="pomaa-welcome"><span>Hi, I’m Pomaa <Sparkles size={16}/></span><h3>What can I help you with?</h3><p>Ask about your school, prepare lessons and quizzes, review progress, draft messages and explore policies. Save useful results after reviewing them.</p><PomaaTools db={db} role={role} identity={identity} allowed={allowed} page={page} live={live} commitImport={commitImport} busy={busy} onPrompt={prompt=>{setInput(prompt);field.current?.focus()}}/>{!messages.length&&<div className="pomaa-starters">{starters.map(([label,prompt])=><button key={label} onClick={()=>{setInput(prompt);field.current?.focus()}}>{label}<ArrowUpRight size={15}/></button>)}</div>}</div>



      {messages.map((m,i)=><article className={`pomaa-message ${m.role}`} key={i}><small>{m.role==='user'?'You':'Pomaa'}</small><div className="pomaa-message-body">{m.content}</div>{m.actions?.length>0&&<div className="pomaa-actions">{m.actions.map((a,n)=><button key={n} disabled={busy} onClick={()=>actionClick(a)}>{a.type==='navigate'?<ArrowUpRight size={15}/>:<MessageCircleMore size={15}/>} {a.label}</button>)}</div>}</article>)}



      {busy&&<div className="pomaa-thinking"><LoaderCircle size={16}/><span>Pomaa is thinking…</span></div>}



      {error&&<div role="alert" className="pomaa-error">{error}<small>Your question is ready to retry below.</small></div>}



      {review&&<form className="pomaa-review" onSubmit={saveDraft}><h3>{review.type==='draft_resource'?'Review your AI resource':'Review your message'}</h3><p>Check the audience and wording before saving.</p>{review.type!=='draft_resource'&&<div><label>Channel<select value={channel} onChange={e=>setChannel(e.target.value)}>{['SMS','Email','WhatsApp'].map(c=><option key={c}>{c}</option>)}</select></label><label>Audience<select value={recipient} onChange={e=>setRecipient(e.target.value)}>{['Parents','Students','Teachers','All staff'].map(r=><option key={r}>{r}</option>)}</select></label></div>}<label>{review.type==='draft_resource'?'Resource text':'Draft message'}<textarea rows={5} maxLength={review.type==='draft_resource'?12000:5000} required value={draft} onChange={e=>setDraft(e.target.value)}/></label><div><button type="button" onClick={()=>setReview(null)}>Cancel</button><button className="pomaa-primary" type="submit"><Check size={15}/> {review.type==='draft_resource'?'Save reviewed resource':'Save to Communications'}</button></div><small>{review.type==='draft_resource'?'Saves a resource only. Grades and timetables stay unchanged.':'Saves a draft only. No delivery.'}</small></form>}



      {saved&&<p className="pomaa-saved" role="status"><Check size={15}/>{saved}</p>}<div ref={end}/>



    </div><footer className="pomaa-composer">{importTargets(role,allowed).length>0&&<button className="pomaa-primary" disabled={busy} onClick={()=>setImporting(true)}>Upload records with Pomaa</button>}<form onSubmit={ask}><label className="sr-only" htmlFor="pomaa-question">Ask Pomaa a question</label><textarea ref={field} id="pomaa-question" value={input} maxLength={6000} rows={2} placeholder="Ask Pomaa anything about your school…" onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();ask()}}}/><button type="submit" className="pomaa-send" disabled={busy||!input.trim()} aria-label="Send question to Pomaa">{busy?<LoaderCircle size={19}/>:<Send size={19}/>}</button></form><p>AI can make mistakes. Check important details.<br/>{live?'A summary of saved school records and reviewed policy sources is shared with OpenAI.':'Sample workspace context is shared with OpenAI.'} Health notes and contact details are excluded.</p></footer></>}</section></div>}



  </>



}



