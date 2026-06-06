/**
 * download — genera un archivo en memoria y lo descarga en el
 * navegador, simulando un clic en un enlace.
 *
 * Útil para exportar datos del juego (mapas, partidas, logs) como
 * archivos JSON, CSV o de texto.
 *
 * @param {string} content — contenido del archivo (texto plano).
 * @param {string} filename — nombre sugerido para el archivo
 *   (ej: "partida.json").
 * @param {string} type — MIME type del archivo
 *   (ej: "application/json", "text/csv").
 */
export function download(content, filename, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * readJSON — lee un archivo JSON seleccionado por el usuario en un
 * input[type=file] y lo parsea, entregando el resultado a un callback.
 *
 * Si el archivo no es JSON válido, el callback recibe `null` como
 * primer argumento y un mensaje de error como segundo.
 *
 * @param {Event} evt — evento `change` de un input[type=file].
 * @param {(data: any | null, err?: string) => void} cb — función que
 *   recibe los datos parseados (primer argumento) o, si falla el
 *   parseo, recibe `null` y un mensaje de error (segundo argumento).
 */
export function readJSON(evt, cb) {
  const file = evt.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    try { cb(JSON.parse(e.target.result)); }
    catch { cb(null, 'JSON inválido'); }
  };
  r.readAsText(file);
  evt.target.value = '';
}
