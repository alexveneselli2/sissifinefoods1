# Brief: sito "Abbinamenti" di Sissi Fine Foods su GitHub Pages

Questo è il brief completo del progetto. I file citati sono già in questo repository, tranne il logo (vedi sotto).

---

## Obiettivo

Costruisci un piccolo sito web statico, "Abbinamenti · Sissi Fine Foods", da pubblicare con **GitHub Pages** direttamente da questo repository. Serve a Silvia, al banco del negozio, per rispondere in pochi secondi a un cliente: "con cosa lo abbino?", "che vino ci va?", "cosa devo evitare?".

Il sito riproduce e migliora una pagina già esistente (`reference/riferimento-artifact.html`): un cercatore di prodotti con la scheda degli abbinamenti, e sotto le 12 famiglie di gusto. Deve funzionare bene su:

- **iPhone** (Safari, da 375 a 430 px di larghezza);
- **iPad** in verticale e in orizzontale;
- **il tablet della cassa**, un Sunmi Android da 15,6" con Chrome, in orizzontale.

Prima di scrivere codice, leggi i file elencati sotto e proponimi un piano breve: struttura del progetto, schermate su iPhone e su tablet, scelte tecniche. Aspetta il mio ok. Non fare deploy né push senza chiedermelo.

## File che ti fornisco

| Percorso nel progetto | Cosa contiene |
|---|---|
| `data/abbinamenti.json` | **L'unica fonte dei dati.** 127 prodotti e 12 famiglie, con abbinamenti, cose da evitare e i relativi "perché". Non inventare né modificare abbinamenti: usa solo questi dati. |
| `reference/riferimento-artifact.html` | La pagina attuale, da usare come riferimento funzionale: logica di ricerca, contenuto delle schede, famiglie. **Non** è il riferimento grafico. |
| `public/brand/logo-sissi.svg` | Il logo ufficiale con i testi convertiti in curve. Lo aggiungo io: se non c'è ancora, usa un segnaposto testuale e ricordamelo. |

### Struttura di `data/abbinamenti.json`

- `meta`: fonte e data dei dati.
- `stili[]`: gruppi di stile delle bevande (`nome`, `ids`), per esempio "Bollicine secche", "Rossi strutturati".
- `famiglie[]`: `id`, `nome`, `perche` (profilo di gusto), `nota`, `cibi` (array di id), `bevande[]` (`stile`, `perche`, `ids`), `daEvitare` (`perche`, `stili`, `ids`, oppure `null`), `kit` (`nome`, `prodotti[{id, quantita}]`, `totale`).
- `prodotti[]`, uno per prodotto:
  - **campi comuni:** `id` (ID del prodotto in Tilby, il gestionale di cassa), `nome`, `nomeTilby`, `marca`, `fornitore`, `descrizione`, `categoriaTilby`, `prezzo` (euro IVA inclusa; `null` = prezzo ancora da impostare), `formato`, `tipo` (`"cibo"` o `"bevanda"`), `stile`, `famiglie`, `paroleChiave`, `daEvitare[]`, `consigli[]`, `kit[]`;
  - **per i cibi:** `abbinaConCibi[]` e `viniEBevande[]`;
  - **per le bevande:** `cibiDaAbbinare[]` e `stannoBeneVicino[]`;
  - **gruppi:** tutti i gruppi hanno la forma `{ perche, ids }`. Ogni gruppo va mostrato con il suo "Perché".

## Funzioni richieste

### Ricerca
- È la prima cosa sulla pagina, sempre a portata di pollice. Su iPhone resta fissata in alto mentre scorri.
- Cerca in nome, nome Tilby, marca, fornitore, descrizione, categoria, stile, parole chiave e nomi delle famiglie.
- Ignora maiuscole e accenti: "ragu" trova "Ragù".
- Con più parole, mostra i prodotti che le contengono tutte.
- **Ordine dei risultati:** prima il nome che inizia con il testo cercato, poi il nome che lo contiene, poi la marca, poi il resto. A parità, in ordine alfabetico.
- I risultati si aggiornano mentre scrivi. Ogni risultato mostra nome, marca, prezzo e un pallino che distingue cibo e bevanda.
- Sotto il campo metti le scorciatoie: "Casa Iuorio", "piccante", "bollicine", "fondente", "Amarone", "regalo".
- Se non trova nulla, scrivi un messaggio utile ("Prova con una parola sola o con la marca").

