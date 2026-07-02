import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Shield,
  Users,
  BadgeCheck,
  Rocket,
  CreditCard,
  Ban,
  QrCode,
  TrendingUp,
  X,
  Upload,
  Check,
  Camera,
  Image as ImageIcon,
  Images,
  Trash2,
  Plus,
  Home as HomeIcon,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getUser, setUser as setUserProfile, readFileAsDataURL } from "@/hooks/use-user";
import {
  useBranding,
  setBranding,
  type BannerItem,
} from "@/hooks/use-branding";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AffiliHub" },
      { name: "description", content: "Panel admin AffiliHub." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

/* ---------- admin local store ---------- */
type AdminState = {
  username: string;
  password: string;
  email: string;
  whatsapp: string;
  avatar: string;
  cover: string;
  qrImage: string;
  bannedUsernames: string[];
};

const AKEY = "affilihub:admin";
const SKEY = "affilihub:admin-session";

const DEFAULT_ADMIN: AdminState = {
  username: "rajathuin22",
  password: "Cuan77@@",
  email: "",
  whatsapp: "",
  avatar: "",
  cover: "",
  qrImage: "",
  bannedUsernames: [],
};


function readAdmin(): AdminState {
  try {
    const raw = localStorage.getItem(AKEY);
    if (!raw) return DEFAULT_ADMIN;
    return { ...DEFAULT_ADMIN, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ADMIN;
  }
}
function writeAdmin(s: AdminState) {
  localStorage.setItem(AKEY, JSON.stringify(s));
  window.dispatchEvent(new Event("affilihub:admin-change"));
}

type Pending = {
  id: string;
  requestId: string;
  userId: string;
  user: string;
  type: "Promosi" | "Centang Biru" | "Langganan";
  at: number;
  meta?: { productId?: string; proof?: string };
};

async function fetchPending(): Promise<Pending[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const [v, s, pr] = await Promise.all([
    supabase.from("verification_requests").select("id,user_id,created_at").eq("status", "pending"),
    supabase.from("subscription_requests").select("id,user_id,created_at,proof_url").eq("status", "pending"),
    supabase.from("promotion_requests").select("id,user_id,created_at,product_id").eq("status", "pending"),
  ]);
  const ids = new Set<string>();
  (v.data ?? []).forEach((r: any) => ids.add(r.user_id));
  (s.data ?? []).forEach((r: any) => ids.add(r.user_id));
  (pr.data ?? []).forEach((r: any) => ids.add(r.user_id));
  const profileMap = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,username,display_name")
      .in("id", Array.from(ids));
    (profs ?? []).forEach((p: any) => {
      profileMap.set(p.id, "@" + (p.username || p.display_name || p.id.slice(0, 6)));
    });
  }
  const rows: Pending[] = [];
  (v.data ?? []).forEach((r: any) =>
    rows.push({
      id: "v_" + r.id,
      requestId: r.id,
      userId: r.user_id,
      user: profileMap.get(r.user_id) || "@user",
      type: "Centang Biru",
      at: new Date(r.created_at).getTime(),
    }),
  );
  (s.data ?? []).forEach((r: any) =>
    rows.push({
      id: "s_" + r.id,
      requestId: r.id,
      userId: r.user_id,
      user: profileMap.get(r.user_id) || "@user",
      type: "Langganan",
      at: new Date(r.created_at).getTime(),
      meta: { proof: r.proof_url },
    }),
  );
  (pr.data ?? []).forEach((r: any) =>
    rows.push({
      id: "p_" + r.id,
      requestId: r.id,
      userId: r.user_id,
      user: profileMap.get(r.user_id) || "@user",
      type: "Promosi",
      at: new Date(r.created_at).getTime(),
      meta: { productId: r.product_id },
    }),
  );
  return rows.sort((a, b) => b.at - a.at);
}

/* ---------- page ---------- */
function AdminPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem(SKEY) === "1");
    } catch {}
  }, []);

  const onOk = () => {
    try {
      sessionStorage.setItem(SKEY, "1");
    } catch {}
    setAuthed(true);
  };
  const onOut = () => {
    try {
      sessionStorage.removeItem(SKEY);
    } catch {}
    setAuthed(false);
  };

  if (!authed) return <AdminLogin onOk={onOk} />;
  return <AdminDashboard onLogout={onOut} />;
}

