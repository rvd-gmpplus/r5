# Ontwerp en architectuur

Dit document beschrijft hoe de pagina is opgebouwd, welke afspraken de delen met elkaar hebben en waarom de bediening zo werkt. Waar een getal pas na de laatste samenvoeging bekend is, staat een open plaatsmarkering die de orkestrator invult.

## Uitgangspunten

- Eén zelfstandig HTML-bestand, publiceerbaar als artefact. Alleen three.js (r147, UMD-build) van jsDelivr en lettertypes van Google Fonts komen van buiten.
- Alle geometrie wordt in code opgebouwd. Er zijn geen 3D-bestanden of afbeeldingen.
- Elk onderdeel is een knoop in één boom. Uitklappen werkt per groep, zodat je zo diep kunt gaan als je wilt.
- Een klik op een onderdeel doet wat de zin in de opdracht zegt: het klapt uit. Zie "Klikregel" hieronder.
- Werkt op desktop en telefoon, in licht en donker thema.
- Elke domeineigenaar bouwt in een eigen bronbestand. De delen kennen elkaar alleen via namen (ankers), vaste getallen en een kleine set gedeelde symbolen.

## Coördinaten

Alle maten zijn in meter.

### Autoframe

- x is links (+) en rechts (−), y omhoog vanaf de grond, z naar voren (+). De neus ligt op z = +2,35 (`ZF`), de staart op z = −2,35 (`ZR`).
- Vooras op z = 1,365 (`AXF`), achteras op z = −1,391 (`AXR`), wielbasis 2756 mm, lengte 4695 mm. Wielmiddelpunt `AY` = 0,33.
- Halve spoorbreedte voor `TRACK_F` = 0,7785 en achter `TRACK_R` = 0,756. Wielboogstraal `ARCH` = 0,385.
- Breedte zonder spiegels tot |x| = 0,915, spiegels tot |x| = 1,035 (de tool `integrity.py` bewaakt dat).

### Motorframe

- Oorsprong op de krukas-as. +x loopt langs de krukas naar de vliegwiel- en versnellingsbakzijde (links in de auto), +y langs de cilinders omhoog, +z naar de inlaatzijde (naar de voorkant van de auto).
- Renault telt cilinder, hoofdlager en kruktap 1 vanaf de vliegwielzijde. Cilinder 1 staat dus op +x.
- De automaat deelt dit frame (aandrijflijnframe).

### Aandrijflijn in de auto

De aandrijflijn staat dwars en iets achterover gekanteld: `auto = PT_POS + Rx(PT_TILT) · motor`, met `PT_POS` = (−0,13, 0,40, 1,50) en `PT_TILT` = −0,18 rad. In getallen: auto-x = motor-x − 0,13; auto-y = 0,40 + 0,9838·y + 0,179·z; auto-z = 1,50 − 0,179·y + 0,9838·z. In code gebruik je de hulpfuncties uit `drivetrain.js` (`fromPT`, `toPT`, `ENG2CAR`, matrix `PTM`) en reken je niet met de hand om.

## Bronbestanden en bouwvolgorde

`build.py` plakt de bestanden uit `src/` in de volgorde van `ORDER` aan elkaar tot één script. Ze delen dus één globale naamruimte; wat eerder staat, kan wat later staat niet missen, en `const` en `let` moeten voor gebruik gedeclareerd zijn. `head.html` komt als opmaak voor het script; het is een sjabloon waarin `build.py` de velden `{{naam}}` uit `auto.json` invult, en vóór het script zet `build.py` het bevroren object `AUTO` met dezelfde gegevens (zie [framework.md](framework.md)). Het bouwen stopt bij dubbele functienamen op het hoogste niveau, dubbele materiaalnamen in `std()` en `phys()` en bij een syntaxfout (`node --check`).

| Nr | Bestand | Inhoud |
|---|---|---|
| 0 | `head.html` | Titel, lettertypes, CSS (designtokens voor licht en donker, touch-stijlregels), opbouw van paneel, dock, menu's, hulpvenster en bovenbalk. |
| 1 | `core.js` | Renderer, scène, belichting, materialen, geometriehulpen (lathe, extrusie, tandwielen, veren, buizen, schoepen, en sinds de carrosserieronde `notchRect` en `roundPlate`, zie onder), geometriecache en de bouwstenen `A()` (groep) en `P()` (onderdeel). |
| 2 | `body.js` | Parametrisch carrosserieoppervlak: halve breedte, onder-, schouder- en daklijn als vloeiende krommen langs z, doorsnede met afgeronde hoeken, tumblehome. Exporteert `HW`, `YB`, `YT`, `YR`, `surfX`, `skin`. |
| 3 | `bodyparts.js` | Panelen uit dat oppervlak gesneden: portieren, schermen, motorkap, achterklep, bumpers, ruiten, verlichting, spiegels, wissers, sierlijsten; `Carrosseriekooi` met onder meer de `Torpedoplaat`. |
| 4 | `panorama.js` | Het panoramadak: dakplaat met twee openingen (`panRoofGeo`), twee getinte glaspanelen met dwarsbalk, zonneschermen met cassette, luchtgeleider en waterafvoer. Gebruikt vanuit `bodyparts.js`; eigenaar is de carrosserie. De hemelbekleding met openingen en afwerkring en de draaiknop in de hemelconsole staan in `interior.js` (eigenaar interieur). |
| 5 | `engine1.js` | Motormaten en `ENG_PORTS`, motorblok, krukmechanisme, cilinderkop met nokkenassen en kleppen, ontsteking (sinds golf 4 zonder faseversteller, zie `docs/onderzoek/beslissingen.md`). |
| 6 | `engine2.js` | Distributie, hulpaandrijving (multiriem), inlaat en injectie, turbo met spruitstuk, smering, koelcircuit. |
| 7 | `engine3.js` | Dynamo, aircocompressor, sensoren, kabelboom, flexplaat, afdekkap. |
| 8 | `drivetrain.js` | Automaat (koppelomvormer, pomp, schakelelementen, planetaire sets, tussenas, differentieel, klepblok), startmotor, aandrijfassen, motorsteunen; `PT_POS`, `PT_TILT`, `GB_X`, `DRV_PORTS`. |
| 9 | `chassis.js` | Vooras met McPherson-veerpoten, stuurinrichting, torsieas achter, wielen, remmen, remsysteem met parkeerrem. |
| 10 | `interior.js` | Dashboard, middenconsole, stoelen, gordels, bekleding, pedalen, binnenspiegel. |
| 11 | `systems.js` | Koeling en luchtinlaat (met de Airconditioningleidingen, zie onder), uitlaat, brandstof (met de vulpijp in twee delen), elektra, en `buildCar()`, dat alles samenvoegt. |
| 12 | `partnumbers.js` | De onderdeelnummers als gegevens (`PN_DATA`): verkoopeenheden, nummers met bewijsniveau, de map van pad naar eenheid (voorvoegselgecodeerd) en onderhoudsinformatie. Gemaakt door `tools/orkestratie/build_pn.py`; niet met de hand bewerken. `build.py` zet het object als JSON in een eigen blok `#pn`; de pagina leest het lui (zie Prestaties). |
| 13 | `app1.js` | Boom doorlopen, uitklapvectoren berekenen, animatie, zichtbaarheid en materialen, camera-inpassing, vloer, stap-terug-geschiedenis, het blok openmodus (stand van de openers, volgers, telescopen, bundelen, uitnemen met `hideWhen`) en het dimmen van de rest bij duiken (U19). |
| 14 | `presetdata.js` | De presets van deze auto als gegevens: categorieën, `PRESETS` en de stappen van de rondleiding (autolaag van het framework). De categorie Openen gebruikt het veld `opens`. |
| 15 | `presets.js` | De toepassingsmotor van presets en de rondleiding (generiek). |
| 16 | `app2-panel.js` | Gedeelde basis van de bediening (`els`, mediaqueries, `uiUiChanged`), klikmodi (`UI_MODES`, `uiMode`), onderdeelnummers (`uiPnLazy`, `renderPn`), selectie en paneel, de synchronisatie na een handeling (`uiAfterAction`), onderdelenboom en zoeken, tabs en de lade. |
| 17 | `app2-controls.js` | Handelingen (uitklappen, inklappen, duiken, omhoog, isoleren), de bediening van Openen, weergave-instellingen, thema- en beeldknop, de klikmodusknoppen, explosieschuif en afspelen, presetmenu en rondleiding. |
| 18 | `app2-labels.js` | Labels: genummerde callouts met leiderlijn, labelankers en hun voorraad. |
| 19 | `app2-input.js` | Aanwijzen en tikken (`pick`, gebaren), hint en hulpvenster, toetsenbord. |
| 20 | `app2-loop.js` | Formaat en vrij beeld, thema, beeldkwaliteit, renderlus, debug-overlay, deelbare stand in de URL, de start en `window.__model` voor de tests. |

De bediening was tot golf 5c-2 (K5) één bestand `app2.js`; de vijf delen volgen elkaar op in `build.py` (`ORDER`) en vormen samen met de rest één script. Functies zijn daardoor overal bekend, een `const` of `let` pas vanaf zijn regel: gedeelde toestand die eerder gelezen wordt, staat daarom vooraan (in `app1.js` of bovenin `app2-panel.js`).

Namen van functies en constanten, materialen en cache-sleutels krijgen een voorvoegsel van hun eigenaar (`eng`, `bod`, `chs`, `ui`, `app`), zodat bestanden elkaar niet stil overschrijven.

Sinds golf 5b-3 staan de gedeelde constructies generiek in `src/core.js` en hebben de domeinen geen lokale kopie meer: `bellows`, `hexNut(as, r, h)` (zeskantmoer), `hoseClamp(as, R, opties)` (slangklem, met of zonder schroef), `hinge(draaipunt, as, hoek, extra)` en `follow(leider, ...)` (de openeropties), `clipPoly(punten, a, b, c)` (Sutherland-Hodgman op een vlak), `weldAll` en `creasedWeld` (naden en geknikte normalen), `ringPattern(sleutel, n, r, fn, ...)` (herhaald patroon op een ring) en `spring(R, draad, h, windingen, as, per)` met de parameter `per` (punten per winding, standaard 14; de cachesleutel verandert alleen bij een andere waarde). `engNut` in `engine*.js` blijft een dunne wrapper op `hexNut`. De maten van de achterveer, de torsiebalk en de koppelstang staan als `REAR_SPR`, `REAR_BEAM` en `SUB_ROD` in `body.js`; chassis, carrosserie, interieur en aandrijving lezen ze daar. Een lokale const of function met een van deze namen op het hoogste niveau botst met `core.js`.

Twee geometriehulpen in `src/core.js` zijn nieuw sinds de carrosserieronde:

- `notchRect(u0, u1, v0, v1, cut)` geeft de omtrek van een rechthoek in het vlak u-v (hoekpunten tegen de klok in) met inkepingen: elke `[kant, u, v]` in `cut` haalt aan die kant (+1 of −1) het stuk onder v en voorbij u weg. Zo krijgt een zitkussen of een vloerplaat een inkeping bij een wielkast.
- `roundPlate(poly, t, b, ri, seg)` extrudeert zo'n rechthoekige omtrek met dikte `t` (gecentreerd) uit één stuk, met rondom afgeronde randen van straal `b`. Holle hoeken van de omtrek krijgen straal `ri`. Er zijn geen naden zoals bij losse blokken en de normalen zijn glad met een knik boven 30 graden. De achterbank (zitkussen en rugleuning, in `src/interior.js`) en de kofferbakvloer (`bodBootPlate` in `src/bodyparts.js`) gebruiken het.

## Knoop-API

Een knoop is `{ id, name, d, spec, obj, kids, parent, asm, ... }`. Bouw knopen met twee functies uit `core.js`; dit contract is vast.

```js
A(naam, opties, kinderen)           // groep (THREE.Group); kinderen mogen geneste arrays zijn, lege waarden vallen weg
P(naam, geometrie, materiaal, opties) // onderdeel (THREE.Mesh)
```

