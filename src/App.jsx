import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Chat from './pages/Chat'
import DiaryEdit from './pages/DiaryEdit'
import DiaryView from './pages/DiaryView'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import Match from './pages/Match'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="chat" element={<Chat />} />
          <Route path="diary/edit" element={<DiaryEdit />} />
          <Route path="diary/view" element={<DiaryView />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="report" element={<Report />} />
          <Route path="match" element={<Match />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
