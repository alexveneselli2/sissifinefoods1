// Ricerca: tutte le parole devono comparire; ordine nome che inizia, nome che contiene, marca, resto.
import type { Archivio, Prodotto } from './dati';
import { normalizza } from './testo';

interface Voce {
  prodotto: Prodotto;
  testo: string;
  nome: string;
  marca: string;
}

export function creaIndice(archivio: Archivio): Voce[] {
  return archivio.dati.prodotti.map((p) => {
    const famiglie = p.famiglie.map((id) => archivio.famiglia.get(id)?.nome ?? '');
    const campi = [
      p.nome, p.nomeTilby, p.marca, p.fornitore, p.descrizione, p.categoriaTilby, p.stile,
      ...p.paroleChiave, ...famiglie,
    ];
    return {
      prodotto: p,
      testo: normalizza(campi.filter(Boolean).join(' ')),
      nome: normalizza(p.nome),
      marca: normalizza(p.marca),
    };
  });
}

export function cerca(indice: Voce[], domanda: string): Prodotto[] {
  const testo = normalizza(domanda).trim().replace(/\s+/g, ' ');
  if (!testo) return [];
  const parole = testo.split(' ');
  return indice
    .filter((v) => parole.every((parola) => v.testo.includes(parola)))
    .map((v) => ({
      v,
      punteggio: v.nome.startsWith(testo) ? 0 : v.nome.includes(testo) ? 1 : v.marca.includes(testo) ? 2 : 3,
    }))
    .sort((a, b) => a.punteggio - b.punteggio || a.v.prodotto.nome.localeCompare(b.v.prodotto.nome, 'it'))
    .map(({ v }) => v.prodotto);
}
