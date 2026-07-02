import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DemoUser = {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  cover: string;
  bio: string;
  verified: boolean;
  productIds: string[];
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: "u_sinta",
    displayName: "Sinta Amelia",
    username: "sinta.beauty",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format&fit=crop",
    cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80&auto=format&fit=crop",
    bio: "Beauty & skincare affiliate ✨",
    verified: true,
    productIds: ["p2", "p6"],
  },
  {
    id: "u_andi",
    displayName: "Andi Pratama",
    username: "andi.gadget",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop",
    cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80&auto=format&fit=crop",
    bio: "Review gadget & aksesoris",
    verified: false,
    productIds: ["p3", "p4"],
  },
  {
    id: "u_bella",
    displayName: "Bella Kirana",
    username: "bella.fashion",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop",
    cover: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80&auto=format&fit=crop",
    bio: "Fashion haul TikTok Shop",
    verified: true,
    productIds: ["p5", "p1"],
  },
  {
    id: "u_doni",
    displayName: "Doni Saputra",
    username: "doni.sport",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop",
    cover: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80&auto=format&fit=crop",
    bio: "Sepatu & sports gear",
    verified: false,
    productIds: ["p1", "p4"],
  },
  {
    id: "u_rani",
    displayName: "Rani Wulandari",
    username: "rani.home",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80&auto=format&fit=crop",
    cover: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&auto=format&fit=crop",
    bio: "Home living & dekorasi",
    verified: false,
    productIds: ["p6"],
  },
  {
    id: "u_fajar",
    displayName: "Fajar Nugroho",
    username: "fajar.tech",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80&auto=format&fit=crop",
    cover: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&auto=format&fit=crop",
    bio: "Tech affiliate — laptop, HP",
    verified: true,
    productIds: ["p3", "p4", "p1"],
  },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRealUserId = (id: string) => UUID_RE.test(id);

/** Cache real profiles (fetched by uuid) to render lists. */
const profileCache = new Map<string, DemoUser>();

async function fetchRealProfiles(ids: string[]): Promise<DemoUser[]> {
  const need = ids.filter((id) => isRealUserId(id) && !profileCache.has(id));
  if (need.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,cover_url,bio,verified")
      .in("id", need);
    for (const p of data ?? []) {
      profileCache.set((p as any).id, {
        id: (p as any).id,
        username: (p as any).username ?? "user",
        displayName: (p as any).display_name ?? (p as any).username ?? "User",
        avatar: (p as any).avatar_url ?? "",
        cover: (p as any).cover_url ?? "",
        bio: (p as any).bio ?? "",
        verified: !!(p as any).verified,
        productIds: [],
      });
    }
  }
  return ids.map((id) => profileCache.get(id)).filter(Boolean) as DemoUser[];
}

/** Resolve user (demo or real) synchronously if cached, else return undefined. */
export function resolveUser(id: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.id === id) ?? profileCache.get(id);
}

/** Search real users by username/display_name via Cloud. */
export async function searchRealUsers(q: string, excludeId?: string): Promise<DemoUser[]> {
  const term = q.trim();
  if (!term) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,cover_url,bio,verified")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(20);
  const out: DemoUser[] = [];
  for (const p of data ?? []) {
    if (excludeId && (p as any).id === excludeId) continue;
    const u: DemoUser = {
      id: (p as any).id,
      username: (p as any).username ?? "user",
      displayName: (p as any).display_name ?? (p as any).username ?? "User",
      avatar: (p as any).avatar_url ?? "",
      cover: (p as any).cover_url ?? "",
      bio: (p as any).bio ?? "",
      verified: !!(p as any).verified,
      productIds: [],
    };
    profileCache.set(u.id, u);
    out.push(u);
  }
  return out;
}

// ============ Local demo storage (unchanged for u_* ids) ============
const FOLLOW_KEY = "affilihub:follows";
const FOLLOWERS_KEY = "affilihub:followers";
const CHAT_KEY = "affilihub:chats";

export type Msg = { id: string; from: "me" | string; text: string; at: number };