| Optie | Betekenis |
|---|---|
| `d` | Verplicht. Nederlandse beschrijving van één of twee zinnen: wat het is en wat het doet. Is de opbouw schematisch of niet voor deze auto geverifieerd, dan staat dat erin. |
| `spec` | Lijst `[[label, waarde], ...]` met alleen geverifieerde feiten, in Nederlandse notatie ("82,7 mm"). |
| `p`, `r`, `q`, `s` | Positie `[x,y,z]`, Euler-hoeken `[rx,ry,rz]`, quaternion en schaal `[sx,sy,sz]` in het frame van de ouder. Negatieve x-schaal spiegelt (alle materialen zijn dubbelzijdig). |
| `ex` | Uitklapvector `[dx,dy,dz]` in het frame van de ouder, in meter bij spreiding 100 %. Zonder `ex` rekent de app er een uit: de richting van het midden van de ouder naar het midden van het kind, met een afstand die schaalt met de groottes. |
| `exs` | Schaalfactor op die berekende afstand (standaard 1). |
| `inner` | `true` voor een groep of onderdeel dat volledig verborgen zit in de andere delen van zijn ouder zolang die ouder dicht is (zuigers in het blok, kleppen in de kop, planetaire sets in het huis, remzuigers in de klauw, ruitenmechanisme in het portier). De app tekent een `inner`-knop met zijn deelboom niet zolang de ouder dicht is. Nooit zetten op iets dat van buiten te zien is in de gemonteerde stand. |

Ankernamen (zie "Ankers") moeten precies één keer in de boom voorkomen.

## Uitklaplogica

De regel, per kind van een groep:

```
positie(kind) = basis(kind) + ex(kind) · amt(ouder) · SPREAD
```

- `basis` is de gemonteerde positie in het frame van de ouder, `amt` de animatiewaarde van de ouder tussen 0 en 1 en `SPREAD` de spreiding (40 tot 220 %, standaard 100 %).
- De kinderen van een groep bewegen alleen als die groep zelf uitklapt. Een gesloten groep beweegt als één stijf geheel mee met de explosie van zijn ouder. Omdat de regel per niveau stapelt, gaan diepere lagen vanzelf mee.
- Alleen het ankeronderdeel van een groep (waar de rest op gemonteerd is, zoals het motorblok) mag een uitklapvector nul houden.
- Uitklapvectoren liggen langs de montage-as, met afstanden evenredig met de grootte van het onderdeel. Niets vliegt door de scène of in de ruimte van een ander systeem.

## Klikregel

Dit is de belangrijkste ontwerpkeuze van versie 2 en ze komt rechtstreeks uit de premortem (zie [premortem.md](premortem.md)).

In versie 1 opende een klik de buitenste nog dichte groep op het pad naar het aangeklikte onderdeel. Tik je op de motorkap, dan viel de auto in acht hoofdgroepen uiteen en de motorkap zelf bleef dicht. De opdracht zegt: "als je een onderdeel aanklikt moet dat uitklappen". Het criterium in het eerste plan ("een groep die het onderdeel bevat klapt uit") was ook voor versie 1 waar, dus alle testen hadden groen kunnen zijn terwijl de gebruiker de klacht opnieuw had gekregen. De premortem oordeelde dat een fatale fout.

De regel nu, in de standaardmodus `Onderdeel`:

1. Klik op onderdeel P met eigen groep G (de directe ouder). Is G dicht, dan klapt alleen G ter plekke uit. De rest van de auto beweegt niet, ook niet als de ouders van G dicht zijn.
2. Is G al open, dan wordt P geselecteerd en een stukje uitgelicht.
3. De weg naar buiten of naar binnen loopt via aparte gebaren: `Groter geheel` (knop) en Enter klappen de eerstvolgende dichte groep erboven uit; dubbelklik duikt naar P (alle groepen erboven open, laag voor laag, met de pick van de eerste klik); rechtsklik, Shift+klik of lang drukken klappen de diepste open groep in.
4. De gelaagde explosie van buiten naar binnen zit in de schuif `Explosie`, in `Demonteren` en in de presets. De modus `Laag voor laag` houdt het gedrag van versie 1 beschikbaar.

De keuze heeft een bijwerking die bewust is aanvaard: een onderdeel dat onder een dichte groep zit (de motor onder de kap) is niet met klikken van buitenaf bereikbaar zonder eerst die groep te openen. De schuif, de presets, de labels en de onderdelenboom dekken dat.

Tests: [testen.md](testen.md), controle 1 van `tools/itest.py` meet na een klik vanuit Gemonteerd op Motorkap, Portier linksvoor, Wiel linksvoor en Koplamp links hoeveel knopen buiten de eigen subboom meer dan 1 mm verschuiven (moet 0 zijn), en of een dubbeltik met 250 ms tussenpoos het onderdeel van de eerste tik kiest.

### Gebaren en tijdsbepaling

- Pointer-events met een drempel van 7 pixels voor slepen en 600 ms voor een klik; dubbelklik binnen 420 ms en 26 pixels; lang drukken na 500 ms, met een ring als terugkoppeling vanaf 150 ms.
- De pick (welk onderdeel is geraakt) wordt bij `pointerdown` bepaald en door de latere afhandeling hergebruikt. Zo valt een dubbeltik nooit op een bewegend beeld.
- Op een telefoon valt de tweede tik op een scherm waar al onderdelen bewegen. Daarom gebruikt de duik de pick van de eerste tik.
- Een tik op het canvas stuurt in de browser nog compatibele muisgebeurtenissen na (`mousedown`, `mouseup`, `click`). Die konden op een label vallen dat door de nieuwe selectie onder de vinger was geschoven en gaven dan een tweede actie. Daarom krijgt `touchend` op het canvas `preventDefault()`, en reageert een label alleen op een `click` die op dat label begon (de aanwijzer ging op dat label omlaag), of op een `click` zonder aanwijzer (toetsenbord, schermlezer). Dit is de oplossing van het itest-randgeval; zie [testen.md](testen.md), "Het itest-randgeval".
- Gebaren beslissen op `event.timeStamp` en niet op het moment waarop een handler draait (`src/app2-input.js`, `uiCommitPress` en de afhandeling van `pointerup`). Aanleiding was de ene itest-fout uit golf 1: een telefoontik die onder belasting als lang drukken werd gelezen. De timer die de ring toont en het lang drukken wapent, laat eerst wachtende invoer afhandelen (een animatieframe en een nul-timeout); komt er in die tijd een `pointerup` of `pointercancel` binnen, dan beslist die op zijn eigen tijdstempel. Resultaat: itest 78 van 78 na de samenvoeging van golf 2 en 79 van 79 op `6eca637`, zonder terugkerende telefoontikfout.

## Presets

Een preset is alleen gegevens in `src/presetdata.js`: `id`, `cat` (categorie), `label`, `key` (sneltoets), `note`, `iso` (alleen deze groepen tonen), `open` (precies deze groepen uitklappen), `deep` (met hun hele deelboom), `pull` (hele groep verschuiven), `xray`, `sys`, `spread`, `cam` (richting en marge), `select`, `labels` en `frame`. Zeven categorieën: Overzicht, Motor, Aandrijving, Onderstel, Carrosserie, Interieur en Openen (sinds golf 4). Het aantal presets per categorie staat in [cijfers.md](cijfers.md). Na golf 1 waren het er 31; de herstelronde van golf 2 voegde Stuurpomp, Koeling en luchtinlaat, Uitlaatsysteem, Accu, Stuurinrichting en Parkeerrem toe, golf 4 de zes presets Openen.

- Een preset verwijst naar groepen met hun naam. `checkPresets()` (bereikbaar als `__model.checkPresets`) controleert dat elke naam precies één keer bestaat, dat `open`, `deep`, `select` en `labels` onder de `iso`-groep liggen (bevatting), dat id's en sneltoetsen uniek zijn en dat de rondleiding bestaande presets noemt. Een preset waarvan een naam niet oplost, verschijnt niet in de menu's. `tools/integrity.py` faalt op elke presetfout.
- Toepassen gaat in fasen: eerst klapt dicht wat dicht moet (diepste eerst), dan beweegt de camera naar de eindkadrering terwijl open gaat wat open moet (ondiepste eerst). Alles samen duurt hoogstens 2,5 seconden. Groepen die in de eindstand verborgen zijn, springen direct dicht.
- Elke preset is bereikbaar met twee klikken (categorie, item). Sneltoetsen 0 tot 9 gaan naar de tien belangrijkste.
- De rondleiding speelt een vaste lijst presets af met een bijschrift per stap.
- Wie een groep hernoemt die een preset gebruikt, moet de preset aanpassen. De namen die presets nu gebruiken, staan in `tools/anchors.json` en in het contract.

## Ankers

`tools/anchors.json` bevat de namen die precies één keer in de boom moeten voorkomen, per domein (carrosserie, interieur, motor, aandrijflijn, onderstel, systemen), plus:

- `root_children_order`: de wortel `Renault Laguna III` heeft precies acht kinderen in vaste volgorde: Carrosserie, Interieur, Aandrijflijn, Onderstel, Koeling en luchtinlaat, Uitlaatsysteem, Brandstofsysteem, Elektrisch systeem.
- `onderstel_children`: Vooras en stuurinrichting, Achteras, Wielen, Remsysteem.
- `contains`: paren (ouder, nakomeling) die in de boom onder elkaar moeten hangen.
- `content`: per anker een minimum aantal knopen dat op een patroon past (bijvoorbeeld dat `Krukmechanisme` vier zuigergroepen bevat). Dit vangt een anker met de juiste naam op de verkeerde plek of met de verkeerde inhoud.
- `openers`: de paden van de 26 leiders in de modus Openen, en `preset_ids`: de 43 preset-id's. `integrity.py` eist dat de pagina precies deze heeft, niet meer en niet minder.
- `triangle_budgets`: de budgetten aan driehoeken per hoofdgroep en in totaal; `tools/tri.py --gate` bewaakt ze. Alleen-lezen voor domeineigenaars.

`buildCar()` in `systems.js` zet de uitklapvectoren van de acht hoofdgroepen en van de vier kinderen van Onderstel. Alle andere uitklapvectoren zijn van de eigenaar van de groep.

## Labels

Labels zijn genummerde bijschriften met een leiderlijn. Ze verschijnen bij de kinderen van de laatst uitgeklapte groep, de grootste eerst. Een label ankert op het gelabelde deel zelf en niet op het midden van het kader van de groep, want dat midden lag bij 52 van de 345 ankers in de lucht en bij 175 op het eigen deel. De ankers worden over meerdere frames opgebouwd, zodat het openen van een zware groep geen groot frame kost, met een terugval op het eerste zichtbare deel. Nu liggen over alle 36 presets 261 van de 345 ankers op het eigen deel en 0 in de lucht; de overige 84 liggen ook op het eigen deel maar afhankelijk van de camera achter een ander deel. Een klik op een label werkt alleen als de aanwijzer op dat label begon, ook bij een lange muisdruk, zodat een label na een tik op het canvas geen tweede actie geeft. Elk label zoekt een vrije plek (eerst op het onderdeel, dan erboven of eronder, in kandidaten) en wordt weggelaten als er geen ruimte is. Zo vallen ze niet over elkaar, niet over de bediening en niet buiten het vrije beeld. De indeling alloceert niets per frame en schrijft alleen naar de DOM als er iets verandert. Een test controleert dit in zes standen (`tools/itest.py`, controle 8).

## Camera

`uiFitPoints` berekent de afstand waarop alle hoekpunten van de verwachte eindstand (na de animatie, `uiCollect`) binnen het vrije beeld vallen. Het paneel en de dock worden als marge meegenomen via `setViewOffset`, zodat het model in het zichtbare deel gecentreerd staat. `focusNodes` kadreert een lijst knopen; `freeView()` geeft het vrije beeld terug.

## Verbergen van ingesloten delen (`inner`)

Een knoop met `inner: true` en een dichte ouder wordt niet getekend en niet aangeklikt (`uiInnerHidden`): `ouder.target === 0`, `ouder.amt < 1e-4` en de ouder ligt binnen de isolatie. Zodra de ouder gaat openen, is het deel direct zichtbaar. Röntgen toont alles. Isoleer je het ingesloten deel zelf, dan verbergt niets het. De doorsteekcontrole van `integrity.py` draait met alle onderdelen zichtbaar.

Dit is de belangrijkste maatregel tegen een te hoog aantal tekenopdrachten in de gemonteerde stand. De risico's zijn een ten onrechte verborgen onderdeel (een gat in de auto) en een vlag op iets dat van buiten te zien is. `tools/ui_inner.py` controleert vanuit 200 richtingen, op de hele auto en op elke hoofdgroep geïsoleerd, of een `inner`-knop de eerste treffer van buitenaf is. Na de carrosserieronde waren er 253 ingesloten knopen en 0 eerste treffers op een ingesloten onderdeel (39.200 stralen op de hele auto, 20.000 per hoofdgroep). In golf 4 zijn veel vlaggen weggehaald omdat een opening het deel zichtbaar maakte; op de eindstand van golf 5 zijn er 223 ingesloten knopen en geeft `ui_inner.py --open` geen overtreders. Direct na de samenvoeging van golf 2 waren het er nog 52; de eigenaren hebben ze hersteld of de vlag weggehaald. In de carrosserieronde is de opbergbak in de middenconsole niet meer als ingesloten gemarkeerd, omdat hij door de zijruit te zien is.

