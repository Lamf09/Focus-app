import { useState, useEffect } from 'react'

export default function HabitsPage() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits')
    return saved ? JSON.parse(saved) : []
  })
  const [newHabit, setNewHabit] = useState({ name: '', group: '', days: [true, true, true, true, true, true, true], time: '' })
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const addHabit = (e) => {
    e.preventDefault()
    if (newHabit.name.trim() === '') return
    setHabits([...habits, { ...newHabit, id: Date.now(), completions: {} }])
    setNewHabit({ name: '', group: '', days: [true, true, true, true, true, true, true], time: '' })
    setShowForm(false)
  }

  const toggleHabit = (id) => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    setHabits(habits.map(habit => {
      if (habit.id !== id) return habit
      const newCompletions = { ...habit.completions }
      if (newCompletions[dateStr]) delete newCompletions[dateStr]
      else newCompletions[dateStr] = true
      return { ...habit, completions: newCompletions }
    }))
  }

  const isDueToday = (habit) => {
    const dayIndex = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1
    return habit.days[dayIndex]
  }

  const isCompleted = (habit) => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    return habit.completions[dateStr] === true
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Habitudes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
        <div className="mb-6">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full py-3 text-lg">
            {showForm ? 'Annuler' : '+ Ajouter une habitude'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={addHabit} className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Nouvelle habitude</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom *</label>
                <input type="text" value={newHabit.name} onChange={(e) => setNewHabit({...newHabit, name: e.target.value})} placeholder="Ex: Boire 2L d'eau" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Groupe</label>
                <input type="text" value={newHabit.group} onChange={(e) => setNewHabit({...newHabit, group: e.target.value})} placeholder="Ex: Santé" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jours de la semaine</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day, i) => (
                    <button key={day} type="button" onClick={() => { const d = [...newHabit.days]; d[i] = !d[i]; setNewHabit({...newHabit, days: d}) }} className={`px-3 py-1 rounded-lg text-sm ${newHabit.days[i] ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Heure (optionnel)</label>
                <input type="time" value={newHabit.time} onChange={(e) => setNewHabit({...newHabit, time: e.target.value})} className="input-field" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-4">Ajouter</button>
          </form>
        )}
        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Aucune habitude. Ajoute-en une !</p>
            </div>
          ) : (
            Object.entries(habits.reduce((acc, h) => {
              const group = h.group || 'Sans groupe'
              if (!acc[group]) acc[group] = []
              acc[group].push(h)
              return acc
            }, {})).map(([group, groupHabits]) => (
              <div key={group} className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{group}</h3>
                <div className="space-y-2">
                  {groupHabits.map(habit => (
                    <div key={habit.id} className={`flex items-center gap-4 p-2 rounded-lg ${isCompleted(habit) ? 'bg-green-50 dark:bg-green-900/20' : isDueToday(habit) ? 'bg-blue-50 dark:bg-blue-900/20' : 'opacity-50'}`}>
                      <input type="checkbox" checked={isCompleted(habit)} onChange={() => isDueToday(habit) && toggleHabit(habit.id)} className="w-5 h-5" />
                      <span className={`flex-1 ${isCompleted(habit) ? 'line-through' : ''}`}>{habit.name}{habit.time && ` (${habit.time})`}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
