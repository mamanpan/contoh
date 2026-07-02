import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { BlueCheck } from "@/components/BlueCheck";
import { useSocial, type DemoUser, isRealUserId } from "@/hooks/use-social";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [{ title: "Chat — AffiliHub" }],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { id } = Route.useParams();
  const { authed, ready } = useAuth();
  const social = useSocial();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [other, setOther] = useState<DemoUser | undefined>(() => social.resolveUser(id));
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = social.chats[id] ?? [];

  useEffect(() => {
    if (other) return;
    if (!isRealUserId(id)) return;
    supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,cover_url,bio,verified")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setOther({
          id: (data as any).id,
          username: (data as any).username ?? "user",
          displayName: (data as any).display_name ?? (data as any).username ?? "User",
          avatar: (data as any).avatar_url ?? "",
          cover: (data as any).cover_url ?? "",
          bio: (data as any).bio ?? "",
          verified: !!(data as any).verified,
          productIds: [],
        });
      });
  }, [id, other]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!authed) return <AuthGate />;
  if (!other) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">User tidak ditemukan.</p>
          <Link to="/friends" className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            Kembali ke Teman
          </Link>
        </div>
      </div>
    );
  }


  const send = () => {
    const t = text.trim();
    if (!t) return;
    social.sendMessage(other.id, t);
    setText("");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button
          onClick={() => navigate({ to: "/friends" })}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <img src={other.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-bold">{other.displayName}</p>
            {other.verified && <BlueCheck size={14} />}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">@{other.username}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center">
            <img src={other.avatar} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
            <p className="mt-2 text-sm font-bold">{other.displayName}</p>
            <p className="text-[11px] text-muted-foreground">{other.bio}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Mulai percakapan dengan mengirim pesan.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.from === "me";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`mt-0.5 text-[9px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={500}
            placeholder="Tulis pesan..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            aria-label="Kirim"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
