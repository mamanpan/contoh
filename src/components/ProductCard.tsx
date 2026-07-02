import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageCircle, ExternalLink, X, Send, CornerDownRight } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/affiliate-data";
import { useProductComments } from "@/hooks/use-comments";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-hover)]"
      >
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
            {product.platform}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground">{product.seller}</p>
          <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="font-bold">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.reviews.toLocaleString("id-ID")})</span>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-secondary py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Tampilkan Semua
          </button>

          <a
            href={product.link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Beli Sekarang
          </a>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && <ProductDetail product={product} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function ProductDetail({ product, onClose }: { product: Product; onClose: () => void }) {
  const { list, addComment, addReply } = useProductComments(product.id);
  const { user } = useUser();
  const canReply =
    user.promotions.some((p) => p.status === "approved") ||
    (user.subscribed && user.subscriptionUntil > Date.now());

  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addComment({
      user: user.displayName || user.username || "Pengguna",
      text: text.trim(),
      rating,
    });
    setText("");
    setRating(5);
    toast.success("Komentar terkirim");
  };

  const submitReply = (cid: string) => {
    if (!replyText.trim()) return;
    addReply(cid, {
      user: user.displayName || user.username || "Pengguna",
      text: replyText.trim(),
    });
    setReplyText("");
    setReplyTo(null);
    toast.success("Balasan terkirim");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-[var(--shadow-hover)] sm:rounded-3xl"
      >
        <div className="relative">
          <img src={product.image} alt={product.name} className="h-56 w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground">
            {product.platform}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="text-lg font-extrabold">{product.name}</h2>
          <p className="text-xs text-muted-foreground">{product.seller}</p>

          <div className="mt-2 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-bold">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({product.reviews.toLocaleString("id-ID")} ulasan)
            </span>
          </div>

          <div className="mt-3 rounded-xl bg-secondary p-3">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Deskripsi
            </p>
            <p className="text-sm leading-relaxed text-foreground">{product.description}</p>
          </div>

          <a
            href={product.link}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
          >
            <ExternalLink className="h-4 w-4" /> Beli Sekarang
          </a>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Komentar ({list.length})</h3>
              {!canReply && (
                <span className="text-[10px] text-muted-foreground">
                  Balasan: khusus user promosi/premium
                </span>
              )}
            </div>

            <div className="mb-3 rounded-xl border border-border bg-secondary p-3">
              <div className="mb-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    aria-label={`Rating ${n}`}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        n <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={300}
                  placeholder="Tulis komentar kamu..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={submit}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"
                  aria-label="Kirim"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {list.length === 0 && (
                <p className="rounded-xl bg-secondary p-4 text-center text-xs text-muted-foreground">
                  Belum ada komentar. Jadilah yang pertama!
                </p>
              )}
              {list.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-secondary p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{c.user}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < c.rating
                                ? "fill-primary text-primary"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {timeAgo(c.at)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">{c.text}</p>

                  {c.replies.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-l-2 border-primary/40 pl-3">
                      {c.replies.map((r) => (
                        <div key={r.id} className="text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CornerDownRight className="h-3 w-3" />
                            <span className="font-bold text-foreground">{r.user}</span>
                            <span className="text-[10px]">· {timeAgo(r.at)}</span>
                          </div>
                          <p className="mt-0.5 text-foreground">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {canReply && (
                    <div className="mt-2">
                      {replyTo === c.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            maxLength={300}
                            placeholder="Balas..."
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none"
                          />
                          <button
                            onClick={() => submitReply(c.id)}
                            className="rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
                          >
                            Kirim
                          </button>
                          <button
                            onClick={() => {
                              setReplyTo(null);
                              setReplyText("");
                            }}
                            className="rounded-lg border border-border px-2 text-xs"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyTo(c.id)}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Balas
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}d lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}
