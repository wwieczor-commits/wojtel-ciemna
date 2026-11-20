/* © 2026 Wojciech Wieczorek i Anna Mikos. Wszelkie prawa zastrzeżone. */
/* Interfejs: kamera, podgląd linii na żywo, skan, zakładki odczytu, pamięć dłoni, raport PDF. */
import { FilesetResolver, HandLandmarker } from '../vendor/mediapipe/vision_bundle.mjs';
import { Analizator, CW, CH, KOLORY, NAZWY, odwrotna, punkt, zgodnosc, skrot, geometria } from './analiza.js?v=3';
import { zbudujOdczyt, METODY, ZRODLA } from './dane.js?v=3';

const $ = id => document.getElementById(id);
const h = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const proc = x => Math.round(x * 100) + '%';
const ogr = (v, a, b) => v < a ? a : v > b ? b : v;

const ekran = $('ekran'), ctx = ekran.getContext('2d'), wideo = $('wideo');
const CZAS_SPOKOJU = 900, CZAS_SKANU = 2600, PROG_ZGODNOSCI = 0.62;
const stan = { tryb: 'start', lustro: true, przod: true, det: null, strumien: null, an: new Analizator(), lm: null, swiat: null, etykieta: '', spokojOd: 0, skanOd: 0, glos: 0, bezStrony: false, ostatnieKody: [], ostCzas: -1, bezDloni: 0, zak: 'wrozba', odczyt: null };

