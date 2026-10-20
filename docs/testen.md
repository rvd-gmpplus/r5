# Testen

Alle tests draaien in headless Chromium via Playwright (Python), met WebGL via SwiftShader (software-rendering). Elk script bouwt `src/` naar een tijdelijke testmap, start een kleine lokale webserver op die map en opent de pagina op 1280 × 800 (muis) en, waar nodig, op 390 × 844 (touch, schaal 2). Elk script geeft exitcode 0 bij slagen en 1 bij een fout.

De scripts zijn generiek (laguna3 `6192326`, zie `framework.json`). Wat per auto verschilt, lezen ze uit `auto.json`, `src/body.js`, `data/silhouet.json`, `tools/anchors.json` en `tools/open_allow.json`. Dit document beschrijft wat ze in deze repo doen en wat er nog ontbreekt.

Uitzondering voor beelden die het oog beoordeelt: `LAG3_GPU=1` start de testbrowser op de echte GPU (alleen macOS, ANGLE Metal; `tools/harness.py`). SwiftShader tekent op lak en raamlijsten donkere spikkels die op een echte GPU niet bestaan. De testset en visdiff blijven op SwiftShader, omdat die pixels op elke machine gelijk zijn; `finaltests.sh` zet de variabele uit. De naam van de variabele komt uit laguna3 en geldt hier ook.

## Stand in deze repo

| Onderdeel | Stand |
|---|---|
| lint, `framework.py check`, smoke, integrity (0 fouten), `tri.py --gate`, `pncheck.py`, `maat.py --zelftest` | groen na golf 1 |
| silhouette | rood tot golf 2: `data/silhouet.json` komt uit de maattekening van de brochure, genormaliseerd op 3.922, 1.498 en 1.774 mm, tolerantie 30 mm. Het model haalt het niet (`SILHOUET NIET OK`). Ook de CI-stap silhouette is daardoor rood. |
| `tools/maat.py` | rood tot golf 2 (`MATEN NIET OK`); extra test `maat` in `auto.json` |
| `tools/itest.py` | bestaat nog niet (staat onder `auto` in `framework.json`) |
| `docs/baseline/` (visdiff en anchorcheck) | bestaat nog niet |
| opentest | tot golf 2 `opentest klaar in 11 s: 23 fouten, 0 meldingen` over 12 van de 13 openers (oude carrosserie), zie Bekende ruis in [CLAUDE.md](../CLAUDE.md) |
| nightly | rood bij de stap itest, zie Bekende ruis in [CLAUDE.md](../CLAUDE.md) |
| `tools/orkestratie/gateshots.py`, `poort.js`, `gallery.py`, `rays_bagage.py` | bestaan nog niet (autobestanden) |

## Voorbereiding

```bash
bash tools/setup.sh            # Playwright uit requirements.txt, three.js 0.147.0 in de cache (met hashcontrole), Chromium
python3 tools/smoke.py
```

`tools/harness.py` bouwt de testmap met een symlink `three/` naar het npm-pakket en start Chromium. Het ophalen van three.js vraagt `npm` en een netwerkverbinding; het pakket wordt vergeleken met de npm-integriteit (`THREE_INTEGRITY` in de harness). De versie staat op één plek: `THREE_VERSION` in `build.py`. Een SessionStart-hook (`.claude/hooks/session-start.sh`) draait `tools/setup.sh` in een Claude Code-sessie in de cloud.

| Omgevingsvariabele | Werking |
|---|---|
| `THREE_DIR` | Map met het uitgepakte npm-pakket `three@0.147.0`. Standaard `~/.cache/explosietekening/three-0.147.0/package`; ontbreekt die, dan draait het script `npm pack three@0.147.0` en pakt het uit. |
| `CHROMIUM` | Pad naar een Chromium-binary. Standaard `/opt/pw-browsers/chromium` als die bestaat, anders de Chromium van Playwright. |
| `MODEL_TEST` | Een bestaande testmap hergebruiken in plaats van opnieuw te bouwen. |
| `MODEL_TIMEOUT_MS` | Wachttijd op laden en `ready`, standaard 120000. |
| `PUBSMOKE_READY_MS` | Grens voor `ready` in `pubsmoke.py`, standaard 20000. |
| `LAG3_GPU` | `1`: echte GPU in plaats van SwiftShader (alleen macOS). |
| `WARN` | Aantal waarschuwingen dat `integrity.py` toont, standaard 25. |
| `UI_INNER_DIRS`, `UI_INNER_OPEN_DIRS` | Aantal richtingen in `ui_inner.py`, standaard 200 en 120. |

