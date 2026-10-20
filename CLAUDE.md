# r5: afspraken voor wie hier bouwt

Interactieve 3D-explosietekening van een Renault 5 E-Tech electric (modeljaar 2026/2027, vernieuwd augustus 2026; Techno Comfort Range, motor 6AK) in three.js r147. Alle geometrie
staat in code; `build.py` plakt `src/head.html` en `src/*.js` (volgorde `ORDER`) tot één `index.html`. Nederlands is de
taal van code-commentaar, beschrijvingen, docs en commits. Geen gedachtestreep in tekst.

Dit is versie 1 op het framework van laguna3. Versie 1 is grof: vlakke panelen en verkeerde hoofdmaten. De herbouw loopt in golven (golf 0 tot en met 5); golf 0 maakte de docs waar, golf 1 zette silhouet en maatpoort op externe maten. De generieke laag is byte voor byte gelijk aan laguna3 `6192326` (`FRAMEWORK`, `framework.json`). De auto staat in de bestanden onder `auto` in dat manifest. Zie `docs/contract.md` en `docs/specificaties-en-bronnen.md`.

## Bouwen en testen

- `bash tools/setup.sh` maakt een verse omgeving klaar (Playwright uit `requirements.txt`, three.js 0.147.0 met hashcontrole).
- `python3 build.py --lint` voor elke commit; `python3 build.py` herbouwt `index.html` (gecommit, hoort bij `src/`).
- Stand na golf 2 (gemeten 20 oktober 2026): lint, `framework.py check`, rooktest, integriteit (0 fouten), `tri.py --gate`, `pncheck.py`, `silhouette.py` (`SILHOUET OK`), `tools/maat.py` (`MATEN OK`), `opentest.py --strikt-min` (0 fouten, 0 meldingen) en `ui_inner.py --open --strict` zijn groen. De rode set van versie 1 (silhouette, maat, opentest) is groen. Zie Bekende ruis voor wat nog rood is.
- De volledige set `tools/orkestratie/finaltests.sh` vraagt ook itest, opentest, ui_inner, visdiff en anchorcheck, en draait als derde reeks de extra test `maat` (`extraTests` in `auto.json`). `tools/itest.py` en `docs/baseline/` bestaan nog niet; niet doen alsof die set groen is.
- Budgetten staan in `tools/anchors.json`; `tools/tri.py --gate` bewaakt het totaal.
- Een melding van de gebruiker eerst narekenen met `tools/orkestratie/pick.py`, `probe.py` of stralen; dan pas wijzigen.

## Eigendom en contracten

- Eén bestand per domein: carrosserie (`body.js`, `bodyparts.js`, `panorama.js`), motor (`engine1-3.js`), aandrijving
  (`drivetrain.js`), onderstel (`chassis.js`), interieur (`interior.js`), systemen (`systems.js`), app (`core.js`,
  `app1.js`, `presetdata.js`, `presets.js`, `app2-panel.js`, `app2-controls.js`, `app2-labels.js`, `app2-input.js`,
  `app2-loop.js`, `head.html`). Voorvoegsels per eigenaar voor functies, materialen en cachesleutels.
- `panorama.js` blijft staan en leeg: deze uitvoering heeft geen schuifdak. `auto.json` heeft `"cockpit": null`: geen modus Cockpit.
- Knopen: `A(naam, opties, kinderen)` en `P(naam, geometrie, materiaal, opties)` met verplicht `d` (Nederlandse
  beschrijving), `spec` alleen voor feiten met een bron in `docs/specificaties-en-bronnen.md`, in Nederlandse notatie, `ex` als uitklapvector, `inner` alleen
  voor wat van buiten nooit te zien is, `hideWhen` voor wat uitgenomen is zolang een opener open staat. Openers hebben
  altijd `open.min` van minstens 0,8 maal de volle hoek of slag.
