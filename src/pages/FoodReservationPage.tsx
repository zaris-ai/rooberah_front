import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  Trash2,
  Utensils,
} from 'lucide-react';
import MiniAppLayout from '../layouts/MiniAppLayout';
import {
  foodApi,
  type FoodMenuDay,
  type FoodReservation,
} from '../lib/mockApi';

type FoodSlot = 'f1' | 'f2' | 'f3';
type PortionType = 'full' | 'half' | 'khorak';

type FoodMenuDayWithThirdOption = FoodMenuDay & {
  food3?: string | null;
};

const portionOptions: {
  type: PortionType;
  label: string;
  description: string;
}[] = [
  {
    type: 'full',
    label: 'پرس کامل',
    description: 'سفارش کامل',
  },
  {
    type: 'half',
    label: 'نیم پرس',
    description: 'حجم کمتر',
  },
  {
    type: 'khorak',
    label: 'خوراک',
    description: 'بدون برنج',
  },
];

const dayOrder = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنج شنبه'];

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function normalizeDay(day: string) {
  return day.replace('‌', ' ').trim();
}

function getReservationKey(dayOfWeek: string) {
  return normalizeDay(dayOfWeek);
}

function getFoodOptions(day: FoodMenuDayWithThirdOption): {
  slot: FoodSlot;
  title: string;
}[] {
  return [
    { slot: 'f1' as const, title: day.food1 },
    { slot: 'f2' as const, title: day.food2 },
    { slot: 'f3' as const, title: day.food3 },
  ]
    .filter(
      (item): item is { slot: FoodSlot; title: string } =>
        typeof item.title === 'string' && item.title.trim().length > 0,
    )
    .map((item) => ({
      slot: item.slot,
      title: item.title.trim(),
    }));
}

