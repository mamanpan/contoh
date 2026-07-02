import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signOut } from "@/hooks/use-auth";
import { useUser, canPromoteToday, readFileAsDataURL, type UserProduct } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  BadgeCheck,
  Camera,
  Eye,
  Lock,
  LogOut,
  Mail,
  MousePointerClick,
  Plus,
  Rocket,
  Settings,
  Sparkles,
  X,
  Upload,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { BlueCheck } from "@/components/BlueCheck";
import { useSocial } from "@/hooks/use-social";
import { useBranding } from "@/hooks/use-branding";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

async function submitVerificationRequest() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Harus login dulu");
  const { error } = await supabase.from("verification_requests").insert({
    user_id: auth.user.id,
    status: "pending",
  });
  if (error) throw error;
  await supabase
    .from("profiles")
    .update({ verification_pending: true })
    .eq("id", auth.user.id);
}

async function submitSubscriptionRequest(proof: string, amount: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Harus login dulu");
  const { error } = await supabase.from("subscription_requests").insert({
    user_id: auth.user.id,
    proof_url: proof || null,
    amount,
    status: "pending",
  });
  if (error) throw error;
}

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil — AffiliHub" },
      { name: "description", content: "Kelola profil affiliate kamu." },
    ],
  }),
  component: ProfilePage,
});

