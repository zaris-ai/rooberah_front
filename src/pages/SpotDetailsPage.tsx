import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  SquareParking,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import MiniAppLayout from '../layouts/MiniAppLayout';
import { parkingApi } from '../lib/mockApi';
import type { ActiveSession, Spot, Unit } from '../types/parking';

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function formatPersianDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function formatPersianTime(date: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getSpotStatusLabel(state: Spot['state']) {
  switch (state) {
    case 'free':
      return 'خالی';
    case 'mine':
      return 'جایگاه من';
    case 'occupied':
      return 'اشغال‌شده';
    default:
      return 'نامشخص';
  }
}

function getSpotStatusDescription(state: Spot['state']) {
  switch (state) {
    case 'free':
      return 'خالی و قابل انتخاب';
    case 'mine':
      return 'جایگاه فعال شما';
    case 'occupied':
      return 'پر و غیرقابل انتخاب';
    default:
      return 'وضعیت نامشخص';
  }
}

function normalizeApiMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return '';

  if (
    normalized.includes('entered') ||
    normalized.includes('enter') ||
    normalized.includes('success')
  ) {
    return 'ورود شما با موفقیت ثبت شد.';
  }

  if (
    normalized.includes('exit') ||
    normalized.includes('left') ||
    normalized.includes('logout')
  ) {
    return 'خروج شما با موفقیت ثبت شد.';
  }

  return message;
}

