import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus, UserCheck, Search as SearchIcon } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { BlueCheck } from "@/components/BlueCheck";
import { useSocial, DEMO_USERS, searchRealUsers, type DemoUser } from "@/hooks/use-social";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";
import { toast } from "sonner";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Teman — AffiliHub" },
      { name: "description", content: "Cari, ikuti, dan chat dengan sesama affiliate." },
    ],
  }),
  component: FriendsPage,
});

type Tab = "discover" | "followers" | "following" | "chat";

function FriendsPage() {
  const { authed, ready } = useAuth();
  const [tab, setTab] = useState<Tab>("discover");
  const [q, setQ] = useState("");
  const [realResults, setRealResults] = useState<DemoUser[]>([]);
  const social = useSocial();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim()) searchRealUsers(q, social.meId ?? undefined).then(setRealResults);
      else setRealResults([]);
    }, 250);
    return () => clearTimeout(t);
  }, [q, social.meId]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!authed) return <AuthGate />;

  const demoFiltered = DEMO_USERS.filter(
    (u) =>
      u.displayName.toLowerCase().includes(q.toLowerCase()) ||
      u.username.toLowerCase().includes(q.toLowerCase()),
  );
  const seen = new Set<string>();
  const filtered = [...realResults, ...demoFiltered].filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });

  const followerUsers = social.followers
    .map((id) => social.resolveUser(id))
    .filter(Boolean) as DemoUser[];
  const followingUsers = social.following
    .map((id) => social.resolveUser(id))
    .filter(Boolean) as DemoUser[];


  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-3">
          <h1 className="text-xl font-extrabold">Teman</h1>
          <p className="text-xs text-muted-foreground">Ikuti & chat sesama affiliate</p>

          <div className="mt-3 flex gap-1 overflow-x-auto">
            {(
              [
                ["discover", "Cari"],
                ["following", `Mengikuti (${social.following.length})`],
                ["followers", `Pengikut (${social.followers.length})`],
                ["chat", `Chat (${social.conversations.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  tab === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-4">
        {tab === "discover" && (
          <>
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama atau username..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <UserList
              users={filtered}
              onOpenChat={(id) => navigate({ to: "/chat/$id", params: { id } })}
              social={social}
            />
          </>
        )}
        {tab === "following" && (
          <UserList
            users={followingUsers}
            emptyText="Kamu belum mengikuti siapa pun. Buka tab Cari untuk mulai."
            onOpenChat={(id) => navigate({ to: "/chat/$id", params: { id } })}
            social={social}
          />
        )}
        {tab === "followers" && (
          <UserList
            users={followerUsers}
            emptyText="Belum ada pengikut. Ikuti user lain agar mereka follow balik."
            onOpenChat={(id) => navigate({ to: "/chat/$id", params: { id } })}
            social={social}
          />
        )}
        {tab === "chat" && (
          <div className="space-y-2">
            {social.conversations.length === 0 && (
              <p className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
                Belum ada chat. Buka profil user dan tekan tombol Chat.
              </p>
            )}
            {social.conversations.map((c) => (
              <Link
                key={c.id}
                to="/chat/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-secondary"
              >
                <img src={c.user!.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-bold">{c.user!.displayName}</p>
                    {c.user!.verified && <BlueCheck size={14} />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.last!.from === "me" ? "Kamu: " : ""}
                    {c.last!.text}
                  </p>
                </div>
                <MessageCircle className="h-4 w-4 text-primary" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function UserList({
  users,
  emptyText,
  onOpenChat,
  social,
}: {
  users: DemoUser[];
  emptyText?: string;
  onOpenChat: (id: string) => void;
  social: ReturnType<typeof useSocial>;
}) {
  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
        {emptyText ?? "Tidak ada user ditemukan."}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {users.map((u, i) => {
        const followed = social.isFollowing(u.id);
        return (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Link
              to="/u/$id"
              params={{ id: u.id }}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <img src={u.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-bold">{u.displayName}</p>
                  {u.verified && <BlueCheck size={14} />}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">@{u.username}</p>
                <p className="truncate text-[11px] text-muted-foreground">{u.bio}</p>
              </div>
            </Link>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  if (followed) {
                    social.unfollow(u.id);
                    toast("Berhenti mengikuti");
                  } else {
                    social.follow(u.id);
                    toast.success(`Mengikuti @${u.username}`);
                  }
                }}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                  followed
                    ? "border border-border bg-secondary text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {followed ? (
                  <>
                    <UserCheck className="h-3 w-3" /> Mengikuti
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3" /> Ikuti
                  </>
                )}
              </button>
              <button
                onClick={() => onOpenChat(u.id)}
                className="flex items-center gap-1 rounded-full border border-primary/40 bg-secondary px-3 py-1 text-[11px] font-bold text-primary"
              >
                <MessageCircle className="h-3 w-3" /> Chat
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
