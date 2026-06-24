"use client";

// NavActive — marca el enlace de la nav (HTML inyectado) según la ruta actual.
// El header es markup estático del preview; este componente sólo alterna .is-active.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function NavActive() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      ".site-nav .nav-links a, .site-nav .nav-right a"
    );
    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const base = href.replace(/\/$/, "");
      const active = href !== "/" && href !== "#" && base !== "" && pathname.startsWith(base);
      a.classList.toggle("is-active", active);
    });
  }, [pathname]);

  return null;
}
