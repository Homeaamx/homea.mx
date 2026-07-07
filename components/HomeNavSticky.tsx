"use client";

// HomeNavSticky — marca <html data-home> sólo en la home.
// El nav es chrome compartido y en el layout va dentro de un <div> wrapper cuya
// caja limita el `position: sticky` del nav (se despega al hacer scroll). En la
// home hacemos ese wrapper `display: contents` (ver theme.css) para que el nav
// quede en el flujo de <body> y se mantenga fijo al bajar. Se limita a la home.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function HomeNavSticky() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const isHome = pathname === "/";
    const root = document.documentElement;
    if (isHome) root.setAttribute("data-home", "true");
    else root.removeAttribute("data-home");
    return () => root.removeAttribute("data-home");
  }, [pathname]);

  return null;
}
