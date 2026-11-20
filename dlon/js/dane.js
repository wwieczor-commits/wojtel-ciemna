/* © 2026 Wojciech Wieczorek i Anna Mikos. Wszelkie prawa zastrzeżone. */
/* Znaczenia chiromantyczne i budowa odczytu. Opisy według tradycji zachodniej chiromancji (m.in. Cheiro, W. Benham, d'Arpentigny). */

const proc = x => Math.round(x * 100) + '%';
const MIESIACE = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

export const ZYWIOLY = {
  ziemia: { n: 'Ziemia', znak: '🜃', ksztalt: 'kwadratowa dłoń, krótsze palce', haslo: 'Budowniczy', kolor: 'zieleń butelkowa', dzien: 'sobota', planeta: 'Saturn',
    opis: 'Dłoń Ziemi należy do ludzi konkretu. Cenisz to, co da się dotknąć, sprawdzić i doprowadzić do końca. Inni przychodzą do Ciebie, kiedy trzeba coś naprawić, policzyć albo po prostu wytrwać.',
    cien: 'Uważaj na upór: nie wszystko, co nowe, jest zagrożeniem.',
    rada: 'Zaplanuj jedną rzecz, którą zrobisz inaczej niż zwykle. Dłoń Ziemi rośnie, gdy pozwala sobie na mały eksperyment.' },
  powietrze: { n: 'Powietrze', znak: '🜁', ksztalt: 'kwadratowa dłoń, długie palce', haslo: 'Posłaniec', kolor: 'błękit', dzien: 'środa', planeta: 'Merkury',
    opis: 'Dłoń Powietrza to dłoń umysłu i rozmowy. Szybko łączysz fakty, lubisz pytać „a dlaczego?” i źle znosisz nudę. Twoją walutą są pomysły i kontakty.',
    cien: 'Uważaj na życie wyłącznie w głowie: myśl potrzebuje ciała i odpoczynku.',
    rada: 'Zapisz pomysł, który wraca do Ciebie od tygodni, i powiedz o nim jednej osobie. Słowo wypowiedziane zaczyna działać.' },
  ogien: { n: 'Ogień', znak: '🜂', ksztalt: 'wydłużona dłoń, krótsze palce', haslo: 'Odkrywca', kolor: 'czerwień i złoto', dzien: 'wtorek', planeta: 'Mars',
    opis: 'Dłoń Ognia zdradza energię, zapał i potrzebę działania. Zarażasz innych entuzjazmem, decydujesz szybko i wolisz spróbować niż rozważać w nieskończoność.',
    cien: 'Uważaj na słomiany zapał: ogień, którego nikt nie podsyca, gaśnie w połowie drogi.',
    rada: 'Wybierz jedną sprawę i doprowadź ją do końca, zanim zaczniesz następną. Twoja siła mnoży się, gdy jest skupiona.' },
  woda: { n: 'Woda', znak: '🜄', ksztalt: 'wydłużona dłoń, długie palce', haslo: 'Intuicjonista', kolor: 'granat i srebro', dzien: 'poniedziałek', planeta: 'Księżyc',
    opis: 'Dłoń Wody należy do ludzi wrażliwych i intuicyjnych. Wyczuwasz nastroje, zanim ktokolwiek je nazwie, a decyzje podejmujesz sercem. Masz wyobraźnię, której inni Ci zazdroszczą.',
    cien: 'Uważaj na cudze emocje: nie wszystko, co czujesz, jest Twoje.',
    rada: 'Zaufaj pierwszemu przeczuciu w sprawie, którą odkładasz. Woda wie, którędy płynąć, zanim zobaczy koryto.' }
};

/* ---------- Miary indywidualne ----------
   Każdą dłoń opisujemy zestawem liczb (długości, kąty, odstępy, gęstość rysunku). Zamiast sztywnych progów porównujemy je
   ze skalą, która uczy się z dłoni zeskanowanych na tym urządzeniu – dzięki temu odczyt pokazuje, czym TA dłoń różni się od innych. */
