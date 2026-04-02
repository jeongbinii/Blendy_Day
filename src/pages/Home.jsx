import { Link } from 'react-router-dom'

const FEATURES = [
  {
    emoji: '💬',
    title: 'AI와 편안한 대화',
    desc: '"오늘 하루 어땠어?"로 시작하는 대화. AI가 자연스럽게 감정을 이끌어냅니다.',
  },
  {
    emoji: '✍️',
    title: '일기 초안 자동 생성',
    desc: '대화가 끝나면 AI가 내용을 정리해 일기 초안을 만들어줍니다.',
  },
  {
    emoji: '🤝',
    title: '익명 공감 매칭',
    desc: '비슷한 하루를 보낸 사람과 해시태그로 연결되어 따뜻한 위로를 나눕니다.',
  },
  {
    emoji: '📊',
    title: '감정 패턴 리포트',
    desc: '쌓인 일기 데이터로 나의 감정 흐름을 분석해 메타인지를 높입니다.',
  },
]

export default function Home() {
  return (
    <div>
      {/* Hero — 전체 너비 */}
      <section
        className="relative pt-24 pb-36 min-h-[520px]"
        style={{ background: 'linear-gradient(160deg, #c8dff0 0%, #daeaf5 40%, #edf5f9 70%, #F9F8F6 100%)' }}
      >
        {/* 이미지 — 텍스트 바로 옆, 전체 높이 */}
        <div className="absolute left-[40%] top-0 h-full w-[50%] pointer-events-none">
          <img
            src="/image/image3.png"
            alt=""
            className="h-full w-full object-contain object-bottom"
          />
        </div>

        {/* 하단 그라데이션 페이드 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }} />

        {/* 텍스트 + 버튼 */}
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="flex flex-col items-start">
            {/* 배지 */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#b8d4e8]/60 bg-white/70 text-[#9b948c] text-sm mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9b948c] inline-block" />
              감정 기록 &amp; 공감 매칭
            </div>

            <h1 className="text-5xl font-bold text-[#1e1a16] leading-[1.2] tracking-tight mb-5">
              당신의 대화가<br /><span className="bg-gradient-to-r from-[#7895B2] via-[#a78bd4] to-[#c48bb8] bg-clip-text text-transparent">일기</span>가 되는 마법
            </h1>

            <p className="text-[#6b6460] text-sm leading-relaxed mb-10">
              글쓰기가 막막한 분들을 위해. AI와 나눈 대화가<br />자연스럽게 오늘의 일기로 완성됩니다.
            </p>

            <Link
              to="/chat"
              className="px-8 py-3.5 bg-[#7895B2] text-white rounded-full text-sm font-semibold hover:bg-[#6a87a5] transition-all shadow-lg hover:shadow-xl"
            >
              오늘의 일기 작성하기
            </Link>
          </div>
        </div>
      </section>

      {/* Features & CTA */}
      <div className="max-w-4xl mx-auto px-6">
      {/* Features */}
      <section className="pb-24 pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-shadow"
            >
              <span className="text-2xl mb-3 block">{emoji}</span>
              <h3 className="text-[#1e1a16] font-medium mb-1">{title}</h3>
              <p className="text-[#9b948c] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  )
}
