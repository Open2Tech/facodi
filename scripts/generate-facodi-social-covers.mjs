import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

/** Tiny dependency-free PNG renderer for build-time 1200x630 social cards.
 * Original FACODI artwork: no third-party photographs, brand logos or fonts.
 * These images are derived from public page titles, not AI-made representations of videos.
 */
export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;
const COLORS = [
  [20, 40, 70],   // ink
  [249, 250, 251], // paper
  [55, 190, 210], // cyan
  [57, 121, 200], // blue
  [167, 232, 190], // mint
  [239, 255, 0],  // sun
  [255, 255, 255], // white
];

/** Five by seven uppercase pixel font, designed in source to keep OG generation deterministic. */
const GLYPHS = {
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01110'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','10101','01010'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  0:['01110','10011','10101','10101','11001','10001','01110'],
  1:['00100','01100','00100','00100','00100','00100','01110'],
  2:['01110','10001','00001','00010','00100','01000','11111'],
  3:['11110','00001','00001','01110','00001','00001','11110'],
  4:['00010','00110','01010','10010','11111','00010','00010'],
  5:['11111','10000','10000','11110','00001','00001','11110'],
  6:['01111','10000','10000','11110','10001','10001','01110'],
  7:['11111','00001','00010','00100','01000','01000','01000'],
  8:['01110','10001','10001','01110','10001','10001','01110'],
  9:['01110','10001','10001','01111','00001','00001','11110'],
  '-':['00000','00000','00000','11111','00000','00000','00000'],
  '/':['00001','00001','00010','00100','01000','10000','10000'],
  ':':['00000','00100','00100','00000','00100','00100','00000'],
  ' ':['00000','00000','00000','00000','00000','00000','00000'],
};

const normalized = input => String(input || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9/:\- ]/g, ' ')
  .replace(/\s+/g, ' ').trim();

function makeCanvas() {
  const pixels = new Uint8Array(COVER_WIDTH * COVER_HEIGHT).fill(1);
  const rect = (x, y, w, h, color) => {
    const left = Math.max(0, x | 0), top = Math.max(0, y | 0);
    const right = Math.min(COVER_WIDTH, x + w), bottom = Math.min(COVER_HEIGHT, y + h);
    for (let row = top; row < bottom; row++) pixels.fill(color, row * COVER_WIDTH + left, row * COVER_WIDTH + right);
  };
  const circle = (cx, cy, rad, color) => {
    const r2 = rad * rad;
    for (let y = Math.max(0, cy-rad); y < Math.min(COVER_HEIGHT,cy+rad); y++) {
      const dist = Math.sqrt(Math.max(0, r2 - (y-cy)*(y-cy)));
      rect(cx-dist,y,dist*2,1,color);
    }
  };
  const glyph = (char, x, y, scale, color) => {
    const pattern = GLYPHS[char] || GLYPHS[' '];
    for (let ry = 0; ry < 7; ry++) for (let rx = 0; rx < 5; rx++)
      if (pattern[ry][rx] === '1') rect(x+rx*scale,y+ry*scale,scale,scale,color);
  };
  const text = (value,x,y,scale,color) => {
    for (const ch of normalized(value)) { glyph(ch,x,y,scale,color); x += 6*scale; }
  };
  return { pixels, rect, circle, text };
}

function crc32(bytes) {
  let value = -1;
  for (const byte of bytes) {
    value ^= byte;
    for (let i = 0; i < 8; i++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ -1) >>> 0;
}
function chunk(tag, data) {
  const name = Buffer.from(tag, 'ascii');
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  Buffer.from(data).copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function encodePalettePng(pixels) {
  if (pixels.length !== COVER_WIDTH * COVER_HEIGHT) throw new Error('Invalid cover canvas size');
  const scanlines = Buffer.alloc((COVER_WIDTH+1)*COVER_HEIGHT);
  for (let y=0;y<COVER_HEIGHT;y++) Buffer.from(pixels.buffer,pixels.byteOffset + y*COVER_WIDTH,COVER_WIDTH)
    .copy(scanlines,y*(COVER_WIDTH+1)+1);
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(COVER_WIDTH,0); ihdr.writeUInt32BE(COVER_HEIGHT,4);
  ihdr[8]=8; ihdr[9]=3; // indexed color with an original seven-color palette
  const palette=Buffer.from(COLORS.flat());
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',ihdr),chunk('PLTE',palette),chunk('IDAT',deflateSync(scanlines,{level:9})),chunk('IEND',Buffer.alloc(0)),
  ]);
}

const lineWrap = (input, size=19, lines=3) => {
  const words=normalized(input).split(' ');
  const list=[];let current='';
  for (const word of words) {
    if ((current ? current.length+1 : 0) + word.length > size && current) {
      list.push(current); current=word;
      if (list.length===lines) break;
    } else current=current ? current+' '+word : word;
  }
  if (list.length<lines && current) list.push(current);
  return list.slice(0,lines);
};

export function renderCommunicationCover({ kind, title }) {
  const art=makeCanvas();
  const {rect,circle,text}=art;
  // Brand colors remain FACODI Ink/Cyan/Blue/Mint/Sun/Paper (no HSL token changes).
  rect(0,0,1200,630,1);
  rect(850,0,350,630,0);
  rect(0,0,1200,12,2);
  rect(0,0,24,630,2);
  rect(68,75,11,52,5);
  text('FACODI',98,82,8,0);
  rect(72,164,700,5,2);
  // Signal waves on the dark side: radio, audiovisual, participation.
  for(let i=0;i<4;i++) circle(1022,294,139-i*24,[2,3,4,5][i]);
  circle(1022,294,32,0); circle(1022,294,17,5);
  rect(900,463,230,14,2);rect(900,497,162,14,4);rect(900,531,193,14,5);
  rect(0,585,1200,45,0);
  text('UALG / FACODI',74,597,4,4);
  if (kind==='course') {
    text('CIENCIAS DA',72,222,11,0);
    text('COMUNICACAO',72,329,11,0);
    rect(72,470,355,9,5);
    text('LICENCIATURA / 180 ECTS',72,502,4,0);
  } else {
    text('SEQUENCIAS',72,203,10,0);
    const lines=lineWrap(title,24,3);
    lines.forEach((line,i)=>text(line,72,315+i*59,Math.min(7,Math.floor(710/Math.max(1,line.length*6))),0));
    rect(72,518,520,8,5);
    text('CIENCIAS DA COMUNICACAO',72,548,4,0);
  }
  return encodePalettePng(art.pixels);
}
export async function writeCommunicationCover(directory, kind, slug, title) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Unsafe cover slug');
  const name = kind === 'course' ? 'lcc-course.png' : `lcc-sequence-${slug}.png`;
  const destination=path.join(directory,'og',name);
  await mkdir(path.dirname(destination),{recursive:true});
  await writeFile(destination,renderCommunicationCover({kind,title}));
  return '/og/'+name;
}
