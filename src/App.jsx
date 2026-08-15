import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './context/SessionContext'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Bonus from './pages/Bonus'
import WeeklySummary from './pages/WeeklySummary'
import Settings from './pages/Settings'

function App() {
  const { profile } = useSession()

  if (!profile) {
    return (
      <div className="app-shell">
        <Login />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tarefas" element={<Tasks />} />
        <Route path="/bonus" element={<Bonus />} />
        <Route path="/resumo" element={<WeeklySummary />} />
        <Route path="/definicoes" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default App
