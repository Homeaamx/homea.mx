// MarketingPage — renderiza el contenido principal de una página del preview
// (HTML estático del design system v2) dentro de una ruta Next, en SSG.

import { getMain } from "@/lib/preview";

export default function MarketingPage({ file }: { file: string }) {
  const html = getMain(file);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
