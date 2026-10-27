// Le schermate di destra (o a tutta pagina su iPhone): prodotto, famiglia, indice famiglie, benvenuto.
import type { Archivio, Famiglia, Gruppo, Kit, Prodotto } from './dati';
import { h, separatore, sole } from './dom';
import { categoria, data, prezzo, slug } from './testo';

export const MAX_CHIP = 14;

type Tono = 'cibo' | 'bevanda' | 'evitare';

export function hrefProdotto(p: Prodotto): string {
  return `#/prodotto/${p.id}-${slug(p.nome)}`;
}

export function hrefFamiglia(f: Famiglia): string {
  return `#/famiglia/${f.id}`;
}

export interface Vista {
  titolo: string;
  contenuto: HTMLElement;
}

export class Viste {
  constructor(private readonly a: Archivio) {}

  // ---------- pezzi comuni ----------

  private prezzoEl(valore: number | null, classe = 'prezzo'): HTMLElement {
    return h('span', { class: valore == null ? `${classe} da-fare` : classe }, prezzo(valore));
  }

  private chip(id: number, tono: Tono): HTMLElement | null {
    const p = this.a.prodotto.get(id);
    if (!p) return null;
    return h('li', null,
      h('a', { class: `chip chip-${tono}`, href: hrefProdotto(p) },
        h('span', { class: 'chip-nome' }, p.nome),
        this.prezzoEl(p.prezzo, 'chip-prezzo'),
      ),
    );
  }

  /** Elenco di chip; oltre MAX_CHIP mostra "e altri N" che si espande. */
  private elencoChip(ids: number[], tono: (id: number) => Tono): HTMLElement {
    const ul = h('ul', { class: 'chips' });
    const primi = ids.length > MAX_CHIP ? ids.slice(0, MAX_CHIP) : ids;
    for (const id of primi) {
      const li = this.chip(id, tono(id));
      if (li) ul.append(li);
    }
    if (ids.length > MAX_CHIP) {
      const resto = ids.slice(MAX_CHIP);
      const bottone = h('button', { type: 'button', class: 'altri', 'aria-expanded': 'false' }, `e altri ${resto.length}`);
      const liBottone = h('li', { class: 'altri-voce' }, bottone);
      bottone.addEventListener('click', () => {
        const nuovi = resto.map((id) => this.chip(id, tono(id))).filter((x): x is HTMLElement => !!x);
        liBottone.replaceWith(...nuovi);
        nuovi[0]?.querySelector('a')?.focus();
      });
      ul.append(liBottone);
    }
    return ul;
  }

  private tonoPerTipo = (id: number): Tono =>
    this.a.prodotto.get(id)?.tipo === 'bevanda' ? 'bevanda' : 'cibo';

  private perche(testo: string): HTMLElement {
    return h('p', { class: 'perche' }, h('span', { class: 'perche-etichetta' }, 'Perché'), ' ', testo);
  }

  private gruppo(g: Gruppo, evitare: boolean, titolo?: string): HTMLElement {
    return h('div', { class: evitare ? 'gruppo gruppo-evitare' : 'gruppo' },
      titolo ? h('h3', { class: 'gruppo-titolo' }, titolo) : null,
      this.perche(g.perche),
      this.elencoChip(g.ids, evitare ? () => 'evitare' : this.tonoPerTipo),
    );
  }

  private sezione(chiave: string, titolo: string, corpo: (HTMLElement | null)[], vuoto: string): HTMLElement {
    const contenuto = corpo.filter((x): x is HTMLElement => !!x);
    return h('section', { class: `sezione sezione-${chiave}`, 'aria-label': titolo },
      h('h2', { class: 'etichetta' }, chiave === 'evitare' ? iconaEvitare() : null, titolo),
      contenuto.length ? contenuto : h('p', { class: 'vuoto' }, vuoto),
    );
  }

  private kit(f: Famiglia, k: Kit, evidenzia?: number): HTMLElement {
    return h('div', { class: 'kit cornice' },
      h('div', { class: 'kit-testa' },
        h('span', { class: 'kit-etichetta' }, 'Kit'),
        h('h3', { class: 'kit-nome' }, k.nome),
        h('a', { class: 'kit-famiglia', href: hrefFamiglia(f) }, f.nome),
      ),
      h('ul', { class: 'kit-voci' }, k.prodotti.map(({ id, quantita }) => {
        const p = this.a.prodotto.get(id);
        if (!p) return null;
        return h('li', { class: id === evidenzia ? 'kit-voce questo' : 'kit-voce' },
          h('a', { href: hrefProdotto(p), 'aria-current': id === evidenzia ? 'page' : null },
            h('span', { class: 'kit-quantita' }, `${quantita} ×`),
            h('span', { class: 'kit-prodotto' }, p.nome),
          ),
          this.prezzoEl(p.prezzo, 'kit-prezzo'),
        );
      })),
      h('p', { class: 'kit-totale' }, h('span', null, 'Totale'), this.prezzoEl(k.totale, 'kit-prezzo-totale')),
    );
  }

