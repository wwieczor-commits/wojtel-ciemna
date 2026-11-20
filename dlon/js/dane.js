/* © 2026 Wojciech Wieczorek. Wszelkie prawa zastrzeżone. */
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

/* Progi geometrii (wartości z punktów szkieletu modelu). */
const PROG_KSZTALT = 1.95, PROG_PALCE = 0.93;

/* Cechy linii z pomiarów w układzie wzorcowym. */
export function cechyLinii(L) {
  const c = {};
  const s = L.serce; c.serce = { jest: s.jest };
  if (s.jest) { const a = s.pkt[s.i0], b = s.pkt[s.i1];
    c.serce.koniec = b[0] >= 214 ? 'wskazujacy' : b[0] >= 182 ? 'miedzy' : 'srodkowy';
    c.serce.luk = (a[1] - b[1]) > 16 ? 'wygieta' : 'prosta'; }
  const g = L.glowa; c.glowa = { jest: g.jest };
  if (g.jest) { const a = g.pkt[g.i0], b = g.pkt[g.i1], dx = Math.max(1, a[0] - b[0]);
    c.glowa.dlugosc = b[0] <= 128 ? 'dluga' : b[0] <= 166 ? 'srednia' : 'krotka';
    const sp = (b[1] - a[1]) / dx; c.glowa.spadek = sp > 0.36 ? 'opadajaca' : sp < 0.17 ? 'prosta' : 'lagodna';
    let odl = 99; if (L.zycie.jest) { const z = L.zycie; for (let i = z.i0; i <= Math.min(z.i1, z.i0 + 40); i++) odl = Math.min(odl, Math.hypot(z.pkt[i][0] - a[0], z.pkt[i][1] - a[1])); }
    c.glowa.poczatek = (odl < 14 && g.i0 < 30) ? 'zlaczona' : 'osobna'; }
  const z = L.zycie; c.zycie = { jest: z.jest };
  if (z.jest) { let minX = 999; for (let i = z.i0; i <= z.i1; i++) minX = Math.min(minX, z.pkt[i][0]);
    c.zycie.luk = minX <= 186 ? 'szeroki' : minX >= 202 ? 'waski' : 'sredni';
    c.zycie.dlugosc = z.dl >= 0.72 ? 'dluga' : z.dl >= 0.45 ? 'srednia' : 'krotka'; }
  const l = L.los; c.los = { jest: l.jest, sila: !l.jest || l.dl < 0.3 ? 'brak' : (l.dl >= 0.6 && l.moc > 0.95) ? 'mocna' : 'delikatna' };
  ['serce', 'glowa', 'zycie', 'los'].forEach(k => { const x = L[k]; c[k].glebia = !x.jest ? 'niewidoczna' : x.moc >= 1.25 ? 'gleboka' : x.moc >= 0.9 ? 'wyrazna' : 'delikatna'; c[k].przerwy = x.przerwy || 0; c[k].dl = x.dl; c[k].moc = x.moc; });
  let naj = 'serce'; ['glowa', 'zycie'].forEach(k => { if ((L[k].jest ? L[k].moc * (0.6 + L[k].dl) : 0) > (L[naj].jest ? L[naj].moc * (0.6 + L[naj].dl) : 0)) naj = k; });
  c.dominanta = naj;
  const widoczne = ['serce', 'glowa', 'zycie'].filter(k => L[k].jest);
  c.czytelnosc = Math.min(1, widoczne.reduce((a, k) => a + Math.min(1, L[k].dl / 0.6) * Math.min(1, L[k].moc / 1.1), 0) / 3);
  return c;
}

const GLEBIA = { gleboka: 'głęboka', wyrazna: 'wyraźna', delikatna: 'delikatna', niewidoczna: 'niewidoczna' };
const przerwyTxt = n => n === 0 ? 'ciągła' : n === 1 ? '1 przerwa' : n + ' przerwy';