/* ---------- dashboard ---------- */
type SheetKey =
  | null
  | "verify"
  | "promotion"
  | "ban"
  | "qr"
  | "credentials"
  | "profile"
  | "logo"
  | "banner"
  | "price";

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [admin, setAdmin] = useState<AdminState>(readAdmin);
  const [pending, setPending] = useState<Pending[]>([]);
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<"home" | "profile">("home");

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSubs, setTotalSubs] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setAdmin(readAdmin());
      try {
        const rows = await fetchPending();
        if (!alive) return;
        setPending(rows);
      } catch {
        if (alive) setPending([]);
      }
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const [{ count: uCount }, { count: sCount }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("subscribed", true),
        ]);
        if (!alive) return;
        setTotalUsers(uCount ?? 0);
        setTotalSubs(sCount ?? 0);
      } catch {}
    };
    load();
    const on = () => load();
    window.addEventListener("affilihub:user-change", on);
    window.addEventListener("affilihub:admin-change", on);
    window.addEventListener("storage", on);
    return () => {
      alive = false;
      window.removeEventListener("affilihub:user-change", on);
      window.removeEventListener("affilihub:admin-change", on);
      window.removeEventListener("storage", on);
    };
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);

  const updateRequestStatus = async (
    table: "verification_requests" | "subscription_requests" | "promotion_requests",
    id: string,
    status: "approved" | "rejected",
  ) => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.from(table).update({ status }).eq("id", id);
  };

  const patchProfile = async (userId: string, patch: Record<string, unknown>) => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.from("profiles").update(patch as any).eq("id", userId);
  };

  const approve = async (p: Pending) => {
    if (p.type === "Centang Biru") {
      await updateRequestStatus("verification_requests", p.requestId, "approved");
      await patchProfile(p.userId, { verified: true, verification_pending: false });
      toast.success("Centang biru disetujui");
    } else if (p.type === "Langganan") {
      await updateRequestStatus("subscription_requests", p.requestId, "approved");
      await patchProfile(p.userId, { subscribed: true, verified: true });
      toast.success("Langganan disetujui");
    } else {
      await updateRequestStatus("promotion_requests", p.requestId, "approved");
      toast.success("Promosi disetujui");
    }
    refresh();
  };

  const reject = async (p: Pending) => {
    if (p.type === "Centang Biru") {
      await updateRequestStatus("verification_requests", p.requestId, "rejected");
      await patchProfile(p.userId, { verification_pending: false });
    } else if (p.type === "Langganan") {
      await updateRequestStatus("subscription_requests", p.requestId, "rejected");
    } else {
      await updateRequestStatus("promotion_requests", p.requestId, "rejected");
    }
    toast.success("Pengajuan ditolak");
    refresh();
  };

  const stats = {
    daftar: totalUsers,
    trafik: 0,
    promosi: pending.filter((p) => p.type === "Promosi").length,
    langganan: totalSubs,
  };


  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
              {admin.avatar ? (
                <img src={admin.avatar} alt="Admin" className="h-full w-full object-cover" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-extrabold">Admin Panel</p>
              <p className="text-[10px] text-muted-foreground">AffiliHub Control Center</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
        {tab === "home" ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard icon={<Users className="h-4 w-4" />} label="Pendaftaran" value={String(stats.daftar)} delta="total" />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Trafik Hari Ini" value={String(stats.trafik)} delta="—" />
              <StatCard icon={<Rocket className="h-4 w-4" />} label="Pengajuan Promosi" value={String(stats.promosi)} delta="pending" />
              <StatCard icon={<CreditCard className="h-4 w-4" />} label="Langganan Aktif" value={String(stats.langganan)} delta="aktif" />
            </div>

            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-extrabold">
                Antrian Persetujuan ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="rounded-xl bg-secondary p-4 text-center text-xs text-muted-foreground">
                  Belum ada pengajuan.
                </p>
              ) : (
                <div className="space-y-2">
                  {pending.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary p-3"
                    >
                      <div>
                        <p className="text-sm font-bold">{p.user}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.type} · {new Date(p.at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => approve(p)}
                          className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground"
                        >
                          ACC
                        </button>
                        <button
                          onClick={() => reject(p)}
                          className="rounded-full border border-border px-3 py-1 text-[11px] font-bold"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="relative mb-3 h-24 overflow-hidden rounded-xl bg-secondary">
                {admin.cover && (
                  <img src={admin.cover} alt="Sampul" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-primary text-primary-foreground">
                  {admin.avatar ? (
                    <img src={admin.avatar} alt="Admin" className="h-full w-full object-cover" />
                  ) : (
                    <Shield className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base font-extrabold">@{admin.username}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {admin.email || "Email belum diatur"}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <AdminCard icon={<BadgeCheck className="h-5 w-5" />} title="Kelola Centang Biru" desc="ACC atau cabut verifikasi" onClick={() => setSheet("verify")} />
              <AdminCard icon={<Rocket className="h-5 w-5" />} title="Kelola Promosi & Langganan" desc="Setujui atau tolak pengajuan" onClick={() => setSheet("promotion")} />
              <AdminCard icon={<Ban className="h-5 w-5" />} title="Ban Akun" desc={`${admin.bannedUsernames.length} akun dibanned`} onClick={() => setSheet("ban")} />
              <AdminCard icon={<QrCode className="h-5 w-5" />} title="Rekening QR" desc={admin.qrImage ? "QR terpasang" : "Belum diunggah"} onClick={() => setSheet("qr")} />
              <AdminCard icon={<Shield className="h-5 w-5" />} title="Ubah Kredensial Admin" desc="Username, password, email, WA" onClick={() => setSheet("credentials")} />
              <AdminCard icon={<Camera className="h-5 w-5" />} title="Foto Admin" desc="Foto profil & sampul" onClick={() => setSheet("profile")} />
              <AdminCard icon={<ImageIcon className="h-5 w-5" />} title="Logo Aplikasi" desc="Ubah logo & nama brand" onClick={() => setSheet("logo")} />
              <AdminCard icon={<Images className="h-5 w-5" />} title="Banner Slider" desc="Tambah, edit, hapus banner" onClick={() => setSheet("banner")} />
              <AdminCard icon={<CreditCard className="h-5 w-5" />} title="Harga Langganan" desc="Atur harga premium user" onClick={() => setSheet("price")} />
            </section>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2">
          <button
            onClick={() => setTab("home")}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${
              tab === "home" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            Home
          </button>
          <button
            onClick={() => setTab("profile")}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${
              tab === "profile" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <UserIcon className="h-5 w-5" />
            Profile
          </button>
        </div>
      </nav>


      <AnimatePresence>
        {sheet && (
          <Sheet title={sheetTitle(sheet)} onClose={() => setSheet(null)}>
            {sheet === "verify" && (
              <VerifyManager onClose={() => setSheet(null)} />
            )}
            {sheet === "promotion" && (
              <PromotionManager onClose={() => setSheet(null)} />
            )}
            {sheet === "ban" && (
              <BanManager
                banned={admin.bannedUsernames}
                onChange={(list) => {
                  const s = { ...admin, bannedUsernames: list };
                  writeAdmin(s);
                  setAdmin(s);
                }}
              />
            )}
            {sheet === "qr" && (
              <QrManager
                qr={admin.qrImage}
                onSave={(img) => {
                  const s = { ...admin, qrImage: img };
                  writeAdmin(s);
                  setAdmin(s);
                  toast.success("QR pembayaran diperbarui");
                }}
              />
            )}
            {sheet === "credentials" && (
              <CredentialsForm
                admin={admin}
                onSave={(patch) => {
                  const s = { ...admin, ...patch };
                  writeAdmin(s);
                  setAdmin(s);
                  toast.success("Kredensial admin disimpan");
                  setSheet(null);
                }}
              />
            )}
            {sheet === "profile" && (
              <ProfilePhotos
                admin={admin}
                onSave={(patch) => {
                  const s = { ...admin, ...patch };
                  writeAdmin(s);
                  setAdmin(s);
                }}
              />
            )}
            {sheet === "logo" && <LogoManager onClose={() => setSheet(null)} />}
            {sheet === "banner" && <BannerManager onClose={() => setSheet(null)} />}
            {sheet === "price" && <PriceManager onClose={() => setSheet(null)} />}
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function sheetTitle(s: NonNullable<SheetKey>): string {
  return {
    verify: "Kelola Centang Biru",
    promotion: "Kelola Promosi & Langganan",
    ban: "Ban Akun",
    qr: "Rekening QR Pembayaran",
    credentials: "Ubah Kredensial Admin",
    profile: "Foto Admin",
    logo: "Kelola Logo",
    banner: "Kelola Banner",
    price: "Harga Langganan",
  }[s];
}

/* ---------- managers ---------- */

function VerifyManager({ onClose }: { onClose: () => void }) {
  const u = getUser();
  if (!u.username && !u.displayName)
    return <p className="text-sm text-muted-foreground">Belum ada user terdaftar.</p>;
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-xl border border-border bg-secondary p-3">
        <p className="font-bold">
          @{u.username || u.displayName}{" "}
          {u.verified && <span className="text-[#1D9BF0]">✓ terverifikasi</span>}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {u.verificationPending ? "Menunggu persetujuan" : u.verified ? "Sudah dapat centang biru" : "Belum ada centang biru"}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          disabled={u.verified}
          onClick={() => {
            setUserProfile({ verified: true, verificationPending: false });
            toast.success("Centang biru diberikan");
            onClose();
          }}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          ACC Centang Biru
        </button>
        <button
          disabled={!u.verified && !u.verificationPending}
          onClick={() => {
            setUserProfile({ verified: false, verificationPending: false });
            toast.success("Centang biru dicabut");
            onClose();
          }}
          className="flex-1 rounded-xl border border-destructive/40 py-2.5 text-sm font-bold text-destructive disabled:opacity-50"
        >
          Cabut / Tolak
        </button>
      </div>
    </div>
  );
}

function PromotionManager({ onClose: _onClose }: { onClose: () => void }) {
  const u = getUser();
  const uname = u.username || u.displayName;
  const promos = u.promotions;
  const grantSub = () => {
    setUserProfile({
      subscribed: true,
      subscriptionPending: false,
      subscriptionUntil: Date.now() + 30 * 86400000,
      verified: true,
    });
    toast.success("Langganan diaktifkan 30 hari");
  };
  const revokeSub = () => {
    setUserProfile({ subscribed: false, subscriptionPending: false, subscriptionUntil: 0 });
    toast.success("Langganan dinonaktifkan");
  };
  return (
    <div className="space-y-3 text-sm">
      {!uname && <p className="text-muted-foreground">Belum ada user.</p>}
      {uname && (
        <>
          <div className="rounded-xl border border-border bg-secondary p-3">
            <p className="font-bold">Langganan @{uname}</p>
            <p className="text-[11px] text-muted-foreground">
              {u.subscribed
                ? `Aktif s/d ${new Date(u.subscriptionUntil).toLocaleDateString("id-ID")}`
                : u.subscriptionPending
                  ? "Menunggu ACC (bukti transfer diunggah)"
                  : "Tidak aktif"}
            </p>
            {u.subscriptionProof && (
              <img
                src={u.subscriptionProof}
                alt="Bukti transfer"
                className="mt-2 max-h-40 rounded-lg border border-border object-contain"
              />
            )}
            <div className="mt-2 flex gap-2">
              <button
                onClick={grantSub}
                className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
              >
                ACC Langganan
              </button>
              <button
                onClick={revokeSub}
                className="flex-1 rounded-lg border border-border py-2 text-xs font-bold"
              >
                Nonaktifkan
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">
              Pengajuan Promosi ({promos.length})
            </p>
            {promos.length === 0 ? (
              <p className="rounded-xl bg-secondary p-3 text-center text-xs text-muted-foreground">
                Belum ada.
              </p>
            ) : (
              <div className="space-y-2">
                {promos.map((p) => {
                  const prod = u.products.find((x) => x.id === p.productId);
                  return (
                    <div
                      key={p.at}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">
                          {prod?.name ?? p.productId}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(p.at).toLocaleString("id-ID")} · {p.status}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setUserProfile({
                              promotions: promos.map((x) =>
                                x.at === p.at ? { ...x, status: "approved" } : x,
                              ),
                            });
                            toast.success("Promosi disetujui");
                          }}
                          className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground"
                        >
                          ACC
                        </button>
                        <button
                          onClick={() => {
                            setUserProfile({
                              promotions: promos.map((x) =>
                                x.at === p.at ? { ...x, status: "rejected" } : x,
                              ),
                            });
                            toast.success("Promosi ditolak");
                          }}
                          className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BanManager({
  banned,
  onChange,
}: {
  banned: string[];
  onChange: (list: string[]) => void;
}) {
  const [v, setV] = useState("");
  const u = getUser();
  const uname = u.username || u.displayName;
  const isBanned = uname && banned.includes(uname);
  return (
    <div className="space-y-3 text-sm">
      {uname && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary p-3">
          <div>
            <p className="font-bold">@{uname}</p>
            <p className="text-[11px] text-muted-foreground">
              {isBanned ? "Diblokir" : "Aktif"}
            </p>
          </div>
          <button
            onClick={() => {
              const list = isBanned
                ? banned.filter((x) => x !== uname)
                : [...banned, uname];
              onChange(list);
              toast.success(isBanned ? "Ban dicabut" : "Akun dibanned");
            }}
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              isBanned
                ? "border border-border"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {isBanned ? "Cabut Ban" : "Ban Sekarang"}
          </button>
        </div>
      )}
      <div className="rounded-xl border border-border bg-secondary p-3">
        <p className="mb-2 text-[11px] font-bold uppercase text-muted-foreground">
          Ban manual by username
        </p>
        <div className="flex gap-2">
          <input
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder="username"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => {
              if (!v.trim()) return;
              onChange(Array.from(new Set([...banned, v.trim()])));
              setV("");
              toast.success("Akun dibanned");
            }}
            className="rounded-lg bg-destructive px-3 text-xs font-bold text-destructive-foreground"
          >
            Ban
          </button>
        </div>
      </div>
      {banned.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">
            Daftar dibanned
          </p>
          <div className="space-y-1">
            {banned.map((b) => (
              <div
                key={b}
                className="flex items-center justify-between rounded-lg bg-secondary px-3 py-1.5 text-xs"
              >
                <span>@{b}</span>
                <button
                  onClick={() => onChange(banned.filter((x) => x !== b))}
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QrManager({
  qr,
  onSave,
}: {
  qr: string;
  onSave: (img: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(qr);
  return (
    <div className="space-y-3">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 4 * 1024 * 1024) {
            toast.error("Maksimum 4MB");
            return;
          }
          const url = await readFileAsDataURL(f);
          setPreview(url);
        }}
      />
      <div className="grid place-items-center rounded-xl border border-dashed border-border bg-secondary p-4">
        {preview ? (
          <img src={preview} alt="QR" className="max-h-64 rounded-lg object-contain" />
        ) : (
          <div className="grid h-40 w-40 place-items-center text-muted-foreground">
            <QrCode className="h-10 w-10" />
          </div>
        )}
      </div>
      <button
        onClick={() => ref.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-bold"
      >
        <Upload className="h-4 w-4" /> Pilih Gambar QR
      </button>
      <button
        disabled={preview === qr}
        onClick={() => onSave(preview)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        <Check className="h-4 w-4" /> Simpan
      </button>
    </div>
  );
}

function CredentialsForm({
  admin,
  onSave,
}: {
  admin: AdminState;
  onSave: (patch: Partial<AdminState>) => void;
}) {
  const [username, setUsername] = useState(admin.username);
  const [password, setPassword] = useState(admin.password);
  const [email, setEmail] = useState(admin.email);
  const [whatsapp, setWhatsapp] = useState(admin.whatsapp);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ username, password, email, whatsapp });
      }}
      className="space-y-2 text-sm"
    >
      <label className="block text-[11px] font-bold text-muted-foreground">Username</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none" />
      <label className="block text-[11px] font-bold text-muted-foreground">Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none" />
      <label className="block text-[11px] font-bold text-muted-foreground">Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none" />
      <label className="block text-[11px] font-bold text-muted-foreground">WhatsApp</label>
      <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none" />
      <button type="submit" className="mt-2 w-full rounded-xl bg-primary py-2.5 font-bold text-primary-foreground">
        Simpan
      </button>
    </form>
  );
}

function ProfilePhotos({
  admin,
  onSave,
}: {
  admin: AdminState;
  onSave: (patch: Partial<AdminState>) => void;
}) {
  const aRef = useRef<HTMLInputElement>(null);
  const cRef = useRef<HTMLInputElement>(null);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>, k: "avatar" | "cover") => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      toast.error("Maksimum 4MB");
      return;
    }
    const url = await readFileAsDataURL(f);
    onSave({ [k]: url });
    toast.success(k === "avatar" ? "Foto profil diperbarui" : "Foto sampul diperbarui");
    e.target.value = "";
  };
  return (
    <div className="space-y-3">
      <input ref={aRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, "avatar")} />
      <input ref={cRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, "cover")} />
      <div>
        <p className="mb-1 text-[11px] font-bold text-muted-foreground">Foto Sampul</p>
        <div className="relative h-28 overflow-hidden rounded-xl bg-secondary">
          {admin.cover ? (
            <img src={admin.cover} alt="cover" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <Camera className="h-6 w-6" />
            </div>
          )}
          <button
            onClick={() => cRef.current?.click()}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-bold text-muted-foreground">Foto Profil</p>
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-secondary">
            {admin.avatar ? (
              <img src={admin.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <Camera className="h-5 w-5" />
              </div>
            )}
          </div>
          <button
            onClick={() => aRef.current?.click()}
            className="rounded-xl border border-border px-4 py-2 text-xs font-bold"
          >
            Ganti Foto Profil
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- login ---------- */
function AdminLogin({ onOk }: { onOk: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = readAdmin();
    const enteredU = u.trim().toLowerCase();
    const matchesStored = enteredU === a.username.toLowerCase() && p === a.password;
    const matchesDefault = enteredU === "rajathuin22" && p === "Cuan77@@";
    if (!matchesStored && !matchesDefault) {
      toast.error("Username atau password salah");
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Harus login akun Cloud dulu agar bisa membaca data admin");
        setLoading(false);
        window.location.href = "/login?next=/admin";
        return;
      }
      try {
        const { claimAdmin } = await import("@/lib/admin.functions");
        await claimAdmin({ data: { password: p } });
      } catch (e) {
        console.warn("claimAdmin gagal:", e);
        toast.error("Gagal klaim role admin di server. Data mungkin tidak muncul.");
      }
      toast.success("Login admin berhasil");
      onOk();
    } catch (err: any) {
      toast.error(err?.message || "Gagal login admin");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-primary/40 bg-card p-6 shadow-[var(--shadow-hover)]"
      >
        <div className="mb-4 flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-lg font-extrabold">Admin Login</h1>
          <p className="text-[11px] text-muted-foreground">Akses khusus administrator</p>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            placeholder="Admin username"
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Memproses…" : "Masuk sebagai Admin"}
          </button>
        </form>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Gunakan kredensial admin yang telah diatur.
        </p>

      </motion.div>
    </div>
  );
}

/* ---------- shells ---------- */
function StatCard({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[10px] font-bold text-primary">{delta}</p>
    </div>
  );
}

function AdminCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-extrabold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-[var(--shadow-hover)] sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------- logo manager ---------- */
function LogoManager({ onClose }: { onClose: () => void }) {
  const b = useBranding();
  const [logoImage, setLogoImage] = useState(b.logoImage);
  const [brandName, setBrandName] = useState(b.brandName);
  const [brandAccent, setBrandAccent] = useState(b.brandAccent);
  const [tagline, setTagline] = useState(b.tagline);
  const ref = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Maksimum 2MB");
      return;
    }
    const url = await readFileAsDataURL(f);
    setLogoImage(url);
    e.target.value = "";
  };

  return (
    <div className="space-y-3 text-sm">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-3">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-primary">
          {logoImage ? (
            <img src={logoImage} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-primary-foreground">
              {(brandName || "A").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-base font-extrabold">
            {brandName}
            <span className="text-primary">{brandAccent}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{tagline}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => ref.current?.click()}
          className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold"
        >
          <Upload className="mr-1 inline h-3.5 w-3.5" /> Upload Logo
        </button>
        {logoImage && (
          <button
            onClick={() => setLogoImage("")}
            className="rounded-xl border border-destructive/40 px-3 text-xs font-bold text-destructive"
          >
            Hapus
          </button>
        )}
      </div>
      <label className="block text-[11px] font-bold text-muted-foreground">Nama Brand</label>
      <input
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
        className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none"
      />
      <label className="block text-[11px] font-bold text-muted-foreground">Aksen (bagian berwarna)</label>
      <input
        value={brandAccent}
        onChange={(e) => setBrandAccent(e.target.value)}
        className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none"
      />
      <label className="block text-[11px] font-bold text-muted-foreground">Tagline</label>
      <input
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none"
      />
      <button
        onClick={() => {
          setBranding({ logoImage, brandName, brandAccent, tagline });
          toast.success("Logo diperbarui");
          onClose();
        }}
        className="mt-1 w-full rounded-xl bg-primary py-2.5 font-bold text-primary-foreground"
      >
        Simpan
      </button>
    </div>
  );
}

/* ---------- banner manager ---------- */
function BannerManager({ onClose }: { onClose: () => void }) {
  const b = useBranding();
  const [banners, setBanners] = useState<BannerItem[]>(b.banners);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickIndex, setPickIndex] = useState<number | null>(null);

  const update = (idx: number, patch: Partial<BannerItem>) => {
    setBanners((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  };

  const remove = (idx: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== idx));
  };

  const add = () => {
    setBanners((prev) => [
      ...prev,
      {
        id: "b_" + Date.now(),
        title: "Banner Baru",
        subtitle: "Deskripsi singkat",
        image:
          "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&q=80&auto=format&fit=crop",
      },
    ]);
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || pickIndex === null) return;
    if (f.size > 3 * 1024 * 1024) {
      toast.error("Maksimum 3MB");
      return;
    }
    const url = await readFileAsDataURL(f);
    update(pickIndex, { image: url });
    setPickIndex(null);
    e.target.value = "";
  };

  return (
    <div className="space-y-3 text-sm">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />

      <div className="space-y-3">
        {banners.map((bn, idx) => (
          <div key={bn.id} className="rounded-xl border border-border bg-secondary p-3">
            <div className="relative mb-2 aspect-[16/8] overflow-hidden rounded-lg bg-background">
              <img src={bn.image} alt={bn.title} className="h-full w-full object-cover" />
              <button
                onClick={() => remove(idx)}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"
                aria-label="Hapus"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <input
                value={bn.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                placeholder="Judul"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
              />
              <input
                value={bn.subtitle}
                onChange={(e) => update(idx, { subtitle: e.target.value })}
                placeholder="Subjudul"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
              />
              <div className="flex gap-1.5">
                <input
                  value={bn.image}
                  onChange={(e) => update(idx, { image: e.target.value })}
                  placeholder="URL gambar"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[11px] outline-none"
                />
                <button
                  onClick={() => {
                    setPickIndex(idx);
                    fileRef.current?.click();
                  }}
                  className="rounded-lg border border-border px-2.5 text-[11px] font-bold"
                  title="Upload gambar"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-bold"
      >
        <Plus className="h-4 w-4" /> Tambah Banner
      </button>

      <button
        onClick={() => {
          if (banners.length === 0) {
            toast.error("Minimal 1 banner");
            return;
          }
          setBranding({ banners });
          toast.success("Banner diperbarui");
          onClose();
        }}
        className="w-full rounded-xl bg-primary py-2.5 font-bold text-primary-foreground"
      >
        Simpan Semua
      </button>
    </div>
  );
}

function PriceManager({ onClose }: { onClose: () => void }) {
  const b = useBranding();
  const [price, setPrice] = useState<string>(String(b.subscriptionPrice ?? 10000));

  useEffect(() => {
    setPrice(String(b.subscriptionPrice ?? 10000));
  }, [b.subscriptionPrice]);

  const numeric = Math.max(0, Math.floor(Number(price.replace(/\D/g, "")) || 0));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Premium</p>
        <p className="mt-1 text-2xl font-extrabold">
          Rp {numeric.toLocaleString("id-ID")}
        </p>
        <p className="text-[11px] text-muted-foreground">per bulan</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-muted-foreground">Harga Langganan (Rp)</span>
        <input
          type="text"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
          placeholder="10000"
        />
        <span className="text-[11px] text-muted-foreground">
          Ditampilkan di halaman profil user saat berlangganan premium.
        </span>
      </label>

      <button
        onClick={async () => {
          if (numeric <= 0) {
            toast.error("Harga harus lebih dari 0");
            return;
          }
          try {
            setBranding({ subscriptionPrice: numeric });
            toast.success("Harga langganan diperbarui");
            onClose();
          } catch {
            toast.error("Gagal menyimpan harga");
          }
        }}
        className="w-full rounded-xl bg-primary py-2.5 font-bold text-primary-foreground"
      >
        Simpan
      </button>
    </div>
  );
}
