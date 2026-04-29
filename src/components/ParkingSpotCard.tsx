import { CarFront } from 'lucide-react';
import type { Spot } from '../types/parking';

type Props = {
  spot: Spot;
  onClick: () => void;
};

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}



export default function ParkingSpotCard({ spot, onClick }: Props) {
  const isFree = spot.state === 'free';
  const isMine = spot.state === 'mine';
  const isOccupied = spot.state === 'occupied';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative min-h-[116px] overflow-hidden rounded-[24px] border px-2 py-3 text-center transition active:scale-[0.98]',
        isFree &&
          'border-[#e7eee7] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.05)] hover:border-[#31c48d]/40',
        isMine &&
          'border-[#4777ff]/30 bg-[#eef3ff] shadow-[0_14px_30px_rgba(71,119,255,0.16)]',
        isOccupied &&
          'border-[#ededed] bg-[#f0f0ec] opacity-90',
      ].join(' ')}
    >
      <div className="mb-2 text-[11px] font-black text-[#8b8b84]">
        {toPersianDigits(spot.code)}
      </div>

      <div
        className={[
          'mx-auto flex h-14 w-14 items-center justify-center rounded-[18px]',
          isFree && 'bg-[#edfff8] text-[#31c48d]',
          isMine && 'bg-[#4777ff] text-white',
          isOccupied && 'bg-[#dfdfd8] text-[#77776f]',
        ].join(' ')}
      >
        <CarFront className="h-8 w-8" />
      </div>

      <div className="mt-2 text-[11px] font-black">
        {isFree && <span className="text-[#31c48d]">خالی</span>}
        {isMine && <span className="text-[#4777ff]">جایگاه من</span>}
        {isOccupied && <span className="text-[#9a9a92]">پر</span>}
      </div>

      {isMine && (
        <div className="absolute bottom-2 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-[#4777ff]" />
      )}
    </button>
  );
}