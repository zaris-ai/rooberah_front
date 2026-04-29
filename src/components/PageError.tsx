import { AlertCircle, RefreshCw } from 'lucide-react';

type PageErrorProps = {
  message: string;
  onRetry?: () => void;
};

export default function PageError({ message, onRetry }: PageErrorProps) {
  return (
    <div className="rounded-[34px] bg-[#fff0f0] p-6 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-[#d9534f] shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
        <AlertCircle className="h-10 w-10" />
      </div>

      <div className="text-base font-black text-[#d9534f]">{message}</div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-[22px] bg-[#d9534f] px-5 py-3 text-sm font-black text-white"
        >
          <RefreshCw className="h-4 w-4" />
          تلاش دوباره
        </button>
      )}
    </div>
  );
}