export default function FoodReservationPage() {
  const [menu, setMenu] = useState<FoodMenuDayWithThirdOption[]>([]);
  const [reservations, setReservations] = useState<FoodReservation[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const [menuData, reservationData] = await Promise.all([
        foodApi.getWeeklyMenu(),
        foodApi.getMyReservations(),
      ]);

      setMenu(menuData as FoodMenuDayWithThirdOption[]);
      setReservations(reservationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت برنامه غذایی.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedMenu = useMemo(() => {
    return [...menu].sort((a, b) => {
      const aIndex = dayOrder.indexOf(normalizeDay(a.dayOfWeek));
      const bIndex = dayOrder.indexOf(normalizeDay(b.dayOfWeek));

      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }, [menu]);

  const reservationMap = useMemo(() => {
    const map = new Map<string, FoodReservation>();

    reservations.forEach((reservation) => {
      map.set(getReservationKey(reservation.dayOfWeek), reservation);
    });

    return map;
  }, [reservations]);

  const reservedCount = reservations.length;
  const totalMenuDays = sortedMenu.length;

  const handleReserve = async (
    day: FoodMenuDayWithThirdOption,
    foodSlot: FoodSlot,
    portionType: PortionType,
  ) => {
    const dayKey = getReservationKey(day.dayOfWeek);
    const actionKey = `${dayKey}-${foodSlot}-${portionType}`;

    try {
      setActionLoadingKey(actionKey);
      setError('');
      setMessage('');

      const result = await foodApi.reserve({
        dayOfWeek: day.dayOfWeek,
        foodSlot,
        portionType,
      });

      setMessage(result.message);
      setExpandedDay(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت رزرو غذا.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleCancel = async (dayOfWeek: string) => {
    const dayKey = getReservationKey(dayOfWeek);

    try {
      setActionLoadingKey(`${dayKey}-cancel`);
      setError('');
      setMessage('');

      const result = await foodApi.cancel({ dayOfWeek });

      setMessage(result.message);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در لغو رزرو غذا.');
    } finally {
      setActionLoadingKey('');
    }
  };

  return (
    <MiniAppLayout
      title="رزرو غذا"
      subtitle="برنامه غذایی هفتگی و رزرو روزانه"
      rightAction={
        <button
          type="button"
          onClick={loadData}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          aria-label="به‌روزرسانی برنامه غذا"
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
        <LoadingBlock />
      ) : sortedMenu.length === 0 ? (
        <EmptyBlock onRetry={loadData} />
      ) : (
        <>
          <section className="mb-4 rounded-[34px] bg-[#eeeeea] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-[#9a9a92]">
                  وضعیت رزرو هفته
                </div>
                <div className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  {toPersianDigits(reservedCount)} از{' '}
                  {toPersianDigits(totalMenuDays)} روز
                </div>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-[#4777ff] shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                <Utensils className="h-9 w-9" />
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#4777ff]"
                style={{
                  width: `${
                    totalMenuDays ? (reservedCount / totalMenuDays) * 100 : 0
                  }%`,
                }}
              />
            </div>

            <div className="mt-3 text-xs font-bold leading-6 text-[#8b8b84]">
              برای هر روز می‌توانید یک غذا و نوع سفارش را انتخاب کنید. بعضی روزها
              دو گزینه و بعضی روزها تا سه گزینه غذا دارند. انتخاب جدید، رزرو قبلی
              همان روز را ویرایش می‌کند.
            </div>
          </section>

          <section className="space-y-4">
            {sortedMenu.map((day) => {
              const dayKey = getReservationKey(day.dayOfWeek);
              const reservation = reservationMap.get(dayKey);
              const isExpanded = expandedDay === dayKey;

              return (
                <FoodDayCard
                  key={`${day.dayOfWeek}-${day.food1}-${day.food2}-${day.food3 || ''}`}
                  day={day}
                  reservation={reservation}
                  isExpanded={isExpanded}
                  actionLoadingKey={actionLoadingKey}
                  onToggle={() => setExpandedDay(isExpanded ? null : dayKey)}
                  onReserve={handleReserve}
                  onCancel={handleCancel}
                />
              );
            })}
          </section>
        </>
      )}
    </MiniAppLayout>
  );
}

function FoodDayCard({
  day,
  reservation,
  isExpanded,
  actionLoadingKey,
  onToggle,
  onReserve,
  onCancel,
}: {
  day: FoodMenuDayWithThirdOption;
  reservation?: FoodReservation;
  isExpanded: boolean;
  actionLoadingKey: string;
  onToggle: () => void;
  onReserve: (
    day: FoodMenuDayWithThirdOption,
    foodSlot: FoodSlot,
    portionType: PortionType,
  ) => void;
  onCancel: (dayOfWeek: string) => void;
}) {
  const dayKey = getReservationKey(day.dayOfWeek);
  const canModify = day.canModify !== false;
  const foodOptions = getFoodOptions(day);

  return (
    <div
      className={[
        'overflow-hidden rounded-[30px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.05)]',
        !canModify ? 'opacity-90' : '',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-right"
      >
        <ChevronDown
          className={[
            'h-5 w-5 text-[#aaa9a1] transition',
            isExpanded ? 'rotate-180' : '',
          ].join(' ')}
        />

        <div className="flex-1 px-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xl font-black tracking-[-0.03em]">
              {day.dayOfWeek}
            </div>

            <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-[11px] font-black text-[#4777ff]">
              {toPersianDigits(foodOptions.length)} گزینه غذا
            </span>

            {reservation && (
              <span className="rounded-full bg-[#edfff8] px-3 py-1 text-[11px] font-black text-[#1f9f73]">
                رزرو شده
              </span>
            )}

            {!canModify && (
              <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-[11px] font-black text-[#d9534f]">
                بسته شده
              </span>
            )}
          </div>

          <div className="mt-1 text-xs font-bold leading-6 text-[#9a9a92]">
            {reservation
              ? `${reservation.food} - ${reservation.portionLabel}`
              : canModify
                ? 'برای این روز هنوز رزروی ثبت نشده است'
                : 'مهلت ثبت یا تغییر این روز تمام شده است'}
          </div>
        </div>

        <div
          className={[
            'flex h-14 w-14 items-center justify-center rounded-[20px]',
            canModify
              ? 'bg-[#eef3ff] text-[#4777ff]'
              : 'bg-[#f0f0ec] text-[#aaa9a1]',
          ].join(' ')}
        >
          <Utensils className="h-7 w-7" />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[#f0f0ec] px-4 pb-4">
          {!canModify && (
            <div className="mt-4 rounded-[20px] bg-[#fff7e8] px-4 py-3 text-xs font-black leading-6 text-[#b7791f]">
              مهلت ثبت، ویرایش یا لغو رزرو این روز تمام شده است.
            </div>
          )}

          {foodOptions.length === 0 ? (
            <div className="mt-4 rounded-[20px] bg-[#fff0f0] px-4 py-3 text-xs font-black leading-6 text-[#d9534f]">
              برای این روز غذایی ثبت نشده است.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {foodOptions.map((option) => (
                <FoodOption
                  key={option.slot}
                  day={day}
                  slot={option.slot}
                  title={option.title}
                  reservation={reservation}
                  actionLoadingKey={actionLoadingKey}
                  canModify={canModify}
                  onReserve={onReserve}
                />
              ))}
            </div>
          )}

          {reservation && (
            <button
              type="button"
              onClick={() => onCancel(day.dayOfWeek)}
              disabled={!canModify || actionLoadingKey === `${dayKey}-cancel`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#fff0f0] px-4 py-4 text-sm font-black text-[#d9534f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoadingKey === `${dayKey}-cancel` ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
              لغو رزرو این روز
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FoodOption({
  day,
  slot,
  title,
  reservation,
  actionLoadingKey,
  canModify,
  onReserve,
}: {
  day: FoodMenuDayWithThirdOption;
  slot: FoodSlot;
  title: string;
  reservation?: FoodReservation;
  actionLoadingKey: string;
  canModify: boolean;
  onReserve: (
    day: FoodMenuDayWithThirdOption,
    foodSlot: FoodSlot,
    portionType: PortionType,
  ) => void;
}) {
  const selected = reservation?.food === title;

  return (
    <div
      className={[
        'rounded-[24px] p-4',
        selected ? 'bg-[#eef3ff]' : 'bg-[#f7f7f3]',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-base font-black text-[#151515]">{title}</div>
          <div className="mt-1 text-xs font-bold text-[#9a9a92]">
            {selected ? 'غذای انتخاب‌شده شما' : 'انتخاب غذا'}
          </div>
        </div>

        {selected && (
          <span className="rounded-full bg-[#4777ff] px-3 py-1 text-[11px] font-black text-white">
            فعال
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {portionOptions.map((portion) => {
          const key = `${getReservationKey(day.dayOfWeek)}-${slot}-${portion.type}`;
          const isLoading = actionLoadingKey === key;
          const isSelectedPortion =
            selected && reservation?.portionType === portion.type;

          return (
            <button
              key={portion.type}
              type="button"
              onClick={() => onReserve(day, slot, portion.type)}
              disabled={!canModify || !!actionLoadingKey}
              className={[
                'min-h-[74px] rounded-[18px] px-2 py-3 text-center transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
                isSelectedPortion
                  ? 'bg-[#4777ff] text-white shadow-[0_10px_24px_rgba(71,119,255,0.25)]'
                  : 'bg-white text-[#151515]',
              ].join(' ')}
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="text-xs font-black">{portion.label}</div>
                  <div
                    className={[
                      'mt-1 text-[10px] font-bold',
                      isSelectedPortion ? 'text-white/75' : 'text-[#aaa9a1]',
                    ].join(' ')}
                  >
                    {portion.description}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="rounded-[34px] bg-[#eeeeea] p-8 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4777ff]" />
      </div>

      <div className="text-base font-black text-[#151515]">
        در حال دریافت برنامه غذایی...
      </div>

      <div className="mt-2 text-xs font-bold text-[#9a9a92]">
        لطفاً چند لحظه صبر کنید
      </div>
    </div>
  );
}

function EmptyBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[34px] bg-white p-8 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#eef3ff] text-[#4777ff]">
        <Utensils className="h-10 w-10" />
      </div>

      <div className="text-base font-black text-[#151515]">
        هنوز برنامه غذایی ثبت نشده است
      </div>

      <div className="mt-2 text-xs font-bold leading-6 text-[#9a9a92]">
        بعد از ثبت منوی هفته توسط ادمین، غذاها اینجا نمایش داده می‌شوند.
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-[22px] bg-[#4777ff] px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(71,119,255,0.25)]"
      >
        <RefreshCw className="h-4 w-4" />
        تلاش دوباره
      </button>
    </div>
  );
}