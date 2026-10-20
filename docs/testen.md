# Testen

Alle tests draaien in headless Chromium via Playwright (Python), met WebGL via SwiftShader (software-rendering). Elk script bouwt `src/` naar een tijdelijke testmap, start een kleine lokale webserver op die map en opent de pagina op 1280 × 800 (muis) en, waar nodig, op 390 × 844 (touch, schaal 2). Elk script geeft exitcode 0 bij slagen en 1 bij een fout.

Uitzondering voor beelden die het oog beoordeelt (de S7-poort, de galerij): `LAG3_GPU=1` start de testbrowser op de echte GPU (macOS: ANGLE Metal). SwiftShader tekent op lak, dak en raamlijsten donkere spikkels die op een echte GPU niet bestaan (gemeten in golf 5f). De testset, visdiff en de basislijnen blijven op SwiftShader, omdat die pixels op elke machine gelijk zijn.

## Voorbereiding

```bash
tools/setup.sh                 # Playwright uit requirements.txt, three.js 0.147.0 in de cache (met hashcontrole), Chromium
python3 tools/smoke.py
```

`tools/harness.py` regelt de rest: hij bouwt de testmap met een symlink `three/` naar het npm-pakket en start Chromium. Het ophalen van three.js vraagt `npm` en een netwerkverbinding; het pakket wordt vergeleken met de npm-integriteit (`THREE_INTEGRITY` in de harness) en een bestandsvergrendeling voorkomt dat twee reeksen tegelijk `npm pack` draaien. De versie staat op één plek: `THREE_VERSION` in `build.py`. Een SessionStart-hook (`.claude/hooks/session-start.sh`) draait `tools/setup.sh` in een Claude Code-sessie in de cloud. Instellingen:

| Omgevingsvariabele | Werking |
|---|---|
| `THREE_DIR` | Map met het uitgepakte npm-pakket `three@0.147.0` (de map `package`). Standaard `~/.cache/explosietekening/three-0.147.0/package`; ontbreekt die, dan draait het script `npm pack three@0.147.0` en pakt het uit. |
| `CHROMIUM` | Pad naar een Chromium-binary. Standaard `/opt/pw-browsers/chromium` als die bestaat, anders de Chromium van Playwright (`playwright install chromium`). |
| `MODEL_TEST` | Een bestaande testmap hergebruiken in plaats van opnieuw te bouwen. Zonder deze variabele ruimt de harness zijn tijdelijke testmap bij het sluiten op. |
| `MODEL_TIMEOUT_MS` | Wachttijd op laden en `ready`, standaard 120000. Op een belaste machine of in CI hoger zetten. |
| `PUBSMOKE_READY_MS` | Grens voor `ready` in `pubsmoke.py`, standaard 20000 (de grens uit de premortem). |

