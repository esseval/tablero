/**
 * showModal — abre un diálogo modal superpuesto con título,
 * mensaje y botones personalizados.
 *
 * El modal asume que en el HTML existen los elementos:
 *   - #modal-title, #modal-body, #modal-btns, #overlay
 *
 * @param {string} title — texto del encabezado del modal.
 * @param {string} body  — texto del cuerpo del mensaje.
 * @param {{ label: string, fn: Function, cls?: string }[]} btns —
 *   configuración de botones. Cada objeto debe tener:
 *     - label: texto del botón
 *     - fn:    función a ejecutar al hacer clic (el modal se cierra
 *              automáticamente antes de llamarla)
 *     - cls:   clase CSS opcional para el botón
 */
export function showModal(title, body, btns) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').textContent  = body;
  const cont = document.getElementById('modal-btns');
  cont.innerHTML = '';
  btns.forEach(b => {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    if (b.cls) btn.className = b.cls;
    btn.onclick = () => { closeModal(); b.fn(); };
    cont.appendChild(btn);
  });
  document.getElementById('overlay').classList.add('on');
}

/**
 * closeModal — oculta el modal superpuesto quitando la clase `on`
 * del elemento #overlay.
 */
export function closeModal() {
  document.getElementById('overlay').classList.remove('on');
}
