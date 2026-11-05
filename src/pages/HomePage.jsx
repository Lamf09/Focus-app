import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Focus App</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gère ton temps, tes tâches et tes habitudes en un seul endroit.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard to="/timer" title="Minuteur Pomodoro" description="Configure ton temps de focus et de pause." icon="⏰" />
          <FeatureCard to="/todo" title="To-Do List" description="Ajoute et organise tes tâches." icon="📋" />
          <FeatureCard to="/habits" title="Habitudes" description="Suis tes habitudes quotidiennes." icon="🎯" />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ to, title, description, icon }) {
  return (
    <Link to={to} className="card bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </Link>
  )
}
