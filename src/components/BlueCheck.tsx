import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Blue verified badge (Twitter/IG-style). */
export function BlueCheck({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full bg-[#1D9BF0] text-white shadow-[0_0_0_2px_hsl(var(--background))]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Terverifikasi"
      title="Akun terverifikasi"
    >
      <Check className="h-[60%] w-[60%]" strokeWidth={4} />
    </span>
  );
}
