import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-[#1e1a16] font-semibold text-xl">EchoDiary</Link>
          <p className="text-[#9b948c] text-sm mt-1">
            {mode === 'login' ? '오늘 하루를 기록해보세요' : '함께 시작해요'}
          </p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="닉네임"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E6E0] text-sm text-[#1e1a16] placeholder-[#9b948c] focus:outline-none focus:border-[#7895B2] transition-colors bg-white"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            className="w-full px-4 py-3 rounded-xl border border-[#E8E6E0] text-sm text-[#1e1a16] placeholder-[#9b948c] focus:outline-none focus:border-[#7895B2] transition-colors bg-white"
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full px-4 py-3 rounded-xl border border-[#E8E6E0] text-sm text-[#1e1a16] placeholder-[#9b948c] focus:outline-none focus:border-[#7895B2] transition-colors bg-white"
          />

          <button
            type="submit"
            className="w-full py-3 bg-[#7895B2] text-white rounded-xl text-sm font-medium hover:bg-[#6a87a5] transition-colors mt-1"
          >
            {mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        <p className="text-center text-xs text-[#9b948c] mt-6">
          {mode === 'login' ? '아직 계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[#7895B2] hover:underline"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}
