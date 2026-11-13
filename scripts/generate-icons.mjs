// Erzeugt die PWA-Icons als PNG ohne externe Bildbibliothek.
// Aufruf: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const BACKGROUND = [17, 22, 29, 255];
const CARD = [36, 48, 64, 255];
const ACCENT = [79, 156, 249, 255];
const MUTED = [154, 168, 187, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // Bittiefe
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0; // Filtertyp "None"
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundedRect(x, y, left, top, width, height, radius) {
  if (x < left || y < top || x >= left + width || y >= top + height) {
    return false;
  }
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius - 1));
  const dy = Math.max(top + radius - y, 0, y - (top + height - radius - 1));
  return dx * dx + dy * dy <= radius * radius;
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const unit = size / 512;

  const cardLeft = Math.round(96 * unit);
  const cardTop = Math.round(128 * unit);
  const cardWidth = Math.round(320 * unit);
  const cardHeight = Math.round(256 * unit);
  const cardRadius = Math.round(36 * unit);

  const bars = [
    { top: 184, height: 36, left: 136, width: 240, color: ACCENT },
    { top: 248, height: 20, left: 136, width: 180, color: MUTED },
    { top: 292, height: 20, left: 136, width: 212, color: MUTED },
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let color = BACKGROUND;

      if (inRoundedRect(x, y, cardLeft, cardTop, cardWidth, cardHeight, cardRadius)) {
        color = CARD;
        for (const bar of bars) {
          if (
            inRoundedRect(
              x,
              y,
              Math.round(bar.left * unit),
              Math.round(bar.top * unit),
              Math.round(bar.width * unit),
              Math.round(bar.height * unit),
              Math.round((bar.height / 2) * unit),
            )
          ) {
            color = bar.color;
          }
        }
      }

      const offset = (y * size + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }

  return encodePng(size, pixels);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  const file = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, drawIcon(size));
  console.log(`geschrieben: ${file}`);
}
