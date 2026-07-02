import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { BannerSlider } from "@/components/BannerSlider";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { PRODUCTS } from "@/lib/affiliate-data";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AffiliHub — Marketplace Affiliate Kreator Indonesia" },
      {
        name: "description",
        content:
          "Temukan produk affiliate terbaik dari Shopee, TikTok, dan Tokopedia. Cuan dari setiap klik.",
      },
      { property: "og:title", content: "AffiliHub" },
      { property: "og:description", content: "Marketplace affiliate kreator Indonesia." },
    ],
  }),
  component: Home,
});

function Home() {
  const { authed, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!authed) return <AuthGate />;
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <button
            aria-label="Notifikasi"
            className="grid h-10 w-10 place-items-center rounded-full bg-card"
          >
            <Bell className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-4">
        <BannerSlider />

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-extrabold">Produk Pilihan</h2>
              <p className="text-xs text-muted-foreground">Rekomendasi terlaris hari ini</p>
            </div>
            <span className="text-xs font-semibold text-primary">Lihat semua →</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
            {PRODUCTS.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