## Prestaties

- Geometrie wordt gecachet via `cache(sleutel, bouwfunctie)`. De sleutel moet alle parameters bevatten die de vorm bepalen. In `core.js` doen `G.box`, `G.rbox`, `G.cyl`, `G.half`, `G.torus`, `G.sphere`, `hexBolt`, `spring`, `gear`, `ringGear` en `annulus` dat. De sleutel van `torus` bevatte eerst de buisstraal niet, `ringGear` de voetstraal niet en `annulus` het aantal segmenten niet; dat is hersteld (audit C24).
- In testmodus (`window.__MODEL_CACHECHECK`, door `tools/harness.py` gezet) bouwt `cache()` bij hergebruik de geometrie opnieuw en meldt een botsing als consolefout: dezelfde sleutel voor andere vorm. Een gemuteerde proef (een geplante botsing) wordt gevangen.
- Sleutels voor eigen geometrie beginnen met het voorvoegsel van de eigenaar. Sinds golf 5b-3 controleert `build.py --lint` dat (regel R7): een cachesleutel in een bestand met een regel in de tabel `_voorvoegsels` van `auto.json` moet met een van die voorvoegsels beginnen; `core.js` heeft geen regel en wordt niet getoetst. De botsingscontrole in testmodus vangt de gevolgen van een dubbele sleutel nog steeds.
- Tekstregels in de lint (`lint_texts` in `build.py`): de stringwaarden van `d`, `spec`, `note` en `label` in de bronbestanden (commentaar en `${...}` in sjablonen worden overgeslagen; `partnumbers.js` valt erbuiten omdat bronnamen en citaten van derden letterlijk blijven). R1: in `spec` geen schatwoorden. R2: geen decimale punt bij een eenheid (114,3 mm). R4: een getal vanaf 1.000 vóór een eenheid heeft een punt als duizendtal (3.250 tpm); jaartallen en productcodes vallen er niet onder. R5: Ø staat zonder spatie vóór de maat. R7: de cachesleutel. Alle vijf zijn sinds golf 5b-3 fouten; R4, R5 en R7 waren tot de laatste fase van die golf meldingen, zodat de eigenaren hun teksten eerst konden omzetten. Het resultaat is de Nederlandse notatie: komma als decimaal, punt als duizendtal, "2,0 Turbo", "Nm".
- Tekenopdrachten: de gemonteerde auto moet onder 1.500 blijven (grens uit de premortem, tripwire 5). De actuele aantallen staan in [cijfers.md](cijfers.md); de getallen hieronder zijn de historische metingen. Na golf 1 waren het er 1.052 met 1.459 onderdelen. Op de eindstand van golf 5 (2.524 onderdelen) zijn het er 1.878 zonder en 444 met gebundeld renderen. De grens van 1.500 houdt dus alleen met bundelen stand. Volledig uitgeklapt: grens 3.000 tekenopdrachten en 700.000 driehoeken; `smoke.py` mat bij een volledig uitgeklapte auto 1.552 tekenopdrachten in één weergave (431.859 driehoeken in beeld), en de hele boom telt 668.020 driehoeken.
- Gebundeld renderen van gesloten groepen: een groep waarvan het hele deel is gemonteerd, wordt met één samengevoegde mesh per materiaal getekend in plaats van met elk onderdeel apart. De losse meshes blijven in de scène voor aanwijzen, labels en de lijst. Een groep die gaat openen, bewegen of oplichten schakelt in hetzelfde frame terug. Het staat standaard aan; de schakelaar `Gesloten groepen samenvoegen` in Weergave zet het uit. Tekenopdrachten in Gemonteerd: 1.878 zonder, 444 met bundelen.
  - Werking (`src/app1.js`): voor elke weergave kiest `uiBatchSync` per tak de hoogste geschikte groep met een klare batch (minstens twee onderdelen en hoogstens 60.000 driehoeken; grotere groepen worden over hun kinderen verdeeld) en wisselt waar nodig in hetzelfde frame. Onderdelen onder een ingesloten knoop doen niet mee. Een batch krijgt per basismateriaal een samengevoegde mesh; de materialen volgen Röntgen en de systeemkleuren, en de diepte-sortering van doorzichtige vlakken blijft gelijk.
  - Opbouw: lui, in de vrije tijd van het frame (3 ms tijdens een animatie, 10 ms in rust, 25 ms in de eerste 8 seconden). Tests die gebundelde aantallen meten roepen eerst `__model.batchFlush()` aan.
  - Geheugen: de batches mogen samen 1,25 maal de geometriebytes van alle meshes gebruiken (48,2 MB op de eindstand van golf 5, 26,9 MB in gebruik). Past een nieuwe batch niet, dan worden de langst ongebruikte batches vrijgegeven die nu niet getekend worden; past hij dan nog niet, dan blijft die groep los getekend.
  - Aanwijzen: de losse meshes van een gebundelde groep staan op THREE-laag 1 (`UI_HIDE_LAYER`). De camera tekent die laag niet; de raycaster van de app doet `layers.enableAll()` en raakt ze dus wel. Elke eigen `THREE.Raycaster` in een testscript moet dat ook doen; `integrity.py`, `silhouette.py` en `ui_inner.py` doen het.
  - Stand op de eindstand van golf 5 (`__model.batchStats()`, na `batchFlush()`): 46 groepen gebouwd en getekend, 368 batchmeshes, 1.802 losse meshes vervangen.
- Adaptieve kwaliteit: bij gemiddeld meer dan 40 ms per frame over 20 frames tijdens een animatie schakelt de pagina één keer naar pixelratio 1 en lakglans uit, met een melding in Weergave en de schuif `Volle kwaliteit`. Tijdens grote animaties zakt de pixelratio tijdelijk naar driekwart.
- Er wordt alleen gerenderd als er iets beweegt of verandert. Geen backdrop-blur: vervagen van het WebGL-canvas kostte volgens een meting 60 beelden per seconde naar 1,5.
- Materialen worden vooraf gecompileerd, in kleine stukjes na de eerste weergave, zodat de eerste keer aanwijzen of selecteren niet hapert.
- Frametijd: `__model.profileFrames('Motor F4Rt', 120)` meet de JavaScript-tijd per animatieframe zonder `finishAll()` (explosie-update en labelindeling, zonder `render`). Grens: p95 hoogstens 8 ms. Dit is JavaScript-tijd, geen GPU-tijd.
- Aantallen driehoeken (historisch; actueel in [cijfers.md](cijfers.md), budgetten in `tools/anchors.json`): eerste versie 424.000, versie 1 na optimalisatie circa 280.000. Na golf 1: 419.554. Na de carrosserieronde (gemeten op `9c731c8`): 630.368. Eindstand van golf 5 (`g5final3` op `33b2b50`): 668.020 (Aandrijflijn 235.546, Carrosserie 189.446, Onderstel 113.228, Interieur 81.084, Koeling en luchtinlaat 18.824, Uitlaatsysteem 13.184, Brandstofsysteem 9.220, Elektrisch systeem 7.488). Het totaal blijft binnen het budget van 700.000. De Aandrijflijn zat na golf 2 boven het eigen budget van 240.000 (250.794) en is in de carrosserieronde met lichtere klepgroepen, zuigerringen, kleine veren, poelies en stator teruggebracht tot 237.310; de grote veren en de keerring van de klepsteel zijn na review weer rond gemaakt. De Carrosserie zit op 189.446 van haar budget van 190.000: een dunne marge van 554 driehoeken, dus een volgende wijziging aan de carrosserie moet eerst elders besparen.
- Opstarttijden: `__model.timing()` geeft de tijdlijn van het opstarten in milliseconden sinds het begin van de navigatie (`script`, `buildStart`, `buildCar`, `startUp`, `render0`, `firstFrame`, `interactive`, `ready`, `batches`, plus `batchesDone`). De duur van `buildCar()` is `buildCar` min `buildStart`. Op de eindstand (`9c731c8`, software-rendering, één meting uit `stats.json`): script 482, buildStart 688, buildCar 854 (dus 166 ms), startUp 1.608, render0 1.840, firstFrame 3.508, interactive 3.514, ready 5.574, batches 6.828. `ready` wacht hoogstens 2 seconden op de batches van de beginstand. Deze tijden zeggen niets over een echt apparaat.
- Lui lezen en rust (golf 5c-2, P1 tot en met P4; metingen in [masterplan.md](masterplan.md), "Stand na golf 5c-2"): de nummergegevens staan als JSON-blok `#pn` en `PN_DATA` is een object dat bij het eerste gebruik leest (`uiPnLazy`, de index `uiPnBuild` pas bij het eerste paneel of de eerste zoekopdracht op nummer; `note` alleen met `pnToelichting`). De tekenbuffer krijgt zijn maat vóór de WebGL-context (een inline script direct na het canvas in `src/head.html`). Eén synchronisatie per handeling (`uiAfterAction`) en geen DOM-schrijven per frame. De renderlus (`src/app2-loop.js`) stopt in rust; `uiWake()` en `requestRender()` (`src/app1.js`) starten hem weer bij invoer, animatie, rondleiding en formaatwissel. Wie camera of scène buiten die wegen wijzigt, roept `requestRender()` aan.

## Robuustheid, thema en toegankelijkheid (golf 5c-1)

- Foutafhandeling: een inline script in `src/head.html`, vóór de scripttags, vangt `error` en `unhandledrejection`. Zolang `#loading` zichtbaar is vervangt het de voortgangsmelding door "De pagina kon niet worden geladen (…). Laad de pagina opnieuw. Versie X." (een eigen melding van `core.js` of `app1.js` blijft staan en krijgt de versie erbij); na `ready` alleen `console.error`. De laatste fout staat op `window.__modelLastError` en `__model.lastError`. Hetzelfde script zet het onthouden thema op `<html>` vóór het tekenen. `build.py --lint` controleert het inline script apart met `node --check`.
- Contextverlies: `webglcontextlost` (met `preventDefault`, zodat herstel kan) toont `#notice`; bij `webglcontextrestored` maakt `uiRemakeEnvironment` (`src/core.js`, naast `uiMakeEnvironment`) een nieuwe PMREM-omgevingskaart; geometrie en texturen laadt three.js zelf opnieuw.
- `uiLastFit` is het contract voor herkadreren bij een formaatwissel: het staat in `src/app1.js` bij `focusNodes`, dat het zelf zet; `appApplyPreset` zet daarna `{ preset }`. Niemand wijst het nog los toe. `uiRefitNow` kadreert direct (`delay: 0`).
- Rondleiding (`src/presets.js`): een toestand `{ i, due, left, paused, auto }` met `uiTourStep(dir)`, `uiTourArm` en `uiTourPause` (de resttijd blijft staan); knoppen vorige, pauze of hervat, volgende en stop in `#tourBar`; `visibilitychange` pauzeert en hervat vanzelf, een eigen pauze blijft staan. Staptijd `CFG.tijd.tourStapMs`.
- CDN: `build.py` zet `integrity` (sha384) en `crossorigin="anonymous"` op de drie scripttags, berekend uit het lokale npm-pakket (`THREE_DIR` of `~/.cache/explosietekening/three-0.147.0/package`); zonder pakket stopt de bouw. `tools/pubsmoke.py` bewijst dat de CDN dezelfde bytes levert.
- Labels: past niet alles (`CFG.indeling.labels` 24, `CFG.indeling.labelsSmal` 10), dan staat er een `.lmore` ("+n meer", geen `.lbl`, telt niet in `labelRects()`) in een hoek van het vrije beeld; een klik opent de lijst van de groep.
- Isoleren: `uiFadeFrom`, `uiStepFade` en `uiFadeEnd` in `src/app1.js` laten de rest in `CFG.tijd.isoFadeMs` (0,3 s) vervagen met één gedeeld spookmateriaal `uiFade`; zichtbaarheid en aanwijzen staan meteen op de nieuwe stand, alleen `obj.visible` van de vervagende meshes blijft kort aan; `finishAll()` beëindigt de fade. De badge `#isoBadge` (naam plus Alles tonen) staat bovenin het dock en telt mee in `layoutView` en `uiMeasureUi`.
- Thema: `#themeSeg` (radiogroup) in Weergave, `uiSetTheme`, sleutel `UI_THEME_KEY` (`laguna3-theme`) in `localStorage` (try/catch); systeem is geen `data-theme`-attribuut.
- Toegankelijkheid: het hulpvenster zet `inert` op zijn broers en houdt een Tab-focusval; `#menu` heeft geen rol meer, binnenin staat een `div[role=menu]` met alleen menuitems; de werkbalk van de presets heeft één tabstop met pijlen, Home en End; `#stage:focus-visible` heeft een rand (focus zonder rand blijft onzichtbaar); `--switch-off` geeft een uitgeschakelde schakelaar 4,4:1 (licht) en 3,7:1 (donker); de tabs hebben roving `tabindex`; `#selName` en `#selMeta` worden alleen bij verandering geschreven; Esc sluit het mobiele paneel. Nooit `aria-hidden` op het canvas.
- Hulpvenster: `uiFillHelp` vult de categorieën en sneltoetsen uit `appCats` en `PRESETS`; `uiOpenRootDesc` vervangt de regex die een zin uit de wortelbeschrijving knipte.
- Zoeken: `uiNorm` (`src/app1.js`, ook voor `n.norm`) normaliseert op kleine letters zonder accenten; `uiSynonyms` en `uiSearchTerms` (`src/app2-panel.js`) zoeken synoniemen mee en de zoekinfo noemt ze.
- Aanraken: een toast (`CFG.tijd.toastMs`) met de volledige naam bij een afgekapt label, één suggestie "Probeer: tik op de motorkap" na de hint tot de eerste handeling (`uiHintStage`), `navigator.vibrate(CFG.gebaar.trilMs)` bij het vollopen van de ring.
- Exporteren: `uiSaveImage` rendert op verzoek, tekent het WebGL-canvas op een 2D-canvas met naam, onderdeelnummer en versie en downloadt `laguna3-<slug>.png`; de knop Kaart afdrukken gebruikt een `@media print` die alleen de onderdeelkaart overlaat.
- Constanten van de app-laag staan sinds golf 5c-2 (K1) in `CFG` bovenin `src/core.js`: gebaren, tijden, rekenbudgetten per frame en de indeling met de breekpunten (920, 520 en 600 px; de mediaqueries in `src/head.html` houden het getal met een verwijzing naar `CFG`, en de JS leest het breekpunt via één `matchMedia` in `uiNarrow`). `UI_THEME_KEY` en `UI_LINK_REL` staan bovenin `src/app2-panel.js`.
- Teksten (K6): elke tekst die de code zelf op de pagina zet, staat in `TXT` in `src/core.js` (sjablonen als functies; `TXT.num` voor getallen met een decimale komma). Wat per auto verschilt staat in `auto.json`, de vaste teksten van de HTML in `src/head.html`.
- Klikmodi (K4): `UI_MODES` in `src/app2-panel.js` heeft één strategie per modus (`part`, `layers`, `collapse`, `select`, `open`) met `act`, `target`, `tip`, `collapse`, `enter`, `reveal` en de vlaggen voor het paneel; `uiMode()` kiest de geldende (Openen gaat voor de klikmodus).

