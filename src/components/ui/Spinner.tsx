export default function Spinner({ texto }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-terra-700">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-salvia-500 border-t-transparent" />
      {texto && <span className="text-sm">{texto}</span>}
    </div>
  );
}
