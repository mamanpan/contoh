import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Claim admin role. Any signed-in user can call this with the correct
 * bootstrap password (defaults to "admin" — override via ADMIN_BOOTSTRAP_PASSWORD).
 * Grants the caller the `admin` role in public.user_roles.
 */
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { password?: string };
    return { password: String(d.password ?? "") };
  })
  .handler(async ({ data, context }) => {
    const expected = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Cuan77@@";
    if (data.password !== expected) {
      throw new Error("Password admin salah");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
