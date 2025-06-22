// 🚀 SERVICE WORKER AVANÇADO COM ESTRATÉGIAS INTELIGENTES
const CACHE_VERSION = 'v3.0';
const STATIC_CACHE_NAME = `lailo-static-${CACHE_VERSION}`;
const CHUNKS_CACHE_NAME = `lailo-chunks-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `lailo-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `lailo-api-${CACHE_VERSION}`;
const IMAGES_CACHE_NAME = `lailo-images-${CACHE_VERSION}`;

// 🚀 CACHE AVANÇADO: Nomes específicos por estratégia
const ADVANCED_CACHES = {
  'critical-assets': `lailo-critical-assets-${CACHE_VERSION}`,
  'js-chunks': `lailo-js-chunks-${CACHE_VERSION}`,
  'auction-api': `lailo-auction-api-${CACHE_VERSION}`,
  'static-data': `lailo-static-data-${CACHE_VERSION}`,
  'images': `lailo-images-${CACHE_VERSION}`,
  'app-pages': `lailo-app-pages-${CACHE_VERSION}`
};

// 🔥 RECURSOS ESTÁTICOS CRÍTICOS PARA CACHE
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Assets serão adicionados dinamicamente durante o build
];

// 🔥 PADRÕES DE URL OTIMIZADOS PARA CHUNKS E ASSETS
const CACHE_PATTERNS = {
  // Assets estáticos críticos (CSS, fonts, ícones)
  static: /\.(css|woff2?|ttf|eot|ico|svg)$/,

  // Chunks JavaScript (lazy loading) - CACHE AGRESSIVO
  chunks: /\/assets\/.*\.js$/,

  // Assets de build (CSS compilado, manifests)
  buildAssets: /\/assets\/.*\.(css|json)$/,

  // APIs do IBGE (dados estáticos)
  ibgeApi: /servicodados\.ibge\.gov\.br/,

  // Google Fonts (crítico para performance)
  googleFonts: /fonts\.(googleapis|gstatic)\.com/,

  // Imagens de leilões (externas)
  auctionImages: /\.(jpg|jpeg|png|webp)$/,

  // Rotas da aplicação
  appRoutes: /^https?:\/\/[^\/]+\/(buscador|favoritos|usuario|auth)/,

  // Supabase API
  supabaseApi: /supabase\.co/
};

// 🔥 CONFIGURAÇÕES DE CACHE OTIMIZADAS
const CACHE_CONFIG = {
  static: {
    name: STATIC_CACHE_NAME,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    strategy: 'cache-first',
    maxEntries: 50
  },
  chunks: {
    name: CHUNKS_CACHE_NAME,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias (chunks com hash)
    strategy: 'cache-first',
    maxEntries: 100
  },
  dynamic: {
    name: DYNAMIC_CACHE_NAME,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    strategy: 'network-first',
    maxEntries: 50
  },
  api: {
    name: API_CACHE_NAME,
    maxAge: 60 * 60 * 1000, // 1 hora
    strategy: 'network-first',
    maxEntries: 100
  },
  images: {
    name: IMAGES_CACHE_NAME,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    strategy: 'cache-first',
    maxEntries: 200
  }
};

// 🚀 INSTALL EVENT: Cache recursos críticos
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Static assets cached');
        return self.skipWaiting(); // Ativar imediatamente
      })
      .catch((error) => {
        console.error('❌ Service Worker: Install failed', error);
      })
  );
});

// 🚀 ACTIVATE EVENT: Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Deletar caches antigos (manter apenas versão atual)
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated');
        return self.clients.claim(); // Controlar todas as abas
      })
  );
});

