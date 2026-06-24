// JsonLd — inyecta un bloque <script type="application/ld+json"> renderizado en SSR.

export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // El contenido es estructurado y propio (no entrada de usuario).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
