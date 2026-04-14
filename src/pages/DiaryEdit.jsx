import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EMOTIONS } from '../constants/emotions'
import { supabase } from '../lib/supabase'

const STICKERS = [EMOTIONS.happy, EMOTIONS.soSo, EMOTIONS.sad]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function DiaryEdit() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [selectedSticker, setSelectedSticker] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  function addTag() {
    const raw = tagInput.trim()
    if (!raw) return
    const t = raw.startsWith('#') ? raw : `#${raw}`
    if (!tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  useEffect(() => {
    const messages = state?.messages

    if (!messages || messages.length === 0) {
      // 대화 없이 직접 접근한 경우 Chat으로 redirect
      navigate('/chat', { replace: true })
      return
    }

    async function generateDraft() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/api/diary/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        })
        if (!res.ok) throw new Error('서버 오류')
        const data = await res.json()
        setContent(data.draft)
        setTags(data.tags)

        // 해시태그를 users 테이블에 저장 (매칭용)
        const { data: session } = await supabase.auth.getSession()
        if (session?.session) {
          fetch(`${API_URL}/api/hashtags`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.session.access_token}`,
            },
            body: JSON.stringify({ diaryText: data.draft }),
          }).catch(() => {})
        }
      } catch (err) {
        console.error(err)
        setError('일기 초안 생성에 실패했습니다. 다시 시도해주세요.')
      } finally {
        setLoading(false)
      }
    }

    generateDraft()
  }, [])

  async function handlePublish() {
    if (!selectedSticker) return alert('감정 스티커를 선택해주세요')

    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

    // DB에 일기 저장
    const { data: session } = await supabase.auth.getSession()
    if (session?.session) {
      try {
        await fetch(`${API_URL}/api/diaries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ content, mood: selectedSticker, tags }),
        })
      } catch (err) {
        console.error('[handlePublish] save error:', err)
      }
    }

    navigate('/diary/view', {
      state: { content, tags, mood: selectedSticker, date },
    })
  }

  return (
    <>
    <div className="bg-[#e4eff5] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-heading">오늘의 일기 초안</h2>
        <p className="text-muted text-sm mt-0.5">AI가 대화 내용을 정리했어요. 자유롭게 수정해도 됩니다.</p>
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* 로딩 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted">AI가 일기를 작성하고 있어요...</p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="py-10 text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/chat', { state: { messages: state?.messages } })}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm"
          >
            채팅으로 돌아가기
          </button>
        </div>
      )}

      {/* 편집 UI */}
      {!loading && !error && content && (
        <>
          {/* 일기 편집 */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 px-5 py-4 rounded-2xl border border-border bg-white text-heading text-sm leading-relaxed resize-none focus:outline-none focus:border-primary transition-colors"
          />

          {/* 해시태그 */}
          <div className="mt-3 mb-8">
            <div className="flex gap-2 flex-wrap mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-primary/60 hover:text-primary leading-none"
                    aria-label="태그 삭제"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="태그 추가 (# 없이 입력 가능)"
                className="flex-1 px-3 py-1.5 rounded-xl border border-border text-xs text-heading placeholder-muted focus:outline-none focus:border-primary bg-white"
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs hover:bg-[#6a87a5] transition-colors"
              >
                추가
              </button>
            </div>
          </div>

          {/* 감정 스티커 */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-heading mb-3">오늘 하루를 한 마디로 표현하면?</h3>
            <div className="grid grid-cols-3 gap-3">
              {STICKERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSticker(s.id)}
                  className={`p-5 rounded-2xl border-2 text-center transition-all ${
                    selectedSticker === s.id
                      ? s.color + ' scale-105 shadow-sm'
                      : 'border-border bg-white hover:border-primary/40'
                  }`}
                >
                  <div className="text-3xl mb-1.5">{s.emoji}</div>
                  <div className="text-xs font-medium text-text">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 발행 */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/chat', { state: { messages: state?.messages } })}
              className="px-5 py-3 border border-border text-muted rounded-xl text-sm hover:border-primary transition-colors"
            >
              대화 더 하기
            </button>
            <button
              onClick={handlePublish}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-[#6a87a5] transition-colors"
            >
              일기 발행하기
            </button>
          </div>
        </>
      )}
    </div>
    </>
  )
}
