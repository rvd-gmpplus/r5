# Wijzigingen

## Golf 1 (nog niet gepubliceerd)

Externe toetsen in plaats van zelfmeting. Ze staan bewust rood op het model van versie 1; golf 2 maakt ze groen.

- Nieuw `tools/maat.py` (extra test `maat`): lengte, breedte, hoogte, wielbasis, spoor, overhang, spiegels en de stand van de banden in de wielkast, elk met onder- en bovengrens; `--zelftest` zonder browser.
- `data/silhouet.json` uit de zijkant en het bovenaanzicht van de brochure, genormaliseerd op 3922 en 1498 mm (de tekening is niet op schaal), tolerantie 30 mm.
- `data/diepte.json`: diepteminima per hoofdgroep (factor 5 op versie 1), poort met `python3 tools/maat.py --diepte` als doel van golf 5.
- Meetverslag in `docs/onderzoek/exterieur-maten.md`.

## Golf 0 (nog niet gepubliceerd)

Begin van de herbouw in golven (golf 0 tot en met 5). Golf 0 maakt de docs waar en r5-eigen; de pagina verandert niet.

- Generieke laag gelijkgetrokken met laguna3 `6192326` (`FRAMEWORK`); `auto.json` kreeg `"cockpit": null` (geen modus Cockpit).
- Feiten gecorrigeerd met bron: motor 6AK met gewikkelde rotor (110 kW, 245 Nm), batterij 52 kWh netto en 55 kWh bruto, laadklep in het linker voorscherm, verlichte '5' op de kap, multilink en schijven 280 mm achter, koplampen met pupilvorm, maten uit de brochure, WLTP 430 km sinds 25 augustus 2026.
- `docs/specificaties-en-bronnen.md` is de enige lijst met feiten, elk met een URL; nieuw `docs/onderzoek/bronnen.md` met een sectie Beelden.
- `CLAUDE.md`: nieuwe exitcriteria (externe maten, visueel oordeel in drie aanzichten, geen spec zonder bron), sectie Bekende ruis, besluiten van de eigenaar, `bash tools/setup.sh`.
- `docs/testen.md`, `docs/ontwerp-en-architectuur.md` en `docs/telefoontest.md` ontdaan van Laguna-inhoud.
- `docs/onderzoek/stand-v1.md`: audit van 20 oktober 2026.

Nog in de code (volgende golven): laadklep op de kap, trommels en torsieas achter, spoor 1,28 m, de teksten "fremderregte" en "vierkante koplamp".

## 1

Eerste publicatie. Framework van laguna3, auto eigen werk.

- Carrosserie: vijfdeurs hatchback uit panelen (rechte flanken, ronde wielkasten, vlakke kap), Pop-geel, zwart dak, vierkante koplampen, staande achterlichten, laadklep links op de motorkap.
- Aandrijflijn: motor 6AK (110 kW), reductie met één verhouding, omvormer, twee aandrijfassen.
- Onderstel: McPherson voor, torsieas achter, banden 195/55 R18, schijven voor en trommels achter.
- Interieur: OpenR (twee schermen), stuur links, vijf zitplaatsen.
- Systemen: radiateur, ventilator en warmtepomp; onderbodemplaten in plaats van een uitlaat; CCS, boordlader 11 kW; batterij 52 kWh onder de vloer.
- Openen: kap, laadklep, vier portieren, vier zijruiten, twee spiegels, achterklep.
- Presets en een rondleiding. Onderdeelnummers nog niet onderzocht (lege `data/pn`, boom wel in de CSV).

Niet in versie 1: catalogusnummers, fotometing van het silhouet, visdiff-basislijn, de diepte van laguna3.
