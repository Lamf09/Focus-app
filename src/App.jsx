import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TimerPage from './pages/TimerPage'
import TodoPage from './pages/TodoPage'
import HabitsPage from './pages/HabitsPage'

const links = [
  { to: '/', label: 'Vue d’ensemble', icon: '◫', end: true },
  { to: '/timer', label: 'Studio focus', icon: '◉' },
  { to: '/todo', label: 'Tâches', icon: '☷' },
  { to: '/habits', label: 'Habitudes', icon: '✳' },
]

function Shell() {
  const [now, setNow] = useState(new Date())
  const location = useLocation()
  const current = links.find((link) => link.to === location.pathname)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand"><span className="brand-mark">F</span><span>FOCUS<span className="brand-dot">.</span></span></NavLink>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Navigation principale">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}><span className="nav-icon">{link.icon}</span><span>{link.label}</span>{link.to === '/timer' && <span className="nav-live" />}</NavLink>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-card"><span className="signal-orb"/><div><strong>Mode personnel</strong><small>Vos données restent ici</small></div></div>
        <div className="profile-row"><div className="avatar">L</div><div><strong>Mon espace</strong><small>Focus individuel</small></div><span className="profile-more">···</span></div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb"><span>FOCUS OS</span><span className="crumb-slash">/</span><strong>{current?.label || 'Espace'}</strong></div><div className="topbar-right"><span className="system-status"><i /> Système prêt</span><span className="topbar-divider"/><span className="topbar-date">{now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span><div className="avatar avatar-small">L</div></div></header>
        <main className="page-content"><Routes><Route path="/" element={<HomePage />} /><Route path="/timer" element={<TimerPage />} /><Route path="/todo" element={<TodoPage />} /><Route path="/habits" element={<HabitsPage />} /></Routes></main>
        <nav className="mobile-nav" aria-label="Navigation mobile">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}><span>{link.icon}</span><small>{link.label.split(' ')[0]}</small></NavLink>)}</nav>
      </div>
    </div>
  )
}
export default function App() {
  useEffect(() => { document.documentElement.classList.add('dark') }, [])
  return <BrowserRouter><Shell /></BrowserRouter>
}