import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function AuthCallback() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (handled.current) return
        if (event === 'SIGNED_IN' && session) {
          handled.current = true

          // 백엔드에서 users 테이블에 유저 동기화 (첫 로그인 시 레코드 생성)
          try {
            await fetch(`${API_URL}/api/users/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
            })
          } catch (err) {
            console.error('[AuthCallback] sync error:', err)
          }

          navigate('/dashboard', { replace: true })
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}
