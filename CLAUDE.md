# r5: afspraken voor wie hier bouwt

Interactieve 3D-explosietekening van een Renault 5 E-Tech electric (modeljaar 2026, Techno Comfort Range, motor 6AK) in three.js r147. Alle geometrie
staat in code; `build.py` plakt `src/head.html` en `src/*.js` (volgorde `ORDER`) tot één `index.html`. Nederlands is de
taal van code-commentaar, beschrijvingen, docs en commits. Geen gedachtestreep in tekst.

Dit is versie 1 op het framework van laguna3. De generieke laag blijft byte voor byte gelijk (`framework.json`). De auto staat in de bestanden onder `auto` in dat manifest. Zie `docs/contract.md` en `docs/specificaties-en-bronnen.md`.

## Bouwen en testen

- `tools/setup.sh` maakt een verse omgeving klaar (Playwright uit `requirements.txt`, three.js 0.147.0 met hashcontrole).
- `python3 build.py --lint` voor elke commit; `python3 build.py` herbouwt `index.html` (gecommit, hoort bij `src/`).
- Versie 1 is groen op lint, `framework.py check`, rooktest, integriteit, silhouet, `tri.py --gate` en `pncheck.py`.
- De volledige set `tools/orkestratie/finaltests.sh` vraagt ook itest, opentest, ui_inner en visdiff. Die basislijn is er nog niet; niet doen alsof die set groen is.
- Budgetten staan in `tools/anchors.json`; `tools/tri.py --gate` bewaakt het totaal.
- Een melding van de gebruiker eerst narekenen met `tools/orkestratie/pick.py`, `probe.py` of stralen; dan pas wijzigen.

## Eigendom en contracten

- Eén bestand per domein: carrosserie (`body.js`, `bodyparts.js`, `panorama.js`), motor (`engine1-3.js`), aandrijving
  (`drivetrain.js`), onderstel (`chassis.js`), interieur (`interior.js`), systemen (`systems.js`), app (`core.js`,
  `app1.js`, `presetdata.js`, `presets.js`, `app2-panel.js`, `app2-controls.js`, `app2-labels.js`, `app2-input.js`,
  `app2-loop.js`, `head.html`). Voorvoegsels per eigenaar voor functies, materialen en cachesleutels.
- `panorama.js` blijft staan en leeg: deze uitvoering heeft geen schuifdak.
- Knopen: `A(naam, opties, kinderen)` en `P(naam, geometrie, materiaal, opties)` met verplicht `d` (Nederlandse
  beschrijving), `spec` alleen voor geverifieerde feiten in Nederlandse notatie, `ex` als uitklapvector, `inner` alleen
  voor wat van buiten nooit te zien is, `hideWhen` voor wat uitgenomen is zolang een opener open staat. Openers hebben
  altijd `open.min` van minstens 0,8 maal de volle hoek of slag.
- `src/partnumbers.js` en `docs/onderdeelnummers.csv` komen uit `data/pn/` via `tools/orkestratie/build_pn.py`; niet met de hand. `python3 tools/pncheck.py` bewaakt dat. Versie 1 heeft nog geen nummers.
- Het chassisnummer en het kenteken van de gebruiker komen nooit in de repo, de pagina of een commitbericht.
- Feiten en bronnen: `docs/specificaties-en-bronnen.md`. Geen tweede lijst met afwijkende getallen.

## Klaar

- Klaar voor versie 1: de tests hierboven groen, en een gemonteerde auto die als Renault 5 E-Tech leest (geel, zwart dak, vierkante koplampen, laadklep op de kap).
- Niet klaar: fotometing, onderdeelnummers, visdiff, de diepte van laguna3.

## Werkwijze

- `VERSION` is het versienummer van de volgende publicatie; `build.py` zet nummer plus inhoudshash in de pagina.
- Framework: generieke bestanden (`framework.json`) bevatten geen autonaam; wat per auto verschilt, staat in `auto.json` en de autobestanden. `python3 tools/framework.py check` na elke wijziging die de generieke laag zou kunnen raken. Een generieke verbetering ontstaat in de referentie (laguna3) en komt met `framework.py` hierheen, niet andersom zolang deze repo de generieke laag niet bezit.
- Volledige uitleg van de app: `docs/framework.md`, `docs/ontwerp-en-architectuur.md`, `docs/testen.md`.
