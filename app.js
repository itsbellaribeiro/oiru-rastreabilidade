// Oiru Bio · lógica do app de rastreabilidade
const DB = {
  arvores: 'oiru_arvores',
  extracoes: 'oiru_extracoes'
};

function ler(chave){ try { return JSON.parse(localStorage.getItem(chave)) || []; } catch(e){ return []; } }
function gravar(chave, v){ localStorage.setItem(chave, JSON.stringify(v)); }

function novoId(prefixo){
  const n = ler(DB.arvores).length + 1;
  return prefixo + '-' + String(n).padStart(4, '0');
}

// ---------- Navegação ----------
const navBtns = document.querySelectorAll('nav button');
function trocarView(v){
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  document.getElementById('view-' + v).classList.remove('hidden');
  navBtns.forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if(v === 'lista') renderLista();
  if(v === 'ext') renderSelectArvores();
}
navBtns.forEach(b => b.addEventListener('click', () => trocarView(b.dataset.v)));

// ---------- Toast ----------
let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- GPS ----------
document.getElementById('btn-gps').addEventListener('click', () => {
  const dot = document.getElementById('gps-dot');
  const txt = document.getElementById('gps-txt');
  txt.textContent = 'Buscando sinal...';
  if(!navigator.geolocation){ txt.textContent = 'GPS não suportado neste aparelho'; return; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('f-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('f-lon').value = pos.coords.longitude.toFixed(6);
      dot.classList.add('ok'); txt.textContent = 'Localização capturada ✓';
    },
    err => { txt.textContent = 'Não foi possível pegar o GPS. Digite manualmente.'; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

// ---------- Cadastro de árvore ----------
document.getElementById('btn-salvar').addEventListener('click', () => {
  const nome = document.getElementById('f-nome').value.trim();
  const cien = document.getElementById('f-cientifico').value.trim();
  const cpf  = document.getElementById('f-cpf').value.trim();
  const cnpj = document.getElementById('f-cnpj').value.trim();
  const lat  = document.getElementById('f-lat').value.trim();
  const lon  = document.getElementById('f-lon').value.trim();

  if(!nome){ toast('Preencha o nome popular'); return; }
  if(!cpf){ toast('Preencha o CPF do produtor'); return; }
  if(!lat || !lon){ toast('Informe latitude e longitude (use o GPS)'); return; }

  const arvore = {
    id: novoId('OIRU'),      // número da plaqueta
    nome, cien, cpf, cnpj, lat, lon,
    criado: new Date().toISOString()
  };
  const lista = ler(DB.arvores);
  lista.push(arvore);
  gravar(DB.arvores, lista);

  ['f-nome','f-cientifico','f-cpf','f-cnpj','f-lat','f-lon'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('gps-dot').classList.remove('ok');
  document.getElementById('gps-txt').textContent = 'GPS ainda não usado';

  toast('Plaqueta ' + arvore.id + ' salva ✓');
  trocarView('lista');
});

// ---------- Lista ----------
function renderLista(){
  const arv = ler(DB.arvores);
  const ext = ler(DB.extracoes);
  document.getElementById('n-arvores').textContent = arv.length;
  document.getElementById('n-ext').textContent = ext.length;

  const el = document.getElementById('lista');
  if(!arv.length){
    el.innerHTML = '<div class="empty"><span class="ico">🌱</span>Nenhuma copaibeira cadastrada ainda.<br>Toque em "Nova" para começar.</div>';
    return;
  }
  el.innerHTML = arv.slice().reverse().map(a => {
    const nExt = ext.filter(e => e.arvoreId === a.id).length;
    return `<div class="lista-item">
      <div class="t">${a.nome} <span style="color:var(--muted);font-weight:600;">· ${a.id}</span></div>
      <div class="s">📍 ${a.lat}, ${a.lon}<br>CPF: ${a.cpf}${a.cnpj ? '<br>CNPJ: '+a.cnpj : ''}${a.cien ? '<br>'+a.cien : ''}</div>
      <span class="tag">${nExt} extração(ões)</span>
    </div>`;
  }).join('');
}

// ---------- Extração ----------
function renderSelectArvores(){
  const arv = ler(DB.arvores);
  const sel = document.getElementById('ext-arvore');
  sel.innerHTML = arv.length
    ? arv.map(a => `<option value="${a.id}">${a.nome} · ${a.id}</option>`).join('')
    : '<option value="">Nenhuma árvore cadastrada</option>';
  document.getElementById('ext-data').value = new Date().toISOString().slice(0,10);
}

document.getElementById('btn-salvar-ext').addEventListener('click', () => {
  const arvoreId = document.getElementById('ext-arvore').value;
  const data = document.getElementById('ext-data').value;
  const volume = document.getElementById('ext-volume').value.trim();
  const lote = document.getElementById('ext-lote').value.trim();
  const obs = document.getElementById('ext-obs').value.trim();
  if(!arvoreId){ toast('Cadastre uma árvore primeiro'); return; }
  if(!data){ toast('Informe a data'); return; }
  if(!lote){ toast('Informe o número do lote'); return; }

  const ext = ler(DB.extracoes);
  ext.push({ id: novoId('EXT'), arvoreId, data, volume, lote, obs, criado: new Date().toISOString() });
  gravar(DB.extracoes, ext);
  ['ext-volume','ext-lote','ext-obs'].forEach(id => document.getElementById(id).value = '');
  toast('Extração registrada ✓');
  renderSelectArvores();
});

// ---------- Exportar ----------
function baixar(nome, conteudo, tipo){
  const blob = new Blob([conteudo], {type: tipo});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('btn-csv').addEventListener('click', () => {
  const arv = ler(DB.arvores);
  if(!arv.length){ toast('Nada para exportar'); return; }
  const linhas = [['plaqueta','nome_popular','nome_cientifico','cpf','cnpj','latitude','longitude','criado']];
  arv.forEach(a => linhas.push([a.id, a.nome, a.cien, a.cpf, a.cnpj, a.lat, a.lon, a.criado]));
  const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  baixar('oiru_arvores.csv', csv, 'text/csv');
  toast('CSV baixado ✓');
});

document.getElementById('btn-json').addEventListener('click', () => {
  const tudo = { arvores: ler(DB.arvores), extracoes: ler(DB.extracoes), exportado: new Date().toISOString() };
  baixar('oiru_dados.json', JSON.stringify(tudo, null, 2), 'application/json');
  toast('JSON baixado ✓');
});

// ---------- Service worker ----------
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// inicial
trocarView('lista');
