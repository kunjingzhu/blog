// favicon 生成器：16x16 像素画「>▌终端」图标 → PNG(16/32/48/180/256) + ICO + SVG
// 设计：深底 #0B1220 + 绿色 >_ (#3DDC84) + 琥珀色光标块 (#F5A623)，契合「老朱的赛博工位」终端风
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const GRID = [
  "................",
  "................",
  "....GG..........",
  ".....GG.........",
  "......GG........",
  ".......GG.......",
  "........GG......",
  ".......GG.......",
  "......GG........",
  ".....GG.........",
  "....GG..........",
  "................",
  "..........AAA...",
  "...GGGGG..AAA...",
  "...GGGGG..AAA...",
  "................",
];
const COLORS = {
  '.': [11, 18, 32, 255],    // #0B1220 背景
  'G': [61, 220, 132, 255],  // #3DDC84 终端绿
  'A': [245, 166, 35, 255],  // #F5A623 光标琥珀
};

// ---- PNG encoder ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function renderRgba(size) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const gy = Math.min(15, Math.floor((y * 16) / size));
    for (let x = 0; x < size; x++) {
      const gx = Math.min(15, Math.floor((x * 16) / size));
      const col = COLORS[GRID[gy][gx]];
      const o = (y * size + x) * 4;
      rgba[o] = col[0]; rgba[o + 1] = col[1]; rgba[o + 2] = col[2]; rgba[o + 3] = col[3];
    }
  }
  return rgba;
}
function encodePng(size) {
  const rgba = renderRgba(size);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = 1 + size * 4;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
function encodeIco(sizes) {
  const pngs = sizes.map(s => encodePng(s));
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  const dir = Buffer.alloc(16 * sizes.length);
  let offset = 6 + 16 * sizes.length;
  sizes.forEach((s, i) => {
    const o = i * 16;
    dir[o] = s >= 256 ? 0 : s; dir[o + 1] = s >= 256 ? 0 : s;
    dir.writeUInt16LE(1, o + 2); dir.writeUInt16LE(32, o + 4);
    dir.writeUInt32LE(pngs[i].length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += pngs[i].length;
  });
  return Buffer.concat([head, dir, ...pngs]);
}
function gridToSvg(single) {
  let r = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`;
  r += single ? '' : `<rect width="16" height="16" fill="#0B1220"/>`;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = GRID[y][x];
    if (ch === '.') continue;
    const fill = single ? '#000000' : (ch === 'G' ? '#3DDC84' : '#F5A623');
    r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
  }
  return r + '</svg>\n';
}

const out = process.argv[2] || path.join(__dirname, '..', 'static');
fs.mkdirSync(out, { recursive: true });
const w = (name, buf) => { fs.writeFileSync(path.join(out, name), buf); console.log(`  + ${name} (${buf.length} bytes)`); };
console.log(`writing to ${out}`);
w('favicon.ico', encodeIco([16, 32, 48, 256]));
w('favicon-16x16.png', encodePng(16));
w('favicon-32x32.png', encodePng(32));
w('favicon-48x48.png', encodePng(48));
w('apple-touch-icon.png', encodePng(180));
w('favicon.png', encodePng(256));
w('favicon.svg', Buffer.from(gridToSvg(false), 'utf8'));
w('safari-pinned-tab.svg', Buffer.from(gridToSvg(true), 'utf8'));
console.log('done');
