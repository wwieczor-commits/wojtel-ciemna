/* © 2026 WOJTEL Wojciech Wieczorek. Wszelkie prawa zastrzeżone. */
/* Dane słownikowe panelu: motywy, liczby, znaki, karty, miejscowości. */
window.Skan = window.Skan || {};
(function (S) {
  'use strict';

  /* ---------- Motywy syntezy (4 pary przeciwieństw) ---------- */
  S.MOTYWY = {
    inicjatywa: { n: 'Inicjatywa', o: 'Potrzeba zaczynania po swojemu i brania pierwszego kroku na siebie.',
      cel: 'Zaczynać to, na co inni dopiero czekają.', lekcja: 'Ufać własnemu impulsowi, ale sprawdzać, dokąd prowadzi.', pytanie: 'Co dziś zaczniesz, nie pytając nikogo o zgodę?' },
    wiez: { n: 'Więź', o: 'Potrzeba bycia w relacji i szukania równowagi z drugą osobą.',
      cel: 'Budować relacje, w których obie strony mogą być sobą.', lekcja: 'Dbać o zgodę, nie płacąc za nią własnym zdaniem.', pytanie: 'Z kim rozmowa czeka już zbyt długo?' },
    ekspresja: { n: 'Ekspresja', o: 'Potrzeba pokazania się światu i opowiedzenia własnej historii.',
      cel: 'Opowiedzieć swoją historię tak, żeby inni odnaleźli w niej coś dla siebie.', lekcja: 'Wybrać jedną rzecz do powiedzenia i powiedzieć ją do końca.', pytanie: 'Co chcesz, żeby ludzie zapamiętali po spotkaniu z tobą?' },
    namysl: { n: 'Namysł', o: 'Potrzeba ciszy i czasu dla siebie, żeby zrozumieć sens tego, co się dzieje.',
      cel: 'Rozumieć głębiej i dzielić się tym, co naprawdę przemyślane.', lekcja: 'Dać sobie prawo do ciszy bez znikania ludziom z oczu.', pytanie: 'Na jakie pytanie szukasz odpowiedzi od dawna?' },
    struktura: { n: 'Struktura', o: 'Potrzeba porządku, planu i rzeczy, które da się doprowadzić do końca.',
      cel: 'Zostawić po sobie coś, co działa i na czym można polegać.', lekcja: 'Budować cierpliwie, nie myląc solidności ze sztywnością.', pytanie: 'Co warto dokończyć, zanim zaczniesz kolejną rzecz?' },
    swoboda: { n: 'Swoboda', o: 'Potrzeba ruchu, zmiany i otwartych drzwi.',
      cel: 'Poznawać świat szeroko i przynosić innym świeże spojrzenie.', lekcja: 'Odróżniać zmianę, która rozwija, od ucieczki.', pytanie: 'Od czego chcesz dziś odejść, a do czego naprawdę idziesz?' },
    troska: { n: 'Troska', o: 'Potrzeba dbania o innych i działania dla czegoś większego niż własna korzyść.',
      cel: 'Sprawiać, żeby komuś obok było lżej.', lekcja: 'Pomagać tak, żeby nie zabrakło sił dla siebie.', pytanie: 'Kto potrzebuje dziś twojej uwagi – i czy ty jesteś na tej liście?' },
    moc: { n: 'Sprawczość', o: 'Potrzeba wpływu, wyniku i odpowiedzialności za duże sprawy.',
      cel: 'Brać odpowiedzialność za duże rzeczy i doprowadzać je do końca.', lekcja: 'Używać siły tak, żeby nie trzeba było jej udowadniać.', pytanie: 'Jaki wynik uznasz za wystarczający?' }
  };

  S.PARY = [
    { a: 'ekspresja', b: 'namysl',
      zdanie: 'Chęć pokazania się światu spotyka się z potrzebą ciszy. Kiedy warto wyjść na scenę, a kiedy z niej zejść?',
      cel: 'Mówić to, co naprawdę dojrzało – ale wtedy mówić głośno.',
      lekcja: 'Pozwolić ważnej myśli poleżeć w ciszy, a potem znaleźć odwagę, żeby ktoś ją usłyszał.',
      wybor: 'Po mocnym przeżyciu kusi, żeby od razu opowiedzieć o nim wszystkim. Zapisz najpierw jedno zdanie tylko dla siebie i zdecyduj, komu powiesz je jutro.',
      pytanie: 'Która myśl potrzebuje jeszcze ciszy, a którą czas wreszcie powiedzieć na głos?' },
    { a: 'inicjatywa', b: 'wiez',
      zdanie: 'Chęć działania na własną rękę spotyka się z potrzebą bycia razem. Kiedy „ja” ustępuje miejsca „my”?',
      cel: 'Iść własną drogą tak, żeby było na niej miejsce dla drugiego człowieka.',
      lekcja: 'Nauczyć się zaczynać samodzielnie, a kończyć razem.',
      wybor: 'Zanim zdecydujesz w pojedynkę, zapytaj jedną osobę, której to dotyczy. Zanim poprosisz o zgodę, sprawdź, czy naprawdę jej potrzebujesz.',
      pytanie: 'W której sprawie warto dziś zdecydować samemu, a w której poczekać na drugą osobę?' },
    { a: 'struktura', b: 'swoboda',
      zdanie: 'Potrzeba planu spotyka się z potrzebą zmiany. Ile porządku zniesie wolność?',
      cel: 'Zbudować coś trwałego, co nie zamieni się w klatkę.',
      lekcja: 'Trzymać plan na tyle mocno, żeby prowadził, i na tyle lekko, żeby dało się go zmienić.',
      wybor: 'Gdy kusi rzucić wszystko, zmień najpierw jedną rzecz. Gdy kusi trzymać się planu za wszelką cenę, sprawdź, czemu ten plan miał służyć.',
      pytanie: 'Która zasada dziś pomaga, a która jest już tylko przyzwyczajeniem?' },
    { a: 'troska', b: 'moc',
      zdanie: 'Dbanie o innych spotyka się z dążeniem do wyniku. Komu służy sukces?',
      cel: 'Używać swojej siły tak, żeby rosło od niej coś więcej niż własny wynik.',
      lekcja: 'Pogodzić ambicję z czułością: wygrywać, nie tracąc z oczu ludzi.',
      wybor: 'Przy następnym sukcesie zapytaj, kto jeszcze na nim skorzysta. Przy następnej prośbie o pomoc sprawdź, czy masz na nią siły.',
      pytanie: 'Dla kogo jest wynik, o który teraz walczysz?' }
  ];

  /* ---------- Numerologia ---------- */
  S.LITERY_PIT = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8 };
  S.SAMOGLOSKI = 'AEIOUY';
  S.POLSKIE = { 'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z' };

  /* m: motyw; dz: droga życia; ex: ekspresja; se: potrzeba serca; wi: wizerunek; dn: dar dnia */
  S.LICZBY = {
    1: { m: 'inicjatywa', dz: 'Powraca wyzwanie stawania na własnych nogach i zaczynania rzeczy, których nikt wcześniej nie ruszył.', ex: 'Zdolność nadawania kierunku i mówienia wprost, czego się chce.', se: 'Poczucie, że decyzje są naprawdę własne.', wi: 'Ktoś, kto wchodzi pierwszy i nie czeka na pozwolenie.', dn: 'Rozpoczęcie tego, co inni tylko planują.' },
    2: { m: 'wiez', dz: 'Powraca wyzwanie współpracy: jak być blisko i nie zgubić siebie.', ex: 'Wyczucie drugiej strony i umiejętność łączenia ludzi.', se: 'Spokój, który daje dobra, bliska relacja.', wi: 'Ktoś, przy kim łatwiej się rozmawia i trudniej kłócić.', dn: 'Załagodzenie napięcia i znalezienie wspólnego języka.' },
    3: { m: 'ekspresja', dz: 'Powraca wyzwanie wyboru jednej rzeczy spośród wielu, które chce się powiedzieć światu.', ex: 'Lekkość słowa i umiejętność zarażania innych pomysłem.', se: 'Radość z tworzenia i z tego, że ktoś słucha.', wi: 'Ktoś, kto ożywia rozmowę i ma gotową anegdotę.', dn: 'Nadanie spotkaniu energii przez opowieść albo wspólne działanie.' },
    4: { m: 'struktura', dz: 'Powraca wyzwanie cierpliwego budowania, krok po kroku, bez drogi na skróty.', ex: 'Rzetelność i zdolność zamiany pomysłu w działający plan.', se: 'Bezpieczeństwo, które daje porządek i dotrzymane słowo.', wi: 'Ktoś, na kim można polegać i kto pamięta o szczegółach.', dn: 'Uporządkowanie tego, co się rozsypało.' },
    5: { m: 'swoboda', dz: 'Powraca wyzwanie mądrego korzystania z wolności: zmiana tak, ucieczka nie.', ex: 'Ciekawość i łatwość odnajdywania się w nowych sytuacjach.', se: 'Przestrzeń, ruch i poczucie, że jutro może wyglądać inaczej.', wi: 'Ktoś, kto zna najnowsze wieści i zaraz rusza dalej.', dn: 'Wpuszczenie świeżego powietrza tam, gdzie zrobiło się duszno.' },
    6: { m: 'troska', dz: 'Powraca wyzwanie odpowiedzialności za bliskich bez brania na siebie wszystkiego.', ex: 'Ciepło, poczucie estetyki i gotowość, by zadbać o innych.', se: 'Dom, w którym wszystkim jest dobrze.', wi: 'Ktoś, do kogo przychodzi się po radę i herbatę.', dn: 'Zadbanie o to, by nikt nie został pominięty.' },
    7: { m: 'namysl', dz: 'Powraca wyzwanie szukania odpowiedzi w głąb zamiast wszerz.', ex: 'Dociekliwość i umiejętność zadania pytania, które zmienia rozmowę.', se: 'Cisza i czas na własne myśli.', wi: 'Ktoś, kto więcej obserwuje, niż mówi.', dn: 'Zauważenie tego, co inni przeoczyli.' },
    8: { m: 'moc', dz: 'Powraca wyzwanie mądrego używania siły i pieniędzy.', ex: 'Zmysł organizacji i odwaga brania dużych spraw na siebie.', se: 'Widoczny efekt własnej pracy.', wi: 'Ktoś, kto wie, czego chce, i potrafi to wycenić.', dn: 'Doprowadzenie sprawy do konkretnego wyniku.' },
    9: { m: 'troska', dz: 'Powraca wyzwanie odpuszczania i działania dla szerszego dobra.', ex: 'Szerokie spojrzenie i umiejętność poruszania ludzi wspólną sprawą.', se: 'Poczucie, że wysiłek służy czemuś więcej niż własnej korzyści.', wi: 'Ktoś, kto patrzy szerzej i łatwo wybacza.', dn: 'Domknięcie starej sprawy z życzliwością.' },
    11: { m: 'namysl', dz: 'Powraca wyzwanie zaufania własnej intuicji i udźwignięcia dużej wrażliwości.', ex: 'Wrażliwość na drobny szczegół i dar składania z takich szczegółów myśli, która porusza innych.', se: 'Chwile olśnienia i rozmowy, które coś znaczą.', wi: 'Ktoś, kto potrafi nazwać nastrój spotkania i podsunąć nieoczywiste skojarzenie.', dn: 'Podsunięcie myśli, która zostaje w głowie.' },
    22: { m: 'struktura', dz: 'Powraca wyzwanie zamiany wielkiej wizji w coś trwałego i użytecznego.', ex: 'Rozmach połączony z praktycznością: plan na lata, nie na tydzień.', se: 'Budowanie czegoś, co zostanie na dłużej.', wi: 'Ktoś, kto mówi o dużych planach tak, że brzmią wykonalnie.', dn: 'Nadanie pomysłowi konstrukcji.' },
    33: { m: 'troska', dz: 'Powraca wyzwanie służenia innym bez spalania siebie.', ex: 'Opiekuńczość i dar podnoszenia innych na duchu.', se: 'Poczucie, że czyjeś życie stało się dzięki nam lżejsze.', wi: 'Ktoś, przy kim ludzie czują się zaopiekowani.', dn: 'Otoczenie kogoś uwagą dokładnie wtedy, gdy jej potrzebuje.' }
  };

  /* ---------- Astrologia ---------- */
  /* n nazwa, g glif, e żywioł, m motyw; sat: co daje satysfakcję (biernik/mianownik);
     koi: co koi; styl: jak działa (przysłówkowo); wiez: co liczy się w relacjach */
  S.ZNAKI = [
    { n: 'Baran', g: '♈', e: 'ogień', m: 'inicjatywa', sat: 'przecieranie szlaku i mierzenie się z czymś po raz pierwszy', koi: 'ruch i możliwość natychmiastowego działania', styl: 'szybko, wprost i bez czekania na pozwolenie', wiez: 'szczerość, żywioł i wspólne wyzwania' },
    { n: 'Byk', g: '♉', e: 'ziemia', m: 'struktura', sat: 'spokojne budowanie rzeczy trwałych i przyjemnych', koi: 'stały rytm, dobre jedzenie i znajome miejsca', styl: 'powoli, konsekwentnie i do końca', wiez: 'wierność, dotyk i poczucie bezpieczeństwa' },
    { n: 'Bliźnięta', g: '♊', e: 'powietrze', m: 'swoboda', sat: 'zbieranie informacji i łączenie ze sobą odległych wątków', koi: 'rozmowa i zmiana tematu', styl: 'zwinnie, ciekawie i w kilku kierunkach naraz', wiez: 'dobra rozmowa i wspólne poczucie humoru' },
    { n: 'Rak', g: '♋', e: 'woda', m: 'troska', sat: 'tworzenie miejsca, w którym bliscy czują się bezpiecznie', koi: 'dom, bliscy i to, co znane od lat', styl: 'ostrożnie, okrężną drogą i z wyczuciem nastroju', wiez: 'czułość, pamięć o drobiazgach i lojalność' },
    { n: 'Lew', g: '♌', e: 'ogień', m: 'ekspresja', sat: 'tworzenie czegoś własnego i pokazywanie tego innym', koi: 'uznanie i ciepła uwaga ze strony bliskich', styl: 'z rozmachem, sercem i na widoku', wiez: 'hojny, wyraźny gest i radość z czyjejś obecności' },
    { n: 'Panna', g: '♍', e: 'ziemia', m: 'struktura', sat: 'doskonalenie warsztatu i dostrzeganie szczegółu, który zmienia efekt', koi: 'porządek wokół i poczucie bycia użytecznym', styl: 'dokładnie, metodycznie i z okiem do szczegółu', wiez: 'konkretna pomoc i dotrzymywanie słowa' },
    { n: 'Waga', g: '♎', e: 'powietrze', m: 'wiez', sat: 'szukanie rozwiązania uczciwego dla obu stron', koi: 'zgoda, ład i ładne otoczenie', styl: 'taktownie, po rozważeniu racji obu stron', wiez: 'partnerstwo, takt i wzajemność' },
    { n: 'Skorpion', g: '♏', e: 'woda', m: 'namysl', sat: 'docieranie do sedna i przemiana tego, co trudne', koi: 'pełne zaufanie i rozmowa bez udawania', styl: 'w skupieniu na jednym celu, czekając na właściwy moment', wiez: 'głębia, wyłączność i absolutna szczerość' },
    { n: 'Strzelec', g: '♐', e: 'ogień', m: 'swoboda', sat: 'poszerzanie horyzontu i szukanie sensu w szerszym planie', koi: 'przestrzeń, podróż i perspektywa czegoś nowego', styl: 'z rozpędem, optymistycznie i na dużą skalę', wiez: 'wolność, wspólna przygoda i mówienie prawdy' },
    { n: 'Koziorożec', g: '♑', e: 'ziemia', m: 'moc', sat: 'wytrwałe wspinanie się do celu, który ma znaczenie', koi: 'kontrola nad sytuacją i wykonane zadanie', styl: 'cierpliwie, etapami i z myślą o trwałym wyniku', wiez: 'niezawodność, szacunek i wspólne cele' },
    { n: 'Wodnik', g: '♒', e: 'powietrze', m: 'swoboda', sat: 'wprowadzanie własnych rozwiązań i działanie dla wspólnej sprawy', koi: 'chwila dystansu i kontakt z ludźmi, przy których można przeżywać po swojemu', styl: 'niezależnie, po swojemu i z myślą o przyszłości', wiez: 'przyjaźń, swoboda i wspólne idee' },
    { n: 'Ryby', g: '♓', e: 'woda', m: 'namysl', sat: 'podążanie za wyobraźnią i współodczuwanie z innymi', koi: 'cisza, muzyka i możliwość wycofania się', styl: 'intuicyjnie, miękko i falami', wiez: 'czułość, wyobraźnia i rozumienie bez słów' }
  ];

  /* id zgodne z astronomy-engine; w: waga w syntezie (0 = poza syntezą); t: temat w aspektach */
  S.CIALA = [
    { id: 'Sun', n: 'Słońce', g: '☉', w: 3, rola: 'Kierunek i tożsamość.', szab: 'Satysfakcję przynosi {sat}.', t: 'osobiste ambicje' },
    { id: 'Moon', n: 'Księżyc', g: '☽', w: 2.5, rola: 'Potrzeby i odruchowe reakcje.', szab: 'Koi i przywraca równowagę: {koi}.', t: 'potrzeby emocjonalne' },
    { id: 'Mercury', n: 'Merkury', g: '☿', w: 1.5, rola: 'Myślenie i komunikacja.', szab: 'Myśl pracuje {styl}.', t: 'sposób myślenia' },
    { id: 'Venus', n: 'Wenus', g: '♀', w: 1.5, rola: 'Sympatia, więzi i upodobania.', szab: 'W relacjach liczą się: {wiez}.', t: 'przyciąganie' },
    { id: 'Mars', n: 'Mars', g: '♂', w: 1.5, rola: 'Działanie, obrona granic i konflikt.', szab: 'Działa {styl}.', t: 'inicjatywa' },
    { id: 'Jupiter', n: 'Jowisz', g: '♃', w: 0, rola: 'Rozwój i poszerzanie perspektywy.', szab: 'Rozwój przychodzi przez {sat}. To wolniejszy cykl, wspólny wielu rówieśnikom.', t: 'apetyt na więcej' },
    { id: 'Saturn', n: 'Saturn', g: '♄', w: 0, rola: 'Granice, odpowiedzialność i czas.', szab: 'Dyscyplina wyraża się {styl}; próbą jest {sat}.', t: 'ciężar zobowiązań' },
    { id: 'Uranus', n: 'Uran', g: '♅', w: 0, pok: true },
    { id: 'Neptune', n: 'Neptun', g: '♆', w: 0, pok: true },
    { id: 'Pluto', n: 'Pluton', g: '♇', w: 0, pok: true }
  ];

  S.ASPEKTY = [
    { n: 'koniunkcja', kat: 0, orb: 8, twardy: false, cz: 'Koniunkcja skupia oba wątki w tej samej sytuacji. Kiedy jeden z nich zaczyna prowadzić?' },
    { n: 'sekstyl', kat: 60, orb: 4, twardy: false, cz: 'Sekstyl to okazja: wątki wspierają się, gdy świadomie się je połączy.' },
    { n: 'kwadratura', kat: 90, orb: 7, twardy: true, cz: 'Kwadraturę czytamy jako tarcie: co się dzieje, kiedy oba wątki naraz domagają się uwagi?' },
    { n: 'trygon', kat: 120, orb: 7, twardy: false, cz: 'Trygon to łatwy przepływ: działa samo i dlatego bywa niedoceniane.' },
    { n: 'opozycja', kat: 180, orb: 8, twardy: true, cz: 'Opozycja ustawia wątki naprzeciw siebie, często w relacji z drugą osobą. Po której stronie stajesz częściej?' }
  ];

  /* ---------- Tarot ---------- */
  S.POZYCJE = [
    { id: 'wizerunek', n: 'Wizerunek', tyt: 'Co pokazuje światu', szab: 'Na zewnątrz widać: {x}.' },
    { id: 'naped', n: 'Napęd', tyt: 'Co napędza tę osobę', szab: 'Do działania popycha: {x}.' },
    { id: 'napiecie', n: 'Napięcie', tyt: 'Gdzie pojawia się napięcie', szab: 'Napięcie rodzi się wokół tematu: {x}.' }
  ];

  /* nazwa | obraz na karcie | znaczenie proste | odwrócone | motyw | pytanie */
  var WIELKIE = [
    'Głupiec|Wędrowiec z tobołkiem staje nad krawędzią urwiska, u jego stóp skacze pies.|nowy początek, zaufanie i skok w nieznane|lekkomyślność albo strach przed pierwszym krokiem|swoboda|Co byś zrobił, gdyby nie trzeba było znać całej drogi?',
    'Mag|Postać przy stole z czterema narzędziami wznosi różdżkę ku niebu, drugą ręką wskazuje ziemię.|sprawczość, skupiona wola i pewność, że ma się wszystko, czego trzeba|rozproszenie, talent bez kierunku, gra pozorów|inicjatywa|Którego z narzędzi leżących na stole jeszcze nie użyłeś?',
    'Kapłanka|Kobieta siedzi między dwiema kolumnami, jasną i ciemną, ze zwojem na kolanach.|intuicja, cisza i wiedza, której nie trzeba ogłaszać|odcięcie od własnego głosu, tajemnice, które ciążą|namysl|Co wiesz, choć nikt ci tego nie powiedział?',
    'Cesarzowa|Kobieta w koronie z gwiazd odpoczywa wśród zbóż i drzew.|obfitość, opieka i tworzenie we własnym rytmie|nadopiekuńczość albo zaniedbanie własnych potrzeb|troska|Co rośnie dzięki twojej opiece – i co rośnie w tobie?',
    'Cesarz|Władca w zbroi siedzi na kamiennym tronie ozdobionym głowami baranów.|porządek, autorytet i stabilne ramy|sztywność, nadmierna kontrola albo brak oparcia|struktura|Gdzie potrzebna jest dziś twoja decyzja, a gdzie tylko twoja kontrola?',
    'Kapłan|Duchowny w potrójnej koronie błogosławi dwóch klęczących uczniów.|tradycja, nauka u mistrza i wspólne zasady|bunt wobec reguł, własna ścieżka poza schematem|struktura|Którą zasadę wybrałeś sam, a którą tylko odziedziczyłeś?',
    'Kochankowie|Kobieta i mężczyzna stoją pod skrzydłami anioła, za nimi dwa drzewa.|wybór serca, bliskość i zgodność wartości|rozdarcie, wybór odkładany na później|wiez|Co wybierasz, kiedy wybierasz tę osobę albo tę drogę?',
    'Rydwan|Woźnica w zbroi stoi w pojeździe, przed którym leżą dwa sfinksy, jasny i ciemny.|determinacja, kierunek i zwycięstwo siłą woli|rozjechane cele, pęd bez sterowania|moc|Co nadałoby obu siłom wspólny kierunek?',
    'Moc|Kobieta w wieńcu z kwiatów łagodnie zamyka paszczę lwa.|łagodna siła, odwaga i oswojenie własnych impulsów|zwątpienie w siebie albo siła używana na pokaz|moc|Co w tobie warto oswoić, zamiast pokonywać?',
    'Pustelnik|Starzec w szarym płaszczu stoi na szczycie góry z uniesioną latarnią.|samotna droga, namysł i własne światło|izolacja, ucieczka przed ludźmi|namysl|Komu mogłaby przyświecić twoja latarnia?',
    'Koło Fortuny|Wielkie koło ze znakami obraca się na niebie, w rogach czuwają cztery skrzydlate postaci.|zmiana losu, nowy cykl, szansa|opór przed zmianą, poczucie braku wpływu|swoboda|Co się kręci samo, a czym naprawdę możesz pokierować?',
    'Sprawiedliwość|Postać na tronie trzyma uniesiony miecz i wagę.|równowaga, uczciwy rachunek i konsekwencje|unikanie odpowiedzialności, poczucie krzywdy|struktura|Co pokazałaby waga, gdyby położyć na niej twoją ostatnią decyzję?',
    'Wisielec|Mężczyzna wisi spokojnie głową w dół, wokół głowy ma jasną aureolę.|zatrzymanie, inna perspektywa i świadome odpuszczenie|utknięcie, poświęcenie bez sensu|namysl|Co widać dopiero wtedy, gdy przestaje się szarpać?',
    'Śmierć|Rycerz-kościotrup na białym koniu niesie czarny sztandar z białą różą.|koniec etapu, przemiana, oczyszczenie|trzymanie się tego, co już się skończyło|swoboda|Co się skończyło, choć jeszcze tego nie pożegnałeś?',
    'Umiarkowanie|Anioł przelewa wodę między dwoma kielichami, jedną stopą stoi w strumieniu.|umiar, łączenie przeciwieństw, cierpliwość|skrajności i niecierpliwość|wiez|Jakie dwie rzeczy w twoim życiu warto dziś zmieszać w lepszych proporcjach?',
    'Diabeł|Rogata postać siedzi nad parą ludzi skutych luźnymi łańcuchami.|przywiązanie, pokusa i siła pragnień|uwalnianie się z zależności|moc|Który łańcuch dałoby się zdjąć jednym ruchem?',
    'Wieża|Piorun uderza w wieżę, z której spada korona i dwie postaci.|nagły przełom, upadek złudzeń|odwlekany wstrząs, strach przed zmianą|swoboda|Co było zbudowane na zbyt słabym fundamencie?',
    'Gwiazda|Kobieta klęczy nad wodą i wylewa ją z dwóch dzbanów pod rozgwieżdżonym niebem.|nadzieja, inspiracja i spokojna wiara|zwątpienie, przygaszona wiara w siebie|ekspresja|W co wierzysz na tyle, żeby pokazać to innym?',
    'Księżyc|Pies i wilk wyją do księżyca, z wody wychodzi rak, w dali dwie wieże.|sny, niejasność i droga przez nieznane|rozwiewanie złudzeń, lęk, który traci moc|namysl|Co wygląda groźnie tylko w tym świetle?',
    'Słońce|Nagie dziecko jedzie na białym koniu pod wielkim słońcem, za murem rosną słoneczniki.|radość, witalność i bycie widzianym|przygaszony entuzjazm, sukces, którym trudno się cieszyć|ekspresja|Co cieszy cię tak po prostu, bez powodu?',
    'Sąd Ostateczny|Anioł dmie w trąbę, a ludzie wstają z grobów z uniesionymi rękami.|przebudzenie, powołanie i rozliczenie z przeszłością|głuchota na wezwanie, surowy osąd siebie|inicjatywa|Na jakie wezwanie odpowiadasz zbyt długim milczeniem?',
    'Świat|Tańcząca postać w wieńcu laurowym, w rogach cztery skrzydlate figury.|spełnienie, całość i zamknięcie cyklu|niedomknięta sprawa, krok przed metą|moc|Co trzeba domknąć, żeby móc zacząć od nowa?'
  ];

  var KOLORY = [
    { n: 'Buław', dz: 'działanie i ambicja', pyt: 'Na co naprawdę warto dziś zużyć ten zapał?', karty: [
      'Z obłoku wysuwa się dłoń z kwitnącą laską.|iskra, nowy zapał, początek przedsięwzięcia|słomiany zapał, opóźniony start|inicjatywa',
      'Mężczyzna z globusem w dłoni patrzy z murów na morze.|plan, spojrzenie za horyzont, decyzja o kierunku|obawa przed wyjściem poza znane|inicjatywa',
      'Postać odwrócona plecami obserwuje ze wzgórza odpływające statki.|pierwsze efekty i rozszerzanie działań|opóźnienia, zbyt wąskie spojrzenie|swoboda',
      'Cztery laski zdobi girlanda, w tle ludzie wznoszą bukiety przed zamkiem.|świętowanie, dom i wspólnota|napięcie w domu, niepełna radość|wiez',
      'Pięciu młodzieńców krzyżuje laski w zamieszaniu.|rywalizacja i ścieranie się pomysłów|unikanie sporu albo kłótnia o drobiazgi|inicjatywa',
      'Jeździec w wieńcu laurowym jedzie wśród wiwatującego tłumu.|uznanie i publiczny sukces|głód poklasku, sukces bez echa|ekspresja',
      'Mężczyzna na wzniesieniu odpiera laską sześć innych.|obrona własnego stanowiska|zmęczenie ciągłą obroną, ustępowanie|moc',
      'Osiem lasek leci ukośnie nad spokojnym krajobrazem.|tempo, wiadomości, szybki ruch|pośpiech, chaos, wstrzymane sprawy|swoboda',
      'Mężczyzna z obandażowaną głową opiera się o laskę, za nim rząd ośmiu kolejnych.|wytrwałość i czujność mimo zmęczenia|podejrzliwość, wyczerpanie|struktura',
      'Człowiek pochylony pod naręczem dziesięciu lasek idzie w stronę zabudowań.|odpowiedzialność za doprowadzenie sprawy do końca, nawet ponad siły|oddawanie ciężaru albo upadek pod nim|moc',
      'Młodzieniec w kapeluszu z piórkiem przygląda się lasce wyższej od siebie.|ciekawość, entuzjazm, dobra nowina|zapał bez pokrycia|swoboda',
      'Rycerz w zbroi pędzi na stającym dęba koniu.|przygoda, impet, działanie od ręki|porywczość, porzucanie spraw w połowie|inicjatywa',
      'Królowa siedzi na tronie ze słonecznikiem w dłoni, u jej stóp czarny kot.|pewność siebie, ciepło i magnetyzm|zazdrość, potrzeba bycia w centrum|ekspresja',
      'Król pochyla się na tronie do przodu, obok niego mała jaszczurka.|wizja, przywództwo i odwaga|despotyzm, niecierpliwość|moc' ] },
    { n: 'Kielichów', dz: 'uczucia i relacje', pyt: 'Komu to uczucie powinno zostać powiedziane na głos?', karty: [
      'Dłoń z obłoku podaje kielich, z którego przelewa się woda; nad nim gołębica.|nowe uczucie, otwarte serce|zamknięcie, uczucie bez ujścia|wiez',
      'Kobieta i mężczyzna wymieniają się kielichami.|partnerstwo i wzajemność|rozdźwięk, brak równowagi w relacji|wiez',
      'Trzy kobiety tańczą i wznoszą kielichy wśród owoców.|przyjaźń, świętowanie, wspólnota|nadmiar towarzystwa, plotki|ekspresja',
      'Mężczyzna siedzi pod drzewem ze skrzyżowanymi rękami, nie widząc podawanego mu kielicha.|znużenie, zamyślenie, niezauważona okazja|wyjście z apatii, nowe zainteresowanie|namysl',
      'Postać w czarnym płaszczu patrzy na trzy rozlane kielichy, dwa stoją za jej plecami.|żal po stracie i patrzenie wstecz|pogodzenie się, powrót nadziei|namysl',
      'Chłopiec podaje dziewczynce kielich z kwiatami na dziedzińcu starego domu.|wspomnienia, czułość, prosty gest|życie przeszłością|troska',
      'Postać stoi przed siedmioma kielichami w chmurach, każdy kryje inną wizję.|marzenia, wiele możliwości, złudzenia|otrzeźwienie, wybór jednej drogi|swoboda',
      'Wędrowiec odchodzi nocą w góry, zostawiając osiem ustawionych kielichów.|odejście w poszukiwaniu głębszego sensu|niezdecydowanie: zostać czy odejść|namysl',
      'Zadowolony mężczyzna siedzi przed łukiem z dziewięciu kielichów.|zadowolenie, spełnione życzenie|samozadowolenie, przesyt|ekspresja',
      'Para wznosi ręce ku tęczy z dziesięciu kielichów, obok tańczą dzieci.|harmonia w rodzinie, emocjonalne spełnienie|rysa na obrazie rodzinnego szczęścia|troska',
      'Młodzieniec przygląda się rybie wychylającej się z kielicha.|wrażliwość, wyobraźnia, czuła wiadomość|przewrażliwienie, ucieczka w fantazję|namysl',
      'Rycerz na spokojnym koniu trzyma przed sobą kielich.|romantyczny gest, propozycja, podążanie za sercem|zmienne nastroje, obietnice bez pokrycia|wiez',
      'Królowa na tronie nad brzegiem morza wpatruje się w zdobiony, zamknięty kielich.|empatia, intuicja, opieka emocjonalna|zatopienie w cudzych emocjach|troska',
      'Król siedzi na tronie unoszącym się na falach, spokojny mimo wzburzonej wody.|dojrzałość emocjonalna, spokój, dyplomacja|tłumione emocje, chłód|wiez' ] },
    { n: 'Mieczy', dz: 'myśl i słowo', pyt: 'Która z tych myśli jest faktem, a która tylko obawą?', karty: [
      'Dłoń z obłoku trzyma pionowo miecz zwieńczony koroną.|jasność, prawda, przełomowa myśl|zamęt, ostre słowa|namysl',
      'Kobieta z przepaską na oczach trzyma dwa skrzyżowane miecze.|impas, trudny wybór, zamknięte oczy|decyzja po długim wahaniu|namysl',
      'Trzy miecze przebijają serce na tle deszczowych chmur.|zranienie, bolesna prawda|gojenie, wybaczanie|namysl',
      'Rycerz spoczywa na kamiennej płycie w kaplicy, nad nim trzy miecze.|odpoczynek, wyciszenie, regeneracja|niepokój, zbyt szybki powrót do działania|namysl',
      'Mężczyzna z uśmiechem zbiera miecze, dwie postaci odchodzą pokonane.|konflikt, wygrana za wszelką cenę|chęć pojednania, niesmak po sporze|moc',
      'Przewoźnik wiezie łodzią kobietę i dziecko, na dziobie tkwi sześć mieczy.|przejście na spokojniejsze wody|bagaż, którego trudno się pozbyć|swoboda',
      'Mężczyzna wymyka się z obozu, niosąc pięć mieczy, dwa zostawia.|spryt, strategia, działanie po cichu|sprawa wychodząca na jaw, wyrzuty sumienia|swoboda',
      'Związana kobieta z opaską na oczach stoi wśród ośmiu wbitych mieczy.|poczucie uwięzienia we własnych myślach|uwalnianie się z ograniczeń|namysl',
      'Postać siedzi na łóżku z twarzą w dłoniach, na ścianie wisi dziewięć mieczy.|niepokój, bezsenne noce, zamartwianie się|lęk tracący moc, szukanie pomocy|namysl',
      'Postać leży na ziemi z dziesięcioma mieczami w plecach, na horyzoncie świta.|bolesny koniec, od którego można się już tylko odbić|powolne podnoszenie się|swoboda',
      'Młodzieniec z uniesionym mieczem rozgląda się czujnie na wietrze.|czujność, ciekawość, obserwacja|plotka, podejrzliwość|namysl',
      'Rycerz szarżuje na koniu z mieczem wyciągniętym przed siebie.|szybka decyzja, szarża w obronie idei|pochopność, słowa szybsze niż myśl|inicjatywa',
      'Królowa na tronie trzyma pionowo miecz i wyciąga otwartą dłoń.|niezależność, jasny osąd, szczerość|chłód, gorycz|namysl',
      'Król siedzi na tronie na wprost, z mieczem lekko przechylonym w dłoni.|autorytet intelektu, logika, zasady|bezduszna racja, manipulowanie słowem|struktura' ] },
    { n: 'Monet', dz: 'praca, ciało i pieniądze', pyt: 'Co z tego chcesz mieć za rok – i co robisz w tym kierunku dzisiaj?', karty: [
      'Dłoń z obłoku trzyma dużą monetę nad ogrodem z bramą z żywopłotu.|nowa szansa materialna, solidny początek|zmarnowana okazja, chwiejny start|struktura',
      'Młodzieniec żongluje dwiema monetami połączonymi wstęgą, za nim falują statki.|żonglowanie obowiązkami, elastyczność|przeciążenie, bałagan w finansach|swoboda',
      'Rzemieślnik pracuje w katedrze, dwie osoby oglądają z nim plany.|współpraca, fach, uznanie za rzetelną pracę|bylejakość, brak zgrania w zespole|struktura',
      'Mężczyzna w koronie ściska monetę w ramionach, dwie trzyma pod stopami.|oszczędność, trzymanie tego, co się ma|zaciśnięta pięść albo rozrzutność|struktura',
      'Dwoje biedaków brnie przez śnieg pod oświetlonym witrażem.|trudny czas, poczucie braku|wychodzenie z kłopotów, przyjęcie pomocy|troska',
      'Kupiec z wagą w dłoni rozdaje monety klęczącym.|hojność, sprawiedliwy podział|pomoc z haczykiem, dług|troska',
      'Ogrodnik oparty na motyce patrzy na krzew obsypany monetami.|cierpliwość, ocena dotychczasowych efektów|zniecierpliwienie, praca bez plonów|struktura',
      'Rzemieślnik przy warsztacie wykuwa kolejną monetę, gotowe wiszą obok.|doskonalenie warsztatu, pilność|perfekcjonizm albo praca bez serca|struktura',
      'Kobieta w ozdobnej szacie stoi w winnicy z sokołem na dłoni.|niezależność, komfort, owoce własnej pracy|pozory dostatku, samotność w luksusie|moc',
      'Starzec z psami siedzi przed bramą miasta, obok rodzina; dziesięć monet układa się w drzewo.|dostatek, dziedzictwo, trwałość|spory o majątek, kruche fundamenty|struktura',
      'Młodzieniec stoi na łące i wpatruje się w uniesioną monetę.|nauka, praktyczny plan, pierwsze kroki|odkładanie, brak konkretu|struktura',
      'Rycerz na ciężkim, nieruchomym koniu trzyma monetę przed sobą.|wytrwałość, obowiązkowość, powolny postęp|rutyna, upór, zastój|struktura',
      'Królowa siedzi w ukwieconej altanie z monetą na kolanach, obok przemyka zając.|zaradność, troska o dom, praktyczna mądrość|zapracowanie, zaniedbanie siebie|troska',
      'Król w szacie z winogronami siedzi na tronie przed swoim zamkiem.|sukces materialny, stabilność, gospodarność|materializm, sztywność|moc' ] }
  ];
  var RANGI = ['As', 'Dwójka', 'Trójka', 'Czwórka', 'Piątka', 'Szóstka', 'Siódemka', 'Ósemka', 'Dziewiątka', 'Dziesiątka', 'Paź', 'Rycerz', 'Królowa', 'Król'];

  S.KARTY = [];
  WIELKIE.forEach(function (w, i) {
    var p = w.split('|');
    S.KARTY.push({ id: 'W' + i, n: p[0], obraz: p[1], up: p[2], rev: p[3], m: p[4], pyt: p[5], wielka: true, grupa: 'Wielkie Arkana' });
  });
  KOLORY.forEach(function (k, ki) {
    k.karty.forEach(function (w, i) {
      var p = w.split('|');
      S.KARTY.push({ id: 'M' + ki + '_' + i, n: RANGI[i] + ' ' + k.n, obraz: p[0], up: p[1], rev: p[2], m: p[3], pyt: k.pyt, wielka: false, kolor: k.n, ranga: RANGI[i], dziedzina: k.dz, grupa: 'Małe Arkana · ' + k.n });
    });
  });

  /* ---------- Miejscowości: nazwa | szer. | dł. | strefa ---------- */
  var W = 'Europe/Warsaw';
  S.MIASTA = [
    ['Warszawa', 52.23, 21.01, W], ['Kraków', 50.06, 19.94, W], ['Łódź', 51.76, 19.46, W], ['Wrocław', 51.11, 17.03, W],
    ['Poznań', 52.41, 16.93, W], ['Gdańsk', 54.35, 18.65, W], ['Szczecin', 53.43, 14.55, W], ['Bydgoszcz', 53.12, 18.01, W],
    ['Lublin', 51.25, 22.57, W], ['Białystok', 53.13, 23.16, W], ['Katowice', 50.26, 19.02, W], ['Gdynia', 54.52, 18.53, W],
    ['Częstochowa', 50.81, 19.12, W], ['Radom', 51.40, 21.15, W], ['Rzeszów', 50.04, 22.00, W], ['Toruń', 53.01, 18.60, W],
    ['Sosnowiec', 50.29, 19.10, W], ['Kielce', 50.87, 20.63, W], ['Gliwice', 50.29, 18.67, W], ['Olsztyn', 53.78, 20.48, W],
    ['Zabrze', 50.32, 18.79, W], ['Bielsko-Biała', 49.82, 19.05, W], ['Bytom', 50.35, 18.92, W], ['Zielona Góra', 51.94, 15.51, W],
    ['Rybnik', 50.10, 18.54, W], ['Opole', 50.67, 17.93, W], ['Tychy', 50.14, 18.97, W], ['Gorzów Wielkopolski', 52.73, 15.24, W],
    ['Elbląg', 54.16, 19.40, W], ['Płock', 52.55, 19.71, W], ['Wałbrzych', 50.77, 16.28, W], ['Włocławek', 52.65, 19.07, W],
    ['Tarnów', 50.01, 20.99, W], ['Chorzów', 50.30, 18.95, W], ['Koszalin', 54.19, 16.17, W], ['Kalisz', 51.76, 18.09, W],
    ['Legnica', 51.21, 16.16, W], ['Słupsk', 54.46, 17.03, W], ['Nowy Sącz', 49.62, 20.70, W], ['Jelenia Góra', 50.90, 15.73, W],
    ['Siedlce', 52.17, 22.29, W], ['Przemyśl', 49.78, 22.77, W], ['Zamość', 50.72, 23.25, W], ['Krosno', 49.69, 21.77, W],
    ['Stalowa Wola', 50.58, 22.05, W], ['Mielec', 50.29, 21.42, W], ['Tarnobrzeg', 50.57, 21.68, W], ['Sanok', 49.56, 22.21, W],
    ['Suwałki', 54.10, 22.93, W], ['Łomża', 53.18, 22.06, W], ['Piła', 53.15, 16.74, W], ['Konin', 52.22, 18.25, W],
    ['Zakopane', 49.30, 19.95, W], ['Sopot', 54.44, 18.56, W], ['Świnoujście', 53.91, 14.25, W], ['Chełm', 51.14, 23.47, W],
    ['Londyn', 51.51, -0.13, 'Europe/London'], ['Berlin', 52.52, 13.40, 'Europe/Berlin'], ['Paryż', 48.86, 2.35, 'Europe/Paris'],
    ['Wiedeń', 48.21, 16.37, 'Europe/Vienna'], ['Praga', 50.08, 14.44, 'Europe/Prague'], ['Rzym', 41.90, 12.50, 'Europe/Rome'],
    ['Madryt', 40.42, -3.70, 'Europe/Madrid'], ['Dublin', 53.35, -6.26, 'Europe/Dublin'], ['Lwów', 49.84, 24.03, 'Europe/Kyiv'],
    ['Wilno', 54.69, 25.28, 'Europe/Vilnius'], ['Kijów', 50.45, 30.52, 'Europe/Kyiv'], ['Nowy Jork', 40.71, -74.01, 'America/New_York'],
    ['Chicago', 41.88, -87.63, 'America/Chicago'], ['Toronto', 43.65, -79.38, 'America/Toronto'], ['Los Angeles', 34.05, -118.24, 'America/Los_Angeles']
  ];
})(window.Skan);
