/* © 2026 Wojciech Wieczorek. Wszelkie prawa zastrzeżone. */
/* Analiza obrazu dłoni: prostowanie do układu wzorcowego, mapa bruzd, śledzenie linii głównych, kod orientacji. */

export const CW = 400, CH = 440;
/* Położenie punktów kotwicznych w układzie wzorcowym (kciuk po prawej, palce w górę). */
const CEL = [[230, 208], [92, 216], [166, 394]]; // nasada palca wskazującego, nasada małego, nadgarstek

export const KOLORY = { serce: '#ff6b8b', glowa: '#5cc8ff', zycie: '#6ee7a0', los: '#f2c66d' };
export const NAZWY = { serce: 'Linia serca', glowa: 'Linia głowy', zycie: 'Linia życia', los: 'Linia losu' };

/* Przekształcenie afiniczne z trzech par punktów: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export function afiniczna(s, d) {
  const [[x1, y1], [x2, y2], [x3, y3]] = s;
  const det = x1 * (y2 - y3) - y1 * (x2 - x3) + (x2 * y3 - x3 * y2);
  if (Math.abs(det) < 1e-6) return null;
  const rozw = (u1, u2, u3) => [
    (u1 * (y2 - y3) - y1 * (u2 - u3) + (u2 * y3 - u3 * y2)) / det,
    (x1 * (u2 - u3) - u1 * (x2 - x3) + (x2 * u3 - x3 * u2)) / det,
    (x1 * (y2 * u3 - y3 * u2) - y1 * (x2 * u3 - x3 * u2) + u1 * (x2 * y3 - x3 * y2)) / det
  ];
  const [a, c, e] = rozw(d[0][0], d[1][0], d[2][0]);
  const [b, dd, f] = rozw(d[0][1], d[1][1], d[2][1]);
  return [a, b, c, dd, e, f];
}
export function odwrotna(m) {
  const [a, b, c, d, e, f] = m, det = a * d - b * c;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
}
export function punkt(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
export function doWzorca(lm) { return afiniczna([lm[5], lm[17], lm[0]], CEL); }

function plotno(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const ogr = (v, a, b) => v < a ? a : v > b ? b : v;

export class Analizator {
  constructor() {
    this.N = CW * CH;
    this.pl = plotno(CW, CH); this.ctx = this.pl.getContext('2d', { willReadFrequently: true });
    this.plM = plotno(CW, CH); this.ctxM = this.plM.getContext('2d', { willReadFrequently: true });
    this.nakladka = plotno(CW, CH); this.ctxN = this.nakladka.getContext('2d');
    this.obrN = this.ctxN.createImageData(CW, CH);
    this.szary = new Float32Array(this.N); this.maska = new Uint8Array(this.N);
    this.S = new Float32Array(this.N); this.acc = new Float32Array(this.N); this.maskaAcc = new Float32Array(this.N);
    const n1 = (CW + 1) * (CH + 1);
    this.I1 = new Float64Array(n1); this.I0 = new Float64Array(n1);
    this.n = 0; this.norma = 0.03; this.jasnosc = 0;
  }
  reset() { this.acc.fill(0); this.maskaAcc.fill(0); this.n = 0; }

  /* Jedna klatka: zrodlo – wideo lub płótno, lm – 21 punktów w pikselach źródła, alfa – waga uśredniania w czasie. */
  klatka(zrodlo, lm, alfa) {
    const M = doWzorca(lm); if (!M) return null;
    const { ctx, ctxM, N } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CW, CH);
    ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(zrodlo, 0, 0);
    const px = ctx.getImageData(0, 0, CW, CH).data;

    /* Maska dłoni zbudowana z punktów szkieletu. */
    const p = lm.map(q => punkt(M, q[0], q[1]));
    ctxM.setTransform(1, 0, 0, 1, 0, 0); ctxM.clearRect(0, 0, CW, CH);
    ctxM.fillStyle = '#fff'; ctxM.strokeStyle = '#fff'; ctxM.lineJoin = 'round'; ctxM.lineCap = 'round';
    ctxM.beginPath(); [0, 1, 2, 5, 9, 13, 17].forEach((i, k) => k ? ctxM.lineTo(p[i][0], p[i][1]) : ctxM.moveTo(p[i][0], p[i][1]));
    ctxM.closePath(); ctxM.lineWidth = 18; ctxM.fill(); ctxM.stroke();
    const palce = [[[1, 2, 3, 4], 26], [[5, 6, 7, 8], 23], [[9, 10, 11, 12], 23], [[13, 14, 15, 16], 22], [[17, 18, 19, 20], 19]];
    palce.forEach(([lanc, gr]) => { ctxM.beginPath(); lanc.forEach((i, k) => k ? ctxM.lineTo(p[i][0], p[i][1]) : ctxM.moveTo(p[i][0], p[i][1])); ctxM.lineWidth = gr; ctxM.stroke(); });
    const pm = ctxM.getImageData(0, 0, CW, CH).data;

    const { szary, maska, I1, I0, S, acc, maskaAcc } = this, W1 = CW + 1;
    let sumaJ = 0, ileJ = 0;
    for (let i = 0, j = 0; i < N; i++, j += 4) {
      const m = pm[j + 3] > 127 ? 1 : 0; maska[i] = m;
      const g = 0.25 * px[j] + 0.6 * px[j + 1] + 0.15 * px[j + 2]; szary[i] = g;
      if (m) { sumaJ += g; ileJ++; }
    }
    this.jasnosc = ileJ ? sumaJ / ileJ : 0;
    /* Obrazy całkowe – pozwalają liczyć średnie z okna tylko po pikselach dłoni. */
    for (let y = 0; y < CH; y++) {
      let w1 = 0, w0 = 0; const r = (y + 1) * W1, rp = y * W1, o = y * CW;
      for (let x = 0; x < CW; x++) {
        const m = maska[o + x]; w1 += m ? szary[o + x] : 0; w0 += m;
        I1[r + x + 1] = I1[rp + x + 1] + w1; I0[r + x + 1] = I0[rp + x + 1] + w0;
      }
    }
    const okno = (I, x, y, r) => {
      const x0 = x - r < 0 ? 0 : x - r, y0 = y - r < 0 ? 0 : y - r, x1 = x + r + 1 > CW ? CW : x + r + 1, y1 = y + r + 1 > CH ? CH : y + r + 1;
      return I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0];
    };
    const R = 8, pelne = (2 * R + 1) * (2 * R + 1), a = this.n ? alfa : 1;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = y * CW + x; let s = 0;
      if (maska[i]) {
        const c0 = okno(I0, x, y, R), ud = c0 / pelne;
        if (ud > 0.55) {
          const B = okno(I1, x, y, R) / c0, A = okno(I1, x, y, 1) / Math.max(1, okno(I0, x, y, 1));
          const r = (B - A) / (B + 24);
          if (r > 0) s = r * ogr((ud - 0.55) / 0.3, 0, 1);
        }
      }
      S[i] = s; acc[i] += a * (s - acc[i]); maskaAcc[i] += a * (maska[i] - maskaAcc[i]);
    }
    this.n++;

    /* Normalizacja: 92. percentyl siły bruzd na dłoni. */
    const hist = new Uint32Array(256); let ile = 0;
    for (let i = 0; i < N; i += 3) if (maska[i] && acc[i] > 0) { hist[Math.min(255, (acc[i] * 1600) | 0)]++; ile++; }
    let k = 0, suma = 0; while (k < 255 && suma < ile * 0.92) suma += hist[k++];
    const nowa = Math.max(0.006, k / 1600);
    this.norma = this.n > 1 ? this.norma + 0.3 * (nowa - this.norma) : nowa;
    this.M = M; this.pkt = p;
    return M;
  }

  /* Świecąca nakładka wszystkich bruzd (do rysowania przekształceniem odwrotnym na obrazie). */
  malujNakladke(wzm = 1) {
    const d = this.obrN.data, { acc, maskaAcc, N } = this, inv = 1 / this.norma;
    for (let i = 0, j = 0; i < N; i++, j += 4) {
      const v = acc[i] * inv, t = (v - 0.5) / 1.3;
      if (t <= 0 || maskaAcc[i] < 0.5) { d[j + 3] = 0; continue; }
      const u = t > 1 ? 1 : t;
      d[j] = 110 + 145 * u; d[j + 1] = 215 + 25 * u; d[j + 2] = 255 - 70 * u; d[j + 3] = Math.min(255, 255 * Math.pow(u, 0.75) * wzm);
    }
    this.ctxN.putImageData(this.obrN, 0, 0);
    return this.nakladka;
  }

  /* Odczyt końcowy: cztery linie główne, kod orientacji i statystyki. */
  wynik() {
    const { acc, N } = this, inv = 1 / this.norma;
    const Sn = new Float32Array(N); for (let i = 0; i < N; i++) Sn[i] = acc[i] * inv;
    const Sh = rozmyj1D(Sn, 3, true), Sv = rozmyj1D(Sn, 3, false);
    const q = (x, [x0, y0], [x1, y1], [x2, y2]) => y0 * (x - x1) * (x - x2) / ((x0 - x1) * (x0 - x2)) + y1 * (x - x0) * (x - x2) / ((x1 - x0) * (x1 - x2)) + y2 * (x - x0) * (x - x1) / ((x2 - x0) * (x2 - x1));
    const linie = {};
    const wygas = l => { if (!l.jest) return; for (let i = l.i0; i <= l.i1; i++) { const [x, y] = l.pkt[i]; for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < CW && yy >= 0 && yy < CH) { Sh[yy * CW + xx] = 0; Sv[yy * CW + xx] = 0; } } } };

    linie.serce = zakres(sledz(Sh, 'x', 80, 228, x => q(x, [80, 250], [150, 241], [228, 222]), 21), 0.62);
    wygas(linie.serce);
    linie.zycie = zakres(sledz(Sv, 'y', 246, 388, y => q(y, [246, 246], [315, 198], [388, 180]), 23), 0.62);
    wygas(linie.zycie);
    linie.glowa = zakres(sledz(Sh, 'x', 246, 96, x => q(x, [246, 252], [170, 276], [96, 300]), 23), 0.62);
    wygas(linie.glowa);
    linie.los = zakres(sledz(Sv, 'y', 380, 250, y => 163 + (380 - y) * 0.02, 16), 0.72);

    const kod = this.kodOrientacji(Sn);
    /* Gęstość rysunku: odsetek pola dłoni zajęty przez wyraźne bruzdy. */
    let pole = 0, bruzdy = 0;
    for (let y = 216; y < 390; y++) for (let x = 92; x < 236; x++) { const i = y * CW + x; if (this.maskaAcc[i] > 0.5) { pole++; if (Sn[i] > 0.9) bruzdy++; } }
    return { linie, kod, gestosc: pole ? bruzdy / pole : 0, jasnosc: this.jasnosc, M: this.M, pkt: this.pkt };
  }

  /* Kod orientacji: w siatce 14×16 pól wyznaczamy dominujący kierunek bruzd (tensor struktury) i jego wyrazistość. */
  kodOrientacji(Sn) {
    const g = rozmyj1D(rozmyj1D(Sn, 2, true), 2, false);
    const KOL = 14, WIE = 16, POLE = 10, X0 = 92, Y0 = 222, R = 9;
    const kier = new Uint8Array(KOL * WIE), waga = new Uint8Array(KOL * WIE);
    for (let r = 0; r < WIE; r++) for (let k = 0; k < KOL; k++) {
      const cx = X0 + k * POLE + 5, cy = Y0 + r * POLE + 5; let jxx = 0, jyy = 0, jxy = 0;
      for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
        if (x < 1 || y < 1 || x >= CW - 1 || y >= CH - 1) continue;
        const i = y * CW + x, gx = g[i + 1] - g[i - 1], gy = g[i + CW] - g[i - CW];
        jxx += gx * gx; jyy += gy * gy; jxy += gx * gy;
      }
      const kat = 0.5 * Math.atan2(2 * jxy, jxx - jyy) + Math.PI / 2; // kierunek bruzdy, 0..π
      const sp = Math.sqrt((jxx - jyy) * (jxx - jyy) + 4 * jxy * jxy), suma = jxx + jyy;
      const spojnosc = suma > 1e-9 ? sp / suma : 0, energia = Math.min(1, Math.sqrt(suma) / 2.2);
      kier[r * KOL + k] = Math.round(((kat % Math.PI) + Math.PI) % Math.PI / Math.PI * 16) % 16;
      waga[r * KOL + k] = Math.round(15 * spojnosc * energia);
    }
    return { kier: Array.from(kier), waga: Array.from(waga), kol: KOL, wie: WIE };
  }
}

