// PaginaPolitica — página legal (aviso de privacidad, términos) con el texto que
// vive en Shopify (lib/shopify/politicas.ts) y el diseño del sitio.

import Link from "next/link";

import { obtenerPolitica, type TipoPolitica } from "@/lib/shopify/politicas";

type Props = {
  tipo: TipoPolitica;
  /** Título de la página: el de Shopify viene en mayúsculas ("AVISO DE PRIVACIDAD INTEGRAL"). */
  titulo: string;
};

export default async function PaginaPolitica({ tipo, titulo }: Props) {
  const politica = await obtenerPolitica(tipo);

  return (
    <>
      <style>{`
        .politica{max-width:760px}
        .politica h2{font-family:var(--font-sans);font-size:13px;font-weight:600;letter-spacing:.22em;
          text-transform:uppercase;color:var(--accent-text);margin:56px 0 16px;padding-top:28px;
          border-top:1px solid var(--border)}
        .politica h2:first-child{margin-top:0;padding-top:0;border-top:none}
        .politica h3{font-size:17px;margin:28px 0 10px}
        .politica p,.politica li{font-size:16px;font-weight:300;line-height:1.7;color:var(--fg)}
        .politica p{margin:0 0 14px}
        .politica ul,.politica ol{margin:0 0 18px;padding-left:1.3em;display:grid;gap:6px}
        .politica b,.politica strong{font-weight:600}
        .politica a{color:var(--accent-text)}
      `}</style>

      <header className="page-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Inicio</Link>
            <span className="sep">·</span>
            <span aria-current="page">{titulo}</span>
          </div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            New Products Connection, S.A. de C.V. · HOMEA
          </div>
          <h1>{titulo}</h1>
          {politica?.actualizacion && <p className="sub">{politica.actualizacion}</p>}
        </div>
      </header>

      <section className="sec tight">
        <div className="container">
          {politica ? (
            // Texto que Carla edita en el admin de Shopify, ya limpio de estilos.
            <div className="politica" dangerouslySetInnerHTML={{ __html: politica.html }} />
          ) : (
            // Shopify no respondió: nunca una página vacía en un texto obligatorio.
            <div className="politica">
              <p>
                No pudimos cargar el documento en este momento. Para cualquier duda sobre el tratamiento
                de tus datos personales escríbenos a{" "}
                <a href="mailto:administracion@homea.mx">administracion@homea.mx</a> o llama al (442) 216
                3552.
              </p>
              <p>
                New Products Connection, S.A. de C.V. · Calle Ahuehuetes No. 7, Col. Álamos 1a Sección,
                C.P. 76160, Querétaro, Qro.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
