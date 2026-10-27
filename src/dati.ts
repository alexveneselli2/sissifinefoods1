// Tipi e caricamento di data/abbinamenti.json, l'unica fonte dei dati.
import urlDati from '../data/abbinamenti.json?url';

export interface Gruppo {
  perche: string;
  ids: number[];
}

export interface Prodotto {
  id: number;
  nome: string;
  nomeTilby: string;
  marca: string | null;
  fornitore: string | null;
  descrizione: string | null;
  categoriaTilby: string | null;
  prezzo: number | null;
  formato: string | null;
  tipo: 'cibo' | 'bevanda';
  stile: string | null;
  famiglie: string[];
  paroleChiave: string[];
  daEvitare: Gruppo[];
  consigli: string[];
  kit: string[];
  abbinaConCibi?: Gruppo[];
  viniEBevande?: Gruppo[];
  cibiDaAbbinare?: Gruppo[];
  stannoBeneVicino?: Gruppo[];
}

export interface Kit {
  nome: string;
  prodotti: { id: number; quantita: number }[];
  totale: number;
}

export interface Famiglia {
  id: string;
  nome: string;
  perche: string;
  nota: string | null;
  cibi: number[];
  bevande: { stile: string; perche: string; ids: number[] }[];
  daEvitare: { perche: string; stili: string[]; ids: number[] } | null;
  kit: Kit | null;
}

export interface Dati {
  meta: { negozio: string; aggiornato: string; prodotti: number; famiglie: number };
  stili: { nome: string; ids: number[] }[];
  famiglie: Famiglia[];
  prodotti: Prodotto[];
}

export interface Archivio {
  dati: Dati;
  prodotto: Map<number, Prodotto>;
  famiglia: Map<string, Famiglia>;
  kitPerNome: Map<string, Famiglia>;
}

export async function caricaDati(): Promise<Archivio> {
  const risposta = await fetch(urlDati);
  if (!risposta.ok) throw new Error(`Dati non disponibili (${risposta.status})`);
  const dati = (await risposta.json()) as Dati;
  const kitPerNome = new Map<string, Famiglia>();
  for (const f of dati.famiglie) if (f.kit) kitPerNome.set(f.kit.nome, f);
  return {
    dati,
    prodotto: new Map(dati.prodotti.map((p) => [p.id, p])),
    famiglia: new Map(dati.famiglie.map((f) => [f.id, f])),
    kitPerNome,
  };
}
