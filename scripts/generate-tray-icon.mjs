// One-off generator for the macOS menu-bar "template" icon (a simple 3-bar
// usage glyph) so the tray app has an icon without pulling in an image
// dependency. Run with: node scripts/generate-tray-icon.mjs
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "assets");

function drawBars(size) {
  const pixels = new Uint8Array(size * size * 4); // RGBA, transparent by default
  const margin = Math.round(size * 0.16);
  const barWidth = Math.max(1, Math.round(size * 0.18));
  const gap = Math.max(1, Math.round(size * 0.08));
  const baseline = size - margin;
  const heights = [0.4, 0.65, 0.9].map((f) => Math.round((size - 2 * margin) * f));

  const setPixel = (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = 0;
    pixels[i + 1] = 0;
    pixels[i + 2] = 0;
    pixels[i + 3] = 255;
  };

  heights.forEach((h, i) => {
    const x0 = margin + i * (barWidth + gap);
    const y0 = baseline - h;
    for (let x = x0; x < x0 + barWidth; x++) {
      for (let y = y0; y < baseline; y++) setPixel(x, y);
    }
  });

  return pixels;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(size, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = chunk("IDAT", deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const [size, suffix] of [[16, ""], [32, "@2x"]]) {
  const png = encodePng(size, drawBars(size));
  const file = path.join(OUT_DIR, `trayIconTemplate${suffix}.png`);
  writeFileSync(file, png);
  console.log(`Wrote ${file} (${png.length} bytes)`);
}
