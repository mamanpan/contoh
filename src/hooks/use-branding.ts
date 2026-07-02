import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BannerItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

export type Branding = {
  logoImage: string;
  brandName: string;
  brandAccent: string;
  tagline: string;
  subscriptionPrice: number;
  banners: BannerItem[];
};

const DEFAULT_BRANDING: Branding = {
  logoImage: "",
  brandName: "Affili",
  brandAccent: "Hub",
  tagline: "Cuan dari setiap link",
  subscriptionPrice: 10000,
  banners: [],
};

let cache: Branding = DEFAULT_BRANDING;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

async function load(): Promise<Branding> {
  const [{ data: br }, { data: bn }] = await Promise.all([
    supabase.from("branding").select("*").eq("id", 1).maybeSingle(),
    supabase.from("banners").select("*").eq("active", true).order("position", { ascending: true }),
  ]);
  cache = {
    logoImage: br?.logo_url ?? "",
    brandName: br?.brand_name ?? DEFAULT_BRANDING.brandName,
    brandAccent: (br as { brand_accent?: string } | null)?.brand_accent ?? DEFAULT_BRANDING.brandAccent,
    tagline: (br as { tagline?: string } | null)?.tagline ?? DEFAULT_BRANDING.tagline,
    subscriptionPrice:
      (br as { subscription_price?: number } | null)?.subscription_price ??
      DEFAULT_BRANDING.subscriptionPrice,
    banners: (bn ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? "",
      image: b.image_url,
    })),
  };
  emit();
  return cache;
}

let loaded = false;
let channel: ReturnType<typeof supabase.channel> | null = null;

function ensureSubscribed() {
  if (loaded) return;
  loaded = true;
  load();
  channel = supabase
    .channel("branding-banners")
    .on("postgres_changes", { event: "*", schema: "public", table: "branding" }, () => load())
    .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => load())
    .subscribe();
}

export function useBranding() {
  const [b, setB] = useState<Branding>(cache);
  useEffect(() => {
    ensureSubscribed();
    setB(cache);
    const on = () => setB({ ...cache });
    listeners.add(on);
    return () => {
      listeners.delete(on);
    };
  }, []);
  return b;
}

export function getBranding() {
  return cache;
}

export async function saveBranding(patch: Partial<Omit<Branding, "banners">>) {
  const { error } = await supabase
    .from("branding")
    .update({
      ...(patch.logoImage !== undefined && { logo_url: patch.logoImage }),
      ...(patch.brandName !== undefined && { brand_name: patch.brandName }),
      ...(patch.brandAccent !== undefined && { brand_accent: patch.brandAccent }),
      ...(patch.tagline !== undefined && { tagline: patch.tagline }),
      ...(patch.subscriptionPrice !== undefined && {
        subscription_price: patch.subscriptionPrice,
      }),
    } as never)
    .eq("id", 1);
  if (error) throw error;
}

export async function saveBanners(banners: BannerItem[]) {
  const { error: delErr } = await supabase.from("banners").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) throw delErr;
  if (banners.length === 0) return;
  const rows = banners.map((b, i) => ({
    title: b.title,
    subtitle: b.subtitle,
    image_url: b.image,
    position: i,
    active: true,
  }));
  const { error } = await supabase.from("banners").insert(rows);
  if (error) throw error;
}

/** Back-compat wrapper for old callsites. */
export function setBranding(patch: Partial<Branding>) {
  const tasks: Promise<void>[] = [];
  const { banners, ...rest } = patch;
  if (Object.keys(rest).length > 0) tasks.push(saveBranding(rest));
  if (banners) tasks.push(saveBanners(banners));
  Promise.all(tasks).catch((e) => console.error("[branding] save failed", e));
}