const PRZED = { // punkt wyjścia skali: [średnia, odchylenie]
  s_dl: [0.8, 0.12], s_wznios: [0.2, 0.1], s_wys: [0.2, 0.04], s_krzyw: [0.07, 0.03],
  g_dl: [0.75, 0.12], g_spadek: [0.3, 0.1], g_krzyw: [0.06, 0.03], g_odstep: [0.15, 0.1],
  z_luk: [0.4, 0.07], z_dl: [0.85, 0.12],
  s_udz: [0.34, 0.05], g_udz: [0.33, 0.05], z_udz: [0.33, 0.05], l_sila: [0.5, 0.3], czw: [0.2, 0.04],
  st_wenus: [0.1, 0.05], st_ksiezyc: [0.1, 0.05], st_mars: [0.1, 0.05], st_palce: [0.1, 0.05],
  ksztalt: [1.75, 0.2], palce: [0.93, 0.05], wsk: [0.97, 0.04], maly: [0.79, 0.04], kciuk: [0.64, 0.05]
};
const KLUCZ_SKALI = 'dlon.skala.v1', WAGA = 3;
const pamiec = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } };
function wczytajSkale() { try { const p = pamiec(); return (p && JSON.parse(p.getItem(KLUCZ_SKALI))) || {}; } catch (e) { return {}; } }
function dopiszDoSkali(m) {
  const p = pamiec(); if (!p) return; const sk = wczytajSkale();
  Object.keys(PRZED).forEach(k => { if (m[k] == null || !isFinite(m[k])) return; const st = sk[k] || (sk[k] = { n: 0, s: 0, q: 0 }); st.n++; st.s += m[k]; st.q += m[k] * m[k]; if (st.n > 80) { st.n /= 2; st.s /= 2; st.q /= 2; } });
  try { p.setItem(KLUCZ_SKALI, JSON.stringify(sk)); } catch (e) { /* brak miejsca – trudno */ }
}
function odchylenia(m, sk) {
  const z = {};
  Object.keys(PRZED).forEach(k => { if (m[k] == null || !isFinite(m[k])) return; const [pm, ps] = PRZED[k], st = sk[k] || { n: 0, s: 0, q: 0 }, n = WAGA + st.n;
    const sr = (WAGA * pm + st.s) / n, war = (WAGA * (ps * ps + pm * pm) + st.q) / n - sr * sr, sd = Math.max(Math.sqrt(Math.max(war, 0)), ps * 0.4);
    z[k] = Math.max(-2.5, Math.min(2.5, (m[k] - sr) / sd)); });
  return z;
}
const poziom = z => z == null ? 1 : z < -0.45 ? 0 : z > 0.45 ? 2 : 1;

function krzywizna(p) {
  const a = p[0], b = p[p.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], c = Math.hypot(dx, dy) || 1; let naj = 0;
  p.forEach(q => { naj = Math.max(naj, Math.abs(dy * (q[0] - a[0]) - dx * (q[1] - a[1])) / c); });
  return naj / c;
}
export function miary(w, g) {
  const L = w.linie, m = {}, odc = l => l.pkt.slice(l.i0, l.i1 + 1);
  if (L.serce.jest) { const p = odc(L.serce), a = p[0], b = p[p.length - 1], dx = Math.max(8, Math.abs(b[0] - a[0]));
    m.s_dl = L.serce.dl; m.s_wznios = (a[1] - b[1]) / dx; m.s_wys = (p.reduce((s, q) => s + q[1], 0) / p.length - 208) / 186; m.s_krzyw = krzywizna(p); }
  if (L.glowa.jest) { const p = odc(L.glowa), a = p[0], b = p[p.length - 1], dx = Math.max(8, Math.abs(b[0] - a[0]));
    m.g_dl = L.glowa.dl; m.g_spadek = (b[1] - a[1]) / dx; m.g_krzyw = krzywizna(p);
    if (L.zycie.jest) { let odl = 1e9; odc(L.zycie).slice(0, 50).forEach(q => { odl = Math.min(odl, Math.hypot(q[0] - a[0], q[1] - a[1])); }); m.g_odstep = (odl + L.glowa.i0) / 138; } }
  if (L.zycie.jest) { let minX = 999; odc(L.zycie).forEach(q => { minX = Math.min(minX, q[0]); }); m.z_luk = (246 - minX) / 138; m.z_dl = L.zycie.dl; }
  const sila = k => L[k].jest ? L[k].moc * (0.5 + L[k].dl) : 0, suma = sila('serce') + sila('glowa') + sila('zycie');
  if (suma > 0) { m.s_udz = sila('serce') / suma; m.g_udz = sila('glowa') / suma; m.z_udz = sila('zycie') / suma; }
  const glowne = ['serce', 'glowa', 'zycie'].filter(k => L[k].jest), srMoc = glowne.length ? glowne.reduce((a, k) => a + L[k].moc, 0) / glowne.length : 1;
  m.l_sila = L.los.jest ? L.los.dl * L.los.moc / srMoc : 0;
  if (L.serce.jest && L.glowa.jest) { const ys = {}; odc(L.serce).forEach(q => { ys[q[0]] = q[1]; }); let s = 0, n = 0; odc(L.glowa).forEach(q => { if (ys[q[0]] != null) { s += q[1] - ys[q[0]]; n++; } }); if (n > 10) m.czw = s / n / 186; }
  if (w.strefy) Object.keys(w.strefy).forEach(k => { m['st_' + k] = w.strefy[k]; });
  m.ksztalt = g.ksztalt; m.palce = g.palceDoDloni; m.wsk = g.wskDoSerd; m.maly = g.malyDoSerd; m.kciuk = g.kciukDoDloni;
  return m;
}

