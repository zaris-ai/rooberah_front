import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  RefreshCw,
  User,
} from 'lucide-react';
import MiniAppLayout from '../layouts/MiniAppLayout';
import { parkingApi } from '../lib/mockApi';
import type { Spot, Unit } from '../types/parking';

type SpotState = 'free' | 'mine' | 'occupied';

type ParkingSpotView = Spot & {
  state: SpotState | string;

  occupiedByTelegramUserId?: string | null;
  occupiedByUsername?: string | null;
  occupiedByFirstName?: string | null;
  occupiedByLastName?: string | null;
  occupiedByDisplayName?: string | null;
  occupiedEnteredAt?: string | null;

  enteredAt?: string | null;
  entered_at?: string | null;
};

type UnitSpotsMap = Record<number, ParkingSpotView[]>;

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function normalizeSpotsResponse(response: unknown): ParkingSpotView[] {
  if (Array.isArray(response)) {
    return response as ParkingSpotView[];
  }

  if (
    response &&
    typeof response === 'object' &&
    Array.isArray((response as { spots?: unknown }).spots)
  ) {
    return (response as { spots: ParkingSpotView[] }).spots;
  }

  return [];
}

function formatJalaliDateTime(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function isToday(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getSpotEnteredAt(spot: ParkingSpotView) {
  return spot.occupiedEnteredAt || spot.enteredAt || spot.entered_at || null;
}

function getOwnerDisplayName(spot: ParkingSpotView) {
  if (spot.state === 'mine') {
    return 'شما';
  }

  const displayName = String(spot.occupiedByDisplayName || '').trim();
  if (displayName) return displayName;

  const firstName = spot.occupiedByFirstName || '';
  const lastName = spot.occupiedByLastName || '';

  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;

  const username = spot.occupiedByUsername || '';

  if (username) {
    return username.startsWith('@') ? username : `@${username}`;
  }

  return 'نامشخص';
}

function getOwnerUsername(spot: ParkingSpotView) {
  const username = spot.occupiedByUsername || '';

  if (!username) return '';

  return username.startsWith('@') ? username : `@${username}`;
}

function getSpotStateLabel(state: string) {
  if (state === 'mine') return 'رزرو شما';
  if (state === 'occupied') return 'پر شده';
  return 'خالی';
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitSpots, setUnitSpots] = useState<UnitSpotsMap>({});

  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const allSpots = useMemo(() => {
    return Object.values(unitSpots).flat();
  }, [unitSpots]);

  const freeSpotsCount = allSpots.filter((spot) => spot.state === 'free').length;

  const occupiedSpotsCount = allSpots.filter(
    (spot) => spot.state === 'occupied',
  ).length;

  const mineSpotsCount = allSpots.filter((spot) => spot.state === 'mine').length;

  const firstFreeSpot = useMemo(() => {
    for (const unit of units) {
      const spot = unitSpots[unit.id]?.find((item) => item.state === 'free');

      if (spot) {
        return {
          unit,
          spot,
        };
      }
    }

    return null;
  }, [units, unitSpots]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const unitsData = await parkingApi.getUnits();

      const pairs = await Promise.all(
        unitsData.map(async (unit) => {
          const response = await parkingApi.getSpots(unit.id);
          const spots = normalizeSpotsResponse(response);

          return [unit.id, spots] as const;
        }),
      );

      setUnits(unitsData);
      setUnitSpots(Object.fromEntries(pairs));
    } catch (err) {
      setUnits([]);
      setUnitSpots({});
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات پارکینگ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnterSpot = async (spot: ParkingSpotView) => {
    try {
      setActionLoadingKey(`enter-${spot.id}`);
      setError('');
      setMessage('');

      const result = (await parkingApi.enter(spot.unitId, spot.id)) as
  | { message?: string }
  | undefined;

      setMessage(result?.message || 'جایگاه با موفقیت رزرو شد.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در رزرو جایگاه.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleExitSpot = async () => {
    try {
      setActionLoadingKey('exit-active-session');
      setError('');
      setMessage('');

      const result = (await parkingApi.exit()) as
  | { message?: string }
  | undefined;

      setMessage(result?.message || 'خروج شما با موفقیت ثبت شد.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت خروج.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleReserveFirstFreeSpot = async () => {
    if (!firstFreeSpot) {
      setError('در حال حاضر جایگاه خالی وجود ندارد.');
      return;
    }

    await handleEnterSpot(firstFreeSpot.spot);
  };

  return (
    <MiniAppLayout
      title="پارکینگ روبه‌راه"
      subtitle="نمایش همه جایگاه‌ها، وضعیت اشغال و رزرو سریع"
      rightAction={
        <button
          type="button"
          onClick={loadData}
          disabled={loading || !!actionLoadingKey}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] disabled:opacity-50"
          aria-label="به‌روزرسانی پارکینگ"
        >
          <RefreshCw className="h-5 w-5 text-[#4777ff]" />
        </button>
      }
    >
      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-[22px] bg-[#edfff8] px-4 py-3 text-sm font-black text-[#1f9f73]">
          <CheckCircle2 className="h-5 w-5" />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-[22px] bg-[#fff0f0] px-4 py-3 text-sm font-black text-[#d9534f]">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingBlock text="در حال دریافت اطلاعات پارکینگ..." />
      ) : (
        <>
          <section className="mb-4 rounded-[34px] bg-[#eeeeea] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-[#9a9a92]">
                  وضعیت کلی پارکینگ
                </div>

                <div className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  {toPersianDigits(freeSpotsCount)} جایگاه خالی
                </div>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-[#4777ff] shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                <Car className="h-9 w-9" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatusMiniCard label="خالی" value={freeSpotsCount} tone="free" />
              <StatusMiniCard label="پر" value={occupiedSpotsCount} tone="busy" />
              <StatusMiniCard label="رزرو من" value={mineSpotsCount} tone="mine" />
            </div>

            <button
              type="button"
              onClick={handleReserveFirstFreeSpot}
              disabled={!firstFreeSpot || !!actionLoadingKey}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#4777ff] px-4 py-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(71,119,255,0.25)] disabled:cursor-not-allowed disabled:bg-[#aaa9a1] disabled:shadow-none"
            >
              {actionLoadingKey.startsWith('enter-') ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              {firstFreeSpot
                ? `رزرو اولین جای خالی ${firstFreeSpot.unit.title}`
                : 'جایگاه خالی وجود ندارد'}
            </button>
          </section>

          {units.length === 0 ? (
            <EmptyUnitsBlock />
          ) : (
            <section className="space-y-5">
              {units.map((unit) => {
                const spots = unitSpots[unit.id] || [];

                const unitFreeCount = spots.filter(
                  (spot) => spot.state === 'free',
                ).length;

                const unitOccupiedCount = spots.filter(
                  (spot) => spot.state === 'occupied',
                ).length;

                const unitMineCount = spots.filter(
                  (spot) => spot.state === 'mine',
                ).length;

                const firstFreeUnitSpot = spots.find(
                  (spot) => spot.state === 'free',
                );

                return (
                  <section
                    key={unit.id}
                    className="rounded-[34px] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xl font-black tracking-[-0.03em]">
                          {unit.title}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#9a9a92]">
                          <Building2 className="h-3.5 w-3.5" />
                          {toPersianDigits(spots.length)} جایگاه
                        </div>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#eef3ff] text-[#4777ff]">
                        <Building2 className="h-7 w-7" />
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2">
                      <StatusMiniCard label="خالی" value={unitFreeCount} tone="free" />
                      <StatusMiniCard label="پر" value={unitOccupiedCount} tone="busy" />
                      <StatusMiniCard label="مال من" value={unitMineCount} tone="mine" />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        firstFreeUnitSpot && handleEnterSpot(firstFreeUnitSpot)
                      }
                      disabled={!firstFreeUnitSpot || !!actionLoadingKey}
                      className="mb-4 flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#eef3ff] px-4 py-3 text-xs font-black text-[#4777ff] disabled:cursor-not-allowed disabled:bg-[#f0f0ec] disabled:text-[#aaa9a1]"
                    >
                      {firstFreeUnitSpot &&
                      actionLoadingKey === `enter-${firstFreeUnitSpot.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {firstFreeUnitSpot
                        ? 'رزرو اولین جای خالی این واحد'
                        : 'این واحد جایگاه خالی ندارد'}
                    </button>

                    {spots.length === 0 ? (
                      <div className="rounded-[24px] bg-[#f7f7f3] p-5 text-center text-xs font-bold text-[#9a9a92]">
                        برای این واحد هنوز جایگاهی ثبت نشده است.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {spots.map((spot) => (
                          <SpotCard
                            key={spot.id}
                            spot={spot}
                            actionLoadingKey={actionLoadingKey}
                            onEnter={() => handleEnterSpot(spot)}
                            onExit={handleExitSpot}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </section>
          )}
        </>
      )}
    </MiniAppLayout>
  );
}

function StatusMiniCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'free' | 'busy' | 'mine';
}) {
  const toneClass =
    tone === 'free'
      ? 'bg-[#edfff8] text-[#1f9f73]'
      : tone === 'mine'
        ? 'bg-[#eef3ff] text-[#4777ff]'
        : 'bg-[#fff0f0] text-[#d9534f]';

  return (
    <div className={`rounded-[18px] px-3 py-3 text-center ${toneClass}`}>
      <div className="text-lg font-black">{toPersianDigits(value)}</div>
      <div className="mt-1 text-[11px] font-black">{label}</div>
    </div>
  );
}

function SpotCard({
  spot,
  actionLoadingKey,
  onEnter,
  onExit,
}: {
  spot: ParkingSpotView;
  actionLoadingKey: string;
  onEnter: () => void;
  onExit: () => void;
}) {
  const isFree = spot.state === 'free';
  const isMine = spot.state === 'mine';
  const isOccupied = spot.state === 'occupied';

  const enteredAt = getSpotEnteredAt(spot);
  const enteredAtIsToday = isToday(enteredAt);

  const ownerName = getOwnerDisplayName(spot);
  const ownerUsername = getOwnerUsername(spot);

  const statusClass = isMine
    ? 'bg-[#eef3ff] text-[#4777ff]'
    : isOccupied
      ? 'bg-[#fff0f0] text-[#d9534f]'
      : 'bg-[#edfff8] text-[#1f9f73]';

  return (
    <div
      className={[
        'rounded-[26px] border p-4',
        isMine
          ? 'border-[#4777ff]/20 bg-[#f6f8ff]'
          : isOccupied
            ? 'border-[#f3caca] bg-[#fffafa]'
            : 'border-[#d7f5e9] bg-[#fbfffd]',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-black text-[#151515]">
            جایگاه {spot.code}
          </div>

          <div className="mt-1 text-xs font-bold text-[#9a9a92]">
            ردیف {toPersianDigits(spot.row)} / ستون {toPersianDigits(spot.col)}
          </div>
        </div>

        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusClass}`}>
          {getSpotStateLabel(String(spot.state))}
        </span>
      </div>

      {isFree ? (
        <div className="mb-3 rounded-[20px] bg-white px-4 py-3 text-xs font-bold leading-6 text-[#1f9f73]">
          این جایگاه خالی است و می‌توانید آن را رزرو کنید.
        </div>
      ) : (
        <div className="mb-3 space-y-2 rounded-[20px] bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#151515]">
            <User className="h-4 w-4 text-[#9a9a92]" />
            <span>رزروکننده: {ownerName}</span>
          </div>

          {ownerUsername && (
            <div className="pr-6 text-xs font-bold text-[#9a9a92]">
              {ownerUsername}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-[#151515]">
            <Clock className="h-4 w-4 text-[#9a9a92]" />
            <span>زمان ورود: {formatJalaliDateTime(enteredAt)}</span>
          </div>

          {enteredAt && !enteredAtIsToday && (
            <div className="rounded-full bg-[#fff7e8] px-3 py-2 text-[11px] font-black text-[#b7791f]">
              این رزرو مربوط به امروز نیست؛ احتمالاً خروج ثبت نشده است.
            </div>
          )}
        </div>
      )}

      {isMine ? (
        <button
          type="button"
          onClick={onExit}
          disabled={!!actionLoadingKey}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#d9534f] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLoadingKey === 'exit-active-session' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          ثبت خروج از پارکینگ
        </button>
      ) : isFree ? (
        <button
          type="button"
          onClick={onEnter}
          disabled={!!actionLoadingKey}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#4777ff] px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(71,119,255,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLoadingKey === `enter-${spot.id}` ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
          رزرو این جایگاه
        </button>
      ) : null}
    </div>
  );
}

function EmptyUnitsBlock() {
  return (
    <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#eef3ff] text-[#4777ff]">
        <Building2 className="h-10 w-10" />
      </div>

      <div className="text-base font-black text-[#151515]">
        هنوز واحدی ثبت نشده است
      </div>

      <div className="mt-2 text-xs font-bold leading-6 text-[#9a9a92]">
        بعد از ثبت واحدهای پارکینگ در پنل مدیریت، اینجا نمایش داده می‌شوند.
      </div>
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