/* ---------- Model i kamera ---------- */
async function wczytajModel() {
  if (stan.det) return;
  const pliki = await FilesetResolver.forVisionTasks('vendor/mediapipe/wasm');
  const opcje = d => ({ baseOptions: { modelAssetPath: 'vendor/mediapipe/hand_landmarker.task', delegate: d }, runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
  try { stan.det = await HandLandmarker.createFromOptions(pliki, opcje('GPU')); }
  catch (e) { stan.det = await HandLandmarker.createFromOptions(pliki, opcje('CPU')); }
}
function zatrzymajStrumien() { if (stan.strumien) { stan.strumien.getTracks().forEach(t => t.stop()); stan.strumien = null; } wideo.srcObject = null; $('btnKamera').hidden = true; }
async function otworzStrumien() {
  zatrzymajStrumien();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('brak-kamery');
  stan.strumien = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: stan.przod ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
  wideo.srcObject = stan.strumien; await wideo.play();
  const u = stan.strumien.getVideoTracks()[0].getSettings();
  stan.lustro = u.facingMode ? u.facingMode === 'user' : stan.przod;
  try { const urz = await navigator.mediaDevices.enumerateDevices(); $('btnKamera').hidden = urz.filter(d => d.kind === 'videoinput').length < 2; } catch (e) { /* bez przełącznika */ }
}
function komunikat(t, dobrze) { const k = $('komunikat'); k.hidden = !t; k.textContent = t || ''; k.classList.toggle('dobrze', !!dobrze); }
function postep(x) { const p = $('postep'); p.hidden = x == null; if (x != null) p.firstElementChild.style.width = proc(ogr(x, 0, 1)); }
function tryb(t) {
  stan.tryb = t; document.querySelector('.okno').dataset.tryb = t;
  $('start').hidden = t !== 'start'; $('scena').classList.toggle('pusta', t === 'start');
  $('btnCzytaj').hidden = t !== 'live'; $('btnNastepna').hidden = t !== 'wynik';
  $('btnStop').hidden = !(stan.strumien && stan.strumien.active);
  $('oknoStan').textContent = { start: 'Gotowe', live: 'Podgląd na żywo', skan: 'Skanowanie…', wynik: 'Odczyt gotowy' }[t];
  if (t !== 'wynik') { $('wynik').hidden = true; $('instrukcja').hidden = false; }
  if (t === 'start' || t === 'wynik') { komunikat(''); postep(null); }
}

async function uruchomKamere() {
  const b = $('btnStart'); b.disabled = true; b.textContent = 'Wczytuję model dłoni…';
  try {
    await Promise.all([wczytajModel(), otworzStrumien()]);
    stan.an.reset(); stan.lm = null; tryb('live'); komunikat('Pokaż wnętrze dłoni do kamery');
  } catch (e) {
    const brak = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
    $('start').querySelector('.start-tekst').innerHTML = brak ? 'Przeglądarka nie dała dostępu do kamery.<br>Zezwól na kamerę w ustawieniach strony albo wybierz zdjęcie dłoni.' : 'Nie udało się uruchomić kamery.<br>Możesz wybrać zdjęcie dłoni z urządzenia.';
    tryb('start');
  }
  b.disabled = false; b.textContent = 'Uruchom kamerę';
}

/* ---------- Ocena ułożenia dłoni ---------- */
const odl = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function strona(lm, etykieta) {
  /* Model rozpoznaje lewą i prawą rękę po wyglądzie. Razem ze skrętnością układu punktów (nadgarstek → palec wskazujący × nadgarstek → mały palec)
     mówi to, którą stronę dłoni widzi kamera. Reguła sprawdzona na zdjęciach wnętrza i grzbietu obu rąk, także w odbiciu lustrzanym. */
  const u = [lm[5][0] - lm[0][0], lm[5][1] - lm[0][1]], v = [lm[17][0] - lm[0][0], lm[17][1] - lm[0][1]];
  const dodatnia = u[0] * v[1] - u[1] * v[0] > 0;
  return { wnetrze: (etykieta === 'Left') === dodatnia, reka: etykieta === 'Left' ? 'lewa' : etykieta === 'Right' ? 'prawa' : null };
}
function odczytajReke(w) { const r = w.handednesses || w.handedness, e = r && r[0] && r[0][0]; return e ? { etykieta: e.categoryName, pewnosc: e.score || 0 } : { etykieta: '', pewnosc: 0 }; }
function ocen(lm, W, H) {
  const szer = odl(lm[5], lm[17]), m = Math.min(W, H);
  if (lm.some(p => p[0] < 4 || p[1] < 4 || p[0] > W - 4 || p[1] > H - 4)) return 'Cała dłoń musi być w oknie';
  if (szer < m * 0.17) return 'Przybliż dłoń do kamery';
  if (szer > m * 0.5) return 'Odsuń dłoń odrobinę';
  for (const [k, s] of [[8, 6], [12, 10], [16, 14], [20, 18]]) if (odl(lm[k], lm[0]) < odl(lm[s], lm[0]) * 1.08) return 'Wyprostuj i rozstaw palce';
  if (odl(lm[0], lm[9]) < szer * 0.95) return 'Ustaw dłoń płasko, przodem do kamery';
  if (!stan.bezStrony) {
    if (stan.glos < -0.2) return 'To grzbiet dłoni – odwróć ją wnętrzem do kamery';
    if (stan.glos < 0.3) return 'Pokaż wyraźnie wnętrze dłoni';
  }
  if (stan.an.jasnosc && stan.an.jasnosc < 45) return 'Za ciemno – doświetl dłoń';
  return '';
}

/* ---------- Pętla podglądu ---------- */
function petla() {
  requestAnimationFrame(petla);
  if ((stan.tryb !== 'live' && stan.tryb !== 'skan') || wideo.readyState < 2 || !stan.det) return;
  const W = wideo.videoWidth, H = wideo.videoHeight; if (!W) return;
  if (ekran.width !== W || ekran.height !== H) { ekran.width = W; ekran.height = H; }
  const teraz = performance.now();
  if (wideo.currentTime !== stan.ostCzas) {
    stan.ostCzas = wideo.currentTime;
    let w = null; try { w = stan.det.detectForVideo(wideo, teraz); } catch (e) { w = null; }
    klatka(w, W, H, teraz);
  }
  rysujPodglad(W, H, teraz);
}
function klatka(w, W, H, teraz) {
  const pkt = w && w.landmarks && w.landmarks[0];
  if (!pkt) {
    if (++stan.bezDloni > 6) { stan.lm = null; stan.glos = 0; stan.an.reset(); stan.spokojOd = 0; if (stan.tryb === 'skan') tryb('live'); komunikat('Pokaż wnętrze dłoni do kamery'); postep(null); }
    return;
  }
  stan.bezDloni = 0;
  const nowe = pkt.map(p => [p.x * W, p.y * H]);
  const rk = odczytajReke(w); stan.etykieta = rk.etykieta;
  /* Głosowanie z wielu klatek: wnętrze czy grzbiet (ważone pewnością modelu). */
  stan.glos += 0.25 * ((strona(nowe, rk.etykieta).wnetrze ? 1 : -1) * rk.pewnosc - stan.glos);
  stan.swiat = w.worldLandmarks && w.worldLandmarks[0] ? w.worldLandmarks[0].map(p => [p.x, p.y, p.z]) : null;
  let ruch = 1;
  if (stan.lm) { const szer = odl(nowe[5], nowe[17]) || 1; ruch = nowe.reduce((a, p, i) => a + odl(p, stan.lm[i]), 0) / 21 / szer; stan.lm = nowe.map((p, i) => [stan.lm[i][0] + 0.6 * (p[0] - stan.lm[i][0]), stan.lm[i][1] + 0.6 * (p[1] - stan.lm[i][1])]); }
  else stan.lm = nowe;
  if (ruch > 0.25) stan.an.reset();
  stan.an.klatka(wideo, stan.lm, stan.tryb === 'skan' ? 0.1 : 0.28);
  const uwaga = ocen(stan.lm, W, H);
  if (stan.tryb === 'live') {
    if (uwaga) { stan.spokojOd = 0; komunikat(uwaga); postep(null); return; }
    if (ruch > 0.03) { stan.spokojOd = 0; komunikat('Dobrze – teraz przytrzymaj nieruchomo', true); postep(0); return; }
    if (!stan.spokojOd) stan.spokojOd = teraz;
    komunikat('Trzymaj… zaraz zaczynam czytać', true); postep((teraz - stan.spokojOd) / CZAS_SPOKOJU * 0.25);
    if (teraz - stan.spokojOd >= CZAS_SPOKOJU) zacznijSkan(teraz);
  } else if (stan.tryb === 'skan') {
    if (uwaga && uwaga !== 'Za ciemno – doświetl dłoń' || ruch > 0.09) { tryb('live'); stan.spokojOd = 0; komunikat(uwaga || 'Dłoń się poruszyła – spróbujmy jeszcze raz'); postep(null); return; }
    const t = (teraz - stan.skanOd) / CZAS_SKANU; postep(0.25 + 0.75 * t);
    komunikat(t < 0.35 ? 'Czytam linię serca…' : t < 0.65 ? 'Czytam linię głowy i życia…' : 'Liczę sygnaturę dłoni…', true);
    if (t >= 1) zakoncz(wideo, wideo.videoWidth, wideo.videoHeight);
  }
}
function zacznijSkan(teraz) { stan.skanOd = teraz; tryb('skan'); }

/* ---------- Rysowanie ---------- */
function wLustrze(W, f) { ctx.save(); if (stan.lustro) { ctx.translate(W, 0); ctx.scale(-1, 1); } f(); ctx.restore(); }
const KOSCI = [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [0, 17, 18, 19, 20], [5, 9, 13, 17]];
function rysujSzkielet(lm, W, alfa) {
  ctx.lineWidth = Math.max(1, W / 640); ctx.strokeStyle = `rgba(242,198,109,${0.35 * alfa})`; ctx.fillStyle = `rgba(255,236,190,${0.8 * alfa})`;
  KOSCI.forEach(k => { ctx.beginPath(); k.forEach((i, n) => n ? ctx.lineTo(lm[i][0], lm[i][1]) : ctx.moveTo(lm[i][0], lm[i][1])); ctx.stroke(); });
  lm.forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.6, W / 420), 0, 6.3); ctx.fill(); });
}
function rysujNakladke(obraz, M, alfa) {
  const Mi = odwrotna(M); ctx.save(); ctx.transform(Mi[0], Mi[1], Mi[2], Mi[3], Mi[4], Mi[5]);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alfa; ctx.drawImage(obraz, 0, 0);
  return () => ctx.restore();
}
function rysujPodglad(W, H, teraz) {
  wLustrze(W, () => {
    ctx.drawImage(wideo, 0, 0, W, H);
    ctx.fillStyle = 'rgba(5,7,18,.34)'; ctx.fillRect(0, 0, W, H);
    if (!stan.lm || !stan.an.M) return;
    const koniec = rysujNakladke(stan.an.malujNakladke(1), stan.an.M, 1);
    if (stan.tryb === 'skan') {
      /* Wiązka skanująca w układzie dłoni – porusza się razem z ręką. */
      const f = ((teraz - stan.skanOd) / 900) % 2, y = 20 + (f < 1 ? f : 2 - f) * 400;
      const g = ctx.createLinearGradient(0, y - 46, 0, y + 46); g.addColorStop(0, 'rgba(92,200,255,0)'); g.addColorStop(0.5, 'rgba(160,230,255,.55)'); g.addColorStop(1, 'rgba(92,200,255,0)');
      ctx.fillStyle = g; ctx.fillRect(30, y - 46, CW - 60, 92);
    }
    koniec();
    rysujSzkielet(stan.lm, W, stan.tryb === 'skan' ? 1 : 0.7);
  });
}

