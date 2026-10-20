# Overdracht herbouw r5

Stand op 20 oktober 2026, 22:40. Doel van dit bestand: morgen zonder zoeken verder kunnen.

## Waar alles staat

- Repo: `~/Library/CloudStorage/OneDrive-Persoonlijk(2)/Documenten/GitHub/r5` (ook bereikbaar via de symlink `~/Documents/GitHub/r5`). De eigenaar houdt de repo bewust in OneDrive.
- Werkmap met alle tussenresultaten (scratchpad): `~/Documents/GitHub/lag3_r5_scratchpad/`. Daarin:
  - `laguna3/`: de referentie, vastgezet op `6192326`. Niet opnieuw exporteren in deze herbouw.
  - `img1/`: CC BY-SA-foto's van Wikimedia Commons (3/4 voor en achter), referentie voor het oog.
  - `brochure/`, `brochure_png/`: de maattekening uit de Renault-brochure, alleen werkmateriaal, niet in de repo.
  - `golf2-shots-r2/`, `g2/r2d/`: renders van golf 2 (voor34, zij, achter, achter34, voor, zij-ortho, overlay-zij en close-ups).
  - `judge2/`: renders van de visuele beoordelaar.
  - `slot-golf1.sha256`: de hashes van de vergrendelde toetsbestanden.
- Live pagina: https://rvd-gmpplus.github.io/r5/ (GitHub Pages vanaf `main`, map `/`).

## Status per golf

| Golf | Inhoud | Stand | Commit |
|---|---|---|---|
| 0 | Generieke laag gelijk met laguna3 `6192326`, docs waar gemaakt, Bekende ruis | klaar, live | `9b3f5d6`, `60c9662` |
| 1 | Externe toetsen: `tools/maat.py`, silhouet uit de brochure (genormaliseerd), `data/diepte.json` | klaar, live | `60c9662` |
| 2 | Carrosserie op een gelofte huid, maten en spoor juist | klaar op het rondeplafond, live | `fefaf9e` |
| 3 | R5-kenmerken en restpunten van golf 2 | niet begonnen | |
| 4 | Onderstel en feiten | niet begonnen | |
| 5 | Diepte interieur, aandrijving, batterij | niet begonnen | |

Golf 2 in getallen: 257 knopen, 205 onderdelen, 85.116 driehoeken. Lengte 3929, breedte 1774, hoogte 1498, spoor 1548/1532, spiegels 2016 mm.

Groen na golf 2 (exitcode 0): lint, build, `framework.py check`, smoke, integrity (0 fouten), silhouette, maat, `tri.py --gate`, pncheck, `opentest --strikt-min` (0 fouten), `ui_inner --open --strict`, phone, huid. Bekend rood: pubsmoke (alleen `nummergegevens in #pn onleesbaar of leeg (0)`), nightly (itest ontbreekt), CI-stap silhouette was rood op golf 1 en hoort nu groen te zijn (controleren bij start).

## Besluiten van de eigenaar (gelden door)

- Scope golf 0 tot en met 5. Elke golf met groene poorten gaat naar `main` (live).
- De verlichte '5' op de kap wordt als lamp getekend (uitzondering op "geen beeldmerken"). Ruit en letters RENAULT blijven weg.
- CC BY-SA-foto's mogen in de repo onder `docs/onderzoek/beelden/` met naamsvermelding in `docs/onderzoek/bronnen.md`. Het brochurebeeld niet.
- Nightly blijft rood tot `tools/itest.py` en `docs/baseline/` bestaan; `nightly.yml` is generiek en wordt niet bewerkt.
- Diepte golf 5: factor 5 per hoofdgroep (`data/diepte.json`, poort met `python3 tools/maat.py --diepte`).
- Silhouet: brochure-zijkant genormaliseerd op 3922 en 1498 mm, tolerantie 30 mm (de tekening is niet op schaal).
- Rondeplafond per golf: max 3 reparatierondes en 2 rondes van de visuele beoordelaar. Wat dan niet af is, gaat door naar de volgende golf.

## Vergrendelde toetsbestanden

Na golf 1 vast. Een wijziging vraagt een besluit van de eigenaar. Controle: `shasum -a 256 -c ~/Documents/GitHub/lag3_r5_scratchpad/slot-golf1.sha256` in de repowortel.

```
9476b53467ceed52f4d811f0514be8507ee3b910aa5f3fb9d7313a3e892f2bb5  data/silhouet.json
9a05d203832bd2528748096c0f7c3f378f355f0841cae887fbb56e715a923e17  tools/maat.py
bc15c5df2d177704538bfc314f14d69c06f6f35be3910f12dbfc0f5ba0a464e7  data/diepte.json
94231b60139402029ecd83442974ed6bc42e8b01e03e19dbd85e6a2750bb86c2  tools/anchors.json
```

