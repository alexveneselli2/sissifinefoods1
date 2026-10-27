// Genera il logo ridotto per la testata e le icone dell'app (PWA, iPhone, favicon)
// partendo dal logo ufficiale. Uso: npm run icone
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const ORIGINALE = 'brand/logo-sissi-originale.png';
const VERDE = '#1F3A2E';
const ORO = '#C9A961';

await mkdir('public/icons', { recursive: true });

// Logo per la testata: margini trasparenti tolti, 320 px di larghezza (basta per schermi 3x).
await sharp(ORIGINALE)
  .trim()
  .resize({ width: 320 })
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile('public/brand/logo-sissi.png');

// Per le icone usiamo solo il sole e la scritta "Sissi": l'intero logo a 192 px non si legge.
const marchio = await sharp(ORIGINALE)
  .extract({ left: 300, top: 122, width: 360, height: 246 })
  .toBuffer();

// Cornice a ottagono con angoli smussati a 45°, come la targa del logo.
function ottagono(lato, margine, smusso, tratto) {
  const a = margine, b = lato - margine, s = smusso;
  const punti = [[a + s, a], [b - s, a], [b, a + s], [b, b - s], [b - s, b], [a + s, b], [a, b - s], [a, a + s]]
    .map((p) => p.join(',')).join(' ');
  return `<polygon points="${punti}" fill="none" stroke="${ORO}" stroke-width="${tratto}"/>`;
}

async function icona(file, lato, { cornice = true, scalaMarchio = 0.74 } = {}) {
  const fondo = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lato}" height="${lato}">
      <rect width="100%" height="100%" fill="${VERDE}"/>
      ${cornice ? ottagono(lato, lato * 0.06, lato * 0.13, Math.max(1.5, lato * 0.012)) : ''}
    </svg>`,
  );
  const larghezza = Math.round(lato * scalaMarchio);
  const m = await sharp(marchio).resize({ width: larghezza }).toBuffer({ resolveWithObject: true });
  await sharp(fondo)
    .composite([{
      input: m.data,
      left: Math.round((lato - m.info.width) / 2),
      top: Math.round((lato - m.info.height) / 2),
    }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}

await icona('public/icons/icon-192.png', 192);
await icona('public/icons/icon-512.png', 512);
// Maskable: Android ritaglia l'icona in cerchi o quadrati, quindi niente cornice e marchio nella zona sicura.
await icona('public/icons/icon-maskable-512.png', 512, { cornice: false, scalaMarchio: 0.6 });
// iOS arrotonda gli angoli da sé: niente cornice, che verrebbe tagliata.
await icona('public/icons/apple-touch-icon.png', 180, { cornice: false, scalaMarchio: 0.78 });
await icona('public/icons/favicon-32.png', 32, { cornice: false, scalaMarchio: 0.95 });

console.log('Icone generate in public/icons e logo in public/brand/logo-sissi.png');
