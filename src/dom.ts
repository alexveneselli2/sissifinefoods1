// Creazione di elementi senza innerHTML: i testi passano sempre da textContent.
type Figlio = Node | string | null | undefined | false;
type Attributi = Record<string, string | number | boolean | null | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributi: Attributi | null = null,
  ...figli: (Figlio | Figlio[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attributi) {
    for (const [nome, valore] of Object.entries(attributi)) {
      if (valore == null || valore === false) continue;
      if (nome === 'class') el.className = String(valore);
      else el.setAttribute(nome, valore === true ? '' : String(valore));
    }
  }
  aggiungi(el, figli);
  return el;
}

export function aggiungi(el: Element, figli: (Figlio | Figlio[])[]): void {
  for (const f of figli.flat()) {
    if (f == null || f === false) continue;
    el.append(typeof f === 'string' ? document.createTextNode(f) : f);
  }
}

const NS = 'http://www.w3.org/2000/svg';

/** Il sole a raggi del logo, ridisegnato dalla sua geometria. */
export function sole(classe = 'sole'): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-1 -1 32 17');
  svg.setAttribute('class', classe);
  svg.setAttribute('aria-hidden', 'true');
  const raggi = document.createElementNS(NS, 'path');
  raggi.setAttribute('d', 'M14.94 0v9.03M7.3 1.39l3.13 7.64M22.58 1.39l-3.12 7.64M0 4.17l6.6 5.55M29.87 4.17l-6.6 5.55');
  raggi.setAttribute('class', 'sole-raggi');
  const punto = document.createElementNS(NS, 'circle');
  punto.setAttribute('cx', '14.94');
  punto.setAttribute('cy', '13.54');
  punto.setAttribute('r', '1.5');
  punto.setAttribute('class', 'sole-punto');
  svg.append(raggi, punto);
  return svg;
}

/** Separatore: filetto, sole, filetto. */
export function separatore(): HTMLElement {
  return h('div', { class: 'separatore', 'aria-hidden': 'true' }, h('span'), sole(), h('span'));
}