Uitzondering in golf 3: als de Laadklep van `Motorkap/Laadklep` naar het linker voorscherm gaat, moeten de openers en `contains` in `tools/anchors.json` mee. Dat is de enige toegestane wijziging, in dezelfde commit als de verplaatsing, en daarna nieuwe hashes vastleggen.

## Open punten voor golf 3 (gerangschikt)

Restpunten uit het visuele oordeel van golf 2 (ronde 2, oordeel bijsturen op het plafond):

1. C-stijl: schuine vouw van de raamhoek naar de heup (bij z -1,6). Opnieuw opbouwen als één glad vlak.
2. Wielkastranden lezen als ronde zwarte buizen. Vervangen door een vlakke flare met scherpe rand (Turbo-stijl), met zwarte nerfstructuur.
3. Dakrand achter: kier bij de bovenhoek boven de klep; overhang zoals de echte daklip (`img1/r5_DSC_7171.jpg`).
4. Oranje laadkabel zichtbaar in de voorste wielkast; grijze lipjes aan de dorpeluiteinden.
5. Neus nog zacht: kapvoorrand en neus scherper, samen met het werk aan de neusband.
6. Achterruit kleiner; zwart streepje op de C-stijl en een witte naadlijn langs de achterportierrand.

Kenmerken van de R5 (oorspronkelijk plan golf 3):

- Koplampen smal met pupilvorm, plus de twee afgeronde vierkanten in de bumper.
- Zwarte band over de neus.
- Verlichte '5' op de kap (lamp, zie besluiten).
- Laadklep naar het linker voorscherm, met openerpad, preset `openCharge`, `presetdata.js` en contract in één commit.
- Staande achterlichten met 3D-blade, zwarte band op de klep.
- Verborgen handgrepen achter in de C-stijl.
- 18 inch Techno-velgen met spaken (nu zwarte schijven).
- Zwarte dorpelbekleding met zilveren inzet.

## Golf 4 en 5

- Golf 4: multilink achter (nu torsieas), schijven 280 mm achter (nu trommels), pedalen (geen "Stuurpedaal"), teksten met bron. Ook de `d`-teksten met "fremderregte" en "vierkante koplamp" (`presetdata.js`, `systems.js`) en "MY26".
- Golf 5: interieur, motor (synchroonmotor met gewikkelde rotor), reductor, omvormer, batterij met 4 modules (52 kWh netto, 55 bruto) tot de minima van `data/diepte.json`.

## Werkwijze die werkte

- Router: bouwwerk aan de geometrie op Opus 5.5 high; docs met regels ook Opus high; review met cavecrew-reviewer op Sonnet 5.5 high; visuele beoordelaar op Opus high met de bestaande renders.
- Per golf: bouwer, dan zelf de poortset draaien (exitcodes, niet alleen de laatste regel), hashes controleren, `git diff --stat` op lege of afgekapte bestanden, review en beoordelaar parallel, één bijstuurronde naar dezelfde bouwer (via SendMessage, met behoud van context), commit, push.
- `tools/shot.py` heeft geen `--help`: een optie als eerste argument wordt een uitvoermap (`./--help/`). Altijd een uitvoermap in de scratchpad opgeven.
- Jina zat zonder quotum; Exa werkt.

## Morgen verder

1. `cd ~/Documents/GitHub/r5 && git pull && git status`: schone tree op `fefaf9e` of later verwacht.
2. `shasum -a 256 -c ~/Documents/GitHub/lag3_r5_scratchpad/slot-golf1.sha256`.
3. `gh run list -R rvd-gmpplus/r5 --limit 3`: CI op `fefaf9e` hoort groen te zijn.
4. Eigenaar bekijkt https://rvd-gmpplus.github.io/r5/ en `~/Documents/GitHub/lag3_r5_scratchpad/golf2-shots-r2/overlay-zij.png`: pass of bijsturen op de vorm (gepland moment voor het oordeel van de eigenaar na golf 2).
5. Start golf 3 met de lijst hierboven. Verwachting: 1,5 tot 2,5 uur, plus een volle ronde per bijsturing van de beoordelaar. Daarna golf 4 (ongeveer 45 minuten) en golf 5 (enkele uren voor factor 5). Die schatting is onzeker zolang de beoordelaar kan blijven bijsturen.
6. Deze sessie hervatten kan met `claude --resume` in de repomap; dit bestand is genoeg om ook vers te beginnen.