function rozmyj1D(src, r, poziomo) {
  const out = new Float32Array(src.length), n = 2 * r + 1;
  if (poziomo) {
    for (let y = 0; y < CH; y++) { let s = 0; const o = y * CW;
      for (let x = -r; x < CW; x++) { const d = x + r; if (d < CW) s += src[o + d]; const u = x - r - 1; if (u >= 0) s -= src[o + u]; if (x >= 0) out[o + x] = s / n; } }
  } else {
    for (let x = 0; x < CW; x++) { let s = 0;
      for (let y = -r; y < CH; y++) { const d = y + r; if (d < CH) s += src[d * CW + x]; const u = y - r - 1; if (u >= 0) s -= src[u * CW + x]; if (y >= 0) out[y * CW + x] = s / n; } }
  }
  return out;
}

/* Programowanie dynamiczne: najsilniejsza ciągła ścieżka w korytarzu wokół krzywej wzorcowej. */
function sledz(pole, os, t0, t1, srodek, hw) {
  const krok = t1 > t0 ? 1 : -1, n = Math.abs(t1 - t0) + 1, K = 2 * hw + 1, LAM = 0.16;
  const wynik = new Float32Array(n * K), skad = new Int8Array(n * K), sr = new Int16Array(n);
  const wart = (i, o) => { const t = t0 + i * krok, c = sr[i] + o - hw; const x = os === 'x' ? t : c, y = os === 'x' ? c : t; return (x < 0 || y < 0 || x >= CW || y >= CH) ? 0 : pole[y * CW + x]; };
  for (let i = 0; i < n; i++) sr[i] = Math.round(srodek(t0 + i * krok));
  for (let o = 0; o < K; o++) wynik[o] = wart(0, o);
  for (let i = 1; i < n; i++) {
    const przes = sr[i] - sr[i - 1];
    for (let o = 0; o < K; o++) {
      let naj = -1e9, z = 0;
      for (let d = -2; d <= 2; d++) { const op = o + przes + d; if (op < 0 || op >= K) continue; const w = wynik[(i - 1) * K + op] - LAM * Math.abs(d); if (w > naj) { naj = w; z = d; } }
      wynik[i * K + o] = naj + wart(i, o); skad[i * K + o] = z;
    }
  }
  let o = 0, naj = -1e9; for (let k = 0; k < K; k++) if (wynik[(n - 1) * K + k] > naj) { naj = wynik[(n - 1) * K + k]; o = k; }
  const pkt = new Array(n), sila = new Float32Array(n);
  for (let i = n - 1; i >= 0; i--) {
    const t = t0 + i * krok, c = sr[i] + o - hw; pkt[i] = os === 'x' ? [t, c] : [c, t]; sila[i] = wart(i, o);
    if (i > 0) o = o + (sr[i] - sr[i - 1]) + skad[i * K + o];
  }
  return { pkt, sila };
}

