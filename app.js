// Oiru Bio — rastreabilidade de copaíba (produtor → árvore → extração)
const DB = { produtores:'oiru_produtores', arvores:'oiru_arvores', extracoes:'oiru_extracoes' };

function ler(chave){ try { return JSON.parse(localStorage.getItem(chave)) || []; } catch(e){ return []; } }
function gravar(chave, v){ localStorage.setItem(chave, JSON.stringify(v)); }

function novoId(prefixo, chave){
  const n = ler(chave).length + 1;
  return prefixo + '-' + String(n).padStart(4, '0');
}

// ---------- navegação ----------
const navBtns = document.querySelectorAll('nav button');
function trocarView(v){
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  document.getElementById('view-' + v).classList.remove('hidden');
  navBtns.forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if(v === 'arvores') renderArvores();
  if(v === 'produtores') renderProdutores();
  if(v === 'extracao') renderSelectArvores();
  if(v === 'nova-arvore') renderSelectProdutores();
  if(v === 'exportar') renderStat();
}
navBtns.forEach(b => b.addEventListener('click', () => trocarView(b.dataset.v)));

// botões de navegação extra
document.getElementById('btn-add-arvore').addEventListener('click', () => { resetFormArvore(); trocarView('nova-arvore'); });
document.getElementById('btn-voltar-arv').addEventListener('click', () => trocarView('arvores'));
document.getElementById('btn-add-prod').addEventListener('click', () => { resetFormProdutor(); trocarView('novo-produtor'); });
document.getElementById('btn-voltar-prod').addEventListener('click', () => trocarView('produtores'));

