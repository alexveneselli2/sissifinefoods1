# Abbinamenti · Sissi Fine Foods

Strumento interno del negozio Sissi Fine Foods (Viale Oriani 37F, Bologna): cerchi un prodotto e vedi con cosa abbinarlo, quali vini, cosa evitare e perché. Funziona su iPhone, iPad e sul tablet della cassa, si aggiunge alla schermata Home e va anche senza rete dopo la prima apertura.

Indirizzo: **https://alexveneselli2.github.io/sissifinefoods1/** (poi `https://abbinamenti.sissifinefoods.com`, vedi sotto).

> Il repository è pubblico (GitHub Pages gratuito lo richiede): qui non vanno mai costi, margini o export di Tilby. I file `.xlsx`, `.xls` e `.csv` sono esclusi da `.gitignore`.

## Provarlo sul computer

Serve Node.js 20 o più recente.

```bash
npm install
npm run dev            # apre il sito su http://localhost:5173/sissifinefoods1/
npm run dev -- --host  # come sopra, ma raggiungibile anche da iPhone e iPad sulla stessa rete wifi
```

Per vedere la versione definitiva, compresa la modalità offline:

```bash
npm run build && npm run preview   # http://localhost:4173/sissifinefoods1/
```

## Pubblicazione su GitHub Pages

Il sito si pubblica da solo a ogni push su `main`, con il workflow `.github/workflows/deploy.yml`: `npm ci`, `npm run build`, poi caricamento della cartella `dist` su Pages.

**Passaggio da fare una volta sola:** su GitHub apri il repository → **Settings** → **Pages** → in **Build and deployment**, alla voce **Source**, scegli **GitHub Actions**. Dalla scheda **Actions** vedi lo stato di ogni pubblicazione; si può anche rilanciare a mano con **Run workflow**.

Le modifiche arrivano subito: il service worker chiede sempre prima alla rete la pagina principale, e i file con il codice e i dati cambiano nome a ogni modifica. Chi ha il sito aperto vede la versione nuova alla successiva apertura o ricarica.

## Dominio proprio: abbinamenti.sissifinefoods.com

Da fare quando vuoi, non subito.

1. **Su Aruba** (pannello DNS del dominio `sissifinefoods.com`): crea un record **CNAME** con nome host `abbinamenti` e valore `alexveneselli2.github.io.` (con il punto finale, se Aruba lo chiede). Lascia il TTL predefinito. Possono servire da pochi minuti a qualche ora.
2. **Nel repository**: crea il file `public/CNAME` con dentro solo la riga `abbinamenti.sissifinefoods.com`, e in `.github/workflows/deploy.yml` cambia `BASE_PATH: /sissifinefoods1/` in `BASE_PATH: /`. Fai commit e push su `main`.
3. **Su GitHub**: Settings → Pages → **Custom domain**, scrivi `abbinamenti.sissifinefoods.com` e premi **Save**. Quando il controllo DNS è verde, spunta **Enforce HTTPS** (il certificato può richiedere fino a un'ora).

Dopo il cambio, su iPhone e iPad conviene togliere e riaggiungere l'icona dalla schermata Home, perché l'indirizzo è cambiato.

## Aggiornare prezzi e prodotti

I prezzi stanno in Tilby. Per riportarli qui:

1. In Tilby esporta gli articoli in Excel (`.xlsx`). Salva il file **fuori** da questa cartella, per esempio in Download.
2. Lancia:
   ```bash
   npm run aggiorna-prezzi -- ~/Downloads/export-tilby.xlsx
   ```
   Lo script cerca i prodotti per **ID** e aggiorna solo il campo `prezzo` di `data/abbinamenti.json` (colonna `Prezzo 1`, nel formato `"4,90 €"`). Poi stampa:
   - i prezzi cambiati;
   - i prodotti presenti in Tilby ma non negli abbinamenti, cioè i prodotti nuovi da classificare;
   - i prodotti negli abbinamenti che non esistono più in Tilby;
   - i kit il cui totale non corrisponde più alla somma dei prezzi.

   Non aggiunge e non cancella mai prodotti: quelli si sistemano a mano.
3. Controlla il risultato con `npm run dev`, poi fai commit e push **del solo** `data/abbinamenti.json`. GitHub Actions ripubblica il sito da solo in un paio di minuti.

L'export di Tilby contiene anche i costi: **non metterlo mai nel repository**.

## Logo e icone

- `brand/logo-sissi-originale.png`: il logo ufficiale da cui partono gli altri file.
- `public/brand/logo-sissi.png`: il logo ridotto per la testata.
- `public/icons/`: le icone dell'app (Android, iPhone e iPad, favicon), con il sole e la scritta "Sissi" del logo su verde.

Se cambia il logo, sostituisci `logo-sissi-originale.png` e lancia `npm run icone`. Se arriva la versione SVG con i testi in curve, si può usare al posto del PNG nella testata (`index.html`).

## Collaudo

```bash
npm test
```

I test Playwright girano sui quattro formati: iPhone 15 (393×852), iPad verticale (820×1180) e orizzontale (1180×820), Sunmi 15,6" (1920×1080). Controllano i criteri di accettazione (ricerche, schede, "Da evitare" e "Perché" su tutti i 127 prodotti, chip e tasto Indietro, niente scroll orizzontale, aree toccabili, funzionamento offline, manifest) e salvano gli screenshot in `screenshot/` (escluso dal repository).

## Com'è fatto

| Percorso | Cosa contiene |
|---|---|
| `data/abbinamenti.json` | L'unica fonte dei dati: 127 prodotti e 12 famiglie |
| `index.html` | La pagina: testata, ricerca, colonna della scheda |
| `src/main.ts` | Avvio, indirizzi con `#`, ricerca, cronologia |
| `src/viste.ts` | Le schermate: prodotto, famiglia, indice famiglie |
| `src/ricerca.ts` | Ricerca senza accenti, con tutte le parole e l'ordine dei risultati |
| `src/stile.css` | Grafica Sissi: colori, caratteri, cornici, layout per telefono e tablet |
| `sw/sw.js` | Service worker per l'uso offline (completato al build da `vite.config.ts`) |
| `public/` | Manifest, icone, logo, `robots.txt` |
| `scripts/` | `aggiorna-prezzi.mjs` e `genera-icone.mjs` |
| `tests/` | Test Playwright |
| `reference/riferimento-artifact.html` | La pagina precedente, usata come riferimento funzionale |
| `PROMPT.md`, `CLAUDE.md` | Brief e regole di lavoro per Claude Code |

- **Stack:** Vite e TypeScript, senza framework. Il JavaScript pesa circa 6 KB compresso; i dati sono un file a parte, letto all'apertura.
- **Indirizzi:** `#/`, `#/prodotto/84-ragu-di-tonno`, `#/famiglie`, `#/famiglia/aperitivo`. Con il `#` funzionano su GitHub Pages, offline e dalla schermata Home, e si possono condividere.
- **Caratteri:** Bodoni Moda per i titoli, Cormorant Garamond per le etichette in maiuscoletto, Figtree per il testo. Sono inclusi nel sito (da `@fontsource`), quindi funzionano anche offline. I font del logo (Academy Engraved, Bodoni 72) non sono usati sul web per via della licenza.
- **Indirizzo base:** il sito è pubblicato in `/sissifinefoods1/`. Si cambia con la variabile `BASE_PATH` al build (`BASE_PATH=/ npm run build`).
- Il sito è uno strumento interno: ha `noindex` e un `robots.txt` che blocca i motori di ricerca.