type SheetKey =
  | null
  | "editName"
  | "addProduct"
  | "promotion"
  | "verify"
  | "password"
  | "contact"
  | "subscribe"
  | "settings";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, ready } = useUser();
  const social = useSocial();
  const branding = useBranding();
  const subscriptionPrice = branding.subscriptionPrice ?? 10000;
  const priceLabel = `Rp ${subscriptionPrice.toLocaleString("id-ID")}`;
  const [sheet, setSheet] = useState<SheetKey>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  if (!ready) return <div className="min-h-screen bg-background" />;

  const logout = async () => {
    await signOut();
    toast.success("Berhasil keluar");
    navigate({ to: "/login" });
  };

  const pickImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "avatar" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Ukuran maksimum 4MB");
      return;
    }
    const url = await readFileAsDataURL(file);
    setUser({ [key]: url });
    toast.success(key === "avatar" ? "Foto profil diperbarui" : "Foto sampul diperbarui");
    e.target.value = "";
  };

  const promo = canPromoteToday(user);

  return (
    <div className="min-h-screen bg-background pb-28">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e, "avatar")} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e, "cover")} />

      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/40 to-black">
        {user.cover ? (
          <img src={user.cover} alt="Sampul" className="h-full w-full object-cover" />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80&auto=format&fit=crop"
            alt="Sampul default"
            className="h-full w-full object-cover opacity-70"
          />
        )}
        <button
          onClick={() => coverRef.current?.click()}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
          aria-label="Ganti foto sampul"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar + info */}
      <div className="mx-auto -mt-12 max-w-6xl px-4">
        <div className="flex items-end justify-between">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-card">
              {user.avatar ? (
                <img src={user.avatar} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-secondary text-2xl font-black text-muted-foreground">
                  {(user.displayName || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
              aria-label="Ganti foto profil"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={() => setSheet("editName")}
            className="group flex items-center gap-1.5 text-left"
          >
            <h1 className="text-xl font-extrabold group-hover:underline">
              {user.displayName || "Isi nama kamu"}
            </h1>
            {user.verified && <BlueCheck size={20} />}
          </button>
          <p className="text-xs text-muted-foreground">
            @{user.username || "username"} · Gabung{" "}
            {new Date(user.joinedAt || Date.now()).getFullYear()}
          </p>
          {!user.verified && user.verificationPending && (
            <p className="mt-1 text-[11px] font-semibold text-[#1D9BF0]">
              Pengajuan centang biru sedang ditinjau admin
            </p>
          )}

          {/* Followers / Pesan / Following */}
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/friends" className="hover:underline">
              <span className="font-extrabold text-foreground">{social.followers.length}</span>{" "}
              <span className="text-muted-foreground">Pengikut</span>
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link to="/friends" search={{ tab: "chat" } as never} className="hover:underline">
              <span className="font-extrabold text-foreground">{social.conversations.length}</span>{" "}
              <span className="text-muted-foreground">Pesan</span>
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link to="/friends" className="hover:underline">
              <span className="font-extrabold text-foreground">{social.following.length}</span>{" "}
              <span className="text-muted-foreground">Mengikuti</span>
            </Link>
            <Link
              to="/friends"
              className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary"
            >
              Cari
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3">
          <Stat icon={<Eye className="h-4 w-4" />} label="View" value={fmt(user.stats.views)} />
          <Stat icon={<MousePointerClick className="h-4 w-4" />} label="Klik" value={fmt(user.stats.clicks)} />
          <Stat
            icon={<Sparkles className="h-4 w-4" />}
            label="Produk"
            value={`${user.products.length}${user.subscribed ? "" : ` / ${5}`}`}
          />
        </div>

        {/* Subscription banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 to-transparent p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Premium</p>
              <h3 className="mt-1 text-base font-extrabold">Promosi Tanpa Batas</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {priceLabel} / bulan · unggah bukti transfer
              </p>
              {user.subscribed && (
                <p className="mt-1 text-[11px] font-bold text-primary">
                  Aktif hingga {new Date(user.subscriptionUntil).toLocaleDateString("id-ID")}
                </p>
              )}
              {user.subscriptionPending && (
                <p className="mt-1 text-[11px] font-bold text-yellow-400">
                  Menunggu konfirmasi admin
                </p>
              )}
            </div>
            <button
              onClick={() => setSheet("subscribe")}
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              {user.subscribed ? "Kelola" : "Berlangganan"}
            </button>
          </div>
        </motion.div>

        {/* My products */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Produk Saya ({user.products.length})</h2>
            <button
              onClick={() => setSheet("addProduct")}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground"
            >
              <Plus className="h-3 w-3" /> Tambah
            </button>
          </div>
          {user.products.length === 0 ? (
            <p className="rounded-xl bg-secondary p-4 text-center text-xs text-muted-foreground">
              Belum ada produk. Klik <b>Tambah</b> untuk mulai jualan.
            </p>
          ) : (
            <div className="space-y-2">
              {user.products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-2"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{p.description}</p>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary"
                    >
                      <ExternalLink className="h-3 w-3" /> {p.platform}
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      setUser({ products: user.products.filter((x) => x.id !== p.id) });
                      toast.success("Produk dihapus");
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-background hover:text-primary"
                    aria-label="Hapus produk"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Kuota promosi hari ini:{" "}
            <b>
              {user.subscribed ? "Tanpa batas" : `${promo.used} / ${promo.limit}`}
            </b>
          </p>
        </section>

        {/* Actions */}
        <div className="mt-5 grid gap-2">
          <ActionRow
            icon={<Rocket className="h-4 w-4" />}
            title="Ajukan Promosi"
            desc={user.subscribed ? "Aktif tanpa batas" : `Sisa hari ini: ${Math.max(0, promo.limit - promo.used)} / ${promo.limit}`}
            onClick={() => setSheet("promotion")}
          />
          <ActionRow
            icon={<BadgeCheck className="h-4 w-4 text-[#1D9BF0]" />}
            title="Ajukan Centang Biru"
            desc={
              user.verified
                ? "Sudah terverifikasi ✓"
                : user.verificationPending
                  ? "Sedang ditinjau admin"
                  : "Verifikasi tanpa KTP"
            }
            onClick={() => setSheet("verify")}
          />
          <ActionRow
            icon={<Lock className="h-4 w-4" />}
            title="Ubah Password"
            desc="Keamanan akun"
            onClick={() => setSheet("password")}
          />
          <ActionRow
            icon={<Mail className="h-4 w-4" />}
            title="Ubah Email / Nomor WA"
            desc="Kontak akun"
            onClick={() => setSheet("contact")}
          />
          <ActionRow
            icon={<Settings className="h-4 w-4" />}
            title="Pengaturan Lain"
            desc="Preferensi & notifikasi"
            onClick={() => setSheet("settings")}
          />
        </div>
      </div>

      <BottomNav />

      <AnimatePresence>
        {sheet && (
          <Sheet title={sheetTitle(sheet)} onClose={() => setSheet(null)}>
            {sheet === "editName" && (
              <EditNameForm
                initial={{ displayName: user.displayName, username: user.username }}
                onSave={(v) => {
                  setUser(v);
                  toast.success("Profil diperbarui");
                  setSheet(null);
                }}
              />
            )}
            {sheet === "addProduct" && (
              <AddProductForm
                onSubmit={async (data) => {
                  const newProd: UserProduct = {
                    id: "up_" + Date.now(),
                    createdAt: Date.now(),
                    ...data,
                  };
                  setUser({ products: [newProd, ...user.products] });
                  toast.success("Produk ditambahkan");
                  setSheet(null);
                }}
              />
            )}
            {sheet === "promotion" && (
              <PromotionForm
                products={user.products}
                canPromote={promo.ok}
                subscribed={user.subscribed}
                usage={`${promo.used} / ${promo.limit === Infinity ? "∞" : promo.limit}`}
                onSubmit={(pid) => {
                  if (!promo.ok) {
                    toast.error("Kuota harian habis. Berlangganan untuk tanpa batas.");
                    return;
                  }
                  setUser({
                    promotions: [
                      ...user.promotions,
                      { productId: pid, at: Date.now(), status: "pending" },
                    ],
                  });
                  toast.success("Pengajuan promosi terkirim");
                  setSheet(null);
                }}
              />
            )}
            {sheet === "verify" && (
              <VerifyForm
                verified={user.verified}
                pending={user.verificationPending}
                onSubmit={async () => {
                  try {
                    await submitVerificationRequest();
                    setUser({ verificationPending: true });
                    toast.success("Pengajuan centang biru dikirim ke admin");
                    setSheet(null);
                  } catch (e: any) {
                    toast.error(e?.message || "Gagal mengirim pengajuan");
                  }
                }}
              />
            )}
            {sheet === "password" && (
              <PasswordForm
                currentPassword={user.password}
                onSave={(p) => {
                  setUser({ password: p });
                  toast.success("Password berhasil diubah");
                  setSheet(null);
                }}
              />
            )}
            {sheet === "contact" && (
              <ContactForm
                initial={{ email: user.email, whatsapp: user.whatsapp }}
                onSave={(v) => {
                  setUser(v);
                  toast.success("Kontak diperbarui");
                  setSheet(null);
                }}
              />
            )}
            {sheet === "subscribe" && (
              <SubscribeForm
                subscribed={user.subscribed}
                pending={user.subscriptionPending}
                until={user.subscriptionUntil}
                priceLabel={priceLabel}
                onSubmit={async (proof) => {
                  try {
                    await submitSubscriptionRequest(proof, subscriptionPrice);
                    setUser({
                      subscriptionPending: true,
                      subscriptionProof: proof,
                    });
                    toast.success("Bukti transfer terkirim. Menunggu ACC admin.");
                    setSheet(null);
                  } catch (e: any) {
                    toast.error(e?.message || "Gagal mengirim pengajuan");
                  }
                }}
              />
            )}
            {sheet === "settings" && (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Preferensi & notifikasi akan tersedia setelah backend aktif.
                </p>
                <button
                  onClick={async () => {
                    if (confirm("Hapus semua data akun lokal & keluar?")) {
                      localStorage.removeItem("affilihub:user");
                      await signOut();
                      navigate({ to: "/login" });
                    }
                  }}
                  className="w-full rounded-xl border border-destructive/40 py-2.5 text-sm font-bold text-destructive"
                >
                  Reset & Hapus Akun
                </button>
              </div>
            )}
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function sheetTitle(s: NonNullable<SheetKey>): string {
  return {
    editName: "Ubah Nama & Username",
    addProduct: "Tambah Produk Affiliate",
    promotion: "Ajukan Promosi",
    verify: "Ajukan Centang Biru",
    password: "Ubah Password",
    contact: "Ubah Email / WhatsApp",
    subscribe: "Berlangganan Premium",
    settings: "Pengaturan",
  }[s];
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

/* ---------------- Sheet shell ---------------- */
function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-[var(--shadow-hover)] sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Forms ---------------- */
function EditNameForm({
  initial,
  onSave,
}: {
  initial: { displayName: string; username: string };
  onSave: (v: { displayName: string; username: string }) => void;
}) {
  const [v, set] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.displayName.trim() || !v.username.trim()) return toast.error("Isi semua kolom");
        onSave({ displayName: v.displayName.trim(), username: v.username.replace(/^@/, "").trim() });
      }}
      className="space-y-2"
    >
      <Input label="Nama tampilan" value={v.displayName} onChange={(x) => set({ ...v, displayName: x })} />
      <Input label="Username" value={v.username} onChange={(x) => set({ ...v, username: x })} />
      <Submit>Simpan</Submit>
    </form>
  );
}

function AddProductForm({
  onSubmit,
}: {
  onSubmit: (v: Omit<UserProduct, "id" | "createdAt">) => void;
}) {
  const [v, set] = useState({
    name: "",
    description: "",
    link: "",
    platform: "Shopee" as UserProduct["platform"],
    image: "",
  });
  const ref = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.name.trim() || !v.description.trim() || !v.link.trim()) {
          toast.error("Nama, deskripsi & link wajib diisi");
          return;
        }
        onSubmit(v);
      }}
      className="space-y-2"
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = await readFileAsDataURL(f);
          set({ ...v, image: url });
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary py-6 text-xs font-semibold text-muted-foreground"
      >
        {v.image ? (
          <img src={v.image} alt="Pratinjau" className="h-20 w-20 rounded-lg object-cover" />
        ) : (
          <>
            <Upload className="h-4 w-4" /> Upload foto produk
          </>
        )}
      </button>
      <Input label="Nama produk" value={v.name} onChange={(x) => set({ ...v, name: x })} />
      <Textarea
        label="Bio / Deskripsi"
        value={v.description}
        onChange={(x) => set({ ...v, description: x })}
      />
      <Input
        label="Link affiliate (Shopee / TikTok / dll)"
        value={v.link}
        onChange={(x) => set({ ...v, link: x })}
      />
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Platform</label>
        <select
          value={v.platform}
          onChange={(e) => set({ ...v, platform: e.target.value as UserProduct["platform"] })}
          className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none"
        >
          <option>Shopee</option>
          <option>TikTok</option>
          <option>Tokopedia</option>
          <option>Lazada</option>
        </select>
      </div>
      <Submit>Simpan Produk</Submit>
    </form>
  );
}

function PromotionForm({
  products,
  canPromote,
  subscribed,
  usage,
  onSubmit,
}: {
  products: UserProduct[];
  canPromote: boolean;
  subscribed: boolean;
  usage: string;
  onSubmit: (productId: string) => void;
}) {
  const [pid, setPid] = useState(products[0]?.id || "");
  if (products.length === 0) {
    return (
      <p className="rounded-xl bg-secondary p-4 text-center text-xs text-muted-foreground">
        Tambah produk dulu sebelum mengajukan promosi.
      </p>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!pid) return;
        onSubmit(pid);
      }}
      className="space-y-3"
    >
      <p className="text-[11px] text-muted-foreground">
        Kuota harian: <b className="text-foreground">{usage}</b>{" "}
        {subscribed && <span className="text-primary">(Premium aktif)</span>}
      </p>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Pilih produk</label>
        <select
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={!canPromote}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {canPromote ? "Ajukan Promosi" : "Kuota habis"}
      </button>
    </form>
  );
}

function VerifyForm({
  verified,
  pending,
  onSubmit,
}: {
  verified: boolean;
  pending: boolean;
  onSubmit: () => void;
}) {
  if (verified) {
    return (
      <div className="rounded-xl bg-[#1D9BF0]/10 p-4 text-center">
        <BlueCheck size={40} className="mx-auto" />
        <p className="mt-2 text-sm font-bold">Akun kamu sudah terverifikasi</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Centang biru gratis diberikan untuk kreator aktif atau yang berlangganan Premium.
        Pengajuan akan ditinjau admin (tanpa KTP).
      </p>
      <button
        disabled={pending}
        onClick={onSubmit}
        className="w-full rounded-xl bg-[#1D9BF0] py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Sedang ditinjau…" : "Kirim Pengajuan"}
      </button>
    </div>
  );
}

function PasswordForm({
  currentPassword,
  onSave,
}: {
  currentPassword: string;
  onSave: (p: string) => void;
}) {
  const [v, set] = useState({ cur: "", next: "", conf: "" });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (currentPassword && v.cur !== currentPassword) return toast.error("Password lama salah");
        if (v.next.length < 6) return toast.error("Minimal 6 karakter");
        if (v.next !== v.conf) return toast.error("Konfirmasi password tidak cocok");
        onSave(v.next);
      }}
      className="space-y-2"
    >
      <Input label="Password lama" type="password" value={v.cur} onChange={(x) => set({ ...v, cur: x })} />
      <Input label="Password baru" type="password" value={v.next} onChange={(x) => set({ ...v, next: x })} />
      <Input label="Konfirmasi" type="password" value={v.conf} onChange={(x) => set({ ...v, conf: x })} />
      <Submit>Simpan</Submit>
    </form>
  );
}

