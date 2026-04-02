import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EMOTIONS } from '../constants/emotions'

const STICKERS = [EMOTIONS.happy, EMOTIONS.soSo, EMOTIONS.sad]

const MOCK_DRAFT = `오늘은 출근하자마자 예상치 못한 회의가 잡혔다. 준비도 없이 들어간 자리에서 발표를 맡게 됐는데, 생각보다 잘 마무리된 것 같아 작은 안도감이 들었다.

점심은 혼자 먹었다. 요즘 혼자만의 시간이 오히려 편하게 느껴진다. 좋아하는 팟캐스트를 들으며 걸었더니 기분이 조금 나아졌다.

퇴근길에 오랜 친구에게 연락이 왔다. 오랜만에 목소리를 들으니 반가웠고, 다음 주에 만나기로 했다. 오늘 하루 중 가장 따뜻한 순간이었다.`

const MOCK_TAGS = ['#회사생활', '#작은성취', '#혼밥', '#오랜친구']

export default function DiaryEdit() {
  const [content, setContent] = useState(MOCK_DRAFT)
  const [selectedSticker, setSelectedSticker] = useState(null)
  const navigate = useNavigate()

  function handlePublish() {
    if (!selectedSticker) return alert('감정 스티커를 선택해주세요')
    navigate('/diary/view', {
      state: {
        content,
        tags: MOCK_TAGS,
        mood: selectedSticker,
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
      },
    })
  }

  return (
    <>
    <div className="bg-[#e4eff5] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-[#1e1a16]">오늘의 일기 초안</h2>
        <p className="text-[#9b948c] text-sm mt-0.5">AI가 대화 내용을 정리했어요. 자유롭게 수정해도 됩니다.</p>
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* 일기 편집 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64 px-5 py-4 rounded-2xl border border-[#E8E6E0] bg-white text-[#1e1a16] text-sm leading-relaxed resize-none focus:outline-none focus:border-[#7895B2] transition-colors"
      />

      {/* 해시태그 */}
      <div className="flex gap-2 flex-wrap mt-3 mb-8">
        {MOCK_TAGS.map((tag) => (
          <span
            key={tag}
            className="text-xs px-3 py-1 rounded-full bg-[#7895B2]/10 text-[#7895B2] border border-[#7895B2]/20"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 감정 스티커 */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-[#1e1a16] mb-3">오늘 하루를 한 마디로 표현하면?</h3>
        <div className="grid grid-cols-3 gap-3">
          {STICKERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSticker(s.id)}
              className={`p-5 rounded-2xl border-2 text-center transition-all ${
                selectedSticker === s.id
                  ? s.color + ' scale-105 shadow-sm'
                  : 'border-[#E8E6E0] bg-white hover:border-[#7895B2]/40'
              }`}
            >
              <div className="text-3xl mb-1.5">{s.emoji}</div>
              <div className="text-xs font-medium text-[#4a4640]">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 발행 */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/chat')}
          className="px-5 py-3 border border-[#E8E6E0] text-[#9b948c] rounded-xl text-sm hover:border-[#7895B2] transition-colors"
        >
          대화 더 하기
        </button>
        <button
          onClick={handlePublish}
          className="flex-1 py-3 bg-[#7895B2] text-white rounded-xl text-sm font-medium hover:bg-[#6a87a5] transition-colors"
        >
          일기 발행하기
        </button>
      </div>
    </div>
    </>
  )
}
