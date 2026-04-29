import { useEffect, useState } from 'react';
import { ArrowRight, CarFront, Clock3, LogOut, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MiniAppLayout from '../layouts/MiniAppLayout';
import { parkingApi } from '../lib/mockApi';
import type { ActiveSession } from '../types/parking';
import PageLoading from '../components/PageLoading';
import PageError from '../components/PageError';

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function formatPersianDateTime(date: string) {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function MyParkingPage() {
  const navigate = useNavigate();

  const [session, setSession] = useState<ActiveSession>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const active = await parkingApi.getActiveSession();

      setSession(active);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : 'خطا در دریافت وضعیت پارکینگ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExit = async () => {
    try {
      setActionLoading(true);
      setMessage('');
      setError('');

      const result = await parkingApi.exit();

      setMessage(result.message);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت خروج.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <MiniAppLayout
      title="پارکینگ من"
      subtitle="وضعیت فعلی جایگاه شما"
      rightAction={
        <button
          type="button"
          onClick={() => navigate('/units')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          aria-label="بازگشت به واحدها"
        >
          <ArrowRight className="h-5 w-5 text-[#222]" />
        </button>
      }
    >
      {loading ? (
        <PageLoading text="در حال بررسی جایگاه فعال شما..." />
      ) : error ? (
        <PageError message={error} onRetry={loadData} />
      ) : (
        <>
          {message && (
            <div className="mb-4 rounded-[22px] bg-[#edfff8] px-4 py-3 text-sm font-black text-[#1f9f73]">
              {message}
            </div>
          )}

          {!session ? (
            <section className="rounded-[34px] bg-[#eeeeea] p-6 text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[30px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                <CarFront className="h-14 w-14 text-[#b6b6ae]" />
              </div>

              <div className="text-2xl font-black tracking-[-0.04em]">
                جایگاه فعالی ندارید
              </div>

              <div className="mx-auto mt-3 max-w-[260px] text-sm font-bold leading-7 text-[#8b8b84]">
                از صفحه واحدها وارد پارکینگ شوید و یک جایگاه خالی انتخاب کنید.
              </div>

              <button
                type="button"
                onClick={() => navigate('/units')}
                className="mt-6 w-full rounded-[24px] bg-[#4777ff] px-4 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(71,119,255,0.3)]"
              >
                انتخاب جایگاه
              </button>
            </section>
          ) : (
            <section className="overflow-hidden rounded-[34px] bg-[#eeeeea] p-5">
              <div className="rounded-[30px] bg-white p-5 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#eef3ff] text-[#4777ff]">
                  <CarFront className="h-14 w-14" />
                </div>

                <div className="text-xs font-black text-[#9a9a92]">
                  جایگاه فعال شما
                </div>

                <div className="mt-2 text-6xl font-black tracking-[-0.07em] text-[#4777ff]">
                  {toPersianDigits(session.spotCode)}
                </div>

                <div className="mt-4 space-y-3 text-right">
                  <div className="flex items-center justify-between rounded-[22px] bg-[#f7f7f3] px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-black text-[#8b8b84]">
                      <MapPin className="h-5 w-5 text-[#4777ff]" />
                      واحد
                    </div>

                    <div className="text-sm font-black">{session.unitTitle}</div>
                  </div>

                  <div className="flex items-center justify-between rounded-[22px] bg-[#f7f7f3] px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-black text-[#8b8b84]">
                      <Clock3 className="h-5 w-5 text-[#4777ff]" />
                      زمان ورود
                    </div>

                    <div className="max-w-[160px] text-left text-xs font-black leading-6">
                      {formatPersianDateTime(session.enteredAt)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExit}
                disabled={actionLoading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[24px] bg-[#fff0f0] px-4 py-4 text-base font-black text-[#d9534f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
                {actionLoading ? 'در حال ثبت خروج...' : 'ثبت خروج'}
              </button>
            </section>
          )}
        </>
      )}
    </MiniAppLayout>
  );
}