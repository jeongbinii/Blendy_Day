import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function formatDate() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
}

export default function Chat() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [messages, setMessages] = useState(
    state?.messages?.length > 0
      ? state.messages
      : [{ role: 'ai', text: '오늘 하루 어땠어? 편하게 말해줘 😊' }],
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 응답 완료 후 입력창 포커스
  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  async function send() {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', text: input }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages((prev) => [...prev, { role: 'ai', text: data.text }])
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: '죄송해요, 잠시 문제가 생겼어요. 다시 말해줄래요?' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#eef4f8] flex flex-col items-center py-10 px-4">
      {/* 히어로 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-heading leading-snug">
          편안한 마음으로 오늘 있었던 일을 들려주세요.
        </h2>
        <p className="text-sm text-muted mt-2">AI와의 대화는 안전하게 저장되어 일기로 완성됩니다.</p>
      </div>
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ minHeight: '600px', maxHeight: '80vh' }}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <span className="text-lg font-semibold text-heading">오늘의 기록</span>
          <span className="text-sm text-primary">{formatDate()}</span>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-8 py-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[72%] px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#7A96B2] text-white rounded-2xl rounded-tr-none'
                    : 'bg-slate-100 text-heading rounded-2xl rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-5 py-3 bg-slate-100 rounded-2xl rounded-tl-none">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력 영역 */}
        <div className="px-8 py-5 border-t border-gray-100">
          {/* 알약형 입력창 + 전송 버튼 */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-1.5 gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="오늘 어떤 일이 있었나요?"
              className="flex-1 bg-transparent text-sm text-heading placeholder-muted focus:outline-none py-2 px-1"
              disabled={loading}
              autoFocus
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-5 py-2.5 bg-[#5a7a9a] text-white rounded-full text-sm font-medium hover:bg-[#4e6d8c] transition-colors shrink-0 disabled:opacity-50"
            >
              전송
            </button>
          </div>

          {/* 일기 완성하기 버튼 */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => navigate('/diary/edit', { state: { messages } })}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full border border-primary text-primary text-sm hover:bg-primary/5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 7.5L5.5 11L12 3" stroke="#7895B2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              일기 완성하기
            </button>
          </div>
        </div>
      </div>

      {/* 하단 카피 */}
      <p className="mt-6 text-xs text-muted">© 2026 Blendy Day — 대화가 끝나면 당신의 마음을 정돈해 드릴게요.</p>
    </div>
  )
}
