import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, UserCheck, UserPlus, ExternalLink, Star } from "lucide-react";
import { BlueCheck } from "@/components/BlueCheck";
import { BottomNav } from "@/components/BottomNav";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { useSocial, DEMO_USERS } from "@/hooks/use-social";
import { PRODUCTS } from "@/lib/affiliate-data";

export const Route = createFileRoute("/u/$id")({
  head: () => ({
    meta: [{ title: "Profil Creator — AffiliHub" }],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { id } = Route.useParams();
  const { authed, ready } = useAuth();
  const social = useSocial();
  const navigate = useNavigate();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!authed) return <AuthGate />;

  const user = DEMO_USERS.find((u) => u.id === id);
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Creator tidak ditemukan.</p>
          <Link to="/friends" className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            Cari teman
          </Link>
        </div>
      </div>
    );
  }

  const products = PRODUCTS.filter((p) => user.productIds.includes(p.id));
  const following = social.isFollowing(user.id);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden">
        <img src={user.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        <button
          onClick={() => navigate({ to: "/friends" })}
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Identity */}
      <div className="-mt-10 px-4">
        <img
          src={user.avatar}
          alt={user.displayName}
          className="h-20 w-20 rounded-full border-4 border-background object-cover"
        />
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="truncate text-lg font-extrabold">{user.displayName}</h1>
              {user.verified && <BlueCheck size={16} />}
            </div>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
            <p className="mt-1 text-sm">{user.bio}</p>
          </div>
        </div>

        {/* Counts */}
        <div className="mt-3 flex items-center gap-4 text-xs">
          <div>
            <span className="font-extrabold">{products.length}</span>{" "}
            <span className="text-muted-foreground">Produk</span>
          </div>
          <span className="text-muted-foreground/40">·</span>
          <div>
            <span className="font-extrabold">{following ? "1" : "0"}</span>{" "}
            <span className="text-muted-foreground">Pengikut</span>
          </div>
          <span className="text-muted-foreground/40">·</span>
          <div>
            <span className="font-extrabold">{Math.floor(Math.random() * 30) + user.productIds.length * 3}</span>{" "}
            <span className="text-muted-foreground">Mengikuti</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {following ? (
            <button
              onClick={() => social.unfollow(user.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-secondary py-2 text-xs font-bold"
            >
              <UserCheck className="h-4 w-4" /> Mengikuti
            </button>
          ) : (
            <button
              onClick={() => social.follow(user.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground"
            >
              <UserPlus className="h-4 w-4" /> Ikuti
            </button>
          )}
          <Link
            to="/chat/$id"
            params={{ id: user.id }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-2 text-xs font-bold"
          >
            <MessageCircle className="h-4 w-4" /> Chat
          </Link>
        </div>

        {/* Showcase / promoted products */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Produk yang Dipromosikan</h2>
            <span className="text-[11px] text-muted-foreground">{products.length} item</span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground">
                Creator ini belum mempromosikan produk apapun.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <a
                  key={p.id}
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                      {p.platform}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-xs font-bold">{p.name}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-semibold">{p.rating}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({p.reviews})
                      </span>
                      <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
