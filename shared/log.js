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
