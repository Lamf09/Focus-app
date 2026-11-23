import { useMemo, useState } from 'react'
import { dateAtNoon, localDateKey, readStore, startOfWeek } from '../lib/storage'

const shift = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next }
const weekday = (date) => (date.getDay() + 6) % 7

function isScheduled(habit, date) {
  const schedule = habit.schedule || { type: 'days', days: habit.days || [true, true, true, true, true, true, true] }
  if (schedule.type === 'weekly') return false
  if (schedule.type === 'interval') {
    const start = dateAtNoon(schedule.startDate || localDateKey())
    const days = Math.round((dateAtNoon(localDateKey(date)) - start) / 86400000)
    return days >= 0 && days % Math.max(1, schedule.everyDays || 2) === 0
  }
  return Boolean(schedule.days?.[weekday(date)])
}

export default function InsightsPage() {
  const [range, setRange] = useState('week')
  const sessions = useMemo(() => readStore('focusSessions', []), [])
  const tasks = useMemo(() => readStore('todos', []), [])
  const habits = useMemo(() => readStore('habits', []).filter((habit) => !habit.archived), [])
  const today = new Date()
  const start = range === 'week' ? startOfWeek(today) : range === 'month' ? new Date(today.getFullYear(), today.getMonth(), 1, 12) : new Date(today.getFullYear(), 0, 1, 12)
  const end = range === 'week' ? shift(start, 7) : range === 'month' ? new Date(today.getFullYear(), today.getMonth() + 1, 1, 12) : new Date(today.getFullYear() + 1, 0, 1, 12)
  const dates = Array.from({ length: Math.max(0, Math.round((end - start) / 86400000)) }, (_, index) => shift(start, index))
  const inRange = (key) => { const date = new Date(`${key}T12:00:00`); return date >= start && date < end }
  const focusSessions = sessions.filter((session) => inRange(session.date))
  const focusMinutes = focusSessions.reduce((sum, session) => sum + (session.minutes || 0), 0)
  const doneTasks = tasks.filter((task) => task.completedAt && new Date(task.completedAt) >= start && new Date(task.completedAt) < end).length
  const habitCompletions = habits.reduce((sum, habit) => sum + Object.keys(habit.completions || {}).filter(inRange).length, 0)
  const scheduledCount = habits.reduce((sum, habit) => {
    if ((habit.schedule?.type || 'days') === 'weekly') return sum + (habit.schedule?.target || 3) * Math.max(1, Math.ceil(dates.length / 7))
    return sum + dates.filter((date) => isScheduled(habit, date)).length
  }, 0)
  const missedHabits = Math.max(0, scheduledCount - habitCompletions)
  const habitRate = scheduledCount ? Math.min(100, Math.round(habitCompletions / scheduledCount * 100)) : null
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: focusSessions.filter((session) => session.startHour === hour).length }))
  const bestHour = byHour.reduce((best, item) => item.count > best.count ? item : best, { hour: null, count: 0 })
  let chart = []
  if (range === 'week') chart = dates.map((date) => ({ label: date.toLocaleDateString('fr-FR', { weekday: 'short' }), value: focusSessions.filter((session) => session.date === localDateKey(date)).reduce((sum, session) => sum + (session.minutes || 0), 0) }))
  else if (range === 'month') chart = dates.map((date) => ({ label: String(date.getDate()), value: sessions.filter((session) => session.date === localDateKey(date)).reduce((sum, session) => sum + (session.minutes || 0), 0) }))
  else chart = Array.from({ length: 12 }, (_, month) => ({ label: new Date(today.getFullYear(), month, 1).toLocaleDateString('fr-FR', { month: 'short' }), value: sessions.filter((session) => { const date = new Date(`${session.date}T12:00:00`); return date.getFullYear() === today.getFullYear() && date.getMonth() === month }).reduce((sum, session) => sum + (session.minutes || 0), 0) }))
  const max = Math.max(1, ...chart.map((item) => item.value))
  const recent = Array.from({ length: 84 }, (_, index) => { const date = shift(today, -83 + index); const key = localDateKey(date); return { key, done: habits.filter((habit) => habit.completions?.[key]).length, sessions: sessions.filter((session) => session.date === key).length } })

  return <div className="page-enter">
    <header className="page-header"><div><div className="eyebrow"><span className="eyebrow-line" /> PERFORMANCE PERSONNELLE</div><h1>Progrès, pas pression<span className="accent-text">.</span></h1><p className="page-subtitle">Des indicateurs utiles pour comprendre votre rythme, sans score artificiel.</p></div><div className="range-switch">{[['week', 'Semaine'], ['month', 'Mois'], ['year', 'Année']].map(([key, label]) => <button key={key} className={range === key ? 'selected' : ''} onClick={() => setRange(key)}>{label}</button>)}</div></header>
    <section className="metric-grid insight-metrics">
      <article className="metric-card metric-featured"><div className="metric-top"><span className="metric-label">TEMPS DE FOCUS</span><span className="metric-icon">◉</span></div><div className="metric-value">{Math.floor(focusMinutes / 60)}<span>h</span> {String(focusMinutes % 60).padStart(2, '0')}<span>m</span></div><div className="metric-foot"><span>{focusSessions.length} sessions terminées</span><span className="metric-note">Période sélectionnée</span></div></article>
      <article className="metric-card"><div className="metric-top"><span className="metric-label">HABITUDES RÉUSSIES</span><span className="metric-icon mint">✳</span></div><div className="metric-value">{habitCompletions}</div><div className="metric-foot"><span>{habitRate === null ? 'Aucun objectif planifié' : `${habitRate}% des objectifs`}</span></div></article>
      <article className="metric-card"><div className="metric-top"><span className="metric-label">OBJECTIFS MANQUÉS</span><span className="metric-icon violet">↗</span></div><div className="metric-value">{missedHabits}</div><div className="metric-foot"><span>Habitudes non validées sur la période</span></div></article>
      <article className="metric-card"><div className="metric-top"><span className="metric-label">TÂCHES TERMINÉES</span><span className="metric-icon violet">✓</span></div><div className="metric-value">{doneTasks}</div><div className="metric-foot"><span>Dans la période sélectionnée</span></div></article>
    </section>
    <section className="insights-grid">
      <article className="panel insights-chart"><div className="panel-heading"><div><div className="eyebrow">HISTORIQUE</div><h2>Temps de concentration</h2></div><span className="panel-pill">{range === 'week' ? 'PAR JOUR' : range === 'month' ? 'PAR JOUR' : 'PAR MOIS'}</span></div><div className={`insight-bars${range === 'month' ? ' dense' : ''}`}>{chart.map((item, index) => <div className="insight-bar-col" key={`${item.label}-${index}`} title={`${item.label}: ${item.value} min`}><div className="insight-bar-track"><i style={{ height: `${item.value ? Math.max(5, item.value / max * 100) : 2}%` }} /></div><span>{item.label}</span></div>)}</div><div className="chart-legend"><span><i /> Minutes de focus</span><span>Seules les sessions terminées sont comptées</span></div></article>
      <article className="panel best-hour-card"><div className="eyebrow">VOTRE FENÊTRE DE FLOW</div><h2>Votre meilleur créneau</h2>{bestHour.count ? <><div className="best-hour-value">{String(bestHour.hour).padStart(2, '0')}<span>h–{String((bestHour.hour + 1) % 24).padStart(2, '0')}h</span></div><p>Sur {focusSessions.length} sessions observées dans la période.</p></> : <div className="habit-empty">Les créneaux se révéleront à mesure que vous enregistrerez des sessions.</div>}</article>
      <article className="panel heatmap-panel"><div className="panel-heading"><div><div className="eyebrow">RÉGULARITÉ</div><h2>Vos 12 dernières semaines</h2></div><span className="panel-pill">HABITUDES + FOCUS</span></div><div className="heatmap-grid">{recent.map((day) => { const intensity = Math.min(4, day.done + day.sessions); return <span key={day.key} className={`heatmap-cell intensity-${intensity}`} title={`${day.key} · ${day.done} habitudes · ${day.sessions} sessions`} /> })}</div><div className="chart-legend"><span>Moins <i className="heat-legend" /> Plus</span><span>Un jour léger reste un jour de progrès.</span></div></article>
      <article className="panel focus-hour-panel"><div className="eyebrow">RÉPARTITION DE LA JOURNÉE</div><h2>Quand le focus arrive</h2><div className="hour-bars">{[6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => { const count = byHour.filter((item) => item.hour >= hour && item.hour < hour + 2).reduce((sum, item) => sum + item.count, 0); const top = Math.max(1, ...byHour.map((item) => item.count)); return <div key={hour} title={`${hour}–${hour + 2} h`}><i style={{ height: `${count ? Math.max(8, count / top * 100) : 3}%` }} /><span>{String(hour).padStart(2, '0')}h</span></div> })}</div></article>
    </section>
  </div>
}
