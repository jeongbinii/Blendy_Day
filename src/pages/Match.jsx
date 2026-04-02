import { useState } from 'react'
import { EMOTIONS } from '../constants/emotions'

const GENDER_OPTIONS = [
  { id: 'any', label: '상관없음' },
  { id: 'female', label: '여성' },
  { id: 'male', label: '남성' },
]

const AGE_MIN = 15
const AGE_MAX = 65

export default function Match() {
  const [matchState, setMatchState] = useState('idle')
  const [gender, setGender] = useState('any')
  const [ageMin, setAgeMin] = useState(20)
  const [ageMax, setAgeMax] = useState(35)
  const [emotion, setEmotion] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [tags, setTags] = useState(['#회사생활', '#작은성취', '#오랜친구'])
  const [editingTags, setEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState('')

  function startMatch() {
    setMatchState('searching')
    setTimeout(() => {
      setMatchState('found')
      setMessages([{ role: 'them', text: '안녕하세요 😊 비슷한 하루를 보내셨군요!' }])
    }, 2000)
  }

  function send() {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: 'me', text: input }])
    setInput('')
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'them', text: '맞아요, 저도 그런 경험이 있어요. 많이 힘드셨겠어요 💙' },
      ])
    }, 1000)
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
            <p className="text-xs text-muted mb-3">오늘 내 일기 태그</p>
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {tag}
                  {editingTags && (
                    <button
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="ml-0.5 text-primary/60 hover:text-primary leading-none"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editingTags && (
              <div className="flex gap-2 mt-3">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const raw = tagInput.trim()
                      if (!raw) return
                      const t = raw.startsWith('#') ? raw : `#${raw}`
                      if (!tags.includes(t)) setTags([...tags, t])
                      setTagInput('')
                    }
                  }}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-border text-xs text-heading placeholder-muted focus:outline-none focus:border-primary bg-white"
                />
                <button
                  onClick={() => { setEditingTags(false); setTagInput('') }}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs"
                >
                  완료
                </button>
              </div>
            )}
          </div>
          {!editingTags && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setEditingTags(true)}
                className="text-sm text-muted hover:text-primary transition-colors bg-white border border-border rounded-full px-4 py-1.5 shadow-sm hover:border-primary/40 hover:shadow-md"
              >
                태그 수정하기
              </button>
            </div>
          )}

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
                {/* 트랙 배경 */}
                <div className="absolute w-full h-1.5 rounded-full bg-border" />
                {/* 선택 구간 강조 */}
                <div
                  className="absolute h-1.5 rounded-full bg-primary/60"
                  style={{
                    left: `${((ageMin - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`,
                    right: `${100 - ((ageMax - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`,
                  }}
                />
                {/* 최소값 슬라이더 — pointer-events-none + thumb만 활성화 */}
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
                {/* 최대값 슬라이더 */}
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

              {/* 5단위 눈금 */}
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

            {/* 감정 */}
            <div className="p-5 rounded-2xl bg-white shadow-xl">
              <p className="text-xs font-semibold text-heading mb-3 uppercase tracking-wider">오늘의 감정</p>
              <div className="flex gap-2 flex-wrap">
                <OptionButton
                  selected={emotion === null}
                  onClick={() => setEmotion(null)}
                >
                  상관없음
                </OptionButton>
                {Object.values(EMOTIONS).map((e) => (
                  <OptionButton
                    key={e.id}
                    selected={emotion === e.id}
                    onClick={() => setEmotion(e.id)}
                  >
                    {e.emoji} {e.label}
                  </OptionButton>
                ))}
              </div>
            </div>

          </div>

          <button
            onClick={startMatch}
            className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-[#6a87a5] transition-colors shadow-sm"
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
            {gender !== 'any' && `${GENDER_OPTIONS.find(g => g.id === gender)?.label} · `}
            {`${ageMin}세 ~ ${ageMax}세 · `}
            {emotion ? `${EMOTIONS[emotion].emoji} ${EMOTIONS[emotion].label}` : '모든 감정'}
          </p>
        </div>
      )}

      {matchState === 'found' && (
        <div className="flex flex-col h-[calc(100vh-160px)]">
          <div className="flex items-center gap-3 mb-4 p-4 rounded-2xl bg-primary/8 border border-primary/20">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-medium text-heading">매칭 완료!</p>
              <p className="text-xs text-muted mt-0.5">오늘 비슷한 감정을 느낀 분과 연결됐어요</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'me'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-border text-heading rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="따뜻한 한마디를 건네보세요"
              className="flex-1 px-4 py-3 rounded-xl border border-border text-sm text-heading placeholder-muted focus:outline-none focus:border-primary transition-colors bg-white"
            />
            <button
              onClick={send}
              className="px-4 py-3 bg-primary text-white rounded-xl text-sm hover:bg-[#6a87a5] transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      )}

    </div>
    </>
  )
}