// 🚀 FETCH EVENT: Interceptar requests e aplicar estratégias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requests de extensões do browser
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// 🔥 FUNÇÃO PRINCIPAL PARA LIDAR COM REQUESTS
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Assets estáticos (CSS, fonts, ícones)
    if (CACHE_PATTERNS.static.test(url.pathname)) {
      return await cacheFirstStrategy(request, CACHE_CONFIG.static);
    }

    // 2. 🚀 CHUNKS JAVASCRIPT (lazy loading) - CACHE AGRESSIVO
    if (CACHE_PATTERNS.chunks.test(url.pathname)) {
      return await cacheFirstStrategy(request, CACHE_CONFIG.chunks);
    }

    // 2.5. 🚀 BUILD ASSETS (CSS compilado, manifests) - CACHE AGRESSIVO
    if (CACHE_PATTERNS.buildAssets.test(url.pathname)) {
      return await cacheFirstStrategy(request, CACHE_CONFIG.static);
    }

    // 2.6. 🚀 GOOGLE FONTS - CACHE AGRESSIVO (crítico para performance)
    if (CACHE_PATTERNS.googleFonts.test(url.hostname)) {
      return await cacheFirstStrategy(request, CACHE_CONFIG.static);
    }

    // 3. APIs do IBGE (dados estáticos)
    if (CACHE_PATTERNS.ibgeApi.test(url.hostname)) {
      return await networkFirstStrategy(request, CACHE_CONFIG.api);
    }

    // 4. Supabase API (dados dinâmicos)
    if (CACHE_PATTERNS.supabaseApi.test(url.hostname)) {
      return await networkFirstStrategy(request, CACHE_CONFIG.api);
    }

    // 5. Imagens de leilões (externas)
    if (CACHE_PATTERNS.auctionImages.test(url.pathname) && url.hostname !== location.hostname) {
      return await cacheFirstStrategy(request, CACHE_CONFIG.images);
    }

    // 6. Rotas da aplicação (SPA)
    if (CACHE_PATTERNS.appRoutes.test(url.href) || url.pathname === '/') {
      return await networkFirstStrategy(request, CACHE_CONFIG.dynamic);
    }

    // 7. Outros requests: network-first
    return await networkFirstStrategy(request, CACHE_CONFIG.dynamic);
    
  } catch (error) {
    console.error('❌ Service Worker: Request failed', error);
    
    // Fallback para rotas da aplicação
    if (CACHE_PATTERNS.appRoutes.test(url.href)) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return await cache.match('/index.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// 🔥 ESTRATÉGIA CACHE-FIRST OTIMIZADA: Cache primeiro, network como fallback
async function cacheFirstStrategy(request, config) {
  const cache = await caches.open(config.name);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Verificar se não expirou
    const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
    const isExpired = Date.now() - cachedDate.getTime() > config.maxAge;

    if (!isExpired) {
      console.log('📦 Cache hit:', request.url);
      // 🚀 PERFORMANCE: Reportar cache hit
      reportCacheMetrics('hit', config.name);
      return cachedResponse;
    }
  }
  
  // Buscar da network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clonar response para cache
      const responseToCache = networkResponse.clone();
      
      // Adicionar timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // 🚀 PERFORMANCE: Cleanup cache se necessário
      await cleanupCache(cache, config);

      cache.put(request, modifiedResponse);
      console.log('🌐 Network response cached:', request.url);

      // 🚀 PERFORMANCE: Reportar cache miss
      reportCacheMetrics('miss', config.name);
    }

    return networkResponse;
  } catch (error) {
    // Fallback para cache mesmo se expirado
    if (cachedResponse) {
      console.log('📦 Serving expired cache:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// 🔥 ESTRATÉGIA NETWORK-FIRST: Network primeiro, cache como fallback
async function networkFirstStrategy(request, config) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache da response
      const cache = await caches.open(config.name);
      const responseToCache = networkResponse.clone();
      
      // Adicionar timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      console.log('🌐 Network response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback para cache
    const cache = await caches.open(config.name);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Serving cached fallback:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// 🚀 MESSAGE EVENT: Comunicação avançada com a aplicação
self.addEventListener('message', (event) => {
  const { data } = event;

  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data && data.type === 'CACHE_URLS') {
    // Cache URLs específicas enviadas pela aplicação
    cacheUrls(data.urls);
  }

  if (data && data.type === 'CACHE_STRATEGY') {
    // Cache com estratégia específica
    cacheWithStrategy(data.url, data.strategy);
  }

  if (data && data.type === 'WARMUP_CACHE') {
    // Preaquecimento de cache
    warmupCache(data.urls || []);
  }

  if (data && data.type === 'GET_CACHE_METRICS') {
    // Retornar métricas de cache
    event.ports[0].postMessage({
      type: 'CACHE_METRICS',
      metrics: getCacheMetrics()
    });
  }
});

// 🔥 FUNÇÃO PARA CACHE DE URLs ESPECÍFICAS
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  for (const url of urls) {
    try {
      await cache.add(url);
      console.log('📦 URL cached:', url);
    } catch (error) {
      console.warn('⚠️ Failed to cache URL:', url, error);
    }
  }
}

// 🚀 PERFORMANCE: Cleanup de cache quando excede limite
async function cleanupCache(cache, config) {
  if (!config.maxEntries) return;

  const keys = await cache.keys();
  if (keys.length <= config.maxEntries) return;

  // Remover entradas mais antigas
  const entriesToDelete = keys.length - config.maxEntries;
  const keysToDelete = keys.slice(0, entriesToDelete);

  for (const key of keysToDelete) {
    await cache.delete(key);
    console.log('🗑️ Cache cleanup: Deleted', key.url);
  }
}

// 🚀 PERFORMANCE: Métricas de cache
const cacheMetrics = {
  hits: 0,
  misses: 0,
  lastReset: Date.now()
};

function reportCacheMetrics(type, cacheName) {
  cacheMetrics[type === 'hit' ? 'hits' : 'misses']++;

  // Reset métricas a cada hora
  if (Date.now() - cacheMetrics.lastReset > 60 * 60 * 1000) {
    console.log('📊 Cache Metrics:', {
      hits: cacheMetrics.hits,
      misses: cacheMetrics.misses,
      hitRate: (cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses) * 100).toFixed(2) + '%'
    });

    cacheMetrics.hits = 0;
    cacheMetrics.misses = 0;
    cacheMetrics.lastReset = Date.now();
  }
}