De harness zet `window.__MODEL_CACHECHECK = true`, zodat een botsing van cachesleutels in `core.js` als consolefout verschijnt. Een script faalt bij elke console-fout of -waarschuwing, behalve de regels in `IGNORE` in `tools/harness.py` (nu `favicon.ico` en `GPU stall due to ReadPixels`). De Google Fonts-verzoeken beantwoordt de harness uit `~/.cache/explosietekening/fonts`.

De pagina zet `window.__model` met hulpfuncties voor tests, onder meer `version`, `finishAll()`, `state()`, `preset(id)`, `checkPresets()`, `pickNodeAt(x, y)`, `hoverTarget(x, y)`, `setExplode(v)`, `labelRects()`, `freeView()`, `profileFrames(naam, aantal)`, `timing()`, `batchFlush()` en `batchStats()`. `auto.json: hook` is hier ook `__model`, dus er is geen tweede naam. Een eigen `THREE.Raycaster` in een testscript moet `ray.layers.enableAll()` aanzetten: gebundeld renderen zet de losse meshes van gesloten groepen op laag 1.

Het gebruikte bestand is de testversie (`python3 build.py --test-only MAP`): die laadt three.js lokaal. De gepubliceerde `index.html` laadt het van jsDelivr en wordt door `pubsmoke.py` apart getoetst.

## CI op GitHub

`.github/workflows/ci.yml` draait bij elke push en PR de snelle set: lint, `index.html` hoort bij `src/`, pncheck, `framework.py check`, smoke, integrity, silhouette, `tri.py --gate` en de testlijst van `finaltests.sh`. `nightly.yml` draait elke nacht en op aanvraag de lange set: itest met poorten, `opentest --strikt-min`, `ui_inner --open --strict`, `pncheck --tree`, pubsmoke, anchorcheck tegen `docs/baseline/anchorcheck.json`, visdiff (alleen informatie) en stats. In deze repo faalt nightly al bij de eerste teststap, omdat `tools/itest.py` ontbreekt. Beide workflows zijn generiek en worden hier niet bewerkt.

## Scripts

### `python3 build.py --lint`

Controleert zonder iets te schrijven: dubbele functienamen op het hoogste niveau, dubbele materiaalnamen in `std()` en `phys()`, de syntaxis van het samengevoegde script en van het inline script in `src/head.html` (`node --check`), en tekstregels op de stringwaarden van `d`, `spec`, `note` en `label`: R1 geen schatwoorden in `spec`, R2 geen decimale punt bij een eenheid, R4 een punt als duizendtal vanaf 1.000 vóór een eenheid, R5 Ø zonder spatie vóór de maat, R7 een cachesleutel begint met het voorvoegsel van het bestand (tabel `_voorvoegsels` in `auto.json`). De lint controleert niet of een feit waar is; dat doet de bronlijst.

### `python3 tools/smoke.py`

Laadt de pagina op desktop en telefoonformaat en meldt knopen, groepen, onderdelen, diepte, meshes en driehoeken, één render van de gemonteerde en één van de volledig uitgeklapte auto, en of de telefoon horizontaal scrollt. Exitcode 1 bij console- of paginafouten.

### `python3 tools/integrity.py`

Integriteit van de boom. Fouten: een knoop zonder naam, een groep zonder kinderen, een onderdeel zonder geometrie, NaN, een ongeldige omhullende of uitklapvector; een onderdeel buiten de omhullende van de auto; carrosserie buiten `ZR` tot `ZF` (6 mm marge) of breder dan `BOD_WMAX` (zonder spiegels) of `BOD_MIRW` (met spiegels); iets dat boven de carrosserie uitsteekt; te weinig ruimte onder de motorkap (2,5 cm onder de buitenhuid, 0,5 cm onder een kaplaag); een onderdeel dat zijdelings meer dan 2 mm door de huid steekt; ankerfouten uit `tools/anchors.json` (namen, volgorde van de wortel, kinderen van Onderstel, `contains`, de 13 `openers` en de 29 `preset_ids`); presetfouten uit `checkPresets()`.

