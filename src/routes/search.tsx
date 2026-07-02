import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { PRODUCTS } from "@/lib/affiliate-data";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Cari Produk — AffiliHub" },
      { name: "description", content: "Cari produk affiliate favoritmu." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { authed, ready } = useAuth();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return PRODUCTS;
    const s = q.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.seller.toLowerCase().includes(s) ||
        p.platform.toLowerCase().includes(s),
    );
  }, [q]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!authed) return <AuthGate />;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Logo />
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-card px-4 py-2 shadow-[var(--shadow-soft)]">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari produk, kreator, atau platform..."
              className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{results.length}</span> produk ditemukan
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
