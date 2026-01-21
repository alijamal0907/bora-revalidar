# Configuração PWA - Bora Revalidar

Este documento descreve a configuração completa do PWA (Progressive Web App) para o Bora Revalidar.

## Arquivos Criados/Configurados

### 1. Service Worker (`/public/sw.js`)
- ✅ Instalação e ativação automática
- ✅ Cache de recursos essenciais
- ✅ Estratégia Network First com fallback para Cache
- ✅ Suporte para modo offline
- ✅ Sincronização em background
- ✅ Notificações push (opcional)

### 2. Manifest (`/public/manifest.json`)
- ✅ `display: "standalone"` - Abre como app nativo
- ✅ `start_url: "/"` - URL inicial
- ✅ `scope: "/"` - Escopo do app
- ✅ Ícones 192x192 e 512x512 (any + maskable)
- ✅ Theme color: `#f97316` (laranja)
- ✅ Background color: `#0f172a` (azul escuro)
- ✅ Orientação: portrait-primary
- ✅ Categorias: education, medical, productivity

### 3. Ícones
- ✅ `/icons/icon-192.png` - 192x192 (Android)
- ✅ `/icons/icon-512.png` - 512x512 (Android)
- ✅ `/icons/apple-touch-icon.png` - 180x180 (iOS)

### 4. HTML Head (`/app/layout.tsx`)
- ✅ Link para manifest
- ✅ Theme color meta tag
- ✅ Apple touch icon
- ✅ Meta tags para Android
- ✅ Meta tags para iOS
- ✅ Viewport otimizado

### 5. Página Offline (`/app/offline/page.tsx`)
- ✅ Página de fallback quando offline
- ✅ Botão para tentar reconectar

### 6. PWA Installer (`/app/pwa-installer.tsx`)
- ✅ Registro automático do Service Worker
- ✅ Prompt de instalação para Android
- ✅ Instruções de instalação para iOS
- ✅ Controle de exibição (não mostra se já instalado)

### 7. Next.js Config (`/next.config.mjs`)
- ✅ Headers para Service Worker
- ✅ Cache control para manifest

## Como Testar

### Android (Chrome/Edge)

1. **Pré-requisitos:**
   - Site deve estar em HTTPS (ou localhost)
   - Service Worker registrado com sucesso
   - Manifest válido

2. **Instalação:**
   - Abra o site no Chrome/Edge
   - Aguarde o banner de instalação aparecer
   - OU: Menu (⋮) → "Instalar app" / "Add to Home Screen"
   - Aceite a instalação

3. **Verificação:**
   - Ícone aparece na tela inicial
   - App abre em fullscreen (sem barra do navegador)
   - Ícone personalizado (não genérico)

4. **Debug:**
   ```
   Chrome DevTools → Application → Manifest
   Chrome DevTools → Application → Service Workers
   Chrome DevTools → Lighthouse → PWA
   ```

### iOS (Safari)

1. **Instalação:**
   - Abra no Safari
   - Toque no botão Compartilhar
   - Role e selecione "Adicionar à Tela de Início"
   - Toque em "Adicionar"

2. **Nota:** iOS não suporta Service Workers completamente, mas o app funcionará como web app.

## Checklist de Compatibilidade PWA

- [x] `manifest.json` válido
- [x] `display: "standalone"`
- [x] `start_url` e `scope` configurados
- [x] Ícones 192x192 e 512x512
- [x] Ícone maskable (Android adaptativo)
- [x] Service Worker registrado (`/sw.js`)
- [x] HTTPS habilitado (produção)
- [x] Theme color definido
- [x] Apple touch icon (iOS)
- [x] Meta tags mobile completas
- [x] Página offline

## Recursos Adicionais

### Service Worker API
- Cache: `caches.open()`, `cache.put()`, `cache.match()`
- Fetch: `event.respondWith()`
- Sync: `registration.sync.register()`
- Push: `registration.pushManager.subscribe()`

### Teste de PWA
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Score PWA
- [PWA Builder](https://www.pwabuilder.com/) - Validação
- Chrome DevTools → Application

### Documentação
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## Troubleshooting

### App não instala no Android
1. Verifique se está em HTTPS
2. Abra DevTools → Application → Manifest (deve estar verde)
3. Verifique Service Worker está registrado
4. Limpe cache e recarregue

### Ícone genérico aparece
1. Verifique se os ícones existem em `/public/icons/`
2. Confirme tamanhos: 192x192 e 512x512
3. Adicione purpose: "maskable" no manifest
4. Desinstale e reinstale o app

### Service Worker não atualiza
1. Force atualização: DevTools → Application → Service Workers → Update
2. Use: `registration.update()` no código
3. Limpe cache do navegador

### App não funciona offline
1. Verifique estratégia de cache no `sw.js`
2. Confirme que recursos essenciais estão cacheados
3. Teste a página `/offline`

## Status Atual

✅ PWA totalmente configurado e pronto para produção
✅ Compatível com Android (Chrome, Edge, Samsung Internet)
✅ Compatível com iOS (Safari - modo limitado)
✅ Service Worker ativo com cache inteligente
✅ Ícones personalizados em todos os tamanhos
✅ Modo offline funcional