Chromium start met `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. De harness zet `window.__MODEL_CACHECHECK = true`, zodat een botsing van cache-sleutels in `core.js` als consolefout verschijnt. Een script faalt bij elke console-fout of -waarschuwing (`harness.errors()` geeft beide), behalve de regels in `IGNORE` in `tools/harness.py`; die lijst is een contract met per regel een reden en datum, en alleen de orkestrator wijzigt hem.

`harness.page()` neemt een `query` (bijvoorbeeld `'?preset=engine'`) voor de deelbare stand en de debug-overlay. De pagina zet `window.__model` met hulpfuncties voor tests, waaronder `version` (het versiestempel), `finishAll()` om animaties direct af te ronden, `state()`, `preset(id)`, `checkPresets()`, `pickNodeAt(x, y)`, `hoverTarget(x, y)`, `setExplode(v)`, `labelRects()`, `freeView()`, `profileFrames(naam, aantal)`, `timing()` (de opstarttijdlijn in milliseconden sinds het begin van de navigatie), `batchFlush()` (alle wachtende batches direct bouwen) en `batchStats()`. Een eigen `THREE.Raycaster` in een testscript moet `ray.layers.enableAll()` aanzetten: gebundeld renderen zet de losse meshes van gesloten groepen op laag 1, en een raycaster die alleen laag 0 ziet, mist ze (`integrity.py`, `silhouette.py` en `ui_inner.py` doen dit). De oude functies blijven werken; nieuwe haken komen erbij.

De Google Fonts-verzoeken beantwoordt de harness zelf (`Session.page`): uit `~/.cache/explosietekening/fonts`, eenmaal met Python opgehaald; lukt ophalen niet, dan een leeg antwoord zonder consolefout. Aanleiding (16 oktober 2026): in Chromium op macOS faalde het verzoek met `net::ERR_SOCKET_NOT_CONNECTED` zodra een tweede pagina laadde terwijl de eerste nog renderde (steeds de tweede pagina van `smoke.py`; los en met `curl` was het wel 200). Een leeg antwoord alleen liet de tekst op een systeemletter terugvallen, waardoor `visdiff` op elk beeld circa 10 procent afweek; de cache houdt de letters gelijk aan de echte pagina. `pubsmoke.py` houdt de bereikbaarheid van de stylesheet met `curl` bij.

Het gebruikte bestand is de testversie (`python3 build.py --test-only MAP`): die laadt three.js lokaal. De gepubliceerde `index.html` laadt het van jsDelivr en wordt door `pubsmoke.py` apart getoetst.

## CI op GitHub

`.github/workflows/ci.yml` draait bij elke push en PR de snelle set (lint, `index.html` hoort bij `src/`, smoke, integrity, silhouette, `tri.py --gate`, de testlijst van `finaltests.sh`), richting 5 tot 10 minuten; `nightly.yml` draait elke nacht en op aanvraag de lange set (itest met poorten, `opentest --strikt-min`, `ui_inner --open --strict`, pubsmoke, stats en cijfers), met ruimere wachttijden (`MODEL_TIMEOUT_MS` 600 s, `PUBSMOKE_READY_MS` 60 s) en de uitvoer als artefact. Een rode push-job stopt het werk tot hij groen is; een rode nachtrun is een melding. SwiftShader op een gedeelde runner is trager dan de container; de eerste runs zijn een proef van de tijdgrenzen.

## Scripts

### `python3 build.py --lint`

Sinds golf 5c-1 gaat ook elk inline script in `src/head.html` (de foutafhandeling vóór de scripttags) apart door `node --check`.

Controleert zonder iets te schrijven: dubbele functienamen op het hoogste niveau over alle bestanden in `ORDER`, dubbele materiaalnamen in `std()` en `phys()`, de tekstregels hieronder en de syntaxis van het samengevoegde script met `node --check`. Een fout wordt teruggerekend naar bestand en regel. Exitcode 1 bij een fout, anders `lint ok`.

Tekstregels (`lint_texts`), op de stringwaarden van `d`, `spec`, `note` en `label` (sinds golf 5b-3 ook `note` en `label`; `partnumbers.js` is uitgezonderd): R1 geen schatwoorden in `spec`, R2 geen decimale punt bij een eenheid, R4 een getal vanaf 1.000 vóór een eenheid heeft een punt als duizendtal, R5 Ø zonder spatie vóór de maat, en R7 een cachesleutel begint met het voorvoegsel van het bestand (tabel `_voorvoegsels` in `auto.json`; een bestand zonder regel in de tabel, zoals `core.js`, wordt niet getoetst). Alle vijf zijn fouten en stoppen de bouw. R4, R5 en R7 waren tot stap 3.1 van golf 5b-3 meldingen die de bouw niet stopten; ze zijn pas fout geworden nadat de meting op 0 treffers stond. Een proefbron met `Ø 57` en `1998 cm³` geeft R5 en R4 als fout. Botsingen tussen cachesleutels vangt daarnaast de testmodus van `cache()`.

### `python3 tools/smoke.py`

Rooktest. Laadt de pagina op desktop en telefoonformaat en meldt het aantal knopen, groepen, onderdelen, de maximale diepte, het aantal meshes en driehoeken, daarna één render van de gemonteerde auto (tijd, tekenopdrachten, driehoeken, geometrieën) en één van de volledig uitgeklapte auto, en of de telefoon horizontaal scrollt. Exitcode 1 bij console- of paginafouten.

### `python3 tools/integrity.py`

Integriteit van de boom. Exitcode 1 bij een fout, een ankerfout, een presetfout of een consolefout; waarschuwingen worden alleen gemeld (`WARN=999` toont ze allemaal).

Fouten:

- een knoop zonder naam, een groep zonder kinderen, een onderdeel zonder geometrie, NaN in de geometrie, een ongeldige omhullende, een ongeldige uitklapvector;
- een onderdeel buiten de omhullende van de auto (|x| ≤ 1,15, y van −0,08 tot 1,62, |z| ≤ 2,48);
- carrosserie buiten ZR tot ZF (6 mm marge voor kentekenplaten); carrosserie breder dan 0,915 (zonder spiegels) of 1,035 (met spiegels); een niet-carrosserie-onderdeel breder dan 1,035. Dit zijn de nieuwe lengte- en breedtegrenzen uit audit C08;
- een onderdeel buiten de carrosserie dat boven de carrosserie uitsteekt, gemeten met een straal van boven op het hoogste punt (meer dan 4 mm);
- te weinig ruimte onder de motorkap, met twee regels: minder dan 2,5 cm tussen het hoogste punt van een onderdeel en de buitenhuid van de kap, en minder dan 0,5 cm tussen dat punt en de laagste laag van de motorkap (binnenframe of isolatiemat);
- een onderdeel dat zijdelings meer dan 2 mm door de huid steekt, onder de schouderlijn en boven de onderkant (uitzonderingen: banden, velgen, wielbouten, naafdoppen, ventielen, banden-spanningssensoren, balansgewichten, tankklep en -dop, uitlaateindstukken);
- ankers: elke naam uit `tools/anchors.json` komt precies één keer voor; de acht kinderen van de wortel staan in de afgesproken volgorde; `Onderstel` heeft precies de vier afgesproken kinderen; de `contains`-paren hangen goed; de `content`-regels halen hun minimum; de 26 openers (`openers`, als pad, want namen als Zijruit komen vier keer voor) en de 43 preset-id's (`preset_ids`) zijn precies die van de pagina, zodat een verdwenen of hernoemde opener of preset een fout is;
- presets (via `checkPresets()`): elke naam bestaat precies één keer, `open`, `deep`, `select` en `labels` liggen onder de `iso`-groep (bevatting), elke `labelOnly`-naam is een kind van de labelgroep, id's, sneltoetsen en categorieën kloppen en de rondleiding noemt bestaande presets.

Waarschuwingen: korte of ontbrekende beschrijving, groep met één onderdeel, dubbele naam binnen een groep, een dubbel onderdeel op dezelfde plek, een uitklapvector van nul.

### `python3 tools/silhouette.py`

Meet de gemonteerde carrosserie met stralen en vergelijkt met het gemeten fase 2-silhouet: de bovenlijn op 20 stations in het zijaanzicht, de halve breedte op 17 stations in het bovenaanzicht en de raamlijn op 9 stations. De tolerantie is 0,03 m tussen de assen en 0,05 m in de overhang. De toets slaagt als hoogstens 2 stations per reeks buiten de tolerantie vallen en de halve breedte bij z = +2,30 hoogstens 0,40 is en bij z = −2,30 hoogstens 0,55. Spiegels, antenne, wissers en grepen tellen niet mee. Exitcode 1 als de toets niet slaagt.

### `python3 tools/itest.py`

Interactietest op desktop (muis) en telefoon (touch). Per controle een regel `ok` of `FOUT`, onderaan een samenvatting. Exitcode 1 bij een mislukte controle.

| Nr | Controle |
|---|---|
| 1 | Klik of tik vanuit Gemonteerd op Motorkap, Portier linksvoor, Wiel linksvoor en Koplamp links beweegt niets buiten de eigen subboom (meer dan 1 mm) en opent die groep. Een dubbeltik met 250 ms tussenpoos kiest het onderdeel van de eerste tik. 40 willekeurige klikken (vaste seed) doen precies wat `hoverTarget` aankondigt. |
| 2 | Dubbelklik op het diepste aanklikbare onderdeel opent al zijn voorouders en selecteert het. Zoeken naar "klepspie" in de boom ook. |
| 3 | Inklappen met rechtsklik, Shift+klik en lang drukken (touch) sluit de diepste open groep met zijn deelboom. |
| 4 | Gemonteerd zet elke knoop terug op zijn basispositie (afwijking onder 1e-6 m). |
| 5 | Stap terug na uitklappen, inklappen, preset en schuif herstelt de vorige `state()`. Sinds golf 5b-3 ook de camera: `state()` bevat geen camera, dus een Stap terug die de camera naar het kader van de preset trok, werd niet gezien. Per weergave (desktop en telefoon) vier gevallen (assembled naar engineAll, engine naar engineAll, assembled naar engine, assembled naar cooling): na de preset en Stap terug ligt de camera (positie en doel) binnen 0,05 m van de stand vóór de preset. Zonder de herkadreringscorrectie van tak G waren 6 van 8 gevallen fout (tot 9,5 m op de telefoon); met de correctie groen. |
| 6 | De explosieschuif op 0, 1 en 0,5 voor de werkgroep. |
| 7 | Elke preset: `checkPresets()` is leeg, het onderwerp ligt binnen het vrije beeld en beslaat minstens 12 % ervan. Sinds golf 5b-3 meet de test ook 1,5 s na elke preset opnieuw of het onderwerp binnen het vrije beeld staat (een kader dat pas na de eerste meting buiten beeld valt, werd eerder niet gezien). In de Linux-VM was dit rood voor engineAll, cooling, gearsets en frontAxle vóór de herkadrering van tak G; daarna staan alle presets binnen het beeld. |
| 8 | Labels overlappen niet, niet over de bediening en niet buiten het canvas, in zes standen. |
| 9 | Elke preset is bereikbaar met categorie plus item; de sneltoetsen 0 tot 9 werken. |
| 10 | Geen console-fouten of -waarschuwingen; geen horizontale scroll op de telefoon; de donkere modus geeft de verwachte achtergrond. |
| 11 | Informatie: tekenopdrachten in Gemonteerd en `profileFrames('Motor F4Rt', 120)` (p50, p95, max). Met `ITEST_GATES=1` worden dit controles: tekenopdrachten hoogstens 1.500 en p95 hoogstens 8 ms. |
| 12 | `inner`: een ingesloten knop is onzichtbaar en niet aanklikbaar zolang de ouder dicht is, zichtbaar zodra die uitklapt, weer verborgen na inklappen en zichtbaar bij isoleren. 12b: een opgetild onderdeel zakt terug bij `setExplode(0)`. |
| 13 | Gebundeld renderen: minder tekenopdrachten in Gemonteerd (op de eindstand 1.726 zonder en 390 met bundelen, grens 1.500 met), aanwijzen van een onderdeel in een gebundelde groep, een klik selecteert dat onderdeel en laat zijn groep los tekenen, openen maakt direct los en na het dichtklappen is de groep weer samengevoegd. |
| 14 | Openmodus: in Openen opent een klik op de ruit, de spiegel, de greep of het paneel van een dicht portier het portier; een dubbeltik doet hetzelfde als een klik; de camera-eindstand ligt in het vrije beeld; Alles open en Alles dicht; stap terug na openen; de presets Openen; de wissel naar Uitklappen laat de openers staan, uitklappen met open motorkap en achterklep houdt gasveren en koordjes aan hun ankers (`strutErr`, tijdens, na uit- en na inklappen), en terug in Openen blijven ze open. |
| 15 | Onderdeelnummers: de echte gegevens hebben geen onbekend pad of onbekende eenheid; daarna, met alleen tijdelijke records, de statussen, het bewijs, de bronlinks (alleen https, nieuw tabblad), de VIN-waarschuwing, het blok Gekozen voor deze auto met markering van de gekozen nummers, deel van een eenheid, zoeken op nummer en `pnCheck`. |
| 16 | Telefoon staand (390 × 844): de presetcategorieën staan in één zijwaarts schuivende rij (hoogte hoogstens 60 px) en elke categorie is bereikbaar; het vrije beeld is minstens 55 procent van de schermhoogte; na een keuze past het kader van de gekozen opener boven kaart en dock, gemeten aan de echte hoogtes. |
| 17 | Deelbare stand: `?preset=id` laadt die preset, `?open=naam,pad` opent die openers in de modus Openen, de adresbalk volgt preset en openstand (`replaceState`); `?debug=1` toont de overlay met tekensnelheid, tekenopdrachten en versie; `__model.version` is het versiestempel uit `build.py`. |
| 18 | Golf 5c-1, app (36 controles): foutpaden in een eigen context (`fault_page`: geen three.js, geen WebGL, een fout vóór en na `ready`, contextverlies en herstel met een nieuwe omgevingskaart) geven de melding met de versie; `uiLastFit` kadreert na een duik ook na draaien op het duikdoel; de rondleiding pauzeert, gaat terug en vooruit en pauzeert bij een verborgen tabblad; `integrity` en `crossorigin` op de scripttags; "+n meer" als labels wegvallen; fade en badge bij isoleren met Alles tonen; themaknop met geheugen in `localStorage`; toegankelijkheid (focusval en `inert` in het hulpvenster, menu-rollen, werkbalk met roving tabindex, focusrand op het canvas, schakelaarcontrast, tabs, live region alleen bij verandering, Esc sluit het mobiele paneel); hulpvenster uit `PRESETS`; zoeken met synoniemen en diakrieten; toast, suggestie en trilling; Beeld opslaan en de printstijl. Elke controle noemt de fout die hij gevangen zou hebben. |
| 19 | Toetsenbord (desktop, echte toetsaanslagen): Enter klapt de geselecteerde dichte groep uit en kiest haar, nog eens Enter de groep erboven (de selectie klimt mee), Shift+Enter klapt in; Enter op een onderdeel klapt zijn dichte groep uit en tilt het uit als alles open staat, Shift+Enter laat het zakken en klapt zijn groep in; Escape kiest de wortel en laat een uitgetild onderdeel zakken; `?` opent de uitleg met de focus op Sluiten, sneltoetsen erachter doen niets, Escape sluit en zet de focus terug; `/` zet de cursor in het zoekveld en typen gaat naar het veld (de o van "motorkap" wisselt de modus niet); pijltjes lopen door de boom (ouder, kind, buur) zonder iets uit te klappen en tellen in de historie; pijltjes op de modusknoppen en op de segmentknop wisselen de modus; Enter en Shift+Enter in Openen werken op de geselecteerde opener; het presetmenu met pijl omlaag, End, Home, Enter en Escape. Zou audit U29 (het model was niet met het toetsenbord te bedienen) gevangen hebben; dekt de toets `/` (U17) en Enter op een opener (golf 4). |
| 20 | Formaat wisselen in een desktopcontext: 1280 × 800 naar 390 × 844 (lade), terug, 844 × 390 (zijkolom), 1024 × 768 (kolom) en terug. Na elke wissel: de juiste indeling, geen horizontale scroll, labels zonder overlap binnen het vrije beeld, het kader van de selectie binnen het vrije beeld met minstens 12 procent dekking, geen nieuwe consolemelding. Zou bevinding I1 uit golf 2 (korte en liggende schermen zonder bruikbaar vrij beeld) en de bovenbalk op lage liggende schermen gevangen hebben. Het herkadreren na een duik (R3) toetst de app-agent zelf. |
| 21 | Stap terug tot 50 stappen: 55 pijltjesstappen geven een historie van 50, 50 keer Backspace geeft de stand van na stap 5, een 51e doet niets en de knop is uitgeschakeld. Reduced motion: met `emulate_media(reduced_motion='reduce')` en opnieuw laden staat `REDUCED`, de paneelovergang is uit, een uitklap staat na een tik in de eindstand en een preset staat direct in beeld zonder `finishAll()`; op de gewone pagina staat de uitklap na een tik nog aan het begin. Zou de bevindingen I5 en I6 (de stand volgde stap terug niet) over de volle diepte gevangen hebben; `REDUCED` bestond sinds golf 1 zonder controle. |
| 22 | Zoeken: "KLEPSPIE" en "klepspie" geven dezelfde treffers; "klépspie" vindt klepspie, "solenoide" vindt Solenoïde en "vacuum" vindt Vacuüm (de normalisatie op kleine letters en zonder accenten in `app1.js` en de synoniemen in `app2-panel.js`). Audit U17; beschermt het zoeken terwijl U10 het uitbreidt met synoniemen. |

Twee eigenschappen van de testbrowser (headless Chromium met SwiftShader) waar controle 18 rekening mee houdt: `requestAnimationFrame` tikt niet zolang er niets te tekenen is (0 frames per 500 ms in rust), dus animaties lopen in een test alleen via `finishAll()` of door `uiTick` zelf aan te roepen; en `page.click` duurt door de stabiliteitswacht seconden, zodat een rondleiding van 5 s per stap tijdens een test vanzelf doorloopt (de controle pauzeert hem eerst). De foutpaden draaien buiten de logregistratie van de harness (`fault_page`), omdat de melding zelf een consolefout is. Bij R5 (golf 5c-1) zijn in controle 15 twee verwachte `rel`-waarden aangescherpt van `noopener` naar `noopener noreferrer` (`UI_LINK_REL` in `src/app2.js`).

`ITEST_SHOTS=MAP` bewaart screenshots van de stappen. `ITEST_GATES=1` zet controle 11 als poort aan; zonder die variabele blijft 11 alleen informatie. De controles voor gebundeld renderen (nummer 13) staan in `tools/itest.py`. Het script telde voor golf 4 79 controles over desktop en telefoon samen (alle 79 slaagden op `9c731c8`). Op de stand van golf 5c-1 zijn het er 218: 161 tot en met controle 17 (golf 5 bracht er 155, controle 17 zes), 36 in controle 18 en 21 in de controles 19 tot 22; zie de resultaten hieronder. Met de openstand die bij de wissel naar Uitklappen blijft staan (16 oktober) zijn het er 222: in controle 14 maakte een controle per weergave plaats voor drie. Omdat gebundeld renderen losse meshes naar laag 1 verplaatst, zetten alle raycasters in de tools alle lagen aan.

### `python3 tools/opentest.py [--only namen] [--out map] [--strikt-min]`

Toetst elke opener van de modus Openen (26 stuks). `--only` beperkt de run tot de genoemde openers, `--out` bewaart de uitvoer in een map. Met `--strikt-min` (zo draait `finaltests.sh` hem) is een leider zonder `open.min` een fout, en ook een `min` onder 0,8 maal de volle hoek of slag: zo kan een agent een opener niet eerst kleiner maken en dan de ondergrens meenemen. Een volger zonder eigen `min` blijft een melding. Per opener zes controles:

| Nr | Controle |
|---|---|
| 1 | Eindstand: de gemeten hoek of slag uit de eigen meshes haalt de waarde van de opener. |
| 2 | Ondergrens: de eindstand haalt `open.min`, en `open.min` is minstens 0,8 maal de volle hoek of slag. Een volger zonder `min` geeft een melding; een leider zonder `min` of met een te lage `min` is met `--strikt-min` een fout. |
| 3 | Botsing: 400 monsterpunten van het bewegende deel in 16 stappen tegen alle niet-bewegende meshes. Het telt als botsing bij meer dan 5 mm doordringing die nieuw is ten opzichte van de gesloten stand. Contactparen die bij u = 0 al bestaan worden genegeerd. Uitzonderingen staan in `tools/open_allow.json` (9 regels, elk met reden). |
| 4 | Blootleggen: een raster van 160 x 100 stralen vanuit de camera van `look`. Toegestaan zijn 0 treffers op verborgen knopen en hoogstens 2 procent stralen die door de opening in het niets verdwijnen. |
| 5 | Prestaties met alle openers open: tekenopdrachten tegen 3.000, frametijd p95 bij `openAll(1)` en `openAll(0)` tegen 8 ms. |
| 6 | Spookbatchproef: de batchopbouw wordt onderbroken door een opener; daarna worden alle getoonde batches vergeleken met een verse opbouw. |

De uitzonderingen in `tools/open_allow.json` zijn contacten die bij de echte auto bestaan. Ze zijn voor domeineigenaars alleen-lezen. Voorbeelden: de slotbeugel van de motorkap die in het motorkapslot grijpt, en de raamsleuf, de ruitgeleiders en het portierrubber waar het glas van een zijruit doorheen zakt.

### `python3 tools/pubsmoke.py`

Publicatierooktest voor beide kanalen. Zet de kale CDN-pagina (zoals `build.py --bare` hem schrijft) in hetzelfde HTML-geraamte als de artefacthost, en laadt daarnaast `index.html` zoals GitHub Pages het serveert: een volledig document met doctype en viewport-regel. Hij laadt in Chromium en beantwoordt de verzoeken naar `cdn.jsdelivr.net/npm/three@0.147.0/` uit het lokale pakket. Controleert:

- geen console- of paginafouten, `__model` klaar binnen 20 s, `THREE.REVISION` is 147;
- staan de nummergegevens als JSON-blok `#pn` in de pagina (sinds golf 5c-2, P1), dan overleeft dat blok het geraamte van de host en is het leesbaar: `PN_DATA.map` heeft minstens één pad (`nummerpaden` in de uitvoer);
- het canvas heeft `touch-action: none` en `user-select: none`, en `-webkit-touch-callout: none` staat in de stylesheet (lang drukken op iOS);
- geen horizontale scroll op 1280 × 800 en 390 × 844;
- de Pages-versie op een telefoon (390 × 844): documentmodus `CSS1Compat` en een schermbreedte van 390 px. Tot 16 oktober had `index.html` geen doctype en geen viewport-regel, waardoor een telefoon de Pages-versie in quirks-modus op 980 px breedte toonde; het artefact had daar geen last van, omdat de host een geraamte toevoegt. De tests vingen het niet, omdat ze de pagina altijd in een eigen geraamte laadden. Gevonden bij de vergelijking met espace5, waar `build.py` het al zo deed;
- via `curl` en de proxy: elk CDN-bestand bestaat en is byte voor byte gelijk aan het lokale pakket, en de stylesheet van Google Fonts is bereikbaar.

