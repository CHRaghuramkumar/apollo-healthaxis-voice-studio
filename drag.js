(()=>{
const grid=document.getElementById('ucGrid');if(!grid)return;
const css=document.createElement('style');
css.textContent=`.usecase{padding-bottom:32px;cursor:grab;user-select:none;-webkit-user-select:none}
.usecase:active{cursor:grabbing}
.usecase.dragging{opacity:.4;transform:scale(.98)}
.usecase.drop-before{box-shadow:-4px 0 0 0 var(--accent,#fc9916)}
.usecase.drop-after{box-shadow:4px 0 0 0 var(--accent,#fc9916)}
.usecase .grip{position:absolute;left:14px;bottom:10px;display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;color:#9aa6b6;letter-spacing:.02em}
.usecase .grip svg{width:12px;height:12px}
.usecase:hover .grip{color:var(--blue,#0087ba)}`;
document.head.appendChild(css);

const KEY='ahx-uc-order';
const cards=()=>[...grid.querySelectorAll('.usecase')];
const DEF=cards().map(b=>b.dataset.i);
const GRIP='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';

function relabel(){cards().forEach((b,n)=>{const k=b.querySelector('kbd');if(k)k.textContent=n+1})}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cards().map(b=>b.dataset.i)))}catch(e){}}
function apply(order){const map={};cards().forEach(b=>{map[b.dataset.i]=b});order.forEach(i=>{if(map[i])grid.appendChild(map[i])});relabel()}

const hint=grid.parentElement.querySelector('.stephead .hint');
if(hint)hint.textContent='Select a scenario · drag to reorder';

cards().forEach(b=>{
 b.draggable=true;
 const g=document.createElement('span');g.className='grip';g.innerHTML=GRIP+'Drag';b.appendChild(g);
});
try{const o=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(o)&&o.length===DEF.length&&DEF.every(i=>o.includes(i)))apply(o)}catch(e){}

let dragged=null;
const clearMarks=()=>cards().forEach(c=>c.classList.remove('drop-before','drop-after'));
grid.addEventListener('dragstart',e=>{
 const b=e.target.closest('.usecase');if(!b)return;
 dragged=b;b.classList.add('dragging');
 e.dataTransfer.effectAllowed='move';
 try{e.dataTransfer.setData('text/plain',b.dataset.i)}catch(_){}
});
grid.addEventListener('dragover',e=>{
 if(!dragged)return;e.preventDefault();e.dataTransfer.dropEffect='move';
 const t=e.target.closest('.usecase');clearMarks();
 if(!t||t===dragged)return;
 const r=t.getBoundingClientRect();
 t.classList.add(e.clientX<r.left+r.width/2?'drop-before':'drop-after');
});
grid.addEventListener('drop',e=>{
 if(!dragged)return;e.preventDefault();
 const t=e.target.closest('.usecase');
 if(t&&t!==dragged){
  const r=t.getBoundingClientRect();
  if(e.clientX<r.left+r.width/2)grid.insertBefore(dragged,t);else grid.insertBefore(dragged,t.nextSibling);
  relabel();save();
 }
 clearMarks();
});
grid.addEventListener('dragend',()=>{if(dragged)dragged.classList.remove('dragging');dragged=null;clearMarks()});

// 1–6 follow the on-screen order
document.addEventListener('keydown',e=>{
 if(e.target.closest&&e.target.closest('select,input,textarea')||e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.key>='1'&&e.key<='9'){const b=cards()[+e.key-1];if(b){e.stopImmediatePropagation();b.click()}}
},true);

// Reset demo restores the default order
const reset=document.getElementById('resetBtn');
if(reset)reset.addEventListener('click',()=>{apply(DEF);try{localStorage.removeItem(KEY)}catch(e){}});
})();
