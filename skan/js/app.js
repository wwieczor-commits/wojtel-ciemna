/* © 2026 WOJTEL Wojciech Wieczorek. Wszelkie prawa zastrzeżone. */
/* Interfejs panelu: formularz, podgląd na żywo, zakładki wyniku, raport PDF. */
(function (S) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function h(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function duza(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function proc(x) { return Math.round(x * 100) + '%'; }

  var stan = { widok: 'niebo', zak: 'synteza', img: null, plik: '', pkt: {}, grupa: 'oczy', wyr: null, wynik: null, model: null };

  /* ---------- Formularz ---------- */
  var STREFY = ['Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Vienna', 'Europe/Prague', 'Europe/Rome', 'Europe/Madrid', 'Europe/Dublin', 'Europe/Kyiv', 'Europe/Vilnius', 'America/New_York', 'America/Chicago', 'America/Toronto', 'America/Los_Angeles', 'UTC'];
  $('fStrefa').innerHTML = STREFY.map(function (s) { return '<option>' + s + '</option>'; }).join('');
  $('listaMiast').innerHTML = S.MIASTA.map(function (m) { return '<option value="' + h(m[0]) + '">'; }).join('');
  $('fData').max = new Date().toISOString().slice(0, 10);

  (function wyborKart() {
    var grupy = {}, kol = [];
    S.KARTY.forEach(function (k) { if (!grupy[k.grupa]) { grupy[k.grupa] = []; kol.push(k.grupa); } grupy[k.grupa].push(k); });
    var opcje = '<option value="">Wybierz…</option>' + kol.map(function (g) {
      return '<optgroup label="' + h(g) + '">' + grupy[g].map(function (k) { return '<option value="' + k.id + '">' + h(k.n) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    $('kartyWybor').innerHTML = S.POZYCJE.map(function (p, i) {
      return '<div><label><span class="mono">' + p.n + '</span><select id="fKarta' + i + '" aria-label="Karta: ' + p.n + '">' + opcje + '</select></label>' +
        '<label class="odw"><input type="checkbox" id="fOdw' + i + '"> Odwrócona</label></div>';
    }).join('');
  })();

  function znajdzMiasto(nazwa) {
    var n = (nazwa || '').trim().toLowerCase();
    for (var i = 0; i < S.MIASTA.length; i++) if (S.MIASTA[i][0].toLowerCase() === n) return S.MIASTA[i];
    return null;
  }
  $('fMiasto').addEventListener('input', function () {
    var m = znajdzMiasto(this.value);
    if (m) { $('fSzer').value = m[1]; $('fDl').value = m[2]; $('fStrefa').value = m[3]; }
  });

  function czytaj() {
    var d = $('fData').value.split('-'), data = d.length === 3 && +d[0] ? { r: +d[0], m: +d[1], d: +d[2] } : null;
    var karty = [0, 1, 2].map(function (i) { return { id: $('fKarta' + i).value, odw: $('fOdw' + i).checked }; });
    return { imie: $('fImie').value.trim(), data: data, miasto: $('fMiasto').value.trim(), godz: $('fGodz').value, pseudo: $('fPseudo').value.trim(),
      szer: parseFloat($('fSzer').value), dl: parseFloat($('fDl').value), strefa: $('fStrefa').value, karty: karty };
  }
  function dataPl(d) { return d ? ('0' + d.d).slice(-2) + '.' + ('0' + d.m).slice(-2) + '.' + d.r : ''; }
  function liczNiebo(f) {
    if (!f.data) return null;
    try { return S.niebo({ r: f.data.r, m: f.data.m, d: f.data.d, godz: f.godz, szer: f.szer, dl: f.dl, strefa: f.strefa }); } catch (e) { return null; }
  }

  /* ---------- Mapa nieba (SVG) ---------- */
  function mapaNieba(n) {
    var R = 300, cx = 320, cy = 320, baza = n && n.asc != null ? n.asc - 180 : 0, o = [];
    function xy(lon, r) { var a = (lon - baza) * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; }
    function f(p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }
    o.push('<svg viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa nieba" font-family="Georgia,serif">');
    o.push('<defs><radialGradient id="mg"><stop offset="0" stop-color="#24404a"/><stop offset="1" stop-color="#15232e" stop-opacity="0"/></radialGradient></defs><circle cx="320" cy="320" r="318" fill="url(#mg)"/>');
    var ziarno = 7;
    for (var i = 0; i < 70; i++) { ziarno = (ziarno * 9301 + 49297) % 233280; var sx = ziarno / 233280 * 640; ziarno = (ziarno * 9301 + 49297) % 233280; var sy = ziarno / 233280 * 640; o.push('<circle cx="' + sx.toFixed(0) + '" cy="' + sy.toFixed(0) + '" r="' + (i % 5 === 0 ? 1.4 : 0.8) + '" fill="#cfd8dc" opacity=".35"/>'); }
    [R, R - 52, R - 120, 70].forEach(function (r, k) { o.push('<circle cx="320" cy="320" r="' + r + '" fill="none" stroke="' + (k < 2 ? '#c9a66a' : '#3a4f5b') + '" stroke-width="' + (k === 0 ? 2 : 1) + '"/>'); });
    for (var s = 0; s < 12; s++) {
      o.push('<line x1="' + f(xy(s * 30, R - 52)).replace(',', '" y1="') + '" x2="' + f(xy(s * 30, R)).replace(',', '" y2="') + '" stroke="#c9a66a" stroke-width="1"/>');
      var g = xy(s * 30 + 15, R - 26);
      o.push('<text x="' + g[0].toFixed(1) + '" y="' + (g[1] + 9).toFixed(1) + '" text-anchor="middle" font-size="26" fill="#e6c382">' + S.ZNAKI[s].g + '︎</text>');
    }
    for (var t = 0; t < 72; t++) if (t % 6) o.push('<line x1="' + f(xy(t * 5, R - 52)).replace(',', '" y1="') + '" x2="' + f(xy(t * 5, R - 58)).replace(',', '" y2="') + '" stroke="#5c6f78" stroke-width="1"/>');
    if (!n) { o.push('<text x="320" y="326" text-anchor="middle" font-size="18" fill="#a9b6bd" font-family="Inter,sans-serif">Podaj datę urodzenia</text></svg>'); return o.join(''); }
    /* aspekty */
    n.aspekty.slice(0, 10).forEach(function (a) {
      var p1 = xy(lonOf(n, a.a.id), R - 120), p2 = xy(lonOf(n, a.b.id), R - 120);
      o.push('<line x1="' + f(p1).replace(',', '" y1="') + '" x2="' + f(p2).replace(',', '" y2="') + '" stroke="' + (a.asp.twardy ? '#e08a6a' : a.asp.kat === 0 ? '#e6c382' : '#62d2c6') + '" stroke-width="1.2" opacity=".75"/>');
    });
    /* planety: rozsuwanie etykiet, gdy stoją blisko siebie */
    var lista = n.ciala.map(function (x) { return { g: x.c.g, lon: x.lon, et: x.lon }; }).sort(function (a, b) { return a.lon - b.lon; });
    for (var powt = 0; powt < 6; powt++) for (var k = 1; k < lista.length; k++) if (lista[k].et - lista[k - 1].et < 9) { lista[k - 1].et -= 1.6; lista[k].et += 1.6; }
    lista.forEach(function (p) {
      var kr = xy(p.lon, R - 120), kr2 = xy(p.lon, R - 60), et = xy(p.et, R - 88);
      o.push('<line x1="' + f(kr).replace(',', '" y1="') + '" x2="' + f(kr2).replace(',', '" y2="') + '" stroke="#4a606c" stroke-width="1"/>');
      o.push('<circle cx="' + kr[0].toFixed(1) + '" cy="' + kr[1].toFixed(1) + '" r="4.5" fill="#e6c382"/>');
      o.push('<text x="' + et[0].toFixed(1) + '" y="' + (et[1] + 8).toFixed(1) + '" text-anchor="middle" font-size="24" fill="#f3ead6">' + p.g + '︎</text>');
    });
    if (n.asc != null) {
      var a1 = xy(n.asc, R + 14), m1 = xy(n.mc, R + 14);
      o.push('<line x1="' + f(xy(n.asc, 70)).replace(',', '" y1="') + '" x2="' + f(xy(n.asc, R)).replace(',', '" y2="') + '" stroke="#f3ead6" stroke-width="1.5"/>');
      o.push('<text x="' + a1[0].toFixed(1) + '" y="' + (a1[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="12" fill="#f3ead6" font-family="monospace">ASC</text>');
      o.push('<line x1="' + f(xy(n.mc, 70)).replace(',', '" y1="') + '" x2="' + f(xy(n.mc, R)).replace(',', '" y2="') + '" stroke="#f3ead6" stroke-width="1" stroke-dasharray="4 4"/>');
      o.push('<text x="' + m1[0].toFixed(1) + '" y="' + (m1[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="12" fill="#f3ead6" font-family="monospace">MC</text>');
    }
    o.push('<circle cx="320" cy="320" r="5" fill="#e6c382"/></svg>');
    return o.join('');
  }
  function lonOf(n, id) { for (var i = 0; i < n.ciala.length; i++) if (n.ciala[i].c.id === id) return n.ciala[i].lon; return 0; }

  /* ---------- Portret: płótno ---------- */
  var plotno = $('plotno'), ctx = plotno.getContext('2d');
  function rysuj(c, W, H, img, pkt, wyr) {
    c.clearRect(0, 0, W, H);
    c.drawImage(img, 0, 0, W, H);
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.14)';
    var krok = W / 12;
    for (var x = krok; x < W; x += krok) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (var y = krok; y < H; y += krok) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    function P(id) { var p = pkt[id]; return p ? { x: p.x * W, y: p.y * H } : null; }
    function linia(a, b, kolor, gr) { if (!a || !b) return; c.strokeStyle = kolor; c.lineWidth = gr; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    var sk = Math.max(1, W / 420), zl = 'rgba(240,214,160,.9)';
    var zL = P('zrL'), zP = P('zrP'), br = P('broda');
    if (zL && zP) {
      var dx = zP.x - zL.x, dy = zP.y - zL.y, M = { x: (zL.x + zP.x) / 2, y: (zL.y + zP.y) / 2 };
      linia({ x: zL.x - dx * .6, y: zL.y - dy * .6 }, { x: zP.x + dx * .6, y: zP.y + dy * .6 }, zl, sk);
      linia({ x: M.x + dy * .9, y: M.y - dx * .9 }, br ? { x: M.x - dy * 2.1, y: M.y + dx * 2.1 } : { x: M.x - dy * 1.6, y: M.y + dx * 1.6 }, zl, sk);
      linia(zL, P('nosC'), zl, sk * .8); linia(zP, P('nosC'), zl, sk * .8);
      linia(P('okZL'), P('ustP'), 'rgba(240,214,160,.45)', sk * .7); linia(P('okZP'), P('ustL'), 'rgba(240,214,160,.45)', sk * .7);
    }
    linia(P('nosL'), P('nosP'), zl, sk); linia(P('ustL'), P('ustP'), zl, sk);
    linia(P('ustL'), P('ustG'), zl, sk * .7); linia(P('ustP'), P('ustG'), zl, sk * .7); linia(P('ustL'), P('ustD'), zl, sk * .7); linia(P('ustP'), P('ustD'), zl, sk * .7);
    linia(P('polL'), P('polP'), 'rgba(240,214,160,.5)', sk * .7);
    if (wyr) {
      var sc = function (p) { return { x: p.x * W / stan.img.naturalWidth, y: p.y * H / stan.img.naturalHeight }; };
      linia(sc(wyr.segB[0]), sc(wyr.segB[1]), '#62d2c6', sk * 3.2);
      linia(sc(wyr.segA[0]), sc(wyr.segA[1]), '#f2c873', sk * 3.2);
    }
    S.PUNKTY.forEach(function (d) {
      var p = P(d.id); if (!p) return;
      c.beginPath(); c.arc(p.x, p.y, sk * 2.6, 0, 6.3); c.fillStyle = pkt[d.id].src === 'model' ? '#fff' : '#f2c873'; c.fill();
      c.lineWidth = sk * .8; c.strokeStyle = 'rgba(0,0,0,.55)'; c.stroke();
    });
  }
  function odswiezPortret() {
    var jest = !!stan.img;
    $('portretPusto').hidden = jest; $('portretRob').hidden = !jest;
    if (!jest) return;
    var img = stan.img, maxW = Math.min($('scenaPortret').clientWidth - 40, 560) || 400, maxH = 440;
    var sk = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight), w = Math.round(img.naturalWidth * sk), hh = Math.round(img.naturalHeight * sk);
    var dpr = window.devicePixelRatio || 1;
    plotno.style.width = w + 'px'; plotno.style.height = hh + 'px';
    plotno.width = Math.round(w * dpr); plotno.height = Math.round(hh * dpr);
    rysuj(ctx, plotno.width, plotno.height, img, stan.pkt, stan.wyr);
    odswiezGrupy();
  }
  function grupaStan(g) {
    var w = S.PUNKTY.filter(function (p) { return p.g === g; });
    return { wszystkie: w, brak: w.filter(function (p) { return !stan.pkt[p.id]; }) };
  }
  function odswiezGrupy() {
    $('selGrupa').innerHTML = S.GRUPY.map(function (g) {
      var st = grupaStan(g.id);
      return '<option value="' + g.id + '"' + (g.id === stan.grupa ? ' selected' : '') + '>Pierwsze wrażenie · ' + g.n + ' · ' + (st.wszystkie.length - st.brak.length) + '/' + st.wszystkie.length + '</option>';
    }).join('');
    var st = grupaStan(stan.grupa);
    if (!stan.komunikat) $('portretStan').textContent = st.brak.length ? 'Kliknij na zdjęciu: ' + st.brak[0].n + '.' : 'Ten obszar jest gotowy. Możesz wybrać kolejną grupę albo kliknąć punkt, żeby go poprawić.';
    var ile = Object.keys(stan.pkt).length;
    $('kafGeo').textContent = stan.img ? (ile ? ile + ' z ' + S.PUNKTY.length + ' punktów' : 'Oznacz punkty na zdjęciu') : 'Oczekuje na portret';
  }
  function komunikat(t) { stan.komunikat = t; $('portretStan').textContent = t; }

  plotno.addEventListener('click', function (e) {
    var r = plotno.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    var st = grupaStan(stan.grupa), cel = st.brak[0];
    if (!cel) { /* poprawka: najbliższy punkt grupy */
      var naj = null;
      st.wszystkie.forEach(function (p) { var q = stan.pkt[p.id], d = Math.hypot(q.x - x, q.y - y); if (!naj || d < naj.d) naj = { p: p, d: d }; });
      cel = naj.p;
    }
    stan.pkt[cel.id] = { x: x, y: y, src: 'reka' };
    stan.komunikat = ''; stan.wyr = null;
    odswiezPortret(); poZmianiePunktow();
  });
  $('selGrupa').addEventListener('change', function () { stan.grupa = this.value; stan.komunikat = ''; odswiezGrupy(); });
  $('btnCofnij').addEventListener('click', function () {
    var st = grupaStan(stan.grupa), sa = st.wszystkie.filter(function (p) { return stan.pkt[p.id]; });
    if (sa.length) delete stan.pkt[sa[sa.length - 1].id];
    stan.komunikat = ''; stan.wyr = null; odswiezPortret(); poZmianiePunktow();
  });
  $('btnWyczysc').addEventListener('click', function () {
    grupaStan(stan.grupa).wszystkie.forEach(function (p) { delete stan.pkt[p.id]; });
    stan.komunikat = ''; stan.wyr = null; odswiezPortret(); poZmianiePunktow();
  });
  $('btnUsun').addEventListener('click', function () {
    stan.img = null; stan.pkt = {}; stan.plik = ''; stan.wyr = null; $('fPlik').value = '';
    $('plikNazwa').textContent = 'Portret · opcjonalnie'; odswiezPortret(); odswiezGrupy(); poZmianiePunktow();
  });
  $('btnWykryj').addEventListener('click', wykryj);
  function poZmianiePunktow() { if (stan.wynik) { przelicz(); pokazZakladke(stan.zak); } }

  function wczytajModel() {
    if (stan.model) return stan.model;
    stan.model = new Promise(function (ok, zle) {
      var s = document.createElement('script'); s.src = 'vendor/face-api.js';
      s.onload = function () {
        var f = window.faceapi;
        Promise.all([f.nets.tinyFaceDetector.loadFromUri('vendor/model'), f.nets.faceLandmark68Net.loadFromUri('vendor/model')]).then(function () { ok(f); }, zle);
      };
      s.onerror = function () { zle(new Error('Nie udało się wczytać modelu')); };
      document.head.appendChild(s);
    });
    stan.model.catch(function () { stan.model = null; });
    return stan.model;
  }
  function wykryj() {
    if (!stan.img) return;
    var img = stan.img;
    komunikat('Wczytuję model i szukam punktów twarzy…');
    wczytajModel().then(function (f) {
      var proby = [416, 608, 320, 224], i = 0;
      function proba() {
        return f.detectSingleFace(img, new f.TinyFaceDetectorOptions({ inputSize: proby[i], scoreThreshold: 0.3 })).withFaceLandmarks().then(function (w) {
          if (w || ++i >= proby.length) return w;
          return proba();
        });
      }
      return proba();
    }).then(function (w) {
      if (img !== stan.img) return;
      if (!w) { komunikat('Model nie znalazł twarzy na tym zdjęciu. Oznacz punkty ręcznie, klikając na zdjęciu.'); return; }
      stan.pkt = S.punktyZModelu(w.landmarks.positions, img.naturalWidth, img.naturalHeight);
      stan.wyr = null; odswiezPortret();
      komunikat('Punkty modelu gotowe. Kliknij punkt na zdjęciu, żeby go poprawić.');
      poZmianiePunktow();
    }).catch(function () {
      if (img === stan.img) komunikat('Nie udało się uruchomić modelu. Oznacz punkty ręcznie, klikając na zdjęciu.');
    });
  }
  $('fPlik').addEventListener('change', function () {
    var plik = this.files && this.files[0]; if (!plik) return;
    var img = new Image();
    img.onload = function () {
      stan.img = img; stan.pkt = {}; stan.plik = plik.name; stan.wyr = null; stan.komunikat = '';
      $('plikNazwa').textContent = plik.name;
      ustawWidok('portret'); wykryj();
    };
    img.onerror = function () { $('plikNazwa').textContent = 'Nie udało się odczytać tego pliku'; };
    img.src = URL.createObjectURL(plik);
  });

  /* ---------- Podgląd na żywo ---------- */
  function ustawWidok(w) {
    stan.widok = w;
    document.querySelectorAll('.przelacznik button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.widok === w); });
    $('scenaNiebo').hidden = w !== 'niebo'; $('scenaPortret').hidden = w !== 'portret';
    $('podTytul').textContent = w === 'niebo' ? 'Mapa nieba' : 'Siatka portretu';
    $('stTag').textContent = w === 'niebo' ? 'ZODIAK TROPIKALNY' : 'GEOMETRIA 2D';
    if (w === 'portret') odswiezPortret();
  }
  document.querySelectorAll('.przelacznik button').forEach(function (b) { b.addEventListener('click', function () { ustawWidok(b.dataset.widok); }); });

  function naZywo() {
    var f = czytaj();
    $('stImie').textContent = f.imie || '—';
    $('stData').textContent = [dataPl(f.data), f.miasto].filter(Boolean).join(' / ') || 'Podaj dane po prawej';
    $('scenaNiebo').innerHTML = mapaNieba(liczNiebo(f));
    $('kafNum').textContent = f.imie && f.data ? 'Gotowe do obliczeń' : 'Imię i data';
    $('kafAst').textContent = f.data ? (f.godz ? 'Mapa z godziną i ascendentem' : 'Mapa na południe, bez domów') : 'Mapa urodzeniowa';
    $('kafTar').textContent = f.karty.filter(function (k) { return k.id; }).length + ' z 3 kart';
  }
  $('form').addEventListener('input', naZywo);
  $('form').addEventListener('change', naZywo);
  $('btnLosuj').addEventListener('click', function () {
    var pula = S.KARTY.slice();
    [0, 1, 2].forEach(function (i) {
      var k = pula.splice(Math.floor(Math.random() * pula.length), 1)[0];
      $('fKarta' + i).value = k.id; $('fOdw' + i).checked = Math.random() < 0.25;
    });
    naZywo();
  });

  /* ---------- Skan ---------- */
  function przelicz() {
    var f = czytaj();
    var w = { f: f };
    w.num = S.numerologia(f.imie, f.data, f.pseudo);
    w.niebo = liczNiebo(f);
    w.karty = S.kartyUklad(f.karty);
    w.portret = stan.img && Object.keys(stan.pkt).length ? S.portret(stan.pkt, stan.img.naturalWidth, stan.img.naturalHeight) : null;
    w.syn = S.synteza(w.num, w.niebo, w.karty);
    stan.wynik = w;
    return w;
  }
  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = czytaj(), blad = '';
    if (!/[a-ząćęłńóśźż]/i.test(f.imie)) blad = 'Wpisz imię i nazwisko.';
    else if (!f.data) blad = 'Podaj datę urodzenia.';
    $('blad').hidden = !blad; $('blad').textContent = blad;
    if (blad) { (f.data ? $('fImie') : (/[a-z]/i.test(f.imie) ? $('fData') : $('fImie'))).focus(); return; }
    $('skanowanie').hidden = false;
    var czas = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1100;
    setTimeout(function () {
      $('skanowanie').hidden = true;
      przelicz();
      $('wynikImie').textContent = f.imie;
      $('formularz').hidden = true; $('wynik').hidden = false;
      pokazZakladke('synteza');
      $('wynik').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, czas);
  });
  $('btnEdytuj').addEventListener('click', function () { $('wynik').hidden = true; $('formularz').hidden = false; stan.wynik = null; stan.wyr = null; if (stan.widok === 'portret') odswiezPortret(); });

  /* ---------- Zakładki wyniku ---------- */
  function pokazZakladke(z) {
    stan.zak = z;
    document.querySelectorAll('#zakladki button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.zak === z); });
    var w = stan.wynik;
    $('zakTresc').innerHTML = { synteza: zakSynteza, liczby: zakLiczby, niebo: zakNiebo, karty: zakKarty, portret: zakPortret, cel: zakCel }[z](w);
    if (z === 'niebo') ustawWidok('niebo');
    if (z === 'portret' && stan.img) ustawWidok('portret');
  }
  $('zakladki').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) pokazZakladke(b.dataset.zak); });
  document.querySelectorAll('.kafel').forEach(function (k) {
    k.addEventListener('click', function () {
      if (stan.wynik) { pokazZakladke(k.dataset.zak); $('wynik').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else { $('formularz').scrollIntoView({ behavior: 'smooth', block: 'start' }); if (k.dataset.zak === 'portret') ustawWidok('portret'); if (k.dataset.zak === 'niebo') ustawWidok('niebo'); }
    });
  });
  $('zakTresc').addEventListener('click', function (e) {
    var idz = e.target.closest('[data-idz]');
    if (idz) { pokazZakladke(idz.dataset.idz); return; }
    var para = e.target.closest('[data-para]');
    if (para && stan.wynik.portret) {
      var p = stan.wynik.portret.pary[+para.dataset.para];
      stan.wyr = stan.wyr === p ? null : p;
      document.querySelectorAll('[data-para]').forEach(function (b) { b.setAttribute('aria-pressed', b === para && !!stan.wyr); });
      ustawWidok('portret');
    }
    if (e.target.closest('#btnAi')) kopiujPrompt(e.target.closest('#btnAi'));
  });

  function ramkaPortretu(p) {
    if (!p || !p.pary.length) return '';
    return '<div class="ramka"><p><strong class="zloto">Bliskość złotej proporcji · ' + proc(p.srednia) + '</strong></p>' +
      '<p class="cichy">Zmierzono ' + p.pary.length + ' z ' + S.PROPORCJE.length + ' proporcji. W granicach ±5% wzorca: ' + p.wProgu + '/' + p.pary.length + '.</p>' +
      (p.sym ? '<p><strong>Symetria w kadrze · ' + proc(p.sym.w) + ' (' + p.sym.n + '/' + p.sym.z + ' par)</strong></p>' : '') +
      '<p><button type="button" class="link" data-idz="portret">Zobacz porównania na portrecie →</button></p></div>';
  }
  function zakSynteza(w) {
    var s = w.syn, o = ramkaPortretu(w.portret);
    if (!s) return o + '<p>Za mało danych do syntezy.</p>';
    var m = S.MOTYWY[s.wiodacy];
    o += '<div class="blok"><h3>Motyw przewodni</h3><p class="pyt">Jaki temat wyłania się ze skanu?</p><p>' + m.n + ' · ' + h(m.o) + '</p></div>';
    o += '<div class="blok"><h3>Zbieżność</h3><p class="pyt">Które metody wskazują ten sam motyw?</p><p>' +
      (s.zbiezne.length > 1 ? h(s.opisZrodel(s.zbiezne)) : h(s.opisZrodel(s.zbiezne)) + '. <span class="cichy">Na razie tylko jedna metoda – dodaj karty albo godzinę urodzenia, żeby sprawdzić zbieżność.</span>') + '</p></div>';
    o += '<div class="blok"><h3>Napięcie</h3><p class="pyt">Które dwa motywy ciągną w różne strony?</p>';
    if (s.napiecie) o += '<p>' + h(s.napiecie.para.zdanie) + '</p><p>' + h(s.opisZrodel(s.napiecie.zrA)) + ' ↔ ' + h(s.opisZrodel(s.napiecie.zrB)) + '</p><p><button type="button" class="link zloto" data-idz="cel">Przejdź do celu duszy →</button></p>';
    else o += '<p>W tym skanie motywy nie stoją naprzeciw siebie – odczyty układają się w jednym kierunku.</p><p><button type="button" class="link zloto" data-idz="cel">Przejdź do celu duszy →</button></p>';
    o += '</div><p class="przypis">Porównujemy symboliczne odczyty liczb, nieba i wybranych kart. Odwrócona karta ma własny odczyt. Zdjęcie opisujemy osobno w zakładce Portret.</p>' +
      '<p><button type="button" class="btn-duch" id="btnAi">✧ Skopiuj odczyt jako prompt do AI</button></p>';
    return o;
  }
  function wierszL(nazwa, x, pole) {
    if (!x) return '';
    return '<div class="wiersz"><dt>' + nazwa + ' · ' + x.w + '</dt><dd>' + h(S.LICZBY[x.w][pole]) + '<br><small>' + h(x.opis) + '</small></dd></div>';
  }
  function zakLiczby(w) {
    var n = w.num, o = '<dl>';
    o += wierszL('Droga życia', n.droga, 'dz') + wierszL('Ekspresja', n.ekspresja, 'ex') + wierszL('Potrzeba serca', n.serce, 'se') + wierszL('Wizerunek', n.wizerunek, 'wi');
    if (n.dzien) o += '<div class="wiersz"><dt>Dzień urodzenia · ' + (n.dzien.surowy !== n.dzien.w ? n.dzien.surowy + '/' : '') + n.dzien.w + '</dt><dd>Dar dnia w tej interpretacji: ' + h(S.LICZBY[n.dzien.w].dn) + '<br><small>' + h(n.dzien.opis) + '</small></dd></div>';
    if (n.pseudonim) o += '<div class="wiersz"><dt>Pseudonim · ' + n.pseudonim.w + '</dt><dd>' + h(S.LICZBY[n.pseudonim.w].ex) + ' <span class="cichy">Opisuje tylko tę formę zapisu.</span><br><small>' + h(n.pseudonim.opis) + '</small></dd></div>';
    o += '<div class="wiersz"><dt>Litery i wartości</dt><dd><small>' + h(n.litery) + '</small></dd></div></dl>';
    o += '<p class="przypis">Współczesna numerologia zachodnia (pitagorejska). Litery A–Z mają wartości od 1 do 9. Każdą część imienia i nazwiska oraz miesiąc, dzień i rok redukujemy osobno; zachowujemy 11, 22 i 33. Polskie znaki zapisujemy w formie podstawowej, np. Ł → L. Zdania do odczytu są autorską interpretacją.</p>';
    return o;
  }
  function zakNiebo(w) {
    var n = w.niebo; if (!n) return '<p>Brak danych do mapy nieba.</p>';
    var o = '<dl>';
    if (n.asc != null) { var za = S.ZNAKI[Math.floor(n.asc / 30)]; o += '<div class="wiersz"><dt>Ascendent · ' + za.n + ' ' + S.pl(n.asc % 30, 1) + '°</dt><dd>Pierwsze wrażenie i styl bycia. Na wejściu widać kogoś, kto działa ' + h(za.styl) + '.</dd></div>'; }
    n.ciala.forEach(function (x) {
      if (x.c.pok) return;
      if (x.warianty.length > 1) {
        o += '<div class="wiersz"><dt>' + x.c.n + ' · możliwe warianty</dt><dd>' + h(x.c.rola) + ' ' + x.warianty.map(function (z) { return S.ZNAKI[z].n + ' — ' + h(S.tekstCiala(x.c, S.ZNAKI[z])); }).join('<br>') + '<br><small>Tego dnia ' + x.c.n + ' zmienia znak. Podaj godzinę urodzenia, żeby rozstrzygnąć.</small></dd></div>';
      } else {
        var z = S.ZNAKI[x.znak];
        o += '<div class="wiersz"><dt>' + x.c.n + ' · ' + z.n + ' ' + S.pl(x.st, 1) + '°' + (x.wstecz ? ' ℞' : '') + '</dt><dd>' + h(x.c.rola) + ' ' + h(S.tekstCiala(x.c, z)) + (x.dom ? ' <small>Dom ' + x.dom + '.</small>' : '') + '</dd></div>';
      }
    });
    n.aspekty.slice(0, 6).forEach(function (a) {
      o += '<div class="wiersz"><dt>' + a.a.n + ' / ' + a.b.n + ' · ' + a.asp.n + '</dt><dd>Temat układu: ' + h(a.a.t) + ' i ' + h(a.b.t) + '. ' + h(a.asp.cz) + '<br><small>Odchylenie od dokładnego kąta: ' + S.pl(a.orb, 1) + '°.' + (n.maCzas ? '' : ' Układ mieści się w przyjętej tolerancji przez cały dzień urodzenia.') + '</small></dd></div>';
    });
    var pok = n.ciala.filter(function (x) { return x.c.pok; }).map(function (x) { return x.c.n + ' · ' + S.ZNAKI[x.znak].n; }).join(', ');
    o += '<div class="wiersz"><dt>Tło pokolenia</dt><dd><small>' + pok + '. Te planety stoją w jednym znaku przez lata, więc opisują rocznik, a nie osobę.</small></dd></div>';
    o += '<div class="wiersz"><dt>Żywioły</dt><dd><small>' + Object.keys(n.zywioly).map(function (k) { return duza(k) + ' ' + n.zywioly[k]; }).join(' · ') + ' (liczba ciał w znakach danego żywiołu).</small></dd></div></dl>';
    o += '<p class="przypis">Zodiak tropikalny, pozycje geocentryczne' + (n.maCzas ? ' na podaną godzinę' : ' na godzinę 12:00 czasu lokalnego (nie podano godziny urodzenia)') + '. Obliczenia: Astronomy Engine. ℞ oznacza ruch wsteczny. Zdania do odczytu są autorską interpretacją.</p>';
    return o;
  }
  function zakKarty(w) {
    var k = w.karty;
    if (!k.uklad.length) return '<p>Nie wybrano kart. Wróć do danych („Edytuj dane”) i wskaż karty wylosowane na wizji albo użyj przycisku „Wylosuj 3 karty”.</p>';
    var o = k.uklad.map(function (u) {
      return '<div class="kartaT"><p class="poz">' + u.poz.tyt + ' · ' + (u.odw ? 'odwrócona' : 'prosta') + '</p><h3>' + h(u.k.n) + '</h3><p class="obraz">' + h(u.k.obraz) + '</p><p>' + h(u.odczyt) + '</p><p class="pytk">' + h(u.k.pyt) + '</p>' +
        '<details><summary>Znaczenie tradycyjne</summary><p class="cichy">Prosta: ' + h(u.k.up) + '.<br>Odwrócona: ' + h(u.k.rev) + '.</p></details></div>';
    }).join('');
    o += '<dl>';
    k.watki.forEach(function (t) { o += '<div class="wiersz"><dt>Wspólny wątek</dt><dd>' + h(t) + '</dd></div>'; });
    if (k.pytanie) o += '<div class="wiersz"><dt>Pytanie do układu</dt><dd>' + h(k.pytanie) + '</dd></div>';
    o += '</dl><p class="przypis">Opis obrazu według ilustracji Pameli Colman Smith (talia Rider–Waite–Smith). Teksty odczytu są interpretacją zależną od miejsca karty w układzie.</p>';
    return o;
  }
  function zakPortret(w) {
    var p = w.portret;
    if (!stan.img) return '<p>Nie dodano portretu. Wróć do danych („Edytuj dane”) i wybierz zdjęcie – najlepiej twarz na wprost, równo oświetloną.</p>';
    if (!p) return '<p>Zdjęcie jest wczytane, ale nie ma jeszcze punktów. Oznacz je na podglądzie po lewej.</p>';
    var o = '<dl>';
    p.opisy.forEach(function (x) { o += '<div class="wiersz"><dt>' + x.n + '</dt><dd>' + h(x.t) + '</dd></div><div class="wiersz"><dt>Do widzów</dt><dd>' + h(x.q) + '</dd></div>'; });
    o += '</dl><p class="przypis">Punkty z modelu: ' + p.zModelu + ' · wskazane ręcznie: ' + p.reczne + '</p>';
    if (p.pary.length) {
      var obw = 2 * Math.PI * 52;
      o += '<div class="blok"><h2 style="font-size:36px">Boska proporcja</h2><div class="kolo"><svg viewBox="0 0 132 132" role="img" aria-label="' + proc(p.srednia) + '"><circle cx="66" cy="66" r="52" fill="none" stroke="#2b3e4b" stroke-width="9"/><circle cx="66" cy="66" r="52" fill="none" stroke="#e6c382" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (obw * p.srednia).toFixed(1) + ' ' + obw.toFixed(1) + '" transform="rotate(-90 66 66)"/><text x="66" y="77" text-anchor="middle" font-size="32" fill="#eef0ea" font-family="Georgia,serif">' + proc(p.srednia) + '</text></svg>' +
        '<div><p><strong>Średnia bliskość złotej proporcji</strong></p><p class="cichy">Zmierzono ' + p.pary.length + ' z ' + S.PROPORCJE.length + ' proporcji. W granicach ±5% wzorca: ' + p.wProgu + '/' + p.pary.length + '.</p><p>Najbliżej wzorca · ' + h(p.najblizej.pr.n) + '</p></div></div>';
      o += '<div class="paski">' + ['Oczy', 'Nos', 'Usta', 'Obrys'].filter(function (g) { return p.grupy[g] != null; }).map(function (g) { return '<div class="pasekP"><span>' + g + '</span><i><b style="width:' + proc(p.grupy[g]) + '"></b></i><span class="cichy">' + proc(p.grupy[g]) + '</span></div>'; }).join('') + '</div>';
      o += '<p><strong>Gdzie wypadają proporcje?</strong></p><p class="cichy">Kliknij parę, aby zobaczyć odcinki na zdjęciu. <span class="a-zloto">Złoty</span> i <span class="a-turkus">turkusowy</span> kolor oznaczają porównywane długości.</p><ul class="pary">';
      p.pary.forEach(function (x, i) {
        o += '<li><button type="button" data-para="' + i + '" aria-pressed="' + (stan.wyr && stan.wyr.pr.id === x.pr.id) + '"><strong>' + h(x.pr.n) + '</strong><span>' + S.pl(x.v, 3) + ' / wzorzec ' + S.pl(x.pr.wz, 3) + '<br>' + (x.wProgu ? 'W progu' : 'Poza progiem') + ' · odchylenie ' + S.pl(x.odch * 100, 2) + '% · bliskość ' + proc(x.blisk) + '</span></button></li>';
      });
      o += '</ul></div>';
    }
    o += '<p class="przypis">Pomiar dotyczy jednego zdjęcia: kąt głowy, mimika, obiektyw i światło zmieniają wyniki. Złota proporcja nie jest miarą urody ani charakteru – to ciekawostka do rozmowy.</p>';
    return o;
  }
  function daneCelu(w) {
    var s = w.syn; if (!s) return null;
    if (s.napiecie) { var p = s.napiecie.para; return { tyt: S.MOTYWY[p.a].n + ' ↔ ' + S.MOTYWY[p.b].n, cel: p.cel, lekcja: p.lekcja, wybor: p.wybor, pytanie: p.pytanie }; }
    var m = S.MOTYWY[s.wiodacy];
    return { tyt: m.n, cel: m.cel, lekcja: m.lekcja, wybor: 'Zauważ jedną sytuację w tym tygodniu, w której ten motyw sam się odzywa – i jedną, w której warto go świadomie odpuścić.', pytanie: m.pytanie };
  }
  function zakCel(w) {
    var c = daneCelu(w); if (!c) return '<p>Za mało danych.</p>';
    var s = w.syn, o = '<div class="ramka"><p><strong>' + h(c.tyt) + '</strong></p><p><strong>Jaki jest cel duszy?</strong></p><p class="duze">' + h(c.cel) + '</p></div>';
    o += '<div class="blok"><h3>Lekcja na tę drogę</h3><p>' + h(c.lekcja) + '</p></div>';
    o += '<div class="blok"><h3>Wybór w codziennym życiu</h3><p>' + h(c.wybor) + '</p></div>';
    o += '<div class="blok"><h3>Pytanie na wizję</h3><p>' + h(c.pytanie) + '</p></div>';
    var nap = w.karty.uklad.filter(function (u) { return u.poz.id === 'napiecie'; })[0];
    if (nap) o += '<div class="ramka" style="border-color:var(--linia);background:transparent"><p><strong>Karta w pozycji napięcia · ' + h(nap.k.n) + ' (' + (nap.odw ? 'odwrócona' : 'prosta') + ')</strong></p><p>' + h(nap.odczyt) + '</p></div>';
    o += '<details><summary>Skąd ten odczyt?</summary><p class="cichy">' + skadCel(w) + '</p></details>';
    o += '<p class="przypis">Symboliczna interpretacja skanu do rozmowy – nie przepowiednia.</p>';
    return o;
  }
  function skadCel(w) {
    var s = w.syn, t = [];
    if (s.napiecie) t.push('Cel wynika z pary motywów, które w tym skanie ciągną w różne strony: ' + h(s.opisZrodel(s.napiecie.zrA)) + ' ↔ ' + h(s.opisZrodel(s.napiecie.zrB)) + '.');
    else t.push('Wszystkie odczyty wskazują w jednym kierunku, więc cel wynika z motywu przewodniego: ' + h(s.opisZrodel(s.zbiezne)) + '.');
    if (w.niebo) { var zn = S.ZNAKI[Math.floor(w.niebo.wezel / 30)], zs = S.ZNAKI[(Math.floor(w.niebo.wezel / 30) + 6) % 12]; t.push('Dla porównania: w astrologii kierunek rozwoju opisuje Węzeł Północny, tu w znaku ' + zn.n + ' (uczyć się działać ' + h(zn.styl) + '), a punkt wyjścia – Węzeł Południowy w znaku ' + zs.n + '.'); }
    t.push('Siła motywów (suma wag): ' + Object.keys(s.sumy).sort(function (a, b) { return s.sumy[b] - s.sumy[a]; }).map(function (k) { return S.MOTYWY[k].n + ' ' + S.pl(s.sumy[k], 1); }).join(', ') + '.');
    return t.join(' ');
  }

  /* ---------- Prompt do AI ---------- */
  function tekstOdczytu(w) {
    var s = w.syn, n = w.num, t = ['Dane: ' + w.f.imie + ', ur. ' + dataPl(w.f.data) + (w.f.miasto ? ', ' + w.f.miasto : '') + (w.f.godz ? ', godz. ' + w.f.godz : '') + '.'];
    t.push('Liczby: droga życia ' + n.droga.w + ', ekspresja ' + (n.ekspresja && n.ekspresja.w) + ', potrzeba serca ' + (n.serce && n.serce.w) + ', wizerunek ' + (n.wizerunek && n.wizerunek.w) + ', dzień urodzenia ' + n.dzien.surowy + '.');
    if (w.niebo) t.push('Niebo: ' + w.niebo.ciala.filter(function (x) { return !x.c.pok && x.warianty.length === 1; }).map(function (x) { return x.c.n + ' w znaku ' + S.ZNAKI[x.znak].n; }).join(', ') + (w.niebo.asc != null ? ', Ascendent ' + S.ZNAKI[Math.floor(w.niebo.asc / 30)].n : '') + '.');
    if (w.karty.uklad.length) t.push('Karty: ' + w.karty.uklad.map(function (u) { return u.poz.n + ' – ' + u.k.n + (u.odw ? ' (odwrócona)' : ''); }).join('; ') + '.');
    if (s) { t.push('Motyw przewodni: ' + S.MOTYWY[s.wiodacy].n + '.'); if (s.napiecie) t.push('Napięcie: ' + S.MOTYWY[s.napiecie.a].n + ' ↔ ' + S.MOTYWY[s.napiecie.b].n + '.'); }
    return t.join('\n');
  }
  function kopiujPrompt(btn) {
    var tekst = 'Jesteś prowadzącym rozrywkowy program. Na podstawie poniższego symbolicznego odczytu napisz ciepłą, konkretną opowieść o tej osobie (ok. 250 słów), zakończoną trzema pytaniami do rozmowy. Zaznacz, że to zabawa, a nie diagnoza.\n\n' + tekstOdczytu(stan.wynik);
    var ok = function () { btn.textContent = '✓ Skopiowano – wklej do rozmowy z AI'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tekst).then(ok, function () { window.prompt('Skopiuj tekst:', tekst); });
    else window.prompt('Skopiuj tekst:', tekst);
  }

  /* ---------- Raport PDF (przez okno drukowania) ---------- */
  function obrazPortretu() {
    if (!stan.img) return '';
    var img = stan.img, sk = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sk); c.height = Math.round(img.naturalHeight * sk);
    rysuj(c.getContext('2d'), c.width, c.height, img, stan.pkt, null);
    try { return c.toDataURL('image/jpeg', 0.9); } catch (e) { return ''; }
  }
  function budujRaport() {
    var w = przelicz(), f = w.f, s = w.syn, n = w.num, c = daneCelu(w), o = [];
    function tr(a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; }
    o.push('<div class="r-glowa"><div><p>Kwantowy skan osobowości · raport</p><h1>' + h(f.imie) + '</h1></div><p>' + dataPl(f.data) + (f.godz ? ' · ' + f.godz : '') + (f.miasto ? ' · ' + h(f.miasto) : '') + '</p></div>');
    var foto = obrazPortretu();
    o.push('<div class="r-top">' + (foto ? '<div class="r-obraz"><img src="' + foto + '" alt="Portret z siatką pomiarową"></div>' : '') + '<div class="r-obraz">' + mapaNieba(w.niebo) + '</div></div>');
    if (s) {
      o.push('<div class="r-ramka"><p><small>CEL DUSZY · ' + h(c.tyt) + '</small></p><p class="duze">' + h(c.cel) + '</p><p>' + h(c.lekcja) + '</p></div>');
      o.push('<h2>Synteza</h2><table>' + tr('Motyw przewodni', S.MOTYWY[s.wiodacy].n + ' · ' + h(S.MOTYWY[s.wiodacy].o)) + tr('Zbieżność', h(s.opisZrodel(s.zbiezne))) +
        (s.napiecie ? tr('Napięcie', h(s.napiecie.para.zdanie) + '<br><small>' + h(s.opisZrodel(s.napiecie.zrA)) + ' ↔ ' + h(s.opisZrodel(s.napiecie.zrB)) + '</small>') : '') +
        tr('Wybór na co dzień', h(c.wybor)) + tr('Pytanie do rozmowy', h(c.pytanie)) + '</table>');
    }
    o.push('<h2>Liczby</h2><table>');
    [['Droga życia', n.droga, 'dz'], ['Ekspresja', n.ekspresja, 'ex'], ['Potrzeba serca', n.serce, 'se'], ['Wizerunek', n.wizerunek, 'wi']].forEach(function (x) { if (x[1]) o.push(tr(x[0] + ' · ' + x[1].w, h(S.LICZBY[x[1].w][x[2]]) + '<br><small>' + h(x[1].opis) + '</small>')); });
    if (n.dzien) o.push(tr('Dzień urodzenia · ' + n.dzien.surowy, h(S.LICZBY[n.dzien.w].dn)));
    o.push('</table>');
    if (w.niebo) {
      o.push('<h2>Niebo</h2><table>');
      if (w.niebo.asc != null) { var za = S.ZNAKI[Math.floor(w.niebo.asc / 30)]; o.push(tr('Ascendent · ' + za.n + ' ' + S.pl(w.niebo.asc % 30, 1) + '°', 'Na wejściu widać kogoś, kto działa ' + h(za.styl) + '.')); }
      w.niebo.ciala.forEach(function (x) {
        if (x.c.pok) return;
        if (x.warianty.length > 1) o.push(tr(x.c.n + ' · ' + x.warianty.map(function (z) { return S.ZNAKI[z].n; }).join(' lub '), h(x.c.rola) + ' <small>Tego dnia zmienia znak – potrzebna godzina urodzenia.</small>'));
        else o.push(tr(x.c.n + ' · ' + S.ZNAKI[x.znak].n + ' ' + S.pl(x.st, 1) + '°' + (x.wstecz ? ' ℞' : ''), h(x.c.rola) + ' ' + h(S.tekstCiala(x.c, S.ZNAKI[x.znak]))));
      });
      w.niebo.aspekty.slice(0, 4).forEach(function (a) { o.push(tr(a.a.n + ' / ' + a.b.n + ' · ' + a.asp.n, 'Temat: ' + h(a.a.t) + ' i ' + h(a.b.t) + '. ' + h(a.asp.cz))); });
      o.push('</table>');
    }
    if (w.karty.uklad.length) {
      o.push('<h2>Karty</h2><table>');
      w.karty.uklad.forEach(function (u) { o.push(tr(h(u.k.n) + (u.odw ? ' (odwrócona)' : '') + '<br><small>' + u.poz.tyt + '</small>', h(u.odczyt) + '<br><small>' + h(u.k.obraz) + ' ' + h(u.k.pyt) + '</small>')); });
      w.karty.watki.forEach(function (t) { o.push(tr('Wspólny wątek', h(t))); });
      o.push('</table>');
    }
    var p = w.portret;
    if (p && p.pary.length) {
      o.push('<h2>Portret</h2><div class="r-ramka"><p><strong>Bliskość złotej proporcji · ' + proc(p.srednia) + '</strong>' + (p.sym ? ' &nbsp;·&nbsp; <strong>Symetria w kadrze · ' + proc(p.sym.w) + '</strong>' : '') + '</p><p><small>Zmierzono ' + p.pary.length + ' z ' + S.PROPORCJE.length + ' proporcji, w granicach ±5% wzorca: ' + p.wProgu + '. Najbliżej wzorca: ' + h(p.najblizej.pr.n) + '.</small></p></div><table>');
      p.pary.forEach(function (x) { o.push(tr(h(x.pr.n), S.pl(x.v, 3) + ' / wzorzec ' + S.pl(x.pr.wz, 3) + ' · odchylenie ' + S.pl(x.odch * 100, 1) + '% · bliskość ' + proc(x.blisk))); });
      p.opisy.forEach(function (x) { o.push(tr(x.n, h(x.t))); });
      o.push('</table>');
    }
    o.push('<p class="r-stopka">Symboliczny odczyt rozrywkowy – punkt wyjścia do rozmowy, nie diagnoza ani prognoza. Numerologia pitagorejska · zodiak tropikalny (Astronomy Engine) · talia Rider–Waite–Smith · pomiar jednego zdjęcia. Wygenerowano ' + new Date().toLocaleDateString('pl-PL') + ' · © WOJTEL Wojciech Wieczorek.</p>');
    $('raport').innerHTML = o.join('');
  }
  $('btnPdf').addEventListener('click', function () {
    budujRaport();
    var stary = document.title; document.title = 'Raport – ' + stan.wynik.f.imie;
    var img = $('raport').querySelector('img');
    var druk = function () { window.print(); document.title = stary; };
    if (img && !img.complete) img.onload = druk; else setTimeout(druk, 50);
  });
  S._budujRaport = budujRaport;

  /* ---------- Reszta ---------- */
  function metody() { $('metody').showModal(); }
  $('btnMetody').addEventListener('click', metody); $('btnMetody2').addEventListener('click', metody);
  $('btnPelny').addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });
  window.addEventListener('resize', function () { if (stan.widok === 'portret') odswiezPortret(); });
  naZywo();
})(window.Skan);