function ContactForm({
  initial,
  onSave,
}: {
  initial: { email: string; whatsapp: string };
  onSave: (v: { email: string; whatsapp: string }) => void;
}) {
  const [v, set] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
      className="space-y-2"
    >
      <Input label="Email" type="email" value={v.email} onChange={(x) => set({ ...v, email: x })} />
      <Input label="Nomor WhatsApp" value={v.whatsapp} onChange={(x) => set({ ...v, whatsapp: x })} />
      <Submit>Simpan</Submit>
    </form>
  );
}

function SubscribeForm({
  subscribed,
  pending,
  until,
  priceLabel,
  onSubmit,
}: {
  subscribed: boolean;
  pending: boolean;
  until: number;
  priceLabel: string;
  onSubmit: (proofDataUrl: string) => void;
}) {
  const [proof, setProof] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  if (subscribed) {
    return (
      <div className="rounded-xl bg-primary/10 p-4 text-center text-sm">
        <Sparkles className="mx-auto h-6 w-6 text-primary" />
        <p className="mt-2 font-bold">Premium aktif</p>
        <p className="text-[11px] text-muted-foreground">
          Berlaku hingga {new Date(until).toLocaleDateString("id-ID")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-secondary p-3 text-xs">
        <p className="font-bold">Transfer ke QRIS AffiliHub</p>
        <p className="text-muted-foreground">{priceLabel} / bulan</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = await readFileAsDataURL(f);
          setProof(url);
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary py-6 text-xs font-semibold text-muted-foreground"
      >
        {proof ? (
          <img src={proof} alt="Bukti" className="h-24 rounded-lg object-cover" />
        ) : (
          <>
            <Upload className="h-4 w-4" /> Upload bukti transfer
          </>
        )}
      </button>
      <button
        disabled={!proof || pending}
        onClick={() => onSubmit(proof)}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Menunggu ACC admin…" : "Kirim Bukti"}
      </button>
    </div>
  );
}

/* ---------------- Small UI ---------------- */
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
    >
      {children}
    </button>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
        {icon}
      </div>
      <p className="text-sm font-extrabold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionRow({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <span className="text-muted-foreground">›</span>
    </button>
  );
}
