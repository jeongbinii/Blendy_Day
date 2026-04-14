import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Chat from './pages/Chat'
import DiaryEdit from './pages/DiaryEdit'
import DiaryView from './pages/DiaryView'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import Match from './pages/Match'
import ChatRoom from './pages/ChatRoom'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* OAuth 콜백 — Layout 없이 독립 렌더링 */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />

          {/* 보호 라우트 */}
          <Route path="chat"        element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="diary/edit"  element={<ProtectedRoute><DiaryEdit /></ProtectedRoute>} />
          <Route path="diary/view"  element={<ProtectedRoute><DiaryView /></ProtectedRoute>} />
          <Route path="dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="report"      element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="match"       element={<ProtectedRoute><Match /></ProtectedRoute>} />
          <Route path="room/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
