import { Loader2 } from "lucide-react";

export default function SupportLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-150">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      <p className="mt-4 text-sm text-neutral-500">Loading...</p>
    </div>
  );
}
