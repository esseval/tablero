/**
 * createLog — factory que retorna una función para registrar mensajes
 * en un elemento del DOM cuyo scroll avanza automáticamente.
 *
 * Útil para mostrar un historial o bitácora de eventos del juego
 * (ej: resultados de combate, objetos recogidos, mensajes del sistema).
 *
 * @param {string} elementId — id del contenedor HTML donde se
 *   agregarán las líneas de log (debe ser un elemento scrollable).
 * @returns {(txt: string, cls?: string) => void} — función que
 *   agrega una línea al log. `txt` es el texto a mostrar; `cls`
 *   es una clase CSS opcional para estilizar la línea.
 */
export function createLog(elementId) {
  return function log(txt, cls = '') {
    const el = document.getElementById(elementId);
    const div = document.createElement('div');
    div.className = cls;
    div.textContent = txt;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  };
}
