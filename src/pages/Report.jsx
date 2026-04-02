import { EMOTIONS } from '../constants/emotions'

// 최근 30일 목 데이터
const THIRTY_DAY_COUNTS = { happy: 14, soSo: 9, sad: 7 }
const TOTAL_DAYS = Object.values(THIRTY_DAY_COUNTS).reduce((a, b) => a + b, 0)

const INSIGHTS = [
  { emoji: '📅', label: '가장 힘든 요일', value: '화요일 · 목요일' },
  { emoji: '😊', label: '가장 행복한 상황', value: '혼자만의 시간' },
  { emoji: '😤', label: '주요 스트레스 원인', value: '회사 / 피드백' },
  { emoji: '✨', label: '자주 등장하는 행복', value: '소소한 일상' },
]

const TOP_TAGS = [
  { tag: '#회사생활', count: 8 },
  { tag: '#소소한행복', count: 6 },
  { tag: '#혼자만의시간', count: 5 },
  { tag: '#스트레스', count: 4 },
  { tag: '#오랜친구', count: 3 },
  { tag: '#카페작업', count: 3 },
]

export default function Report() {
  const maxCount = Math.max(...TOP_TAGS.map((t) => t.count))

  return (
    <>
    <div className="bg-[#eef4f8] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-heading">감정 리포트</h2>
        <p className="text-muted text-sm mt-0.5">2026년 3월 · 최근 30일 기준</p>
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* 최근 30일 감정 흐름 */}
      <section className="p-6 rounded-2xl bg-white shadow-xl mb-4">
        <h3 className="text-sm font-medium text-heading mb-1">감정 흐름</h3>
        <p className="text-xs text-muted mb-6">최근 30일 기준 · 총 {TOTAL_DAYS}일 기록</p>
        <div className="flex flex-col gap-4">
          {Object.values(EMOTIONS).map((e) => {
            const count = THIRTY_DAY_COUNTS[e.id]
            const pct = Math.round((count / TOTAL_DAYS) * 100)
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
        {INSIGHTS.map(({ emoji, label, value }) => (
          <div key={label} className="p-4 rounded-2xl bg-white shadow-xl">
            <div className="text-xl mb-2">{emoji}</div>
            <div className="text-xs text-muted mb-0.5">{label}</div>
            <div className="text-sm font-medium text-heading">{value}</div>
          </div>
        ))}
      </section>

      {/* 태그 빈도 */}
      <section className="p-6 rounded-2xl bg-white shadow-xl">
        <h3 className="text-sm font-medium text-heading mb-5">자주 쓴 해시태그</h3>
        <div className="flex flex-col gap-3">
          {TOP_TAGS.map(({ tag, count }) => (
            <div key={tag} className="flex items-center gap-3">
              <span className="text-xs text-primary w-28 shrink-0">{tag}</span>
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
    </>
  )
}
