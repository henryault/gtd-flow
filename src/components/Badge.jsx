export function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2">
      {count}
    </span>
  );
}
