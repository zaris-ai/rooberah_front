import { CarFront, Lock, UserRound } from 'lucide-react';
import type { Spot } from '../types/parking';

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function getSpotStyle(state: Spot['state']) {
  if (state === 'mine') {
    return {
      wrapper:
        'bg-[#eef3ff] text-[#4777ff] shadow-[0_12px_28px_rgba(71,119,255,0.16)]',
      icon: 'text-[#4777ff]',
      badge: 'bg-[#4777ff] text-white',
      label: 'جایگاه من',
    };
  }

  if (state === 'occupied') {
    return {
      wrapper:
        'bg-[#fff0f0] text-[#d9534f] shadow-[0_12px_28px_rgba(217,83,79,0.12)]',
      icon: 'text-[#d9534f]',
      badge: 'bg-[#d9534f] text-white',
      label: 'پر',
    };
  }

  return {
    wrapper:
      'bg-white text-[#151515] shadow-[0_12px_28px_rgba(0,0,0,0.05)]',
    icon: 'text-[#9a9a92]',
    badge: 'bg-[#edfff8] text-[#1f9f73]',
    label: 'خالی',
  };
}

function getOccupiedDisplay(spot: Spot) {
  const username = spot.occupiedByUsername?.trim();

  if (username) {
    return username.startsWith('@') ? username : `@${username}`;
  }

  if (spot.occupiedByTelegramUserId) {
    return `ID: ${toPersianDigits(spot.occupiedByTelegramUserId)}`;
  }

  return null;
}

export default function ParkingSpotCard({
  spot,
  onClick,
}: {
  spot: Spot;
  onClick: () => void;
}) {
  const style = getSpotStyle(spot.state);
  const isOccupied = spot.state === 'occupied' || spot.state === 'mine';
  const occupiedDisplay = getOccupiedDisplay(spot);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'min-h-[132px] rounded-[24px] p-3 text-center transition active:scale-[0.98]',
        style.wrapper,
      ].join(' ')}
    >
      <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/75">
        {spot.state === 'free' ? (
          <CarFront className={['h-6 w-6', style.icon].join(' ')} />
        ) : spot.state === 'mine' ? (
          <UserRound className={['h-6 w-6', style.icon].join(' ')} />
        ) : (
          <Lock className={['h-6 w-6', style.icon].join(' ')} />
        )}
      </div>

      <div className="text-lg font-black tracking-[-0.03em]">
        {toPersianDigits(spot.code)}
      </div>

      <div
        className={[
          'mx-auto mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-black',
          style.badge,
        ].join(' ')}
      >
        {style.label}
      </div>

      {isOccupied && occupiedDisplay && (
        <div className="mt-2 rounded-[14px] bg-white/80 px-2 py-1 text-[10px] font-black leading-5 text-[#555]">
          کاربر:
          <br />
          {occupiedDisplay}
        </div>
      )}
    </button>
  );
}