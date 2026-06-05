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

export function closeModal() {
  document.getElementById('overlay').classList.remove('on');
}
