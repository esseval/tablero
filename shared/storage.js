export function download(content, filename, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

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
