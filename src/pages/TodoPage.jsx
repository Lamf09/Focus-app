import { useState, useEffect } from 'react'

export default function TodoPage() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = (e) => {
    e.preventDefault()
    if (newTodo.trim() === '') return
    setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }])
    setNewTodo('')
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">To-Do List</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {todos.filter(t => t.completed).length}/{todos.length} tâches complétées
          </p>
        </header>
        <form onSubmit={addTodo} className="card mb-6">
          <div className="flex gap-3">
            <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Ajouter une tâche..." className="input-field flex-1" />
            <button type="submit" className="btn-primary whitespace-nowrap">Ajouter</button>
          </div>
        </form>
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Aucune tâche. Ajoute-en une !</p>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`card flex items-center gap-4 ${todo.completed ? 'opacity-60 bg-green-50 dark:bg-green-900/20' : ''}`}>
                <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="w-5 h-5 text-blue-600 rounded" />
                <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{todo.text}</span>
                <button onClick={() => deleteTodo(todo.id)} className="text-red-500 hover:text-red-700">🗑️</button>
              </div>
            ))
          )}
        </div>
        {todos.length > 0 && (
          <div className="card mt-6 flex gap-3">
            <button onClick={() => setTodos(todos.map(t => ({ ...t, completed: true })))} className="btn-secondary flex-1">Tout cocher</button>
            <button onClick={() => setTodos(todos.filter(t => !t.completed))} className="btn-secondary flex-1 text-red-500">Supprimer ✓</button>
          </div>
        )}
      </div>
    </div>
  )
}