/* Z prześledzonej ścieżki wybieramy odcinek, na którym bruzda jest naprawdę widoczna; liczymy przerwy i siłę. */
function zakres({ pkt, sila }, prog) {
  const n = pkt.length, s = new Float32Array(n);
  for (let i = 0; i < n; i++) { let a = 0, c = 0; for (let k = -4; k <= 4; k++) { const j = i + k; if (j >= 0 && j < n) { a += sila[j]; c++; } } s[i] = a / c; }
  const odc = []; let pocz = -1;
  for (let i = 0; i <= n; i++) { const jest = i < n && s[i] > prog; if (jest && pocz < 0) pocz = i; if (!jest && pocz >= 0) { odc.push([pocz, i - 1]); pocz = -1; } }
  /* Łączymy odcinki rozdzielone krótką przerwą, wybieramy najdłuższy ciąg. */
  const ciagi = [];
  odc.forEach(o => { const p = ciagi[ciagi.length - 1]; if (p && o[0] - p.i1 <= 14) { if (o[0] - p.i1 >= 5) p.przerwy++; p.i1 = o[1]; p.pokrycie += o[1] - o[0] + 1; } else ciagi.push({ i0: o[0], i1: o[1], przerwy: 0, pokrycie: o[1] - o[0] + 1 }); });
  let naj = null; ciagi.forEach(c => { if (!naj || c.pokrycie > naj.pokrycie) naj = c; });
  if (!naj || naj.pokrycie < 14) return { jest: false, pkt, i0: 0, i1: 0, dl: 0, moc: 0, przerwy: 0 };
  let moc = 0; for (let i = naj.i0; i <= naj.i1; i++) moc += s[i];
  return { jest: true, pkt, i0: naj.i0, i1: naj.i1, dl: (naj.i1 - naj.i0 + 1) / n, moc: moc / (naj.i1 - naj.i0 + 1), przerwy: naj.przerwy };
}

