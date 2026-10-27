import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Indirizzo del sito: su GitHub Pages è /sissifinefoods1/; con il dominio proprio diventa /.
// Si cambia con la variabile BASE_PATH, per esempio: BASE_PATH=/ npm run build
const base = process.env.BASE_PATH ?? '/sissifinefoods1/';

// File di public/ che non servono offline.
const ESCLUSI_PUBLIC = new Set(['robots.txt', 'CNAME']);

function filePublic(cartella: string): string[] {
  return readdirSync(cartella).flatMap((nome) => {
    const percorso = join(cartella, nome);
    return statSync(percorso).isDirectory() ? filePublic(percorso) : [percorso];
  });
}

// Genera dist/sw.js con l'elenco dei file da salvare per l'uso offline.
// La versione cambia a ogni build con contenuti diversi, così la cache vecchia viene sostituita.
function serviceWorker(): Plugin {
  return {
    name: 'sissi-service-worker',
    apply: 'build',
    generateBundle(_opzioni, bundle) {
      const daBundle = Object.keys(bundle).filter(
        (f) => !f.endsWith('.map') && !(f.endsWith('.woff') && !f.endsWith('.woff2')),
      );
      const daPublic = filePublic('public')
        .map((f) => relative('public', f).split('\\').join('/'))
        .filter((f) => !ESCLUSI_PUBLIC.has(f) && !f.startsWith('.'));
      const precache = ['./', ...daBundle, ...daPublic].sort();

      const hash = createHash('sha256');
      for (const f of daBundle.sort()) {
        const voce = bundle[f];
        hash.update(f);
        hash.update(voce.type === 'chunk' ? voce.code : voce.source);
      }
      for (const f of daPublic) hash.update(readFileSync(join('public', f)));

      const sorgente = readFileSync('sw/sw.js', 'utf8')
        .replace('__VERSIONE__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sorgente });
    },
  };
}

export default defineConfig({
  base,
  plugins: [serviceWorker()],
  build: {
    target: ['es2020', 'safari14'],
    assetsInlineLimit: 0,
  },
});