## Openmodus

Sinds golf 4 heeft de pagina een tweede modus naast Uitklappen: Openen. Een deel gaat dan open zoals bij de echte auto, terwijl de rest gemonteerd blijft. Er zijn 26 openers. De hoeken en slagen zijn geschat uit foto's, het instructieboekje en het werkplaatshandboek; er is geen tekening van de fabrikant gebruikt. Golf 5 gaf de meeste openers een nieuwe camera, voegde de engine-optie `hideWhen` toe en bracht de bediening van Openen op de telefoon op orde (zie hieronder).

### Engine (`src/core.js` en `src/app1.js`, blok openmodus)

Knoopopties in `A()` en `P()`:

| Optie | Betekenis |
|---|---|
| `open` | De opener. `type` is `hinge` of `slide`. Verder `pivot`, `axis`, `angle`, `min` (ondergrens), `label`, `dur`, `look: { dir, nodes }` (waar de camera heen kijkt), `follow` (volger van een leider) en `needs` (eerst die opener openen; sluiten sluit eerst de afhankelijke). Bij `slide` komen `move` (de slag), `arc` (draaien om een verre as, voor de dakkromming) en `tilt` (eerst kantelen over het eerste deel van de beweging) erbij. |
| `stay` | `true` laat het deel staan als de opener draait: de carrosseriezijde van een scharnier. Een volger met `stay` beweegt in het frame van de rustende opener, zoals de motorkapsteun. |
| `hideWhen` | Lijst van openers (naam of pad). De knoop is uitgenomen (onzichtbaar, niet aanklikbaar) zolang een van die openers open staat, zoals een eigenaar de hoedenplank uitneemt voordat hij een rugleuning neerklapt. De app zet de knopen in `hideN`; een verwijzing die niet oplost is een consolefout. |
| `strut` | Een telescoop: `{ a: { node, p }, b: { node, p }, rod, lead, restLen }`. De gasveren van de achterklep zijn 290 mm in en 495 mm uit. |
| `hideWhen` | Lijst met openers (een pad vanaf de wortel of een unieke naam). Zolang een van die openers open staat (doelstand groter dan 0) is de knoop uitgenomen: hij wordt niet getekend en niet aangeklikt, zoals een eigenaar de hoedenplank uit de auto haalt. Het werkt alleen in de modus Openen; in Uitklappen en bij gesloten openers staat de knoop er gewoon. Een verwijzing die niet oplost, of die naar een volger wijst, is een consolefout. De genoemde openers krijgen de vlag `vis`, zodat hun zichtbaarheid bij elke wijziging wordt bijgewerkt. Het uitnemen springt; er is geen animatie. De hoedenplank met de scharnierpennen, de koordjes en de luidsprekers gebruikt het voor Rugleuning groot deel, Rugleuning klein deel en Bagageruimtevloer (`intUit` in `src/interior.js`). Sinds golf 5 in `src/core.js` (`mkNode`) en `src/app1.js` (`applyVisibility`). |

De knoopoptie `uitsteek` (meter, standaard 0) geeft een deel en zijn kinderen ruimte buiten de lengte ZF..ZR in `integrity.py`, voor wat aan de echte auto uitsteekt (een trekhaak); de breedtegrenzen gelden gewoon.

In de knoop staan `opn` (de opties), `ou` (stand 0 tot 1), `ot` (doelstand), `stay`, `strut` en `hideN` (de opgeloste `hideWhen`-lijst). Verwijzingen in `follow`, `needs`, `look.nodes` en `strut.a.node` zijn een pad vanaf de wortel (de wortelnaam mag weg) of een naam die maar een keer voorkomt. Een niet-unieke naam geeft een consolefout.

De stand volgt uit: positie = pivot + R(u maal angle)(basis min pivot) + uitklapverschuiving + eigen verschuiving, en draaiing = R maal de basisdraaiing. Uitklappen en openen werken samen: in Openen staat alles gemonteerd. Vaste delen in een draaiende opener worden elk frame teruggezet met de inverse van de openerdraaiing. Telescopen worden elk frame van a naar b gericht, met alleen de betrokken wereldmatrices; de zuigerstang schuift mee met (afstand min rustafstand).

### Bundelen

Batches worden altijd in de gebouwde stand gemaakt: `uiBaseRel` gebruikt basis, `q0` en `s0`. Een groep met een open opener, een volger, een vast deel of een telescoop eronder wordt niet gebundeld, en de groep van een telescoop niet zolang hij uitschuift. Dat sluit de spookbatch uit: een batch die de gedraaide stand inbakt en na het sluiten als dubbele kap of portier in de gemonteerde auto blijft staan. De toetsen roepen eerst `batchFlush()` of `finishAll()` aan en zouden dat niet zien; `tools/opentest.py` heeft daarom een eigen proef (controle 6).

### Ingesloten delen

Een `inner`-knop wordt zichtbaar als een opener erboven open is. De zichtbaarheid wordt alleen bijgewerkt voor openers met ingesloten delen eronder (vlag `vis`), zodat openen niet de hele boom doorloopt. Na golf 4 zijn veel `inner`-vlaggen weggehaald die door een opening zichtbaar werden (onder meer bij de koppelomvormer, het membraan en het reservoirfilter).

### Bediening (`src/app2-*.js`, `src/head.html`, `src/presets.js`)

- Segmentknop `Uitklappen | Openen` in de bovenbalk, sneltoets O. Ingang: alles gemonteerd, isolatie weg, de openers blijven staan. Uitgang: de openers blijven staan, zodat een open motorkap of achterklep in Uitklappen mee kan doen (uitklappen rekent daarna volgers, vaste delen en telescopen van open openers opnieuw uit, `uiOpenResync` in `app1.js`). Een preset of Alles dicht sluit ze.
- Klikregel: neem de openers op het pad van het geraakte onderdeel, van buiten naar binnen; volgers tellen als hun leider. De eerste dichte opener gaat open. Zijn ze allemaal open, dan sluit de binnenste. Een klik op de ruit of spiegel van een dicht portier opent dus eerst het portier.
- Dubbelklik is gelijk aan een enkele klik. Rechtsklik, Shift+klik en lang drukken sluiten de binnenste open opener op het pad. Groter geheel, de klikmodi en de explosieschuif zijn verborgen.
- Bij openen beweegt de camera naar `look` (richting, kader in de eindstand, pad 1,1); bij sluiten niet.
- Dock: `Alles open`, `Alles dicht`, `Openers n/26` (een lijst met een knop per opener, `aria-pressed`) en Stap terug. Snapshot en stap terug bewaren de openstand (`o`) en de modus (`om`).
- Paneel: badge Open of Dicht bij een opener, Gemonteerd bij een groep. Staat de selectie zelf voor een opener, dan werkt de knop Openen of Sluiten op die opener; anders volgt hij de klikregel. Enter doet hetzelfde, Shift+Enter sluit de binnenste open opener.
- Presetcategorie Openen (6): Motorruimte, Instappen, Bagageruimte, Tanken, Panoramadak en Alles open. Een preset zet met het veld `opens` (namen of paden, of `'all'`) openers open. Presets in andere categorieën zetten de modus terug op Uitklappen.

#### De bediening op de telefoon (golf 5)

- Telefoon staand (breder dan 920 px telt als bureaublad): de zeven presetcategorieën staan in één rij die zijwaarts schuift in plaats van drie rijen van drie. De rij loopt tot de rand van het scherm en een vervagende rand wijst op meer. De kaart in Openen zet zijn knop naast de naam. Op 390 x 844 daalt de dock van 194 naar 106 px en stijgt het vrije beeld bij een gekozen opener van 368 naar 501 px. Dit geldt voor schermen van minstens 601 px hoog (media query in `src/head.html`).
- De openerlijst is op een smal scherm (onder 920 px breed) een keuzemenu: na een keuze gaat hij dicht (`uiCloseOpenList` in `src/app2-controls.js`), zodat hij het beeld niet afdekt en het vrije beeld de volle hoogte heeft voordat de camera de opener kadreert. Op het bureaublad staat hij naast het beeld en blijft open. Een lijst die opengaat of dichtgaat laat de auto opnieuw passen in wat overblijft (`uiRefitSoon`).
- Het kader van de opener volgt de echte hoogte van kaart en dock. `uiOpenTo` selecteert eerst het onderdeel (de kaart wordt dan hoger), meet daarna de lade opnieuw (`syncSheetHeight`, `layoutView`) en kadreert dan pas, zodat het kader boven kaart en dock past. Controle 16 van `tools/itest.py` toetst dit voor zes openers.
- Telefoon liggend (hoogte tot 520 px): een zijkolom. Het paneel staat als kolom rechts over de volle hoogte (breedte tussen 250 en 330 px, op een scherm tot 640 px breed tussen 210 en 330 px), zoals op het bureaublad; de lade, de peek-stand en de knoppen voor de lade vervallen en `setSheet` zet de stand altijd op open. De voorwaarde staat twee keer: in de media query van `src/head.html` en in `uiMqSide` in `src/app2-panel.js`; wie een van beide wijzigt, wijzigt ook de ander. Bij draaien of formaat wisselen bepaalt de pagina de stand en het vrije beeld opnieuw.
- U19, de rest dimmen bij duiken: bij een dubbelklik (of een treffer in de onderdelenlijst) wordt alles buiten de focus gedimd met een vlak, eenzijdig, doorschijnend materiaal (`uiDimMat`, dekking 0,14, geen diepteschrijving), zodat het onderdeel eruit springt en niets ervoor staat. Een dubbelzijdig doorschijnend PBR-materiaal kostte op 2.500 meshes zes keer zoveel tekentijd. De focus is de groep zelf, of bij een onderdeel zijn ouder (de broers blijven zichtbaar). Aanwijzen en klikken werken door; een klik raakt liever iets in de focus dan een gedimd deel ervoor. De dimming vervalt als de selectie de focus verlaat (omhoog, kruimelpad, ander deel), bij de explosieschuif, `Demonteren`, isoleren, een preset en met de knop `Rest tonen` in het paneel; de schakelaar `Rest dimmen bij duiken` in Weergave (standaard aan) zet het uit. In Openen dimt niets. De stand zit in de snapshot van Stap terug (`dim`) en in de sleutel van de batches.