// ---------- toast ----------
let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ---------- foto (comprime e vira base64) ----------
function processarFoto(file, cb){
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 900;
      let w = img.width, h = img.height;
      if(w > MAX){ h = Math.round(h * MAX / w); w = MAX; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', 0.62));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function ligarFoto(btnId, inputId, previewId, imgId, target){
  document.getElementById(btnId).addEventListener('click', () => document.getElementById(inputId).click());
  document.getElementById(inputId).addEventListener('change', ev => {
    const f = ev.target.files[0];
    if(!f) return;
    processarFoto(f, dataUrl => {
      target.foto = dataUrl;
      document.getElementById(imgId).src = dataUrl;
      document.getElementById(previewId).classList.add('on');
      toast('Foto anexada ✓');
    });
  });
}

// ---------- GPS ----------
document.getElementById('btn-gps').addEventListener('click', () => {
  const txt = document.getElementById('gps-txt');
  txt.textContent = 'Buscando sinal…';
  if(!navigator.geolocation){ txt.textContent = 'GPS não suportado'; return; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('f-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('f-lon').value = pos.coords.longitude.toFixed(6);
      document.getElementById('gps-dot').style.background = 'var(--lima)';
      txt.textContent = 'Localização capturada ✓';
    },
    () => { txt.textContent = 'Não foi possível pegar o GPS — digite manualmente.'; },
    { enableHighAccuracy:true, timeout:10000 }
  );
});

// ============ PRODUTORES ============
let produtorAtual = { foto:null };
function resetFormProdutor(){
  ['p-nome','p-cpf','p-cnpj','p-comunidade','p-endereco','p-telefone'].forEach(id => document.getElementById(id).value='');
  produtorAtual = { foto:null };
}
document.getElementById('btn-salvar-prod').addEventListener('click', () => {
  const nome = document.getElementById('p-nome').value.trim();
  const cpf = document.getElementById('p-cpf').value.trim();
  if(!nome){ toast('Informe o nome do produtor'); return; }
  if(!cpf){ toast('Informe o CPF'); return; }
  const prod = {
    id: novoId('P', DB.produtores),
    nome, cpf,
    cnpj: document.getElementById('p-cnpj').value.trim(),
    comunidade: document.getElementById('p-comunidade').value.trim(),
    endereco: document.getElementById('p-endereco').value.trim(),
    telefone: document.getElementById('p-telefone').value.trim(),
    criado: new Date().toISOString()
  };
  const lista = ler(DB.produtores);
  lista.push(prod);
  gravar(DB.produtores, lista);
  resetFormProdutor();
  toast('Produtor ' + prod.nome.split(' ')[0] + ' salvo ✓');
  trocarView('produtores');
});
function renderProdutores(){
  const lista = ler(DB.produtores);
  document.getElementById('n-prod').textContent = lista.length;
  const el = document.getElementById('lista-produtores');
  if(!lista.length){
    el.innerHTML = '<div class="empty"><span class="ico">👤</span>Nenhum produtor ainda.<br>Cadastre antes de registrar as árvores.</div>';
    return;
  }
  el.innerHTML = lista.slice().reverse().map(p =>
    `<div class="item"><div class="t">${p.nome} <span class="pid">· ${p.id}</span></div>
     <div class="s">CPF: ${p.cpf}${p.cnpj ? '<br>CNPJ: '+p.cnpj : ''}${p.comunidade ? '<br>📍 '+p.comunidade : ''}${p.telefone ? '<br>📞 '+p.telefone : ''}</div></div>`
  ).join('');
}
function renderSelectProdutores(){
  const lista = ler(DB.produtores);
  const sel = document.getElementById('f-produtor');
  sel.innerHTML = lista.length
    ? '<option value="">Selecione…</option>' + lista.map(p => `<option value="${p.id}">${p.nome} (${p.cpf})</option>`).join('')
    : '<option value="">Cadastre um produtor primeiro</option>';
}

// ============ ÁRVORES ============
let arvoreAtual = { foto:null };
ligarFoto('btn-foto-arv', 'foto-arv-input', 'foto-arv-preview', 'foto-arv-img', arvoreAtual);

function resetFormArvore(){
  ['f-nome','f-cientifico','f-lat','f-lon','f-dap','f-circ','f-altura','f-saude','f-ohm','f-marcacao','f-obs'].forEach(id => document.getElementById(id).value='');
  document.getElementById('f-produtor').value = '';
  document.getElementById('f-id').value = novoId('OIRU', DB.arvores);
  document.getElementById('foto-arv-preview').classList.remove('on');
  document.getElementById('gps-dot').style.background = 'var(--muted)';
  document.getElementById('gps-txt').textContent = 'GPS ainda não usado';
  arvoreAtual.foto = null;
}

document.getElementById('btn-salvar-arv').addEventListener('click', () => {
  const produtorId = document.getElementById('f-produtor').value;
  const nome = document.getElementById('f-nome').value.trim();
  const lat = document.getElementById('f-lat').value.trim();
  const lon = document.getElementById('f-lon').value.trim();
  if(!produtorId){ toast('Selecione o produtor (cadastre antes se preciso)'); return; }
  if(!nome){ toast('Informe o nome da árvore'); return; }
  if(!lat || !lon){ toast('Informe latitude e longitude (use o GPS)'); return; }

  const arv = {
    id: document.getElementById('f-id').value || novoId('OIRU', DB.arvores),
    produtorId, nome,
    cientifico: document.getElementById('f-cientifico').value.trim(),
    foto: arvoreAtual.foto,
    lat, lon,
    dap: document.getElementById('f-dap').value.trim(),
    circ: document.getElementById('f-circ').value.trim(),
    altura: document.getElementById('f-altura').value.trim(),
    saude: document.getElementById('f-saude').value,
    marcacao: document.getElementById('f-marcacao').value,
    ohm: document.getElementById('f-ohm').value.trim(),
    obs: document.getElementById('f-obs').value.trim(),
    criado: new Date().toISOString()
  };
  const lista = ler(DB.arvores);
  lista.push(arv);
  gravar(DB.arvores, lista);
  toast('Árvore ' + arv.id + ' salva ✓');
  trocarView('arvores');
});

function nomeProdutor(id){
  const p = ler(DB.produtores).find(x => x.id === id);
  return p ? p.nome.split(' ')[0] : '—';
}
function renderArvores(){
  const arv = ler(DB.arvores);
  const ext = ler(DB.extracoes);
  document.getElementById('n-arvores').textContent = arv.length;
  document.getElementById('n-ext').textContent = ext.length;
  const el = document.getElementById('lista-arvores');
  if(!arv.length){
    el.innerHTML = '<div class="empty"><span class="ico">🌱</span>Nenhuma copaibeira ainda.<br>Toque em "+ Nova" para registrar.</div>';
    return;
  }
  el.innerHTML = arv.slice().reverse().map(a => {
    const nExt = ext.filter(e => e.arvoreId === a.id).length;
    const foto = a.foto ? `<img class="thumb" src="${a.foto}">` : '';
    return `<div class="item">${foto}
      <div class="t">${a.nome} <span class="pid">· ${a.id}</span></div>
      <div class="s">👤 ${nomeProdutor(a.produtorId)}<br>📍 ${a.lat}, ${a.lon}${a.ohm ? '<br>🔬 '+a.ohm+' ohm' : ''}${a.saude ? '<br>🌿 '+a.saude : ''}</div>
      <div class="s" style="color:var(--laranja);font-weight:600;margin-top:5px;">${nExt} extração(ões)</div>
    </div>`;
  }).join('');
}

// ============ EXTRAÇÃO ============
let extracaoAtual = { foto:null };
ligarFoto('btn-foto-ext', 'foto-ext-input', 'foto-ext-preview', 'foto-ext-img', extracaoAtual);

function renderSelectArvores(){
  const arv = ler(DB.arvores);
  const sel = document.getElementById('ext-arvore');
  sel.innerHTML = arv.length
    ? '<option value="">Selecione…</option>' + arv.map(a => `<option value="${a.id}">${a.nome} · ${a.id}</option>`).join('')
    : '<option value="">Nenhuma árvore cadastrada</option>';
  document.getElementById('ext-data').value = new Date().toISOString().slice(0,10);
}
document.getElementById('btn-salvar-ext').addEventListener('click', () => {
  const arvoreId = document.getElementById('ext-arvore').value;
  const data = document.getElementById('ext-data').value;
  const lote = document.getElementById('ext-lote').value.trim();
  if(!arvoreId){ toast('Selecione a árvore'); return; }
  if(!data){ toast('Informe a data'); return; }
  if(!lote){ toast('Informe o número do lote'); return; }

  const ext = {
    id: novoId('EXT', DB.extracoes),
    arvoreId, data,
    ohm: document.getElementById('ext-ohm').value.trim(),
    volume: document.getElementById('ext-volume').value.trim(),
    lote,
    foto: extracaoAtual.foto,
    obs: document.getElementById('ext-obs').value.trim(),
    criado: new Date().toISOString()
  };
  const lista = ler(DB.extracoes);
  lista.push(ext);
  gravar(DB.extracoes, lista);
  ['ext-ohm','ext-volume','ext-lote','ext-obs'].forEach(id => document.getElementById(id).value='');
  document.getElementById('foto-ext-preview').classList.remove('on');
  extracaoAtual.foto = null;
  toast('Extração registrada ✓');
  renderSelectArvores();
});

// ============ EXPORTAR ============
function renderStat(){
  document.getElementById('n-arvores').textContent = ler(DB.arvores).length;
  document.getElementById('n-prod').textContent = ler(DB.produtores).length;
  document.getElementById('n-ext').textContent = ler(DB.extracoes).length;
}
function baixar(nome, conteudo, tipo){
  const blob = new Blob([conteudo], {type: tipo});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome; a.click();
  URL.revokeObjectURL(a.href);
}
function toCSV(linhas){
  return linhas.map(l => l.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
}
document.getElementById('btn-csv-arv').addEventListener('click', () => {
  const arv = ler(DB.arvores);
  if(!arv.length){ toast('Sem árvores para exportar'); return; }
  const L = [['plaqueta','nome','cientifico','produtor_id','produtor','cpf','lat','lon','dap','circ','altura','saude','marcacao','ohm','obs','criado']];
  arv.forEach(a => { const p = ler(DB.produtores).find(x=>x.id===a.produtorId)||{}; L.push([a.id,a.nome,a.cientifico,a.produtorId,p.nome,p.cpf,a.lat,a.lon,a.dap,a.circ,a.altura,a.saude,a.marcacao,a.ohm,a.obs,a.criado]); });
  baixar('oiru_arvores.csv', toCSV(L), 'text/csv'); toast('CSV de árvores ✓');
});
document.getElementById('btn-csv-prod').addEventListener('click', () => {
  const p = ler(DB.produtores);
  if(!p.length){ toast('Sem produtores'); return; }
  const L = [['id','nome','cpf','cnpj','comunidade','endereco','telefone','criado']];
  p.forEach(x => L.push([x.id,x.nome,x.cpf,x.cnpj,x.comunidade,x.endereco,x.telefone,x.criado]));
  baixar('oiru_produtores.csv', toCSV(L), 'text/csv'); toast('CSV de produtores ✓');
});
document.getElementById('btn-csv-ext').addEventListener('click', () => {
  const e = ler(DB.extracoes);
  if(!e.length){ toast('Sem extrações'); return; }
  const L = [['id','arvore_id','data','ohm','volume','lote','obs','criado']];
  e.forEach(x => L.push([x.id,x.arvoreId,x.data,x.ohm,x.volume,x.lote,x.obs,x.criado]));
  baixar('oiru_extracoes.csv', toCSV(L), 'text/csv'); toast('CSV de extrações ✓');
});
document.getElementById('btn-json').addEventListener('click', () => {
  const tudo = { produtores: ler(DB.produtores), arvores: ler(DB.arvores), extracoes: ler(DB.extracoes), exportado: new Date().toISOString() };
  baixar('oiru_dados.json', JSON.stringify(tudo, null, 2), 'application/json'); toast('JSON baixado ✓');
});

// ---------- service worker ----------
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// inicial
renderStat();
trocarView('arvores');
