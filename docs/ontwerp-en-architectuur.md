# Ontwerp en architectuur

Dit document beschrijft hoe de pagina is opgebouwd, welke afspraken de delen met elkaar hebben en waarom de bediening zo werkt. De app is de generieke laag van laguna3 (`6192326`, zie [framework.md](framework.md)); de auto is eigen werk van deze repo. Getallen over de auto staan alleen in [specificaties-en-bronnen.md](specificaties-en-bronnen.md); de getallen in de code staan in [contract.md](contract.md).

## Uitgangspunten

- Eén zelfstandig HTML-bestand, publiceerbaar als artefact en op GitHub Pages. Alleen three.js (r147, UMD-build) van jsDelivr en lettertypes van Google Fonts komen van buiten.
- Alle geometrie wordt in code opgebouwd. Er zijn geen 3D-bestanden of afbeeldingen in de pagina.
- Elk onderdeel is een knoop in één boom. Uitklappen werkt per groep, zodat je zo diep kunt gaan als je wilt.
- Een klik op een onderdeel klapt de eigen groep uit. Zie "Klikregel" hieronder.
- Werkt op desktop en telefoon, in licht en donker thema.
- Elke domeineigenaar bouwt in een eigen bronbestand. De delen kennen elkaar alleen via namen (ankers), vaste getallen en een kleine set gedeelde symbolen.

## Coördinaten

Alle maten zijn in meter. x is links (+) en rechts (−), y omhoog vanaf de grond, z naar voren (+). De auto is in de lengte gecentreerd.

- Neus `ZF` = 1,961, staart `ZR` = −1,961 (lengte 3.922 mm).
- Vooras `AXF` = 1,212, achteras `AXR` = −1,328 (wielbasis 2.540 mm). Wielmiddelpunt `AY` = 0,336.
- `BOD_WMAX` (halve breedte zonder spiegels, testgrens), `BOD_MIRW` (met spiegels) en `BOD_H` (hoogte) in `src/body.js`; `integrity.py` gebruikt ze als grens.
- Het halve spoor staat in versie 1 als `CHS_TRACK` = 0,64 in `src/chassis.js`. Dat is te smal (spoor 1,28 m tegen 1,548 en 1,532 m); de herbouw herstelt het.
- Er is geen motorframe met krukas en geen `fromPT` of `ENG2CAR`. De motor staat dwars in het autoframe; het motorhuis staat op y 0,46 en z 1,38.

## Bronbestanden en bouwvolgorde

`build.py` plakt de bestanden uit `src/` in de volgorde van `ORDER` aan elkaar tot één script. Ze delen één globale naamruimte; `const` en `let` moeten voor gebruik gedeclareerd zijn. `head.html` is een sjabloon waarin `build.py` de velden `{{naam}}` uit `auto.json` invult, en vóór het script zet `build.py` het bevroren object `AUTO` met dezelfde gegevens. Het bouwen stopt bij dubbele functienamen op het hoogste niveau, dubbele materiaalnamen en bij een syntaxfout (`node --check`).

| Bestand | Laag | Inhoud in deze repo |
|---|---|---|
| `head.html` | generiek | Titel, lettertypes, CSS, opbouw van paneel, dock, menu's, hulpvenster en bovenbalk. |
| `core.js` | generiek | Renderer, scène, belichting, materialen, geometriehulpen, geometriecache, `CFG`, `TXT` en de bouwstenen `A()` en `P()`. |
| `body.js` | auto | Hoofdmaten, huidfuncties `HW`, `YB`, `YT`, `YR`, `surfX`, en de carrosserie: panelen, motorkap met laadklep, portieren, ruiten, spiegels, achterklep, lampen. |
| `bodyparts.js`, `panorama.js` | auto | Leeg in versie 1. Deze uitvoering heeft geen schuifdak. |
| `engine1.js` | auto | Aandrijflijn met `Motor 6AK` (huis, stator, rotor, resolver) en `Reductiebak`. |
| `engine2.js` | auto | `Omvormer`. |
| `engine3.js` | auto | Leeg in versie 1. |
| `drivetrain.js` | auto | `Aandrijfassen`. |
| `chassis.js` | auto | Onderstel: vooras en stuurinrichting, achteras, wielen, remsysteem. |
| `interior.js` | auto | Dashboard met instrumenten- en middenscherm, stoelen, pedalen, stuur. |
| `systems.js` | auto | Koeling (radiateur, ventilator, warmtepomp), onderplaten (in de groep Uitlaatsysteem), laadpad (in de groep Brandstofsysteem), tractiebatterij en 12V-net, en `buildCar()`. |
| `partnumbers.js` | auto | `PN_DATA`, gemaakt door `tools/orkestratie/build_pn.py`; leeg in versie 1. |
| `presetdata.js` | auto | Categorieën, 29 presets en de rondleiding. |
| `app1.js`, `presets.js`, `app2-*.js` | generiek | Boom, uitklappen, animatie, openmodus, presets, bediening, labels, invoer, renderlus en `window.__model`. |