/* Opisy: [poniżej typowego, typowo, powyżej typowego]. */
const OPIS = {
  s_dl: ['Jest krótsza niż u większości dłoni – w uczuciach liczy się dla Ciebie konkret i mały, sprawdzony krąg ludzi.', 'Ma typową długość – w relacjach dajesz i bierzesz po równo.', 'Jest wyjątkowo długa – stawiasz bliskim wysoko poprzeczkę i dajesz z siebie bardzo dużo; lojalność jest dla Ciebie świętością.'],
  s_wznios: ['Biegnie niemal poziomo – uczucia trzymasz pod kontrolą i okazujesz je czynami, nie słowami.', 'Wznosi się łagodnie ku palcom – łączysz ciepło z rozsądkiem i umiesz kochać, nie tracąc siebie.', 'Wyraźnie wspina się ku palcom – serce masz na dłoni: mówisz, co czujesz, i tego samego oczekujesz od innych.'],
  s_wys: ['Leży wysoko, tuż pod palcami – emocje szybko wychodzą na wierzch, reagujesz żywo i od razu.', '', 'Leży nisko, bliżej środka dłoni – zanim zaufasz, długo obserwujesz; za to przywiązujesz się na lata.'],
  s_krzyw: ['Jej rysunek jest prosty jak od linijki – w relacjach cenisz jasne zasady.', '', 'Ma mocny łuk – w miłości potrzebujesz ruchu, gestów i odrobiny teatru.'],
  g_dl: ['Jest krótka – decydujesz szybko, na podstawie tego, co istotne, i nie lubisz dzielić włosa na czworo. O inteligencji to nic nie mówi.', 'Ma średnią długość – bierzesz tyle teorii, ile potrzeba do działania.', 'Jest długa, sięga daleko w stronę krawędzi dłoni – lubisz rozumieć sprawy do końca i rzadko zadowalasz się pierwszą odpowiedzią.'],
  g_spadek: ['Biegnie prosto w poprzek dłoni – stąpasz twardo po ziemi, cenisz fakty i porządek.', 'Opada łagodnie – łączysz logikę z wyobraźnią: potrafisz i policzyć, i wymyślić.', 'Mocno opada ku nadgarstkowi, w stronę wzgórka Księżyca – myślisz obrazami i masz wyobraźnię twórcy.'],
  g_odstep: ['Zaczyna się razem z linią życia – ostrożność i przywiązanie do bliskich; decyzje dojrzewają u Ciebie powoli, ale są trwałe.', 'Zaczyna się tuż przy linii życia – rozwaga idzie u Ciebie w parze z samodzielnością.', 'Zaczyna się wyraźnie osobno od linii życia – wcześnie chodzisz własną drogą i nie pytasz o pozwolenie.'],
  g_krzyw: ['Jest prosta – myśl prowadzisz po linii, punkt po punkcie.', '', 'Faluje – Twoje zainteresowania przychodzą falami i każda coś po sobie zostawia.'],
  z_luk: ['Trzyma się blisko kciuka – gospodarujesz siłami rozważnie i najlepiej działasz we własnym rytmie, w znanym otoczeniu.', 'Zatacza umiarkowany łuk – wiesz, kiedy przyspieszyć, a kiedy odpuścić.', 'Zatacza szeroki łuk w głąb dłoni – witalność i apetyt na życie: ludzie, ruch, nowe miejsca.'],
  z_dl: ['Widać ją na krótszym odcinku niż zwykle – energię wydajesz zrywami, a po zrywie potrzebujesz ciszy.', '', 'Jest wyraźna aż do nadgarstka – masz równy, długodystansowy napęd.'],
  czw: ['Linie serca i głowy biegną blisko siebie (wąski czworobok) – skupiasz się na swoim i nie rozdajesz zaufania na prawo i lewo.', 'Odstęp między linią serca a linią głowy jest typowy – otwartość i ostrożność masz w równowadze.', 'Linie serca i głowy są szeroko rozstawione (szeroki czworobok) – otwarta głowa, tolerancja i hojność w ocenianiu innych.'],
  ksztalt: ['Dłoń szeroka i mocna – ręka człowieka czynu.', '', 'Dłoń smukła i wydłużona – ręka obserwatora i wrażliwca.'],
  palce: ['Krótkie palce – widzisz całość, szczegóły zostawiasz innym i działasz szybko.', 'Palce typowej długości – równowaga między ogółem a szczegółem.', 'Długie palce – cierpliwość do szczegółu i dokładność.'],
  wsk: ['Palec serdeczny wyraźnie dłuższy od wskazującego – przewaga Apolla: zamiłowanie do ryzyka, sceny i rzeczy pięknych.', 'Palce wskazujący i serdeczny w typowej proporcji – pewność siebie bez potrzeby dominowania.', 'Palec wskazujący wyjątkowo długi względem serdecznego – przewaga Jowisza: ambicja, potrzeba wpływu, naturalne przywództwo.'],
  maly: ['Krótszy mały palec – Merkury w cieniu: wolisz czyn od przemówień i szczerość od dyplomacji.', 'Mały palec typowej długości – mówisz tyle, ile trzeba.', 'Długi mały palec – mocny Merkury: dar słowa, handlu i szybkiej riposty.'],
  kciuk: ['Krótszy kciuk – łagodność: wolisz przekonać niż przeforsować.', 'Kciuk typowej długości – wola i takt w równowadze.', 'Długi kciuk – silna wola: gdy coś postanowisz, trudno Cię zawrócić.']
};
/* Nazwy znaków szczególnych: [poniżej, powyżej]. */
const ZNAK = {
  s_dl: ['krótka linia serca', 'wyjątkowo długa linia serca'], s_wznios: ['pozioma linia serca', 'linia serca wspinająca się ku palcom'], s_wys: ['wysoko położona linia serca', 'nisko położona linia serca'], s_krzyw: ['prosta jak struna linia serca', 'mocno wygięta linia serca'],
  g_dl: ['krótka linia głowy', 'długa linia głowy'], g_spadek: ['pozioma linia głowy', 'linia głowy opadająca ku Księżycowi'], g_odstep: ['linia głowy złączona z linią życia', 'linia głowy oddzielona od linii życia'], g_krzyw: ['prosta linia głowy', 'falująca linia głowy'],
  z_luk: ['linia życia blisko kciuka', 'szeroki łuk linii życia'], z_dl: ['krótko zarysowana linia życia', 'linia życia wyraźna do nadgarstka'], czw: ['wąski czworobok', 'szeroki czworobok'],
  ksztalt: ['szeroka, mocna dłoń', 'smukła, wydłużona dłoń'], palce: ['krótkie palce', 'długie palce'], wsk: ['dominujący palec serdeczny', 'dominujący palec wskazujący'], maly: ['krótki mały palec', 'długi mały palec'], kciuk: ['krótki kciuk', 'długi kciuk']
};
/* Zapowiedzi: [gdy cecha poniżej typowej, gdy powyżej]. */
const ZAPOWIEDZ = {
  s_dl: ['W uczuciach postaw na jedną, konkretną rozmowę zamiast wielu półsłówek – przyniesie ulgę obu stronom.', 'Ktoś doceni Twoją wierność bardziej, niż się spodziewasz. Padnie zdanie, na które czekasz – nie przerywaj, gdy ktoś będzie próbował je powiedzieć.'],
  s_wznios: ['Ktoś będzie chciał być bliżej, niż dotąd na to pozwalasz. Uchyl drzwi – nie stracisz wolności, zyskasz sojusznika.', 'Powiedz głośno, czego chcesz. Tym razem ktoś naprawdę Cię usłyszy.'],
  s_wys: ['Silna emocja z najbliższych dni okaże się dobrym doradcą – ale decyzję podejmij dzień później.', 'Znajomość, którą długo trzymasz na dystans, jest warta drugiego spojrzenia.'],
  s_krzyw: ['W relacjach nadchodzi czas jasnych ustaleń: co zostanie powiedziane wprost, to się utrzyma.', 'Czeka Cię niespodzianka od kogoś bliskiego – przyjmij ją bez pytania „po co”.'],
  g_dl: ['Okazja pojawi się nagle i będzie wymagała szybkiego „tak” – masz do tego dryg.', 'Ktoś poprosi Cię o opinię w ważnej sprawie; Twoja dokładność zostanie zauważona i wynagrodzona.'],
  g_spadek: ['Nadchodzi czas porządkowania: umowa, rachunek albo plan, który wreszcie się domknie.', 'Pomysł, który teraz wydaje się zabawą, może zamienić się w coś, za co ludzie zechcą zapłacić.'],
  g_odstep: ['Rada kogoś z rodziny okaże się w sprawach zawodowych cenniejsza niż opinia fachowca.', 'Samodzielna decyzja, której nikt Ci nie doradzał, okaże się jedną z najlepszych w tym roku.'],
  g_krzyw: ['Trzymaj się planu – prosta droga jest teraz najkrótsza.', 'Dwie pozornie odległe sprawy połączą się i dadzą Ci przewagę.'],
  z_luk: ['Najbliższy czas sprzyja domowi i sprawom, które od dawna czekają w szufladzie. Porządek wokół Ciebie zamieni się w spokój w głowie.', 'Przed Tobą wyjazd albo zaproszenie, które wyrwie Cię z rutyny. Zgódź się – wrócisz z czymś więcej niż zdjęciami.'],
  z_dl: ['Energia będzie przychodzić falami. Pierwszy dobry tydzień wykorzystaj na sprawę wymagającą odwagi, drugi przeznacz na odpoczynek.', 'Masz przed sobą długi, równy odcinek – dobry moment na przedsięwzięcie, które wymaga wytrwałości.']
};
const NEUTRALNE = {
  serce: 'Relacje wchodzą w ciepły, spokojny okres. Jedna rozmowa przy stole wyjaśni więcej niż miesiące domysłów.',
  glowa: 'Niewielka zmiana w codziennej pracy przyniesie większy efekt, niż zakładasz.',
  zycie: 'Siły masz teraz w równowadze – utrzymaj rytm snu i ruchu, a zapas energii wystarczy na coś nowego.'
};
const STREFY = {
  wenus: ['Wzgórek Wenus – u nasady kciuka', 'Najgęstszy rysunek drobnych linii masz u nasady kciuka. To obszar Wenus: zmysły, czułość, przywiązanie do domu i ludzi.', 'Dobre wieści przyjdą z domu albo od kogoś, z kim łączy Cię długa zażyłość.'],
  ksiezyc: ['Wzgórek Księżyca – krawędź dłoni naprzeciw kciuka', 'Najgęstszy rysunek drobnych linii masz przy krawędzi dłoni naprzeciw kciuka. To obszar Księżyca: wyobraźnia, sny, podróże i przeczucia.', 'Zwróć uwagę na sen albo przeczucie z najbliższych dni – i na propozycję związaną z drogą.'],
  mars: ['Równina Marsa – środek dłoni', 'Najgęstszy rysunek drobnych linii masz w środku dłoni. To równina Marsa: odwaga, wytrwałość i gotowość do stawania w swojej obronie.', 'Czeka Cię sytuacja, w której trzeba będzie postawić na swoim. Zrób to spokojnie – wygrasz samą pewnością.'],
  palce: ['Wzgórki pod palcami', 'Najgęstszy rysunek drobnych linii masz tuż pod palcami. To wzgórki Jowisza, Saturna, Apolla i Merkurego: ambicja, obowiązek, talent i słowo.', 'Ktoś zauważy Twoje umiejętności i powie o nich dalej. Nie umniejszaj swojej roli.']
};
const DOMINANTY = {
  serce: ['Serce prowadzi', 'Na tle innych dłoni najmocniej zapisana jest u Ciebie linia serca – najpierw czujesz, potem liczysz. Twoją siłą są ludzie.', 'W najbliższych tygodniach najwięcej wydarzy się między ludźmi: spotkanie, telefon albo wiadomość od kogoś, o kim dawno nie myślisz.'],
  glowa: ['Rozum prowadzi', 'Na tle innych dłoni najmocniej zapisana jest u Ciebie linia głowy – zanim zrobisz krok, chcesz rozumieć. Twoją siłą jest jasna myśl.', 'W najbliższych tygodniach kluczowa będzie jedna decyzja. Masz już wszystkie dane – brakuje tylko Twojego „tak”.'],
  zycie: ['Energia prowadzi', 'Na tle innych dłoni najmocniej zapisana jest u Ciebie linia życia – działasz, zanim inni skończą się zastanawiać. Twoją siłą jest napęd.', 'W najbliższych tygodniach poczujesz przypływ sił. Zacznij to, co odkładasz – pierwszy krok okaże się najtrudniejszy i najkrótszy.']
};
const LOS = [
  { skrot: 'niewidoczna – los w Twoich rękach', tekst: 'Linia losu nie występuje na każdej dłoni i jej brak nie jest złym znakiem. Chiromanci mówią, że to dłoń człowieka, który sam pisze swój scenariusz: zmienia zajęcia, próbuje, nie trzyma się jednej ścieżki z obowiązku.', wrozba: 'Nic nie jest przesądzone – i to dobra wiadomość. Zmiana, o której myślisz, zależy wyłącznie od Twojej decyzji; nikt nie musi wyrazić na nią zgody.' },
  { skrot: 'delikatna, zarysowana fragmentami', tekst: 'Delikatna linia losu pokazuje drogę, która dopiero się krystalizuje. Masz kilka talentów i jeszcze nie stawiasz wszystkiego na jeden. Tradycja mówi, że taka linia pogłębia się, gdy człowiek znajduje pracę, którą lubi.', wrozba: 'W najbliższych miesiącach jedna z pobocznych spraw zacznie rosnąć szybciej niż główna. Obserwuj, co przychodzi Ci łatwo – tam jest kierunek.' },
  { skrot: 'mocna, biegnie ku palcowi środkowemu', tekst: 'Wyraźna linia losu, biegnąca środkiem dłoni ku palcowi środkowemu, oznacza silne poczucie kierunku. Wiesz, po co wstajesz rano, a obowiązki traktujesz poważnie. Ludzie z taką linią często wcześnie znajdują swoje zajęcie.', wrozba: 'Wysiłek z ostatnich miesięcy zaczyna procentować. Pojawi się propozycja większej odpowiedzialności – przyjmij ją na własnych warunkach.' }
];
const przerwyTxt = n => n === 0 ? 'ciągła' : n === 1 ? '1 przerwa' : n + ' przerwy';
const stopnie = t => Math.round(Math.atan(t) * 180 / Math.PI) + '°';
const naTle = z => z == null ? '–' : z > 1.2 ? 'dużo powyżej typowej' : z > 0.45 ? 'powyżej typowej' : z < -1.2 ? 'dużo poniżej typowej' : z < -0.45 ? 'poniżej typowej' : 'typowa';
const BRAK = {
  serce: 'Kamera nie uchwyciła wyraźnej linii serca. W tradycji delikatna linia serca oznacza osobę, która uczucia chroni i pokazuje je tylko wybranym. Spróbuj w mocniejszym, bocznym świetle – bruzdy rzucą wtedy cień.',
  glowa: 'Kamera nie uchwyciła wyraźnej linii głowy. Tradycja mówi, że delikatna linia głowy należy do osób, które myślą obrazami i przeczuciami, a nie punktami na liście.',
  zycie: 'Kamera nie uchwyciła wyraźnej linii życia. To nic nie znaczy dla zdrowia ani długości życia – linia życia mówi o stylu działania, nie o latach. Spróbuj w lepszym świetle.'
};

