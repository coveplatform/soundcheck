import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WhatsNextGuidance } from "@/types/dashboard";
import { ArrowRight, Sparkles } from "lucide-react";

export function WhatsNextCard({
  title,
  description,
  action,
  priority,
}: WhatsNextGuidance) {
  const gradientClass =
    priority === "high"
      ? "from-lime-50 via-white to-emerald-50"
      : priority === "medium"
      ? "from-amber-50 via-white to-yellow-50"
      : "from-purple-50 via-white to-indigo-50";

  return (
    <div className={`border-2 border-neutral-200 rounded-2xl bg-gradient-to-br ${gradientClass} shadow-sm`}>
      <div className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">
                What's Next
              </p>
              <p className="text-lg font-bold text-black mt-1">{title}</p>
              <p className="text-sm text-black/60 mt-1">{description}</p>
            </div>
          </div>
          <Link href={action.href}>
            <Button
              className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out motion-reduce:transition-none"
            >
              {action.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
