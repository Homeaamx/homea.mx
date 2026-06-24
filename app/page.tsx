import Link from "next/link";
import type { Metadata } from "next";

// Home mínimo. El front-end completo se construye aparte; esta raíz solo evita un 404
// y ofrece la entrada al centro de Guías (el alcance de este trabajo).
export const metadata: Metadata = {
  title: "HOMEA — Electrodomésticos premium",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <section className="sec">
      <div className="container">
        <div className="eyebrow">HOMEA</div>
        <span className="rule-gold" />
        <h1 style={{ marginTop: 18 }}>
          Equipamiento que está <i>a la altura de tu hogar</i>.
        </h1>
        <p className="sub" style={{ marginTop: 18 }}>
          El front-end está en construcción. Mientras tanto, visita nuestro centro de guías.
        </p>
        <p style={{ marginTop: 28 }}>
          <Link className="btn btn-primary" href="/guias/">
            Ir a Guías
          </Link>
        </p>
      </div>
    </section>
  );
}
