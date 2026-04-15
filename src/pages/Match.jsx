import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const GENDER_OPTIONS = [
  { id: '무관', label: '무관' },
  { id: '여성', label: '여성' },
  { id: '남성', label: '남성' },
]

const AGE_MIN = 15
const AGE_MAX = 65

export default function Match() {
  const [matchState, setMatchState] = useState('idle') // idle | searching | found | notfound
  const [gender, setGender] = useState('무관')
  const [ageMin, setAgeMin] = useState(20)
  const [ageMax, setAgeMax] = useState(35)

  const [userId, setUserId] = useState(null)
  const [myTags, setMyTags] = useState([])
  const [editingTags, setEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [matchedUser, setMatchedUser] = useState(null)

  // 채팅 관련
  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [closed, setClosed] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // 로그인 유저 정보 + 해시태그 로드
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id
      if (!uid) return
      setUserId(uid)
      try {
        const res = await fetch(`${API_URL}/api/users/${uid}`)
        const user = await res.json()
        setMyTags(user.hashtags ?? [])
      } catch { /* ignore */ }
    })
  }, [])

  // 채팅방 Realtime 구독
  useEffect(() => {
    if (!roomId || !userId) return

    // 기존 메시지 로드
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
  }, [roomId, userId])

  // 메시지 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 전송 완료 후 입력창 포커스
  useEffect(() => {
    if (!sending) inputRef.current?.focus()
  }, [sending])

  async function startMatch() {
    if (!userId) return
    setMatchState('searching')
    setMatchedUser(null)
    setRoomId(null)
    setMessages([])
    setClosed(false)

    try {
      // 현재 편집 중인 태그를 먼저 DB에 반영 (저장 여부와 무관하게 최신 상태 반영)
      const { data: session } = await supabase.auth.getSession()
      if (session?.session) {
        await fetch(`${API_URL}/api/hashtags`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ hashtags: myTags }),
        }).catch(() => {})
      }
      setEditingTags(false)

      const res = await fetch(`${API_URL}/api/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mode: '공감형',
          preferredGender: gender,
          minAge: ageMin,
          maxAge: ageMax,
        }),
      })
      const matchData = await res.json()

      if (matchData.matched) {
        setMatchedUser(matchData.user)

        // 자동으로 채팅방 생성
        const roomRes = await fetch(`${API_URL}/api/room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAId: userId, userBId: matchData.user.id }),
        })
        const roomData = await roomRes.json()
        setRoomId(roomData.room_id)

        setMatchState('found')
      } else {
        setMatchState('notfound')
      }
    } catch {
      setMatchState('notfound')
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending || closed || !roomId) return
    setSending(true)
    try {
      await fetch(`${API_URL}/api/room/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, content: input }),
      })
      setInput('')
    } catch { /* ignore */ } finally {
      setSending(false)
    }
  }

  async function leaveRoom() {
    if (roomId) {
      await fetch(`${API_URL}/api/room/${roomId}/close`, { method: 'PATCH' })
    }
    setMatchState('idle')
    setMatchedUser(null)
    setRoomId(null)
    setMessages([])
    setClosed(false)
  }

  function OptionButton({ selected, onClick, children }) {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm border transition-all ${
          selected
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-muted border-border hover:border-primary/50'
        }`}
      >
        {children}
      </button>
    )
  }

  return (
    <>
    <div className="bg-[#eef4f8] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-heading">익명 공감 매칭</h2>
        <p className="text-muted text-sm mt-0.5">오늘 비슷한 하루를 보낸 사람과 연결돼요</p>
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 py-10">

      {matchState === 'idle' && (
        <>
          {/* 오늘 내 태그 */}
          <div className="p-5 rounded-2xl bg-white shadow-xl mb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted">오늘 내 일기 태그</p>
              {myTags.length > 0 && !editingTags && (
                <button
                  onClick={() => setEditingTags(true)}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M11.5 2.5 13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  태그 수정
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {myTags.length > 0 ? myTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {tag}
                  {editingTags && (
                    <button
                      onClick={() => setMyTags((prev) => prev.filter((t) => t !== tag))}
                      className="text-primary/60 hover:text-primary leading-none"
                      aria-label="태그 삭제"
                    >
                      ×
                    </button>
                  )}
                </span>
              )) : (
                <p className="text-xs text-muted">아직 태그가 없어요. 일기를 먼저 작성해주세요.</p>
              )}
            </div>

            {editingTags && (
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const raw = tagInput.trim()
                        if (!raw) return
                        const t = raw.startsWith('#') ? raw : `#${raw}`
                        if (!myTags.includes(t)) setMyTags((prev) => [...prev, t])
                        setTagInput('')
                      }
                    }}
                    placeholder="태그 추가 (# 없이 입력 가능)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-border text-xs text-heading placeholder-muted focus:outline-none focus:border-primary bg-white"
                  />
                  <button
                    onClick={async () => {
                      const { data: session } = await supabase.auth.getSession()
                      if (!session?.session) return
                      await fetch(`${API_URL}/api/hashtags`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${session.session.access_token}`,
                        },
                        body: JSON.stringify({ hashtags: myTags }),
                      })
                      setEditingTags(false)
                      setTagInput('')
                    }}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs hover:bg-[#6a87a5] transition-colors"
                  >
                    저장
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">매칭 상대 조건 설정</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 매칭 필터 */}
          <div className="flex flex-col gap-5 mb-8">

            {/* 성별 */}
            <div className="p-5 rounded-2xl bg-white shadow-xl">
              <p className="text-xs font-semibold text-heading mb-3 uppercase tracking-wider">성별</p>
              <div className="flex gap-2 flex-wrap">
                {GENDER_OPTIONS.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={gender === opt.id}
                    onClick={() => setGender(opt.id)}
                  >
                    {opt.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            {/* 나이 */}
            <div className="p-5 rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-heading uppercase tracking-wider">나이대</p>
                <span className="text-sm font-semibold text-primary">{ageMin}세 ~ {ageMax}세</span>
              </div>
              <div className="relative h-5 flex items-center">
                <div className="absolute w-full h-1.5 rounded-full bg-border" />
                <div
                  className="absolute h-1.5 rounded-full bg-primary/60"
                  style={{
                    left: `${((ageMin - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`,
                    right: `${100 - ((ageMax - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={AGE_MIN}
                  max={AGE_MAX}
                  value={ageMin}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v < ageMax) setAgeMin(v)
                  }}
                  className="absolute w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <input
                  type="range"
                  min={AGE_MIN}
                  max={AGE_MAX}
                  value={ageMax}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v > ageMin) setAgeMax(v)
                  }}
                  className="absolute w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
              <div className="relative mt-2 h-4">
                {Array.from({ length: (AGE_MAX - AGE_MIN) / 5 + 1 }, (_, i) => {
                  const val = AGE_MIN + i * 5
                  const pct = ((val - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100
                  const inRange = val >= ageMin && val <= ageMax
                  return (
                    <div
                      key={val}
                      className="absolute flex flex-col items-center"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`w-px h-1.5 ${inRange ? 'bg-primary/50' : 'bg-border'}`} />
                      <span className={`text-[10px] mt-0.5 ${inRange ? 'text-primary' : 'text-muted'}`}>
                        {val}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          <button
            onClick={startMatch}
            disabled={myTags.length === 0}
            className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-[#6a87a5] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            매칭 시작하기
          </button>
        </>
      )}

      {matchState === 'searching' && (
        <div className="text-center py-24">
          <div className="text-4xl mb-4 animate-pulse">🔍</div>
          <p className="text-heading font-medium">비슷한 하루를 보낸 사람을 찾고 있어요...</p>
          <p className="text-muted text-sm mt-2">
            {gender !== '무관' ? `${gender} · ` : ''}{ageMin}세 ~ {ageMax}세
          </p>
        </div>
      )}

      {matchState === 'notfound' && (
        <div className="text-center py-24">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-heading font-medium">조건에 맞는 상대를 찾지 못했어요</p>
          <p className="text-muted text-sm mt-2 mb-8">조건을 바꿔서 다시 시도해보세요</p>
          <button
            onClick={() => setMatchState('idle')}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm hover:bg-[#6a87a5] transition-colors"
          >
            다시 시도하기
          </button>
        </div>
      )}

      {matchState === 'found' && matchedUser && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
          {/* 상대방 정보 배너 */}
          <div className="flex items-center justify-between mb-4 p-4 rounded-2xl bg-primary/8 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                👤
              </div>
              <div>
                <p className="text-sm font-medium text-heading">{matchedUser.nickname}</p>
                <p className="text-xs text-muted">
                  {matchedUser.gender && `${matchedUser.gender} · `}{matchedUser.age && `${matchedUser.age}세`}
                </p>
              </div>
            </div>
            <button
              onClick={leaveRoom}
              className="text-xs text-muted hover:text-red-500 transition-colors border border-border rounded-full px-3 py-1 hover:border-red-300"
            >
              나가기
            </button>
          </div>

          {/* 겹치는 태그 표시 */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {(matchedUser.hashtags ?? []).map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {tag}
              </span>
            ))}
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2">
            {messages.length === 0 && !closed && (
              <p className="text-center text-xs text-muted py-10">따뜻한 첫 인사를 건네보세요</p>
            )}
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

            {closed && (
              <div className="text-center py-6">
                <p className="text-sm text-muted mb-4">상대방이 채팅방을 나갔어요</p>
                <button
                  onClick={() => {
                    setMatchState('idle')
                    setMatchedUser(null)
                    setRoomId(null)
                    setMessages([])
                    setClosed(false)
                  }}
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
            <div className="flex gap-2 pt-4 border-t border-border">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="따뜻한 한마디를 건네보세요"
                disabled={sending}
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl border border-border text-sm text-heading placeholder-muted focus:outline-none focus:border-primary transition-colors bg-white disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="px-5 py-3 bg-primary text-white rounded-xl text-sm hover:bg-[#6a87a5] transition-colors disabled:opacity-50"
              >
                전송
              </button>
            </div>
          )}
        </div>
      )}

    </div>
    </>
  )
}
