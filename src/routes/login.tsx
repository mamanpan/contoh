import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — AffiliHub" },
      { name: "description", content: "Masuk atau daftar akun AffiliHub." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Isi email dan password dulu");
      return;
    }
    if (mode === "register" && !form.username.trim()) {
      toast.error("Username wajib diisi");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const uname = form.username.trim().toLowerCase().replace(/[^a-z0-9._]/g, "");
        if (!uname) {
          toast.error("Username hanya boleh huruf, angka, titik, underscore");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: uname, display_name: uname },
          },
        });
        if (error) throw error;
        toast.success("Akun berhasil dibuat!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("Berhasil masuk");
      }
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      if (next && next.startsWith("/")) {
        window.location.href = next;
      } else {
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex rounded-full bg-secondary p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth} className="space-y-2">
            {mode === "register" && (
              <Field
                icon={<UserIcon className="h-4 w-4" />}
                placeholder="Username (huruf/angka/._)"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            )}
            <Field
              icon={<Mail className="h-4 w-4" />}
              placeholder="Email kamu"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Field
              icon={<Lock className="h-4 w-4" />}
              placeholder="Password (min. 6 karakter)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
            >
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar Sekarang"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-bold text-primary"
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  ...props
}: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <input
        {...props}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
