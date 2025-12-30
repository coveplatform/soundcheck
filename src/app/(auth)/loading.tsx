import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLoading() {
  return (
    <Card className="animate-in fade-in duration-150">
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </CardContent>
    </Card>
  );
}
