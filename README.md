# Oiru Bio · Floresta Viva — App de Rastreabilidade

App web (PWA) de rastreabilidade de copaibeiras. Funciona **offline** e é **instalável** no celular.

## O que faz
- 🌳 Cadastro de copaibeira: nome popular, nome científico (opcional), CPF do produtor, latitude/longitude (GPS automático ou manual)
- 📍 Geolocalização: pega a coordenada exata da árvore
- 🛢️ Registro de extração (árvore + data + volume + observação)
- 📤 Exportação em CSV (árvores) e JSON (tudo)
- 💾 Dados salvos no próprio aparelho (localStorage) — funciona sem internet
- 🔗 Base do vínculo árvore → produtor → lote

## Como testar agora (no computador)
Rode um servidor local dentro desta pasta:

```bash
cd "~/Desktop/OIRU BIO/13_App_Rastreabilidade"
python3 -m http.server 8080
```

Depois abra no navegador: **http://localhost:8080**

## Como testar no celular (Android)
1. Publique esta pasta em qualquer host (GitHub Pages, Netlify, Vercel…) — ou use o mesmo servidor local na rede
2. Abra o link no navegador do celular
3. No menu do navegador → **"Adicionar à tela inicial"** → o app aparece como um ícone
4. Depois de abrir uma vez, ele **funciona sem internet** (service worker)

## Próximos passos (Fase 2 — Maicon)
- Integrar o módulo de **leitura do sensor por Bluetooth** (Web Bluetooth no Android)
- Gerar o APK/IPA nativo e publicar nas lojas

## Estrutura
- `index.html` — interface (HTML + CSS)
- `app.js` — lógica (cadastro, GPS, extração, exportação)
- `manifest.json` — identidade PWA
- `sw.js` — service worker (offline)
- `icon.svg` — ícone
