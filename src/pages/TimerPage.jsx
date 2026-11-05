import { useState, useEffect, useRef } from 'react'

export default function TimerPage() {
  const [time, setTime] = useState(1500)
  const [isRunning, setIsRunning] = useState(false)
  const [focusTime, setFocusTime] = useState(25)
  const [breakTime, setBreakTime] = useState(5)
  const timerRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('pomodoroSettings')
    if (saved) {
      const { focus, break: bt } = JSON.parse(saved)
      setFocusTime(focus)
      setBreakTime(bt)
      setTime(focus * 60)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify({ focus: focusTime, break: breakTime }))
  }, [focusTime, breakTime])

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setIsRunning(false)
            return breakTime * 60
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning, breakTime])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Minuteur Pomodoro</h1>
        </header>
        <div className="card text-center mb-8">
          <div className="text-8xl font-mono text-gray-900 dark:text-white mb-6">{formatTime(time)}</div>
          <div className="flex justify-center gap-4 mb-6">
            {!isRunning ? (
              <button onClick={() => setIsRunning(true)} className="btn-primary px-8 py-3 text-lg">Démarrer</button>
            ) : (
              <button onClick={() => setIsRunning(false)} className="btn-secondary px-8 py-3 text-lg">Pause</button>
            )}
            <button onClick={() => { clearInterval(timerRef.current); setIsRunning(false); setTime(focusTime * 60) }} className="btn-secondary px-8 py-3 text-lg">Réinitialiser</button>
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Paramètres</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Focus (min)</label>
              <input type="number" value={focusTime} onChange={(e) => { setFocusTime(Math.max(1, parseInt(e.target.value) || 1)); setTime(focusTime * 60) }} min="1" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pause (min)</label>
              <input type="number" value={breakTime} onChange={(e) => setBreakTime(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="input-field" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
