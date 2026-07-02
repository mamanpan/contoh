import { useEffect, useState } from "react";

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mapdish:favs");
      if (raw) setFavs(JSON.parse(raw));
    } catch {}
  }, []);

  const toggle = (id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem("mapdish:favs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return { favs, toggle, isFav: (id: string) => favs.includes(id) };
}

export function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mapdish:dark");
    const initial = stored === "1";
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("mapdish:dark", next ? "1" : "0");
      return next;
    });
  };

  return { dark, toggle };
}