function opisSerca(c) {
  if (!c.jest) return { skrot: 'słabo widoczna', pomiary: [], tekst: 'Kamera nie uchwyciła wyraźnej linii serca. W tradycji delikatna linia serca oznacza osobę, która uczucia chroni i pokazuje je tylko wybranym. Spróbuj w mocniejszym, bocznym świetle – bruzdy rzucą wtedy cień.', wrozba: 'W uczuciach nadchodzi spokojny czas: nic nie musi się dziać szybko. To, co ma zostać, zostanie.' };
  const kon = { wskazujacy: ['kończy się pod palcem wskazującym (wzgórek Jowisza)', 'Linia sięgająca pod palec wskazujący to znak idealisty: w miłości i przyjaźni stawiasz wysoko poprzeczkę i dajesz z siebie dużo. Lojalność jest dla Ciebie ważniejsza niż fajerwerki.'],
    miedzy: ['kończy się między palcem wskazującym a środkowym', 'Linia kończąca się między palcami wskazującym i środkowym uchodzi za najbardziej zrównoważoną: łączysz ciepło z rozsądkiem. Umiesz kochać i nie tracić przy tym siebie.'],
    srodkowy: ['kończy się pod palcem środkowym (wzgórek Saturna)', 'Linia kończąca się pod palcem środkowym mówi o niezależności w uczuciach. Potrzebujesz własnej przestrzeni, a bliskość budujesz czynami, nie deklaracjami.'] }[c.koniec];
  const luk = c.luk === 'wygieta' ? ['wygięta ku palcom', 'Jej wyraźny łuk oznacza otwartą ekspresję: łatwo mówisz o tym, co czujesz, i lubisz, gdy ktoś odpowiada tym samym.'] : ['prosta', 'Jej prosty przebieg oznacza powściągliwość: uczucia przeżywasz głęboko, ale okazujesz je po swojemu i we własnym tempie.'];
  const prz = c.przerwy ? ' Przerwy na linii tradycja czyta jako rozdziały: relacje, które coś zamknęły i zrobiły miejsce na nowe.' : '';
  const wr = c.koniec === 'wskazujacy' ? 'Ktoś doceni Twoją wierność bardziej, niż się spodziewasz. W najbliższym czasie padnie zdanie, na które czekasz – nie przerywaj, gdy ktoś będzie próbował je powiedzieć.'
    : c.koniec === 'miedzy' ? 'Relacje wchodzą w ciepły, spokojny okres. Jedna rozmowa przy stole wyjaśni więcej niż miesiące domysłów; osoby wolne mają szansę na znajomość, która zacznie się od śmiechu.'
    : 'Ktoś będzie chciał być bliżej, niż dotąd na to pozwalasz. Dłoń mówi: nie stracisz wolności, jeśli uchylisz drzwi – zyskasz sojusznika.';
  return { skrot: kon[0], pomiary: [['Zakończenie', kon[0]], ['Przebieg', luk[0]], ['Głębokość', GLEBIA[c.glebia]], ['Ciągłość', przerwyTxt(c.przerwy)], ['Widoczna długość', proc(c.dl)]], tekst: kon[1] + ' ' + luk[1] + prz, wrozba: wr + (c.luk === 'wygieta' ? ' Powiedz głośno, czego chcesz – tym razem ktoś naprawdę Cię usłyszy.' : ' Mały gest zrobi więcej niż wielkie słowa.') };
}
function opisGlowy(c) {
  if (!c.jest) return { skrot: 'słabo widoczna', pomiary: [], tekst: 'Kamera nie uchwyciła wyraźnej linii głowy. Tradycja mówi, że delikatna linia głowy należy do osób, które myślą obrazami i przeczuciami, a nie punktami na liście.', wrozba: 'W sprawach zawodowych nie spiesz się z decyzją: odpowiedź przyjdzie sama, gdy przestaniesz jej szukać.' };
  const dl = { dluga: ['długa – sięga pod palec serdeczny i dalej', 'Długa linia głowy to umysł analityczny: lubisz rozumieć sprawy do końca i rzadko zadowalasz się pierwszą odpowiedzią.'], srednia: ['średnia', 'Linia głowy średniej długości oznacza umysł praktyczny: bierzesz tyle teorii, ile potrzeba, żeby działać.'], krotka: ['krótka', 'Krótka linia głowy nie mówi nic o inteligencji – oznacza szybkie, konkretne decyzje i niechęć do dzielenia włosa na czworo.'] }[c.dlugosc];
  const sp = { opadajaca: ['opada ku wzgórkowi Księżyca', 'Opada wyraźnie w stronę nadgarstka: to znak wyobraźni i twórczego myślenia. Pomysły przychodzą do Ciebie obrazami.'], lagodna: ['łagodnie opadająca', 'Łagodny spadek łączy logikę z wyobraźnią: potrafisz i policzyć, i wymyślić.'], prosta: ['prosta, pozioma', 'Biegnie prosto przez dłoń: stąpasz twardo po ziemi, cenisz fakty i porządek.'] }[c.spadek];
  const po = c.poczatek === 'zlaczona' ? ['złączona z linią życia', 'Zaczyna się razem z linią życia – ostrożność i przywiązanie do bliskich; decyzje dojrzewają u Ciebie powoli, ale są trwałe.'] : ['oddzielona od linii życia', 'Zaczyna się osobno od linii życia – wczesna samodzielność i odwaga chodzenia własną drogą.'];
  const wr = (c.spadek === 'opadajaca' ? 'Pomysł, który teraz wydaje się zabawą, może zamienić się w coś, za co ludzie zechcą zapłacić. ' : c.spadek === 'prosta' ? 'Nadchodzi czas porządkowania: umowa, rachunek albo plan, który wreszcie się domknie. ' : 'Połączenie dwóch pozornie odległych spraw da Ci przewagę. ')
    + (c.dlugosc === 'krotka' ? 'Okazja pojawi się nagle i będzie wymagała szybkiego „tak” – masz do tego dryg.' : c.dlugosc === 'dluga' ? 'Ktoś poprosi Cię o opinię w ważnej sprawie; Twoja dokładność zostanie zauważona i wynagrodzona.' : 'Niewielka zmiana w codziennej pracy przyniesie większy efekt, niż zakładasz.');
  return { skrot: dl[0].split(' –')[0] + ', ' + sp[0], pomiary: [['Długość', dl[0]], ['Kierunek', sp[0]], ['Początek', po[0]], ['Głębokość', GLEBIA[c.glebia]], ['Ciągłość', przerwyTxt(c.przerwy)]], tekst: dl[1] + ' ' + sp[1] + ' ' + po[1], wrozba: wr };
}
function opisZycia(c) {
  if (!c.jest) return { skrot: 'słabo widoczna', pomiary: [], tekst: 'Kamera nie uchwyciła wyraźnej linii życia. To nic nie znaczy dla zdrowia ani długości życia – linia życia mówi o stylu działania, nie o latach. Spróbuj w lepszym świetle.', wrozba: 'Zadbaj o sen i rytm dnia: energia wróci szybciej, niż myślisz.' };
  const lk = { szeroki: ['szeroki łuk wokół kciuka', 'Szeroki łuk obejmujący wzgórek Wenus to znak witalności i apetytu na życie: lubisz ludzi, ruch i nowe miejsca.'], sredni: ['umiarkowany łuk', 'Umiarkowany łuk oznacza równowagę między działaniem a regeneracją: wiesz, kiedy przyspieszyć, a kiedy odpuścić.'], waski: ['wąski łuk blisko kciuka', 'Linia biegnąca blisko kciuka oznacza rozważne gospodarowanie siłami: najlepiej działasz we własnym rytmie i w znanym otoczeniu.'] }[c.luk];
  const dl = { dluga: 'długa i wyraźna na całej długości', srednia: 'średniej długości', krotka: 'widoczna na krótkim odcinku' }[c.dlugosc];
  const prz = c.przerwy ? ' Przerwa na linii to w tradycji zmiana kierunku: przeprowadzka, nowy zawód, nowy rozdział – nie zagrożenie.' : ' Ciągła linia mówi o stałym, równym napędzie.';
  const wr = c.luk === 'szeroki' ? 'Przed Tobą wyjazd albo zaproszenie, które wyrwie Cię z rutyny. Zgódź się – wrócisz z czymś więcej niż zdjęciami.'
    : c.luk === 'waski' ? 'Najbliższy czas sprzyja domowi i sprawom, które od dawna czekają w szufladzie. Porządek wokół Ciebie zamieni się w spokój w głowie.'
    : 'Energia będzie rosła falami. Wykorzystaj pierwszy dobry tydzień na sprawę wymagającą odwagi – drugi przeznacz na odpoczynek.';
  return { skrot: lk[0], pomiary: [['Łuk', lk[0]], ['Długość', dl], ['Głębokość', GLEBIA[c.glebia]], ['Ciągłość', przerwyTxt(c.przerwy)]], tekst: lk[1] + ' Linia jest ' + dl + '.' + prz + ' Wbrew obiegowej opinii długość tej linii nie mówi o długości życia, tylko o jego intensywności.', wrozba: wr };
}
function opisLosu(c) {
  if (c.sila === 'brak') return { skrot: 'niewidoczna – los w Twoich rękach', pomiary: [['Obecność', 'brak wyraźnej linii']], tekst: 'Linia losu nie występuje na każdej dłoni i jej brak nie jest złym znakiem. Chiromanci mówią, że to dłoń człowieka, który sam pisze swój scenariusz: zmienia zajęcia, próbuje, nie trzyma się jednej ścieżki z obowiązku.', wrozba: 'Nic nie jest przesądzone – i to dobra wiadomość. Zmiana, o której myślisz, zależy wyłącznie od Twojej decyzji; nikt nie musi wyrazić na nią zgody.' };
  if (c.sila === 'mocna') return { skrot: 'mocna, biegnie ku palcowi środkowemu', pomiary: [['Obecność', 'wyraźna'], ['Głębokość', GLEBIA[c.glebia]], ['Widoczna długość', proc(c.dl)], ['Ciągłość', przerwyTxt(c.przerwy)]], tekst: 'Wyraźna linia losu, biegnąca środkiem dłoni ku palcowi środkowemu, oznacza silne poczucie kierunku. Wiesz, po co wstajesz rano, a obowiązki traktujesz poważnie. Ludzie z taką linią często wcześnie znajdują swoje zajęcie.' + (c.przerwy ? ' Przerwy to świadome zmiany kursu.' : ''), wrozba: 'Wysiłek z ostatnich miesięcy zaczyna procentować. Pojawi się propozycja większej odpowiedzialności – przyjmij ją na własnych warunkach.' };
  return { skrot: 'delikatna, zarysowana fragmentami', pomiary: [['Obecność', 'delikatna'], ['Głębokość', GLEBIA[c.glebia]], ['Widoczna długość', proc(c.dl)]], tekst: 'Delikatna linia losu pokazuje drogę, która dopiero się krystalizuje. Masz kilka talentów i jeszcze nie stawiasz wszystkiego na jeden. Tradycja mówi, że taka linia pogłębia się, gdy człowiek znajduje pracę, którą lubi.', wrozba: 'W najbliższych miesiącach jedna z pobocznych spraw zacznie rosnąć szybciej niż główna. Obserwuj, co przychodzi Ci łatwo – tam jest kierunek.' };
}

