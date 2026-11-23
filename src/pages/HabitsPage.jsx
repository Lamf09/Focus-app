import { useEffect, useMemo, useState } from 'react'
import { dateAtNoon, localDateKey, readStore, startOfWeek } from '../lib/storage'

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const weekday = (date) => (date.getDay() + 6) % 7
const todayNoon = () => { const date = new Date(); date.setHours(12, 0, 0, 0); return date }
const blankHabit = () => ({ name: '', group: 'Personnel', time: '', schedule: { type: 'days', days: [true, true, true, true, true, true, true], target: 3, everyDays: 2, startDate: localDateKey() } })
const normalizeHabit = (habit) => ({ ...habit, schedule: habit.schedule || { type: 'days', days: habit.days || [true, true, true, true, true, true, true], target: 3, everyDays: 2, startDate: localDateKey() }, completions: habit.completions || {}, archived: Boolean(habit.archived) })
const getHabits = () => readStore('habits', []).map(normalizeHabit)

function isScheduled(habit, date) {
  const schedule = habit.schedule
  if (schedule.type === 'weekly') return true
  if (schedule.type === 'interval') {
    const start = dateAtNoon(schedule.startDate || localDateKey())
    const diff = Math.round((dateAtNoon(localDateKey(date)) - start) / 86400000)
    return diff >= 0 && diff % Math.max(1, Number(schedule.everyDays) || 2) === 0
  }
  return Boolean(schedule.days?.[weekday(date)])
}