### Scheda prodotto
- **Intestazione:** tipo, nome, marca · categoria · prezzo ("prezzo da fare" se `null`), descrizione, nome in Tilby.
- **Per un cibo:** "Abbinalo con", "Vini e bevande", "Da evitare".
- **Per una bevanda:** "Cibi da abbinare", "Stanno bene vicino", "Da evitare".
- **Ogni gruppo** mostra il suo **Perché** sopra i prodotti. I gruppi "Da evitare" hanno uno stile distinto ma sobrio, senza rosso allarmante.
- **Prodotti nei gruppi:** ogni prodotto è un "chip" toccabile che apre la sua scheda. Oltre 14 chip, mostra "e altri N" espandibile.
- **In fondo:** Consigli (se ci sono), Kit in cui compare il prodotto (con il totale), Famiglie (link alle schede famiglia).
- **Indirizzo proprio:** ogni scheda ha un suo indirizzo, per esempio `#/prodotto/84-ragu-di-tonno`, così si può condividere o salvare. Il tasto Indietro del telefono e lo swipe indietro di iOS devono tornare alla ricerca.

### Famiglie
- Le 12 famiglie hanno una pagina indice e ognuna una pagina propria: perché, cibi, bevande raggruppate con il perché, "Da evitare" con il perché, kit con totale, nota.

### Layout per dispositivo
- **iPhone:** una colonna. Ricerca, poi risultati; toccando un risultato la scheda si apre a tutta pagina, con il tasto "← Ricerca" in alto.
- **Tablet (da circa 768 px di larghezza):** due colonne. Risultati a sinistra, larghi circa 320 px, e scheda a destra, sempre visibili insieme. In orizzontale sul Sunmi la scheda deve leggersi senza scorrere troppo.
- **Comune a tutti:**
  - aree toccabili di almeno 44×44 px;
  - campo di ricerca a 16 px o più, per evitare lo zoom automatico di iOS;
  - rispetto delle safe area (notch e barra home) con `env(safe-area-inset-*)`;
  - nessuno scroll orizzontale;
  - niente che funzioni solo con l'hover;
  - `font-variant-numeric: tabular-nums` sui prezzi.

### Uso in negozio
- Fai una **PWA**: manifest, icone generate dal logo, `apple-touch-icon` e `display: standalone`, così si può aggiungere alla schermata Home su iPhone, iPad e Android.
- Deve **funzionare offline** dopo la prima apertura, con un service worker che salva in cache pagine, dati e font. Se il wifi del negozio cade, la cassa non può restare senza.
- Il sito è uno strumento interno: aggiungi `<meta name="robots" content="noindex">` e un `robots.txt` che blocca tutto.

## Grafica Sissi Fine Foods

Usa l'identità del negozio, già usata per biglietti da visita, vetrofania ed etichette prezzi.

**Colori:**

| Ruolo | Colore |
|---|---|
| Verde Sissi (sfondi principali, testate) | `#1F3A2E` |
| Verde più scuro (sfondo modalità scura) | `#16291F` |
| Oro (cornici, filetti, ornamenti, testo su verde) | `#C9A961` |
| Panna (sfondo chiaro, testo su verde) | `#F5F0E8` |
| Bianco | `#FFFFFF` |
| Oro scuro, solo per testo su panna | `#7A5F24` |

**Contrasto (rispetta WCAG AA):**
- **Oro su panna (1,98:1):** non va bene per il testo. Usalo solo per linee e ornamenti.
- **Oro su verde (5,5:1):** va bene anche per il testo.
- **Panna su verde (10,9:1):** va bene.
- **Oro scuro su panna (5,3:1):** è il colore per gli accenti di testo su fondo chiaro.

**Caratteri:**
- **Il font del logo:** Academy Engraved e Bodoni 72 Oldstyle sono font di sistema del Mac e la licenza non ne permette l'uso sul web. **Non incorporarli.** Il logo arriva già in curve nell'SVG.
- **Titoli:** Bodoni Moda (Google Fonts, licenza OFL).
- **Etichette in maiuscoletto spaziato** che richiamano "FINE FOODS": Cormorant Garamond 600, con letter-spacing ampio.
- **Testo corrente:** un sans leggibile su schermi piccoli, per esempio Figtree o Inter. Il Bodoni a corpo piccolo su telefono si legge male.
- **Self-hosting:** prendi i font da `@fontsource` invece che dalla CDN di Google, così funzionano anche offline.

**Motivi grafici del marchio**, da usare con misura:
- **Cornice a ottagono** (rettangolo con angoli smussati a 45°), filetto oro sottile: per la testata e per i riquadri importanti, come il kit.
- **Angoli a L** in oro ai quattro angoli dei riquadri, come sulle etichette prezzi.
- **Piccolo sole a raggi** come ornamento: separatori, icona dell'app, stato vuoto.
- **Linea del prezzo:** filetto sottile sotto o accanto al prezzo.

**Impostazione consigliata:**
- **Tema chiaro su panna** per l'uso quotidiano al banco, più leggibile sotto le luci del negozio, con testata verde Sissi e logo in oro.
- **Tema scuro** su `#16291F` che segue `prefers-color-scheme`.
- **Chip:** i cibi neutri, le bevande con un tono verde, i "da evitare" con un tono caldo smorzato, sempre nella palette.
- **Look generale:** elegante e da bottega, non da gestionale. Niente gradienti né ombre pesanti.