De grenzen volgen de constanten in `src/body.js`. Zolang die niet op de externe maten staan, bewijst een groene integriteitstoets niet dat de maten kloppen; dat doet `tools/maat.py`. Stand na golf 1: `0 fouten, 0 ankerfouten, 0 waarschuwingen, 0 presetfouten` (230 knopen, 178 onderdelen).

### `python3 tools/silhouette.py`

Meet de gemonteerde carrosserie met stralen en vergelijkt met `data/silhouet.json`: bovenlijn in zijaanzicht (`top`), halve breedte in bovenaanzicht (`plan`) en raamlijn (`belt`), met de toleranties `tolAs` en `tolOverhang`, `maxBuiten` en de grenzen `neusMax` en `staartMax` uit hetzelfde bestand. Spiegels, antenne, wissers en grepen tellen niet mee.

Sinds golf 1 komt `data/silhouet.json` uit de maattekening van de brochure (blad 25). Die tekening is niet op schaal; zij- en bovenaanzicht zijn genormaliseerd op lengte 3.922, hoogte 1.498 en breedte 1.774 mm, met een eigen schaal per richting (label "brochure, genormaliseerd"). Tolerantie 30 mm, `maxBuiten` 0. Methode en elk getal: [onderzoek/exterieur-maten.md](onderzoek/exterieur-maten.md). Het bestand ligt na golf 1 vast; wijzigen alleen met toestemming van de eigenaar. Op versie 1 is de toets rood tot golf 2.

### `python3 tools/itest.py`

Bestaat nog niet. In laguna3 is het de interactietest (klikregel, duiken, inklappen, presets, labels, openmodus, telefoon, toetsenbord). Het bestand staat onder `auto` in `framework.json`, omdat het onderdelen bij naam noemt. Zolang het ontbreekt, is nightly rood.

### `python3 tools/opentest.py [--only namen] [--out map] [--strikt-min]`

Toetst elke opener van de modus Openen (13 in versie 1). Met `--strikt-min` is een leider zonder `open.min`, of met een `min` onder 0,8 maal de volle hoek of slag, een fout. Per opener: eindstand, ondergrens, botsing langs de beweging (uitzonderingen in `tools/open_allow.json`, nu leeg), blootleggen (0 treffers op verborgen knopen, hoogstens 2 % stralen in het niets), prestaties met alles open, en de spookbatchproef. Tot golf 2 eindigt `python3 tools/opentest.py` met `opentest klaar in 11 s: 23 fouten, 0 meldingen`: botsing en blootleggen bij 12 van de 13 openers, alle behalve de Laadklep (oude carrosserie).

### `python3 tools/pubsmoke.py`

Publicatierooktest. Laadt de kale CDN-pagina (`build.py --bare`) in het geraamte van de artefacthost en `index.html` zoals GitHub Pages het serveert. Controleert: geen console- of paginafouten, `__model` klaar binnen de grens, `THREE.REVISION` 147, het blok `#pn` als het er is, de stijlregels van het canvas voor touch, geen horizontale scroll op 1280 × 800 en 390 × 844, standaardmodus en 390 px schermbreedte op de telefoon, en via `curl` dat elk CDN-bestand gelijk is aan het lokale pakket.

### `python3 tools/pncheck.py [--tree] [--update]`

Herbouwt `src/partnumbers.js` en `docs/onderdeelnummers.csv` uit `data/pn/` en vergelijkt byte voor byte. Met `--tree` vergelijkt hij ook `data/tree.json` met de boom van de pagina; `--tree --update` schrijft `data/tree.json` opnieuw. In versie 1 is `data/pn/` leeg.

### `python3 tools/tri.py [--gate] [--json UIT.json]`

Telt driehoeken per hoofdgroep (met het aantal onderdelen per groep) en toont de 25 zwaarste onderdelen. Met `--gate` faalt hij boven de budgetten in `tools/anchors.json` (nu alleen een totaal van 700.000). Een ondergrens op het aantal onderdelen bewaakt hij niet; zie `tools/maat.py --diepte`.

### `python3 tools/maat.py [--diepte] [--zelftest]`