function dayStreak(habit, today) {
  if (habit.schedule.type === 'weekly') {
    let streak = 0
    let week = startOfWeek(today)
    const completedThisWeek = weekKeys(week).filter((key) => habit.completions[key]).length
    if (completedThisWeek < habit.schedule.target) week.setDate(week.getDate() - 7)
    for (let i = 0; i < 104; i += 1) {
      const total = weekKeys(week).filter((key) => habit.completions[key]).length
      if (total < habit.schedule.target) break
      streak += 1
      week.setDate(week.getDate() - 7)
    }
    return streak
  }
  let cursor = new Date(today)
  if (!habit.completions[localDateKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  for (let i = 0; i < 366; i += 1) {
    if (isScheduled(habit, cursor)) {
      if (habit.completions[localDateKey(cursor)]) streak += 1
      else break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function weekKeys(start) { return Array.from({ length: 7 }, (_, index) => localDateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index, 12))) }
function scheduleText(habit) {
  const schedule = habit.schedule
  if (schedule.type === 'weekly') return `${schedule.target} fois par semaine`
  if (schedule.type === 'interval') return `Tous les ${schedule.everyDays} jours`
  return `${schedule.days.filter(Boolean).length} jours par semaine`
}

export default function HabitsPage() {
  const [habits, setHabits] = useState(getHabits)
  const [form, setForm] = useState(blankHabit)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const today = useMemo(todayNoon, [])
  const todayKey = localDateKey(today)
  const weekStart = useMemo(() => startOfWeek(today), [today])
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i, 12)), [weekStart])
  useEffect(() => { localStorage.setItem('habits', JSON.stringify(habits)) }, [habits])

  const activeHabits = habits.filter((habit) => !habit.archived)
  const visibleHabits = habits.filter((habit) => habit.archived === showArchived)
  const doneToday = activeHabits.filter((habit) => habit.completions[todayKey]).length
  const weeklyTotals = activeHabits.reduce((totals, habit) => {
    const completed = week.filter((date) => habit.completions[localDateKey(date)]).length
    const scheduled = habit.schedule.type === 'weekly'
      ? habit.schedule.target
      : week.filter((date) => date <= today && isScheduled(habit, date)).length
    totals.done += Math.min(completed, scheduled)
    totals.planned += scheduled
    return totals
  }, { done: 0, planned: 0 })
  const rate = weeklyTotals.planned ? Math.round(weeklyTotals.done / weeklyTotals.planned * 100) : 0
  const bestStreak = activeHabits.reduce((max, habit) => Math.max(max, dayStreak(habit, today)), 0)
  const weeklyDays = week.map((date) => {
    const expected = activeHabits.filter((habit) => date <= today && isScheduled(habit, date))
    const completed = expected.filter((habit) => habit.completions[localDateKey(date)]).length
    return { date, expected: expected.length, completed, rate: expected.length ? completed / expected.length : 0 }
  })

  const toggle = (id) => setHabits((current) => current.map((habit) => {
    if (habit.id !== id) return habit
    const completions = { ...habit.completions }
    if (completions[todayKey]) delete completions[todayKey]
    else completions[todayKey] = true
    return { ...habit, completions }
  }))
  const closeForm = () => { setEditingId(null); setForm(blankHabit()); setShowForm(false) }
  const openNew = () => { setEditingId(null); setForm(blankHabit()); setShowForm(true) }
  const edit = (habit) => {
    const schedule = habit.schedule
    setEditingId(habit.id)
    setForm({ name: habit.name, group: habit.group || '', time: habit.time || '', schedule: { type: schedule.type, days: [...(schedule.days || [true, true, true, true, true, true, true])], target: schedule.target || 3, everyDays: schedule.everyDays || 2, startDate: schedule.startDate || todayKey } })
    setShowForm(true)
  }
  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    const schedule = { ...form.schedule, days: [...form.schedule.days] }
    const normalized = { ...form, name: form.name.trim(), group: form.group.trim(), schedule, days: schedule.days }
    setHabits((current) => editingId
      ? current.map((habit) => habit.id === editingId ? { ...habit, ...normalized } : habit)
      : [...current, { ...normalized, id: Date.now(), completions: {}, archived: false }])
    closeForm()
  }
  const archive = (habit) => setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, archived: !item.archived } : item))
  const remove = (habit) => {
    if (!window.confirm(`Supprimer « ${habit.name} » et tout son historique ?`)) return
    setHabits((current) => current.filter((item) => item.id !== habit.id))
    if (editingId === habit.id) closeForm()
  }
  const groups = visibleHabits.reduce((all, habit) => { const group = habit.group?.trim() || 'Personnel'; (all[group] ||= []).push(habit); return all }, {})

  return <div className="page-enter">
    <header className="page-header"><div><div className="eyebrow"><span className="eyebrow-line" /> SYSTÈME DE ROUTINES</div><h1>Les petites choses<span className="accent-text"> s’additionnent.</span></h1><p className="page-subtitle">Votre régularité, rendue visible. Aujourd’hui · {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div><div className="habit-header-actions"><button className="button button-secondary" onClick={() => setShowArchived((value) => !value)}>{showArchived ? 'Voir mes habitudes' : `Archives (${habits.filter((habit) => habit.archived).length})`}</button><button className="button button-primary" onClick={() => showForm ? closeForm() : openNew()}>{showForm ? 'Fermer' : '＋ Nouvelle habitude'}</button></div></header>
    <section className="habit-overview"><article className="panel habit-stat"><span className="stat-label">RÉUSSITE CETTE SEMAINE</span><strong>{rate}<small> %</small></strong><div className="stat-caption">{weeklyTotals.done} habitudes tenues sur {weeklyTotals.planned} prévues</div></article><article className="panel habit-stat"><span className="stat-label">ACCOMPLIES AUJOURD’HUI</span><strong>{doneToday}<small> / {activeHabits.length}</small></strong><div className="stat-caption">Chaque coche est un pas en avant</div></article><article className="panel habit-stat"><span className="stat-label">MEILLEURE SÉRIE ACTIVE</span><strong>{bestStreak}<small> jours</small></strong><div className="stat-caption">La constance se construit un jour à la fois</div></article></section>
    <section className="habit-layout">
      <article className="panel habit-list-panel"><div className="panel-heading"><div><div className="eyebrow">{showArchived ? 'EN PAUSE' : 'VOTRE CHECK-IN'}</div><h2>{showArchived ? 'Habitudes archivées' : 'Routine du jour'}</h2></div><span className="panel-pill">{showArchived ? visibleHabits.length : `${doneToday} / ${activeHabits.length} FAIT${doneToday === 1 ? '' : 'S'}`}</span></div>
        {visibleHabits.length === 0 ? <div className="habit-empty"><strong>{showArchived ? 'Aucune habitude archivée.' : 'Votre prochaine habitude commence ici.'}</strong>{showArchived ? 'Les habitudes archivées pourront être réactivées à tout moment.' : 'Ajoutez une routine et suivez vos progrès jour après jour.'}<br />{!showArchived && <button className="text-link habit-empty-action" onClick={openNew}>Créer ma première habitude ↗</button>}</div> : Object.entries(groups).map(([group, items]) => <div className="habit-group" key={group}><div className="habit-group-title">{group.toUpperCase()} <span>· {items.length}</span></div>{items.map((habit) => {
          const checked = Boolean(habit.completions[todayKey])
          const streak = dayStreak(habit, today)
          return <div className={`habit-row${checked ? ' habit-row-done' : ''}`} key={habit.id}><div className="habit-row-top">{!habit.archived && <button className={`habit-toggle${checked ? ' done' : ''}`} aria-label={`${checked ? 'Annuler' : 'Valider'} ${habit.name}`} onClick={() => toggle(habit.id)}>{checked ? '✓' : ''}</button>}<span className="habit-name">{habit.name}</span>{habit.time && <span className="habit-meta">◷ {habit.time}</span>}{streak > 0 && !habit.archived && <span className="habit-streak">↗ {streak} j</span>}<div className="habit-actions">{!habit.archived && <button type="button" className="habit-action" aria-label={`Modifier ${habit.name}`} title="Modifier" onClick={() => edit(habit)}>✎</button>}<button type="button" className="habit-action" aria-label={habit.archived ? `Réactiver ${habit.name}` : `Archiver ${habit.name}`} title={habit.archived ? 'Réactiver' : 'Archiver'} onClick={() => archive(habit)}>{habit.archived ? '↺' : '⌑'}</button><button type="button" className="habit-action delete" aria-label={`Supprimer ${habit.name}`} title="Supprimer" onClick={() => remove(habit)}>×</button></div></div><div className="week-dots" aria-label="Progression de la semaine">{week.map((date, index) => { const complete = Boolean(habit.completions[localDateKey(date)]); const scheduled = isScheduled(habit, date); return <span key={index} className={`week-dot${complete ? ' is-done' : ''}${localDateKey(date) === todayKey ? ' is-today' : ''}${!scheduled ? ' is-inactive' : ''}`} title={`${days[index]}${complete ? ' · accomplie' : scheduled ? ' · prévue' : ' · repos'}`}>{complete ? '✓' : days[index].slice(0, 1)}</span> })}</div><div className="week-caption"><span>{scheduleText(habit)}{habit.time ? ` · ${habit.time}` : ''}</span><span>{habit.schedule.type === 'weekly' ? `${habit.schedule.target} objectifs` : 'Semaine'}</span></div></div>
        })}</div>)}</article>
      <article className="panel habit-analytics"><div className="panel-heading"><div><div className="eyebrow">VUE HEBDOMADAIRE</div><h2>Votre rythme</h2></div><span className="panel-pill">CETTE SEMAINE</span></div><div className="week-rate"><div className="rate-ring" style={{ '--rate': `${rate * 3.6}deg` }}><strong>{rate}%</strong></div><div className="rate-copy"><strong>{rate >= 80 ? 'Belle régularité' : rate > 0 ? 'Le rythme se construit' : 'À votre rythme'}</strong><span>{weeklyTotals.done} validations<br />sur {weeklyTotals.planned} occasions</span></div></div><div className="week-strip">{weeklyDays.map((day, index) => <div className="week-day" key={index}><b className={`${day.expected && day.rate >= .8 ? 'is-good' : ''}${localDateKey(day.date) === todayKey ? ' is-today' : ''}`} title={`${day.completed}/${day.expected} habitudes`}>{day.expected ? `${Math.round(day.rate * 100)}%` : '—'}</b><span>{days[index]}</span></div>)}</div><div className="chart-legend habit-legend"><span><i /> Objectif du jour atteint</span><span>Calculé selon vos rythmes</span></div></article>
    </section>
    {showForm && <section className="panel habit-add-panel page-enter"><div className="panel-heading"><div><div className="eyebrow">{editingId ? 'MODIFIER LE REPÈRE' : 'NOUVEAU REPÈRE'}</div><h2>{editingId ? 'Modifier l’habitude' : 'Créer une habitude'}</h2></div></div><form className="habit-form habit-form-expanded" onSubmit={submit}><label className="field-group"><span className="field-label">Nom de l’habitude</span><input autoFocus className="field-control" placeholder="Ex. Lire 20 minutes" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={60} /></label><label className="field-group"><span className="field-label">Catégorie</span><input className="field-control" placeholder="Ex. Bien-être" value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })} maxLength={30} /></label><label className="field-group"><span className="field-label">Rappel indicatif</span><input className="field-control" type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label><label className="field-group"><span className="field-label">Rythme</span><select className="field-control" value={form.schedule.type} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, type: event.target.value, startDate: todayKey } })}><option value="days">Jours de la semaine</option><option value="weekly">Objectif par semaine</option><option value="interval">Tous les X jours</option></select></label>{form.schedule.type === 'days' && <div className="days-selector"><span className="field-label">Jours prévus</span><div>{days.map((day, index) => <button type="button" key={day} aria-pressed={form.schedule.days[index]} className={`day-toggle${form.schedule.days[index] ? ' selected' : ''}`} onClick={() => setForm({ ...form, schedule: { ...form.schedule, days: form.schedule.days.map((value, position) => index === position ? !value : value) } })}>{day}</button>)}</div></div>}{form.schedule.type === 'weekly' && <label className="field-group"><span className="field-label">Objectif · fois par semaine</span><input className="field-control" type="number" min="1" max="7" value={form.schedule.target} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, target: Math.max(1, Math.min(7, Number(event.target.value) || 1)) } })} /></label>}{form.schedule.type === 'interval' && <label className="field-group"><span className="field-label">Fréquence · jours</span><input className="field-control" type="number" min="2" max="90" value={form.schedule.everyDays} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, everyDays: Math.max(2, Math.min(90, Number(event.target.value) || 2)) } })} /></label>}<div className="habit-form-actions"><button className="button button-secondary" type="button" onClick={closeForm}>Annuler</button><button className="button button-primary" type="submit">{editingId ? 'Enregistrer' : 'Ajouter à ma routine'} <span>↗</span></button></div></form></section>}
  </div>
}