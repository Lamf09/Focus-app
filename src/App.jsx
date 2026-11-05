import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TimerPage from './pages/TimerPage'
import TodoPage from './pages/TodoPage'
import HabitsPage from './pages/HabitsPage'

function App() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) setDarkMode(savedMode === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <nav className="bg-white dark:bg-gray-800 shadow-md fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-around items-center h-16">
              <NavLink to="/" icon="🏠" label="Accueil" />
              <NavLink to="/timer" icon="⏰" label="Minuteur" />
              <NavLink to="/todo" icon="📋" label="To-Do" />
              <NavLink to="/habits" icon="🎯" label="Habitudes" />
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>
        </nav>
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/todo" element={<TodoPage />} />
            <Route path="/habits" element={<HabitsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function NavLink({ to, icon, label }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
}

export default App