Namen van functies, materialen en cachesleutels krijgen een voorvoegsel van hun eigenaar (tabel `_voorvoegsels` in `auto.json`), zodat bestanden elkaar niet stil overschrijven. `build.py --lint` toetst dat voor cachesleutels (regel R7).

## Knoop-API

Een knoop is `{ id, name, d, spec, obj, kids, parent, asm, ... }`. Bouw knopen met twee functies uit `core.js`; dit contract is vast.

```js
A(naam, opties, kinderen)           // groep (THREE.Group); kinderen mogen geneste arrays zijn, lege waarden vallen weg
P(naam, geometrie, materiaal, opties) // onderdeel (THREE.Mesh)
```

| Optie | Betekenis |
|---|---|
| `d` | Verplicht. Nederlandse beschrijving van één of twee zinnen: wat het is en wat het doet. Is de opbouw schematisch, dan staat dat erin. |
| `spec` | Lijst `[[label, waarde], ...]` met alleen feiten uit [specificaties-en-bronnen.md](specificaties-en-bronnen.md), in Nederlandse notatie ("296 mm"). |
| `p`, `r`, `q`, `s` | Positie, Euler-hoeken, quaternion en schaal in het frame van de ouder. Negatieve x-schaal spiegelt. |
| `ex` | Uitklapvector in het frame van de ouder, in meter bij spreiding 100 %. Zonder `ex` rekent de app er een uit. |
| `exs` | Schaalfactor op die berekende afstand (standaard 1). |
| `inner` | `true` voor wat volledig verborgen zit in de andere delen van zijn ouder zolang die dicht is. Nooit op iets dat gemonteerd van buiten te zien is. |
| `open`, `stay`, `hideWhen`, `strut` | Openmodus, zie hieronder. |

Ankernamen (zie "Ankers") moeten precies één keer in de boom voorkomen.

## Uitklaplogica

Per kind van een groep:

```
positie(kind) = basis(kind) + ex(kind) · amt(ouder) · SPREAD
```

- `basis` is de gemonteerde positie, `amt` de animatiewaarde van de ouder (0 tot 1) en `SPREAD` de spreiding (40 tot 220 %, standaard 100 %).
- De kinderen van een groep bewegen alleen als die groep zelf uitklapt. Een gesloten groep beweegt als één geheel mee met zijn ouder. Omdat de regel per niveau stapelt, gaan diepere lagen vanzelf mee.
- Uitklapvectoren liggen langs de montage-as. Niets vliegt door de scène of in de ruimte van een ander systeem.

## Klikregel

In de standaardmodus `Onderdeel`:

1. Klik op onderdeel P met eigen groep G (de directe ouder). Is G dicht, dan klapt alleen G ter plekke uit. De rest van de auto beweegt niet.
2. Is G al open, dan wordt P geselecteerd en een stukje uitgelicht.
3. `Groter geheel` (knop) en Enter klappen de eerstvolgende dichte groep erboven uit; dubbelklik duikt naar P; rechtsklik, Shift+klik of lang drukken klappen de diepste open groep in.
4. De gelaagde explosie van buiten naar binnen zit in de schuif `Explosie`, in `Demonteren` en in de presets. De modus `Laag voor laag` opent de buitenste dichte groep.

Een onderdeel onder een dichte groep is niet met klikken van buitenaf bereikbaar zonder eerst die groep te openen. De schuif, de presets, de labels en de onderdelenboom dekken dat.

Gebaren: pointer-events met een drempel van 7 pixels voor slepen; dubbelklik binnen 420 ms en 26 pixels; lang drukken na 500 ms met een ring als terugkoppeling. De pick wordt bij `pointerdown` bepaald en hergebruikt, zodat een dubbeltik nooit op een bewegend beeld valt. Gebaren beslissen op `event.timeStamp`. De waarden staan in `CFG.gebaar` in `src/core.js`.

## Presets

Een preset is alleen gegevens in `src/presetdata.js`: `id`, `cat`, `label`, `key` (sneltoets), `note`, `iso`, `open`, `deep`, `pull`, `xray`, `sys`, `spread`, `cam`, `select`, `labels`, `frame` en voor Openen `opens`. Deze repo heeft 29 presets in zeven categorieën: Overzicht, Motor, Aandrijving, Onderstel, Carrosserie, Interieur en Openen.

