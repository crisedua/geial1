import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DatabaseProvider } from './contexts/DatabaseContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Upload from './pages/Upload'
import Search from './pages/Search'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="upload" element={<Upload />} />
            <Route path="search" element={<Search />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </DatabaseProvider>
    </AuthProvider>
  )
}

export default App