export default function SpotDetailsPage() {
  const { unitId, spotId } = useParams();
  const navigate = useNavigate();

  const uid = Number(unitId);
  const sid = Number(spotId);

  const [units, setUnits] = useState<Unit[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === uid) || null,
    [units, uid],
  );

  const selectedSpot = useMemo(
    () => spots.find((spot) => spot.id === sid) || null,
    [spots, sid],
  );

  const loadData = async () => {
    if (!uid || Number.isNaN(uid) || !sid || Number.isNaN(sid)) {
      setError('شناسه واحد یا جایگاه معتبر نیست.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [unitList, spotList, session] = await Promise.all([
        parkingApi.getUnits(),
        parkingApi.getSpots(uid),
        parkingApi.getActiveSession(),
      ]);

      setUnits(unitList);
      setSpots(spotList);
      setActiveSession(session);
    } catch (err) {
      setUnits([]);
      setSpots([]);
      setActiveSession(null);
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات جایگاه.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid, sid]);

  const handleEnter = async () => {
    try {
      setActionLoading(true);
      setMessage('');
      setError('');

      const result = await parkingApi.enter(uid, sid);

      setMessage(normalizeApiMessage(result.message));
      await loadData();
    } catch (err) {
      setMessage('');
      setError(err instanceof Error ? err.message : 'خطا در ثبت ورود.');
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleExit = async () => {
    try {
      setActionLoading(true);
      setMessage('');
      setError('');

      const result = await parkingApi.exit();

      setMessage(normalizeApiMessage(result.message));
      await loadData();
    } catch (err) {
      setMessage('');
      setError(err instanceof Error ? err.message : 'خطا در ثبت خروج.');
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MiniAppLayout
        title="جزئیات جایگاه"
        subtitle="در حال دریافت اطلاعات"
        rightAction={
          <button
            type="button"
            onClick={() => navigate(`/units/${uid}/spots`)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            aria-label="بازگشت به لیست جایگاه‌ها"
          >
            <ArrowRight className="h-5 w-5 text-[#222]" />
          </button>
        }
      >
        <LoadingBlock text="در حال دریافت جزئیات جایگاه..." />
      </MiniAppLayout>
    );
  }

  if (error && !selectedSpot) {
    return (
      <MiniAppLayout
        title="جزئیات جایگاه"
        subtitle="خطا در دریافت اطلاعات"
        rightAction={
          <button
            type="button"
            onClick={() => navigate(`/units/${uid}/spots`)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            aria-label="بازگشت به لیست جایگاه‌ها"
          >
            <ArrowRight className="h-5 w-5 text-[#222]" />
          </button>
        }
      >
        <ErrorBlock message={error} onRetry={loadData} />
      </MiniAppLayout>
    );
  }

  if (!selectedSpot || !selectedUnit) {
    return (
      <MiniAppLayout
        title="جزئیات جایگاه"
        subtitle="جایگاه پیدا نشد"
        rightAction={
          <button
            type="button"
            onClick={() => navigate(`/units/${uid}/spots`)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            aria-label="بازگشت به لیست جایگاه‌ها"
          >
            <ArrowRight className="h-5 w-5 text-[#222]" />
          </button>
        }
      >
        <div className="rounded-[28px] bg-white p-6 text-center text-sm font-bold text-[#9a9a92] shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
          جایگاه موردنظر پیدا نشد.
        </div>
      </MiniAppLayout>
    );
  }

  const isFree = selectedSpot.state === 'free';
  const isMine = selectedSpot.state === 'mine';
  const isOccupied = selectedSpot.state === 'occupied';
  const hasOtherActiveSession = !!activeSession && !isMine;

  const entryTime =
    isMine && activeSession ? formatPersianTime(activeSession.enteredAt) : '—';

  return (
    <MiniAppLayout
      title="جزئیات جایگاه"
      subtitle="بررسی وضعیت و ثبت ورود یا خروج"
      rightAction={
        <button
          type="button"
          onClick={() => navigate(`/units/${uid}/spots`)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          aria-label="بازگشت به لیست جایگاه‌ها"
        >
          <ArrowRight className="h-5 w-5 text-[#222]" />
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

      {hasOtherActiveSession && (
        <div className="mb-4 rounded-[22px] bg-[#fff7e6] px-4 py-3 text-sm font-black leading-7 text-[#b7791f]">
          شما هم‌اکنون یک جایگاه فعال دارید. برای انتخاب جایگاه جدید، ابتدا از بخش «پارکینگ من» خروج را ثبت کنید.
        </div>
      )}

      <section className="mb-4 rounded-[34px] bg-[#eeeeea] p-5 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-[30px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <SquareParking className="h-14 w-14 text-[#4777ff]" />
        </div>

        <div className="text-xs font-black text-[#9a9a92]">جایگاه انتخابی</div>

        <div className="mt-2 text-5xl font-black tracking-[-0.06em] text-[#151515]">
          {toPersianDigits(selectedSpot.code)}
        </div>

        <div className="mt-2 text-sm font-bold text-[#7d7d76]">
          {selectedUnit.title}
        </div>

        <div
          className={[
            'mx-auto mt-4 w-fit rounded-full px-4 py-2 text-xs font-black',
            isFree && 'bg-[#edfff8] text-[#31c48d]',
            isMine && 'bg-[#eef3ff] text-[#4777ff]',
            isOccupied && 'bg-[#f7eeee] text-[#d9534f]',
          ].join(' ')}
        >
          {getSpotStatusDescription(selectedSpot.state)}
        </div>
      </section>

      <section className="mb-5 space-y-3 rounded-[34px] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
        <InfoRow
          icon={<SquareParking className="h-5 w-5" />}
          label="وضعیت"
          value={getSpotStatusLabel(selectedSpot.state)}
        />

        <InfoRow
          icon={<CalendarDays className="h-5 w-5" />}
          label="واحد"
          value={selectedUnit.title}
        />

        <InfoRow
          icon={<CalendarDays className="h-5 w-5" />}
          label="تاریخ امروز"
          value={formatPersianDate(new Date().toISOString())}
        />

        <InfoRow
          icon={<Clock3 className="h-5 w-5" />}
          label="زمان ورود"
          value={entryTime}
        />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleExit}
          disabled={!isMine || actionLoading}
          className="flex items-center justify-center gap-2 rounded-[24px] bg-[#fff0f0] px-4 py-4 text-base font-black text-[#d9534f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {actionLoading && isMine ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {actionLoading && isMine ? 'در حال خروج...' : 'ثبت خروج'}
        </button>

        <button
          type="button"
          onClick={handleEnter}
          disabled={!isFree || hasOtherActiveSession || actionLoading}
          className="flex items-center justify-center gap-2 rounded-[24px] bg-[#4777ff] px-4 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(71,119,255,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {actionLoading && isFree ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          {hasOtherActiveSession
            ? 'ابتدا خروج بزنید'
            : actionLoading && isFree
              ? 'در حال ثبت...'
              : 'ثبت ورود'}
        </button>
      </div>
    </MiniAppLayout>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[22px] bg-[#f7f7f3] px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white text-[#4777ff]">
          {icon}
        </div>

        <div className="text-xs font-black text-[#aaa9a1]">{label}</div>
      </div>

      <div className="text-sm font-black text-[#151515]">
        {toPersianDigits(value)}
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