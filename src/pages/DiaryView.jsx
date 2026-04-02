import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { EMOTIONS } from '../constants/emotions'

export default function DiaryView() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [matchesLeft, setMatchesLeft] = useState(3)

  if (!state) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const { content, tags, mood, date } = state
  const emotion = EMOTIONS[mood]

  return (
    <>
    <div className="bg-[#eef4f8] px-6 py-10">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading">오늘의 일기</h2>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full border ${emotion.color}`}>
          {emotion.emoji} {emotion.label}
        </span>
      </div>
    </div>

    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted hover:text-heading transition-colors mb-4 text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        뒤로
      </button>

      {/* 일기 본문 */}
      <div className="bg-white rounded-2xl border border-border shadow-sm mb-5 overflow-hidden">
        <div className="flex justify-end px-7 pt-5">
          <span className="text-sm text-primary">{date}</span>
        </div>
        <div className="px-7 pb-7 pt-3 leading-relaxed text-sm text-text whitespace-pre-wrap">
          {content}
        </div>
      </div>

      {/* 해시태그 */}
      <div className="flex gap-2 flex-wrap mb-10">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3 items-center">
        <button
          onClick={() => navigate('/diary/edit')}
          className="text-sm text-muted hover:text-primary transition-colors bg-white border border-border rounded-full px-4 py-1.5 shadow-sm hover:border-primary/40 hover:shadow-md"
        >
          다시 수정하기
        </button>
        <button
          onClick={() => {
            if (matchesLeft === 0) return
            setMatchesLeft((n) => n - 1)
            navigate('/match')
          }}
          disabled={matchesLeft === 0}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm shadow-sm transition-all border ${
            matchesLeft > 0
              ? 'bg-primary text-white border-primary hover:bg-[#6a87a5] hover:shadow-md'
              : 'bg-white text-muted border-border cursor-not-allowed opacity-50'
          }`}
        >
          랜덤 매칭하기
          <span className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${
            matchesLeft > 0 ? 'bg-white/20 text-white' : 'bg-border text-muted'
          }`}>
            {matchesLeft}/3
          </span>
        </button>
      </div>
    </div>
    </>
  )
}