  private piede(): HTMLElement {
    return h('p', { class: 'piede' },
      `Dati aggiornati al ${data(this.a.dati.meta.aggiornato)}. Prezzi al pubblico IVA inclusa, da Tilby. Gli abbinamenti seguono solo il gusto.`);
  }

  // ---------- schermate ----------

  prodotto(p: Prodotto): Vista {
    const bevanda = p.tipo === 'bevanda';
    const meta = [p.marca, categoria(p.categoriaTilby), p.formato].filter(Boolean).join(' · ');
    const tilby = `In Tilby: ${p.nomeTilby} · ID ${p.id}` + (p.fornitore && p.fornitore !== p.marca ? ` · fornitore ${p.fornitore}` : '');

    const intestazione = h('header', { class: 'intestazione angoli' },
      h('p', { class: `tipo tipo-${p.tipo}` },
        h('span', { class: `segno segno-${p.tipo}`, 'aria-hidden': 'true' }),
        bevanda ? 'Bevanda' : 'Cibo',
        p.stile ? ` · ${p.stile}` : ''),
      h('div', { class: 'intestazione-riga' },
        h('h1', { class: 'nome', tabindex: '-1' }, p.nome),
        h('p', { class: 'prezzo-riga' }, this.prezzoEl(p.prezzo, 'prezzo-grande')),
      ),
      meta ? h('p', { class: 'meta' }, meta) : null,
      p.descrizione ? h('p', { class: 'descrizione' }, p.descrizione) : null,
      h('p', { class: 'tilby' }, tilby),
    );

    const sezioni = bevanda
      ? [
        this.sezione('abbina', 'Cibi da abbinare', (p.cibiDaAbbinare ?? []).map((g) => this.gruppo(g, false)),
          'Si serve da solo o come base per un cocktail.'),
        this.sezione('bevande', 'Stanno bene vicino', (p.stannoBeneVicino ?? []).map((g) => this.gruppo(g, false)),
          'Nessuna bevanda vicina.'),
      ]
      : [
        this.sezione('abbina', 'Abbinalo con', (p.abbinaConCibi ?? []).map((g) => this.gruppo(g, false)),
          'Nessun altro prodotto in questa famiglia.'),
        this.sezione('bevande', 'Vini e bevande', (p.viniEBevande ?? []).map((g) => this.gruppo(g, false)),
          'Niente vino: si abbina con gli altri prodotti qui sopra.'),
      ];
    sezioni.push(this.sezione('evitare', 'Da evitare', p.daEvitare.map((g) => this.gruppo(g, true)),
      'Nessun abbinamento da evitare nel listino.'));

    const extra: HTMLElement[] = [];
    if (p.consigli.length) {
      extra.push(h('section', { class: 'sezione sezione-consigli', 'aria-label': 'Consigli' },
        h('h2', { class: 'etichetta' }, 'Consigli'),
        h('ul', { class: 'consigli' }, p.consigli.map((c) => h('li', null, sole('sole sole-punto-elenco'), h('span', null, c)))),
      ));
    }
    const kit = p.kit
      .map((nome) => this.a.kitPerNome.get(nome))
      .filter((f): f is Famiglia => !!f?.kit);
    if (kit.length) {
      extra.push(h('section', { class: 'sezione sezione-kit', 'aria-label': kit.length > 1 ? 'Nei kit' : 'Nel kit' },
        h('h2', { class: 'etichetta' }, kit.length > 1 ? 'Nei kit' : 'Nel kit'),
        kit.map((f) => this.kit(f, f.kit as Kit, p.id)),
      ));
    }
    const famiglie = p.famiglie.map((id) => this.a.famiglia.get(id)).filter((f): f is Famiglia => !!f);
    extra.push(h('section', { class: 'sezione sezione-famiglie', 'aria-label': 'Famiglie' },
      h('h2', { class: 'etichetta' }, famiglie.length > 1 ? 'Famiglie' : 'Famiglia'),
      h('ul', { class: 'pillole' }, famiglie.map((f) => h('li', null, h('a', { class: 'pillola', href: hrefFamiglia(f) }, f.nome)))),
    ));

    return {
      titolo: p.nome,
      contenuto: h('article', { class: `scheda scheda-prodotto scheda-${p.tipo}` },
        intestazione,
        h('div', { class: 'sezioni' }, sezioni),
        separatore(),
        h('div', { class: 'extra' }, extra),
        this.piede(),
      ),
    };
  }