Maatpoort van deze auto (extra test `maat` in `auto.json`; `finaltests.sh` draait hem als derde reeks via `framework.py extra maat`). Meet de gemonteerde auto en vergelijkt met de opgegeven maten van Renault: lengte, breedte zonder spiegels (1.764 tot 1.818 mm, zie de bronlijst over 1.774 en 1.808), hoogte, wielbasis, spoor voor en achter, overhang voor en achter, breedte met spiegels, en per wiel de band 0 tot 45 mm binnen de huid. Antenne, ruitenwissers en grepen tellen niet mee, net als in `silhouette.py`; zichtbaarheid geldt voor de hele keten van ouders. `--diepte` maakt de minima uit `data/diepte.json` tot poort (doel golf 5; niet in CI en niet in `finaltests.sh`). `--zelftest` toetst zonder browser elke grens naar beide kanten, ook de inzet per wiel en de diepte met en zonder `--diepte`. Rood tot golf 2. Grenzen en afwegingen: [onderzoek/exterieur-maten.md](onderzoek/exterieur-maten.md).

### `python3 tools/visdiff.py BEELDMAP BASISMAP`

Visuele regressie tegen een basislijn in `docs/baseline/`. Die basislijn bestaat hier nog niet. Software-rendering verschilt per platform; een basislijn hoort bij een auto en bij een platform (`VISDIFF_BASIS` bij `finaltests.sh` kiest een andere).

### `python3 tools/anchorcheck.py [--json UIT.json] [--basis BASIS.json]`

Labelankers per preset: ligt het anker op het eigen onderdeel en heeft het een vrije zichtlijn. Met `--basis` is hij rood als een van beide totalen daalt. Zonder basis is hij informatie.

### `python3 tools/ui_inner.py [--open] [--strict]`

Controleert vanuit minstens 200 richtingen rond de auto en rond elke hoofdgroep of een `inner`-knoop de eerste treffer van buitenaf is. Met `--open` met alle openers open.

### `python3 tools/shot.py MAP 'JSON'`

Screenshots en `eval`-stappen per viewport. Breder dan 700 pixels is desktop, smaller is touch. Stappen: `eval:`, `wait:`, `click:`, `shot:`. Geeft altijd 0.

### `tools/orkestratie/finaltests.sh UITVOERMAP`

Draait de volledige set in drie parallelle reeksen: lint, smoke, integrity, silhouette, `ui_inner --open --strict`, `opentest --strikt-min`; itest met poorten, `tri --gate`, pubsmoke, stats, presetshots, visdiff, anchorcheck; en de extra tests uit `extraTests` in `auto.json` (zie [framework.md](framework.md)). r5 heeft één extra test, `maat` (`tools/maat.py`). In deze repo is de set rood zolang itest en `docs/baseline/` ontbreken, en tot golf 2 ook bij silhouette, opentest en maat.

## Hulpmiddelen in `tools/orkestratie/`

| Script | Wat het doet |
|---|---|
| `pick.py` | Draait een voorbereiding en noemt per schermpunt het pad van het onderdeel dat er ligt. |
| `probe.py` | Draait een JS-expressie op de pagina en drukt het resultaat als JSON af. |
| `shots.py` | Gerichte opnames in de modus Openen. |
| `phone.py` | Twee telefoonbeelden (390 × 844) en de scrollbreedte. |
| `presetshots.py`, `docshots.py` | Beelden van alle presets, en de beelden in `docs/screenshots` (lijst `docshots` in `auto.json`). |
| `dumptree.py` | De hele boom als JSON. |
| `clash.py KNOOP...` | Doordringing en kleinste afstand van knopen tegen het hele model. |
| `huid.py --bewaar` en `--vergelijk` | Legt de huid van een knoop vast en meet later de afwijking. |
| `stats.py`, `cijfers.py` | Telgegevens en een samenvatting voor de docs. |

## Bevroren testcontract

De tests spreken de pagina aan via `window.__model` en op een aantal plekken via interne namen van de app (globale functies en variabelen uit `src/*.js`), en via element-id's in `src/head.html`. Die namen zijn een contract van de generieke laag; ze veranderen alleen in laguna3. De lijst per script staat in `docs/testen.md` van laguna3, sectie Bevroren testcontract.

De renderlus staat stil in rust. Wie camera of scène via interne namen wijzigt, roept daarna `requestRender()` aan; zonder die aanroep meet een test een oud beeld.