const DOMINANTY = {
  serce: ['Serce prowadzi', 'Najmocniej zapisana jest linia serca – najpierw czujesz, potem liczysz. Twoją siłą są ludzie.'],
  glowa: ['Rozum prowadzi', 'Najmocniej zapisana jest linia głowy – zanim zrobisz krok, chcesz rozumieć. Twoją siłą jest jasna myśl.'],
  zycie: ['Energia prowadzi', 'Najmocniej zapisana jest linia życia – działasz, zanim inni skończą się zastanawiać. Twoją siłą jest napęd.']
};

function palceOpis(g) {
  const w = [];
  if (g.wskDoSerd > 1.03) w.push(['Palec wskazujący dłuższy od serdecznego', 'Przewaga Jowisza: ambicja, potrzeba wpływu, naturalne przywództwo.']);
  else if (g.wskDoSerd < 0.97) w.push(['Palec serdeczny dłuższy od wskazującego', 'Przewaga Apolla: zamiłowanie do ryzyka, sceny i rzeczy pięknych.']);
  else w.push(['Palce wskazujący i serdeczny równe', 'Równowaga Jowisza i Apolla: pewność siebie bez potrzeby dominowania.']);
  w.push(g.malyDoSerd > 0.80 ? ['Długi mały palec', 'Mocny Merkury: dar słowa, handlu i szybkiej riposty.'] : ['Krótszy mały palec', 'Merkury w cieniu: wolisz czyn od przemówień, a szczerość od dyplomacji.']);
  w.push(g.katKciuka > 48 ? ['Kciuk szeroko odstawiony', 'Niezależność i hojność: trudno Cię do czegoś zmusić.'] : ['Kciuk trzymany blisko dłoni', 'Ostrożność i takt: najpierw patrzysz, potem ufasz.']);
  w.push(g.rozstaw > 32 ? ['Palce szeroko rozstawione', 'Otwartość na nowe i potrzeba swobody.'] : ['Palce trzymane blisko siebie', 'Skupienie, porządek i rozwaga w wydatkach.']);
  return w;
}

