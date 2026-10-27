// Service worker di Abbinamenti · Sissi Fine Foods.
// Al build vite.config.ts sostituisce i segnaposto della versione e dell'elenco dei file.
const VERSIONE = '__VERSIONE__';
const CACHE = `abbinamenti-${VERSIONE}`;
const PRECACHE = __PRECACHE__;
// Se la rete non risponde entro questo tempo, si usa la copia salvata (wifi del negozio lento o caduto).
const ATTESA_RETE_MS = 2500;

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(
        chiavi.filter((c) => c.startsWith('abbinamenti-') && c !== CACHE).map((c) => caches.delete(c)),
      ))
      .then(() => self.clients.claim()),
  );
});

function conLimite(promessa, ms) {
  return new Promise((risolvi, rifiuta) => {
    const timer = setTimeout(() => rifiuta(new Error('rete lenta')), ms);
    promessa.then((r) => { clearTimeout(timer); risolvi(r); }, (e) => { clearTimeout(timer); rifiuta(e); });
  });
}

// Prima la rete (pagina e dati): le modifiche arrivano subito; senza rete, la copia salvata.
async function primaLaRete(richiesta, chiave) {
  const cache = await caches.open(CACHE);
  if (self.navigator && self.navigator.onLine === false) {
    const salvata = await cache.match(chiave, { ignoreSearch: true, ignoreVary: true });
    if (salvata) return salvata;
  }
  try {
    const risposta = await conLimite(fetch(richiesta), ATTESA_RETE_MS);
    if (risposta.ok) cache.put(chiave, risposta.clone());
    return risposta;
  } catch (errore) {
    const salvata = await cache.match(chiave, { ignoreSearch: true, ignoreVary: true });
    if (salvata) return salvata;
    throw errore;
  }
}

// Prima la cache per i file con l'hash nel nome (codice, stile, font e anche i dati):
// a parità di nome non cambiano mai. Quando cambiano i dati cambia il nome del file,
// e la pagina (prima la rete) punta subito a quello nuovo.
const CON_HASH = /\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;
async function primaLaCache(richiesta) {
  const cache = await caches.open(CACHE);
  const salvata = await cache.match(richiesta, { ignoreSearch: true, ignoreVary: true });
  if (salvata) return salvata;
  const risposta = await fetch(richiesta);
  if (risposta.ok) cache.put(richiesta, risposta.clone());
  return risposta;
}

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== 'GET') return;
  const url = new URL(richiesta.url);
  if (url.origin !== self.location.origin) return;

  const radice = new URL('./', self.registration.scope).href;
  if (richiesta.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    // Tutte le pagine sono index.html: le schede usano l'indirizzo con #.
    evento.respondWith(primaLaRete(richiesta, radice));
  } else if (CON_HASH.test(url.pathname)) {
    evento.respondWith(primaLaCache(richiesta));
  } else if (url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest')) {
    evento.respondWith(primaLaRete(richiesta, richiesta));
  } else {
    evento.respondWith(primaLaCache(richiesta));
  }
});
