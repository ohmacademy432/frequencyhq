import Header from './components/Header'
import StatsGrid from './components/StatsGrid'
import Appointments from './components/Appointments'
import Inbox from './components/Inbox'
import Tasks from './components/Tasks'
import './App.css'

export default function App() {
  return (
    <div className="page">
      <main className="container">
        <Header />
        <StatsGrid />
        <Appointments />
        <Inbox />
        <Tasks />
      </main>
    </div>
  )
}
