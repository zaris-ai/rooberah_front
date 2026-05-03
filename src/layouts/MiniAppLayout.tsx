import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Home, SquareParking, Utensils, UserRound } from 'lucide-react';

type MiniAppLayoutProps = {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  children: ReactNode;
};

export default function MiniAppLayout({
  title,
  subtitle,
  rightAction,
  children,
}: MiniAppLayoutProps) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#f3f3ef] font-sans text-[#151515]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#fbfbf8] shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
        <div className="sticky top-0 z-30 bg-[#fbfbf8]/90 px-5 pb-3 pt-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {rightAction}

              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <Bell className="h-5 w-5 text-[#222]" />
              </button>
            </div>

            <div className="text-left">
              <div className="text-xl font-black tracking-[-0.03em]">
                {title}
              </div>

              {subtitle && (
                <div className="mt-1 text-xs font-medium text-[#8b8b84]">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="px-5 pb-28 pt-3">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-[#ededed] bg-white/90 px-4 py-3 backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-2">
            <NavItem
              to="/units"
              icon={<Home className="h-5 w-5" />}
              label="خانه"
              exact
            />

            <NavItem
              to="/units"
              icon={<SquareParking className="h-5 w-5" />}
              label="پارکینگ"
              matchPrefix
            />

            <NavItem
              to="/food"
              icon={<Utensils className="h-5 w-5" />}
              label="رزرو غذا"
              exact
            />

            <NavItem
              to="/my-parking"
              icon={<UserRound className="h-5 w-5" />}
              label="من"
              exact
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  exact = false,
  matchPrefix = false,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  exact?: boolean;
  matchPrefix?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => {
        const path = window.location.pathname;

        const active =
          matchPrefix && to === '/units'
            ? path.startsWith('/units')
            : isActive;

        return [
          'flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-bold transition',
          active
            ? 'bg-[#eef3ff] text-[#4777ff]'
            : 'text-[#aaa9a1] hover:bg-[#f4f4f0]',
        ].join(' ');
      }}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}