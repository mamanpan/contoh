import { useBranding } from "@/hooks/use-branding";

export function Logo() {
  const b = useBranding();
  return (
    <div className="flex items-center gap-2">
      <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-primary shadow-[var(--shadow-soft)]">
        {b.logoImage ? (
          <img src={b.logoImage} alt="Logo" className="h-full w-full object-cover" />
        ) : (
          <>
            <span className="text-lg font-black text-primary-foreground">
              {(b.brandName || "A").charAt(0).toUpperCase()}
            </span>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-white" />
          </>
        )}
      </div>
      <div className="leading-tight">
        <p className="text-base font-extrabold tracking-tight text-foreground">
          {b.brandName}
          <span className="text-primary">{b.brandAccent}</span>
        </p>
        <p className="text-[10px] font-medium text-muted-foreground">{b.tagline}</p>
      </div>
    </div>
  );
}
