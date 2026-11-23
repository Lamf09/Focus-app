import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { localDateKey, readStore, writeStore } from '../lib/storage'

const blank = () => ({ text: '', dueDate: '', priority: 'medium', repeat: 'none', notes: '' })
const loadTasks = () => readStore('todos', []).map((task, index) => ({ priority: task.priority || 'medium', repeat: task.repeat || 'none', order: task.order ?? index, ...task }))
const nextDueDate = (date, repeat) => {
  if (!date || repeat === 'none') return ''
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + (repeat === 'daily' ? 1 : 7))
  return localDateKey(next)
}
const priorityLabels = { high: 'Prioritaire', medium: 'Normale', low: 'Quand possible' }

export default function TodoPage() {
  const [todos, setTodos] = useState(loadTasks)
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('open')
  const [deleted, setDeleted] = useState(null)
  const complete = todos.filter((task) => task.completed).length
  const tasks = useMemo(() => {
    const filtered = todos.filter((task) => filter === 'open' ? !task.completed : filter === 'completed' ? task.completed : filter === 'today' ? !task.completed && task.dueDate === localDateKey() : !task.completed && task.dueDate && task.dueDate > localDateKey())
    return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [todos, filter])
  useEffect(() => { writeStore('todos', todos) }, [todos])

  const openNew = () => { setEditingId(null); setForm(blank()); setShowForm(true) }
  const closeForm = () => { setEditingId(null); setForm(blank()); setShowForm(false) }
  const edit = (task) => { setEditingId(task.id); setForm({ text: task.text, dueDate: task.dueDate || '', priority: task.priority || 'medium', repeat: task.repeat || 'none', notes: task.notes || '' }); setShowForm(true) }
  const submit = (event) => {
    event.preventDefault()
    if (!form.text.trim()) return
    setTodos((current) => editingId
      ? current.map((task) => task.id === editingId ? { ...task, ...form, text: form.text.trim() } : task)
      : [...current, { ...form, text: form.text.trim(), id: Date.now(), completed: false, order: current.length }])
    closeForm()
  }
  const toggle = (task) => setTodos((current) => current.map((item) => {
    if (item.id !== task.id) return item
    const completed = !item.completed
    return { ...item, completed, completedAt: completed ? new Date().toISOString() : null }
  }).concat(!task.completed && task.repeat !== 'none' ? [{ ...task, id: Date.now(), dueDate: nextDueDate(task.dueDate || localDateKey(), task.repeat), completed: false, completedAt: null, order: current.length }] : []))
  const remove = (task) => { setDeleted(task); setTodos((current) => current.filter((item) => item.id !== task.id)) }
  const undoDelete = () => { if (!deleted) return; setTodos((current) => [...current, deleted]); setDeleted(null) }
  const move = (task, direction) => setTodos((current) => {
    const ordered = [...current].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const index = ordered.findIndex((item) => item.id === task.id)
    const next = index + direction
    if (next < 0 || next >= ordered.length) return current
    ;[ordered[index], ordered[next]] = [ordered[next], ordered[index]]
    return ordered.map((item, position) => ({ ...item, order: position }))
  })
  const dateLabel = (date) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Sans échéance'
  const filterOptions = [['open', 'À faire'], ['today', 'Aujourd’hui'], ['upcoming', 'À venir'], ['completed', 'Terminées']]

  return <div className="page-enter">
    <header className="page-header"><div><div className="eyebrow"><span className="eyebrow-line" /> CLARTÉ D’ABORD</div><h1>Une chose à la fois<span className="accent-text">.</span></h1><p className="page-subtitle">Faites de la place pour ce qui compte vraiment.</p></div><button className="button button-primary" onClick={() => showForm ? closeForm() : openNew()}>{showForm ? 'Fermer' : '＋ Nouvelle tâche'}</button></header>
    <section className="panel tasks-workspace">
      <div className="todo-toolbar"><div className="todo-filters">{filterOptions.map(([key, label]) => <button key={key} className={`todo-filter${filter === key ? ' selected' : ''}`} onClick={() => setFilter(key)}>{label}{key === 'open' && <span>{todos.filter((task) => !task.completed).length}</span>}</button>)}</div><div className="todo-summary"><div><div className="stat-label">TERMINÉES</div><strong style={{ fontSize: 13 }}>{complete} / {todos.length}</strong></div><div className="todo-meter"><i style={{ width: `${todos.length ? complete / todos.length * 100 : 0}%` }} /></div></div></div>
      {showForm && <form className="task-form" onSubmit={submit}><div className="task-form-heading"><div><div className="eyebrow">{editingId ? 'MISE À JOUR' : 'CAPTURE RAPIDE'}</div><h2>{editingId ? 'Modifier la tâche' : 'Ajouter une tâche'}</h2></div><button type="button" className="habit-action" onClick={closeForm} aria-label="Fermer">×</button></div><label className="field-group task-title-field"><span className="field-label">Tâche</span><input autoFocus className="field-control" placeholder="Quelle est la prochaine chose à faire ?" value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} maxLength={120} required /></label><label className="field-group"><span className="field-label">Échéance</span><input className="field-control" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label><label className="field-group"><span className="field-label">Priorité</span><select className="field-control" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="high">Prioritaire</option><option value="medium">Normale</option><option value="low">Quand possible</option></select></label><label className="field-group"><span className="field-label">Répétition</span><select className="field-control" value={form.repeat} onChange={(event) => setForm({ ...form, repeat: event.target.value })}><option value="none">Aucune</option><option value="daily">Chaque jour</option><option value="weekly">Chaque semaine</option></select></label><div className="task-form-actions"><button className="button button-secondary" type="button" onClick={closeForm}>Annuler</button><button className="button button-primary" type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</button></div></form>}
      {tasks.length === 0 ? <div className="todo-empty"><strong>{filter === 'completed' ? 'Aucune tâche terminée ici.' : 'Rien à afficher pour ce filtre.'}</strong><button className="text-link" onClick={openNew}>Créer une tâche ↗</button></div> : <div className="todo-list">{tasks.map((task, index) => <article className={`todo-item${task.completed ? ' done' : ''}`} key={task.id}><button className={`todo-check${task.completed ? ' checked' : ''}`} onClick={() => toggle(task)} aria-label={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}>{task.completed ? '✓' : ''}</button><div className="todo-main"><span className="todo-text">{task.text}</span><div className="todo-meta"><span className={`priority-tag priority-${task.priority}`}>{priorityLabels[task.priority] || priorityLabels.medium}</span>{task.dueDate && <span className={`due-tag${task.dueDate < localDateKey() && !task.completed ? ' overdue' : ''}`}>◷ {dateLabel(task.dueDate)}</span>}{task.repeat !== 'none' && <span>↻ {task.repeat === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}</span>}</div></div><div className="todo-actions"><Link className="todo-focus-action" to={`/timer?taskId=${task.id}`} title="Démarrer une session de focus liée à cette tâche">◉</Link><button onClick={() => move(task, -1)} aria-label="Monter la tâche" disabled={index === 0}>↑</button><button onClick={() => move(task, 1)} aria-label="Descendre la tâche" disabled={index === tasks.length - 1}>↓</button><button onClick={() => edit(task)} aria-label={`Modifier ${task.text}`}>✎</button><button className="todo-delete" onClick={() => remove(task)} aria-label={`Supprimer ${task.text}`}>×</button></div></article>)}</div>}
      {deleted && <div className="undo-toast">Tâche supprimée <button onClick={undoDelete}>Annuler</button><button aria-label="Fermer" onClick={() => setDeleted(null)}>×</button></div>}
    </section>
  </div>
}