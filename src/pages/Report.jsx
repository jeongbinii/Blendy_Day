import { useState, useEffect } from 'react'
import { EMOTIONS } from '../constants/emotions'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function formatHour(h) {
  if (h == null) return '-'
  if (h === 0) return '자정'
  if (h < 12) return `오전 ${h}시`
  if (h === 12) return '정오'
  return `오후 ${h - 12}시`
}

export default function Report() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { setLoading(false); return }

      try {
        const res = await fetch(`${API_URL}/api/report`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        setReport(json)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!report || report.totalDays === 0) {
    return (
      <>
      <div className="bg-[#eef4f8] px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-heading">감정 리포트</h2>
          <p className="text-muted text-sm mt-0.5">최근 30일 기준</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-4xl mb-4">📔</p>
        <p className="text-heading font-medium mb-1">아직 분석할 기록이 없어요</p>
        <p className="text-muted text-sm">일기를 작성하면 감정 패턴이 분석됩니다</p>
      </div>
      </>
    )
  }

  const { totalDays, moodCounts, topTags, happyTags, sadTags, hardestDay, happiestDay, mostActiveHour, streak } = report
  const maxTagCount = Math.max(...topTags.map((t) => t.count), 1)

  const insights = [
    { emoji: '🔥', label: '연속 기록', value: streak > 0 ? `${streak}일째` : '오늘부터 시작!' },
    { emoji: '⏰', label: '주로 기록하는 시간', value: formatHour(mostActiveHour) },
    { emoji: '😊', label: '가장 행복한 요일', value: happiestDay ?? '-' },
    { emoji: '😢', label: '가장 힘든 요일', value: hardestDay ?? '-' },
  ]

  return (
    <>
    <div className="bg-[#eef4f8] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-heading">감정 리포트</h2>
        <p className="text-muted text-sm mt-0.5">최근 30일 기준 · 총 {totalDays}일 기록</p>
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* 감정 흐름 */}
      <section className="p-6 rounded-2xl bg-white shadow-xl mb-4">
        <h3 className="text-sm font-medium text-heading mb-1">감정 흐름</h3>
        <p className="text-xs text-muted mb-6">최근 30일 · 총 {totalDays}일 기록</p>
        <div className="flex flex-col gap-4">
          {Object.values(EMOTIONS).map((e) => {
            const count = moodCounts[e.id] ?? 0
            const pct = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0
            return (
              <div key={e.id} className="flex items-center gap-3">
                <span className="text-lg w-7 shrink-0">{e.emoji}</span>
                <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${e.barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted w-14 text-right shrink-0">{count}일 ({pct}%)</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* 인사이트 */}
      <section className="grid grid-cols-2 gap-3 mb-4">
        {insights.map(({ emoji, label, value }) => (
          <div key={label} className="p-4 rounded-2xl bg-white shadow-xl">
            <div className="text-xl mb-2">{emoji}</div>
            <div className="text-xs text-muted mb-0.5">{label}</div>
            <div className="text-sm font-medium text-heading">{value}</div>
          </div>
        ))}
      </section>

      {/* 감정별 대표 태그 */}
      <section className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-5 rounded-2xl bg-white shadow-xl">
          <p className="text-xs text-muted mb-3">행복할 때 많은 태그</p>
          <div className="flex flex-col gap-1.5">
            {happyTags.length > 0 ? (
              happyTags.map(({ tag }) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-good-bg text-[#b8892a] border border-good/40 self-start">
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-xs text-muted">아직 행복한 기록이 없어요</p>
            )}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white shadow-xl">
          <p className="text-xs text-muted mb-3">힘들 때 많은 태그</p>
          <div className="flex flex-col gap-1.5">
            {sadTags.length > 0 ? (
              sadTags.map(({ tag }) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[#edf1f9] text-[#3a5a7a] border border-[#a0b4d0]/40 self-start">
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-xs text-muted">아직 슬픈 기록이 없어요</p>
            )}
          </div>
        </div>
      </section>

      {/* 태그 빈도 */}
      {topTags.length > 0 && (
        <section className="p-6 rounded-2xl bg-white shadow-xl">
          <h3 className="text-sm font-medium text-heading mb-1">자주 쓴 해시태그</h3>
          <p className="text-xs text-muted mb-5">상위 10개 · 가장 많이 쓴 순</p>
          <div className="flex flex-col gap-3">
            {(() => {
              const totalCount = topTags.reduce((sum, t) => sum + t.count, 0)
              return topTags.map(({ tag, count }) => {
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
                return (
                  <div key={tag} className="flex items-center gap-3">
                    <span className="text-xs text-primary w-28 shrink-0">{tag}</span>
                    <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/50"
                        style={{ width: `${(count / maxTagCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted w-12 text-right">{pct}%</span>
                  </div>
                )
              })
            })()}
          </div>
        </section>
      )}
    </div>
    </>
  )
}
