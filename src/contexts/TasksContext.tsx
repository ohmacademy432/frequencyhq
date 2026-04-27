import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'fhq_tasks'

export type Task = {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

type TasksContextValue = {
  tasks: Task[]
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
}

const TasksContext = createContext<TasksContextValue | null>(null)

function readTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is Task =>
        t &&
        typeof t.id === 'string' &&
        typeof t.text === 'string' &&
        typeof t.completed === 'boolean' &&
        typeof t.createdAt === 'number',
    )
  } catch {
    return []
  }
}

function persist(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // ignore quota errors
  }
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(readTasks)

  const addTask = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTasks((prev) => {
      const next: Task[] = [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: trimmed,
          completed: false,
          createdAt: Date.now(),
        },
      ]
      persist(next)
      return next
    })
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      )
      persist(next)
      return next
    })
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id)
      persist(next)
      return next
    })
  }, [])

  const value: TasksContextValue = { tasks, addTask, toggleTask, deleteTask }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) {
    throw new Error('useTasks must be used inside a TasksProvider')
  }
  return ctx
}
