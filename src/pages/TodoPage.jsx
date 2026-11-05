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
          <p className="text-gray-600 dark:text-gray-400">{todos.filter(t => t.completed).length}/{todos.length} tâches complétées</p>
        </header>
        <form onSubmit={addTodo} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
          <div className="flex gap-3">
            <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Ajouter une tâche..." className="flex-1 p-2 border rounded" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Ajouter</button>
          </div>
        </form>
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center">
              <p className="text-gray-500 dark:text-gray-400">Aucune tâche. Ajoute-en une !</p>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center gap-4 ${todo.completed ? 'opacity-60' : ''}`}>
                <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="w-5 h-5" />
                <span className={`flex-1 ${todo.completed ? 'line-through' : ''}`}>{todo.text}</span>
                <button onClick={() => deleteTodo(todo.id)} className="text-red-500">🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