### Contract met de eigenaars

- Een opener heeft een bron voor hoek of slag (in `d` of in de brief) en een ondergrens `open.min` van minstens 0,8 maal de volle hoek of slag; `tools/opentest.py --strikt-min` eist dat van elke leider. Zonder ondergrens beloont de botsingstoets kleinere hoeken, en met een lage ondergrens kan een agent eerst de hoek verkleinen en dan de ondergrens meenemen.
- Asregel: de as ligt aan de scharnierzijde, buiten of op de omtrek van de delen van de opener. De bestaande scharnierdelen (het scharnierblad van een portier, de kapopzet) als as botsen aantoonbaar. Een volger of telescoop noemt het frame waarin zijn punten gelden; een verwijzing zonder knoop is niet toegestaan.
- Delen die aan de carrosseriezijde van een scharnier horen, krijgen `stay`.
- Blootleglijst: wat een opening laat zien, heeft een eigenaar. Voorbeelden: de tankkom in het rechter achterscherm (carrosserie, in dezelfde golf als de Vulklep in `src/systems.js`) en de handschoenenkastbak (interieur). Openers die twee bestanden raken, worden in een golf gebouwd.
- Botsing is geen schending als het contact al in de gesloten stand bestond. De uitzonderingen staan in `tools/open_allow.json` (9 regels, elk met reden) en zijn voor domeineigenaars alleen-lezen.

### De 26 openers

Hoeken in graden, slag in meter. De eindstand en de ondergrens komen uit `tools/opentest.py` en de code; de waarden gelden voor de eindstand van golf 5 (`33b2b50`), met de wijzigingen van golf 5b-3 voor de hoedenplank, de achterste zijruit, de B-stijl, de kwartsruit en de gasveer van de achterklep (zie ook de sectie hieronder). De camera (`look`) kijkt bij openen naar de opening; de bijzonderheden noemen de camera's die golf 5 veranderde.

| Opener | Soort | Eindstand | Ondergrens | Bijzonderheden |
|---|---|---|---|---|
| Motorkap | scharnier achterrand | 65 (past bij de geschatte 60 tot 75 graden van de gebruiker) | 55 | motorkapsteun van 0,50 m als volger met eigen scharnier (steunstang van 8 mm straal in donker staal); aluminium kap; camera van linksvoor |
| Portier linksvoor, rechtsvoor | scharnier voor de voorrand | 67 (was 68; RiDC, zie [specificaties-en-bronnen.md](specificaties-en-bronnen.md), Openingshoeken) | 60 | scharnierblad aan de carrosseriezijde blijft staan; B-stijl in lak met slotbeugel, de afdekking van de B-stijl begint boven de chroomband, en boven de gordel ligt een gelakte plaat zodat de stijl bij een open portier als stijl leest; camera haaks op de zij, iets van voren |
| Portier linksachter, rechtsachter | scharnier op de B-stijl | 62 | 55 | de kwartsruit draait als volger om dezelfde as mee (`bodDoorAxis`) |
| Zijruit (vier) | schuif in het portier | voor 0,39, achter 0,30 | voor 0,35, achter 0,26 | achter blijft een strook staan; de achterste ruit zakt schuin mee met de helling van de B-stijl (slag 0,314, 4,8 cm naar voren), de geleiderails en kabels lopen evenwijdig |
| Buitenspiegel links, rechts | scharnier | 80 naar achteren | 64 | camera dichter bij de spiegel |
| Achterklep | scharnier dakrand | 66 | 60 | twee gasveren als telescoop (290 mm in, 495 mm uit, cilinder Ø32 mm), onderaan met een kogelpen op een plaatje onder de lakhuid van de C-stijl (het plaatje reikt 5 mm boven en 25 mm onder de kogelpen) en bovenaan op de zijrand van de klep, zodat ze langs de zijkant lopen en de gesloten veer buiten de afdichting ligt; binnenpaneel met lijmrand, zodat de ruit van binnen als glas leest; camera schuin van achteren en hoger |
| Hoedenplank (volger van de achterklep) | scharnier aan de voorrand | 52 (0,9 rad) | 41 (0,72 rad) | hangt aan twee dunne koordjes (4 mm, textiel; telescopen) aan de klep, met de luidsprekers erop, en heeft een uitsparing in de voorrand voor de middelste gordelrolautomaat en een sparing in elke voorhoek voor de scharnierpen; uitgenomen (`hideWhen`) zolang Rugleuning groot deel, Rugleuning klein deel of Bagageruimtevloer open is |
| Tankklep | scharnier voorrand | 140 | 112 | tankkom in het rechter achterscherm, capless vulhals |
| Glaspaneel voor (label Schuifdak) | kantelen en schuiven | 0,60 | 0,48 | needs Zonnescherm voor; luchtgeleider volgt |
| Zonnescherm voor, achter | schuif naar de cassette | 0,60 en 0,44 | 0,50 en 0,36 (0,82 maal de rechte slag van de eerste lamel, met de stop voor de cassette meegerekend) | lamellen als volgers; de stapel stopt vlak voor de cassette, zodat greep en rand van binnen te zien zijn; camera's van binnen (voor: vanaf de achterbank naar de greep; achter: tussen de voorstoelen naar achteren en omhoog) |
| Handschoenenkastklep | scharnier onderrand | 72 | 60 | needs Portier rechtsvoor; nieuwe camera |
| Armsteunkussen | scharnier | 66 | 53 | needs Portier linksvoor; nieuwe camera |
| Rugleuning groot deel (rechts), klein deel (links) | scharnier | 104 | 83 | needs Achterklep; hoofdsteunen en gordels gaan mee; de naad tussen de delen is donker; nieuwe camera |
| Middenarmsteun achter | scharnier | 104 | 83 | hangt in Rugleuning groot deel; needs Portier linksachter; nieuwe camera |
| Zonneklep links, rechts | scharnier voorrand | 169 | 138 | ligt neergeklapt bijna tegen de voorruit; nieuwe camera |
| Bagageruimtevloer | scharnier voorrand | 62 | 50 | needs Achterklep; opbergbak eronder; lichte onderzijde aan de klapbare vloer (volger); nieuwe camera |
| Olievuldop | scharnier aan een lip op de rand van de vulhals | 103 | 83 | needs Motorkap; de dop klapt omhoog en blijft aan de hals zitten |
| Expansiedop | scharnier aan een lip op de achterrand van de hals | 103 | 83 | needs Motorkap; de dop blijft aan de hals zitten, met een zichtbare vulopening |

De hoedenplank en haar luidsprekers zijn volgers met een eigen `open.min` van 0,72 rad (0,8 maal de hoek van 0,9 rad). De ondergrenzen in de vierde kolom zijn minstens 0,8 maal de volle hoek of slag; `opentest.py --strikt-min` bewaakt dat.

Wat golf 5 aan de blootlegging toevoegde: een donkere naad tussen de rugleuningdelen; zijbekleding in de bagageruimte, links en rechts in donker vilt over de wielkasten en de vulpijp; een Laadvloer voorstuk; de hemel 6 mm lager, zodat het dakframe er niet doorheen steekt; en camera's voor de armsteun, de middenarmsteun achter, het handschoenenkastje, de zonnekleppen, de rugleuningen en de bagagevloer. De voorruit is van binnen doorzichtiger: een eigen materiaal (`glassWs`) geeft de binnenkant 0,45 maal de dekking van de buitenkant, zodat kap, wissers en lucht erachter doorschemeren en de ruit van binnen niet als egaal zwart vlak leest.

### Panoramadak

Het panoramadak (`src/panorama.js`) heeft twee getinte glaspanelen achter elkaar met een dwarsbalk. Het voorste glas kantelt aan de achterrand en schuift 0,60 m naar achteren boven het vaste achterglas, langs de dakkromming (`arc`, `tilt`). Alles ligt op of onder het dakvlak van het model en blijft tussen dakplaat en hemelbekleding. Maten in het autoframe: voorste glas z 0,20 tot -0,50 (opening in het dak vanaf 0,22), dwarsbalk -0,50 tot -0,58, achterste glas -0,58 tot -1,11, glas x plus en min 0,47. Alles is geschat uit foto's.

Golf 5 veranderde het uiterlijk van het dak:

- Glas: van buiten zo goed als zwart (materiaal `bodPanoGlass`, dekking 0,92). Dat is de keuze van de gebruiker van 15 oktober 2026, naar de auto die hij kent. De zonneschermen zijn van buiten daardoor nauwelijks te zien; van binnen blijven glas en lucht zichtbaar.
- Binnenkant: de plaat heeft boven- en onderzijde met dezelfde wikkeling. Vanaf het dak zijn het voorzijden en vanaf de cabine achterzijden (de gang met `FLIP_SIDED`). Alleen in die tweede gang krijgt het glas een blauwgrijze kleur met een zwakke weerspiegeling van de hemel (randglans en een schuine lichtband, `panGlassIn`). Van binnen leest het glas zo als een donkergrijs vlak tegen de lichte lucht van de open opening; de buitenkant blijft ongewijzigd.
- Binnenlijsten: twee smalle zwarte kunststof lijsten (`Binnenlijst opening voor` en `achter`) rond de openingen, 3,3 cm onder het dakvlak en net binnen de afwerkring van de hemel (rand van de hemelopening op |x| 0,45). Van binnen leest de opening zo rondom als een donkere omlijsting.
- Zonneschermen: de cassette is bekleed in taupe (`bodPanoCass`), donkerder dan de hemel, zodat het huis en het opgerolde scherm zich aftekenen. De stapel lamellen stopt vlak voor de cassette en de greep is groter (8 bij 1,8 cm), zodat van binnen te zien is dat het scherm open is. De camera's van de twee zonneschermen staan binnen in de cabine.

### Prestaties in Openen

Frametijd p95 bij alles openen en sluiten: 2,2 tot 3,1 ms in golf 4 en 1,5 ms in een nameting op de eindstand van golf 5 (mediaan van drie metingen, grens 8 ms). Tekenopdrachten op de eindstand van golf 5: 444 gesloten en ongeveer 784 met alles open (grens 3.000). Dat zijn meetwaarden uit software-rendering.

## Contracten tussen de eigenaars

De delen bouwen parallel en kennen elkaar alleen via de volgende afspraken. Wie een waarde wijzigt, meldt dat.

### Gedeelde carrosseriefuncties (`body.js`)

| Symbool | Betekenis |
|---|---|
| `ZF`, `ZR` | Bumperpunten voor en achter (z = +2,35 en −2,35). |
| `AXF`, `AXR`, `AY` | Vooras, achteras, wielmiddelpunt. |
| `TRACK_F`, `TRACK_R`, `ARCH` | Halve spoor voor en achter, wielboogstraal rond beide assen. |
| `HW(z)` | Halve breedte in bovenaanzicht: plateau 0,893 van −1,2 tot 1,2; neus 0,33 bij +2,30; staart 0,50 bij −2,30. |
| `YB(z)` | Onderkant van de carrosserie. |
| `YT(z)` | Schouderlijn, gelijk aan de raamlijn in de cabine; achter z < −2,268 de hoogte van de bumperrichel (0,635). |
| `YR(z)` | Daklijn op de hartlijn, geldig van `SP` (−2,11) tot `WS0` (1,06): (−2,11; 1,13), (−1,17; 1,37), (−0,43; 1,447 piek), (0,3; 1,346), (1,06; 0,975). De binnenkant van het dak ligt ongeveer 2 cm lager. |
| `surfX(z, y)` | Buitenhuid in x op hoogte y. Boven `YT` in het kasbereik geeft hij de halve breedte van ruit, stijl of dak; boven dek of dak 0. |
| `skin(z, y, s, out)` | Punt op de huid. |

Het interieur, de motor, de systemen en het onderstel leiden hun raakvlakken met de carrosserie af uit deze functies in plaats van uit vaste getallen.

### Kapprofiel

