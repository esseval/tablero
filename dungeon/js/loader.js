/**
 * Crea un elemento <script> dinámico, lo inyecta en el <head>
 * y registra los callbacks de carga y error.
 * @param {string}   src     - Ruta del archivo JS a cargar.
 * @param {Function} onload  - Callback ejecutado cuando el script cargó con éxito.
 * @param {Function} [onerror] - Callback ejecutado si el archivo no existe o falla.
 */
function loadScript(src, onload, onerror) {
  const s = document.createElement('script');
  s.src = src;
  s.onload = onload;
  if (onerror) s.onerror = onerror;
  document.head.appendChild(s);
}

/**
 * Carga en cadena los archivos de nivel declarados en LEVEL_MANIFEST.
 * @param {string[]} files - Lista de nombres de archivo sin extensión.
 * @param {number}   index - Índice actual en la lista.
 * @param {Function} done  - Callback ejecutado cuando todos los niveles cargaron.
 */
function loadLevels(files, index, done) {
  if (index >= files.length) { done(); return; }
  loadScript(`level/${files[index]}.js`, () => loadLevels(files, index + 1, done));
}

// Punto de entrada: carga game.js, luego el manifest, luego cada nivel declarado.
loadScript('js/game.js', () =>
  loadScript('level/manifest.js', () =>
    loadLevels(LEVEL_MANIFEST, 0, restartGame)
  )
);