/* Zgodność dwóch kodów orientacji, 0..1 (0,5 ≈ przypadek). Dopuszczamy przesunięcie o jedno pole. */
export function zgodnosc(a, b) {
  if (!a || !b || a.kier.length !== b.kier.length) return 0;
  let naj = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    let l = 0, m = 0;
    for (let r = 0; r < a.wie; r++) for (let k = 0; k < a.kol; k++) {
      const r2 = r + dy, k2 = k + dx; if (r2 < 0 || k2 < 0 || r2 >= a.wie || k2 >= a.kol) continue;
      const i = r * a.kol + k, j = r2 * a.kol + k2, w = Math.min(a.waga[i], b.waga[j]); if (!w) continue;
      const dk = (a.kier[i] - b.kier[j]) * Math.PI / 16;
      l += w * (Math.cos(2 * dk) + 1) / 2; m += w;
    }
    if (m > 40) naj = Math.max(naj, l / m);
  }
  return naj;
}

/* Krótki skrót kodu – etykieta odczytu (FNV-1a po zgrubnym kierunku pól). */
export function skrot(kod) {
  let h = 0x811c9dc5;
  for (let i = 0; i < kod.kier.length; i++) { h ^= (kod.waga[i] > 3 ? (kod.kier[i] >> 2) + 1 : 0); h = Math.imul(h, 0x01000193) >>> 0; }
  const s = h.toString(16).toUpperCase().padStart(8, '0');
  return { tekst: s.slice(0, 4) + '-' + s.slice(4), liczba: h };
}

