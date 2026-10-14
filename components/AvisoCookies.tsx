"use client";

// AvisoCookies — banner de cookies propio de HOMEA (Carla, 2026-10-14).
//
// Por qué no el banner de Shopify: la tienda tiene México como región SIN
// consentimiento previo (consentPolicy MX → consentRequired:false), así que el
// banner de Shopify solo aparece en Europa/Reino Unido y en homea.mx no se vería.
// Este aparece a todo visitante en su primera visita, con el diseño del sitio.
//
// Diseño sencillo (Carla, 2026-10-14): texto + dos botones, sin interruptores.
// "Aceptar" activa preferencias, analítica y publicidad; "Solo necesarias" las
// apaga. Lo necesario (carrito, Mi proyecto, favoritos) funciona siempre.
//
// Qué hace:
//   1. Guarda la elección en el navegador (localStorage, 12 meses) y la expone en
//      `window.homeaConsent` + el evento `homea:consent`. Las etiquetas de
//      Google Analytics y Meta (Fase 3) deben esperar a `analytics` / `marketing`.
//   2. Registra la elección en Shopify con su Customer Privacy API
//      (setTrackingConsent con headlessStorefront). Es un extra: si Shopify no
//      responde, la elección local sigue valiendo.
//   3. Cualquier elemento con `data-cookies-preferencias` (el enlace del footer)
//      vuelve a abrir el aviso, indicando qué eligió el visitante.
//
// El texto remite a la sección #cookies del Aviso de privacidad (Shopify).

import { useCallback, useEffect, useRef, useState } from "react";

export type Consentimiento = {
  /** Recordar ajustes del sitio más allá de lo necesario. */
  preferencias: boolean;
  /** Estadísticas de visitas (Google Analytics). */
  analitica: boolean;
  /** Medición de campañas y publicidad (Meta, Google Ads). */
  publicidad: boolean;
};

type Registro = Consentimiento & { v: 1; fecha: string };

declare global {
  interface Window {
    homeaConsent?: { actual: () => Consentimiento | null; abrir: () => void };
    Shopify?: {
      customerPrivacy?: {
        setTrackingConsent: (consent: Record<string, unknown>, cb: (r?: { error?: unknown }) => void) => void;
      };
    };
  }
}

const CLAVE = "homea:cookies";
const VIGENCIA_DIAS = 365;
const API_PRIVACIDAD = "https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js";

function leer(): Registro | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const r = JSON.parse(crudo) as Registro;
    const edad = (Date.now() - new Date(r.fecha).getTime()) / 86_400_000;
    return r.v === 1 && edad < VIGENCIA_DIAS ? r : null;
  } catch {
    return null;
  }
}

function guardar(c: Consentimiento) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...c, v: 1, fecha: new Date().toISOString() }));
  } catch {
    /* modo privado o almacenamiento bloqueado: la elección vale solo esta visita */
  }
}

/** Dominio raíz del sitio para la API de Shopify (www.homea.mx → homea.mx). */
function dominioRaiz(): string {
  const h = window.location.hostname;
  return h.endsWith("homea.mx") ? "homea.mx" : h.replace(/^www\./, "");
}

let apiPromesa: Promise<void> | null = null;
function cargarApiShopify(): Promise<void> {
  if (window.Shopify?.customerPrivacy) return Promise.resolve();
  apiPromesa ??= new Promise((ok, falla) => {
    const s = document.createElement("script");
    s.src = API_PRIVACIDAD;
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => falla(new Error("consent-tracking-api"));
    document.head.appendChild(s);
  });
  return apiPromesa;
}

async function enviarAShopify(c: Consentimiento, tienda: string, token: string) {
  if (!tienda || !token) return;
  try {
    await cargarApiShopify();
    window.Shopify?.customerPrivacy?.setTrackingConsent(
      {
        analytics: c.analitica,
        marketing: c.publicidad,
        preferences: c.preferencias,
        sale_of_data: c.publicidad,
        headlessStorefront: true,
        checkoutRootDomain: tienda,
        storefrontRootDomain: dominioRaiz(),
        storefrontAccessToken: token,
      },
      () => {},
    );
  } catch {
    /* Shopify no cargó: la elección local ya quedó guardada */
  }
}

const TODO: Consentimiento = { preferencias: true, analitica: true, publicidad: true };
const NADA: Consentimiento = { preferencias: false, analitica: false, publicidad: false };

export default function AvisoCookies({ tienda, token }: { tienda: string; token: string }) {
  const [visible, setVisible] = useState(false);
  /** Elección vigente cuando se reabre desde el footer (null = primera visita). */
  const [previa, setPrevia] = useState<Consentimiento | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  const abrir = useCallback(() => {
    setPrevia(leer());
    setVisible(true);
  }, []);

  // Primera visita (o elección vencida): se muestra el aviso.
  useEffect(() => {
    window.homeaConsent = {
      actual: () => {
        const x = leer();
        return x ? { preferencias: x.preferencias, analitica: x.analitica, publicidad: x.publicidad } : null;
      },
      abrir,
    };
    if (!leer()) setVisible(true);
  }, [abrir]);

  // Enlace "Preferencias de cookies" del footer (HTML estático del preview).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-cookies-preferencias]");
      if (!el) return;
      e.preventDefault();
      abrir();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [abrir]);

  // Mientras el aviso está abierto, los flotantes (WhatsApp, volver arriba) suben
  // para no quedar debajo de él (solo en móvil, ver theme.css).
  useEffect(() => {
    const raiz = document.documentElement;
    if (!visible || !caja.current) {
      raiz.classList.remove("cookies-abierto");
      raiz.style.removeProperty("--cookies-h");
      return;
    }
    const medir = () => raiz.style.setProperty("--cookies-h", `${caja.current?.offsetHeight ?? 0}px`);
    medir();
    raiz.classList.add("cookies-abierto");
    const ro = new ResizeObserver(medir);
    ro.observe(caja.current);
    return () => ro.disconnect();
  }, [visible]);

  const decidir = (c: Consentimiento) => {
    guardar(c);
    setVisible(false);
    document.dispatchEvent(new CustomEvent("homea:consent", { detail: c }));
    void enviarAShopify(c, tienda, token);
  };

  if (!visible) return null;

  const aceptadas = previa ? previa.analitica || previa.publicidad : null;

  return (
    <div ref={caja} className="ck" role="dialog" aria-modal="false" aria-labelledby="ck-t">
      <p className="ck-t" id="ck-t">
        Usamos cookies para que el sitio funcione y, con tu permiso, para medir visitas y campañas.{" "}
        <a href="/aviso-de-privacidad#cookies">Conoce más</a>.
      </p>
      {aceptadas !== null && (
        <p className="ck-estado">Tu elección actual: {aceptadas ? "aceptadas" : "solo necesarias"}.</p>
      )}
      <div className="ck-acts">
        <button type="button" className="ck-btn ck-btn--oro" onClick={() => decidir(TODO)}>
          Aceptar
        </button>
        <button type="button" className="ck-btn ck-btn--linea" onClick={() => decidir(NADA)}>
          Solo necesarias
        </button>
      </div>
    </div>
  );
}
