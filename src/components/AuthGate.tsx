import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, LogIn } from "lucide-react";
import { Logo } from "@/components/Logo";

export function AuthGate() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]"
      >
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold">Masuk untuk lihat produk</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Daftar atau login dulu untuk menjelajahi katalog affiliate kreator.
        </p>

        <button
          onClick={() => navigate({ to: "/login" })}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95"
        >
          <LogIn className="h-4 w-4" /> Masuk / Daftar
        </button>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-bold text-primary">
            Masuk sekarang
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
