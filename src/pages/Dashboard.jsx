import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EMOTIONS } from '../constants/emotions'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const TABS = [
  {
    id: 'ALL',
    label: 'ALL',
    activeBg: 'bg-[#f5f3ef]',
    activeBorder: 'border-[#dedad2] border-b-[#f5f3ef]',
    inactiveBg: 'bg-[#eeece8] border-[#dedad2]',
    contentBorder: 'border-[#dedad2]',
  },
  {
    id: 'HAPPY',
    label: EMOTIONS.happy.emoji,
    activeBg: 'bg-[#fdf5ec]',
    activeBorder: 'border-[#ecd8bc] border-b-[#fdf5ec]',
    inactiveBg: 'bg-[#f5ebe0] border-[#ecd8bc]',
    contentBorder: 'border-[#ecd8bc]',
  },
  {
    id: 'SAD',
    label: EMOTIONS.sad.emoji,
    activeBg: 'bg-[#eef4f8]',
    activeBorder: 'border-[#c5d9e8] border-b-[#eef4f8]',
    inactiveBg: 'bg-[#e2edf5] border-[#c5d9e8]',
    contentBorder: 'border-[#c5d9e8]',
  },
]

function getWeekRange(offset) {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

function formatWeekLabel(monday, sunday) {
  const fmt = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`
  return `${fmt(monday)} ~ ${fmt(sunday)}`
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function toDateOnly(isoString) {
  return isoString.slice(0, 10)
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('ALL')
  const [weekOffset, setWeekOffset] = useState(0)
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { setLoading(false); return }

      try {
        const res = await fetch(`${API_URL}/api/diaries`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        setDiaries(json.diaries ?? [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    })
  }, [])

  const { monday, sunday } = getWeekRange(weekOffset)

  const weekDiaries = diaries.filter((d) => {
    const date = new Date(toDateOnly(d.created_at))
    return date >= monday && date <= sunday
  })

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const iso = day.toISOString().slice(0, 10)
    const diary = diaries.find((d) => toDateOnly(d.created_at) === iso)
    return { label: DAY_LABELS[i], emoji: diary ? EMOTIONS[diary.mood]?.emoji : null }
  })

  const filteredDiaries = weekDiaries.filter((d) => {
    if (activeTab === 'ALL') return true
    if (activeTab === 'HAPPY') return d.mood === 'happy'
    if (activeTab === 'SAD') return d.mood === 'sad' || d.mood === 'soSo'
    return true
  })

  const activeTabData = TABS.find((t) => t.id === activeTab)

  return (
    <>
    <div className="bg-[#eef4f8] px-6 py-10">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading">내 일기</h2>
          <p className="text-muted text-sm mt-0.5">총 {diaries.length}개의 기록</p>
        </div>
        <Link
          to="/chat"
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-[#6a87a5] transition-colors"
        >
          + 오늘 기록
        </Link>
      </div>
    </div>

    <div className="min-h-screen bg-white px-6 pb-16">
      <div className="max-w-2xl mx-auto pt-8">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* 날짜 네비게이터 */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="text-primary hover:text-[#6a87a5] transition-colors text-xl leading-none font-bold"
              >
                ◀
              </button>
              <span className="text-sm text-primary font-bold">
                {formatWeekLabel(monday, sunday)}
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={weekOffset >= 0}
                className="text-primary hover:text-[#6a87a5] transition-colors text-xl leading-none font-bold disabled:opacity-30"
              >
                ▶
              </button>
            </div>

            {/* 주간 이모지 바 */}
            <div className="flex rounded-2xl border border-border bg-white shadow-xl mb-6 overflow-hidden">
              {weekDays.map(({ label, emoji }, i) => (
                <div
                  key={label}
                  className={`flex-1 flex flex-col items-center py-4 gap-2 ${i < 6 ? 'border-r border-border' : ''}`}
                >
                  <span className="text-xs text-muted font-medium">{label}</span>
                  <span className="text-xl">{emoji ?? '·'}</span>
                </div>
              ))}
            </div>

            {/* 폴더 탭 + 일기 목록 */}
            <div className="shadow-2xl rounded-b-2xl rounded-tr-2xl">
              <div className="flex items-end gap-1">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={
                        isActive
                          ? `px-5 py-2 text-sm font-semibold text-heading rounded-t-xl border relative z-10 -mb-px ${tab.activeBg} ${tab.activeBorder}`
                          : `px-5 py-2 text-sm text-muted rounded-t-xl border hover:brightness-95 transition-all ${tab.inactiveBg}`
                      }
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className={`border rounded-b-2xl rounded-tr-2xl relative z-0 p-5 flex flex-col gap-3 min-h-48 ${activeTabData.activeBg} ${activeTabData.contentBorder}`}>
                {filteredDiaries.length === 0 ? (
                  <p className="text-sm text-muted text-center py-10">이 주에 해당하는 일기가 없어요.</p>
                ) : (
                  filteredDiaries.map((diary) => {
                    const emotion = EMOTIONS[diary.mood] ?? EMOTIONS.soSo
                    const date = formatDate(diary.created_at)
                    const preview = diary.content.length > 80 ? diary.content.slice(0, 80) + '...' : diary.content
                    return (
                      <div
                        key={diary.id}
                        onClick={() => navigate('/diary/view', {
                          state: { content: diary.content, tags: diary.tags, mood: diary.mood, date },
                        })}
                        className="p-5 rounded-2xl border border-border bg-white hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted">{date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${emotion.color}`}>
                            {emotion.emoji} {emotion.label}
                          </span>
                        </div>
                        <p className="text-sm text-text leading-relaxed line-clamp-2 mb-3">
                          {preview}
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(diary.tags ?? []).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/8 text-primary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
    </>
  )
}
