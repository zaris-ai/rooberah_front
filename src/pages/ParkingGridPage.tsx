import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CarFront, Loader2, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MiniAppLayout from '../layouts/MiniAppLayout';
import { parkingApi } from '../lib/mockApi';
import type { ActiveSession, Spot, Unit } from '../types/parking';
import ParkingLegend from '../components/ParkingLegend';
import ParkingSpotCard from '../components/ParkingSpotCard';

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export default function ParkingGridPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const id = Number(unitId);

  const [units, setUnits] = useState<Unit[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === id) || null,
    [units, id],
  );

  const loadData = async () => {
    if (!id || Number.isNaN(id)) {
      setError('شناسه واحد پارکینگ معتبر نیست.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [unitList, spotList, session] = await Promise.all([
        parkingApi.getUnits(),
        parkingApi.getSpots(id),
        parkingApi.getActiveSession(),
      ]);

      setUnits(unitList);
      setSpots(spotList);
      setActiveSession(session);
    } catch (err) {
      setUnits([]);
      setSpots([]);
      setActiveSession(null);
      setError(err instanceof Error ? err.message : 'خطا در دریافت جایگاه‌ها.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const rows = useMemo(() => {
    const grouped: Record<number, Spot[]> = {};

    spots.forEach((spot) => {
      if (!grouped[spot.row]) grouped[spot.row] = [];
      grouped[spot.row].push(spot);
    });

    return Object.entries(grouped)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, items]) => items.sort((a, b) => a.col - b.col));
  }, [spots]);

  const freeCount = spots.filter((spot) => spot.state === 'free').length;
  const occupiedCount = spots.filter((spot) => spot.state === 'occupied').length;
  const mineCount = spots.filter((spot) => spot.state === 'mine').length;

  return (
    <MiniAppLayout
      title={selectedUnit?.title || 'جایگاه‌ها'}
      subtitle="انتخاب جایگاه پارکینگ"
      rightAction={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="به‌روزرسانی وضعیت جایگاه‌ها"
        >
          <RefreshCw
            className={[
              'h-5 w-5 text-[#4777ff]',
              loading ? 'animate-spin' : '',
            ].join(' ')}
          />
        </button>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/units')}
          className="inline-flex items-center gap-2 rounded-[18px] bg-white px-4 py-3 text-sm font-black shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </button>

        <Link
          to="/my-parking"
          className="inline-flex items-center gap-2 rounded-[18px] bg-[#eef3ff] px-4 py-3 text-sm font-black text-[#4777ff]"
        >
          <CarFront className="h-4 w-4" />
          پارکینگ من
        </Link>
      </div>

      {loading ? (
        <LoadingBlock text="در حال دریافت جایگاه‌ها..." />
      ) : error ? (
        <ErrorBlock message={error} onRetry={loadData} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatusCard label="خالی" value={freeCount} />
            <StatusCard label="پر" value={occupiedCount} />
            <StatusCard label="جایگاه من" value={mineCount} />
          </div>

          {activeSession && (
            <div className="mb-4 rounded-[28px] bg-[#eef3ff] p-4 shadow-[0_14px_30px_rgba(71,119,255,0.12)]">
              <div className="text-xs font-black text-[#4777ff]">
                جایگاه فعال شما
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black">
                    {toPersianDigits(activeSession.spotCode)}
                  </div>

                  <div className="mt-1 text-xs font-bold text-[#7d7d76]">
                    {activeSession.unitTitle}
                  </div>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#4777ff] text-white">
                  <CarFront className="h-8 w-8" />
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <ParkingLegend />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-[28px] bg-white p-8 text-center text-sm font-bold text-[#9a9a92] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              برای این واحد هنوز جایگاهی ثبت نشده است.
            </div>
          ) : (
            <div className="rounded-[34px] bg-[#eeeeea] p-4">
              <div className="mb-3 text-center text-xs font-black text-[#9a9a92]">
                ورودی پارکینگ
              </div>

              <div className="space-y-3">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-3 gap-3">
                    {row.map((spot) => (
                      <ParkingSpotCard
                        key={spot.id}
                        spot={spot}
                        onClick={() => navigate(`/units/${id}/spots/${spot.id}`)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-3 text-center text-xs font-black text-[#9a9a92]">
                خروجی پارکینگ
              </div>
            </div>
          )}
        </>
      )}
    </MiniAppLayout>
  );
}

function StatusCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] bg-white px-3 py-3 text-center shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="text-lg font-black text-[#151515]">
        {toPersianDigits(value)}
      </div>
      <div className="mt-1 text-[11px] font-bold text-[#9a9a92]">{label}</div>
    </div>
  );
}

function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="rounded-[34px] bg-[#eeeeea] p-8 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4777ff]" />
      </div>

      <div className="text-base font-black text-[#151515]">{text}</div>
      <div className="mt-2 text-xs font-bold text-[#9a9a92]">
        لطفاً چند لحظه صبر کنید
      </div>
    </div>
  );
}

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[34px] bg-[#fff0f0] p-6 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-[#d9534f] shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
        <AlertCircle className="h-10 w-10" />
      </div>

      <div className="text-base font-black text-[#d9534f]">{message}</div>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-[22px] bg-[#d9534f] px-5 py-3 text-sm font-black text-white"
      >
        <RefreshCw className="h-4 w-4" />
        تلاش دوباره
      </button>
    </div>
  );
}