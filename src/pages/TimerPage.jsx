import { useEffect, useMemo, useState } from 'react'

const readSettings = () => { try { return JSON.parse(localStorage.getItem('focusTimerSettings')) || {} } catch { return {} } }
const nextHour = () => { const d = new Date(); d.setHours(d.getHours()+1,0,0,0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
const todayKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const format = (seconds) => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`
const saveFocus = (minutes, mode) => { try { const sessions=JSON.parse(localStorage.getItem('focusSessions')||'[]'); sessions.push({id:Date.now(),date:todayKey(),minutes,mode}); localStorage.setItem('focusSessions',JSON.stringify(sessions)) } catch {} }
const presets = [25, 50, 90, 100]

export default function TimerPage() {
  const saved = useMemo(readSettings, [])
  const [mode,setMode]=useState(saved.mode||'countdown')
  const [duration,setDuration]=useState(saved.duration||25)
  const [focus,setFocus]=useState(saved.focus||25)
  const [shortBreak,setShortBreak]=useState(saved.shortBreak||5)
  const [longBreak,setLongBreak]=useState(saved.longBreak||15)
  const [cycleLength,setCycleLength]=useState(saved.cycleLength||4)
  const [deadline,setDeadline]=useState(saved.deadline||nextHour())
  const [phase,setPhase]=useState('focus')
  const [cycles,setCycles]=useState(0)
  const initialSeconds=()=>saved.mode==='deadline'&&saved.deadline?Math.max(0,Math.floor((new Date(saved.deadline).getTime()-Date.now())/1000)):(saved.mode==='pomodoro'?(saved.focus||25):(saved.duration||25))*60
  const [remaining,setRemaining]=useState(initialSeconds)
  const [segmentSeconds,setSegmentSeconds]=useState(initialSeconds)
  const [sessionDuration,setSessionDuration]=useState(saved.duration||25)
  const [endsAt,setEndsAt]=useState(null)
  const [running,setRunning]=useState(false)
  const [paused,setPaused]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{localStorage.setItem('focusTimerSettings',JSON.stringify({mode,duration,focus,shortBreak,longBreak,cycleLength,deadline}))},[mode,duration,focus,shortBreak,longBreak,cycleLength,deadline])
  useEffect(()=>{
    if(!running||!endsAt)return
    const tick=()=>{
      const left=Math.max(0,Math.ceil((endsAt-Date.now())/1000))
      setRemaining(left)
      if(left===0){
        setRunning(false);setEndsAt(null);setPaused(false)
        if(mode==='pomodoro'&&phase==='focus'){
          const completedCycles=cycles+1
          saveFocus(focus,'pomodoro');setCycles(completedCycles);setPhase('break')
          const breakSeconds=(completedCycles%cycleLength===0?longBreak:shortBreak)*60
          setRemaining(breakSeconds);setSegmentSeconds(breakSeconds)
        }else if(mode==='pomodoro'){
          setPhase('focus');setRemaining(focus*60);setSegmentSeconds(focus*60)
          if(cycles>0&&cycles%cycleLength===0)setCycles(0)
        }else saveFocus(sessionDuration,mode)
      }
    }
    const id=setInterval(tick,250);tick();return()=>clearInterval(id)
  },[running,endsAt,mode,phase,focus,shortBreak,longBreak,cycleLength,cycles,sessionDuration])
  const baseSeconds=segmentSeconds
  const progress=baseSeconds>0?Math.max(0,Math.min(1,remaining/baseSeconds)):1
  const start=()=>{
    setError('')
    const initial=mode==='deadline'?Math.floor((new Date(deadline).getTime()-Date.now())/1000):mode==='pomodoro'?(phase==='focus'?focus*60:(cycles%cycleLength===cycleLength-1?longBreak:shortBreak)*60):duration*60
    if(!Number.isFinite(initial)||initial<=0){setError('Choisissez une heure de fin dans le futur.');return}
    const next=paused?remaining:initial
    if(!paused)setSessionDuration(Math.max(1,Math.ceil(next/60)))
    setSegmentSeconds(next);setRemaining(next);setEndsAt(Date.now()+next*1000);setPaused(false);setRunning(true)
  }
  const reset=()=>{setRunning(false);setEndsAt(null);setPaused(false);setPhase('focus');const next=mode==='pomodoro'?focus*60:mode==='deadline'?Math.max(0,Math.floor((new Date(deadline).getTime()-Date.now())/1000)):duration*60;setRemaining(next);setSegmentSeconds(next);setError('')}
  const changeMode=(next)=>{setRunning(false);setEndsAt(null);setPaused(false);setMode(next);setPhase('focus');const seconds=next==='pomodoro'?focus*60:next==='deadline'?Math.max(0,Math.floor((new Date(deadline).getTime()-Date.now())/1000)):duration*60;setRemaining(seconds);setSegmentSeconds(seconds);setError('')}
  const label=mode==='pomodoro'?(phase==='focus'?'SESSION DE FOCUS':'PAUSE') : mode==='deadline'?'COMPTE À REBOURS AVANT VOTRE ÉCHÉANCE':'SESSION LIBRE'
  const endText=deadline?new Date(deadline).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'—'
  return <div className="page-enter">
    <header className="page-header"><div><div className="eyebrow"><span className="eyebrow-line"/> DEEP WORK STUDIO</div><h1>Le studio<span className="accent-text"> focus.</span></h1><p className="page-subtitle">Configurez votre temps. Gardez l’esprit sur une seule chose.</p></div><div className="system-status"><i/> EN LOCAL · PRIVÉ</div></header>
    <div className="timer-layout">
      <section className="panel timer-main">
        <div className="mode-switch" role="tablist" aria-label="Mode du minuteur">{[['countdown','Durée libre'],['deadline','Fin à une heure'],['pomodoro','Pomodoro']].map(([id,title])=><button key={id} role="tab" aria-selected={mode===id} className={mode===id?'selected':''} onClick={()=>changeMode(id)}>{title}</button>)}</div>
        <div className="timer-label"><i/>{label}</div>
        <div className="timer-clock"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c2ffe9"/><stop offset="100%" stopColor="#69dfb5"/></linearGradient></defs><circle className="clock-track" cx="50" cy="50" r="46"/><circle className="clock-progress" cx="50" cy="50" r="46" strokeDasharray="289" strokeDashoffset={289*(1-progress)}/></svg><div className="clock-center"><div className="clock-digits">{format(remaining)}</div><div className="clock-caption">{running?'RESTEZ DANS LE FLOW':'PRÊT QUAND VOUS L’ÊTES'}</div>{mode==='deadline'&&<div className="clock-detail">Fin prévue à {endText}</div>}{mode==='pomodoro'&&<div className="clock-detail">Cycle {Math.min(phase==='focus'?cycles+1:cycles,cycleLength)} / {cycleLength}</div>}</div></div>
        <div className="timer-controls"><button className="timer-control-icon" aria-label="Réinitialiser" onClick={reset}>↺</button><button className="button button-primary timer-start" onClick={running?()=>{setRunning(false);setEndsAt(null);setPaused(true)}:start}>{running?'Ⅱ  Pause':'▶  Démarrer'}</button><button className="timer-control-icon" aria-label="Terminer la session" onClick={()=>{if(mode==='pomodoro'&&phase==='focus')saveFocus(Math.max(1,Math.round((baseSeconds-remaining)/60)),'pomodoro');setRunning(false);setEndsAt(null);reset()}}>■</button></div>
        {error&&<div className="toast" role="alert">{error}</div>}
      </section>
      <div className="timer-side">
        <section className="panel timer-config"><h2 className="config-title">Paramètres de session</h2><p className="config-description">Ajustez votre session selon votre énergie et votre journée.</p>
          {mode==='countdown'&&<><label className="field-group"><span className="field-label">Durée de concentration · minutes</span><input className="field-control" type="number" min="1" max="600" value={duration} onChange={(e)=>{setDuration(Math.max(1,Number(e.target.value)||1));if(!running&&!paused){setRemaining(Math.max(1,Number(e.target.value)||1)*60);setSegmentSeconds(Math.max(1,Number(e.target.value)||1)*60)}}}/></label><div className="preset-row">{presets.map((n)=><button key={n} className={`preset-chip${duration===n?' selected':''}`} onClick={()=>{setDuration(n);if(!running&&!paused){setRemaining(n*60);setSegmentSeconds(n*60)}}}>{n} min</button>)}</div></>}
          {mode==='deadline'&&<label className="field-group"><span className="field-label">Terminer le travail à</span><input className="field-control" type="datetime-local" value={deadline} onChange={(e)=>{const seconds=Math.max(0,Math.floor((new Date(e.target.value).getTime()-Date.now())/1000));setDeadline(e.target.value);if(!running&&!paused){setRemaining(seconds);setSegmentSeconds(seconds)}}}/></label>}
          {mode==='pomodoro'&&<><div className="field-row"><label className="field-group"><span className="field-label">Focus · min</span><input className="field-control" type="number" min="1" max="240" value={focus} onChange={(e)=>{const v=Math.max(1,Number(e.target.value)||1);setFocus(v);if(!running&&!paused&&phase==='focus'){setRemaining(v*60);setSegmentSeconds(v*60)}}}/></label><label className="field-group"><span className="field-label">Pause courte · min</span><input className="field-control" type="number" min="1" max="60" value={shortBreak} onChange={(e)=>setShortBreak(Math.max(1,Number(e.target.value)||1))}/></label></div><div className="field-row"><label className="field-group"><span className="field-label">Pause longue · min</span><input className="field-control" type="number" min="1" max="120" value={longBreak} onChange={(e)=>setLongBreak(Math.max(1,Number(e.target.value)||1))}/></label><label className="field-group"><span className="field-label">Cycles avant pause longue</span><input className="field-control" type="number" min="2" max="12" value={cycleLength} onChange={(e)=>setCycleLength(Math.max(2,Number(e.target.value)||2))}/></label></div><div className="preset-row">{[25,50,100].map((n)=><button key={n} className={`preset-chip${focus===n?' selected':''}`} onClick={()=>{setFocus(n);if(!running&&!paused){setRemaining(n*60);setSegmentSeconds(n*60)}}}>{n} min focus</button>)}</div></>}
          <button className="button button-primary button-full" onClick={running?()=>{setRunning(false);setEndsAt(null);setPaused(true)}:start}>{running?'Mettre en pause':'Appliquer et démarrer'}<span>↗</span></button>
        </section>
        <div className="timer-side-info"><div className="tiny-stat"><span>AUJOURD’HUI</span><strong>{(()=>{try{return JSON.parse(localStorage.getItem('focusSessions')||'[]').filter(s=>s.date===todayKey()).length}catch{return 0}})()} <small>sessions</small></strong></div><div className="tiny-stat"><span>TON RYTHME</span><strong>{mode==='pomodoro'?`${focus}/${shortBreak}`:mode==='deadline'?endText:`${duration}`} <small>{mode==='pomodoro'?'min':mode==='deadline'?'fin':'min'}</small></strong></div></div>
      </div>
    </div>
  </div>
}