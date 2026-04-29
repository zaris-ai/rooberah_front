import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  Loader2,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MiniAppLayout from '../layouts/MiniAppLayout';
import { parkingApi } from '../lib/mockApi';
import type { Unit } from '../types/parking';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await parkingApi.getUnits();

      setUnits(data);
    } catch (err) {
      setUnits([]);
      setError(err instanceof Error ? err.message : 'خطا در دریافت واحدها.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MiniAppLayout title="پارکینگ روبه‌راه" subtitle="بهترین جای پارک را انتخاب کنید">
      {loading ? (
        <LoadingBlock text="در حال دریافت واحدهای پارکینگ..." />
      ) : error ? (
        <ErrorBlock message={error} onRetry={loadData} />
      ) : (
        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">واحدها</h2>
            <span className="text-xs font-bold text-[#9a9a92]">
              انتخاب واحد
            </span>
          </div>

          {units.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {units.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => navigate(`/units/${unit.id}/spots`)}
                  className="flex w-full items-center justify-between rounded-[28px] bg-white p-4 text-right shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition active:scale-[0.98]"
                >
                  <ChevronLeft className="h-5 w-5 text-[#b6b6ae]" />

                  <div className="flex-1 px-4">
                    <div className="text-xl font-black tracking-[-0.03em]">
                      {unit.title}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#9a9a92]">
                      <MapPin className="h-3.5 w-3.5" />
                      نمایش جایگاه‌های {unit.title}
                    </div>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#eef3ff] text-[#4777ff]">
                    <Building2 className="h-8 w-8" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </MiniAppLayout>
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