/* © 2026 Wojciech Wieczorek. Wszelkie prawa zastrzeżone. */
/* Silnik obliczeń: numerologia, mapa nieba, karty, geometria portretu, synteza. Bez dostępu do DOM. */
(function (S) {
  'use strict';

  var RAD = Math.PI / 180;
  function mod(a, n) { return ((a % n) + n) % n; }
  S.pl = function (x, d) { return x.toFixed(d).replace('.', ','); };

  /* =================== NUMEROLOGIA =================== */
  function sumaCyfr(n) { var s = 0; String(n).split('').forEach(function (c) { s += +c; }); return s; }
  /* Redukcja do jednej cyfry z zachowaniem 11, 22, 33. Zwraca kolejne kroki. */
  function redukuj(n) {
    var kroki = [n];
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) { n = sumaCyfr(n); kroki.push(n); }
    return { w: n, kroki: kroki, lancuch: kroki.join(' → ') };
  }
  S.redukuj = redukuj;

  function normalizuj(tekst) {
    return tekst.toUpperCase().split('').map(function (z) { return S.POLSKIE[z] || z; }).join('');
  }
  function slowa(tekst) {
    return normalizuj(tekst).split(/[^A-Z]+/).filter(Boolean);
  }
  /* Suma liter każdego słowa osobno, redukcja, potem suma zredukowanych części. */
  function liczZeSlow(lista, filtr) {
    var czesci = [];
    lista.forEach(function (sl) {
      var lit = sl.split('').filter(filtr);
      if (!lit.length) return;
      var suma = lit.reduce(function (a, l) { return a + S.LITERY_PIT[l]; }, 0);
      czesci.push({ litery: lit.join(''), suma: suma, red: redukuj(suma) });
    });
    if (!czesci.length) return null;
    var razem = czesci.reduce(function (a, c) { return a + c.red.w; }, 0);
    var kon = redukuj(razem);
    var opis = czesci.map(function (c) { return c.litery + ' ' + c.red.lancuch; }).join(' · ');
    if (czesci.length > 1) opis += '; ' + czesci.map(function (c) { return c.red.w; }).join(' + ') + ' = ' + kon.lancuch;
    return { w: kon.w, opis: opis };
  }

  S.numerologia = function (imie, data, pseudonim) {
    var sl = slowa(imie);
    var wszystkie = function () { return true; };
    var sam = function (l) { return S.SAMOGLOSKI.indexOf(l) >= 0; };
    var spol = function (l) { return S.SAMOGLOSKI.indexOf(l) < 0; };
    var wyn = { litery: sl.map(function (s) { return s.split('').map(function (l) { return l + '·' + S.LITERY_PIT[l]; }).join(' '); }).join(' / ') };
    wyn.ekspresja = liczZeSlow(sl, wszystkie);
    wyn.serce = liczZeSlow(sl, sam);
    wyn.wizerunek = liczZeSlow(sl, spol);
    if (wyn.serce) wyn.serce.opis = 'Samogłoski: ' + wyn.serce.opis;
    if (wyn.wizerunek) wyn.wizerunek.opis = 'Spółgłoski: ' + wyn.wizerunek.opis;
    if (pseudonim && slowa(pseudonim).length) wyn.pseudonim = liczZeSlow(slowa(pseudonim), wszystkie);
    if (data) {
      var m = redukuj(data.m), d = redukuj(data.d), r = redukuj(data.r);
      var suma = m.w + d.w + r.w, k = redukuj(suma);
      wyn.droga = { w: k.w, opis: 'Miesiąc ' + m.lancuch + ' · dzień ' + d.lancuch + ' · rok ' + r.lancuch + '; ' + m.w + ' + ' + d.w + ' + ' + r.w + ' = ' + k.lancuch };
      wyn.dzien = { w: d.w, surowy: data.d, opis: d.lancuch };
    }
    return wyn;
  };

  /* =================== NIEBO =================== */
  function offsetStrefy(utcMs, strefa) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: strefa, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    var p = {}; f.formatToParts(new Date(utcMs)).forEach(function (x) { p[x.type] = +x.value; });
    var jakUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    if (p.year < 100) { var d = new Date(jakUtc); d.setUTCFullYear(p.year); jakUtc = d.getTime(); }
    return jakUtc - utcMs;
  }
  /* Czas lokalny w strefie → chwila UTC (z historycznymi zmianami czasu z bazy przeglądarki). */
  S.lokalnyNaUtc = function (r, m, d, g, min, strefa) {
    var zgad = Date.UTC(r, m - 1, d, g, min);
    if (r < 100) { var x = new Date(zgad); x.setUTCFullYear(r); zgad = x.getTime(); }
    var utc = zgad - offsetStrefy(zgad, strefa);
    utc = zgad - offsetStrefy(utc, strefa);
    return new Date(utc);
  };

  function dlugosci(data) {
    var A = window.Astronomy, wyn = {};
    S.CIALA.forEach(function (c) {
      wyn[c.id] = A.Ecliptic(A.GeoVector(c.id, data, true)).elon;
    });
    return wyn;
  }
  function stulecia(data) { return (data.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525; }
  function wezel(data) { var T = stulecia(data); return mod(125.04452 - 1934.136261 * T + 0.0020708 * T * T, 360); }
  /* Ascendent i MC (Meeus, „Astronomical Algorithms”): RAMC = lokalny czas gwiazdowy. */
  function osie(data, szer, dl) {
    var T = stulecia(data);
    var eps = (23.439291 - 0.0130042 * T) * RAD;
    var ramc = mod(window.Astronomy.SiderealTime(data) * 15 + dl, 360) * RAD;
    var fi = szer * RAD;
    var asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(fi) * Math.sin(eps))) / RAD;
    var mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / RAD;
    return { asc: mod(asc, 360), mc: mod(mc, 360) };
  }
  S._osie = osie;
  function znakIdx(lon) { return Math.floor(mod(lon, 360) / 30); }
  function odl(a, b) { var d = Math.abs(mod(a - b, 360)); return d > 180 ? 360 - d : d; }

  /* dane: {r,m,d, godz:'HH:MM'|'' , szer, dl, strefa} */
  S.niebo = function (dane) {
    if (!window.Astronomy || !dane || !dane.r) return null;
    var strefa = dane.strefa || 'Europe/Warsaw', maCzas = !!dane.godz, chwile, glowna;
    if (maCzas) {
      var hm = dane.godz.split(':');
      glowna = S.lokalnyNaUtc(dane.r, dane.m, dane.d, +hm[0], +hm[1], strefa);
      chwile = [glowna];
    } else {
      glowna = S.lokalnyNaUtc(dane.r, dane.m, dane.d, 12, 0, strefa);
      chwile = [S.lokalnyNaUtc(dane.r, dane.m, dane.d, 0, 0, strefa), glowna, S.lokalnyNaUtc(dane.r, dane.m, dane.d, 23, 59, strefa)];
    }
    var poz = chwile.map(dlugosci);
    var gl = maCzas ? poz[0] : poz[1];
    var jutro = dlugosci(new Date(glowna.getTime() + 86400000));
    var ciala = S.CIALA.map(function (c) {
      var lon = gl[c.id], warianty = [];
      poz.forEach(function (p) { var z = znakIdx(p[c.id]); if (warianty.indexOf(z) < 0) warianty.push(z); });
      var ruch = mod(jutro[c.id] - lon + 180, 360) - 180;
      return { c: c, lon: lon, znak: znakIdx(lon), st: mod(lon, 30), warianty: warianty, wstecz: ruch < 0 && c.id !== 'Sun' && c.id !== 'Moon' };
    });
    var wyn = { ciala: ciala, maCzas: maCzas, chwila: glowna, wezel: wezel(glowna) };
    if (maCzas && isFinite(dane.szer) && isFinite(dane.dl)) {
      var o = osie(glowna, dane.szer, dane.dl);
      wyn.asc = o.asc; wyn.mc = o.mc;
      ciala.forEach(function (x) { x.dom = mod(znakIdx(x.lon) - znakIdx(o.asc), 12) + 1; });
    }
    /* Aspekty między siedmioma klasycznymi ciałami; bez godziny tylko te, które mieszczą się w orbie przez cały dzień. */
    var klas = ciala.filter(function (x) { return !x.c.pok; });
    wyn.aspekty = [];
    for (var i = 0; i < klas.length; i++) for (var j = i + 1; j < klas.length; j++) {
      var a = klas[i].c, b = klas[j].c;
      S.ASPEKTY.forEach(function (asp) {
        var orb = asp.orb + ((a.id === 'Sun' || a.id === 'Moon' || b.id === 'Sun' || b.id === 'Moon') ? 1 : 0);
        var odch = poz.map(function (p) { return Math.abs(odl(p[a.id], p[b.id]) - asp.kat); });
        var glOdch = maCzas ? odch[0] : odch[1];
        if (Math.max.apply(null, odch) <= orb) wyn.aspekty.push({ a: a, b: b, asp: asp, orb: glOdch });
      });
    }
    wyn.aspekty.sort(function (x, y) { return x.orb - y.orb; });
    /* Bilans żywiołów */
    wyn.zywioly = { 'ogień': 0, 'ziemia': 0, 'powietrze': 0, 'woda': 0 };
    ciala.forEach(function (x) { if (x.warianty.length === 1) wyn.zywioly[S.ZNAKI[x.znak].e]++; });
    return wyn;
  };

  S.tekstCiala = function (c, znak) {
    return c.szab.replace(/\{(\w+)\}/g, function (_, k) { return znak[k]; });
  };

  /* =================== KARTY =================== */
  S.karta = function (id) { for (var i = 0; i < S.KARTY.length; i++) if (S.KARTY[i].id === id) return S.KARTY[i]; return null; };
  S.kartyUklad = function (wybor) {
    var uklad = [];
    S.POZYCJE.forEach(function (p, i) {
      var w = wybor[i]; if (!w || !w.id) return;
      var k = S.karta(w.id); if (!k) return;
      var zn = w.odw ? k.rev : k.up;
      uklad.push({ poz: p, k: k, odw: !!w.odw, znaczenie: zn, odczyt: p.szab.replace('{x}', zn) });
    });
    var watki = [];
    var wielkie = uklad.filter(function (u) { return u.k.wielka; });
    if (wielkie.length >= 2) watki.push(wielkie.map(function (u) { return u.k.n; }).join(' + ') + '. Powtórzenie Wielkich Arkanów kieruje rozmowę na duże, życiowe tematy, a nie na codzienne sceny.');
    var kol = {}, ran = {}, mot = {};
    uklad.forEach(function (u) {
      if (u.k.kolor) (kol[u.k.kolor] = kol[u.k.kolor] || []).push(u);
      if (u.k.ranga) (ran[u.k.ranga] = ran[u.k.ranga] || []).push(u);
      (mot[u.k.m] = mot[u.k.m] || []).push(u);
    });
    Object.keys(kol).forEach(function (k) { if (kol[k].length >= 2) watki.push(kol[k].map(function (u) { return u.k.n; }).join(' + ') + '. Powtórzony kolor ' + k + ' podkreśla sferę: ' + kol[k][0].k.dziedzina + '.'); });
    Object.keys(ran).forEach(function (k) { if (ran[k].length >= 2) watki.push(ran[k].map(function (u) { return u.k.n; }).join(' + ') + '. Ta sama ranga w różnych kolorach: ten sam etap przeżywany w kilku sferach życia.'); });
    Object.keys(mot).forEach(function (k) { if (mot[k].length >= 2) watki.push(mot[k].map(function (u) { return u.k.n; }).join(' + ') + '. Obie karty prowadzą do motywu: ' + S.MOTYWY[k].n + '.'); });
    var odw = uklad.filter(function (u) { return u.odw; });
    if (odw.length >= 2) watki.push('Odwrócone: ' + odw.map(function (u) { return u.k.n; }).join(' + ') + '. Kilka odwróconych kart sugeruje, że energia jest zatrzymana albo skierowana do wewnątrz.');
    var pytanie = '';
    if (uklad.length === 3) pytanie = 'Co łączy obraz pierwszej karty (' + uklad[0].k.n + ') z motywacją drugiej (' + uklad[1].k.n + '), kiedy na trzeciej pojawia się ' + uklad[2].k.n + '?';
    return { uklad: uklad, watki: watki, pytanie: pytanie };
  };

  /* =================== PORTRET =================== */
  S.GRUPY = [
    { id: 'oczy', n: 'oczy' }, { id: 'brwi', n: 'brwi' }, { id: 'nos', n: 'nos' }, { id: 'usta', n: 'usta' }, { id: 'obrys', n: 'obrys twarzy' }
  ];
  /* „Po lewej / po prawej” oznacza stronę kadru, nie osoby na zdjęciu. lm: jak wyznaczyć punkt z 68 punktów modelu. */
  S.PUNKTY = [
    { id: 'zrL', g: 'oczy', n: 'źrenica po lewej stronie kadru', lm: [36, 37, 38, 39, 40, 41] },
    { id: 'zrP', g: 'oczy', n: 'źrenica po prawej stronie kadru', lm: [42, 43, 44, 45, 46, 47] },
    { id: 'okZL', g: 'oczy', n: 'zewnętrzny kącik oka po lewej', lm: [36] },
    { id: 'okWL', g: 'oczy', n: 'wewnętrzny kącik oka po lewej', lm: [39] },
    { id: 'okWP', g: 'oczy', n: 'wewnętrzny kącik oka po prawej', lm: [42] },
    { id: 'okZP', g: 'oczy', n: 'zewnętrzny kącik oka po prawej', lm: [45] },
    { id: 'brL', g: 'brwi', n: 'dolny brzeg brwi nad źrenicą po lewej', lm: [19] },
    { id: 'brP', g: 'brwi', n: 'dolny brzeg brwi nad źrenicą po prawej', lm: [24] },
    { id: 'nosN', g: 'nos', n: 'nasada nosa między oczami', lm: [27] },
    { id: 'nosC', g: 'nos', n: 'czubek nosa', lm: [30] },
    { id: 'nosL', g: 'nos', n: 'skrzydełko nosa po lewej', lm: [31] },
    { id: 'nosP', g: 'nos', n: 'skrzydełko nosa po prawej', lm: [35] },
    { id: 'ustL', g: 'usta', n: 'kącik ust po lewej', lm: [48] },
    { id: 'ustP', g: 'usta', n: 'kącik ust po prawej', lm: [54] },
    { id: 'ustG', g: 'usta', n: 'górna krawędź górnej wargi (środek)', lm: [51] },
    { id: 'ustS', g: 'usta', n: 'styk warg (środek)', lm: [62, 66] },
    { id: 'ustD', g: 'usta', n: 'dolna krawędź dolnej wargi (środek)', lm: [57] },
    { id: 'polL', g: 'obrys', n: 'krawędź twarzy na wysokości policzka po lewej', lm: [1] },
    { id: 'polP', g: 'obrys', n: 'krawędź twarzy na wysokości policzka po prawej', lm: [15] },
    { id: 'zuL', g: 'obrys', n: 'kąt żuchwy po lewej', lm: [4] },
    { id: 'zuP', g: 'obrys', n: 'kąt żuchwy po prawej', lm: [12] },
    { id: 'broda', g: 'obrys', n: 'dolna krawędź brody', lm: [8] }
  ];
  S.punktyZModelu = function (poz, szer, wys) {
    var wyn = {};
    S.PUNKTY.forEach(function (p) {
      var x = 0, y = 0;
      p.lm.forEach(function (i) { x += poz[i].x; y += poz[i].y; });
      wyn[p.id] = { x: x / p.lm.length / szer, y: y / p.lm.length / wys, src: 'model' };
    });
    return wyn;
  };

  var FI = (1 + Math.sqrt(5)) / 2;
  /* a, b: odcinki (pary punktów; „*X+Y” = środek między X i Y); wzorzec dla ilorazu a/b */
  S.PROPORCJE = [
    { id: 'ustaNos', gr: 'Usta', n: 'Szerokość ust / szerokość nosa', a: ['ustL', 'ustP'], b: ['nosL', 'nosP'], wz: FI },
    { id: 'warga', gr: 'Usta', n: 'Udział górnej wargi w wysokości obu warg', a: ['ustG', 'ustS'], b: ['ustG', 'ustD'], wz: 1 - 1 / FI },
    { id: 'nosDl', gr: 'Nos', n: 'Od środka między źrenicami do czubka nosa / rozstaw źrenic', a: ['*zrL+zrP', 'nosC'], b: ['zrL', 'zrP'], wz: 1 / FI },
    { id: 'nosSz', gr: 'Nos', n: 'Szerokość nosa / rozstaw źrenic', a: ['nosL', 'nosP'], b: ['zrL', 'zrP'], wz: 1 / FI },
    { id: 'ustaZr', gr: 'Usta', n: 'Szerokość ust / rozstaw źrenic', a: ['ustL', 'ustP'], b: ['zrL', 'zrP'], wz: 1 / FI },
    { id: 'oczy', gr: 'Oczy', n: 'Rozstaw zewnętrznych kącików oczu / rozstaw źrenic', a: ['okZL', 'okZP'], b: ['zrL', 'zrP'], wz: FI },
    { id: 'obrys', gr: 'Obrys', n: 'Od linii źrenic do linii ust / od linii ust do brody', a: ['*zrL+zrP', '*ustL+ustP'], b: ['*ustL+ustP', 'broda'], wz: FI }
  ];
  var PARY_SYM = [['okZL', 'okZP', 'kąciki oczu'], ['nosL', 'nosP', 'skrzydełka nosa'], ['ustL', 'ustP', 'kąciki ust'], ['polL', 'polP', 'policzki']];

  S.portret = function (pkt, szer, wys) {
    /* punkty znormalizowane 0..1 → piksele obrazu, żeby proporcje nie zależały od kształtu kadru */
    function P(ref) {
      if (ref.charAt(0) === '*') {
        var ab = ref.slice(1).split('+'), a = P(ab[0]), b = P(ab[1]);
        return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null;
      }
      var p = pkt[ref]; return p ? { x: p.x * szer, y: p.y * wys } : null;
    }
    function dl(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    var wyn = { pary: [], grupy: {}, sym: null, opisy: [], zModelu: 0, reczne: 0 };
    S.PUNKTY.forEach(function (p) { var q = pkt[p.id]; if (q) { if (q.src === 'model') wyn.zModelu++; else wyn.reczne++; } });

    S.PROPORCJE.forEach(function (pr) {
      var a1 = P(pr.a[0]), a2 = P(pr.a[1]), b1 = P(pr.b[0]), b2 = P(pr.b[1]);
      if (!(a1 && a2 && b1 && b2) || dl(b1, b2) === 0) return;
      var v = dl(a1, a2) / dl(b1, b2);
      var odch = Math.abs(v - pr.wz) / pr.wz;
      wyn.pary.push({ pr: pr, v: v, odch: odch, blisk: Math.min(v, pr.wz) / Math.max(v, pr.wz), wProgu: odch <= 0.05,
        segA: [a1, a2], segB: [b1, b2] });
    });
    if (wyn.pary.length) {
      wyn.srednia = wyn.pary.reduce(function (s, p) { return s + p.blisk; }, 0) / wyn.pary.length;
      wyn.wProgu = wyn.pary.filter(function (p) { return p.wProgu; }).length;
      wyn.najblizej = wyn.pary.slice().sort(function (x, y) { return y.blisk - x.blisk; })[0];
      wyn.pary.forEach(function (p) { (wyn.grupy[p.pr.gr] = wyn.grupy[p.pr.gr] || []).push(p.blisk); });
      Object.keys(wyn.grupy).forEach(function (g) { var t = wyn.grupy[g]; wyn.grupy[g] = t.reduce(function (a, b) { return a + b; }, 0) / t.length; });
    }

    var zL = P('zrL'), zP = P('zrP');
    if (zL && zP) {
      var ipd = dl(zL, zP), M = { x: (zL.x + zP.x) / 2, y: (zL.y + zP.y) / 2 };
      var ux = (zP.x - zL.x) / ipd, uy = (zP.y - zL.y) / ipd;
      /* Symetria: odległości punktów pary od osi prostopadłej do linii źrenic */
      var s = [];
      PARY_SYM.forEach(function (pa) {
        var a = P(pa[0]), b = P(pa[1]); if (!a || !b) return;
        var da = Math.abs((a.x - M.x) * ux + (a.y - M.y) * uy), db = Math.abs((b.x - M.x) * ux + (b.y - M.y) * uy);
        if (Math.max(da, db) > 0) s.push(Math.min(da, db) / Math.max(da, db));
      });
      if (s.length) wyn.sym = { w: s.reduce(function (a, b) { return a + b; }, 0) / s.length, n: s.length, z: PARY_SYM.length };
      wyn.os = { M: M, ux: ux, uy: uy, ipd: ipd };

      var katOczu = Math.atan2(zP.y - zL.y, zP.x - zL.x) / RAD;
      var pL = P('polL'), pP = P('polP'), pct = function (x) { return Math.round(x * 100) + '%'; };
      if (pL && pP) wyn.opisy.push({ n: 'Oczy', t: 'Rozstaw źrenic to ' + pct(ipd / dl(pL, pP)) + ' szerokości twarzy na wysokości policzków. Linia oczu jest nachylona o ' + S.pl(Math.abs(katOczu), 1) + '° względem poziomu kadru – to zwykle kwestia ustawienia głowy, a nie budowy twarzy.', q: 'Co widzicie najpierw: spojrzenie czy resztę twarzy? Jak zmieniłby się odbiór przy lekkim przechyleniu głowy?' });
      var bL = P('brL'), bP = P('brP');
      if (bL && bP) {
        var pion = function (b, z) { return Math.abs(-(b.x - z.x) * uy + (b.y - z.y) * ux); };
        wyn.opisy.push({ n: 'Brwi', t: 'Od źrenicy do brwi w pionie przypada średnio ' + pct((pion(bL, zL) + pion(bP, zP)) / 2 / ipd) + ' rozstawu źrenic. Uniesienie brwi w chwili robienia zdjęcia zmienia tę wartość.', q: 'Czy brwi w tym kadrze dodają twarzy powagi, czy zdziwienia?' });
      }
      var nN = P('nosN'), nC = P('nosC'), nL = P('nosL'), nP = P('nosP');
      if (nN && nC && nL && nP) wyn.opisy.push({ n: 'Nos', t: 'Szerokość nosa to ' + pct(dl(nL, nP) / ipd) + ' rozstawu źrenic, a jego długość od nasady do czubka – ' + pct(dl(nN, nC) / ipd) + '. Na obie wartości wpływa kąt ujęcia i ogniskowa obiektywu.', q: 'Czy patrząc na zdjęcie, w ogóle zwracacie uwagę na nos? Co zmienia zbliżenie aparatu do twarzy?' });
      var uL = P('ustL'), uP = P('ustP');
      if (uL && uP) {
        var katUst = Math.atan2(uP.y - uL.y, uP.x - uL.x) / RAD - katOczu;
        wyn.opisy.push({ n: 'Usta', t: 'Linia ust odchyla się o ' + S.pl(Math.abs(katUst), 1) + '° od linii oczu, a szerokość ust to ' + pct(dl(uL, uP) / ipd) + ' rozstawu źrenic. Mimika zmienia te wartości z sekundy na sekundę.', q: 'Jak odbieracie tę linię ust w tym kadrze? Co by się zmieniło, gdyby ta sama osoba rozchyliła usta albo uniosła jeden kącik?' });
      }
      var zuL = P('zuL'), zuP = P('zuP'), br = P('broda');
      if (pL && pP && zuL && zuP && br) wyn.opisy.push({ n: 'Obrys', t: 'Szerokość żuchwy to ' + pct(dl(zuL, zuP) / dl(pL, pP)) + ' szerokości twarzy w policzkach, a odcinek od linii oczu do brody – ' + pct(dl(M, br) / dl(pL, pP)) + ' tej szerokości. Zarost, fryzura i światło mocno zmieniają odbiór obrysu.', q: 'Jakim jednym słowem opisalibyście kształt tej twarzy? Ile w tym zasługi światła i fryzury?' });
    }
    return wyn;
  };

  /* =================== SYNTEZA =================== */
  S.synteza = function (num, niebo, karty) {
    var zr = [];
    function dodaj(metoda, etykieta, motyw, waga) { if (motyw) zr.push({ metoda: metoda, et: etykieta, m: motyw, w: waga }); }
    if (num) {
      if (num.droga) dodaj('Liczby', 'droga życia ' + num.droga.w, S.LICZBY[num.droga.w].m, 3);
      if (num.ekspresja) dodaj('Liczby', 'ekspresja imienia i nazwiska ' + num.ekspresja.w, S.LICZBY[num.ekspresja.w].m, 2.5);
      if (num.serce) dodaj('Liczby', 'potrzeba serca ' + num.serce.w, S.LICZBY[num.serce.w].m, 2);
      if (num.wizerunek) dodaj('Liczby', 'wizerunek ' + num.wizerunek.w, S.LICZBY[num.wizerunek.w].m, 1.5);
    }
    if (niebo) {
      niebo.ciala.forEach(function (x) { if (x.c.w && x.warianty.length === 1) dodaj('Niebo', x.c.n + ' · ' + S.ZNAKI[x.znak].n, S.ZNAKI[x.znak].m, x.c.w); });
      if (niebo.asc != null) dodaj('Niebo', 'Ascendent · ' + S.ZNAKI[Math.floor(niebo.asc / 30)].n, S.ZNAKI[Math.floor(niebo.asc / 30)].m, 2.5);
    }
    if (karty) karty.uklad.forEach(function (u) { dodaj('Karty', u.k.n + (u.odw ? ' odwr.' : ''), u.k.m, u.odw ? 1.5 : 2); });

    var sumy = {};
    zr.forEach(function (z) { sumy[z.m] = (sumy[z.m] || 0) + z.w; });
    var klucze = Object.keys(sumy).sort(function (a, b) { return sumy[b] - sumy[a]; });
    if (!klucze.length) return null;
    function najlepsze(motyw) {
      var wg = {};
      zr.filter(function (z) { return z.m === motyw; }).forEach(function (z) { if (!wg[z.metoda] || wg[z.metoda].w < z.w) wg[z.metoda] = z; });
      return ['Liczby', 'Niebo', 'Karty'].filter(function (k) { return wg[k]; }).map(function (k) { return wg[k]; });
    }
    function opisZrodel(lista) { return lista.map(function (z) { return z.metoda + ' (' + z.et + ')'; }).join(' + '); }
    var wiodacy = klucze[0];
    var wyn = { zrodla: zr, sumy: sumy, wiodacy: wiodacy, zbiezne: najlepsze(wiodacy), opisZrodel: opisZrodel };
    var naj = null;
    S.PARY.forEach(function (p) {
      var sila = Math.min(sumy[p.a] || 0, sumy[p.b] || 0);
      if (sila > 0 && (!naj || sila > naj.sila)) naj = { para: p, sila: sila };
    });
    if (naj) {
      var p = naj.para, pierwszy = (sumy[p.a] >= sumy[p.b]) ? p.a : p.b, drugi = pierwszy === p.a ? p.b : p.a;
      wyn.napiecie = { para: p, a: pierwszy, b: drugi, zrA: najlepsze(pierwszy), zrB: najlepsze(drugi) };
    }
    return wyn;
  };
})(window.Skan);
