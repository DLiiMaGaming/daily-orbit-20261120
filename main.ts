// Daily Orbit — front page for Friday 20 November 2026.
// A Node 22 program, standard library only. It draws the day's world news
// as a 1024x1024 newspaper front page and writes it as entry.png.
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The output is deterministic: two runs write byte-identical files.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ---------- 5x7 bitmap font ----------
// One glyph is seven rows; each row is five bits, left to right, top to bottom.
const GLYPHS: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "-": [0, 0, 0, 0x1f, 0, 0, 0],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "\u2022": [0, 0x04, 0x0e, 0x0e, 0x0e, 0x04, 0],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "\u2014": [0, 0, 0, 0x1f, 0, 0, 0],
};

type RGB = [number, number, number];
const PAPER: RGB = [247, 242, 231];
const INK: RGB = [26, 26, 26];
const GREY: RGB = [84, 80, 72];
const NAVY: RGB = [18, 53, 91];
const GOLD: RGB = [201, 162, 39];
const WHITE: RGB = [255, 255, 255];
const FLAME: RGB = [178, 34, 34];

// ---------- drawing sheet ----------
class Sheet {
  readonly w: number;
  readonly h: number;
  private buf: Uint8Array;
  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8Array(w * h * 3);
    this.rect(0, 0, w, h, bg);
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }
  hline(x: number, y: number, len: number, c: RGB): void {
    for (let i = 0; i < len; i++) this.set(x + i, y, c);
  }
  vline(x: number, y: number, len: number, c: RGB): void {
    for (let i = 0; i < len; i++) this.set(x, y + i, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy));
      this.hline(cx - dx, cy + dy, dx * 2 + 1, c);
    }
  }
  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      this.set(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    }
  }
  arc(cx: number, cy: number, r: number, a0: number, a1: number, c: RGB): void {
    for (let a = a0; a <= a1; a += 2) {
      const rad = (a * Math.PI) / 180;
      this.set(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    }
  }
  tri(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, c: RGB): void {
    const minX = Math.min(x1, x2, x3);
    const maxX = Math.max(x1, x2, x3);
    const minY = Math.min(y1, y2, y3);
    const maxY = Math.max(y1, y2, y3);
    const d = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    if (d === 0) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const a = ((x2 - x) * (y3 - y) - (y2 - y) * (x3 - x)) / d;
        const b = ((x3 - x) * (y1 - y) - (y3 - y) * (x1 - x)) / d;
        const g = 1 - a - b;
        if (a >= 0 && b >= 0 && g >= 0) this.set(x, y, c);
      }
    }
  }
  // Text: one character is 5*scale wide plus one scale of spacing.
  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale - scale;
  }
  text(s: string, x: number, y: number, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const rows = GLYPHS[ch] ?? GLYPHS["?"];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (rows[r] & (1 << (4 - col))) {
            this.rect(cx + col * scale, y + r * scale, scale, scale, c);
          }
        }
      }
      cx += 6 * scale;
    }
  }
  // Greedy word wrap; returns lines that fit maxW pixels at the given scale.
  wrap(s: string, maxW: number, scale: number): string[] {
    const words = s.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (this.textWidth(next, scale) <= maxW || !cur) {
        cur = next;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  row(y: number): Uint8Array {
    return this.buf.subarray(y * this.w * 3, (y + 1) * this.w * 3);
  }
}

// ---------- PNG encoder (RGB, 8-bit, filter 0) ----------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(s: Sheet): Buffer {
  const raw = Buffer.alloc((s.w * 3 + 1) * s.h);
  for (let y = 0; y < s.h; y++) {
    raw[y * (s.w * 3 + 1)] = 0;
    Buffer.from(s.row(y)).copy(raw, y * (s.w * 3 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s.w, 0);
  ihdr.writeUInt32BE(s.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- story pictograms ----------
// Each draws inside a ~120px box centred on (cx, cy).
function iconMissile(s: Sheet, cx: number, cy: number, c: RGB): void {
  // Diagonal rocket climbing to the upper right, with a flame tail.
  for (let t = 0; t <= 44; t += 4) {
    const x = Math.round(cx - 26 + (t * 48) / 44);
    const y = Math.round(cy + 24 - (t * 48) / 44);
    s.disc(x, y, 8, c);
  }
  s.tri(cx + 22, cy - 24, cx + 38, cy - 26, cx + 24, cy - 8, c);
  s.tri(cx - 30, cy + 28, cx - 18, cy + 16, cx - 36, cy + 12, c);
  s.tri(cx - 30, cy + 28, cx - 18, cy + 16, cx - 14, cy + 34, c);
  s.tri(cx - 34, cy + 32, cx - 26, cy + 40, cx - 42, cy + 44, FLAME);
  s.tri(cx - 42, cy + 44, cx - 34, cy + 52, cx - 50, cy + 52, FLAME);
  s.line(cx - 52, cy - 6, cx - 38, cy - 6, c);
  s.line(cx - 56, cy + 8, cx - 44, cy + 8, c);
}

function iconBurst(s: Sheet, cx: number, cy: number, c: RGB): void {
  // Two buildings with an explosion bursting above them.
  s.rect(cx - 40, cy + 8, 26, 38, c);
  s.rect(cx - 8, cy - 4, 26, 50, c);
  s.rect(cx - 34, cy + 16, 6, 6, PAPER);
  s.rect(cx - 34, cy + 28, 6, 6, PAPER);
  s.rect(cx - 2, cy + 4, 6, 6, PAPER);
  s.rect(cx - 2, cy + 16, 6, 6, PAPER);
  const bx = cx + 22;
  const by = cy - 22;
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    const len = a % 60 === 0 ? 26 : 16;
    s.line(bx, by, Math.round(bx + len * Math.cos(rad)), Math.round(by + len * Math.sin(rad)), a % 60 === 0 ? FLAME : GOLD);
  }
  s.disc(bx, by, 7, FLAME);
}

function iconTanker(s: Sheet, cx: number, cy: number, c: RGB): void {
  // Tanker hull, stacked containers, a flame and waves.
  s.rect(cx - 46, cy - 2, 92, 20, c);
  s.tri(cx + 46, cy - 2, cx + 62, cy + 18, cx + 46, cy + 18, c);
  s.rect(cx - 40, cy - 16, 18, 14, GOLD);
  s.rect(cx - 20, cy - 16, 18, 14, c);
  s.rect(cx + 0, cy - 16, 18, 14, GOLD);
  s.rect(cx + 34, cy - 16, 10, 14, c);
  s.tri(cx - 30, cy - 18, cx - 20, cy - 34, cx - 10, cy - 18, FLAME);
  s.hline(cx - 52, cy + 28, 104, c);
  s.hline(cx - 44, cy + 36, 88, c);
  s.hline(cx - 52, cy + 44, 104, c);
}

function iconDrone(s: Sheet, cx: number, cy: number, c: RGB): void {
  // Quadcopter seen from above: body, four arms, four rotors.
  s.line(cx - 34, cy - 22, cx + 34, cy + 22, c);
  s.line(cx + 34, cy - 22, cx - 34, cy + 22, c);
  for (const [ox, oy] of [[-34, -22], [34, -22], [-34, 22], [34, 22]] as const) {
    s.ring(cx + ox, cy + oy, 13, c);
    s.hline(cx + ox - 13, cy + oy, 27, c);
  }
  s.disc(cx, cy, 11, c);
  s.disc(cx, cy, 4, PAPER);
}

function iconGlobe(s: Sheet, cx: number, cy: number, c: RGB): void {
  // Globe with a leaf: the climate summit.
  s.ring(cx, cy, 42, c);
  s.hline(cx - 42, cy, 85, c);
  s.arc(cx, cy, 42, 200, 340, c);
  s.arc(cx, cy, 42, 20, 160, c);
  s.line(cx, cy - 42, cx, cy + 42, c);
  s.tri(cx + 26, cy - 44, cx + 44, cy - 52, cx + 40, cy - 30, [21, 128, 61]);
  s.line(cx + 26, cy - 44, cx + 44, cy - 52, [21, 128, 61]);
}

function iconCyclone(s: Sheet, cx: number, cy: number, c: RGB): void {
  // Spiral storm with a wind arrow.
  s.arc(cx, cy, 12, 0, 300, c);
  s.arc(cx, cy, 24, 40, 340, c);
  s.arc(cx, cy, 36, 80, 360, c);
  s.arc(cx, cy, 48, 120, 300, c);
  s.tri(cx + 44, cy - 26, cx + 58, cy - 18, cx + 42, cy - 10, c);
  s.line(cx - 52, cy + 44, cx + 52, cy + 44, c);
  s.line(cx - 44, cy + 52, cx + 44, cy + 52, c);
}

const ICONS: Record<string, (s: Sheet, cx: number, cy: number, c: RGB) => void> = {
  missile: iconMissile,
  burst: iconBurst,
  tanker: iconTanker,
  drone: iconDrone,
  globe: iconGlobe,
  cyclone: iconCyclone,
};

// ---------- the day's stories ----------
// Every story below happened, or was first reported, on Friday 20 November 2026.
interface Story {
  kicker: string;
  accent: RGB;
  head: string;
  caption: string;
  icon: string;
}
const STORIES: Story[] = [
  {
    kicker: "UKRAINE \u2022 WAR",
    accent: [178, 34, 34],
    head: "KYIV HIT BY FOUR BALLISTIC MISSILES",
    caption: "Russia strikes the capital; a blast lands near the Dutch embassy.",
    icon: "missile",
  },
  {
    kicker: "MIDDLE EAST \u2022 CONFLICT",
    accent: [194, 87, 27],
    head: "HOUTHIS STRIKE FOUR SAUDI TARGETS",
    caption: "Drones and missiles hit the kingdom; a Riyadh landmark is damaged.",
    icon: "burst",
  },
  {
    kicker: "ENERGY \u2022 SHIPPING",
    accent: [15, 118, 110],
    head: "TANKER ABLAZE AFTER MINE STRIKE",
    caption: "A tanker catches fire east of the Strait of Hormuz.",
    icon: "tanker",
  },
  {
    kicker: "EUROPE \u2022 AVIATION",
    accent: [29, 78, 216],
    head: "MYSTERY DRONES SHUT GENOA AIRPORT",
    caption: "Flights halted for four hours overnight after drone sightings.",
    icon: "drone",
  },
  {
    kicker: "CLIMATE \u2022 COP31",
    accent: [21, 128, 61],
    head: "COP31 CLOSES IN ANTALYA",
    caption: "The final draft drops any reference to fossil fuels.",
    icon: "globe",
  },
  {
    kicker: "ASIA \u2022 WEATHER",
    accent: [109, 40, 217],
    head: "INDIA EVACUATES 80,000 AS CYCLONE NEARS",
    caption: "Cyclone Akvan bears down on Odisha; schools shut.",
    icon: "cyclone",
  },
];

function tint(c: RGB): RGB {
  return [
    Math.round((c[0] + 3 * PAPER[0]) / 4),
    Math.round((c[1] + 3 * PAPER[1]) / 4),
    Math.round((c[2] + 3 * PAPER[2]) / 4),
  ];
}

function centred(s: Sheet, text: string, scale: number): number {
  return Math.round((s.w - s.textWidth(text, scale)) / 2);
}

// ---------- compose the front page ----------
function compose(): Sheet {
  const s = new Sheet(1024, 1024, PAPER);

  // Masthead: name the paper and, above all, the day.
  s.rect(0, 0, 1024, 152, NAVY);
  s.text("THE DAILY ORBIT", centred(s, "THE DAILY ORBIT", 7), 24, 7, WHITE);
  s.rect(212, 86, 600, 3, GOLD);
  s.text("FRIDAY 20 NOVEMBER 2026", centred(s, "FRIDAY 20 NOVEMBER 2026", 4), 96, 4, GOLD);
  s.text("THE WORLD IN ONE PAGE", centred(s, "THE WORLD IN ONE PAGE", 2), 128, 2, [198, 208, 222]);

  // Six stories, two columns by three rows.
  const px = [24, 520];
  const py = [168, 416, 664];
  const PW = 480;
  const PH = 232;
  STORIES.forEach((st, i) => {
    const x = px[i % 2];
    const y = py[Math.floor(i / 2)];
    s.rect(x, y, PW, PH, WHITE);
    s.rect(x, y, PW, 8, st.accent);
    s.rect(x, y + PH - 2, PW, 2, [214, 208, 196]);
    s.text(st.kicker, x + 14, y + 18, 2, st.accent);
    // Pictogram on a tinted tile, right side.
    const bx = x + 336;
    const by = y + 46;
    s.rect(bx, by, 130, 116, tint(st.accent));
    ICONS[st.icon](s, bx + 65, by + 58, st.accent);
    // Headline, wrapped to the space left of the tile.
    const lines = s.wrap(st.head, 306, 3);
    lines.slice(0, 3).forEach((ln, li) => s.text(ln, x + 14, y + 46 + li * 26, 3, INK));
    // Caption across the full panel width, under a hairline.
    s.hline(x + 14, y + 178, 452, [214, 208, 196]);
    const caps = s.wrap(st.caption, 452, 2);
    caps.slice(0, 2).forEach((ln, li) => s.text(ln, x + 14, y + 190 + li * 18, 2, GREY));
  });

  // Footer ticker: three more stories from the same day.
  s.rect(0, 912, 1024, 88, NAVY);
  s.text("ALSO ON 20 NOVEMBER", 24, 922, 2, GOLD);
  s.text("ANTHROPIC DEBUTS ON NASDAQ \u2022 SOUTH KOREA EXPORTS PASS $1 TRILLION", 24, 944, 2, WHITE);
  s.text("EUROPE OPEN TO RUSSIA TALKS ON UKRAINE \u2022 FIJI DECLARES DROUGHT DISASTER", 24, 966, 2, WHITE);
  return s;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePng(compose()));
}

main();