  famiglia(f: Famiglia): Vista {
    const intestazione = h('header', { class: 'intestazione angoli' },
      h('p', { class: 'tipo' }, 'Famiglia di gusto'),
      h('h1', { class: 'nome', tabindex: '-1' }, f.nome),
      this.perche(f.perche),
    );
    const evitare = f.daEvitare
      ? [h('div', { class: 'gruppo gruppo-evitare' },
        f.daEvitare.stili.length ? h('p', { class: 'stili-evitare' }, `Stili: ${f.daEvitare.stili.join(', ')}.`) : null,
        this.perche(f.daEvitare.perche),
        f.daEvitare.ids.length ? this.elencoChip(f.daEvitare.ids, () => 'evitare') : null,
      )]
      : [];
    const sezioni = [
      this.sezione('abbina', 'In dispensa', [this.elencoChip(f.cibi, this.tonoPerTipo)], ''),
      this.sezione('bevande', 'Da bere', f.bevande.map((b) => this.gruppo(b, false, b.stile)),
        'Niente vino: qui gli abbinamenti sono tra i prodotti della dispensa.'),
      this.sezione('evitare', 'Da evitare', evitare, 'Nessun abbinamento da evitare in questa famiglia.'),
    ];
    const extra: HTMLElement[] = [];
    if (f.kit) {
      extra.push(h('section', { class: 'sezione sezione-kit', 'aria-label': 'Kit' },
        h('h2', { class: 'etichetta' }, 'Kit'), this.kit(f, f.kit)));
    }
    if (f.nota) {
      extra.push(h('section', { class: 'sezione sezione-nota', 'aria-label': 'Nota' },
        h('h2', { class: 'etichetta' }, 'Nota'), h('p', { class: 'nota' }, f.nota)));
    }
    return {
      titolo: f.nome,
      contenuto: h('article', { class: 'scheda scheda-famiglia' },
        intestazione,
        h('div', { class: 'sezioni' }, sezioni),
        extra.length ? separatore() : null,
        extra.length ? h('div', { class: 'extra' }, extra) : null,
        this.piede(),
      ),
    };
  }

  famiglie(): Vista {
    const { famiglie } = this.a.dati;
    return {
      titolo: 'Famiglie di gusto',
      contenuto: h('article', { class: 'scheda scheda-indice' },
        h('header', { class: 'intestazione angoli' },
          h('p', { class: 'tipo' }, `Le ${famiglie.length} famiglie`),
          h('h1', { class: 'nome', tabindex: '-1' }, 'Famiglie di gusto'),
          h('p', { class: 'descrizione' },
            `Coprono tutti i ${this.a.dati.prodotti.length} prodotti del listino. Un prodotto può stare in più famiglie.`),
        ),
        h('ul', { class: 'griglia-famiglie' }, famiglie.map((f) => {
          const bevande = new Set(f.bevande.flatMap((b) => b.ids)).size;
          const conta = [`${f.cibi.length} in dispensa`, bevande ? `${bevande} da bere` : 'niente vino', f.kit ? `kit ${f.kit.nome}` : null]
            .filter(Boolean).join(' · ');
          return h('li', null, h('a', { class: 'carta-famiglia', href: hrefFamiglia(f) },
            h('h2', { class: 'carta-nome' }, f.nome),
            h('p', { class: 'carta-perche' }, f.perche),
            h('p', { class: 'carta-conta' }, conta),
          ));
        })),
        this.piede(),
      ),
    };
  }

  benvenuto(): Vista {
    return {
      titolo: 'Abbinamenti',
      contenuto: h('div', { class: 'benvenuto' },
        sole('sole sole-grande'),
        h('h1', { class: 'benvenuto-titolo', tabindex: '-1' }, 'Con cosa lo abbino?'),
        h('p', null, 'Cerca un prodotto per nome, marca, vino o gusto: vedi con cosa abbinarlo, quali vini proporre, cosa evitare e perché.'),
        h('p', null, h('a', { class: 'pillola', href: '#/famiglie' }, 'Sfoglia le 12 famiglie di gusto')),
        this.piede(),
      ),
    };
  }

  nonTrovato(cosa: string): Vista {
    return {
      titolo: 'Non trovato',
      contenuto: h('div', { class: 'benvenuto' },
        sole('sole sole-grande'),
        h('h1', { class: 'benvenuto-titolo', tabindex: '-1' }, `${cosa} non trovato`),
        h('p', null, 'Forse il collegamento è vecchio. Cerca il prodotto per nome o torna alle famiglie.'),
        h('p', null, h('a', { class: 'pillola', href: '#/famiglie' }, 'Famiglie di gusto')),
      ),
    };
  }

  errore(messaggio: string): Vista {
    return {
      titolo: 'Errore',
      contenuto: h('div', { class: 'benvenuto' },
        sole('sole sole-grande'),
        h('h1', { class: 'benvenuto-titolo', tabindex: '-1' }, 'Il listino non si è caricato'),
        h('p', null, 'Controlla la connessione e ricarica la pagina. Dopo la prima apertura il sito funziona anche senza rete.'),
        h('p', { class: 'tilby' }, messaggio),
      ),
    };
  }
}

function iconaEvitare(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('class', 'icona-evitare');
  svg.setAttribute('aria-hidden', 'true');
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  c.setAttribute('d', 'M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13ZM3.4 12.6l9.2-9.2');
  svg.append(c);
  return svg;
}
