import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const items = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/tarefas', label: 'Tarefas', icon: '✅' },
  { to: '/bonus', label: 'Bónus', icon: '🎁' },
  { to: '/resumo', label: 'Resumo', icon: '🏆' },
  { to: '/definicoes', label: 'Ajustes', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
