import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserProduct = {
  id: string;
  name: string;
  description: string;
  link: string;
  platform: "Shopee" | "TikTok" | "Tokopedia" | "Lazada";
  image?: string;
  createdAt: number;
};

export type UserProfile = {
  displayName: string;
  username: string;
  email: string;
  whatsapp: string;
  password: string;
  avatar: string;
  cover: string;
  verified: boolean;
  verificationPending: boolean;
  subscribed: boolean;
  subscriptionPending: boolean;
  subscriptionProof: string;
  subscriptionUntil: number;
  products: UserProduct[];
  promotions: { productId: string; at: number; status: "pending" | "approved" | "rejected" }[];
  stats: { views: number; clicks: number };
  joinedAt: number;
};

const KEY = "affilihub:user";

const DEFAULT_USER: UserProfile = {
  displayName: "",
  username: "",
  email: "",
  whatsapp: "",
  password: "",
  avatar: "",
  cover: "",
  verified: false,
  verificationPending: false,
  subscribed: false,
  subscriptionPending: false,
  subscriptionProof: "",
  subscriptionUntil: 0,
  products: [],
  promotions: [],
  stats: { views: 0, clicks: 0 },
  joinedAt: Date.now(),
};

function read(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_USER;
    return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER;
  }
}

function write(u: UserProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(u));
  } catch {}
  window.dispatchEvent(new Event("affilihub:user-change"));
}

/** Push user-visible fields to Cloud profiles table. */
async function syncToCloud(u: UserProfile) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const payload = {
      display_name: u.displayName || null,
      avatar_url: u.avatar || null,
      cover_url: u.cover || null,
      verified: !!u.verified,
      verification_pending: !!u.verificationPending,
      subscribed: !!u.subscribed && u.subscriptionUntil > Date.now(),
      ...(u.username ? { username: u.username } : {}),
    };
    await supabase.from("profiles").update(payload).eq("id", auth.user.id);
    // Phone lives in a private table (owner-only readable)
    await supabase
      .from("profile_private")
      .upsert({ user_id: auth.user.id, phone: u.whatsapp || null }, { onConflict: "user_id" });
  } catch {}
}

/** Pull profile from Cloud into local state on sign-in. */
async function pullFromCloud() {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: p } = await supabase
      .from("profiles")
      .select("username,display_name,avatar_url,cover_url,verified,verification_pending,subscribed,views_count,clicks_count")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (!p) return;
    const { data: priv } = await supabase
      .from("profile_private")
      .select("phone")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    const cur = read();
    const merged: UserProfile = {
      ...cur,
      email: auth.user.email ?? cur.email,
      username: (p as any).username ?? cur.username,
      displayName: (p as any).display_name ?? cur.displayName,
      avatar: (p as any).avatar_url ?? cur.avatar,
      cover: (p as any).cover_url ?? cur.cover,
      whatsapp: (priv as any)?.phone ?? cur.whatsapp,
      verified: !!(p as any).verified,
      verificationPending: !!(p as any).verification_pending,
      subscribed: !!(p as any).subscribed,
      stats: {
        views: (p as any).views_count ?? cur.stats.views,
        clicks: (p as any).clicks_count ?? cur.stats.clicks,
      },
    };
    write(merged);
  } catch {}
}

// Auto-pull whenever auth state changes
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
      pullFromCloud();
    }
  });
}

export function getUser() {
  return read();
}

export function setUser(patch: Partial<UserProfile>) {
  const next = { ...read(), ...patch };
  write(next);
  syncToCloud(next);
  return next;
}

export function useUser() {
  const [user, setState] = useState<UserProfile>(DEFAULT_USER);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
    pullFromCloud().then(() => setState(read()));
    const on = () => setState(read());
    window.addEventListener("affilihub:user-change", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("affilihub:user-change", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  return { user, ready, setUser };
}

/** Daily promotion counter: max 5/day unless subscribed. */
export function canPromoteToday(u: UserProfile) {
  if (u.subscribed && u.subscriptionUntil > Date.now()) return { ok: true, used: 0, limit: Infinity };
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const used = u.promotions.filter((p) => p.at >= startOfDay.getTime()).length;
  return { ok: used < 5, used, limit: 5 };
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

