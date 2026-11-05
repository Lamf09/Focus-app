import { useState, useEffect } from 'react'
export default function HabitsPage() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits')
    return saved ? JSON.parse(saved) : []
  })
  const [newHabit, setNewHabit] = useState({ name: '', group: '', days: [true, true, true, true, true, true, true], time: '' })
  const [showForm, setShowForm] = useState(false)
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])
  const addHabit = (e) => {
    e.preventDefault()
    if (newHabit.name.trim() === '') return
    setHabits([...habits, { ...newHabit, id: Date.now(), completions: {} }])
    setNewHabit({ name: '', group: '', days: [true, true, true, true, true, true, true], time: '' })
    setShowForm(false)
  }
  const toggleHabit = (id) => {
    const today = new Date().toISOString().split('T')[0]
    setHabits(habits.map(habit => {
      if (habit.id !== id) return habit
      const newCompletions = { ...habit.completions }
      if (newCompletions[today]) delete newCompletions[today]
      else newCompletions[today] = true
      return { ...habit, completions: newCompletions }
    }))
  }
  const isCompleted = (habit) => {
    const today = new Date().toISOString().split('T')[0]
    return habit.completions[today] === true
  }
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Habitudes</h1>
          <p className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
        </header>
        <div className="mb-6">
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white w-full py-3 rounded-lg">
            {showForm ? 'Annuler' : '+ Ajouter une habitude'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={addHabit} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Nouvelle habitude</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nom *</label>
                <input type="text" value={newHabit.name} onChange={(e) => setNewHabit({...newHabit, name: e.target.value})} placeholder="Ex: Boire 2L d'eau" className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Groupe</label>
                <input type="text" value={newHabit.group} onChange={(e) => setNewHabit({...newHabit, group: e.target.value})} placeholder="Ex: Santé" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Jours</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day, i) => (
                    <button key={day} type="button" onClick={() => { const d = [...newHabit.days]; d[i] = !d[i]; setNewHabit({...newHabit, days: d}) }} className={`px-3 py-1 rounded-lg text-sm ${newHabit.days[i] ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Heure</label>
                <input type="time" value={newHabit.time} onChange={(e) => setNewHabit({...newHabit, time: e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white w-full mt-4 py-2 rounded">Ajouter</button>
          </form>
        )}
        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center">
              <p className="text-gray-500 dark:text-gray-400">Aucune habitude. Ajoute-en une !</p>
            </div>
          ) : (
            Object.entries(habits.reduce((acc, h) => {
              const group = h.group || 'Sans groupe'
              if (!acc[group]) acc[group] = []
              acc[group].push(h)
              return acc
            }, {})).map(([group, groupHabits]) => (
              <div key={group} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{group}</h3>
                <div className="space-y-2">
                  {groupHabits.map(habit => (
                    <div key={habit.id} className={`flex items-center gap-4 p-2 rounded-lg ${isCompleted(habit) ? 'bg-green-100 dark:bg-green-900/20' : ''}`}>
                      <input type="checkbox" checked={isCompleted(habit)} onChange={() => toggleHabit(habit.id)} className="w-5 h-5" />
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
