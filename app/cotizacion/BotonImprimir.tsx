"use client";

// Imprimir / guardar como PDF la cotización preliminar: el navegador hace el
// PDF (sin dependencia de generación en el servidor).
export default function BotonImprimir() {
  return (
    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
      Imprimir o guardar PDF
    </button>
  );
}