/* Cały odczyt: struktura wspólna dla ekranu i raportu PDF. */
export function zbudujOdczyt(wynik, geo, reka, dzis = new Date()) {
  const c = cechyLinii(wynik.linie);
  const dluga = geo.ksztalt >= PROG_KSZTALT, palce = geo.palceDoDloni >= PROG_PALCE;
  const zyw = ZYWIOLY[dluga ? (palce ? 'woda' : 'ogien') : (palce ? 'powietrze' : 'ziemia')];
  const linie = { serce: opisSerca(c.serce), glowa: opisGlowy(c.glowa), zycie: opisZycia(c.zycie), los: opisLosu(c.los) };
  const dom = DOMINANTY[c.dominanta];
  const ziarno = Math.round(geo.ksztalt * 10) + Math.round(geo.wskDoSerd * 20) + Math.round(geo.malyDoSerd * 20);
  const mies = MIESIACE[(dzis.getMonth() + 1 + ziarno % 4) % 12];
  const przerwy = c.serce.przerwy + c.glowa.przerwy + c.zycie.przerwy;
  const tygodnie = (przerwy >= 2 ? 'Dłoń pokazuje czas przejścia: coś się domyka, żeby mogło zacząć się nowe. ' : 'Dłoń pokazuje spokojny, równy nurt – dobry moment, żeby budować, a nie gasić pożary. ')
    + { serce: 'W najbliższych tygodniach najwięcej wydarzy się między ludźmi: spotkanie, telefon albo wiadomość od kogoś, o kim dawno nie myślisz.', glowa: 'W najbliższych tygodniach kluczowa będzie jedna decyzja. Masz już wszystkie dane – brakuje tylko Twojego „tak”.', zycie: 'W najbliższych tygodniach poczujesz przypływ sił. Zacznij to, co odkładasz – pierwszy krok okaże się najtrudniejszy i najkrótszy.' }[c.dominanta];
  const reka2 = reka === 'prawa' ? 'To prawa dłoń. U osób praworęcznych tradycja nazywa ją dłonią czynną: pokazuje, co robisz ze swoim życiem (lewa – z czym przychodzisz na świat).'
    : reka === 'lewa' ? 'To lewa dłoń. U osób praworęcznych tradycja nazywa ją dłonią bierną: pokazuje wrodzone skłonności i potencjał (prawa – to, co z nim robisz).' : '';
  return {
    cechy: c, zywiol: zyw, dominanta: dom, linie, palce: palceOpis(geo), reka: reka2,
    tytul: 'Dłoń ' + { Ziemia: 'Ziemi', Powietrze: 'Powietrza', Ogień: 'Ognia', Woda: 'Wody' }[zyw.n] + ' · ' + zyw.haslo,
    przepowiednia: [
      ['Najbliższe tygodnie', tygodnie],
      ['Miłość i relacje', linie.serce.wrozba],
      ['Praca i pieniądze', linie.glowa.wrozba + ' ' + (c.los.sila === 'mocna' ? 'Linia losu wzmacnia tę zapowiedź.' : '')],
      ['Energia i droga', linie.zycie.wrozba],
      ['Los', linie.los.wrozba]
    ],
    rada: zyw.rada,
    szczescie: [['Mocny miesiąc', mies], ['Dzień', zyw.dzien], ['Liczba', String(1 + ziarno % 9)], ['Kolor', zyw.kolor], ['Patron dłoni', zyw.planeta]]
  };
}

export const METODY = [
  ['Jak czytamy dłoń', 'Model wykrywania dłoni (MediaPipe Hand Landmarker, licencja Apache 2.0) wyznacza 21 punktów szkieletu. Na ich podstawie prostujemy obraz dłoni do układu wzorcowego i uśredniamy kilkadziesiąt klatek. Bruzdy to miejsca ciemniejsze od otoczenia; cztery linie główne śledzimy algorytmem najsilniejszej ścieżki w obszarach, w których występują anatomicznie.'],
  ['Tożsamość i biometria', 'W kryminalistyce i biometrii porównuje się odbitki dłoni (palmprint): przebieg bruzd zgięciowych, drobne linie i listewki skórne w rozdzielczości 500 dpi i większej. Tu liczymy uproszczony kod orientacji bruzd w 224 polach dłoni. To pokaz zasady działania – kamera laptopa lub telefonu nie widzi listewek skórnych, więc wynik nie nadaje się do identyfikacji osób.'],
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