function sciezka(l, Mi) {
  const p = []; for (let i = l.i0; i <= l.i1; i++) { let x = 0, y = 0, n = 0; for (let k = -4; k <= 4; k++) { const j = i + k; if (j >= l.i0 && j <= l.i1) { x += l.pkt[j][0]; y += l.pkt[j][1]; n++; } } p.push(punkt(Mi, x / n, y / n)); }
  return p;
}
function rysujWynik(t) {
  const z = stan.zdjecie, W = z.width, H = z.height, w = stan.wynik, Mi = odwrotna(w.M);
  if (ekran.width !== W || ekran.height !== H) { ekran.width = W; ekran.height = H; }
  const etykiety = [];
  wLustrze(W, () => {
    ctx.drawImage(z, 0, 0);
    ctx.fillStyle = 'rgba(5,7,18,.5)'; ctx.fillRect(0, 0, W, H);
    rysujNakladke(stan.nakladka, w.M, 0.5)();
    rysujSzkielet(stan.lmWynik, W, 0.35);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ['zycie', 'glowa', 'serce', 'los'].forEach((k, nr) => {
      const l = w.linie[k]; if (!l.jest) return;
      const p = sciezka(l, Mi), ile = Math.max(2, Math.round(p.length * ogr(t * 1.6 - nr * 0.15, 0, 1)));
      if (ile < 3) return;
      ctx.beginPath(); for (let i = 0; i < ile; i++) i ? ctx.lineTo(p[i][0], p[i][1]) : ctx.moveTo(p[i][0], p[i][1]);
      ctx.strokeStyle = KOLORY[k]; ctx.shadowColor = KOLORY[k];
      ctx.shadowBlur = W / 40; ctx.globalAlpha = 0.55; ctx.lineWidth = W / 90; ctx.stroke();
      ctx.shadowBlur = W / 120; ctx.globalAlpha = 1; ctx.lineWidth = W / 260; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.shadowBlur = 0;
      etykiety.push([k, p[k === 'serce' ? 0 : p.length - 1]]);
    });
  });
  if (t < 0.85) return;
  /* Podpisy rysujemy poza odbiciem lustrzanym, żeby tekst był czytelny. */
  const fs = Math.max(13, Math.round(W / 46)); ctx.font = `600 ${fs}px Figtree, system-ui, sans-serif`; ctx.textBaseline = 'middle';
  etykiety.forEach(([k, p]) => {
    const tekst = NAZWY[k], sz = ctx.measureText(tekst).width + fs * 1.9, wy = fs * 1.8;
    let x = stan.lustro ? W - p[0] : p[0], y = p[1] + (k === 'los' ? -wy : k === 'zycie' ? wy : 0);
    const lewo = (k === 'serce' || k === 'glowa') ? (stan.lustro ? false : true) : false;
    x = ogr(lewo ? x - sz - fs * 0.6 : (k === 'los' || k === 'zycie') ? x - sz / 2 : x + fs * 0.6, 6, W - sz - 6); y = ogr(y, wy, H - wy);
    ctx.fillStyle = 'rgba(8,11,26,.86)'; ctx.strokeStyle = KOLORY[k]; ctx.lineWidth = Math.max(1, W / 700);
    ctx.beginPath(); ctx.roundRect(x, y - wy / 2, sz, wy, wy / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = KOLORY[k]; ctx.beginPath(); ctx.arc(x + fs * 0.75, y, fs * 0.28, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(tekst, x + fs * 1.3, y + 1);
  });
}
if (!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, hh, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + hh, r); this.arcTo(x + w, y + hh, x, y + hh, r); this.arcTo(x, y + hh, x, y, r); this.arcTo(x, y, x + w, y, r); };

/* ---------- Koniec skanu ---------- */
function kopia(zrodlo, W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(zrodlo, 0, 0, W, H); return c; }
function zakoncz(zrodlo, W, H) {
  stan.zdjecie = kopia(zrodlo, W, H); stan.lmWynik = stan.lm.map(p => p.slice());
  stan.wynik = stan.an.wynik(); stan.nakladka = kopia(stan.an.malujNakladke(1), CW, CH);
  stan.geo = geometria(stan.swiat || stan.lm);
  stan.rekaInfo = strona(stan.lm, stan.etykieta);
  /* Ta sama dłoń skanowana ponownie nie zmienia skali porównawczej. */
  const znana = stan.ostatnieKody.some(k => naSkali(zgodnosc(stan.wynik.kod, k)) >= PROG_ZGODNOSCI);
  stan.ostatnieKody.push(stan.wynik.kod); if (stan.ostatnieKody.length > 8) stan.ostatnieKody.shift();
  stan.odczyt = zbudujOdczyt(stan.wynik, stan.geo, stan.rekaInfo.reka, { ucz: !znana });
  stan.skrot = skrot(stan.wynik.kod); stan.pieczec = pieczec(stan.wynik.kod);
  tryb('wynik'); stan.zak = 'wrozba'; pokazWynik();
  const start = performance.now();
  (function anim(t) { const f = (t - start) / 2200; if (stan.tryb !== 'wynik') return; rysujWynik(Math.min(1, f)); if (f < 1) requestAnimationFrame(anim); })(start);
  if (matchMedia('(max-width:980px)').matches) setTimeout(() => $('panel').scrollIntoView({ behavior: 'smooth', block: 'start' }), 2400);
}

/* ---------- Pieczęć tożsamości: kod orientacji narysowany jako rozeta ---------- */
function pieczec(kod) {
  const R = 380, c = document.createElement('canvas'); c.width = c.height = R; const g = c.getContext('2d'), s = R / 2;
  g.fillStyle = '#0a0d1c'; g.fillRect(0, 0, R, R);
  const tlo = g.createRadialGradient(s, s, 10, s, s, s); tlo.addColorStop(0, 'rgba(242,198,109,.22)'); tlo.addColorStop(1, 'rgba(242,198,109,0)'); g.fillStyle = tlo; g.fillRect(0, 0, R, R);
  g.lineCap = 'round';
  for (let r = 0; r < kod.wie; r++) for (let k = 0; k < kod.kol; k++) {
    const i = r * kod.kol + k, w = kod.waga[i] / 15, rad = 34 + r * 9.4, kat = (k + (r % 2) * 0.5) / kod.kol * Math.PI * 2;
    const x = s + rad * Math.cos(kat), y = s + rad * Math.sin(kat), a = kat + Math.PI / 2 + kod.kier[i] / 16 * Math.PI, d = 3 + 4.2 * w;
    g.strokeStyle = `hsla(${28 + Math.abs(kod.kier[i] - 8) * 4},90%,${58 + 22 * w}%,${0.14 + 0.86 * w})`; g.lineWidth = 1 + 2 * w;
    g.beginPath(); g.moveTo(x - d * Math.cos(a), y - d * Math.sin(a)); g.lineTo(x + d * Math.cos(a), y + d * Math.sin(a)); g.stroke();
  }
  g.strokeStyle = 'rgba(242,198,109,.7)'; g.lineWidth = 1.2; [22, s - 6].forEach(r => { g.beginPath(); g.arc(s, s, r, 0, 6.3); g.stroke(); });
  return c.toDataURL('image/png');
}

/* ---------- Pamięć dłoni (tylko w tej przeglądarce) ---------- */
const KLUCZ = 'dlon.profile.v1';
function profile() { try { return JSON.parse(localStorage.getItem(KLUCZ)) || []; } catch (e) { return []; } }
function zapiszProfile(p) { try { localStorage.setItem(KLUCZ, JSON.stringify(p)); return true; } catch (e) { return false; } }
const naSkali = z => ogr((z - 0.5) * 2, 0, 1);
function porownania() { return profile().map((p, i) => ({ i, imie: p.imie, z: naSkali(zgodnosc(stan.wynik.kod, p.kod)) })).sort((a, b) => b.z - a.z); }

/* ---------- Zakładki odczytu ---------- */
const ZAKLADKI = [['wrozba', 'Wróżba'], ['serce', 'Serce', KOLORY.serce], ['glowa', 'Głowa', KOLORY.glowa], ['zycie', 'Życie', KOLORY.zycie], ['los', 'Los', KOLORY.los], ['dlon', 'Kształt dłoni'], ['tozsamosc', 'Tożsamość'], ['zrodla', 'Źródła']];
const tabela = w => '<table class="pomiary">' + w.map(([a, b]) => `<tr><td>${h(a)}</td><td>${h(b)}</td></tr>`).join('') + '</table>';
const miara = (x, kolor) => `<div class="miara"><i style="width:${proc(ogr(x, 0, 1))};background:${kolor}"></i></div>`;

function trescZakladki(z) {
  const o = stan.odczyt, g = stan.geo, c = o.cechy;
  if (z === 'wrozba') return `<p class="wstep">${h(o.zywiol.opis)}</p><p><strong>${h(o.dominanta[0])}.</strong> ${h(o.dominanta[1])}</p>`
    + (o.znaki.length ? '<h3>Co wyróżnia tę dłoń</h3><div class="znaki">' + o.znaki.map(([a, b], i) => `<div class="znak"><span>${i + 1}</span><div><strong>${h(a.charAt(0).toUpperCase() + a.slice(1))}</strong><p>${h(b)}</p></div></div>`).join('') + '</div><h3>Wróżba</h3>' : '')
    + '<div class="wrozby">' + o.przepowiednia.map(([a, b]) => `<div class="wrozba"><strong>${h(a)}</strong><p>${h(b)}</p></div>`).join('') + '</div>'
    + `<h3>Rada z dłoni</h3><p>${h(o.rada)}</p>`
    + '<div class="zetony">' + o.szczescie.map(([a, b]) => `<span class="zeton"><small>${h(a)}</small>${h(b)}</span>`).join('') + '</div>'
    + (c.czytelnosc < 0.45 ? '<p class="drobne">Linie były słabo widoczne (czytelność ' + proc(c.czytelnosc) + '). Dla pewniejszego odczytu powtórz skan w mocniejszym, bocznym świetle i przybliż dłoń.</p>' : '')
    + '<p class="drobne">To symboliczna zabawa według tradycji chiromancji, nie prognoza ani porada.</p>';
  if (NAZWY[z]) { const l = o.linie[z], cz = c[z];
    return `<div class="linia-glowa"><i style="background:${KOLORY[z]}"></i><div><h3>${NAZWY[z]}</h3><span>${h(l.skrot)}</span></div></div>`
      + `<h3>Co zmierzyła kamera</h3>` + (l.pomiary.length ? tabela(l.pomiary) : '<p class="drobne">Brak wyraźnej bruzdy w miejscu, w którym zwykle biegnie ta linia.</p>')
      + (cz.jest ? `<p class="drobne">Wyrazistość bruzdy</p>${miara(cz.moc / 1.8, KOLORY[z])}<p class="drobne" style="margin-top:10px">Widoczna długość</p>${miara(cz.dl, KOLORY[z])}` : '')
      + `<h3>Co mówi tradycja</h3><p>${h(l.tekst)}</p><div class="wrozba" style="border-left-color:${KOLORY[z]}"><strong style="color:${KOLORY[z]}">Wróżba z tej linii</strong><p>${h(l.wrozba)}</p></div>`;
  }
  if (z === 'dlon') return `<div class="linia-glowa"><div><h3>${h(o.tytul)}</h3><span>${h(o.zywiol.ksztalt)}</span></div></div><p>${h(o.zywiol.opis)}</p><p>${h(o.zywiol.cien)}</p>`
    + (o.reka ? `<p>${h(o.reka)}</p>` : '')
    + '<h3>Pomiary</h3>' + tabela([['Długość do szerokości dłoni', g.ksztalt.toFixed(2).replace('.', ',')], ['Palec środkowy do długości dłoni', g.palceDoDloni.toFixed(2).replace('.', ',')], ['Wskazujący do serdecznego (2D:4D)', g.wskDoSerd.toFixed(2).replace('.', ',')], ['Mały do serdecznego', g.malyDoSerd.toFixed(2).replace('.', ',')], ['Odstawienie kciuka', Math.round(g.katKciuka) + '°']])
    + '<h3>Palce</h3>' + o.palce.map(a => `<p>${h(a)}</p>`).join('')
    + (o.czworobok ? `<h3>Czworobok – przestrzeń między linią serca a głowy</h3><p>${h(o.czworobok[1])} <span class="drobne">(odstęp: ${h(o.czworobok[0])})</span></p>` : '')
    + `<h3>${h(o.strefa[0])}</h3><p>${h(o.strefa[1])}</p>`
    + '<p class="drobne">Proporcje liczymy z 21 punktów szkieletu dłoni. Rozstaw palców i kciuka zależy od tego, jak trzymasz dłoń przed kamerą.</p>';
  if (z === 'tozsamosc') { const por = porownania(), naj = por[0], tak = naj && naj.z >= PROG_ZGODNOSCI;
    return `<div class="tozs"><img src="${stan.pieczec}" alt="Pieczęć dłoni – graficzny zapis kierunków bruzd"><div><p class="mono zloto">Sygnatura dłoni</p><p class="kod">${stan.skrot.tekst}</p><p class="drobne">Pieczęć to zapis kierunku bruzd w 224 polach dłoni. Każda dłoń daje inny rysunek – na tej zasadzie działa biometria dłoni.</p></div></div>`
      + tabela([['Gęstość rysunku linii', proc(stan.wynik.gestosc)], ['Pola z wyraźnym kierunkiem', stan.wynik.kod.waga.filter(w => w >= 4).length + ' z 224'], ['Czytelność linii głównych', proc(c.czytelnosc)], ['Dłoń', stan.rekaInfo.reka || 'nie ustalono']])
      + (por.length ? `<div class="werdykt ${tak ? 'tak' : ''}">${tak ? `<strong>Rozpoznano: ${h(naj.imie)}</strong> – zgodność ${proc(naj.z)}.` : `<strong>Nie rozpoznano tej dłoni.</strong> Najbliżej: ${h(naj.imie)} (${proc(naj.z)}).`}</div>` : '')
      + '<h3>Zapamiętaj tę dłoń</h3><p class="drobne">Podaj imię, a przy następnym skanie system sprawdzi, czy to ta sama dłoń. Zapis zostaje tylko w tej przeglądarce.</p>'
      + '<div class="zapis"><input type="text" id="fImie" maxlength="30" placeholder="np. Ania" autocomplete="off"><button type="button" class="btn-maly zl" id="btnZapisz">Zapamiętaj</button></div>'
      + (por.length ? '<ul class="profile">' + por.map(p => `<li><div><strong>${h(p.imie)}</strong>${miara(p.z, p.z >= PROG_ZGODNOSCI ? '#6ee7a0' : '#5cc8ff')}</div><span>${proc(p.z)}</span><button type="button" class="link" data-usun="${p.i}">usuń</button></li>`).join('') + '</ul>' : '')
      + '<p class="drobne">Uwaga: to pokaz zasady, nie narzędzie identyfikacji. Kryminalistyka pracuje na odbitkach w rozdzielczości co najmniej 500 dpi, w których widać listewki skórne; kamera widzi tylko główne bruzdy, a wynik zależy od światła i ułożenia dłoni.</p>';
  }
  return trescZrodel();
}
function trescZrodel() {
  return `<p>${h(ZRODLA.wstep)}</p><h3>Co mówi nauka</h3>` + ZRODLA.nauka.map(([a, b, c]) => `<p><strong>${h(a)}.</strong> ${h(b)}</p><p class="zrodlo">${h(c)}</p>`).join('')
    + '<h3>Skąd pochodzą znaczenia symboliczne</h3>' + ZRODLA.tradycja.map(([a, b]) => `<p><strong>${h(a)}.</strong></p><p class="zrodlo">${h(b)}</p>`).join('');
}
function pokazWynik() {
  $('instrukcja').hidden = true; $('wynik').hidden = false;
  $('wynikTytul').textContent = stan.odczyt.tytul;
  $('zakladki').innerHTML = ZAKLADKI.map(([id, n, k]) => `<button type="button" role="tab" data-zak="${id}" aria-selected="${id === stan.zak}">${k ? `<i style="background:${k}"></i>` : ''}${n}</button>`).join('');
  $('zakTresc').innerHTML = trescZakladki(stan.zak);
}
$('zakladki').addEventListener('click', e => { const b = e.target.closest('[data-zak]'); if (!b) return; stan.zak = b.dataset.zak; pokazWynik(); });
$('zakTresc').addEventListener('click', e => {
  if (e.target.id === 'btnZapisz') { const imie = $('fImie').value.trim(); if (!imie) { $('fImie').focus(); return; }
    const p = profile(); p.push({ imie, kod: stan.wynik.kod, data: new Date().toISOString().slice(0, 10) }); if (!zapiszProfile(p.slice(-20))) alert('Przeglądarka nie pozwoliła zapisać danych.'); pokazWynik(); }
  const u = e.target.closest('[data-usun]'); if (u) { const p = profile(); p.splice(+u.dataset.usun, 1); zapiszProfile(p); pokazWynik(); }
});

/* ---------- Zdjęcie z pliku ---------- */
$('fPlik').addEventListener('change', async e => {
  const plik = e.target.files[0]; e.target.value = ''; if (!plik) return;
  const tekst = $('start').querySelector('.start-tekst'); tekst.textContent = 'Wczytuję model i szukam dłoni na zdjęciu…';
  try {
    const obraz = await createImageBitmap(plik, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(plik));
    const sk = Math.min(1, 1600 / Math.max(obraz.width, obraz.height)), W = Math.round(obraz.width * sk), H = Math.round(obraz.height * sk);
    const pl = kopia(obraz, W, H);
    await wczytajModel();
    let w = null, glos = 0;
    for (let i = 0; i < 4; i++) { w = stan.det.detectForVideo(pl, performance.now() + i * 40); if (w && w.landmarks && w.landmarks[0]) { const rk = odczytajReke(w); glos += (strona(w.landmarks[0].map(p => [p.x * W, p.y * H]), rk.etykieta).wnetrze ? 1 : -1) * rk.pewnosc; } }
    const pkt = w && w.landmarks && w.landmarks[0];
    if (!pkt) { tekst.innerHTML = 'Nie widzę dłoni na tym zdjęciu.<br>Wybierz zdjęcie otwartej dłoni, wnętrzem do obiektywu.'; return; }
    if (glos <= 0 && !stan.bezStrony) { tekst.innerHTML = 'To wygląda na grzbiet dłoni.<br>Do odczytu potrzebne jest zdjęcie wnętrza dłoni – tam są linie.'; return; }
    zatrzymajStrumien();
    stan.lustro = false; stan.lm = pkt.map(p => [p.x * W, p.y * H]);
    stan.etykieta = odczytajReke(w).etykieta;
    stan.swiat = w.worldLandmarks && w.worldLandmarks[0] ? w.worldLandmarks[0].map(p => [p.x, p.y, p.z]) : null;
    stan.an.reset(); stan.an.klatka(pl, stan.lm, 1);
    zakoncz(pl, W, H);
  } catch (err) { tekst.innerHTML = 'Nie udało się odczytać tego pliku.<br>Spróbuj z innym zdjęciem (JPG lub PNG).'; }
});

/* ---------- Raport PDF ---------- */
function wczytajSkrypt(src) { return new Promise((ok, zle) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = zle; document.head.appendChild(s); }); }
let bibPdf = null;
function zbudujRaport() {
  const o = stan.odczyt, g = stan.geo, c = o.cechy, data = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const glowa = t => `<div class="r-glowa"><div><p>Czytanie z dłoni · raport</p><h1>${h(t)}</h1></div><p>${data} · sygnatura ${stan.skrot.tekst}</p></div>`;
  const stopka = n => `<div class="r-stopka"><span>Symboliczny odczyt rozrywkowy – nie jest poradą ani narzędziem identyfikacji</span><span>© 2026 Wojciech Wieczorek i Anna Mikos · strona ${n} z 3</span></div>`;
  const tab = w => '<table>' + w.map(([a, b]) => `<tr><td>${h(a)}</td><td>${h(b)}</td></tr>`).join('') + '</table>';
  const s1 = `<div class="r-strona">${glowa(o.tytul)}<div class="r-top"><div class="r-obraz"><img src="${ekran.toDataURL('image/jpeg', 0.9)}" alt=""></div><div><p>${h(o.zywiol.opis)}</p><p><strong>${h(o.dominanta[0])}.</strong> ${h(o.dominanta[1])}</p>${o.reka ? `<p class="r-male">${h(o.reka)}</p>` : ''}</div></div>`
    + '<h2>Wróżba</h2>' + o.przepowiednia.map(([a, b]) => `<div class="r-ramka"><strong>${h(a)}</strong>${h(b)}</div>`).join('')
    + `<div class="r-ramka"><strong>Rada z dłoni</strong>${h(o.rada)}</div>` + `<p class="r-male" style="margin-top:10px">${o.szczescie.map(x => `<strong>${h(x[0])}:</strong> ${h(x[1])}`).join(' &nbsp;·&nbsp; ')}</p>` + stopka(1) + '</div>';
  const s2 = `<div class="r-strona">${glowa('Analiza linii')}` + ['serce', 'glowa', 'zycie', 'los'].map(k => { const l = o.linie[k];
    return `<h2><span class="r-kreska" style="background:${KOLORY[k]}"></span>${NAZWY[k]} – ${h(l.skrot)}</h2><div class="r-linia"><div><p>${h(l.tekst)}</p><p><strong>Wróżba:</strong> ${h(l.wrozba)}</p></div><div>${l.pomiary.length ? tab(l.pomiary) : '<p class="r-male">Linia słabo widoczna na obrazie.</p>'}</div></div>`; }).join('') + stopka(2) + '</div>';
  const s3 = `<div class="r-strona">${glowa('Kształt dłoni i tożsamość')}<h2>${h(o.tytul)}</h2><p>${h(o.zywiol.ksztalt.charAt(0).toUpperCase() + o.zywiol.ksztalt.slice(1))}. ${h(o.zywiol.cien)}</p>`
    + tab([['Długość do szerokości dłoni', g.ksztalt.toFixed(2).replace('.', ',')], ['Palec środkowy do długości dłoni', g.palceDoDloni.toFixed(2).replace('.', ',')], ['Wskazujący do serdecznego (2D:4D)', g.wskDoSerd.toFixed(2).replace('.', ',')]])
    + o.palce.map(a => `<p>${h(a)}</p>`).join('') + (o.czworobok ? `<p><strong>Czworobok:</strong> ${h(o.czworobok[1])}</p>` : '') + `<p><strong>${h(o.strefa[0])}:</strong> ${h(o.strefa[1])}</p>`
    + (o.znaki.length ? '<h2>Co wyróżnia tę dłoń</h2>' + o.znaki.map(([a, b]) => `<p><strong>${h(a.charAt(0).toUpperCase() + a.slice(1))}.</strong> ${h(b)}</p>`).join('') : '')
    + `<h2>Sygnatura dłoni</h2><div class="r-tozs"><img src="${stan.pieczec}" alt=""><div><p class="r-kod">${stan.skrot.tekst}</p>` + tab([['Gęstość rysunku linii', proc(stan.wynik.gestosc)], ['Pola z wyraźnym kierunkiem', stan.wynik.kod.waga.filter(w => w >= 4).length + ' z 224'], ['Czytelność linii głównych', proc(c.czytelnosc)]]) + `<p class="r-male">${h(METODY[1][1])}</p></div></div>`
    + '<h2>Źródła</h2>' + `<p class="r-male">${h(ZRODLA.wstep)}</p>` + ZRODLA.nauka.map(([a, , z]) => `<p class="r-male"><strong>${h(a)}:</strong> ${h(z)}</p>`).join('') + ZRODLA.tradycja.map(([a, z]) => `<p class="r-male"><strong>${h(a)}:</strong> ${h(z)}</p>`).join('') + stopka(3) + '</div>';
  $('raport').innerHTML = s1 + s2 + s3;
}
$('btnPdf').addEventListener('click', async () => {
  const b = $('btnPdf'); b.disabled = true; b.textContent = 'Przygotowuję…';
  try {
    if (!bibPdf) bibPdf = Promise.all([wczytajSkrypt('../skan/vendor/jspdf.umd.min.js'), wczytajSkrypt('../skan/vendor/html2canvas.min.js')]);
    await bibPdf; rysujWynik(1); zbudujRaport();
    await Promise.all(Array.from($('raport').querySelectorAll('img')).map(i => i.decode ? i.decode().catch(() => { }) : null));
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true }), strony = $('raport').querySelectorAll('.r-strona');
    for (let i = 0; i < strony.length; i++) {
      const pl = await window.html2canvas(strony[i], { scale: 2, backgroundColor: '#ffffff', logging: false });
      if (i) doc.addPage(); doc.addImage(pl.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297);
    }
    doc.save('odczyt-dloni-' + stan.skrot.tekst + '.pdf');
  } catch (e) { bibPdf = null; alert('Nie udało się przygotować raportu PDF. Spróbuj ponownie.'); }
  $('raport').innerHTML = ''; b.disabled = false; b.textContent = '⤓ Raport PDF';
});

