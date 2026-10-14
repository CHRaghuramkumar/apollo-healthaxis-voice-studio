(() => {
  const grid = document.getElementById('ucGrid');
  if (!grid) return;
  const css = document.createElement('style');
  css.textContent = `.usecase{padding-bottom:32px;cursor:grab;user-select:none;-webkit-user-select:none}
.usecase:active{cursor:grabbing}
.usecase.dragging{opacity:.4;transform:scale(.98)}
.usecase.drop-before{box-shadow:-4px 0 0 0 var(--accent,#fc9916)}
.usecase.drop-after{box-shadow:4px 0 0 0 var(--accent,#fc9916)}
.usecase .grip{position:absolute;left:14px;bottom:10px;display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;color:#9aa6b6;letter-spacing:.02em}
.usecase .grip svg{width:12px;height:12px}
.usecase:hover .grip{color:var(--blue,#0087ba)}
#ucGrid .usecase kbd{display:none}
#ucGrid .usecase .grip{opacity:0;transition:opacity .15s}
#ucGrid .usecase:hover .grip,#ucGrid .usecase:focus-visible .grip{opacity:1}`;
  document.head.appendChild(css);

  const KEY = 'ahx-uc-order-ids';
  const GRIP = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  const cards = () => [...grid.querySelectorAll('.usecase')];
  const visible = () => cards().filter(b => !b.hidden);
  const relabel = () => visible().forEach((b, n) => { const k = b.querySelector('kbd'); if (k) k.textContent = String(n + 1); });

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cards().map(b => b.dataset.id))); } catch (e) {}
  }
  function apply(order) {
    const map = {};
    cards().forEach(b => { map[b.dataset.id] = b; });
    order.forEach(id => { if (map[id]) grid.appendChild(map[id]); });
    relabel();
  }
  window.mountUseCaseDrag = function mountUseCaseDrag() {
    cards().forEach(b => {
      b.draggable = true;
      if (!b.querySelector('.grip')) {
        const g = document.createElement('span');
        g.className = 'grip';
        g.innerHTML = GRIP + 'Drag';
        b.appendChild(g);
      }
    });
    try {
      const order = JSON.parse(localStorage.getItem(KEY) || 'null');
      const ids = cards().map(b => b.dataset.id);
      if (Array.isArray(order) && order.length === ids.length && ids.every(id => order.includes(id))) apply(order);
      else relabel();
    } catch (e) { relabel(); }
  };
  window.resetUseCaseOrder = function resetUseCaseOrder() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  };

  let dragged = null;
  const clearMarks = () => cards().forEach(c => c.classList.remove('drop-before', 'drop-after'));
  grid.addEventListener('dragstart', e => {
    const b = e.target.closest('.usecase');
    if (!b || b.hidden) return;
    dragged = b;
    b.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', b.dataset.id); } catch (_) {}
  });
  grid.addEventListener('dragover', e => {
    if (!dragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const t = e.target.closest('.usecase');
    clearMarks();
    if (!t || t === dragged) return;
    const r = t.getBoundingClientRect();
    t.classList.add(e.clientX < r.left + r.width / 2 ? 'drop-before' : 'drop-after');
  });
  grid.addEventListener('drop', e => {
    if (!dragged) return;
    e.preventDefault();
    const t = e.target.closest('.usecase');
    if (t && t !== dragged) {
      const r = t.getBoundingClientRect();
      if (e.clientX < r.left + r.width / 2) grid.insertBefore(dragged, t);
      else grid.insertBefore(dragged, t.nextSibling);
      relabel();
      save();
    }
    clearMarks();
  });
  grid.addEventListener('dragend', () => {
    if (dragged) dragged.classList.remove('dragging');
    dragged = null;
    clearMarks();
  });

  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('select,input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key >= '1' && e.key <= '9') {
      const b = visible()[+e.key - 1];
      if (b) { e.preventDefault(); b.click(); }
    }
  });
})();