function opisLinii(k, klucze, L, m, z, pomiary) {
  if (!L[k].jest) return { skrot: 'słabo widoczna', pomiary: [], tekst: BRAK[k], wrozba: NEUTRALNE[k] };
  const zdania = klucze.map(q => OPIS[q][poziom(z[q])]).filter(Boolean);
  if (L[k].przerwy) zdania.push(k === 'zycie' ? 'Przerwa na linii to w tradycji zmiana kierunku: przeprowadzka, nowy zawód, nowy rozdział – nie zagrożenie.' : 'Przerwy na linii tradycja czyta jako rozdziały: coś się zamknęło i zrobiło miejsce na nowe.');
  if (k === 'zycie') zdania.push('Wbrew obiegowej opinii długość tej linii nie mówi o długości życia, tylko o stylu działania.');
  /* Wróżbę wybiera cecha, którą ta linia najbardziej odstaje od typowej. */
  let naj = null; klucze.forEach(q => { if (ZAPOWIEDZ[q] && z[q] != null && (!naj || Math.abs(z[q]) > Math.abs(z[naj]))) naj = q; });
  const wyrazna = naj && Math.abs(z[naj]) >= 0.45;
  const skroty = klucze.filter(q => ZNAK[q] && poziom(z[q]) !== 1).sort((a, b) => Math.abs(z[b]) - Math.abs(z[a])).slice(0, 2).map(q => ZNAK[q][z[q] > 0 ? 1 : 0]);
  return { skrot: skroty.length ? skroty.join('; ') : 'typowy przebieg, bez skrajności', pomiary, tekst: zdania.join(' '), wrozba: wyrazna ? ZAPOWIEDZ[naj][z[naj] > 0 ? 1 : 0] : NEUTRALNE[k] };
}

