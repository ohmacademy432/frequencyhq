import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTasks } from '../contexts/TasksContext'

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks()
  const [draft, setDraft] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    addTask(text)
    setDraft('')
  }

  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return a.createdAt - b.createdAt
  })

  const pending = tasks.filter((t) => !t.completed).length
  const canAdd = draft.trim().length > 0

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Tasks</h2>
        <span className="card-meta">{pending} PENDING</span>
      </div>

      <form className="task-add" onSubmit={onSubmit}>
        <input
          type="text"
          className="task-input"
          placeholder="Add a task..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="New task"
        />
        <button
          type="submit"
          className="task-add-btn"
          disabled={!canAdd}
          aria-label="Add task"
        >
          + Add
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="task-empty">No tasks yet</p>
      ) : (
        <ul className="task-list">
          {sorted.map((task) => (
            <li
              key={task.id}
              className={`task-row${task.completed ? ' is-done' : ''}`}
            >
              <button
                type="button"
                className={`task-check${task.completed ? ' is-done' : ''}`}
                aria-pressed={task.completed}
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                onClick={() => toggleTask(task.id)}
              >
                <span className="task-check-box">
                  {task.completed && (
                    <span className="task-check-mark" aria-hidden="true" />
                  )}
                </span>
              </button>
              <span className={`task-text${task.completed ? ' is-done' : ''}`}>
                {task.text}
              </span>
              <button
                type="button"
                className="task-delete"
                aria-label="Delete task"
                title="Delete task"
                onClick={() => deleteTask(task.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