- `checkPresets()` controleert dat elke naam precies één keer bestaat, dat `open`, `deep`, `select` en `labels` onder de `iso`-groep liggen, dat id's en sneltoetsen uniek zijn en dat de rondleiding bestaande presets noemt. `tools/integrity.py` faalt op elke presetfout.
- Toepassen gaat in fasen: eerst dicht wat dicht moet, dan beweegt de camera terwijl open gaat wat open moet.
- Elke preset is bereikbaar met twee klikken (categorie, item). Sneltoetsen 0 tot 9 gaan naar de belangrijkste.
- Wie een groep hernoemt die een preset gebruikt, past de preset aan. De preset-id's staan in `tools/anchors.json`.

## Ankers

`tools/anchors.json` bevat:

- `root_children_order`: de wortel `Renault 5 E-Tech` heeft precies acht kinderen in vaste volgorde: Carrosserie, Interieur, Aandrijflijn, Onderstel, Koeling en luchtinlaat, Uitlaatsysteem, Brandstofsysteem, Elektrisch systeem.
- `onderstel_children`: Vooras en stuurinrichting, Achteras, Wielen, Remsysteem.
- `contains`: paren (ouder, nakomeling) die onder elkaar moeten hangen. Nu: Aandrijflijn bevat Motor 6AK, Carrosserie bevat Motorkap en Laadklep.
- `content`: per anker een minimum aantal knopen op een patroon. Leeg in versie 1.
- `openers`: de paden van de 13 openers, en `preset_ids`: de 29 preset-id's. `integrity.py` eist dat de pagina precies deze heeft.
- `triangle_budgets`: nu alleen het totaal van 700.000.

De diepteminima per hoofdgroep staan niet in dit bestand maar in `data/diepte.json`, omdat `integrity.py` elke sleutel hier als knooplijst leest. Ze zijn alleen een poort met `python3 tools/maat.py --diepte`, het doel van golf 5; CI en `finaltests.sh` toetsen ze niet (zie [contract.md](contract.md)).

`buildCar()` in `systems.js` zet de uitklapvectoren van de acht hoofdgroepen. Alle andere uitklapvectoren zijn van de eigenaar van de groep.

## Labels en camera

Labels zijn genummerde bijschriften met een leiderlijn bij de kinderen van de laatst uitgeklapte groep, de grootste eerst. Een label ankert op het gelabelde deel zelf. Elk label zoekt een vrije plek en wordt weggelaten als er geen ruimte is; past niet alles, dan staat er "+n meer". Een klik op een label werkt alleen als de aanwijzer op dat label begon.

`uiFitPoints` berekent de afstand waarop de verwachte eindstand binnen het vrije beeld valt. Paneel en dock tellen als marge via `setViewOffset`. `focusNodes` kadreert een lijst knopen; `freeView()` geeft het vrije beeld terug.

## Verbergen van ingesloten delen (`inner`)

Een knoop met `inner: true` en een dichte ouder wordt niet getekend en niet aangeklikt (`uiInnerHidden`). Zodra de ouder opent, is het deel direct zichtbaar. Röntgen toont alles. `tools/ui_inner.py` controleert vanuit minstens 200 richtingen of een `inner`-knoop de eerste treffer van buitenaf is.

## Prestaties

- Geometrie wordt gecachet via `cache(sleutel, bouwfunctie)`. De sleutel bevat alle parameters die de vorm bepalen en begint met het voorvoegsel van de eigenaar. In testmodus meldt `cache()` een botsing als consolefout.
- Gebundeld renderen: een gesloten groep wordt met één samengevoegde mesh per materiaal getekend. De losse meshes blijven op THREE-laag 1 voor aanwijzen en labels. Een groep die opent, beweegt of oplicht, schakelt in hetzelfde frame terug. De schakelaar `Gesloten groepen samenvoegen` in Weergave zet het uit.
- Adaptieve kwaliteit: bij gemiddeld meer dan 40 ms per frame schakelt de pagina één keer naar pixelratio 1 en lakglans uit, met een melding in Weergave.
- De renderlus staat stil in rust. `uiWake()` en `requestRender()` starten hem weer bij invoer, animatie, rondleiding en formaatwissel.
- `__model.timing()` geeft de opstarttijdlijn in milliseconden. Tijden uit software-rendering zeggen niets over een echt apparaat; daarvoor is de [telefoontest](telefoontest.md).
- De grenzen voor driehoeken staan in `tools/anchors.json`; versie 1 zit ver onder het totaal van 700.000.

