// ConNegritas — pinta en negritas lo que va entre **…** en un texto (Carla,
// 2026-11-05: las partes importantes de los avisos y las notas del proyecto).
// Así los textos siguen siendo cadenas simples, fáciles de leer y de cambiar.

import { Fragment } from "react";

export default function ConNegritas({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
        i % 2 ? <strong key={i}>{parte}</strong> : <Fragment key={i}>{parte}</Fragment>,
      )}
    </>
  );
}
