import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function ChatRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const [userId, setUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [closed, setClosed] = useState(false)
  const bottomRef = useRef(null)

  // 세션에서 userId 가져오기
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id
      if (!uid) {
        navigate('/login', { replace: true })
        return
      }
      setUserId(uid)
    })
  }, [])

  // 기존 메시지 로드 + Realtime 구독
  useEffect(() => {
    if (!userId || !roomId) return

    fetch(`${API_URL}/api/room/${roomId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => {})

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // 중복 방지 (내가 보낸 메시지가 이미 있을 수 있음)
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new.status === 'closed') {
            setClosed(true)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, roomId])

  // 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || sending || closed) return
    setSending(true)
    try {
      await fetch(`${API_URL}/api/room/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, content: input }),
      })
      setInput('')
    } catch {
      /* ignore */
    } finally {
      setSending(false)
    }
  }

  async function leave() {
    await fetch(`${API_URL}/api/room/${roomId}/close`, {
      method: 'PATCH',
    })
    navigate('/match', { replace: true })
  }

  return (
    <>
      <div className="bg-[#eef4f8] px-6 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h2 className="text-lg font-semibold text-heading">익명 채팅방</h2>
          <button
            onClick={leave}
            className="text-sm text-muted hover:text-red-500 transition-colors border border-border rounded-full px-4 py-1.5 hover:border-red-300"
          >
            나가기
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-6">
          {messages.map((msg) => {
            const isMe = msg.sender_id === userId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-border text-heading rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            )
          })}

          {/* 상대방 나감 알림 */}
          {closed && (
            <div className="text-center py-6">
              <p className="text-sm text-muted mb-4">상대방이 채팅방을 나갔어요</p>
              <button
                onClick={() => navigate('/match', { replace: true })}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm hover:bg-[#6a87a5] transition-colors"
              >
                매칭 페이지로 이동
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 입력 영역 */}
        {!closed && (
          <div className="flex gap-2 py-4 border-t border-border">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="따뜻한 한마디를 건네보세요"
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-sm text-heading placeholder-muted focus:outline-none focus:border-primary transition-colors bg-white disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={sending}
              className="px-5 py-3 bg-primary text-white rounded-xl text-sm hover:bg-[#6a87a5] transition-colors disabled:opacity-50"
            >
              전송
            </button>
          </div>
        )}
      </div>
    </>
  )
}
