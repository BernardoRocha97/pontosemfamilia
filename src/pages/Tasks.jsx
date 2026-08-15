import { useEffect, useState } from 'react'
import { listTasks, listProfiles, addEntry, createTask, subscribe } from '../lib/db'
import { useSession } from '../context/SessionContext'
import TaskCard from '../components/TaskCard'
import AssignPointsModal from '../components/AssignPointsModal'
import TaskFormModal from '../components/TaskFormModal'
import './Tasks.css'

export default function Tasks() {
  const { profile } = useSession()
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [assigning, setAssigning] = useState(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState(null)

  async function refresh() {
    const [t, p] = await Promise.all([listTasks(), listProfiles()])
    setTasks(t)
    setProfiles(p)
  }

  useEffect(() => {
    refresh()
    const unsubscribe = subscribe(refresh)
    return unsubscribe
  }, [])

  const positives = tasks.filter((t) => t.points >= 0)
  const negatives = tasks.filter((t) => t.points < 0)

  async function handleAssign(profileId) {
    const task = assigning
    const targetProfile = profiles.find((p) => p.id === profileId)
    await addEntry({
      taskId: task.id,
      profileId,
      points: task.points,
      taskName: task.name,
      taskIcon: task.icon,
      profileName: targetProfile?.name,
      profileColor: targetProfile?.color,
    })
    setToast(`${task.icon} ${targetProfile?.name} ganhou ${task.points >= 0 ? '+' : ''}${task.points} pts`)
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="app-main">
      <h1 className="page-title">Tarefas</h1>
      <p className="page-subtitle">Toca numa tarefa para atribuir os pontos</p>

      {toast && <div className="toast">{toast}</div>}

      {positives.length > 0 && (
        <>
          <h3 className="section-label">Tarefas de casa</h3>
          <div className="task-grid">
            {positives.map((t) => (
              <TaskCard key={t.id} task={t} onClick={setAssigning} />
            ))}
          </div>
        </>
      )}

      {negatives.length > 0 && (
        <>
          <h3 className="section-label">Coisas negativas</h3>
          <div className="task-grid">
            {negatives.map((t) => (
              <TaskCard key={t.id} task={t} onClick={setAssigning} />
            ))}
          </div>
        </>
      )}

      <button className="btn btn-ghost btn-block add-task-btn" onClick={() => setCreating(true)}>
        + Nova tarefa
      </button>

      {assigning && (
        <AssignPointsModal
          task={assigning}
          profiles={profiles}
          defaultProfileId={profile?.id}
          onConfirm={handleAssign}
          onClose={() => setAssigning(null)}
        />
      )}

      {creating && (
        <TaskFormModal
          onSave={(data) => createTask(data)}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  )
}