## Openmodus

Naast Uitklappen is er Openen (sneltoets O). Een deel gaat dan open zoals bij de echte auto, terwijl de rest gemonteerd blijft. Versie 1 heeft 13 openers: Motorkap, Laadklep (onder de Motorkap), vier portieren, vier zijruiten, twee buitenspiegels en de Achterklep. Hoeken en slagen staan in [contract.md](contract.md). Er is geen modus Cockpit: `auto.json` heeft `"cockpit": null`.

Knoopopties:

| Optie | Betekenis |
|---|---|
| `open` | De opener. `type` is `hinge` of `slide`. Verder `pivot`, `axis`, `angle`, `min` (ondergrens), `label`, `dur`, `look: { dir, nodes }`, `follow` en `needs`. Bij `slide` komen `move`, `arc` en `tilt` erbij. In deze repo maken `bodHinge` en `bodSlide` in `src/body.js` de opties, met `min` op 0,82 maal de volle hoek of slag. |
| `stay` | Laat het deel staan als de opener draait: de carrosseriezijde van een scharnier. |
| `hideWhen` | Lijst van openers. De knoop is uitgenomen zolang een daarvan open staat. Niet gebruikt in versie 1. |
| `strut` | Een telescoop tussen twee knopen. Niet gebruikt in versie 1. |

Bediening: de klikregel neemt de openers op het pad van het geraakte onderdeel, van buiten naar binnen; de eerste dichte opener gaat open, zijn ze allemaal open, dan sluit de binnenste. Een klik op de ruit of spiegel van een dicht portier opent dus eerst het portier. Rechtsklik, Shift+klik en lang drukken sluiten de binnenste open opener. Het dock heeft `Alles open`, `Alles dicht`, de openerlijst en Stap terug. Presets met het veld `opens` zetten openers open.

Contract voor de eigenaars: een opener heeft een bron voor hoek of slag en een ondergrens `open.min` van minstens 0,8 maal de volle hoek of slag (`tools/opentest.py --strikt-min`). De as ligt aan de scharnierzijde. Een botsing telt niet als het contact al in de gesloten stand bestond; uitzonderingen staan in `tools/open_allow.json` (leeg in versie 1).

## Gedeelde carrosseriefuncties (`body.js`)

| Symbool | Betekenis |
|---|---|
| `ZF`, `ZR` | Neus en staart. |
| `AXF`, `AXR`, `AY` | Vooras, achteras, wielmiddelpunt. |
| `BOD_WMAX`, `BOD_MIRW`, `BOD_H` | Halve breedte zonder en met spiegels, hoogte. Grenzen voor `integrity.py`. |
| `HW(z)` | Halve breedte in bovenaanzicht. |
| `YB(z)` | Onderkant van de carrosserie. |
| `YT(z)` | Schouderlijn. |
| `YR(z)` | Daklijn op de hartlijn. |
| `surfX(z, y)` | Buitenhuid in x op hoogte y. |

Het interieur, de motor, de systemen en het onderstel leiden hun raakvlakken met de carrosserie af uit deze functies in plaats van uit vaste getallen. In versie 1 beschrijven deze functies een loft van vlakke panelen die niet op de externe maten staat. Golf 2 bouwt een nieuwe carrosserie; de namen van de functies blijven, de waarden veranderen.

## Bewuste keuzes

- Geen Renault-ruit en geen letters RENAULT. Eén uitzondering (besluit van de eigenaar): de verlichte '5' op de motorkap wordt getekend, als lamp die de laadstand toont.
- Kentekenplaten zonder kenteken. Geen chassisnummer.
- Eén bouwbestand per domein en een contract met namen, zodat agents parallel kunnen werken.
- Geen opvulling om een onderdelendoel te halen. Het doel voor golf 5 (factor 5 op het aantal onderdelen per hoofdgroep) vraagt echte onderdelen met een beschrijving.
- Lettertypes: Saira Condensed (koppen), Atkinson Hyperlegible (tekst), IBM Plex Mono (gegevens).
- Geen backdrop-blur boven het canvas en een eenvoudige schaduwvlek onder de auto, voor de framesnelheid op telefoons.
- Openen is een tweede modus naast Uitklappen. In Openen staat alles gemonteerd.
- Een opener heeft altijd een ondergrens (`open.min`). Zonder ondergrens zou een botsingstoets agents naar kleine hoeken sturen.
- Waar geen bron is, staat de opbouw als schematisch in de beschrijving.
