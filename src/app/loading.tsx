import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-150">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      <p className="text-sm text-neutral-500">Loading...</p>
    </div>
  );
}