/* ---------- Przyciski ---------- */
$('btnStart').addEventListener('click', uruchomKamere);
$('btnCzytaj').addEventListener('click', () => { if (!stan.lm || stan.tryb !== 'live') { komunikat('Najpierw pokaż dłoń do kamery'); return; } const u = ocen(stan.lm, wideo.videoWidth, wideo.videoHeight); if (u) komunikat(u); else zacznijSkan(performance.now()); });
$('btnKamera').addEventListener('click', async () => { stan.przod = !stan.przod; stan.lm = null; stan.an.reset(); try { await otworzStrumien(); } catch (e) { stan.przod = !stan.przod; } });
$('btnStop').addEventListener('click', () => {
  /* Wyłącza kamerę (gaśnie też dioda). Gotowy odczyt zostaje na ekranie. */
  zatrzymajStrumien(); stan.lm = null; stan.an.reset(); stan.spokojOd = 0; stan.glos = 0;
  if (stan.tryb === 'wynik') { tryb('wynik'); return; }
  $('start').querySelector('.start-tekst').innerHTML = 'Kamera zatrzymana.<br>Możesz ją uruchomić ponownie w każdej chwili.';
  tryb('start');
});
$('btnNastepna').addEventListener('click', async () => {
  stan.lm = null; stan.an.reset(); stan.spokojOd = 0; stan.odczyt = null; stan.glos = 0;
  if (stan.strumien && stan.strumien.active) { tryb('live'); komunikat('Pokaż wnętrze dłoni do kamery'); } else { tryb('start'); uruchomKamere(); }
});
$('btnPelny').addEventListener('click', () => { const d = document; if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => { }); });
$('btnZrodla').addEventListener('click', () => { $('zrodlaTresc').innerHTML = METODY.map(([a, b]) => `<h3>${h(a)}</h3><p>${h(b)}</p>`).join('') + '<h3>Źródła</h3>' + trescZrodel(); $('zrodla').showModal(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && stan.strumien && wideo.paused) wideo.play().catch(() => { }); });

tryb('start'); requestAnimationFrame(petla);
window.__dlon = stan;
