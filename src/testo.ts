// Piccole funzioni di testo condivise: normalizzazione, prezzi, slug.

/** Minuscole e senza accenti: "Ragù" → "ragu". */
export function normalizza(testo: string | null | undefined): string {
  return (testo ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .toLowerCase();
}

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export function prezzo(valore: number | null): string {
  return valore == null ? 'prezzo da fare' : euro.format(valore);
}

export function slug(testo: string): string {
  return normalizza(testo).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** "SUGHI & PESTI" → "Sughi & pesti" */
export function categoria(testo: string | null): string {
  if (!testo) return '';
  const minuscolo = testo.toLocaleLowerCase('it-IT');
  return minuscolo.charAt(0).toLocaleUpperCase('it-IT') + minuscolo.slice(1);
}

export function data(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}