Eén tabel voor de motorkap, vastgelegd vóór de carrosserie- en motorronde omdat het eerste contract en het gemeten silhouet elkaar tegenspraken (binnenkant kap minimaal 0,93 over z 1,10 tot 1,80, terwijl de buitenkant op de hartlijn 0,885 is bij z = 1,845).

| z (m) | Buitenkant kap op de hartlijn | Hoogste punt van onderdelen bij x = 0 | Bij \|x\| = 0,6 |
|---|---|---|---|
| 1,06 (voet voorruit) | 0,97 | 0,93 | 0,89 |
| 1,35 | 0,97 | 0,93 | 0,89 |
| 1,60 | 0,93 | 0,89 | 0,85 |
| 1,85 | 0,885 | 0,845 | 0,80 |
| 2,10 | 0,81 | 0,77 | 0,72 |

`tools/integrity.py` faalt als een onderdeel buiten de carrosserie minder dan 2,5 cm onder de buitenhuid van de motorkap blijft, minder dan 0,5 cm onder de laagste laag van de motorkap (binnenframe of isolatiemat) blijft, of boven de carrosserie uitsteekt. Dezelfde controle toetst de lengte van de carrosserie (binnen ZR tot ZF met 6 mm marge) en de breedte (hoogstens 0,915 zonder spiegels, spiegels hoogstens 1,035).

### Aansluitpunten van de motor (`ENG_PORTS`, motorframe)

Elke poort is `{ p, dir }`; `portAt(poort, afstand)` geeft een punt op die afstand langs de richting.

| Poort | Plaats p | Richting | Gebruiker |
|---|---|---|---|
| `turbineOut` | (−0,017, 0,14, −0,255) | (−1, 0, 0) | uitlaat |
| `compIn` | (0,17, 0,14, −0,255) | (1, 0, 0) | luchtfilterslang |
| `compOut` | (0,125, 0,218, −0,291) | (0, 1, 0) | warme intercoolerslang |
| `throttleIn` | (−0,262, 0,14, 0,21) | (−1, 0, 0) | koude intercoolerslang |
| `thermostatOut` | (0,252, 0,358, 0,04) | (0, 1, 0) | koelslang boven |
| `waterPumpIn` | (−0,155, 0, 0,158) | (0, 0, 1) | koelslang onder |
| `fuelRailIn` | (0,205, 0,306, 0,165) | (0, −1, 0) | brandstofleiding |
| `psOut` | (−0,262, −0,07, 0,275) | (0, −1, 0) | drukslang stuurbekrachtiging |
| `psIn` | (−0,30, −0,005, 0,32) | (0, 0, 1) | aanzuigslang van het reservoir |
| `acSuc` | (−0,25, −0,111, 0,15) | (0, 1, 0) | Zuigleiding van de aircocompressor (dikke nippel Ø16; golf 5b-3) |
| `acDis` | (−0,228, −0,111, 0,15) | (0, 1, 0) | Persleiding van de aircocompressor (dunne nippel Ø12; golf 5b-3) |

De waarden van de eerste zeven zijn die van golf 1. De stuurpomp (golf 2) voegt `psOut` en `psIn` toe; de waarden in de tabel zijn de definitieve, afgeleid van `ENG_PS` = (−0,27, −0,005, 0,255) in `engine1.js`. De pomp zit als groep op de multiriem, met de poelie in het multiriemvlak, en de riemloop gaat langs drie verbruikers. De positie van de pomp en de routes van de slangen zijn schematisch. Het onderstel gebruikt ze met een terugvalwaarde (`ENG_PORTS.psOut || { ... }`), zodat de bouw niet breekt als de poort ontbreekt.

### Aansluitpunten van de aandrijflijn (`DRV_PORTS`)

`DRV_PORTS.starterTerminal` (motorframe, in golf 1 [GB_X + 0,12, −0,035, 0,205]) is de plusaansluiting van de startmotor; de kabel in `systems.js` volgt die verwijzing. Definitieve waarde na golf 2: de startmotor zet hem na het bouwen op het plusklemmetje, (0,3905, 0,0145, 0,177) in het motorframe (GB_X = 0,235).

### Gereserveerde ruimte

| Zone | Wat | Eigenaar |
|---|---|---|
| Zone P (motorframe: x −0,36 tot −0,205, y −0,07 tot 0,06, z 0,19 tot 0,32) | Stuurpomp met poelie in het multiriemvlak (x −0,345). Niemand anders plaatst hier iets; 1 cm marge. | motor |
| Gang onder `psOut` (x −0,30 tot −0,24, y −0,26 tot −0,06, z 0,235 tot 0,32) | Drukslang van de stuurbekrachtiging. | onderstel |
| Multiriemvlak (motor-x −0,3575 tot −0,3325, z 0,15 tot 0,25) | De koude intercoolerslang draait binnen ongeveer 5 cm na de gasklepflens weg, vóór motor-x −0,31, en loopt om zone P heen. | systemen |
| Rechter motorsteun | `Motorsteun distributiezijde` blijft vrij van de dynamo: voorvlak op motor-z hoogstens 0,105, of boven motor-y 0,41. | aandrijving |

Eindwaarden: de stuurpomp zit binnen zone P (`ENG_PS`, poelie met tipstraal 0,058); `psOut` en `psIn` staan in de tabel hierboven; de startmotoras ligt op (y −0,040, z 0,147) met de solenoïde ernaast op (0,046, 0,030). De motorsteunbouten zijn in de herstelronde op het geklemde vlak gezet (F11). `integrity.py` meldt op de eindstand 0 fouten; de zone-afspraken zelf worden niet apart getoetst.

## Ontwikkelgeschiedenis

1. Versie 1 (12 oktober 2026): specificaties onderzocht, eerste opbouw van het model en de bediening (865 onderdelen), geen consolefouten. Daarna verbeterd op feedback dat de auto niet op een Laguna leek: lagere gordellijn, afgeronde neus en staart, karakterlijn, grotere verlichting, donkerder glas. Bediening aangescherpt (markering alleen op het geselecteerde deel, labels zonder overlap). Gepubliceerd; die versie staat in `docs/v1/index.html`.
2. Onderzoek en audit (13 oktober): nieuw onderzoek per domein (motor F4Rt, exterieur, automaat, onderstel en interieur) en een audit van de bestaande pagina. Het onderzoek liet zien dat de automaat een Jatco JF613E is en geen Aisin, dat het model de remmen, de ABS-ring en de stuurbekrachtiging niet goed had, en dat de motor kopstoters had waar de F4R rolzwenkarmen heeft. De beslissingen bij tegenstrijdige bronnen staan in [specificaties-en-bronnen.md](specificaties-en-bronnen.md).
3. Plan versie 2 en premortem: het verbeterplan is getoetst met een premortem, die het eerste plan als fatale fout beoordeelde (klikregel en motorkapregel). Het plan is herzien (zie [premortem.md](premortem.md)): enkele klik klapt de eigen groep uit, kapprofiel per z-station, doorsteekcontrole, silhouettoets, publicatierooktest, hard tijdkader.
4. Golf 1 (13 oktober, samengevoegd rond 11:30 UTC): de app (klikregel, modi, schuif, presets, labels, `inner`-verbergen), de carrosserie (nieuw oppervlak naar het gemeten silhouet, 385 onderdelen) en de motor (680 onderdelen, rolzwenkarmen, twin-scroll turbo). Stand: 1.762 knopen, 1.052 tekenopdrachten gemonteerd, silhouettoets 46 van 46 stations binnen tolerantie.
5. Golf 2 (13 oktober, vanaf 14:15 UTC): onderstel, interieur, aandrijving en systemen, elk in een eigen worktree tegen de nieuwe carrosserie en motor, plus de stuurpomp en een app-integratieronde (gebaren op `event.timeStamp`, gebundeld renderen, controle van `inner`). Zes agents tegelijk op vier CPU's. Resultaat: samengevoegd om 15:10 UTC op 2.882 knopen, 2.397 onderdelen, 597.792 driehoeken, 350 tekenopdrachten met bundelen (1.548 zonder), itest met poorten 78 van 78, integrity met 1 fout (Motorkapsteun raakte de dynamo) en 52 van buitenaf zichtbare `inner`-knopen. `__model.ready` duurde 19,4 s tegen een grens van 20 s; daarom wacht `ready` sindsdien hoogstens 2 s op de batches.
6. Golf 3: samenvoegen, volledige testset, herstel per eigenaar (hoogstens twee ronden), documentatie, nieuwe screenshots, `pubsmoke.py` groen, publicatie op dezelfde URL en de URL terugkijken. Resultaat: een codereview (zoeken en toetsen apart) en de integratietests gaven bevindingen per eigenaar, die de herstelronde heeft verwerkt (onder meer motorkapsteun langs de frontmodule, langsliggers 1,5 cm naar buiten, geen dubbele UCH of naafmoer, opgetild onderdeel valt terug bij de schuif, rondleidingsbalk op de telefoon, startmotor en koppelomvormer klappen niet in dezelfde ruimte uit, demperring, zonnewiel en oliezeef vrij). De eerste visuele poort op de samengevoegde stand van golf 2 las de screenshots steeds opnieuw, leverde na 1 uur 40 niets op en is gestopt. Een tweede, begrensde poort keurde 50 galerijbeelden van de build `8095a3e` in drie plakken, elk beeld één keer. De orkestrator heeft elke melding nagekeken in de screenshots van de presets zelf: twee blokkers vervielen (dashboard en motorruimte van boven waren camerahoeken van de galerij). Een korte visuele herstelronde (vier eigenaren, elk in een eigen worktree) loste op: accuhouder boven het deksel, uitlaatpijpen bij de demper, startmotor langs de ankeras, kleppen vrij onder de kop, stator als plaatpakket met wikkelkoppen, en de presets Dynamo en startmotor, Portier linksvoor en Rem linksvoor, plus kleinere labels op smalle schermen. Het exterieur haalt S7 niet (3 van 9 kenmerken volledig); zie [premortem.md](premortem.md), struikeldraad 3. Eindstand op `d6d0456` (`index.html` in `60909fe`): 2.881 knopen, 485 groepen, 2.396 onderdelen, diepte 8, 604.972 driehoeken; `build.py --lint` ok; smoke zonder consolefouten; integrity 0 fouten, 0 ankerfouten, 0 presetfouten en 126 waarschuwingen; silhouet 46 van 46 stations binnen tolerantie; `ui_inner.py` 0 zichtbare ingesloten knopen; `pubsmoke.py` OK; itest met poorten: 78 van 79 (één randgeval bij de willekeurige tikken op de telefoon, in twee runs gelijk; zie [testen.md](testen.md)). Publicatie: versie 3 op dezelfde URL; de teruggelezen pagina bevat `index.html` byte voor byte.
7. Carrosserieronde (vertrekpunt: `handomdraai.md` op `ecc3c57`, 13 oktober avond; in de commitberichten heet ze "golf 3", net als de fase hierboven). Vier carrosserierondes met visuele poorten, daarnaast app, motor en onderbouw, en de meldingen van de gebruiker over de onderkant. Eindstand van de code `ff42dbd`, `index.html` gebouwd in `5b6cefa`, de testset liep op `9c731c8`.
   - Carrosserie, ronde 1 en 2 (eerste stap door twee agents parallel, daarna twee herstelrondes na code review en poort): slanke horizontale achterlichten over de klepnaad, ronde staart, spoilerlip, kentekenplaat in een echte uitsparing, derde remlicht achter de achterruit, donker glas met chroomomlijsting, chromen smile en wenkbrauwen, spiegels in lakkleur, een sierlijst per portier, B-stijl als twee hoogglans zwarte afdekkingen, motorkap tot de voorruit. Beslissingen en redenen: [onderzoek/beslissingen.md](onderzoek/beslissingen.md).
   - Carrosserie, ronde 3 en 4: chroom dat op galerijformaat als chroom leest (bolle raamomlijsting, gordellijst, nieuw chroommateriaal), kwartsruit met een schuin zwart stijltje, achterruit verder om de dakrailronding, echte luchtinlaat met lamellen, ronde mistlampen, spoilerlip van 3,6 cm.
   - App: de oplossing van het itest-randgeval (`touchend` met `preventDefault()` en label-klik alleen als de aanwijzer op het label begon), labelankers op het gelabelde deel zelf en opgebouwd over frames, de preset Stuurpomp vanaf de andere kant.
   - Motor: de Aandrijflijn van 250.794 naar 237.310 driehoeken (budget 240.000), met lichtere klepgroepen, zuigerringen, kleine veren, poelies en stator.
   - Onderbouw: einddemper plat en donker onder de vloer, parkeerremunit naar x 0,28 en z −1,40, en drie gemelde contacten (accuhouderstang, vulpijp, remslang achter) nagemeten en opgelost.
   - Meldingen van de gebruiker (telefoon, auto van onderen bekeken): een zwarte streep door het wiel (portierrubber door de achterwielboog, commit `9c731c8`), een raar achterwiel (spaken te diep verzonken, `f10fd54`), een los hangende uitlaat (`c22312d`, later de eindstukken in `ff42dbd`) en bij het nalopen het zicht op het interieur door de wielbogen en van onderen (gesloten wielkasten, vloer tot de wielkast en een achterbank om de wielkasten, `9c731c8`). Elke melding is eerst met stralen en schermafbeeldingen nagerekend.
   - Resultaat: 2.924 knopen, 489 groepen, 2.435 onderdelen, 630.368 driehoeken, 390 tekenopdrachten gemonteerd met bundelen (1.726 zonder), itest met poorten 79 van 79, poort 5 haalt S7 met 7 van 9. Details in [testen.md](testen.md) en [premortem.md](premortem.md). Versie 4 en versie 5 staan op dezelfde URL.
