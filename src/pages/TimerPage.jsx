import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { localDateKey, readStore, writeStore } from '../lib/storage'

const presets = [25, 50, 90, 100]
const nextHour = () => { const date = new Date(); date.setHours(date.getHours() + 1, 0, 0, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
const readSettings = () => readStore('focusTimerSettings', {})
const readActive = () => readStore('activeFocusSession', null)
const format = (seconds) => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`
const safeKey = 'activeFocusSession'

function saveSession(session) {
  const sessions = readStore('focusSessions', [])
  writeStore('focusSessions', [...sessions, { ...session, id: Date.now(), date: localDateKey(new Date(session.startedAt)), startHour: new Date(session.startedAt).getHours() }])
}

function chime() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext
    if (!Audio) return
    const context = new Audio()
    ;[660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * .18)
      gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + index * .18 + .03)
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + index * .18 + .34)
      oscillator.connect(gain); gain.connect(context.destination)
      oscillator.start(context.currentTime + index * .18); oscillator.stop(context.currentTime + index * .18 + .36)
    })
    setTimeout(() => context.close(), 900)
  } catch {}
}

export default function TimerPage() {
  const [searchParams] = useSearchParams()
  const saved = useMemo(readSettings, [])
  const active = useMemo(readActive, [])
  const todos = useMemo(() => readStore('todos', []), [])
  const requestedTask = searchParams.get('taskId') || ''
  const [mode, setMode] = useState(active?.mode || saved.mode || 'countdown')
  const [duration, setDuration] = useState(saved.duration || 25)
  const [focus, setFocus] = useState(saved.focus || 25)
  const [shortBreak, setShortBreak] = useState(saved.shortBreak || 5)
  const [longBreak, setLongBreak] = useState(saved.longBreak || 15)
  const [cycleLength, setCycleLength] = useState(saved.cycleLength || 4)
  const [deadline, setDeadline] = useState(saved.deadline || nextHour())
  const [phase, setPhase] = useState(active?.phase || 'focus')
  const [cycles, setCycles] = useState(active?.cycles || 0)
  const initialSeconds = () => {
    if (active?.isActive) return active.running && active.endsAt ? active.mode === 'stopwatch' ? Math.max(0, Math.floor((Date.now() - active.endsAt) / 1000)) : Math.max(0, Math.ceil((active.endsAt - Date.now()) / 1000)) : active.remaining
    return saved.mode === 'deadline' && saved.deadline ? Math.max(0, Math.floor((new Date(saved.deadline).getTime() - Date.now()) / 1000)) : (saved.mode === 'pomodoro' ? (saved.focus || 25) : (saved.duration || 25)) * 60
  }
  const [remaining, setRemaining] = useState(initialSeconds)
  const [segmentSeconds, setSegmentSeconds] = useState(active?.segmentSeconds || initialSeconds())
  const [plannedSeconds, setPlannedSeconds] = useState(active?.plannedSeconds || initialSeconds())
  const [endsAt, setEndsAt] = useState(active?.endsAt || null)
  const [running, setRunning] = useState(Boolean(active?.running && active.endsAt))
  const [sessionActive, setSessionActive] = useState(Boolean(active?.isActive))
  const [paused, setPaused] = useState(Boolean(active?.isActive && !active?.running))
  const [startedAt, setStartedAt] = useState(active?.startedAt || null)
  const [taskId, setTaskId] = useState(active?.taskId || requestedTask)
  const [error, setError] = useState('')
  const selectedTask = todos.find((task) => String(task.id) === String(taskId))
  const taskLabel = selectedTask?.text || ''
  const baseSeconds = segmentSeconds
  const progress = mode === 'stopwatch' ? (remaining % 3600) / 3600 : baseSeconds > 0 ? Math.max(0, Math.min(1, remaining / baseSeconds)) : 1
  const endText = deadline ? new Date(deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'

  useEffect(() => { writeStore('focusTimerSettings', { mode, duration, focus, shortBreak, longBreak, cycleLength, deadline }) }, [mode, duration, focus, shortBreak, longBreak, cycleLength, deadline])
  useEffect(() => {
    if (!sessionActive) { localStorage.removeItem(safeKey); return }
    writeStore(safeKey, { isActive: true, running, mode, phase, cycles, endsAt: running ? endsAt : null, remaining, segmentSeconds, plannedSeconds, startedAt, taskId })
  }, [sessionActive, running, mode, phase, cycles, endsAt, remaining, segmentSeconds, plannedSeconds, startedAt, taskId])
  useEffect(() => {
    if (!running || !endsAt) return
    const tick = () => {
      const left = mode === 'stopwatch' ? Math.max(0, Math.floor((Date.now() - endsAt) / 1000)) : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        setRunning(false); setEndsAt(null); setPaused(false)
        const endedAt = Date.now()
        if (mode === 'pomodoro' && phase === 'focus') {
          saveSession({ startedAt: startedAt || endedAt - focus * 60_000, endedAt, minutes: focus, mode, taskId, taskText: taskLabel })
          const finishedCycles = cycles + 1
          setCycles(finishedCycles); setPhase('break')
          const breakSeconds = (finishedCycles % cycleLength === 0 ? longBreak : shortBreak) * 60
          setRemaining(breakSeconds); setSegmentSeconds(breakSeconds); setPlannedSeconds(breakSeconds); setStartedAt(null)
        } else if (mode === 'pomodoro') {
          setPhase('focus'); setRemaining(focus * 60); setSegmentSeconds(focus * 60); setPlannedSeconds(focus * 60); setStartedAt(null)
          if (cycles > 0 && cycles % cycleLength === 0) setCycles(0)
        } else {
          const minutes = Math.max(1, Math.round((plannedSeconds || left) / 60))
          saveSession({ startedAt: startedAt || endedAt - minutes * 60_000, endedAt, minutes, mode, taskId, taskText: taskLabel })
          setSessionActive(false); setStartedAt(null)
        }
        const preferences = readStore('focusPreferences', {})
        if (preferences.completionSound) chime()
        if (preferences.completionNotification && 'Notification' in window && Notification.permission === 'granted') {
          const title = 'Session de focus terminée'
          if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then((registration) => registration.showNotification(title, { body: taskLabel ? `Belle avancée sur « ${taskLabel} ».` : 'Prenez une pause ou poursuivez à votre rythme.', icon: '/icons/icon-192x192.png' })).catch(() => {})
          else new Notification(title, { body: 'Votre session est terminée.' })
        }
      }
    }
    const timer = setInterval(tick, 250)
    tick()
    return () => clearInterval(timer)
  }, [running, endsAt, mode, phase, focus, shortBreak, longBreak, cycleLength, cycles, startedAt, plannedSeconds, taskId, taskLabel])

  const initialForMode = (nextMode = mode, nextPhase = phase) => {
    if (nextMode === 'stopwatch') return 0
    if (nextMode === 'deadline') return Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)
    if (nextMode === 'pomodoro') return (nextPhase === 'focus' ? focus : (cycles % cycleLength === cycleLength - 1 ? longBreak : shortBreak)) * 60
    return duration * 60
  }
  const start = () => {
    setError('')
    const initial = initialForMode()
    if (mode !== 'stopwatch' && (!Number.isFinite(initial) || initial <= 0)) { setError('Choisissez une heure de fin dans le futur.'); return }
    const next = mode === 'stopwatch' ? paused ? remaining : 0 : paused ? remaining : initial
    const now = Date.now()
    if (!paused) { setStartedAt(now); setPlannedSeconds(mode === 'stopwatch' ? 0 : next) }
    setSegmentSeconds(mode === 'stopwatch' ? 0 : next); setRemaining(next); setEndsAt(mode === 'stopwatch' ? now - next * 1000 : now + next * 1000); setPaused(false); setSessionActive(true); setRunning(true)
  }
  const reset = () => {
    setRunning(false); setSessionActive(false); setEndsAt(null); setPaused(false); setStartedAt(null); setPhase('focus')
    const next = initialForMode(mode, 'focus')
    setRemaining(next); setSegmentSeconds(next); setPlannedSeconds(next); setError('')
  }
  const changeMode = (nextMode) => {
    setRunning(false); setSessionActive(false); setEndsAt(null); setPaused(false); setStartedAt(null); setPhase('focus'); setCycles(0); setMode(nextMode)
    const seconds = initialForMode(nextMode, 'focus')
    setRemaining(seconds); setSegmentSeconds(seconds); setPlannedSeconds(seconds); setError('')
  }
  const finishEarly = () => {
    if (sessionActive && startedAt && !(mode === 'pomodoro' && phase === 'break')) {
      const elapsedSeconds = mode === 'stopwatch' ? remaining : (plannedSeconds || 0) - remaining
      const elapsed = Math.floor(elapsedSeconds / 60)
      if (elapsed > 0) saveSession({ startedAt, endedAt: Date.now(), minutes: elapsed, mode, taskId, taskText: taskLabel })
    }
    reset()
  }
  const label = mode === 'pomodoro' ? (phase === 'focus' ? 'SESSION DE FOCUS' : 'PAUSE') : mode === 'deadline' ? 'COMPTE À REBOURS AVANT VOTRE ÉCHÉANCE' : mode === 'stopwatch' ? 'CHRONOMÈTRE ASCENDANT' : 'SESSION LIBRE'

  return <div className="page-enter">
    <header className="page-header"><div><div className="eyebrow"><span className="eyebrow-line" /> DEEP WORK STUDIO</div><h1>Le studio<span className="accent-text"> focus.</span></h1><p className="page-subtitle">Configurez votre temps. Gardez l’esprit sur une seule chose.</p></div><div className="system-status"><i /> EN LOCAL · PRIVÉ</div></header>
    <div className="timer-layout">
      <section className="panel timer-main">
        <div className="mode-switch" role="tablist" aria-label="Mode du minuteur">{[['countdown', 'Durée libre'], ['stopwatch', 'Chronomètre'], ['deadline', 'Fin à une heure'], ['pomodoro', 'Pomodoro']].map(([id, title]) => <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? 'selected' : ''} onClick={() => changeMode(id)}>{title}</button>)}</div>
        <div className="timer-label"><i />{label}</div>
        <div className="timer-clock"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c2ffe9" /><stop offset="100%" stopColor="#69dfb5" /></linearGradient></defs><circle className="clock-track" cx="50" cy="50" r="46" /><circle className="clock-progress" cx="50" cy="50" r="46" strokeDasharray="289" strokeDashoffset={289 * (1 - progress)} /></svg><div className="clock-center"><div className="clock-digits">{format(remaining)}</div><div className="clock-caption">{mode === 'stopwatch' && running ? 'TEMPS ÉCOULÉ · RESTEZ DANS LE FLOW' : running ? 'RESTEZ DANS LE FLOW' : 'PRÊT QUAND VOUS L’ÊTES'}</div>{taskLabel && <div className="clock-detail">◉ {taskLabel}</div>}{mode === 'deadline' && <div className="clock-detail">Fin prévue à {endText}</div>}{mode === 'pomodoro' && <div className="clock-detail">Cycle {Math.min(phase === 'focus' ? cycles + 1 : cycles, cycleLength)} / {cycleLength}</div>}</div></div>
        <div className="timer-controls"><button className="timer-control-icon" aria-label="Réinitialiser" onClick={reset}>↺</button><button className="button button-primary timer-start" onClick={running ? () => { setRunning(false); setEndsAt(null); setPaused(true) } : start}>{running ? 'Ⅱ  Pause' : paused ? '▶  Reprendre' : '▶  Démarrer'}</button><button className="timer-control-icon" aria-label="Terminer la session" onClick={finishEarly}>■</button></div>
        {error && <div className="toast" role="alert">{error}</div>}
      </section>
      <div className="timer-side">
        <section className="panel timer-config"><h2 className="config-title">Paramètres de session</h2><p className="config-description">Ajustez votre session selon votre énergie et votre journée.</p>
          <label className="field-group"><span className="field-label">Associer à une tâche</span><select className="field-control" value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">Session libre</option>{todos.filter((task) => !task.completed).map((task) => <option key={task.id} value={task.id}>{task.text}</option>)}</select></label>
          {mode === 'countdown' && <><label className="field-group"><span className="field-label">Durée de concentration · minutes</span><input className="field-control" type="number" min="1" max="600" value={duration} onChange={(event) => { const value = Math.max(1, Number(event.target.value) || 1); setDuration(value); if (!running && !paused) { setRemaining(value * 60); setSegmentSeconds(value * 60) } }} /></label><div className="preset-row">{presets.map((value) => <button key={value} className={`preset-chip${duration === value ? ' selected' : ''}`} onClick={() => { setDuration(value); if (!running && !paused) { setRemaining(value * 60); setSegmentSeconds(value * 60) } }}>{value} min</button>)}</div></>}
          {mode === 'stopwatch' && <div className="stopwatch-note"><strong>Le temps part de zéro.</strong><span>Démarrez quand vous voulez et arrêtez la session pour enregistrer le temps écoulé.</span></div>}
          {mode === 'deadline' && <label className="field-group"><span className="field-label">Terminer le travail à</span><input className="field-control" type="datetime-local" value={deadline} onChange={(event) => { setDeadline(event.target.value); if (!running && !paused) { const value = Math.max(0, Math.floor((new Date(event.target.value).getTime() - Date.now()) / 1000)); setRemaining(value); setSegmentSeconds(value) } }} /></label>}
          {mode === 'pomodoro' && <><div className="field-row"><label className="field-group"><span className="field-label">Focus · min</span><input className="field-control" type="number" min="1" max="240" value={focus} onChange={(event) => { const value = Math.max(1, Number(event.target.value) || 1); setFocus(value); if (!running && !paused && phase === 'focus') { setRemaining(value * 60); setSegmentSeconds(value * 60) } }} /></label><label className="field-group"><span className="field-label">Pause courte · min</span><input className="field-control" type="number" min="1" max="60" value={shortBreak} onChange={(event) => setShortBreak(Math.max(1, Number(event.target.value) || 1))} /></label></div><div className="field-row"><label className="field-group"><span className="field-label">Pause longue · min</span><input className="field-control" type="number" min="1" max="120" value={longBreak} onChange={(event) => setLongBreak(Math.max(1, Number(event.target.value) || 1))} /></label><label className="field-group"><span className="field-label">Cycles avant pause longue</span><input className="field-control" type="number" min="2" max="12" value={cycleLength} onChange={(event) => setCycleLength(Math.max(2, Number(event.target.value) || 2))} /></label></div><div className="preset-row">{[25, 50, 100].map((value) => <button key={value} className={`preset-chip${focus === value ? ' selected' : ''}`} onClick={() => { setFocus(value); if (!running && !paused) { setRemaining(value * 60); setSegmentSeconds(value * 60) } }}>{value} min focus</button>)}</div></>}
          <button className="button button-primary button-full" onClick={running ? () => { setRunning(false); setEndsAt(null); setPaused(true) } : start}>{running ? 'Mettre en pause' : paused ? 'Reprendre la session' : 'Appliquer et démarrer'}<span>↗</span></button>
        </section>
        <div className="timer-side-info"><div className="tiny-stat"><span>AUJOURD’HUI</span><strong>{readStore('focusSessions', []).filter((session) => session.date === localDateKey()).length} <small>sessions</small></strong></div><div className="tiny-stat"><span>TON RYTHME</span><strong>{mode === 'pomodoro' ? `${focus}/${shortBreak}` : mode === 'deadline' ? endText : mode === 'stopwatch' ? 'Libre' : `${duration}`} <small>{mode === 'pomodoro' ? 'min' : mode === 'deadline' ? 'fin' : mode === 'stopwatch' ? 'chrono' : 'min'}</small></strong></div></div>
      </div>
    </div>
  </div>
}