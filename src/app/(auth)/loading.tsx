import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
    </div>
  );
}