8. Golf 4 (14 en 15 oktober 2026): de modus Openen met 26 openers, het panoramadak, onderdeelnummers in het paneel en de kennis uit het rapport van de gebruiker en het werkplaatshandboek MR 415. Twee premortems op het plan (openmodus en panoramadak; gegevens en proces), zie [premortem.md](premortem.md). Eindstand van de metingen: `g4final4` op `3ab6a8d` (zie [testen.md](testen.md)); drie visuele poorten met een herstelronde na elke poort. Versie 6 van de URL is gepubliceerd op 15 oktober 2026 (`index.html` uit `3ab6a8d`).
9. Golf 5 (15 en 16 oktober 2026): de verbeterpunten uit de handomdraai van golf 4, per domein in een eigen worktree, met drie visuele poorten en een herstelronde na elke poort. Openen: nieuwe camera's en herziene delen van achterklep, motorkap, voorportieren, spiegels, voorruit en interieuropeners, de engine-optie `hideWhen` voor de hoedenplank, olievuldop en expansiedop als scharnier. Interieur: zijbekleding in de bagageruimte, lichte onderzijde aan de klapbare vloer, hemel 6 mm lager. Motorruimte: multiriem van 1.569 naar 1.672 mm. Onderkant: voorste en achterste langsliggers, bodemplaat met opkant boven de torsiebalk, tank en koolstoffilter voor de balk, ATF-koeler lager. Panoramadak: glas zo goed als zwart, binnenkant en binnenlijsten. App: U19, zijkolom op de liggende telefoon, schuivende presetrij, compacte kaart, openerlijst die na een keuze sluit en een kader dat kaart en dock volgt. Feiten: de auto volgens de RDW (EURO 5 A, 125 kW, 8,7 l/100 km, 201 g/km, eerste toelating 18 februari 2011), motor waarschijnlijk F4Rt 813, ATF 7,6 l totaal en 3,5 l na aftappen (Elfmatic J6), geen 4Control; zie [onderzoek/beslissingen.md](onderzoek/beslissingen.md). Nummers: 13 verkoopeenheden met een gekozen uitvoering voor deze auto, de dynamo weer open vanwege de 813, 58 varianten open. Eindstand van de code `33b2b50`, testset `g5final3` alles groen, itest 155 van 155 (zie [testen.md](testen.md)); poort 3 op 13 ja, 4 deels en 0 nee en S7 met 7 van 9 gehaald. De Carrosserie zit op 189.446 van 190.000 driehoeken. `index.html` van versie 7 is gebouwd in `25c3ddf` en op 16 oktober 2026 gepubliceerd op dezelfde URL en byte voor byte teruggelezen. Versie 7 is daarna via PR #4 in `main` gekomen en op GitHub Pages gezet (zie [../CHANGELOG.md](../CHANGELOG.md)).

10. Golf 5b-3 (17 oktober 2026, tot en met ronde 9; versie 10, gepubliceerd): de restpunten van 5b-2, met een premortem vooraf ([premortem.md](premortem.md)), zeven domeintakken in worktrees, een tweede golf voor de naven op `TRACK_F`, een orkestratorfase voor lint, helpers en docs en daarna de rondes 2 tot en met 9 (B-stijl, achterruit, kwartsruit, gasveerplaatje, hoedenplank, gordelband, scharnierpennen van de hoedenplank, gasveercilinder, instaplijst). Zichtbaar: Airconditioningleidingen, de vulpijp in twee delen, de naven op `TRACK_F`, de hoedenplank op 52 graden en de gasveer van de achterklep. Onder de motorkap: de gedeelde helpers in `core.js`, `spring()` met `per`, de lint van `d`, `spec`, `note` en `label`. Per punt en met de poort: [masterplan.md](masterplan.md), sectie Golf 5b-3. De uitkomst van de poort (rood op `a90786b`, groen na ronde 9) staat in [testen.md](testen.md).

11. Golf 5c-2 (18 en 19 oktober 2026; versie 11, gepubliceerd): prestaties en codegezondheid in vier blokken. A: restpunten uit 5b-3 (de binnendelen van de achterlichten onder Achterklep en daarna Achterlicht links en rechts als vast deel zonder groep Buitendeel, de expansiedop op catalogusmaat, de voorruit van buiten op 0,80, de tekst van de Gordelband, `intRoundPlate` in `roundPlate`). B: de nummergegevens lui uit het blok `#pn`, één synchronisatie per handeling, geen DOM per frame, een lus die in rust stilstaat. C: `CFG`, `TXT`, `UI_MODES`, dode code en dubbele hulpjes. D: `initAppFields` en `app2.js` in vijf bestanden. Plan, per punt en metingen: [masterplan.md](masterplan.md), sectie Golf 5c-2.

12. Golf 5f en 5e (19 oktober 2026; versie 12, gepubliceerd): de carrosserie in drie rondes en een advisor-ronde op de S7-meldingen (B-stijl, staart, bumper, uitlaat in de bumper, randen voor, dakglas, spiegelvoet, binnendelen van het achterlicht; zie de sectie hierboven), de feiten uit handboeken en catalogi (ATF, startknop en kaartlezer in het dashboard, voorportier 67 graden, velgtekst) en de uitklapanimatie, waarvan de trap per laag nu in totaal begrensd is (`CFG.tijd.staffelMaxS` en `allesStaffelMaxS`). Daarnaast een meetmiddel: `LAG3_GPU=1` start de testbrowser op de echte GPU (alleen macOS), voor beelden die het oog beoordeelt. Plan, uitslag en commits: [masterplan.md](masterplan.md), sectie Golf 5f en 5e.

13. Vervolgronde 5g (19 oktober 2026; versie 13, gebouwd): de accu staat links achter in de motorruimte boven de automaat, naar de waarneming van de gebruiker op de eigen auto; het luchtfilter en de leidingen eromheen zijn daarvoor verlegd (zie de sectie "Motorruimte links achter (versie 13)"). Verder is de velg van 18 inch bevestigd, drijft de multiriem ook de stuurpomp aan (catalogus) en past de motorkap van 65 graden bij de waarneming van 60 tot 75 graden. Plan en besluiten: [masterplan.md](masterplan.md), sectie Vervolgronde 5g.

### Airconditioningleidingen en vulpijp (golf 5b-3)

De groep Airconditioningleidingen (`src/systems.js`, onder Koeling en luchtinlaat) heeft drie delen. De Persleiding loopt van `ENG_PORTS.acDis` (de dunne nippel van het Aansluitblok van de aircocompressor, gedefinieerd in `engine1.js`) naar de zijkant van het Leidingblok. De Zuigleiding loopt van het Expansieventiel langs de rechterflank naar `ENG_PORTS.acSuc`. De Vloeistofleiding loopt van de onderkant van de droger om de linkerrand van de radiateur naar het Expansieventiel. De route is niet getekend maar gezocht met een A*-zoekopdracht op een rooster met een minimale vrije straal en daarna met `clash.py` gemeten (0 doordringingen; de kleinste afstand tot een niet-aangesloten deel is die tot het schutbord). Het Expansieventiel staat net voor het schutbord; de echte plek van het expansieventiel en de droger is niet bekend, en `d` zegt \"schematisch\". De uiteinden liggen 0,1 mm vóór het aansluitvlak van de nippel. Bij Uitklappen krijgt de groep een eigen vector; het Condensorblok kreeg een eigen `ex`, omdat de automatische richting schuin door radiateur en vloeistofleiding ging.

De vulpijp is in twee delen: Vulpijp (onder) eindigt 2 tot 3 cm in de verhoging van de zijbekleding van de bagageruimte en Vulpijp bovenstuk begint waar de pijp vrij uit de zijwand komt. Beide stukken liggen exact op de oude buis (`sysTubePart`, afwijking 0 mm gemeten); het bovenstuk eindigt op u 0,98, net voor de vulhals, omdat de laatste bocht schuin op de hals aankomt. De overlap die overblijft, staat in `data/clash-toegestaan.json` met een maximale diepte per paar (de regel, zie [onderzoek/beslissingen.md](onderzoek/beslissingen.md)).

### B-stijl, achterruit, kwartsruit, hoedenplank, gordelband, gasveer en instaplijst (golf 5b-3, rondes 2 tot en met 9)

De B-stijl heeft per kant twee zwarte afdekkingen (portierkaders) met de portiernaad ertussen. Sinds golf 5f (ronde 3) is de B-stijl een mat zwart vlak van circa 12,8 cm op de gordel (bovenaan circa 11 cm) zonder chromen eindstukken: zie de alinea "B-stijl, staart en uitlaat in golf 5f" onderaan deze sectie. Wat hierna volgt is de stand van golf 5b-3; sinds ronde 2 van die golf was de chroomlijst langs de stijl een kort eindstuk van ongeveer 4 cm in de bovenhoek (de lijst over de hele hoogte las als dubbele witte lijn), lopen de zijruiten aan de stijl 4 mm onder de afdekking door en is de donkere lijn tussen de chromen bovenband en de lak 9 mm (`bodTR`). In ronde 3 kreeg de knoop B-stijl boven de gordel een gelakt buitenvlak (`bodBPillarFace`): een dichte plaat van 4 tot 9 mm binnen de kas, 16 mm van de glasranden, zodat het mesh gesloten blijft en `clash.py` er binnen-in kan meten. Dicht is de plaat achter de afdekkingen verborgen: boven de onderste 10 cm pas te zien onder ongeveer 29 graden met de zijkant. In de onderste 10 cm ligt ze sinds ronde 6 tot ongeveer 4 cm dieper (binnen de omhullende van de zakkende voorste zijruit); daar is ze in principe zichtbaar tot ongeveer 68 graden met de zijkant, achter glas. Of dat in beeld opvalt, is niet vastgesteld: S7 is in de eindpoort niet opnieuw gedraaid (exterieur ongewijzigd; ronde 3 gaf 9 van 9). Bij een open portier leest de stijl als stijl. Het profiel eronder eindigt op de gordel. In ronde 6 ligt de plaat in de onderste 10 cm 2,5 mm binnen de omhullende `bodBPEnv` van de zakkende voorste zijruit, die bij zakken kantelt en schuin naar buiten omlaag schuift.

De achterste zijruit zakt schuin mee met de helling van de B-stijl (`kSl = bodBRK`), omdat hij in de geleiding van de stijl loopt; rechtomlaag bleef 5 cm van de ruitstrook voor de stijl dood. De kwartsruit zit in het raamkader van het achterportier en draait met `follow` om dezelfde as mee (`bodDoorAxis`); bleef hij staan, dan hing hij bij een open achterportier los in de deuropening. Knoop en pad zijn gelijk gebleven, dus boom en onderdeelnummers ook.

De hoedenplank heeft sinds ronde 4 een uitsparing in de voorrand (`intPlankNotch`, 8 cm breed en 6 cm diep) voor de middelste gordelrolautomaat; de plank draait om een punt in die automaat en sneed er altijd doorheen. Hoek en de afronding van de rest van de omtrek zijn gelijk gebleven; de sparingen voor de scharnierpennen staan hieronder (ronde 7). De rusttand van de gordelband voor (ronde 5) hangt vrijwel recht omlaag uit de bovenste geleider, net achter de stijlbalk, met de tong eronder mee, zodat de achterste zijruit in geen stand de band snijdt; de beschrijving (`d`) volgt dat sinds ronde 6. Het plaatje van de Gasveerbevestiging (ronde 4) reikt 5 mm boven en 25 mm onder de kogelpen, omdat de cilinder bij een open klep omhoog wijst en anders door de bovenhelft liep.