// 🚀 PERFORMANCE: Preload de chunks críticos
async function preloadCriticalChunks() {
  const criticalChunks = [
    '/assets/index-CHR2BDLJ.js', // Bundle principal
    '/assets/BuscadorListingPage-BHGqyezx.js' // Página principal
  ];

  const cache = await caches.open(CHUNKS_CACHE_NAME);

  for (const chunk of criticalChunks) {
    try {
      const response = await fetch(chunk);
      if (response.ok) {
        await cache.put(chunk, response);
        console.log('🚀 Critical chunk preloaded:', chunk);
      }
    } catch (error) {
      console.warn('⚠️ Failed to preload chunk:', chunk, error);
    }
  }
}

// 🚀 CACHE WITH STRATEGY: Cache com estratégia específica
async function cacheWithStrategy(url, strategyName) {
  try {
    const cacheName = ADVANCED_CACHES[strategyName] || DYNAMIC_CACHE_NAME;
    const cache = await caches.open(cacheName);

    const response = await fetch(url);
    if (response.ok) {
      // Adicionar metadados da estratégia
      const headers = new Headers(response.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      headers.set('sw-strategy', strategyName);

      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });

      await cache.put(url, modifiedResponse);
      console.log(`🎯 Cached with strategy ${strategyName}:`, url);
    }
  } catch (error) {
    console.error(`❌ Failed to cache with strategy ${strategyName}:`, url, error);
  }
}

// 🔥 WARMUP CACHE: Preaquecimento inteligente
async function warmupCache(urls = []) {
  const defaultUrls = [
    '/',
    '/buscador/imoveis/todos',
    '/buscador/veiculos/todos',
    '/assets/index.css'
  ];

  const urlsToWarmup = urls.length > 0 ? urls : defaultUrls;

  console.log('🔥 Starting cache warmup for', urlsToWarmup.length, 'URLs');

  for (const url of urlsToWarmup) {
    try {
      // Determinar estratégia baseada na URL
      let strategy = 'app-pages';
      if (url.includes('/assets/')) strategy = 'critical-assets';
      if (url.includes('supabase.co')) strategy = 'auction-api';

      await cacheWithStrategy(url, strategy);
    } catch (error) {
      console.warn('⚠️ Failed to warmup cache for:', url, error);
    }
  }

  console.log('✅ Cache warmup completed');
}

// 📊 GET CACHE METRICS: Obter métricas detalhadas
function getCacheMetrics() {
  return {
    version: CACHE_VERSION,
    caches: Object.keys(ADVANCED_CACHES),
    metrics: cacheMetrics,
    timestamp: Date.now()
  };
}

// 🚀 BACKGROUND SYNC: Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'cache-update') {
    event.waitUntil(performBackgroundCacheUpdate());
  }

  if (event.tag === 'cache-warmup') {
    event.waitUntil(warmupCache());
  }
});

// 🔄 BACKGROUND CACHE UPDATE: Atualização em background
async function performBackgroundCacheUpdate() {
  console.log('🔄 Performing background cache update...');

  try {
    // Atualizar cache de APIs críticas
    const criticalApis = [
      '/api/auctions/count',
      '/api/ibge/estados'
    ];

    for (const api of criticalApis) {
      try {
        await cacheWithStrategy(api, 'auction-api');
      } catch (error) {
        console.warn('Failed to update cache for:', api, error);
      }
    }

    console.log('✅ Background cache update completed');
  } catch (error) {
    console.error('❌ Background cache update failed:', error);
  }
}