function readList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function writeList(key: string, list: string[]) {
  localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event("affilihub:social-change"));
}
function readChats(): Record<string, Msg[]> {
  try {
    return JSON.parse(localStorage.getItem(CHAT_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeChats(c: Record<string, Msg[]>) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(c));
  window.dispatchEvent(new Event("affilihub:social-change"));
}

export function useSocial() {
  const [meId, setMeId] = useState<string | null>(null);
  // Local demo state
  const [localFollowing, setLocalFollowing] = useState<string[]>([]);
  const [localFollowers, setLocalFollowers] = useState<string[]>([]);
  const [localChats, setLocalChats] = useState<Record<string, Msg[]>>({});
  // Cloud state
  const [cloudFollowing, setCloudFollowing] = useState<string[]>([]);
  const [cloudFollowers, setCloudFollowers] = useState<string[]>([]);
  const [cloudChats, setCloudChats] = useState<Record<string, Msg[]>>({});

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setMeId(s?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Local refresh
  useEffect(() => {
    const refresh = () => {
      setLocalFollowing(readList(FOLLOW_KEY));
      setLocalFollowers(readList(FOLLOWERS_KEY));
      setLocalChats(readChats());
    };
    refresh();
    window.addEventListener("affilihub:social-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("affilihub:social-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const loadCloud = useCallback(async () => {
    if (!meId) {
      setCloudFollowing([]);
      setCloudFollowers([]);
      setCloudChats({});
      return;
    }
    const [{ data: fol1 }, { data: fol2 }, { data: msgs }] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", meId),
      supabase.from("follows").select("follower_id").eq("following_id", meId),
      supabase
        .from("messages")
        .select("id,sender_id,receiver_id,text,created_at")
        .or(`sender_id.eq.${meId},receiver_id.eq.${meId}`)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);
    const followingIds = (fol1 ?? []).map((r: any) => r.following_id);
    const followerIds = (fol2 ?? []).map((r: any) => r.follower_id);
    setCloudFollowing(followingIds);
    setCloudFollowers(followerIds);

    const grouped: Record<string, Msg[]> = {};
    for (const m of msgs ?? []) {
      const other = (m as any).sender_id === meId ? (m as any).receiver_id : (m as any).sender_id;
      const msg: Msg = {
        id: (m as any).id,
        from: (m as any).sender_id === meId ? "me" : other,
        text: (m as any).text,
        at: new Date((m as any).created_at).getTime(),
      };
      (grouped[other] ??= []).push(msg);
    }
    setCloudChats(grouped);

    // Prefetch profile info for all real ids
    const ids = new Set<string>([...followingIds, ...followerIds, ...Object.keys(grouped)]);
    if (ids.size) await fetchRealProfiles(Array.from(ids));
  }, [meId]);

  // Load + realtime for cloud
  useEffect(() => {
    loadCloud();
    if (!meId) return;
    const ch = supabase
      .channel(`social-${meId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${meId}` },
        () => loadCloud(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `sender_id=eq.${meId}` },
        () => loadCloud(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${meId}` },
        () => loadCloud(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `following_id=eq.${meId}` },
        () => loadCloud(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [meId, loadCloud]);

  const following = [...cloudFollowing, ...localFollowing];
  const followers = [...cloudFollowers, ...localFollowers];
  const chats: Record<string, Msg[]> = { ...localChats, ...cloudChats };

  const isFollowing = (id: string) =>
    isRealUserId(id) ? cloudFollowing.includes(id) : localFollowing.includes(id);

  const follow = async (id: string) => {
    if (isRealUserId(id)) {
      if (!meId) return;
      await supabase.from("follows").insert({ follower_id: meId, following_id: id });
      loadCloud();
      return;
    }
    const list = readList(FOLLOW_KEY);
    if (!list.includes(id)) writeList(FOLLOW_KEY, [...list, id]);
    if (["u_sinta", "u_bella", "u_fajar"].includes(id)) {
      const fl = readList(FOLLOWERS_KEY);
      if (!fl.includes(id)) writeList(FOLLOWERS_KEY, [...fl, id]);
    }
  };

  const unfollow = async (id: string) => {
    if (isRealUserId(id)) {
      if (!meId) return;
      await supabase.from("follows").delete().eq("follower_id", meId).eq("following_id", id);
      loadCloud();
      return;
    }
    writeList(FOLLOW_KEY, readList(FOLLOW_KEY).filter((x) => x !== id));
  };

  const sendMessage = async (otherId: string, text: string) => {
    if (isRealUserId(otherId)) {
      if (!meId) return;
      await supabase.from("messages").insert({
        sender_id: meId,
        receiver_id: otherId,
        text,
      });
      loadCloud();
      return;
    }
    // Demo (local + auto-reply)
    const all = readChats();
    const list = all[otherId] ?? [];
    const msg: Msg = { id: Math.random().toString(36).slice(2), from: "me", text, at: Date.now() };
    all[otherId] = [...list, msg];
    writeChats(all);
    setTimeout(() => {
      const cur = readChats();
      const arr = cur[otherId] ?? [];
      const user = DEMO_USERS.find((u) => u.id === otherId);
      if (!user) return;
      const replies = [
        "Halo! Makasih udah chat 🙌",
        "Cek link produk aku ya 😄",
        "Wah menarik! Ada yang bisa aku bantu?",
        "Siap, nanti aku info lagi 🚀",
      ];
      cur[otherId] = [
        ...arr,
        {
          id: Math.random().toString(36).slice(2),
          from: otherId,
          text: replies[Math.floor(Math.random() * replies.length)],
          at: Date.now(),
        },
      ];
      writeChats(cur);
    }, 1200 + Math.random() * 1500);
  };

  const conversations = Object.entries(chats)
    .map(([id, msgs]) => ({
      id,
      user: resolveUser(id),
      last: msgs[msgs.length - 1],
    }))
    .filter((c) => c.user && c.last)
    .sort((a, b) => b.last!.at - a.last!.at);

  return {
    following,
    followers,
    isFollowing,
    follow,
    unfollow,
    chats,
    sendMessage,
    conversations,
    meId,
    searchRealUsers,
    resolveUser,
  };
}
