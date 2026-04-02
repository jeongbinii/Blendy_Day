import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EMOTIONS } from '../constants/emotions'

const MOCK_DIARIES = [
  {
    id: 1,
    date: '2026년 3월 29일 토',
    dateISO: '2026-03-29',
    mood: 'happy',
    preview: '출근하자마자 예상치 못한 회의가 잡혔다. 준비도 없이 들어간 자리에서 발표를 맡게 됐는데...',
    tags: ['#회사생활', '#작은성취', '#오랜친구'],
  },
  {
    id: 2,
    date: '2026년 3월 28일 금',
    dateISO: '2026-03-28',
    mood: 'soSo',
    preview: '딱히 특별한 일은 없었다. 그냥 평범한 하루. 저녁에 오랜만에 요리를 해먹었는데 생각보다 맛있었다.',
    tags: ['#평범한하루', '#요리', '#소소한행복'],
  },
  {
    id: 3,
    date: '2026년 3월 27일 목',
    dateISO: '2026-03-27',
    mood: 'sad',
    preview: '팀장님께 피드백을 받았는데 예상보다 강하게 들어와서 하루 종일 기분이 좋지 않았다.',
    tags: ['#회사생활', '#스트레스', '#퇴근하고싶다'],
  },
  {
    id: 4,
    date: '2026년 3월 26일 수',
    dateISO: '2026-03-26',
    mood: 'happy',
    preview: '오늘은 카페에서 작업했다. 좋아하는 음악을 들으며 집중하는 시간이 너무 좋았다.',
    tags: ['#카페작업', '#집중', '#혼자만의시간'],
  },
]

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

// 주어진 offset 기준 월요일~일요일 반환
function getWeekRange(offset) {
  const today = new Date(2026, 2, 31) // 2026-03-31 기준
  const day = today.getDay() // 0=일, 1=월...
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

function toDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('ALL')
  const [weekOffset, setWeekOffset] = useState(0)
  const navigate = useNavigate()

  const { monday, sunday } = getWeekRange(weekOffset)

  const weekDiaries = MOCK_DIARIES.filter((d) => {
    const date = toDate(d.dateISO)
    return date >= monday && date <= sunday
  })

  // 요일별 이모지 매핑 (월=0 ~ 일=6)
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const iso = day.toISOString().slice(0, 10)
    const diary = MOCK_DIARIES.find((d) => d.dateISO === iso)
    return { label: DAY_LABELS[i], emoji: diary ? EMOTIONS[diary.mood].emoji : null }
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
    {/* 헤더 히어로 */}
    <div className="bg-[#eef4f8] px-6 py-10">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading">내 일기</h2>
          <p className="text-muted text-sm mt-0.5">총 {MOCK_DIARIES.length}개의 기록</p>
        </div>
        <Link
          to="/chat"
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-[#6a87a5] transition-colors"
        >
          + 오늘 기록
        </Link>
      </div>
    </div>

    {/* 본문 */}
    <div className="min-h-screen bg-white px-6 pb-16">
      <div className="max-w-2xl mx-auto pt-8">

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
          {/* 탭 */}
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

          {/* 콘텐츠 박스 */}
          <div className={`border rounded-b-2xl rounded-tr-2xl relative z-0 p-5 flex flex-col gap-3 min-h-48 ${activeTabData.activeBg} ${activeTabData.contentBorder}`}>
            {filteredDiaries.length === 0 ? (
              <p className="text-sm text-muted text-center py-10">이 주에 해당하는 일기가 없어요.</p>
            ) : (
              filteredDiaries.map((diary) => {
                const emotion = EMOTIONS[diary.mood]
                return (
                  <div
                    key={diary.id}
                    onClick={() => navigate('/diary/view', {
                      state: { content: diary.preview, tags: diary.tags, mood: diary.mood, date: diary.date },
                    })}
                    className="p-5 rounded-2xl border border-border bg-white hover:border-primary/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted">{diary.date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${emotion.color}`}>
                        {emotion.emoji} {emotion.label}
                      </span>
                    </div>
                    <p className="text-sm text-text leading-relaxed line-clamp-2 mb-3">
                      {diary.preview}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {diary.tags.map((tag) => (
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

      </div>
    </div>
    </>
  )
}