Ronde 7 (scharnierpennen). De Plankscharnierpen links en rechts liggen op de draaias van de hoedenplank. De voorrand liep door die as, dus het midden van de voorrand lag in elke stand van de achterklep in de pen, op de inradius van de twaalfhoek (11 mm maal cos 15 graden, 10,625 mm); of een stand dieper uitkwam dan B0, hing alleen af van welke monsterpunten op de as vielen. Nu heeft elke voorhoek een sparing (`intPlankPen` in `src/interior.js`): 12,5 mm diep over de pen, 21 mm over de kraag, met 1,5 tot 4 mm ontwerpspeling rondom (de maat van de sparing) en een hoekafronding van 4 mm (`intRoundPlate`, verder gelijk aan `roundPlate`). De zijrand eindigt 4 mm binnen de volle breedte, zodat de voorhoek minder diep op de hoedenplanksteun ligt. De kleinste afstand tussen pen en plank over de hele beweging is gemeten op 0,66 tot 1,02 mm (bemonstering h 4 en h 1,5 mm); dat is de uitkomst van de meting en iets anders dan de ontwerpspeling. Pen, beugel, plankhoek en de uitsparing voor de gordelrolautomaat zijn gelijk gebleven.

Ronde 8 (gasveercilinder, samengevoegd in `5a2d10c`). De Cilinder van de gasveer in `src/bodyparts.js` is een gesloten draaivorm (`G.lathe`, cachesleutel `bodGsCyl`): een halve bol r 16 mm als kogelkom, een buis r 16 mm tot 0,27 m, een platte kop met 0,5 mm afschuining en binnenin een holte r 13,5 mm waarin de kogel (r 12 mm) van de Gasveerbevestiging zit. Voorheen was het `merge(cyl r16, sphere r16)`: de dekselschijf van die buis lag op lokaal z = 0 door het hart van de kogel en was het diepste punt van het paar (ook in B0). Buitenkant, maten, draaipunt en beweging zijn gelijk gebleven; de driehoeken staan in [cijfers.md](cijfers.md).

Ronde 9 (instaplijst, `457f729`, samengevoegd in `d1321cb`). Onderaan de portieropening lag een smalle grijze lijst op vloerhoogte (y 0,25) met daarachter een open sleuf tot de lakdorpel (bovenrand y 0,302); vanuit de camera van het open portier las dat als grijze vloerstrook (visuele poort, plak a K2). `sill()` in `src/interior.js` maakt nu per opening een zwarte instaplijst (`MAT.plastic`): een vlakke loopplaat over de bovenkant van de dorpel tot net binnen de lakrand en aan de binnenzijde een opstaande rand (x 0,762 tot 0,778) over de rand van de vloerbedekking, voor van de B-stijlvoet tot de A-stijl en achter van de B-stijl tot de wielboog. Daarop ligt een nieuwe knoop 'Sierstrip instaplijst ...' (vier stuks) met het materiaal `intSill` (lichte aluminiumlook), 2,8 cm binnen de buitenrand, zodat de strip bij een dicht portier niet door de naad boven de dorpel schijnt. De loopplaat ligt voor vrijwel gelijk met de lakdorpel en achter lager, omdat het rubber van het dichte achterportier al op y 0,302 begint. Ontwerpspeling verticaal voor 6 mm en achter 5 mm; gemeten in dichte stand is de ruimte 9,09 mm voor en 13,0 mm achter; over de hele beweging is de vrije ruimte minimaal 9,1 mm. Vorm en maten zijn geschat, geen spec. Twee dingen in beeld zijn geen fout: het zwarte blokje boven aan de B-stijl is de voorkant van Raamrubber boven van het achterportier, en de 'sleuf' in de sluitrand is de rand van het bekledingspaneel naast de Portierrand (ongewijzigd). De boom (`data/tree.json`) en `docs/onderdeelnummers.csv` kregen de vier sierstrips in een eigen commit (`1903e18`).

Alle acht rondes zijn gemeten met de strenge clashregel over de hele beweging (zie [onderzoek/beslissingen.md](onderzoek/beslissingen.md)), niet elke met de standenzwaai: die bestaat sinds ronde 6 (zie [testen.md](testen.md)). Een afhankelijkheid voor wie dit overneemt: de cache van `meetlib.js` ververst sinds `a000772` per stand; metingen in open stand van daarvoor, binnen één sessie, gelden niet.

### B-stijl, staart en uitlaat in golf 5f (versie 12)

Golf 5f werkte aan wat de S7-beoordelaars op de beelden van de echte GPU het vaakst noemden (stand en uitslag: [masterplan.md](masterplan.md), sectie Golf 5f en 5e).

B-stijl (S7 kenmerk 4). De twee afdekkingen zijn mat zwart (diep zwart, ruw, vrijwel zonder omgevingsreflectie; met glans spiegelden ze de lichte vloer en lazen ze als twee grijze stroken met een naad). Elke afdekking loopt `bodBRW` verder over de ruitrand (het runkanaal van het raamkader), zodat het zwarte vlak op de gordel circa 12,8 cm breed is en bovenaan circa 11 cm; de ruitranden zelf (`bodBf`, `bodBr`) bleven waar ze waren, en de ruit loopt 4 mm plus `bodBRW` onder de afdekking. De voorste ruitrand ligt op de gordel op z -0,121 in plaats van -0,073 (met 0,15 m was het vlak breder dan op de auto). De chromen eindstukken in de bovenhoeken zijn weg (ze lazen als twee lichte strepen naast een dunne zwarte stijl); de chroomlijst loopt alleen langs de bovenrand van de ruiten en de knoop Chroomlijst B-stijl (vier paden) is uit de boom. Zijruiten en kwartsruiten hebben een eigen glasmateriaal (`bodGlassSide`, dekking 0,84 in plaats van 0,92, met meer luchtreflectie), zodat het glas als donkergrijs leest en de zwarte stijl als vlak afsteekt; een proef met dekking 0,62 en 0,72 gaf voor kenmerk 4 nauwelijks verschil. De maat van 12,8 cm is geschat uit foto's; sinds besluit B7 (19 oktober 2026) beoordeelt S7 kenmerk 4 op die maat en is er geen geometrie meer voor.

Staart, bumper en uitlaat. Het staartvlak boven de bumper heeft een bolling die van 0,062 m op de bumperrichel lineair afneemt naar 0,015 m aan de bovenrand (`bodTB`, `bodTB1`) en rolt in de bovenste 15 cm naar voren om in het dek (`bodTF`); de bovenrand van de bumper rondt in de laatste 3 cm af als kwartcirkel (`bodTipR`, `bodTipDrop`). Dat zijn de enige wijzigingen in het alleen-lezen `body.js` (goedgekeurd door de orkestrator). Let op: in `bodyparts.js` zijn de x van de zijnaad en de afdichting van de achterklep vaste getallen, geen afgeleide van het staartvlak; verandert het staartvlak (`tailZ`), dan moeten ze mee, anders komt de afdichting buiten de huid of te diep in de sponning. De zijnaden van de achterklep zijn recht, op dezelfde x als de deling van het achterlicht. Het binnendeel van het achterlicht eindigt aan de binnenkant in een halve ellips van 3,5 cm diep in plaats van een rechte rand, en het klepvlak ertussen volgt die rand. De uitlaateindstukken zitten in een inham in de onderrand van de bumper (|x| 0,385 tot 0,515, tot y 0,345, vanaf z -2,13), met de achterkant gelijk met het bumpervlak; de uitlaatbuis blijft minstens 16 mm van de voorwand van de inham en de onderschort, 18 mm van de bumperschaal en 42 mm van de kabelboom (`clash.py`). Het achterste panoramaglas heeft ruwheid 0,2 en spiegeling 0,3, zodat de hemel er geen felle witte vlek meer op maakt, en de buitenspiegel staat op een voet als smalle plaat achter de kap in plaats van een blok.

Voorportier. De hoek is 67 graden (RiDC; zie [specificaties-en-bronnen.md](specificaties-en-bronnen.md), Openingshoeken). De hoek staat in `bodDoorAxis` in `bodyparts.js` (voorportier 67, achterportier 62 graden); het klepscharnierblad begint nu achter het scharnierblok.

### Motorruimte links achter (versie 13)

De gebruiker zag op de eigen auto dat de accu links achter in de motorruimte staat, boven de automaat; het model had hem rechtsvoor. Dat past bij MR 415 (de accubak draagt de zekeringkast en de motor-ECU). De plaats staat in `src/systems.js` (hartpunt `BX`, `BY`, `BZ` in de accu-groep); de maat van de bak is geschat. Wat er voor is verlegd, zodat niets elkaar raakt en de botsingsmeting schoon blijft:

- De Zekeringkast motorruimte staat op een bakje bovenop de accubak (zoals in het werkplaatsboek), met kabelboom en stekker mee.
- Het luchtfilterhuis (`AB`) staat 3 cm verder naar voren en is ingekort van 27 naar 22 cm diep; deksel, element en clips volgen, de uitlaat van het deksel zit nu aan de achterkant.
- De Aanzuigslang turbo loopt langs de wielkastzijde van de accu omlaag en achter de accu langs naar de turbo; de Resonator hangt onder het luchtfilterhuis.
- De Hete laadluchtslang en de Bovenste radiateurslang zijn lichtjes verlegd, en de Toevoerleiding (brandstof) loopt rond de nieuwe plek.
- De Accukabel plus gaat aan de voorkant van de accu omlaag en onder het luchtfilterhuis door naar de startmotor; de Massakabel accu loopt over de aanzuigslang heen naar een massaoog op de bovenkant van de linker wielkast.
- Van de stuurslangen Zuigslang en Retourslang (`src/chassis.js`) is alleen de tekst bijgewerkt (de punten zijn gelijk) en de Langsligger voor (`src/bodyparts.js`) kreeg een nieuwe tekst; de motorkap kreeg alleen een commentaar.

Open: de motor-ECU staat nog rechts tegen het schot (MR 415 zet hem op de accubak, dus links achter) en het verloop van de multiriem is niet bekend (alleen figuur 124137 van MR 415).

## Bewuste keuzes

- Geen merklogo's, typebadges of exacte kopie van het carrosseriedesign; het model volgt wel de hoofdmaten en het gemeten silhouet. De Renault-ruit op de neus is daarom niet getekend.
- Kentekenplaten zonder kenteken.
- Eén bouwbestand per domein en een contract met namen, in plaats van één groot bestand: agents kunnen parallel werken en samenvoegen is bijna vrij van conflicten.
- Geen opvulling om een onderdelendoel te halen. Geen groep met meer dan 12 identieke onderdelen die in werkelijkheid niet zo vaak voorkomen.
- Lettertypes: Saira Condensed (koppen), Atkinson Hyperlegible (tekst), IBM Plex Mono (gegevens).
- Geen backdrop-blur boven het canvas en een eenvoudige schaduwvlek onder de auto in plaats van echte schaduwen, voor de framesnelheid op telefoons.
- Het model toont de auto van de gebruiker met het panoramadak (een optie, bij Initiale 850 euro in Frankrijk). Geen 4Control: dat blijft een optie die het model niet toont.
- Openen is een tweede modus naast Uitklappen en vervangt het uitklappen niet. In Openen staat alles gemonteerd.
- Beelden die het oog beoordeelt (S7, galerij) komen van de echte GPU (`LAG3_GPU=1`, macOS, ANGLE Metal): SwiftShader tekent donkere spikkels op lak, dak en raamlijsten die op een echte GPU niet bestaan (gemeten in golf 5f). De testset, `visdiff` en de basislijnen blijven op SwiftShader, omdat die pixels op elke machine gelijk zijn; `finaltests.sh` zet de variabele uit. Zie [testen.md](testen.md).
- De trap van een duik, van tonen en van alles uitklappen heeft een bovengrens in tijd (`CFG.tijd.staffelMaxS`, `allesStaffelMaxS`); de duur van één stap (0,85 s) blijft. Duiken tot 3 lagen gedragen zich als voorheen.
- Een opener heeft altijd een ondergrens (`open.min`). Zonder ondergrens zou een botsingstoets agents naar kleine hoeken sturen.
- Elke onderdeelstatus heeft een bron. `Past volgens catalogus` zegt niet dat het nummer op deze auto past, en de pagina vraagt altijd om controle op het chassisnummer. Wat niet onderzocht is, blijft `Niet onderzocht`.
- Waar het onderzoek geen bron had, staat de opbouw als schematisch in de beschrijving en in [specificaties-en-bronnen.md](specificaties-en-bronnen.md).
