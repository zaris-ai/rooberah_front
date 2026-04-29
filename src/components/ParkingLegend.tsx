export default function ParkingLegend() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <LegendItem color="bg-[#31c48d]" label="خالی" />
      <LegendItem color="bg-[#4777ff]" label="جایگاه من" />
      <LegendItem color="bg-[#d6d6cf]" label="پر" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-[18px] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs font-black text-[#6f6f68]">{label}</span>
    </div>
  );
}