/* Cały odczyt: struktura wspólna dla ekranu i raportu PDF. */
export function zbudujOdczyt(wynik, geo, reka, opcje = {}) {
  const dzis = opcje.dzis || new Date(), L = wynik.linie;
  const m = miary(wynik, geo), z = odchylenia(m, wczytajSkale());
  if (opcje.ucz !== false) dopiszDoSkali(m);

  const zyw = ZYWIOLY[(z.ksztalt || 0) >= 0 ? ((z.palce || 0) >= 0 ? 'woda' : 'ogien') : ((z.palce || 0) >= 0 ? 'powietrze' : 'ziemia')];
  const udz = k => (z[k] == null ? -9 : z[k]), dk = [['serce', udz('s_udz')], ['glowa', udz('g_udz')], ['zycie', udz('z_udz')]].sort((a, b) => b[1] - a[1])[0][0], dom = DOMINANTY[dk];
  const sk = Object.keys(STREFY).filter(k => z['st_' + k] != null).sort((a, b) => z['st_' + b] - z['st_' + a])[0] || 'mars', strefa = STREFY[sk];

  const linie = {
    serce: opisLinii('serce', ['s_dl', 's_wznios', 's_wys', 's_krzyw'], L, m, z, L.serce.jest ? [['Widoczna długość', Math.round(m.s_dl * 100) + '% (' + naTle(z.s_dl) + ')'], ['Wznios ku palcom', stopnie(m.s_wznios) + ' (' + naTle(z.s_wznios) + ')'], ['Położenie', ['wysoko, pod palcami', 'typowe', 'nisko, bliżej środka'][poziom(z.s_wys)]], ['Wygięcie łuku', Math.round(m.s_krzyw * 100) + '% długości'], ['Siła na tle pozostałych linii', Math.round((m.s_udz || 0) * 100) + '%'], ['Ciągłość', przerwyTxt(L.serce.przerwy)]] : []),
    glowa: opisLinii('glowa', ['g_dl', 'g_spadek', 'g_odstep', 'g_krzyw'], L, m, z, L.glowa.jest ? [['Widoczna długość', Math.round(m.g_dl * 100) + '% (' + naTle(z.g_dl) + ')'], ['Spadek ku nadgarstkowi', stopnie(m.g_spadek) + ' (' + naTle(z.g_spadek) + ')'], ['Początek względem linii życia', m.g_odstep == null ? '–' : ['złączona', 'tuż obok', 'osobno'][poziom(z.g_odstep)]], ['Falowanie', Math.round(m.g_krzyw * 100) + '% długości'], ['Siła na tle pozostałych linii', Math.round((m.g_udz || 0) * 100) + '%'], ['Ciągłość', przerwyTxt(L.glowa.przerwy)]] : []),
    zycie: opisLinii('zycie', ['z_luk', 'z_dl'], L, m, z, L.zycie.jest ? [['Szerokość łuku', Math.round(m.z_luk * 100) + '% szerokości dłoni (' + naTle(z.z_luk) + ')'], ['Widoczna długość', Math.round(m.z_dl * 100) + '% (' + naTle(z.z_dl) + ')'], ['Siła na tle pozostałych linii', Math.round((m.z_udz || 0) * 100) + '%'], ['Ciągłość', przerwyTxt(L.zycie.przerwy)]] : [])
  };
  const pl = !L.los.jest ? 0 : poziom(z.l_sila) === 2 ? 2 : (m.l_sila < 0.12 ? 0 : 1), los = LOS[pl];
  linie.los = { skrot: los.skrot, tekst: los.tekst, wrozba: los.wrozba, pomiary: pl === 0 ? [['Obecność', 'brak wyraźnej linii']] : [['Obecność', pl === 2 ? 'wyraźna' : 'delikatna'], ['Widoczna długość', Math.round(L.los.dl * 100) + '%'], ['Siła względem linii głównych', Math.round(m.l_sila * 100) + '%'], ['Ciągłość', przerwyTxt(L.los.przerwy)]] };

  /* Znaki szczególne: cechy, którymi ta dłoń najbardziej odstaje od typowej. */
  const znaki = Object.keys(ZNAK).filter(k => z[k] != null && Math.abs(z[k]) >= 0.45).sort((a, b) => Math.abs(z[b]) - Math.abs(z[a])).slice(0, 3)
    .map(k => [ZNAK[k][z[k] > 0 ? 1 : 0], OPIS[k][z[k] > 0 ? 2 : 0]]);

  const c = { dominanta: dk };
  ['serce', 'glowa', 'zycie', 'los'].forEach(k => { c[k] = { jest: L[k].jest, moc: L[k].moc, dl: L[k].dl, przerwy: L[k].przerwy || 0 }; });
  c.czytelnosc = Math.min(1, ['serce', 'glowa', 'zycie'].filter(k => L[k].jest).reduce((a, k) => a + Math.min(1, L[k].dl / 0.6) * Math.min(1, L[k].moc / 1.1), 0) / 3);

  const przerwy = c.serce.przerwy + c.glowa.przerwy + c.zycie.przerwy;
  const tygodnie = (znaki.length ? 'Najmocniejszy znak tej dłoni to ' + znaki[0][0] + '. ' : '')
    + (przerwy >= 2 ? 'Rysunek linii pokazuje czas przejścia: coś się domyka, żeby mogło zacząć się nowe. ' : '') + dom[2] + ' ' + strefa[2];
  /* Ziarno „szczęśliwych” znaków liczymy z samych pomiarów (zgrubnie zaokrąglonych), żeby ta sama dłoń dostawała to samo. */
  const q = (x, krok) => x == null ? 0 : Math.round(x / krok);
  const ziarno = Math.abs(q(geo.ksztalt, 0.3) + 3 * q(m.s_wznios, 0.2) + 5 * q(m.g_spadek, 0.2) + 7 * q(m.z_luk, 0.12) + 11 * q(m.czw, 0.07));
  const reka2 = reka === 'prawa' ? 'To prawa dłoń. U osób praworęcznych tradycja nazywa ją dłonią czynną: pokazuje, co robisz ze swoim życiem (lewa – z czym przychodzisz na świat).'
    : reka === 'lewa' ? 'To lewa dłoń. U osób praworęcznych tradycja nazywa ją dłonią bierną: pokazuje wrodzone skłonności i potencjał (prawa – to, co z nim robisz).' : '';
  return {
    cechy: c, miary: m, odchylenia: z, zywiol: zyw, dominanta: dom, linie, znaki, reka: reka2,
    czworobok: m.czw == null ? null : [Math.round(m.czw * 100) + '% długości dłoni', OPIS.czw[poziom(z.czw)]],
    strefa: [strefa[0], strefa[1]],
    palce: ['wsk', 'maly', 'kciuk', 'palce'].map(k => OPIS[k][poziom(z[k])]).filter(Boolean),
    tytul: 'Dłoń ' + { Ziemia: 'Ziemi', Powietrze: 'Powietrza', Ogień: 'Ognia', Woda: 'Wody' }[zyw.n] + ' · ' + zyw.haslo,
    przepowiednia: [
      ['Najbliższe tygodnie', tygodnie],
      ['Miłość i relacje', linie.serce.wrozba],
      ['Praca i pieniądze', linie.glowa.wrozba + (pl === 2 ? ' Mocna linia losu wzmacnia tę zapowiedź.' : '')],
      ['Energia i droga', linie.zycie.wrozba],
      ['Los', linie.los.wrozba]
    ],
    rada: zyw.rada,
    szczescie: [['Mocny miesiąc', MIESIACE[(dzis.getMonth() + 1 + ziarno % 5) % 12]], ['Dzień', ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'][ziarno % 7]], ['Liczba', String(1 + ziarno % 9)], ['Kolor', zyw.kolor], ['Patron dłoni', zyw.planeta]]
  };
}

export const METODY = [
  ['Jak czytamy dłoń', 'Model wykrywania dłoni (MediaPipe Hand Landmarker, licencja Apache 2.0) wyznacza 21 punktów szkieletu. Zanim zaczniemy czytać, sprawdzamy, czy kamera widzi wnętrze dłoni, a nie grzbiet: model rozpoznaje lewą i prawą rękę, a układ punktów mówi, którą stroną jest zwrócona. Na ich podstawie prostujemy obraz dłoni do układu wzorcowego i uśredniamy kilkadziesiąt klatek. Bruzdy to miejsca ciemniejsze od otoczenia; cztery linie główne śledzimy algorytmem najsilniejszej ścieżki w obszarach, w których występują anatomicznie.'],
  ['Tożsamość i biometria', 'W kryminalistyce i biometrii porównuje się odbitki dłoni (palmprint): przebieg bruzd zgięciowych, drobne linie i listewki skórne w rozdzielczości 500 dpi i większej. Tu liczymy uproszczony kod orientacji bruzd w 224 polach dłoni. To pokaz zasady działania – kamera laptopa lub telefonu nie widzi listewek skórnych, więc wynik nie nadaje się do identyfikacji osób.'],
  ['Odczyt indywidualny', 'Każdą dłoń opisujemy ponad dwudziestoma liczbami: długością, nachyleniem i wygięciem linii, odstępami między nimi, gęstością drobnych linii w czterech obszarach dłoni i proporcjami palców. Oceniamy je nie według sztywnych progów, lecz na tle dłoni zeskanowanych wcześniej na tym urządzeniu – odczyt mówi więc, czym ta dłoń różni się od innych. Skala to same średnie (bez obrazów i bez danych osób) i jest zapisana tylko w tej przeglądarce; pierwsze kilka odczytów opiera się na wartościach wyjściowych.'],
  ['Symbolika', 'Znaczenia linii i kształtów dłoni pochodzą z tradycji chiromancji zachodniej (Cheiro, William Benham, Casimir d\'Arpentigny). Chiromancja nie ma potwierdzenia naukowego. Przepowiednie są zabawą i pretekstem do rozmowy, nie poradą życiową, zdrowotną ani finansową.'],
  ['Prywatność', 'Obraz z kamery jest analizowany wyłącznie w przeglądarce. Nic nie jest wysyłane na serwer. Zapamiętane dłonie trzymane są tylko w pamięci tej przeglądarki i można je w każdej chwili usunąć.']
];

/* Źródła: co o liniach dłoni mówi nauka, a co tradycja. */
export const ZRODLA = {
  wstep: 'Nauka nie potwierdza, że z linii dłoni da się przewidzieć przyszłość – nie ma badań, które by to wykazały. Bada natomiast same linie: jak powstają, czym różnią się między ludźmi i jak po nich rozpoznać osobę. Poniżej rozdzielamy jedno od drugiego.',
  nauka: [
    ['Jak powstają linie dłoni', 'Bruzdy zgięciowe dłoni tworzą się w życiu płodowym, mniej więcej do 12.–15. tygodnia ciąży, i pozostają na całe życie. Ich układ zależy od genów i ruchów ręki płodu. Pojedyncza bruzda poprzeczna występuje u ok. 1,5% ludzi i częściej w niektórych zespołach genetycznych, ale sama niczego nie rozstrzyga.', 'MedlinePlus (U.S. National Library of Medicine), „Single palmar crease”, medlineplus.gov/ency/article/003290.htm'],
    ['Dłoń jako znak tożsamości', 'Układ linii dłoni jest inny u każdego człowieka, dlatego odbitki dłoni wykorzystuje się w biometrii i kryminalistyce. Nasz kod orientacji bruzd jest uproszczoną wersją metod opisanych w tych pracach.', 'D. Zhang, W.-K. Kong, J. You, M. Wong, „Online palmprint identification”, IEEE Transactions on Pattern Analysis and Machine Intelligence 25(9), 2003, s. 1041 i nast. · A. W.-K. Kong, D. Zhang, „Competitive coding scheme for palmprint verification”, ICPR 2004, s. 520–523, doi:10.1109/ICPR.2004.1334184'],
    ['Długość palców', 'Stosunek długości palca wskazującego do serdecznego (2D:4D) różni się przeciętnie u kobiet i mężczyzn. Hipoteza, że odzwierciedla poziom hormonów w życiu płodowym, jest w nauce sporna – późniejsze analizy dają wyniki mieszane.', 'J. T. Manning, D. Scutt, J. Wilson, D. I. Lewis-Jones, Human Reproduction 13(11), 1998, s. 3000–3004'],
    ['Linia życia a długość życia', 'Sprawdzano to na serio. Badanie z 1990 r. na 100 osobach wykazało związek, ale nowsze, staranniejsze pomiary go nie potwierdziły: długość linii życia nie mówi, jak długo ktoś będzie żył.', 'P. G. Newrick, E. Affie, R. J. M. Corrall, Journal of the Royal Society of Medicine 83, 1990 · T. Lucas, A. Dhugga, M. Henneberg, „Predicting longevity from the line of life: is it accurate?”, Anthropological Review 82(2), 2019']
  ],
  tradycja: [
    ['Znaczenia linii i wzgórków', 'Cheiro (William John Warner), „Cheiro\'s Language of the Hand”, 1894 · William G. Benham, „The Laws of Scientific Hand Reading”, 1900'],
    ['Typy dłoni i żywioły', 'Casimir S. d\'Arpentigny, „La Chirognomonie”, 1843; podział na dłonie Ziemi, Powietrza, Ognia i Wody upowszechnił Fred Gettings, „The Book of the Hand”, 1965']
  ]
};