- `src/partnumbers.js` en `docs/onderdeelnummers.csv` komen uit `data/pn/` via `tools/orkestratie/build_pn.py`; niet met de hand. `python3 tools/pncheck.py` bewaakt dat. Versie 1 heeft nog geen nummers.
- Het chassisnummer en het kenteken van de gebruiker komen nooit in de repo, de pagina of een commitbericht.
- Feiten en bronnen: `docs/specificaties-en-bronnen.md`. Geen tweede lijst met afwijkende getallen. Elke `spec` heeft daar een URL.
- Beeldmerken niet natekenen: geen Renault-ruit en geen letters RENAULT. Bewuste uitzondering (besluit van de eigenaar, golf 0): de verlichte '5' op de motorkap wordt getekend, als lamp die de laadstand toont.
- Referentiebeelden: foto's van Wikimedia Commons met CC BY-SA 4.0 mogen in `docs/onderzoek/beelden/`, met auteur, licentie en URL in `docs/onderzoek/bronnen.md`. Het beeld uit de Renault-brochure komt niet in de repo; alleen de URL en de gemeten getallen.

## Klaar

Een golf is klaar als alles hieronder waar is:

- Vanaf golf 2 alle poorten groen tegen externe maten: `data/silhouet.json` (zij- en bovenaanzicht van de brochure, genormaliseerd op 3.922, 1.498 en 1.774 mm, tolerantie 30 mm; `docs/onderzoek/exterieur-maten.md`) en de maatpoort `tools/maat.py`. Golf 1 heeft ze gemaakt; op versie 1 zijn ze bewust rood.
- Diepte: de minima per hoofdgroep staan in `data/diepte.json` (factor 5 op versie 1). Ze zijn alleen een poort met `python3 tools/maat.py --diepte`, het doel van golf 5; CI en `finaltests.sh` toetsen ze niet.
- Na golf 1 liggen de testbestanden `data/silhouet.json`, `tools/maat.py`, `data/diepte.json` en `tools/anchors.json` vast. Wijzigen kan alleen met toestemming van de eigenaar.
- Visueel oordeel "pass" op drie aanzichten: 3/4 voor, zij en achter.
- Geen `spec` en geen feit in de docs zonder bron.
- `git diff --stat` toont geen leeg of afgekapt bestand.
- Voor een push vanaf golf 2: `opentest.py` zonder fouten, en `pubsmoke.py` en de telefooncontrole (`tools/orkestratie/phone.py`) schoon. Voor golf 2 mag alleen de bekende rode set onder Bekende ruis rood zijn, met die meldingen en niet meer.

Nog niet klaar na golf 1: een carrosserie op de externe maten (golf 2), onderdeelnummers, visdiff-basislijn, itest, de diepte (golf 5).

## Bekende ruis

Meldingen die nu geen nieuwe fout zijn:

- Nightly faalt bij de stap itest met `python3: can't open file '.../tools/itest.py': [Errno 2] No such file or directory`. Dit blijft rood tot `tools/itest.py` en `docs/baseline/` bestaan. `nightly.yml` is generiek en wordt niet bewerkt (besluit van de eigenaar).
- `python3 tools/pubsmoke.py` eindigt met `PUBLICATIEROOKTEST NIET OK:` en per beeld `nummergegevens in #pn onleesbaar of leeg (0)`. Oorzaak: `data/pn/` heeft nog geen onderdeelnummers (versie 1 heeft er geen). Elke andere pubsmoke-regel moet schoon zijn. Een regel `GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` is een melding van Chromium op de GPU van macOS, geen fout van de pagina.
- De rode set van versie 1 (opentest 23 fouten, `SILHOUET NIET OK`, `MATEN NIET OK`) is sinds golf 2 groen. Rood daar is weer een echte fout.

## Werkwijze

- Elke golf wordt gecommit en naar `main` gepusht als zijn eigen poorten groen zijn; GitHub Pages zet hem dan live. Golf 1 is de uitzondering: die levert toetsen die per ontwerp rood staan tot golf 2 (zie Bekende ruis).
- `VERSION` is het versienummer van de volgende publicatie; `build.py` zet nummer plus inhoudshash in de pagina.
- Framework: generieke bestanden (`framework.json`, `generiek`) bevatten geen autonaam en worden hier niet bewerkt, ook `docs/framework.md` en `docs/sjabloon-contract.md` niet. Wat per auto verschilt, staat in `auto.json` en de autobestanden. `python3 tools/framework.py check` na elke wijziging die de generieke laag zou kunnen raken. Een generieke verbetering ontstaat in de referentie (laguna3) en komt met `framework.py` hierheen, niet andersom.
- Volledige uitleg van de app: `docs/framework.md`, `docs/ontwerp-en-architectuur.md`, `docs/testen.md`.