Na publicatie moet GitHub Pages byte voor byte `index.html` serveren, en moet het artefact de kale pagina uit `build.py --bare` bevatten. Dat controleert dit script niet. De orkestrator leest beide URL's terug; in de pagina van het artefact zoekt hij de kale pagina byte voor byte: het bestand moet er precies één keer en aaneengesloten in staan, met alleen het paginaskelet van de host eromheen. De uitkomst staat in de tabel hieronder.

### `python3 tools/pncheck.py [--tree] [--update]`

Herbouwt `src/partnumbers.js` en `docs/onderdeelnummers.csv` uit `data/pn/` in het geheugen en vergelijkt byte voor byte met de gecommitte bestanden (zonder browser; in de push-job van CI). Met `--tree` vergelijkt hij ook `data/tree.json` met de boom van de pagina; `--tree --update` schrijft `data/tree.json` opnieuw. Exitcode 1 bij een verschil, een pad buiten de boom, een onbekende eenheid, een keuze met een nummer dat niet in de lijst staat, of een bron zonder https. De bouw stopt ook bij een bron-URL met `|` of een spatie (de CSV scheidt bronnen met `|`). De statistiek noemt sinds golf 5d ook `csv_rijen`, `bytes_csv`, `bronnen_uniek_in_csv`, `bronnen_met_page` (URL's met `?page=N`, nog 24) en `namen_met_schuine_streep`. Het schema van de CSV staat in `onderdeelnummers-schema.md`.

### `python3 tools/tri.py [--gate] [--json UIT.json]`

Telt driehoeken per hoofdgroep (met het aantal onderdelen per groep, zodat een zwaar deel dat van groep wisselt zichtbaar blijft) en toont de 25 zwaarste onderdelen. Met `--gate` faalt hij boven de budgetten in `tools/anchors.json` (`triangle_budgets`: 700.000 totaal, 240.000 Aandrijflijn, 190.000 Carrosserie, 125.000 Onderstel, 95.000 Interieur, en per systeem). De budgetten zijn alleen-lezen voor domeineigenaars; wijzigen alleen met een reden in `docs/onderzoek/beslissingen.md`. Zonder `--gate` is hij informatie.

### `python3 tools/visdiff.py BEELDMAP BASISMAP [--drempel 1.5] [--tolerantie 16] [--schaal 2] [--uit RAPPORT]`

Visuele regressie. Verkleint elke PNG in BEELDMAP (de uitvoer van `tools/orkestratie/presetshots.py`) met een vaste factor (standaard 2, Lanczos: 1280 × 800 wordt 640 × 400), vergelijkt hem met de gelijknamige PNG in BASISMAP (die al op die maat staat) en telt per beeld het aandeel pixels waarvan een kanaal meer dan de tolerantie (standaard 16 van 255) afwijkt. Boven de drempel (standaard 1,5 procent) is het beeld rood; dan komt er een verschilbeeld (basis, nieuw, afwijking in rood, op de verkleinde maat) in RAPPORT, naast `visdiff.json`. Een beeld dat in een van beide mappen ontbreekt of na het verkleinen een ander formaat heeft is ook rood. Een regel per beeld, onderaan een samenvatting; exitcode 1 bij een rood beeld.

De basislijn staat in `docs/baseline/`: de 42 presets zonder rondleiding, verkleind naar 640 × 400 en teruggebracht tot 256 kleuren (Pillow `quantize` met `MAXCOVERAGE`, dat de grootste kleurfout klein houdt, hier hoogstens 12 stappen per kanaal, en ongeveer de helft kleinere bestanden geeft dan de mediaansnede van `docshots.py`), samen 2.235.862 bytes sinds `a5a1db2` (versie 10; daarvoor 2.230.500 bytes, de Linux-basislijn van `3be230e`, versie 9; de eerste basislijn, `b0fcc45`, was 2.313.903 bytes; op volle maat met de mediaansnede was het 9,4 MB). Ze is gemaakt met `python3 tools/visdiff.py --basislijn UITVOER_VAN_PRESETSHOTS docs/baseline`. Gemeten op `69cd0fd`: de basislijn tegen zichzelf 0,000 procent op alle 42 beelden; twee verse `presetshots`-reeksen op dezelfde stand tegen de basislijn 0,000 procent op alle 42 beelden bij de standaardtolerantie van 16 (bij tolerantie 12 hoogstens 0,038 procent, bij "Alles uit elkaar"), dus de ruisvloer van verkleinen en kwantiseren ligt ver onder de helft van de drempel. Sinds 16 oktober 2026 (stand `0c799f2`, versie 9) komt de basislijn uit de Linux-VM `lag3-vm` (zie de sectie Linux-VM hieronder): twee presetreeksen in de VM wijken 0,00 procent van elkaar af. Op een ander platform zie `VISDIFF_BASIS` bij `finaltests.sh`. Alleen de orkestrator vernieuwt de basislijn, in een eigen commit met een voor/na-galerij (struikeldraad T8); een domeinagent die rood ziet, herstelt de weergave of legt in zijn rapport uit waarom het beeld moet veranderen.

### `python3 tools/anchorcheck.py [--json UIT.json] [--basis BASIS.json] [--only id,id]`

Labelankers per preset (zonder de rondleiding, 1280 × 800). Na `preset(id)` en `finishAll()` leest het script de geplaatste labels met hun ankerpunt (`uiSpots`, dezelfde lijst als `labelRects()`) en schiet door elk ankerpunt een straal vanuit de camera over de aanklikbare meshes (`uiPickList()`, dezelfde lijst als een klik). Twee maten per anker: eigen (op de straal ligt een treffer op het gelabelde onderdeel of een afstammeling binnen 1 cm van het ankerpunt, dus het anker zit op het eigen deel en niet in de lucht) en vrij (de eerste treffer op de straal is het gelabelde onderdeel, dus niets staat ervoor). Per preset en in totaal: labels, eigen, vrij, met de namen van de ankers achter een ander deel en in de lucht. `--json` bewaart de uitkomsten; `--basis` vergelijkt de twee totalen met een eerder bewaard bestand en is rood als een van beide daalt (de poort "geen van beide daalt"). Zonder `--basis` is het script informatie; consolefouten geven altijd exitcode 1. Op `69cd0fd`: 42 presets, 352 labels, eigen 319, vrije zichtlijn 267 (de meting van golf 3 in de sectie Labelankers hieronder was 261 van 345 op 36 presets, met de hand).

### `python3 tools/shot.py MAP 'JSON'`

Screenshots en `eval`-stappen per viewport. Voorbeeld:

```bash
python3 tools/shot.py /tmp/shots '[["desk",1280,800,["shot:gemonteerd","eval:__model.preset(\"main\"); __model.finishAll(); 1","wait:800","shot:hoofdgroepen"]]]'
```

Breder dan 700 pixels is desktop, smaller is touch. Stappen: `eval:`, `wait:`, `click:`, `shot:`. Een screenshot van een grote explosie heeft in software-rendering een lange time-out nodig (180 s is ingesteld). Geeft altijd 0; console-meldingen worden alleen getoond.

### `python3 tools/ui_inner.py`

Controleert in de gemonteerde stand vanuit ten minste 200 richtingen rond de hele auto en rond elke hoofdgroep afzonderlijk geïsoleerd of een `inner`-knop de eerste treffer van buitenaf is: dan zou het verbergen een gat in de auto laten. Dit script is nieuw in golf 2 en staat in de samengevoegde boom. Opties: `--strict` (exitcode 1 bij een zichtbare ingesloten knoop), `--json`, `--open` (zie hieronder) en `UI_INNER_DIRS` voor het aantal richtingen. Uitvoer op de eindstand (`9c731c8`): 253 ingesloten knopen in de boom, 200 richtingen per weergave, 39.200 stralen op de hele auto en 20.000 per hoofdgroep, 0 eerste treffers op een ingesloten onderdeel, dus 0 overtreders voor elke eigenaar. De opbergbak in de middenconsole is in de carrosserieronde niet meer als ingesloten gemarkeerd, omdat dit script er door de zijruit een treffer op vond; daarom zijn het 253 knopen en niet meer 256. Direct na de samenvoeging van golf 2 waren er 52 zichtbare ingesloten knopen (carrosserie, interieur, onderstel, systemen, aandrijving en motor); de herstelronde heeft ze opgelost.

### `python3 tools/ui_inner.py --open`

Dezelfde controle met alles open: welke ingesloten knopen worden zichtbaar als de openers open staan. Een knoop die zichtbaar wordt door een opening is een reden om de `inner`-vlag weg te halen. Na golf 4 zijn op deze manier veel vlaggen weggehaald (onder meer de koppelomvormer en het onderstel).

### `tools/orkestratie/finaltests.sh UITVOERMAP`

Draait de volledige testset in twee parallelle reeksen: lint, smoke, integrity, silhouette, `ui_inner.py --open --strict` en `opentest.py --strikt-min` in de ene reeks; `itest.py` met poorten, `tri.py --gate`, pubsmoke en stats in de andere. De uitvoer per test staat in de map, met per test de duur en de exitcode op de laatste regel, en `start.txt` en `einde.txt`. Het script geeft exitcode 1 zodra één test faalt en weigert zonder uitvoermap. De lijst van tests staat in `tests.txt`, zodat CI kan zien of er een test uit de set is gevallen.

Een auto kan extra tests aanmelden met het optionele veld `extraTests` in `auto.json` (regels en voorbeeld: [framework.md](framework.md), sectie Extra tests per auto). Die draaien als derde parallelle reeks naast de twee vaste, elk met een eigen `NAAM.txt` en dezelfde strikte exitcode (een ontbrekend `NAAM.txt` telt als FOUT), en staan in `tests.txt` achter de vaste lijst. Zonder het veld, zoals in deze repo, zijn uitvoer, `tests.txt` en exitcode ongewijzigd. Een ongeldig veld maakt de set meteen rood, nog voor er een test draait; `framework.py check` meldt het eerder.

`VISDIFF_BASIS` kiest een andere basislijn voor `visdiff` dan `docs/baseline`. Software-rendering is niet vergelijkbaar tussen platforms: op macOS wijkt een beeld circa 2 procent af van de basislijn (Linux-container), in de Linux-VM `lag3-vm` (Apple container, image `explosie-test:1`, Ubuntu 24.04 arm64) 33 procent door bredere tekstrendering, en ook tegen de Mac 6 tot 31 procent. Een run op een ander platform dan de basislijn meet dus eerst een eigen basis op dezelfde machine en bouwt (bijvoorbeeld de presets van de startstand met `presetshots.py`) en zet `VISDIFF_BASIS` daarop. Zo liep golf 5b-2 tegen een basis B0 van de Mac. Zwakte: een afwijking die al in de eigen basis zit, is onzichtbaar; de basis moet dus van een groene startstand komen. De functietests (itest, opentest, integrity) zijn wel platformonafhankelijk; de ankerpoort niet (op de Linux-VM 351/318/263 tegen 352/319/265 op de Mac).

## Linux-VM (image `lag3-vm:1`)

De Linux-basislijn van `visdiff` en de Linux-functietests komen uit het image `lag3-vm:1` met Apple container op de Mac van de gebruiker. Elke container is daar een eigen lichte Linux-VM. Sinds 19 oktober 2026 draait elke run in een tijdelijke container die na afloop vanzelf verdwijnt (`container run --rm`), zoals in alto: `tools/lag3-vm.sh test [--repo PAD] [UITMAP]` en `tools/lag3-vm.sh sh [--repo PAD] [CMD]`. Er staat dus geen VM in rust die geheugen vasthoudt. `--repo` werkt voor een repo of een worktree (bij een worktree wordt de hoofdrepo gekoppeld en wijzen `GIT_DIR` en `GIT_WORK_TREE` naar de worktree), en ook voor espace5 (`--repo ~/Documents/GitHub/espace5`). `start`, `status`, `stop` en `rm` beheren nog de oude vaste VM `lag3-vm`, die niet meer nodig is.

| Instelling | Waarde |
|---|---|
| Naam | tijdelijk `lag3-tmp-<pid>` per run (de oude vaste VM heet `lag3-vm`) |
| Image | `lag3-vm:1` (gelijk aan `explosie-test:1`, digest `sha256:c9672118f5b36dc10af98985ca1205d6c86b22b90360c88eaf5420130eed57e0`, gemaakt op 16 oktober 2026 om 17:54 UTC) |
| Exacte kopie | `~/.cache/explosietekening/lag3-vm/lag3-vm-1.oci.tar` (661.947.392 bytes, SHA-256 `34e07bdd51cc928609dafd267d8e7f14b78f1a3799ce341d20aa0b67f78e2899`); `start` laadt dit archief als het image ontbreekt |
| Nabouw | `tools/vm/Containerfile` (uit de geschiedenis van het image, met vastgezette versies); alleen als het archief ontbreekt. Een nabouw is niet byte voor byte gelijk; maak na een nabouw een nieuwe basislijn |
| Platform | linux/arm64, Ubuntu 24.04.5 LTS, kernel 6.18.35, geen Rosetta |
| Software | Python 3.12.3, Node 18.19.1 (geen npm), Playwright 1.64.0 met Chromium 1248 (`/ms-playwright`), Pillow 12.3.0, NumPy 2.5.4, 50 lettertypen (fontconfig) |
| Middelen | 8 CPU's (`LAG3_CPUS`), 8 GB geheugen (`LAG3_MEM`); 8 en niet 15, zodat een andere zware container (zoals `explosie-test:1` van alto) de Mac niet boven een belasting van circa 30 trekt, waar tests met een tijdgrens vals rood worden. De oude vaste VM had 4 CPU's |
| Koppelingen | de repo (bij een worktree de hoofdrepo) op `/repo`; `~/.cache/explosietekening` op `/root/.cache/explosietekening` (three.js 0.147.0 en de Fonts-cache van de harness); `~/.cache/explosietekening/lag3-vm/out` op `/out` |
| Omgeving | `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, `PIP_BREAK_SYSTEM_PACKAGES=1`, werkmap `/repo`, gebruiker root, `git safe.directory '*'` |
| Host | macOS, `container` CLI 1.5.0 (Homebrew, `/opt/homebrew/bin/container`) |

Gemeten op 16 oktober 2026: smoke in de VM 2,8 s (desktop) en 18,9 s (telefoon); de volledige set ongeveer 20 minuten. Platformgebonden: de ankerpoort (in de VM 351/318/263 tegen 352/319/265 op de Mac en in de oude container; `docs/baseline/anchorcheck.json` blijft die van de Mac) en itest controle 7 (preset "Tandwielsets en koppelingen" valt in de VM buiten het vrije beeld: de presetbalk loopt door de bredere tekst over twee regels, het vrije beeld is 431 px hoog tegen 527 op de Mac; golf 5b-3). Op de Mac draait `visdiff` met `VISDIFF_BASIS` op een eigen basis van de Mac.

## Bevroren testcontract

De tests spreken de pagina aan via `window.__model` (de testkoppeling in `src/app2-loop.js`, hierboven beschreven; sinds het framework van 16 oktober heet hij in elk model zo, en `AUTO.hook` in `auto.json` geeft hem per auto een tweede naam, hier `window.__laguna`), maar op een aantal plekken ook rechtstreeks via interne namen van de app: globale functies en variabelen uit `src/*.js` die in `page.evaluate` bruikbaar zijn omdat de pagina één klassiek script is. Die namen zijn een contract: wie er een hernoemt, verplaatst of van betekenis verandert, levert de wijziging van het testscript in dezelfde commit en noemt dat in het commitbericht. De lijst is met grep over `tools/` gecontroleerd op `69cd0fd`.

| Script | Interne namen |
|---|---|
| `tools/itest.py` | `applyVisibility`, `PN_DATA` (controles 12 en 15); `renderer`, `scene`, `camera`, `canvas` (controles 11 tot 13 en de hulpfuncties); `REDUCED`, `uiTick` (controles 18 en 21); `uiFadeMat`, `uiFade`, `uiTick` (controle 18, de fade bij isoleren) |
| `tools/opentest.py` | `uiTick`, `uiBatchSync`, `uiBatchQ`, `uiBatchJob`, `uiBatchFree`, `uiBatchStep`, `uiBatchAdd`, `uiBatchInfo`, `uiBatched`, `uiBaseRel`, `uiAnchorFrame`, `updateLabels`, `uiOpenAnim`, `uiInnerHidden`, `requestRender`, `ASMS`, `SPREAD`; `ROOT`, `ALL`, `MESHES`, `camera`, `controls` |
| `tools/ui_inner.py` | `uiInnerHidden`, `uiOpenNear` |
| `tools/integrity.py` | `OPENERS`, `uiPathOf` (achter een `typeof`-controle) |
| `tools/pncheck.py` | `uiPathOf` |
| `tools/smoke.py` | `renderer`, `scene`, `camera` |
| `tools/anchorcheck.py` | `uiSpots`, `uiNPlaced`, `uiLabelAnchor`, `uiPickList`; `camera`, `canvas` |
| `tools/orkestratie/*` (hulpscripts, geen poort) | `camera`, `controls` (`gateshots.py`, `pick.py`), `scene` (`rays_bagage.py`) |

De renderlus staat sinds golf 5c-2 (P4) stil in rust: een frame wordt alleen getekend als er iets te doen is. Wie camera of scène via interne namen wijzigt (`camera`, `controls`, `scene`, `ROOT`, een materiaal of een positie), roept daarna `requestRender()` aan (dat start de lus via `uiWake()`); zonder die aanroep verandert er niets op het scherm en meet een test een oud beeld. Wat een animatie, rondleiding, invoer of formaatwissel begint, wekt de lus zelf.

Haken op `window.__model` die golf 5c-1 toevoegde en die controle 18 gebruikt: `lastError` (ook `window.__modelLastError`), `contextLost`, `lastFit()`, `tourState()`, `tour.pause`, `tour.resume`, `tour.prev`, `tour.next`, `labelsMore()`, `fading`, `isolated()`, `theme()`, `setTheme(t)`, `norm`, `searchTerms`, `saveImage()`, `toast(txt)`, `hintStage`, `hintNext()`.

Daarnaast hangen de tests aan element-id's, klassen en data-attributen uit `src/head.html` en de bediening in `src/app2-*.js` (`app2-panel.js`, `app2-controls.js`, `app2-labels.js`, `app2-input.js`, `app2-loop.js`). Voor `tools/itest.py`: `#sheet`, `#modes [data-mode]`, `#openSeg [data-omode]`, `#explode`, `#presets`, `[data-cat]`, `#menu`, `.mi`, `[data-preset]`, `#undo`, `#tabbtn-info`, `#tabbtn-tree`, `#tab-tree`, `#treeSearch`, `#treeInfo`, `#tree .trow .tn`, `#labels .lbl`, `#tip`, `#btnOpenAll`, `#btnCloseAll`, `#btnOpenList`, `#openList`, `#actOpen`, `#pnBody`, `#pnWarn`, `#pnBox`, `.pn-tab`, `#help`, `#helpDlg`, `#helpClose`, `#debug`. `pubsmoke.py` toetst de stijlregels van het canvas (`touch-action`, `user-select`, `-webkit-touch-callout`). Ook deze namen vallen onder het contract. De basislijn van `visdiff.py` (`docs/baseline/`), `IGNORE` in `tools/harness.py` en `tools/anchors.json` wijzigt alleen de orkestrator (struikeldraad T8).

### Hulpmiddelen van de visuele poort (`tools/orkestratie/`)

Golf 5 bracht de hulpmiddelen van de visuele poort en van het nameten in de repo. De scripts zonder REPO-argument gebruiken de checkout waarin ze staan. De tabel in `tools/orkestratie/README.md` heeft de aanroepen.

| Script | Wat het doet |
|---|---|
| `gateshots.py UITMAP` | De vaste beelden van de poort: elke opener via zijn knop, drie overzichten met alles open, het dak van boven en van binnen en drie telefoonbeelden, met een `index.json`. |
| `poort.js` | De poort zelf (Workflow-script): drie plakken met elk drie beoordelaars, meerderheid per kenmerk K1 tot K13. Leest de beelden van `gateshots.py`. |
| `pick.py` | Zet Openen aan, draait een voorbereiding en noemt per schermpunt het pad van het onderdeel dat er ligt. |
| `shots.py` | Gerichte opnames in de modus Openen. |
| `probe.py` | Draait een JS-expressie op de pagina en drukt het resultaat als JSON af; `window.__box(naam)` geeft het wereldkader van een knoop. |
| `rays_bagage.py` | Stralen vanuit het midden van de bagageruimte naar links en rechts: vrije ruimte en het eerste onderdeel. |
| `phone.py` | Twee telefoonbeelden (390 x 844) en de scrollbreedte. |
| `dumptree.py` | De hele boom als JSON. |
| `clash.py KNOOP... [--straal MM]` | Doordringing en kleinste afstand van knopen tegen het hele model, ook binnen dezelfde hoofdgroep (waar `integrity.py` niet kijkt); toegestane paren in `data/clash-toegestaan.json`. Gekalibreerd op het Leidingblok (-10,5 mm met de Koude laadluchtslang). Bemonstert op ongeveer 5 mm: een holte binnen een deel mist het. Sinds `a000772` ververst de cache van `meetlib.js` per stand (geometrie, versie en `matrixWorld`); open metingen van daarvoor, binnen één sessie, gebruikten de dichte geometrie en gelden niet. Voor een regel over de hele beweging meet de orkestrator met de standenzwaai: de 26 openers in stappen van 0,05, plus dicht en alles open. De hoofdmeting is bij een bemonsteringsafstand h van 4 mm; grensgevallen tot 0,2 mm dieper dan B0 worden bij h 1,5 mm opnieuw gemeten, en zijn ruis als de excess daar hooguit 0,1 mm is. Dat is een losse procedure en geen script in de repo. |
| `huid.py --bewaar` en `--vergelijk` | Legt de huid van een knoop vast en meet later de afwijking (maximum en 95-percentiel, met de plek); poort van G1 was hoogstens 2 mm op zichtbare zones. |

Bij `shots.py` en `gateshots.py`: onder software-rendering rondt een tekenopdracht pas na 5 tot 15 s af (onder belasting langer), en `Page.screenshot` wacht daarop. `shots.py` wacht daarom eerst twee animatieframes en neemt op met `MODEL_TIMEOUT_MS` (standaard 120 s) in plaats van de 30 s van Playwright.

## Resultaten

De kolom "Na golf 1" is de tussenstand van 13 oktober 2026 rond 11:30 UTC, ongewijzigd uit het overdrachtsdocument van golf 1. De kolom "Eind golf 2" is gemeten op commit `ead92f6`, behalve waar een rij anders zegt. De derde kolom is gemeten op `d6d0456`, na de visuele herstelronde (`index.html` gebouwd in `60909fe`). De laatste kolom is de carrosserieronde: de volledige testset (uitvoer in het scratchpad, `g3final5`) draaide op `9c731c8` op 13 oktober rond 23:45 UTC. De eindstand van de code is `ff42dbd`; die commit verandert alleen de eindstukken van de uitlaat (`src/systems.js`). Daarop zijn alleen `integrity.py`, `ui_inner.py`, `smoke.py` en de publicatierooktest opnieuw gedraaid, en die waren groen. De overige scripts zijn niet op `ff42dbd` gedraaid; hun getallen horen bij `9c731c8`. `index.html` is gebouwd in `5b6cefa` uit `ff42dbd`. Alle tijden komen uit een container met software-rendering.

| Test | Na golf 1 | Eind golf 2 (`ead92f6`) | Na de visuele herstelronde (`d6d0456`) | Carrosserieronde (testset op `9c731c8`) |
|---|---|---|---| --- |
| `build.py --lint` | ok | ok | ok | ok |
| Boom | 1.762 knopen, 303 groepen, 1.459 onderdelen, diepte 7 | 2.878 knopen, 484 groepen, 2.394 onderdelen, diepte 8 | 2.881 knopen, 485 groepen, 2.396 onderdelen, diepte 8 (de stator van de dynamo is nu een groep van drie delen) | 2.924 knopen, 489 groepen, 2.435 onderdelen, diepte 8, 253 ingesloten knopen, 37 presets in 6 categorieën |
| Driehoeken | 419.554 | 599.972 (budget 700.000). Aandrijflijn 245.794 (budget 240.000, dus 5.794 erboven), Carrosserie 130.026, Onderstel 109.916, Interieur 67.608, Koeling en luchtinlaat 18.700, Uitlaatsysteem 12.832, Brandstofsysteem 7.608, Elektrisch systeem 7.488 | 604.972 (budget 700.000). Aandrijflijn 250.794 (budget 240.000, dus 10.794 erboven); de andere hoofdgroepen ongewijzigd | 630.368 (budget 700.000). Aandrijflijn 237.310 (budget 240.000, dus binnen budget), Carrosserie 165.546 (budget 190.000), Onderstel 110.204, Interieur 70.328, Koeling en luchtinlaat 18.700, Uitlaatsysteem 13.184, Brandstofsysteem 7.608, Elektrisch systeem 7.488 |
| Tekenopdrachten gemonteerd (grens 1.500) | 1.052 | 1.680 zonder bundelen (boven de grens) | 1.682 zonder bundelen (boven de grens) | 1.726 zonder bundelen (boven de grens) |
| Tekenopdrachten gemonteerd met gebundeld renderen | niet aanwezig | 369 (41 groepen, 301 batchmeshes, 1.612 losse meshes vervangen, 21,6 MB van 42,2 MB) | 370 (41 groepen, 302 batchmeshes, 1.614 losse meshes vervangen, 21,9 MB van 42,6 MB) | 390 (41 groepen, 318 batchmeshes, 1.654 losse meshes vervangen, 24,2 MB van 45,3 MB) |
| Tekenopdrachten volledig uitgeklapt (grens 3.000) | niet vastgelegd na golf 1 | 1.495 in één weergave van `smoke.py` (396.652 driehoeken in beeld) | 1.506 in één weergave van `smoke.py` (398.044 driehoeken in beeld) | 1.517 in één weergave van `smoke.py` (415.047 driehoeken in beeld) |
| Frametijd `profileFrames('Motor F4Rt', 120)` (p95 grens 8 ms) | p50 0,3 ms, p95 0,6 ms | p50 0,5 ms, p95 0,7 ms, max 1,9 ms (uit `itest.py` op `ead92f6`; op `6eca637` gelijk) | p50 0,5 ms, p95 1,1 ms, max 4,9 ms (uit `itest.py`, terwijl de andere tests tegelijk draaiden) | p50 0,5 ms, p95 1 ms, max 3,4 ms (uit `itest.py`, terwijl de andere tests tegelijk draaiden) |
| `buildCar()` (grens 600 ms) | niet vastgelegd na golf 1 | 526 ms (`buildCar` 1.147 min `buildStart` 621 in `__model.timing()`, één meting) | 123 ms (`buildCar` 665 min `buildStart` 542, één meting op een minder belaste machine) | 166 ms (`buildCar` 854 min `buildStart` 688 in `stats.json`, één meting) |
| `smoke.py` | geen console-fouten | geen console-fouten of -waarschuwingen; telefoon scrollt niet horizontaal; laadtijd 20,6 s op 1280 x 800 en 17,9 s op 390 x 844 | geen console-fouten of -waarschuwingen; telefoon scrollt niet horizontaal; laadtijd 14,6 s op 1280 x 800 en 24,4 s op 390 x 844 terwijl de itest tegelijk draaide (de grens van 20 s geldt voor `pubsmoke.py`) | geen console-fouten of -waarschuwingen; telefoon scrollt niet horizontaal; laadtijd 8,0 s op 1280 x 800 en 28,1 s op 390 x 844 terwijl de itest tegelijk draaide. Op `ff42dbd` opnieuw zonder consolemeldingen (laadtijd 8,4 s en 23,3 s, tegelijk met de publicatierooktest) |
| `integrity.py` | 13 fouten, alle in domeinen van golf 2; 0 ankerfouten; 0 presetfouten | 0 fouten, 0 ankerfouten, 0 presetfouten, 124 waarschuwingen (vooral uitklapvector nul bij ankers) | 0 fouten, 0 ankerfouten, 0 presetfouten, 126 waarschuwingen | 0 fouten, 0 ankerfouten, 0 presetfouten, 126 waarschuwingen. Op `ff42dbd` hetzelfde (2.924 knopen, 2.435 onderdelen) |
| `silhouette.py` | OK, 46 van 46 stations binnen tolerantie | OK, 46 van 46 stations binnen tolerantie (20 zijaanzicht, 17 bovenaanzicht, 9 raamlijn; 318 carrosseriemeshes gemeten) | OK, 46 van 46 stations binnen tolerantie | OK, 45 van 46 stations binnen tolerantie (355 carrosseriemeshes gemeten). De enige uitschieter is het raamlijnpunt bij z = −0,155: dat ligt nu in de bredere B-stijl (referentie: zwarte beplating op de gordel van z −0,28 tot −0,13), dus de straal raakt daar geen glas. Dat is een meetartefact van de plaats van het station en geen fout in de raamlijn. De toets slaagt omdat hoogstens 2 stations per reeks buiten de tolerantie mogen vallen |
| `itest.py` (twee keer achter elkaar) | 71 van 72 (een telefoontik als lang drukken gelezen onder belasting) | 78 van 78 na de samenvoeging van golf 2; 79 van 79 op `6eca637` en op `ead92f6` (zie de volgende rij). Een tweede achtereenvolgende run op dezelfde commit is niet vastgelegd. | zie de volgende rij | zie de volgende rij |
| `ITEST_GATES=1 python3 tools/itest.py` | niet vastgelegd na golf 1 | 79 van 79 op `6eca637` en opnieuw 79 van 79 op de eindstand `ead92f6` (11: 369 tekenopdrachten, p95 0,7 ms) | 78 van 79, twee keer achter elkaar gelijk (de tweede keer zonder andere tests ernaast). De ene fout: op de telefoon koos tik 4 van de 40 willekeurige tikken (stand Gemonteerd) het buurdeel. Het aanwijzen gaf `Binnenframe motorkap`, de tik selecteerde `Koplampsproeiers`. `pick()` is in deze ronde niet veranderd. De vaste steekproef schuift wel mee met de lijst meshes, en die veranderde door de nieuwe stator. Vermoedelijk ligt het punt op de rand van twee onderdelen; dat is niet bewezen en niet opgelost. (Later bewezen als echte app-fout en opgelost; zie "Het itest-randgeval" hieronder.) De andere 78 controles slaagden, ook 11 (370 tekenopdrachten, p95 1,1 ms) en 13 (bundelen). | 79 van 79 (11: 390 tekenopdrachten, p95 1 ms). Vlak daarvoor was een losse run op `9c731c8` ook 79 van 79. Eerder ook 79 van 79 op `34d3469` (twee keer achter elkaar) en op `efaba28`. Het randgeval van de vorige kolom was een echte app-fout en is opgelost; zie "Het itest-randgeval" hieronder |
| `pubsmoke.py` | OK | OK: `ready` na 14,8 s (1280 x 800) en 7,2 s (390 x 844), grens 20 s; three r147; geen horizontale scroll | OK: `ready` na 7,5 s (1280 x 800) en 7,7 s (390 x 844), grens 20 s; three r147; geen horizontale scroll | OK: `ready` na 5,2 s (1280 x 800) en 8,0 s (390 x 844), grens 20 s; three r147; geen horizontale scroll. Op `ff42dbd` opnieuw OK: `ready` na 12,2 s en 9,9 s onder belasting |
| `ui_inner.py` | bestond nog niet | 0 eerste treffers op 256 ingesloten knopen (na golf 2 waren het er 52) | 0 eerste treffers op 256 ingesloten knopen | 0 eerste treffers op 253 ingesloten knopen (39.200 stralen op de hele auto, 20.000 per hoofdgroep). Op `ff42dbd` hetzelfde |
| URL na publicatie gelijk aan `index.html` | niet van toepassing | Gelijk. Versie 2 van de URL, teruggelezen op 13 oktober om 17:00 UTC, bevat `index.html` van `8095a3e` (618.341 bytes, md5 `dc2bc3b0…`) precies één keer en aaneengesloten. Daaromheen staan alleen het vaste paginaskelet van de host (531 bytes: doctype, charset, viewport en basisstijl tot en met `<body>`) en de afsluiting `</body></html>` (15 bytes). | Gelijk. Versie 3 van de URL, teruggelezen op 13 oktober om 17:37 UTC, bevat `index.html` van `60909fe` (620.025 bytes, md5 `d92a8bb2…`) precies één keer en aaneengesloten, met hetzelfde paginaskelet ervoor (531 bytes) en dezelfde afsluiting erna (15 bytes). | Gelijk. Versie 4 van de URL bevat `index.html` uit `ec92a53` (commit `9c03015`, 663.654 bytes, md5 `70b2e62a426312ec788fc851086ab4c6`) precies één keer, met alleen het paginaskelet van de host eromheen (531 bytes ervoor, 15 erna). Versie 5, gepubliceerd op 14 oktober en teruggelezen om 00:02 UTC, bevat `index.html` uit `ff42dbd` (commit `5b6cefa`, 678.887 bytes, md5 `649cbf95397d877f6a361600c42a4afd`) precies één keer en byte voor byte gelijk, met hetzelfde skelet (531 bytes ervoor, 15 erna) |

## Resultaten golf 5c-2 (18 en 19 oktober 2026), tak `golf-5c2` (versie 11, gebouwd)

Stand: tip `84b9adc` (advisor ronde 1 verwerkt), `index.html` nog niet herbouwd voor de publicatie. De set hieronder wordt op de eindstand gedraaid; tot die uitslag er is, staan hier plaatshouders.

| Test | Uitslag |
|---|---|
| Volledige strikte set op macOS (`tools/orkestratie/finaltests.sh`) | op `84b9adc` (19 oktober 2026, 05:02 tot 05:14 UTC) alles groen in één run: 13 van 13 tests, itest 232 van 232, visdiff 42 van 42 tegen een eigen Mac-meting van `ca0e159`, anchor ok; ruis: alleen `GPU stall due to ReadPixels` |
| Volledige set in de Linux-VM (`tools/lag3-vm.sh test`), inclusief `visdiff` op Linux | op `84b9adc` (05:14 tot 05:32 UTC) alles groen behalve visdiff, 40 van 42 tegen de basislijn van versie 10: 33-tailgate (2,52 procent, K9) en 38-openDoors (1,53 procent, K11), beide bedoeld en bekeken; daarna de Linux-basislijn vernieuwd in `922f416` (42 van 42 binnen de drempel, anchorcheck.json ongewijzigd) |
| `build.py --lint`, `pncheck.py`, `framework.py check`, `tri.py --gate` | ok op `84b9adc` (lint, pncheck en framework check los; `tri.py --gate` binnen de Mac- en de VM-set) |
| `pubsmoke.py` met het JSON-blok `#pn` | ok in de Mac- en de VM-set: het blok overleeft het hostgeraamte, 1.660 nummerpaden gelezen |
| Botsingsmeting in open stand (zwaai van achterklep en expansiedop) | 0 nieuwe doordringingen (ECHT 0) |
| S7 voor K11 (voorruit van buiten 0,92 en 0,80) | elk 8 van 9, alleen kenmerk 4 deels |
| Advisor ronde 1 (Opus, max) | PASS onder voorwaarden, geen P1; de P3-punten staan in `84b9adc` |

Openstand en toelatingen zijn niet gewijzigd. De opstartmeting van P1 en P4 (mediaan van 5, om en om, SwiftShader) staat in [masterplan.md](masterplan.md), "Stand na golf 5c-2"; de kerncijfers en de opstarttijdlijn in [cijfers.md](cijfers.md). Nieuw sinds deze golf in de testlaag: `pubsmoke.py` toetst `#pn` (hierboven) en `opentest.py` toetst met `EPS = 1e-6` (PR #8); `itest.py` is niet gewijzigd, ook niet voor de rustende lus (`PN_DATA` blijft bereikbaar als const die de gegevens bij het eerste gebruik leest).

## Resultaten golf 5b-3 (17 oktober 2026), tak `golf-5b3`, tot en met ronde 9 (versie 10, gepubliceerd)

De eindpoort van 5b-3 (K-panels tweemaal, `ui_inner` met 400 richtingen, fijne zwaai en S7 indien nodig) is gedraaid: op `a90786b` ROOD op één kenmerk (plak a K2 Voorportieren, de dorpel), na ronde 9 GROEN. Hieronder staat wat is gemeten: na fase 3, per ronde (rondes 2 tot en met 9, 17 oktober), de strikte sets op `a90786b` en `b775511` en de poort zelf (regels "Eindpoort op `a90786b`" en "Poort na ronde 9"). Kerncijfers en de opstarttijden (gemeten op de Mac, niet in de container): [cijfers.md](cijfers.md).

| Test | Uitslag |
|---|---|
| `build.py --lint` | ok, 0 meldingen, ook na het fout worden van R4, R5 en R7 en na het meetellen van `note` en `label` (0 nieuwe treffers) |
| `framework.py check` | ok, 45 generieke bestanden |
| Geometrie-hash (hele model, vóór en na het weghalen van `engClip` en `sysClampGeo`) | gelijk: dezelfde meshes, wereldmatrices en openers, 0 verschillen |
| `smoke.py` | geen console-fouten of -waarschuwingen |
| `pncheck.py` | ok |
| `tri.py --gate` | budgetpoort ok; de aantallen staan in [cijfers.md](cijfers.md) |
| `itest.py` met poorten (Mac) | 232 van 232 met de nieuwe camerabepaling van controle 5 (de herkadreringscorrectie van tak G aanwezig) |
| `mergecheck.py` | `tools/itest.py`, `tools/ui_*.py` en `tools/opentest.py` staan niet meer bij de eigen bestanden van de app maar bij de alleen-lezen bestanden; ook `tools/visdiff.py`, `tools/anchorcheck.py`, `tools/lag3-vm.sh` en `tools/vm/*` zijn alleen-lezen. De wijziging van `itest.py` in de app-tak wordt nu gemeld als overtreding en moet door de orkestrator met de hand worden toegestaan |
| `clash.py` per tak | geen nieuw doordringend paar; onder de strenge regel (geen paar dieper dan B0 plus 0,1 mm) zijn de gasveer, het krukaspoelie en de veren van het onderstel aangepast; de vulpijp heeft toelatingen met een maximale diepte (zie [onderzoek/beslissingen.md](onderzoek/beslissingen.md)) |
| `ui_inner.py --open --strict` met `UI_INNER_DIRS=400` | per tak 0 voor de eigen groep; op een proefsamenvoeging van de zeven takken exit 0 (Mac); de samengevoegde stand `a90786b` mat de eindpoort met 400 richtingen: ok (geen ingesloten knoop zichtbaar); na ronde 9 `--open --strict` 0 treffers |
| `anchorcheck.py` in de VM | ok op `d4d03a6` (platformgebonden getallen, zie hierboven) |
| Rondes 2 tot en met 9: `clash.py` en de meetmethode | Per ronde geen nieuw paar en geen paar dieper dan B0 plus 0,1 mm, maar de methode verschilt per ronde. De standenzwaai (de 26 openers in stappen van 0,05, plus dicht en alles open) bestaat pas sinds ronde 6: ronde 2 mat doelgericht per paar, ronde 3 mat open standen vóór de meetlib-fix `a000772` (dus op de dichte geometrie) en ronde 4 mat in klepstappen van 0,1. De eindstand (ronde 9) is wel volledig gezwaaid. Uitzondering in ronde 4: de Plankscharnierpen links en rechts lagen tot 10,62 mm in de voorrand van de plank (de pen ligt op de draai-as); ronde 7 heeft dat opgelost met een sparing in de voorhoeken. Ronde 6: de paren Zijruit voor met B-stijl zijn weg, en bij h 1,5 mm dringt geen ruit in de B-stijl |
| De ruisproef (sinds ronde 6) | De ruisproef werkt zo: de hoofdmeting is bij een bemonsteringsafstand h van 4 mm, per stand tegen dezelfde stand van B0. Een paar dat daar meer dan 0,1 mm maar hoogstens 0,2 mm dieper ligt dan B0 is een grensgeval en wordt opnieuw gemeten bij h 1,5 mm, op de werktak en op B0. Is het verschil (de excess) daar hooguit 0,1 mm, dan is het RUIS van de bemonstering en geen overtreding; meer is ECHT. Een overtreding die alleen bij h 1,5 mm optreedt heet alleen_fijn en telt ook. Sinds ronde 8 is de eindstand ook bij h 1,5 mm voor de achterklep zonder overtreding (dicht, alles open en alle 21 standen van Achterklep, plus het grensgeval Zijruit rechtsachter@0.95). |
| Ronde 7 (hoedenplank, `e6cbcea`): zwaai tegen B0 | Bij h 4 mm ECHT 0, RUIS 1: Ruitdrager tegen Waterscherm bij Zijruit rechtsachter@0.95 (B0 7,92 tegen werktak 7,93 mm bij h 1,5 mm); bij h 1,5 mm nog 11 alleen_fijn (Cilinder tegen Gasveerbevestiging), opgelost in ronde 8. De pennen liggen vrij: de gemeten kleinste afstand over de beweging is 0,66 tot 1,02 mm (bemonstering h 4 en h 1,5 mm; de ontwerpspeling van de sparing is 1,5 tot 4 mm); de Hoedenplank ligt 2,60 mm in de Hoedenplanksteun, was 3,94 mm |
| Ronde 8 (gasveer, `fdbf21d`, samengevoegd in `5a2d10c`): zwaai | h 4 mm, 548 standen, 0 fouten, tegen de B0-meting: ECHT 0, RUIS 1 (hetzelfde grensgeval, +0,18 mm bij h 4 mm). h 1,5 mm (dicht, alles open, 21 standen van Achterklep en het grensgeval; werktak en B0): 0 overtredingen, alleen_fijn 0, ECHT 0. Kleinste marge onder B0: 1,99 mm bij h 1,5 mm en 1,26 mm bij h 4 mm |
| Ronde 8: `build.py --lint`, `tri.py --gate`, `ui_inner.py --open --strict`, `opentest.py --strikt-min` | ok; de aantallen van de budgetpoort staan in [cijfers.md](cijfers.md); `ui_inner` exitcode 0 (geen ingesloten knoop zichtbaar); `opentest` exitcode 0 zonder console-fouten, met 30 meldingen 'open.min ontbreekt (volger)' (ronde 7 had er ook 30) |
| Ronde 8: gateshots en presets voor (`89f8106`) en na | de gasveren zijn zichtbaar en vast, er zweeft niets; de beelden 05-achterklep, 95-telefoon-achterklep, 33-tailgate en 39-openTrunk verschillen met 11 tot 171 pixels boven 8 (vage randjes langs de cilinders en ruis over de klep, niet op de veren); beelden zonder gasveer verschillen met 1 tot 31 pixels, dus dit niveau is ruis |
| Ronde 9 (instaplijst, `457f729` en `1903e18`, samengevoegd in `d1321cb`): zwaai | h 4 mm, 548 standen, tegen B0: 0 fouten, één grensgeval (Zijruit rechtsachter@0,95, Ruitdrager tegen Waterscherm, 0,18 mm); ruisproef h 1,5 mm: 7,92 tegen 7,93 mm, RUIS. Fijne zwaai h 1,5 mm, 86 standen (4 portieren, dicht, alles open): ECHT 0. Ontwerpspeling verticaal voor 6 mm en achter 5 mm; gemeten in dichte stand 9,09 mm voor en 13,0 mm achter; over de hele beweging minimaal 9,1 mm |
| Ronde 9: onzekere paren zonder afstand (herkenning voor een volgende zwaai) | In de zwaai staan bij h 4 mm 4 en bij h 1,5 mm 6 ONZEKER-paren zonder afstand: de Portierrand van Portier rechtsvoor tegen Instaplijst of Sierstrip instaplijst voor rechts, bij stand f 0,6 tot 0,85. De aanvullende margemeting geeft 19,04 tot 24,39 mm vrij. Dat is een pariteitsartefact van de open schaal en geen contact; een volgende zwaai moet deze paren herkennen en niet als doordringing melden |
| Grensgeval Ruitdrager tegen Waterscherm (Portier rechtsachter, stand 0,8): opgelost met een toelating (`b536d6a`, samengevoegd in `934ace3`) | Besluit van de gebruiker, 17 oktober 2026: `data/clash-toegestaan.json`, `max_diepte_mm` 8,02 (B0-omhullende 7,92 mm bij h 1,5 mm plus 0,1 mm). Het eigenlijke grensgeval was stand 0,8 bij h 1,5 mm (B0 7,39 mm, na 7,51 mm, +0,12 mm, NOG TE BEOORDELEN), niet stand 0,95 (de ruisproef noemde alleen stand 0,95 bij h 4 mm RUIS). Met de toelating, gemeten op `3e5e491`: Zijruit rechtsachter en linksachter, elk 21 standen plus dicht en alles open, h 4 mm en h 1,5 mm: ECHT 0, NOG TE BEOORDELEN 0; diepste 7,93 mm, 0 standen boven 8,02 mm. Linksachter is niet opgenomen (excess maximaal +0,02 mm). Let op: het zwaaiscript van de orkestrator (`zwaaivgl.py`, niet in de repo) leest de toelatingen niet; alleen `clash.py --toegestaan` doet dat. Voor deze meting is daarom een omhulsel gebruikt dat de toelating toepast (ook buiten de repo) |
| Ronde 9: `build.py --lint`, `tri.py --gate`, `ui_inner.py --open --strict`, `opentest.py --strikt-min`, `pncheck.py --tree` | ok; de aantallen van de budgetpoort staan in [cijfers.md](cijfers.md); `ui_inner` 0 treffers; `opentest` 0 fouten met dezelfde 30 meldingen 'open.min ontbreekt (volger)' als ronde 8 |
| Ronde 3: `finaltests.sh` | groen behalve `visdiff` tegen een eigen Mac-basis van `9cc4331`: alleen 38-openDoors en 42-openAll rood (portieren open, bedoeld); dichte stand tegen `9cc4331` op 3x: ext-zij en ext-34voor geen pixel boven 24, ext-34achter 22 |
| Ronde 2: `tri.py --gate`, `smoke.py`, `integrity.py`, `silhouette.py`, `opentest.py --strikt-min`, `ui_inner.py` met 400 richtingen `--open --strict`, `pncheck.py --tree` | groen |
| Ronde 3: `tri.py --gate`, `pncheck.py` en `pncheck.py --tree` | ok |
| Ronde 4 (hoedenplank): `build.py --lint`, `tri.py --gate`, `opentest.py --strikt-min --only Hoedenplank,Achterklep` | ok, 0 fouten |
| Strikte set op `a90786b` (stand na ronde 8, `index.html` herbouwd) | Mac: alles groen behalve `visdiff`, 6 rood; die 6 zijn gelijk aan de rode beelden op `d4d03a6` en liggen binnen de lijst van bewust veranderde presets. VM (`lag3-vm`): alles groen behalve `visdiff`, 13 rood, ook gelijk aan `d4d03a6`; ankerpoort ok (eigen 320, vrij 265, grens 265; platformgebonden). itest 232 van 232 op beide. De kerncijfers komen uit de Mac-set ([cijfers.md](cijfers.md)) |
| Strikte set op `b775511` (stand na ronde 9, `index.html` herbouwd) | Mac: alles groen behalve `visdiff`, 6 rood (10-timing, 14-cooling, 33-tailgate, 37-openHood, 38-openDoors, 42-openAll), dezelfde als op `a90786b` en `d4d03a6` (de Mac-basislijn verschilt van de Linux-basislijn); ankerpoort ok, itest 232 van 232. VM (`lag3-vm`): alles groen behalve `visdiff` (13 rood, dezelfde als op `a90786b`); ankerpoort ok; itest was in de volledige set rood door een `Page.reload`-timeout van 30 s onder parallelle last en gaf los herhaald 232 van 232. De kerncijfers komen uit de Mac-set ([cijfers.md](cijfers.md)). Uitslag op de basislijn in de VM: basislijn in `a5a1db2` (de 42 PNG's uit de VM-presets van `b775511`, `docs/baseline/anchorcheck.json` ongewijzigd); de volledige VM-set daarop is alles groen: `visdiff` 42 van 42, itest 232 van 232, ankerpoort ok |
| Klaardefinitie voor versie 10 (`CLAUDE.md`, Klaar en bekende ruis) | Volledige set groen op macOS en Linux, visdiff groen op Linux, botsingsmeting zonder nieuwe doordringing, advisor pass. Stand bij de publicatie: macOS groen behalve `visdiff` tegen de eigen Mac-basis (een groene macOS-run zegt niets over visdiff); Linux groen: `visdiff` 42 van 42 tegen de basislijn van `a5a1db2` (zie de rij hierboven), de volledige VM-set daarop groen; botsingsmeting ok (met de toelating van `934ace3`, zie hieronder). Het advisor-oordeel is van de orkestrator en staat niet in de repo |
| `index.html` | herbouwd in fase 3.5, ronde 2, ronde 3, na ronde 8 (`a90786b`) en na ronde 9 (`b775511`). T4 op `b775511`: 1.478.919 bytes raw (grens 1,5 MB) en 367.302 bytes bij `gzip -6` (grens 370 kB, marge 2.698 bytes); de afweging staat in [onderzoek/beslissingen.md](onderzoek/beslissingen.md) |
| Visuele poort K1 tot K13 en S7, ronde 3 (stand `0317061`) | GROEN: K-panels via `poort.js` tweemaal, geen kenmerk lager dan B0, en S7 9 van 9. Dat was vóór de rondes 4 tot en met 9, dus het geldt niet voor de eindstand |
| Eindpoort op `a90786b` (K-panels tweemaal, `ui_inner` met 400 richtingen, fijne zwaai, S7 indien nodig) | ROOD op één kenmerk: plak a K2 Voorportieren, waar beide K-panels 'deels' gaven tegen 'ja' bij B0. Alle beoordelaars noemden de dorpel: weinig contrast, hij leest als een grijze vloerstrook (beelden 06, 09 en 95-telefoon-portier-linksvoor). De meetpoorten waren groen: `ui_inner` met 400 richtingen ok, fijne zwaai 548 standen op h 1,5 mm ECHT 0 met één grensgeval (Ruitdrager tegen Waterscherm bij Zijruit rechtsachter, stand 0,8: +0,125 mm, omhullende 7,923 tegen 7,929 mm; later opgelost met een toelating, zie hieronder). S7 is niet opnieuw gedraaid (exterieur ongewijzigd, ronde 3 gaf 9 van 9) |
| Poort na ronde 9 (K-panels, stand na ronde 9) | GROEN. 17 kenmerken, 0 lager dan B0 (lager betekent: beide na-panels onder het minimum van B0). Plak a K2 geeft nu ja/ja, met ja/ja/ja in beide panels. Hoger dan B0 in beide panels: plak b K6. Eén panel terug op het minimum van B0 (niet eronder): plak b K9 (panel 1) en plak c K13 (panel 2), op beelden die op het versiestempel na pixelgelijk zijn aan `a90786b`, dus dat is verschil tussen beoordelaars. Geen blokkerende meldingen. Volledig verslag: poortverslag ronde 9 (buiten de repo) |
| Publicatie van versie 10 | Gepubliceerd op 17 oktober 2026 (UTC; versie 10 bevat ook `f63b185` uit een andere sessie en `47fb5ae`). `main` fast-forward `f63b185..d3fe58f` gepusht om circa 21:10; ci op `d3fe58f` success (21:10:33 tot 21:14:15), pages build and deployment success (21:10:31 tot 21:11:08). Pages om 21:20 teruggelezen (met cache-buster): `index.html` byte voor byte gelijk, 1.478.919 bytes, md5 `2656ea8cf3668b0b2f077e5eaf29e201`, stempel `10 (bron 361c5a2)`. Artefact (artefactversie 12) om circa 21:21: de kale pagina uit `build.py --bare` (1.478.743 bytes, md5 `c7ab745246e37fb7280c909d43e710e8`) staat er precies een keer in, met 531 bytes geraamte ervoor en 15 erna (totaal 1.479.289). Versie 10 hoort bij `d3fe58f` (`index.html` is ongewijzigd sinds `b775511`); de tags `v1` tot en met `v10` zijn op 18 oktober 2026 bij naam gepusht (`handomdraai.md`, punt 2) |

Oorzaken per rood beeld bij de basislijncommit `a5a1db2`: de 13 beelden die in de VM rood waren tegen de basislijn van versie 9, uit de voor/na-beelden. Alle 13 zijn bedoeld; de basislijn is daarom vernieuwd. De beelden 08, 13 en 25 zijn apart naast elkaar bekeken (voor en na, met een verschilmeting); de andere tien zijn op het oog nagekeken in een zij-aan-zij-overzicht.

- `07-engineAll`: herkadrering van de camera (tak G), labelindeling (een label Motorafdekkap erbij, de melding "+1 meer" weg) en Nederlandse notatie in de specs.
- `08-head`: alleen de labelindeling; de labels Nokkenas inlaat, Kleppen inlaatzijde en Kleppen uitlaatzijde staan elders (de laatste twee met een leider). Camera, geometrie en tekst zijn gelijk.
- `09-crank`: herkadrering van de camera (het model staat iets verschoven), labels daardoor net anders; geen wijziging in de onderdelen.
- `12-dynStart`: labelindeling (onder meer B+-aansluiting) en herkadrering, plus Nederlandse notatie in de specs (poelie).
- `13-psPump`: alleen de labelindeling; de labels Stroomregelklep, Hogedrukaansluiting en Aanzuigstomp staan elders (Hogedrukaansluiting onder het onderdeel met een leider), zodat de oranje ring bij de Stroomregelklep niet meer achter een label ligt. Camera, geometrie en tekst zijn gelijk.
- `14-cooling`: nieuwe groep Airconditioningleidingen (een onderdelen- en een labelregel erbij), het model iets verschoven.
- `20-gearsets`: herkadrering van de camera en labelindeling; de onderdelen zijn gelijk.
- `24-frontAxle`: herkadrering van de camera en Nederlandse notatie in de spec (Ø24 mm zonder spatie).
- `25-rearAxle`: herkadrering van de camera (het onderstel staat een paar procent groter en iets verschoven, de labels volgen), labelindeling en Nederlandse notatie in de spec (Ø29,6 mm en Ø45 mm zonder spatie); de geometrie is gelijk.
- `33-tailgate`: de dikkere gasveer van de achterklep, met labels die daardoor net anders staan.
- `37-openHood`: onderdelenaantal 2.564 (was 2.555) en Nederlandse notatie in de specs (3.250 tpm, 4.695 × 1.811 × 1.445 mm, 2,0 Turbo).
- `38-openDoors`: zwarte B-stijl en nieuwe instaplijst, plus het onderdelenaantal 2.564 en dezelfde Nederlandse notatie in de specs.
- `42-openAll`: zwarte B-stijl en nieuwe instaplijst, plus het onderdelenaantal 2.564 en dezelfde Nederlandse notatie in de specs.

## Resultaten golf 5b-2 (16 oktober 2026), tak `golf-5b2` (versie 9, gebouwd; gepubliceerd op 16 oktober om 21:30 UTC)

Strikte set op de samengevoegde stand `0bdbef1` (golf A en golf B), op macOS; `index.html` en de kerncijfers in `225000f` ([cijfers.md](cijfers.md)). De functietests liepen daarnaast in de Linux-VM `lag3-vm` op `8ce45ba`.

| Test | Uitslag |
|---|---|
| `finaltests.sh` | groen, behalve `visdiff` |
| `visdiff.py` | tegen een eigen basis B0 van de Mac (presets van `426d6aa` met de nieuwe harness, via `VISDIFF_BASIS`): 11 rode beelden, alle in de vooraf opgegeven lijsten (bodyOff, engine, engineAll, psPump, battery, gearbox, gearboxAll, converter, diff, doorLF, interior). Tegen `docs/baseline` zou het platformverschil (circa 2 procent per beeld) alles overschaduwen, en die basis is bovendien verouderd |
| `itest.py` met poorten | 222 van 222 |
| `opentest.py --strikt-min` | 26 openers, 0 fouten, 31 meldingen (volgers zonder `open.min`). In de Linux-VM vond de opentest de Membraan-fout van de rembekrachtiger (`inner`), daarna opgelost |
| `integrity.py` | 0 fouten |
| `silhouette.py` | ok |
| `anchorcheck.py` | poort ok, 352 labels, eigen 319, vrij 265 (in de Linux-VM platformgebonden 351/318/263) |
| `tri.py --gate` | budgetpoort ok |
| `pubsmoke.py` | ok |
| `clash.py` | Leidingblok met de Koude laadluchtslang: -10,5 mm gemeten en opgelost; scharnieren van de vier portieren 0 doordringingen (was 22 dicht en 28 open); G8c (naafpunt op `TRACK_F`) gaf acht nieuwe doordringingen tot 2,44 mm en is teruggedraaid |
| `huid.py` | bumperschalen en achterschermen na G1 hoogstens 1,22 mm van de oude huid (grens 2 mm) |
| `ui_inner.py --open --strict` met `UI_INNER_DIRS=400` | de voorportier-botsbalk, de Raambediening linksachter en het Membraan waren bij 400 richtingen of met de kap open van buiten te zien en zijn niet meer `inner`; bestaande treffers die naar 5b-3 gaan: Veerrubber onder links en rechts, Lagerbus aan de collectorzijde |
| Visuele poort K1 tot K13 | twee onafhankelijke panels na, beide 10 ja, 3 deels, 0 nee, niets blokkerend, geen kenmerk lager dan B0 (de B0-panels verschilden op K2 en K9; regel vooraf: een kenmerk telt pas als lager als beide na-panels onder het laagste B0-oordeel uitkomen) |
| S7 (exterieur) | 7 van 9 vóór en na (kenmerk 4 en 8 deels); doel 8 niet gehaald, niet herhaald. De S7-prompt zei in B0 en na abusievelijk "fase 1"; het model is fase 2, de vergelijking blijft gelijk |

`clash.py` en `huid.py` staan bewust buiten de testlijst van `finaltests.sh`: het zijn meetscripts van de orkestrator voor een golf met nieuwe geometrie (vooraf meten, na elke stap en na elke samenvoeging), geen poort die de set rood maakt.

## Resultaten framework (16 oktober 2026)

Strikte set op `5150354` (framework: `auto.json`, `presetdata.js`, testhaak `__model`, silhouet in `data/silhouet.json`, grenzen uit `body.js`): alle tests groen behalve visdiff, met 0 van 42 beelden. Oorzaak: `presetshots.py` las de preset-id's met een regex uit `src/presets.js`, waar ze niet meer staan, en maakte zonder melding nul beelden. Nu leest het script de id's uit de pagina (`presetList()`) en faalt het als er geen presets zijn. Daarna presetshots en visdiff opnieuw: 42 van 42 binnen de drempel zonder nieuwe basislijn, dus het beeld is door het framework niet veranderd. Verder: itest 222 van 222, opentest 0 fouten, integrity 0 fouten, budgetpoort ok, pubsmoke ok in drie rondes (ook Pages op de telefoon), ankerpoort ok. Een proefauto uit `tools/framework.py nieuw` bouwt en haalt smoke, integrity (0 fouten) en de budgetpoort.

## Resultaten openstand blijft staan (16 oktober 2026)

Strikte set op `4eef6e8` (de wissel van Openen naar Uitklappen laat de openers staan; `uiOpenResync`; `hideWhen` in beide modi), alle tests groen behalve de opentest: die meldde bij de rugleuningen 866 en 309 treffers op de hoedenplank, die nu ook buiten de modus Openen uitgenomen is. De test telde dat uitgenomen deel als gat; in `5f845e3` telt een deel dat door `hideWhen` is uitgenomen als afwezig. Daarna opentest opnieuw: 26 openers, 0 fouten, 31 meldingen (volgers zonder `open.min`). itest 222 van 222, visdiff 42 van 42 zonder nieuwe basislijn, ankerpoort ok. Gemeten met een losse probe: zonder `uiOpenResync` hangt na Alles uitklappen de linker gasveer van een open achterklep 0,62 m naast zijn anker en een hoedenplankkoord 0,36 m na inklappen; met de herberekening is de afwijking 0.

## Resultaten golf 5c-1 en 5d (structureel), tak van PR #3 (versie 8)

Strikte set op de samengevoegde stand `452916e` (app-laag van golf 5c-1 erbij; de docs daarna raken de pagina niet), 16 oktober 2026, 02:55 tot 03:16 UTC, alle dertien tests groen. Versiestempel van de pagina: `7 (bron 65d7276)`. De statistieken staan in [cijfers.md](cijfers.md).

| Test | Uitslag | Duur |
|---|---|---|
| `build.py --lint` | ok (ook het inline script in head.html) | 0 s |
| `smoke.py` | geen consolefouten of -waarschuwingen, geen horizontale scroll | 73 s |
| `integrity.py` | 0 fouten, 0 ankerfouten, 0 presetfouten | 20 s |
| `silhouette.py` | ok | 19 s |
| `ui_inner.py --open --strict` | geen ingesloten knoop van buitenaf zichtbaar | 98 s |
| `opentest.py --strikt-min` | 26 openers, 0 fouten; twee meldingen voor volgers zonder `open.min` | 507 s |
| `itest.py` met poorten | 218 van 218 (controle 18: 36, controles 19 tot 22: 21) | 1.067 s |
| `tri.py --gate` | budgetpoort ok | 8 s |
| `pubsmoke.py` | OK, klaar na 9,9 s op 390 x 844, scripts met `integrity` van de CDN | 32 s |
| `stats.py` | ok | 19 s |
| `presetshots.py` | 42 beelden | 96 s |
| `visdiff.py` | 42 van 42 binnen de drempel tegen de basislijn van `452916e` | 1 s |
| `anchorcheck.py` | poort ok tegen `docs/baseline/anchorcheck.json` (352 labels, eigen 319, vrij 265) | 27 s |

## Resultaten golf 5 en 5a, tak van PR #3

Strikte set (`tools/orkestratie/finaltests.sh`) op de samengevoegde stand `2c179a5`, 16 oktober 2026, 01:21 tot 01:52 UTC; CI op GitHub groen op dezelfde commit. De statistieken staan in [cijfers.md](cijfers.md).

| Test | Uitslag | Duur |
|---|---|---|
| `build.py --lint` | ok | 0 s |
| `smoke.py` | geen consolefouten of -waarschuwingen, geen horizontale scroll op de telefoon | 68 s |
| `integrity.py` | 0 fouten, 0 ankerfouten, 0 presetfouten | 28 s |
| `silhouette.py` | ok | 17 s |
| `ui_inner.py --open --strict` | geen ingesloten knoop van buitenaf zichtbaar | 99 s |
| `opentest.py --strikt-min` | 26 openers, 0 fouten; twee meldingen voor volgers zonder `open.min` (toegestaan) | 515 s |
| `itest.py` met poorten | 161 van 161 (controle 16 telefoon staand, 17 deelbare stand) | 899 s |
| `tri.py --gate` | budgetpoort ok | 9 s |
| `pubsmoke.py` | OK, klaar na 9,5 s op 390 x 844 | 26 s |
| `stats.py` | ok | 15 s |

## Resultaten golf 4

Eindstand `g4final4` op `3ab6a8d` (de uitvoer staat in het scratchpad). Daarna veranderden alleen de screenshots en de documentatie.

| Test | Uitslag |
|---|---|
| `build.py --lint` | ok |
| `smoke.py` | geen consolemeldingen, geen horizontale scroll op de telefoon |
| `integrity.py` | 0 fouten, 0 ankerfouten, 0 presetfouten, 124 waarschuwingen (uitklapvector nul) |
| `silhouette.py` | ok |
| `itest.py` met poorten | 150 van 150 |
| `ui_inner.py --open` | 223 ingesloten knopen, 0 eerste treffers van buitenaf op de hele auto en per hoofdgroep |
| `pubsmoke.py` | OK, klaar na 11,6 s op 1280 x 800 en 10,1 s op 390 x 844 (grens 20 s) |
| `opentest.py` | 26 openers, 0 fouten: eindstand, ondergrens, 0 botsingen, 0 verborgen knopen, stralen in het niets onder 2 procent, spookbatchproef goed. Meldingen alleen voor volgers zonder `open.min`. |

Statistieken `g4final4`: 3.012 knopen, 499 groepen, 2.513 onderdelen, diepte 8, 659.496 driehoeken (Aandrijflijn 235.534, Carrosserie 187.554, Onderstel 110.204, Interieur 77.612), 223 ingesloten knopen, 43 presets. Tekenopdrachten: 439 gebundeld en 1.867 zonder; met alles open 774 (grens 3.000). Frametijd p95 bij openAll(1) 3,1 ms en bij openAll(0) 2,2 ms (mediaan van drie metingen, grens 8 ms).

Tussenstanden: `g4final2` op `7f54e61` (opentest een fout: Gordelrolautomaat voor rechts 8,8 mm in de bekleding van het open achterportier, opgelost in `0ac1052`) en `g4final3` op `4fc11cd` (alles groen, maar Carrosserie 199.394 driehoeken door een fijner gaas van de achterportieren; dat gaas is in `3ab6a8d` teruggezet).

Visuele poort golf 4: drie plakken (voorkant en voorportieren, achterkant en dak van buiten, interieur en dak van binnen), per plak drie beoordelaars die elk beeld een keer bekijken, meerderheid per kenmerk. Na poort 1 en poort 2 volgde een herstelronde; na poort 3 is gestopt.

| Poort | Stand | Ja | Deels | Nee |
|---|---|---|---|---|
| 1 | `0ac1052` | 6 | 9 | 2 (K5 doppen, K9 interieur: zwevende luidsprekers onder de hoedenplank) |
| 2 | `4fc11cd` | 10 | 7 | 0 |
| 3 | `3ab6a8d` | 10 | 7 | 0 |

Op de eindstand staan op ja: K2 achterportieren, K3 zijruiten voor en achter, K4 spiegels, K5 doppen, K7 tankklep, K8 panoramadak van buiten, K9 (geen doorsteken) bij de voorkant, K10 bediening en K12 alles open leest als Laguna III. Deels: K1 motorkap (de steunstang is op desktop nauwelijks te zien), K2 voorportieren (de B-stijl onder de gordellijn is weinig te onderscheiden), K6 achterklep (de opgetilde hoedenplank leest van achter als vlak liggend), K9 van slice b en c, K11 interieuropeners (camera bij de armsteun en de middenarmsteun), K13 dak van binnen. Tussen poort 2 en 3 gingen K5 en K8 naar ja en K1 en K2 naar deels zonder wijziging aan kap en portieren: de spreiding tussen beoordelaars is van dezelfde orde als de laatste verbeteringen. Daarom is na poort 3 gestopt; de punten staan in `handomdraai.md`.

De spookbatchproef vond bij de telescoop een echte spookbatch; die is opgelost in `a116db9`.

## Resultaten golf 5

Eindstand van de code is `33b2b50`; de testset heet `g5final3` en draaide op die stand (de uitvoer staat in het scratchpad). `index.html` van versie 7 is er in `25c3ddf` uit gebouwd en daarna veranderden alleen documenten.

| Test | Uitslag |
|---|---|
| `build.py --lint` | ok |
| `smoke.py` | geen consolemeldingen, geen horizontale scroll |
| `integrity.py` | 0 fouten, 0 ankerfouten, 0 presetfouten, 124 waarschuwingen (uitklapvector nul) |
| `silhouette.py` | ok |
| `itest.py` met `ITEST_GATES=1` | 155 van 155 (vier nieuwe controles voor de telefoon, plus een voor het blok Gekozen voor deze auto; zie de tabel met controles) |
| `ui_inner.py --open` | ok; 223 ingesloten knopen in de boom |
| `opentest.py` | 26 openers, 0 fouten, 33 meldingen (`open.min` ontbreekt bij volgers) |
| `pubsmoke.py` | ok; de telefoon is klaar in 6,5 s (grens 20 s) |

Statistieken `g5final3`: 3.023 knopen, 499 groepen, 2.524 onderdelen, diepte 8, 668.020 driehoeken (budget 700.000). Per hoofdgroep: Carrosserie 189.446 (budget 190.000, een dunne marge van 554), Aandrijflijn 235.546 (budget 240.000), Onderstel 113.228, Interieur 81.084, Koeling en luchtinlaat 18.824, Uitlaatsysteem 13.184, Brandstofsysteem 9.220 en Elektrisch systeem 7.488. Tekenopdrachten: 444 gebundeld en 1.878 zonder bundelen; met alle openers open ongeveer 784 (grens 3.000). 43 presets in 7 categorieën.

Visuele poort golf 5: dezelfde kenmerken K1 tot K13 als in golf 4 (`tools/orkestratie/poort.js`, beelden van `gateshots.py`), telkens negen beoordelaars (Opus, high) in drie plakken van drie, meerderheid per kenmerk. Elke poort telt 17 oordelen, omdat K2, K3 en K9 in meer dan een plak voorkomen. Na poort 1 en poort 2 volgde een herstelronde; na poort 3 is gestopt.

| Poort | Stand | Ja | Deels | Nee |
|---|---|---|---|---|
| 1 | `f581bca` | 11 | 6 | 0 |
| 2 | `b529ac1` | 12 | 4 | 1 (K13, dak van binnen, door een slechte vaste binnencamera) |
| 3 | `33b2b50` | 13 | 4 | 0 |

Ter vergelijking haalde golf 4 10 ja, 7 deels en 0 nee. Na poort 3 is gestopt: geen nee, niets blokkerends en de winst per ronde kleiner dan de spreiding tussen beoordelaars. Deels in poort 3: K6 (achterklep: de hoedenplank leest vlak liggend en de linker gasveer is dun), K11 (interieuropeners: de zijbekleding van de bagageruimte is trapvormig en de camera van het handschoenenkastje staat dicht op het dashboard) en K9 in de interieurplak (de vaste zijruit achter is groot, de luchtroosters hebben ruis). Voor poort 3 kreeg de vaste binnencamera van het dak een beeldhoek van 70 graden, zodat beide openingen in een beeld staan; dat geldt alleen voor het poortbeeld, de app gebruikt zijn eigen camera.

S7 (herkenbaarheid van het exterieur, negen kenmerken) is opnieuw gedraaid op `8e03e87`: 7 van 9 ja, kenmerk 4 en 8 deels. De eis is 7, dus S7 is gehaald.

Tussenstanden: `g5final1` en `g5final2` zijn de eerdere runs van de testset in dezelfde golf; de eindstand is `g5final3`.

## Het itest-randgeval

In de vorige stand (`d6d0456`) slaagden 78 van de 79 controles. Bij tik 4 van de 40 willekeurige tikken (telefoon, stand Gemonteerd) meldde `noteTarget` het Binnenframe van de motorkap, maar na de tik was Koplampsproeiers geselecteerd.

- Oorzaak, bewezen met instrumentatie: het aanwijzen en de tik waren het eens. Alle 3 x 3 buurpixels en de halve pixels gaven het Binnenframe van de motorkap, `pointerdown` en `pointerup` kregen exact 246/218, het was een directe treffer (de tolerantie is niet gebruikt) en na `pointerup` was het juiste deel geselecteerd. Daarna stuurde Chromium bij de touch-tik nog de compatibele `mousedown`, `mouseup` en `click`. Die vielen op label 13, Koplampsproeiers, dat door de nieuwe selectie net onder de vinger was geschoven. Dit is een echte app-fout; op een telefoon gebeurt hetzelfde.
- Fix in `src/app2.js`: `touchend` op het canvas krijgt `preventDefault()`, en een label reageert alleen op een `click` die op dat label begon, of op een `click` zonder aanwijzer (toetsenbord, schermlezer). Commits `149f43b` en later `36aea29`.
- De test is niet veranderd, alleen de app. Op `9c731c8` slagen alle 79 controles.

## Labelankers

Een label ankert nu op het gelabelde deel zelf, niet meer op het midden van het kader van de groep. De ankers worden over meerdere frames opgebouwd, met een terugval op het eerste zichtbare deel. Een label-klik werkt ook bij een lange muisdruk. Gemeten over alle 36 presets (zonder de rondleiding):

| Meting | Eerder | Nu |
|---|---|---|
| Ankers op het eigen deel | 175 van 345 | 261 van 345 |
| Ankers in de lucht | 52 | 0 |
| Grootste frame bij koud openen, Carrosserie | 17,4 ms | 2,8 ms |
| Grootste frame bij koud openen, Aandrijflijn | niet vastgelegd | 7,3 ms |

De overige 84 van de 345 ankers liggen ook op het eigen deel, maar liggen afhankelijk van de camera achter een ander deel. Dat is niet opgelost. De getallen zijn door een agent gemeten en door de orkestrator nagelegd. De testset heeft er geen aparte controle voor; controle 8 van `tools/itest.py` toetst alleen dat de labels elkaar en de bediening niet overlappen.

## Handmatige controle van de onderkant

De onderkant is nagelopen met stralen. Deze controles zijn handmatig gedaan met scripts die in het scratchpad stonden en niet in de repo zitten. Ze maken dus geen deel uit van de testset en zijn niet te herhalen zonder de scripts opnieuw te schrijven.

- Loodrecht door de vier wielbogen: 0 interieurtreffers (eerst 8 per kant achter).
- Van onderen in zeven richtingen: 2 randgevallen op ruim 60.000 stralen.

Aanleiding was de melding van de gebruiker dat het interieur (beige leder, de bagagevloer en de hemelbekleding) door de wielbogen en van onderen te zien was. De oorzaken en de reparatie (commit `9c731c8`) staan in [ontwerp-en-architectuur.md](ontwerp-en-architectuur.md), punt 7 van de ontwikkelgeschiedenis.

## Bekende beperkingen

- De metingen komen uit een container met software-rendering (SwiftShader). Laadtijden daar (5 tot 28 seconden, afhankelijk van de belasting van de machine) zeggen niets over een echt apparaat.
- De frametijd is alleen JavaScript-tijd. Zonder gebundeld renderen heeft de gemonteerde auto 1.878 tekenopdrachten (op `33b2b50`); gebundeld renderen staat standaard aan en brengt dat op 444. De grens van 1.500 geldt dus alleen met bundelen.
- De driehoeken per hoofdgroep en de budgetten staan in [cijfers.md](cijfers.md). Sinds golf 5b-2 heeft de Carrosserie weer marge (G1 haalde ruim 10.000 driehoeken weg); de poort `tri.py --gate` blijft de bewaker.
- Software-rendering verschilt per platform (macOS, Linux-container, Linux-VM); `visdiff` en de ankerpoort zijn platformgebonden, zie `VISDIFF_BASIS` hierboven.
- Het aandeel labelankers dat achter een ander deel ligt (84 van 345) is open; zie de twee secties hierboven. De spikkels op de motorkap in het bovenaanzicht zijn sinds golf 5f gesloten: een SwiftShader-artefact (zie de alinea over `LAG3_GPU` bovenaan dit document).
- Golf 4: de metingen aan de openmodus komen uit software-rendering. Tekenopdrachten en JavaScript-tijd zijn het meetbare deel; er is geen echte telefoon of GPU. De eindhoeken zijn geschat uit foto's, het instructieboekje en het werkplaatshandboek; aan de echte auto is niets gemeten.
- De testset van de carrosserieronde liep op `9c731c8`. Op `ff42dbd` (alleen de eindstukken van de uitlaat veranderd) zijn alleen `integrity.py`, `ui_inner.py`, `smoke.py` en de publicatierooktest opnieuw gedraaid. De visuele poort (poort 5) is op `9c731c8` gedraaid en niet opnieuw na de uitlaatreparatie.
- De getekende multiriem is 1.672 mm lang tegen 1.795 mm (7PK1795); in golf 4 was het 1.569 mm.
- De voorste langsliggers lopen sinds golf 5 boven de aandrijfassen (ribdoorboringen van 1.855 naar 34).
- De positie van de stuurpomp en de routes van de slangen zijn schematisch.
- UX-punt U19 (rest dimmen bij duiken) en de zijkolom voor telefoons in liggende stand zijn in golf 5 gebouwd; er is geen echte telefoon gebruikt om ze te beproeven.
- In SwiftShader (software-rendering) duurt een frame tijdens grote animaties enkele seconden. Een echte GPU is veel sneller. Op oudere telefoons kan "Alles uit elkaar" wel haperen. De pagina schakelt dan zelf over op een lichte weergave.
- Screenshots van grote explosies hebben in de testomgeving een lange time-out nodig.
- De gemeten frametijd is alleen JavaScript-tijd (explosie-update en labelindeling, zonder `render`). Echte GPU-tijd is in de container niet te meten; er is geen GPU en geen telefoon.
- De meeste tests roepen `finishAll()` aan voordat ze kijken, dus ze zien geen animatieframe. Alleen `profileFrames` en controle 11 doen dat wel.
- Het gedrag van de webview van een telefoon-app (lang drukken opent geen systeemmenu, sneltoetsen in een iframe, de dock boven de thuisbalk) is niet te draaien. `pubsmoke.py` dekt wat statisch toetsbaar is: de stijlregels en de `viewport-fit`.
- Zes agents op vier CPU's maken Chromium traag. Houd screenshotreeksen klein en gebruik time-outs van minstens 300 seconden.
- Het testbestand `tools/itest.py` was in golf 1 één keer rood onder belasting (een tik als lang drukken gelezen). Herhaal een rode itest één keer op een rustige machine voor je de code verdenkt.