## Scelte tecniche

- **Stack:** Vite + TypeScript, senza framework. Se proponi un framework leggero, spiegami perché. Il JavaScript sotto i 100 KB gzip, escluso il JSON dei dati.
- **Routing:** client-side con l'hash: `#/`, `#/prodotto/:id-slug`, `#/famiglie`, `#/famiglia/:id`. GitHub Pages non permette di rimandare tutti gli indirizzi a `index.html`; con l'hash i link funzionano sempre, anche offline e dalla schermata Home.
- **Dati:** i dati vengono solo da `data/abbinamenti.json`, importato al build o letto a runtime. Nessun backend.
- **Accessibilità:**
  - etichette sui campi;
  - focus visibile;
  - `aria-live` sui risultati;
  - `prefers-reduced-motion` rispettato;
  - HTML semantico.
- **Repository pubblico:** questo repository è pubblico, perché GitHub Pages gratuito lo richiede. Non committare mai costi d'acquisto, margini o export di Tilby: l'export di Tilby contiene anche i costi. Metti `*.xlsx`, `*.xls` e `*.csv` nel `.gitignore`.
- **GitHub Pages:**
  - pubblica con un workflow GitHub Actions (`.github/workflows/deploy.yml`) che parte a ogni push su `main`: `npm ci`, `npm run build`, poi `actions/upload-pages-artifact` con la cartella `dist` e `actions/deploy-pages`, con i permessi `pages: write` e `id-token: write`;
  - il sito all'inizio è su `https://alexveneselli2.github.io/sissifinefoods1/`: imposta il `base` di Vite su `/sissifinefoods1/` e rendilo configurabile, perché con un dominio proprio diventa `/`;
  - service worker, manifest e icone devono funzionare con quel percorso;
  - su Pages non si possono impostare header personalizzati: usa i nomi dei file con l'hash di Vite, e nel service worker scegli "prima la rete" per `index.html` e per i dati, così le modifiche arrivano subito;
  - nel README spiega il passaggio una tantum su GitHub (Settings → Pages → Source: **GitHub Actions**).
- **Dominio proprio (dopo, non subito):** `abbinamenti.sissifinefoods.com`. Il DNS è su **Aruba**: nel README spiega il record CNAME da creare verso `alexveneselli2.github.io`, il file `public/CNAME`, come impostare il dominio in Settings → Pages e come attivare "Enforce HTTPS". Aggiungi il file `CNAME` solo quando ti confermo che il record DNS esiste.

## Aggiornamento di prezzi e prodotti

I prezzi stanno nel gestionale **Tilby**, che esporta gli articoli in Excel (`.xlsx`). Le colonne utili sono `ID`, `Nome` e `Prezzo 1`; i prezzi sono testo, nel formato `"4,90 €"`.

- **Script:** crea `npm run aggiorna-prezzi -- percorso/export.xlsx`, che aggiorna `prezzo` in `data/abbinamenti.json` cercando i prodotti per **ID**.
- **Report:** lo script stampa i prezzi cambiati, gli ID presenti in Tilby ma non nel JSON (prodotti nuovi da classificare) e gli ID nel JSON che non esistono più in Tilby. Non deve mai aggiungere o cancellare prodotti da solo.
- **README:** spiega in modo semplice come aggiornare. Si esporta da Tilby, si lancia lo script, si fa commit e push del solo JSON, e GitHub Actions ripubblica da solo. L'export Excel non va mai nel repository.

## Collaudo

Scrivi test Playwright e fammi vedere gli screenshot a questi formati:
- **iPhone 15:** 393×852.
- **iPad:** in verticale, 820×1180.
- **iPad:** in orizzontale, 1180×820.
- **Sunmi:** 1920×1080.

Criteri di accettazione:
- "Casa Iuorio" trova 19 prodotti.
- "piccante" trova "Salsa Osé (piccante)".
- "bollicine" trova 5 bevande (4 bollicine secche e l'Asti).
- "ragu" trova i due ragù.
- Tutti i 127 prodotti mostrano almeno un gruppo "Da evitare".
- Ogni gruppo mostrato ha il suo "Perché".
- Toccando un chip si apre la scheda giusta, e Indietro torna alla schermata precedente.
- Nessuno scroll orizzontale a nessun formato.
- Il sito funziona offline dopo la prima visita.
- Lighthouse su mobile dà almeno 90 in Performance, Accessibility, Best Practices e PWA (o installabilità).

Alla fine dammi un riepilogo breve: cosa hai fatto, come lo provo in locale (`npm run dev`) e quali passi devo fare io su GitHub (Pages) e su Aruba.
