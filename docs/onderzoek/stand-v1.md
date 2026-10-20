# Stand versie 1

Versie 1 is door Grok gebouwd op het framework van laguna3. Bij versie 1 stond de generieke laag op laguna3 `3216616` en liep ze achter op de referentie. Sinds golf 0 is ze weer byte voor byte gelijk aan laguna3 `6192326` (`FRAMEWORK`; `python3 tools/framework.py check`: 49 generieke bestanden, ok). De auto is eigen werk.

De huid is een loft van vlakke panelen, geen meting. Het silhouetbestand `data/silhouet.json` is aan die huid gemeten en is dus geen externe referentie.

## Audit 20 oktober 2026

Wat er mis is in versie 1:

- Vorm: de carrosserie bestaat uit vlakke panelen met rechte flanken. Ze leest niet als een Renault 5.
- Maten (gemeten met `tools/maat.py` in golf 1; de lijst staat in [../specificaties-en-bronnen.md](../specificaties-en-bronnen.md), sectie Wat het model nog niet volgt): lengte 3,821 m, breedte 1,764 m zonder spiegels en grepen, hoogte 1,418 m, spoor 1,28 m, overhang 719 en 562 mm, met spiegels 1,940 m. Extern is dat 3,922 m, 1,774 m tussen de spatborden, 1,498 m, spoor 1,548 en 1,532 m, overhang 749 en 633 mm en 2,020 m.
- Poorten die zichzelf meten: `data/silhouet.json` is gemeten aan het model, dus `silhouette.py` is altijd groen. De grenzen van `integrity.py` volgen de constanten in `body.js`, niet een externe bron. "Groen" was daardoor geen bewijs van kwaliteit.
- Feiten die niet kloppen:
  - Laadklep op de motorkap. Hij zit in het linker voorscherm; op de kap zit de verlichte '5'.
  - Torsieas en trommels achter. Het is een multilink met schijven van 280 mm.
  - "Vierkante koplampen". De koplampen zijn smal met een pupilvorm; de afgeronde vierkanten zitten in de bumper.
  - "Fremderregte" motor: Duits voor een synchroonmotor met gewikkelde rotor (extern bekrachtigd).
  - WLTP-bron met de datum 16 oktober 2026. De update met 430 km is van 25 augustus 2026 en noemt geen "gladde onderbodem", wel aerodynamica aan de onderzijde en de spiegels.
  - Een tweede lijst met maten in `contract.md` die afweek van de bronlijst.
- Ontbrekend: `tools/itest.py`, `docs/baseline/`, onderdeelnummers, de diepte van laguna3.

De juiste feiten met bronnen staan in [../specificaties-en-bronnen.md](../specificaties-en-bronnen.md). De herbouw in golven staat in [../contract.md](../contract.md).

## Open punten

- Externe maten en silhouet: gemaakt in golf 1 (`tools/maat.py`, `data/silhouet.json`), rood op versie 1 tot golf 2.
- Een nieuwe carrosserie die die maten haalt (golf 2).
- Laadklep naar het linker voorscherm (golf 3).
- Onderdeelnummers. De boom staat wel in `docs/onderdeelnummers.csv`, elk pad als niet onderzocht.
- Visuele poort en de interactietest. Die vragen een basislijn die deze auto nog niet heeft.

De Five met LFP-batterij hoort niet in dit model.
