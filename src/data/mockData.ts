export type Business = 'Ohm Academy' | 'Timeless RN' | 'Frequency Lab' | 'Personal' | 'Billing'

export type StatCard = {
  label: string
  count: number
}

export type Appointment = {
  id: string
  time: string
  title: string
  contact: string
  business: Exclude<Business, 'Billing'>
  duration: string
}

export type InboxItem = {
  id: string
  business: Business
  subject: string
  timestamp: string
}

export type Task = {
  id: string
  text: string
  done: boolean
}

export const stats: StatCard[] = [
  { label: 'Ohm Academy', count: 4 },
  { label: 'Timeless RN', count: 3 },
  { label: 'Frequency Lab', count: 2 },
  { label: 'Personal', count: 3 },
]

export const appointments: Appointment[] = [
  {
    id: 'a1',
    time: '10:00 AM',
    title: 'PRP Consultation',
    contact: 'Sarah M.',
    business: 'Timeless RN',
    duration: '60 min',
  },
  {
    id: 'a2',
    time: '1:30 PM',
    title: 'Integration Session',
    contact: 'Marcus K.',
    business: 'Ohm Academy',
    duration: '90 min',
  },
  {
    id: 'a3',
    time: '4:00 PM',
    title: 'Discovery Call',
    contact: 'New Client',
    business: 'Frequency Lab',
    duration: '30 min',
  },
]

export const inbox: InboxItem[] = [
  {
    id: 'i1',
    business: 'Timeless RN',
    subject: 'Booking request — IV NAD therapy',
    timestamp: '9:42 AM',
  },
  {
    id: 'i2',
    business: 'Ohm Academy',
    subject: 'Re: Plant medicine retreat — questions',
    timestamp: '8:15 AM',
  },
  {
    id: 'i3',
    business: 'Frequency Lab',
    subject: 'Website draft feedback — yoga studio',
    timestamp: 'Yesterday',
  },
  {
    id: 'i4',
    business: 'Billing',
    subject: 'Zoom plan suspension — 10 days',
    timestamp: 'Yesterday',
  },
]

export const tasks: Task[] = [
  { id: 't1', text: 'Pay Zoom invoice before suspension', done: false },
  { id: 't2', text: 'Reply to plant medicine retreat inquiry', done: false },
]

export const summary = {
  appointments: 3,
  unread: 12,
  pendingTasks: 2,
}

export const userName = 'April'
