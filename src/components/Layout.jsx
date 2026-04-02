import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/chat',      label: '오늘 기록' },
  { to: '/dashboard', label: '내 일기' },
  { to: '/report',    label: '리포트' },
  { to: '/match',     label: '매칭' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-[#F9F8F6]/80 backdrop-blur border-b border-[#E8E6E0]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <NavLink to="/" className="text-[#1e1a16] font-semibold tracking-tight text-lg">
            Blendy Day
          </NavLink>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#7895B2]/15 text-[#7895B2] font-medium'
                      : 'text-[#9b948c] hover:text-[#4a4640] hover:bg-[#E8E6E0]/60'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/login"
            className="text-sm px-4 py-1.5 rounded-lg border border-[#E8E6E0] text-[#4a4640] hover:border-[#7895B2] hover:text-[#7895B2] transition-colors"
          >
            로그인
          </NavLink>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[#E8E6E0] py-6 text-center text-xs text-[#9b948c]">
        © 2026 EchoDiary — 당신의 대화가 일기가 됩니다
      </footer>
    </div>
  )
}
