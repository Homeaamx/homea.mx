// /api/buscar-guias — índice global del buscador de Guías (lib/guiasIndice).
//
// Estático con ISR: se arma una vez por hora (o al momento con
// /api/revalidar-guias, que también lo refresca) y el CDN lo sirve como JSON.
// GuiaSearch lo pide la primera vez que alguien usa el buscador.

import { NextResponse } from "next/server";

import { indiceGuias } from "@/lib/guiasIndice";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(await indiceGuias());
}