/* Geometria dłoni z punktów szkieletu (współrzędne metryczne modelu albo piksele). */
export function geometria(w) {
  const d = (a, b) => Math.hypot(w[a][0] - w[b][0], w[a][1] - w[b][1], (w[a][2] || 0) - (w[b][2] || 0));
  const lanc = (...p) => { let s = 0; for (let i = 1; i < p.length; i++) s += d(p[i - 1], p[i]); return s; };
  const dlDloni = d(0, 9), szer = d(5, 17);
  const palce = { wskazujacy: lanc(5, 6, 7, 8), srodkowy: lanc(9, 10, 11, 12), serdeczny: lanc(13, 14, 15, 16), maly: lanc(17, 18, 19, 20), kciuk: lanc(2, 3, 4) };
  const kat = (a, b, c, e) => { const u = [w[b][0] - w[a][0], w[b][1] - w[a][1], (w[b][2] || 0) - (w[a][2] || 0)], v = [w[e][0] - w[c][0], w[e][1] - w[c][1], (w[e][2] || 0) - (w[c][2] || 0)]; const il = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; return Math.acos(ogr(il / (Math.hypot(...u) * Math.hypot(...v) || 1), -1, 1)) * 180 / Math.PI; };
  return {
    dlDloni, szer, palce,
    ksztalt: dlDloni / szer,                       // > 1,5: dłoń wydłużona
    palceDoDloni: palce.srodkowy / dlDloni,        // > 1: palce długie
    wskDoSerd: palce.wskazujacy / palce.serdeczny, // 2D:4D
    malyDoSerd: palce.maly / palce.serdeczny,
    kciukDoDloni: palce.kciuk / dlDloni,
    katKciuka: kat(2, 4, 5, 8),
    rozstaw: kat(5, 8, 17, 20)
  };
}
