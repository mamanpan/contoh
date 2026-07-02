import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBranding } from "@/hooks/use-branding";

export function BannerSlider() {
  const { banners } = useBranding();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % banners.length), 3500);
    return () => clearInterval(t);
  }, [banners.length]);

  useEffect(() => {
    if (i >= banners.length) setI(0);
  }, [banners.length, i]);

  if (banners.length === 0) return null;
  const b = banners[i] ?? banners[0];

  return (
    <div className="relative mx-auto aspect-[16/8] w-full max-w-6xl overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-soft)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={b.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img src={b.image} alt={b.title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <p className="mb-1 inline-block rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Promo
            </p>
            <h3 className="text-xl font-extrabold text-white sm:text-3xl">{b.title}</h3>
            <p className="mt-1 text-xs text-white/80 sm:text-sm">{b.subtitle}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-6 bg-primary" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
