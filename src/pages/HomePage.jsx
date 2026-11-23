import { Link } from 'react-router-dom'

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const week = [0,1,2,3,4,5,6].map((offset) => { const date = new Date(); date.setDate(date.getDate()-((date.getDay()+6)%7)+offset); return date })

export default function HomePage() {
  const habits = read('habits', [])
  const todos = read('todos', [])
  const sessions = read('focusSessions', [])
  const today = todayKey()
  const todaySessions = sessions.filter((s) => s.date === today)
  const minutes = todaySessions.reduce((sum, s) => sum + (s.minutes || 0), 0)
  const doneHabits = habits.filter((h) => h.completions?.[today]).length
  const pending = todos.filter((t) => !t.completed)
  const completedTasks = todos.filter((t) => t.completed).length
  const dayProgress = week.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    return { day: date.toLocaleDateString('fr-FR', { weekday: 'narrow' }), value: sessions.filter((s) => s.date === key).reduce((sum, s) => sum + (s.minutes || 0), 0), today: key === today }
  })
  const max = Math.max(...dayProgress.map((d) => d.value), 60)
  return <div className="dashboard page-enter">
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> {new Date().toLocaleDateString('fr-FR',{weekday:'long'}).toUpperCase()} · MODE CONCENTRATION</div><h1>Reprenez le fil<span className="accent-text">.</span></h1><p className="page-subtitle">Un espace clair. Une intention à la fois.</p></div><Link className="button button-primary" to="/timer"><span className="button-glyph">▶</span> Lancer une session</Link></section>
    <section className="metric-grid">
      <article className="metric-card metric-featured"><div className="metric-top"><span className="metric-label">FOCUS AUJOURD’HUI</span><span className="metric-icon">◉</span></div><div className="metric-value">{Math.floor(minutes/60)}<span>h</span> {String(minutes%60).padStart(2,'0')}<span>m</span></div><div className="metric-foot"><span>{todaySessions.length} session{todaySessions.length===1?'':'s'}</span><span className="metric-note">Votre temps, votre rythme</span></div><div className="metric-glow"/></article>
      <article className="metric-card"><div className="metric-top"><span className="metric-label">HABITUDES DU JOUR</span><span className="metric-icon mint">✳</span></div><div className="metric-value">{doneHabits}<span className="metric-total"> / {habits.length}</span></div><div className="metric-progress"><i style={{width: `${habits.length ? doneHabits/habits.length*100 : 0}%`}}/></div><div className="metric-foot"><span>{habits.length ? `${Math.round(doneHabits/habits.length*100)} % accompli` : 'Créez votre première routine'}</span><Link to="/habits">Voir les habitudes ↗</Link></div></article>
      <article className="metric-card"><div className="metric-top"><span className="metric-label">TÂCHES TERMINÉES</span><span className="metric-icon violet">✓</span></div><div className="metric-value">{completedTasks}<span className="metric-total"> / {todos.length}</span></div><div className="metric-foot"><span>{pending.length ? `${pending.length} à poursuivre` : 'Votre espace est à jour'}</span><Link to="/todo">Voir les tâches ↗</Link></div></article>
    </section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">RYTHME PERSONNEL</div><h2>Votre semaine</h2></div><span className="panel-pill">TEMPS DE FOCUS</span></div><div className="chart-summary"><strong>{dayProgress.reduce((s,d)=>s+d.value,0)}<small> min</small></strong><span>cette semaine</span></div><div className="bar-chart">{dayProgress.map((d,i)=><div className={`bar-column${d.today?' current':''}`} key={i}><div className="bar-track"><i style={{height:`${Math.max(d.value/max*100,d.value?8:3)}%`}} title={`${d.value} min`}/></div><span>{d.day}</span></div>)}</div><div className="chart-legend"><span><i/> Minutes enregistrées</span><span>Les sessions terminées apparaîtront ici</span></div></article>
      <article className="panel session-panel"><div className="panel-heading"><div><div className="eyebrow">ESPACE DE TRAVAIL</div><h2>Prêt à entrer en flow ?</h2></div><span className="status-dot"/></div><div className="mini-timer"><div className="mini-ring"><span>25<small>MIN</small></span></div><div className="mini-timer-copy"><strong>Session personnalisée</strong><span>Définissez votre propre rythme</span></div></div><Link className="button button-primary button-full" to="/timer">Ouvrir le studio focus <span>↗</span></Link><div className="panel-footnote">◌ &nbsp; Minuteur · Fin à une heure · Pomodoro</div></article>
      <article className="panel tasks-panel"><div className="panel-heading"><div><div className="eyebrow">PROCHAINES ACTIONS</div><h2>À garder en tête</h2></div><Link to="/todo" className="text-link">Tout voir ↗</Link></div>{pending.length ? <div className="task-preview-list">{pending.slice(0,3).map((task)=><div className="task-preview" key={task.id}><span className="task-check"/><span>{task.text}</span><span className="task-arrow">↗</span></div>)}</div> : <div className="empty-inline"><span>✳</span><p>Aucune tâche en attente.<br/><Link to="/todo">Ajoutez-en une pour démarrer →</Link></p></div>}</article>
      <article className="panel insight-panel"><div className="insight-icon">✳</div><div><div className="eyebrow">VOTRE ESPACE, VOTRE DONNÉE</div><h2>La constance bat l’intensité.</h2><p>Construisez un rythme durable, une session et une habitude à la fois.</p><Link to="/habits" className="text-link">Voir mes routines ↗</Link></div></article>
    </section>
  </div>
}