import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Reply = {
  id: string;
  user: string;
  text: string;
  at: number;
};

export type ProductComment = {
  id: string;
  user: string;
  text: string;
  rating: number;
  at: number;
  replies: Reply[];
};

type Row = {
  id: string;
  product_id: string;
  user_id: string;
  parent_id: string | null;
  text: string;
  rating: number | null;
  created_at: string;
};

async function fetchAndBuild(productId: string): Promise<ProductComment[]> {
  const { data: rows } = await supabase
    .from("comments")
    .select("id,product_id,user_id,parent_id,text,rating,created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  const list = (rows ?? []) as Row[];
  const userIds = Array.from(new Set(list.map((r) => r.user_id)));
  let names: Record<string, string> = {};
  if (userIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,display_name,username")
      .in("id", userIds);
    for (const p of profs ?? []) {
      names[p.id] = (p as any).display_name || (p as any).username || "Pengguna";
    }
  }

  const roots = list.filter((r) => !r.parent_id);
  return roots.map((r) => ({
    id: r.id,
    user: names[r.user_id] ?? "Pengguna",
    text: r.text,
    rating: r.rating ?? 5,
    at: new Date(r.created_at).getTime(),
    replies: list
      .filter((c) => c.parent_id === r.id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((c) => ({
        id: c.id,
        user: names[c.user_id] ?? "Pengguna",
        text: c.text,
        at: new Date(c.created_at).getTime(),
      })),
  }));
}

export function useProductComments(productId: string) {
  const [list, setList] = useState<ProductComment[]>([]);

  const refresh = useCallback(() => {
    fetchAndBuild(productId).then(setList).catch(() => {});
  }, [productId]);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel(`comments-${productId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `product_id=eq.${productId}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [productId, refresh]);

  const addComment = async (c: { user: string; text: string; rating: number }) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("comments").insert({
      product_id: productId,
      user_id: auth.user.id,
      text: c.text,
      rating: c.rating,
    });
  };

  const addReply = async (commentId: string, r: { user: string; text: string }) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("comments").insert({
      product_id: productId,
      user_id: auth.user.id,
      parent_id: commentId,
      text: r.text,
    });
  };

  return { list, addComment, addReply };
}
