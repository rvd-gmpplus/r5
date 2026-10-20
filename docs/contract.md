# Bouwcontract Renault 5 E-Tech

Afgeleid van [docs/sjabloon-contract.md](sjabloon-contract.md). De architectuur van de app staat in [docs/ontwerp-en-architectuur.md](ontwerp-en-architectuur.md) en verandert per auto niet.

## 1. De auto

| Onderwerp | Keuze | Bron |
|---|---|---|
| Model en fase | Renault 5 E-Tech electric, modeljaar 2026 | docs/specificaties-en-bronnen.md |
| Uitvoering | Techno Comfort Range | idem |
| Lak | Pop-geel, zwart dak | uitvoering van dit model |
| Wielen en banden | 195/55 R18 | idem |
| Motor | 6AK, fremderregte synchroonmotor, 110 kW, één verhouding | idem |
| Bijzonderheden | laadklep op de motorkap links, geen uitlaat, geen panoramadak, geen beeldmerk | idem |

Kenteken en chassisnummer van de eigenaar komen nooit in de repo, de pagina of een commitbericht.

## 2. Assen en hoofdmaten

Meter. x links, y omhoog vanaf de grond, z naar voren. De auto is in de lengte gecentreerd. Symbolen in `src/body.js`.

| Symbool | Waarde | Herkomst |
|---|---|---|
| `ZF`, `ZR` | 1,961 en -1,961 | lengte 3.922 mm |
| `AXF`, `AXR` | 1,212 en -1,328 | wielbasis 2.540 mm, overhang zoals in de spec-doc |
| `AY` | 0,336 | straal 195/55 R18 |
| `BOD_WMAX` | 0,904 | testomhullende, zie de spec-doc |
| `BOD_MIRW` | 1,010 | 2.020 mm met spiegels |
| `BOD_H` | 1,498 | hoogte |
| `HW`, `YB`, `YT`, `surfX` | huid | `body.js` |

Er is geen `TRACK_F` / `TRACK_R`. Het halve spoor in `chassis.js` heet `CHS_TRACK` en is 0,64.

## 3. Motorframe

Geen krukasframe. De motor staat dwars in het autocoördinaat. Het motorhuis staat op y 0,46 en z 1,38. Er zijn geen `fromPT` / `ENG2CAR` in versie 1.

## 4. Motorkap

`bodHoodY` in `body.js`. `integrity.py` eist 2,5 cm onder de buitenhuid en 0,5 cm onder een kaplaag. De motor, de omvormer en het laadcontact blijven daaronder.

## 5. Aansluitpunten

Geen `ENG_PORTS` of `DRV_PORTS` in versie 1. De aandrijfassen komen uit `drivetrain.js` en eindigen op het spoor.

## 6. Namen

Wortel `Renault 5 E-Tech`. Acht kinderen in de frameworkvolgorde. Onderstel: Vooras en stuurinrichting, Achteras, Wielen, Remsysteem. Motor: `Motor 6AK`. Kap: `Motorkap`. De lijst die de test leest staat in `tools/anchors.json`.

## 7. Eigendom en voorvoegsels

Zoals het sjabloon. `panorama.js` blijft leeg: deze uitvoering heeft geen schuifdak. `bodyparts.js` heeft in versie 1 geen eigen delen.

## 8. Budgetten

`tools/anchors.json`: totaal 700.000 driehoeken. Versie 1 zit daar ver onder (`tri.py --gate`).

## 9. Openers

| Opener | Type | Hoek of slag | min |
|---|---|---|---|
| Motorkap | scharnier, as x, negatief | 1,13 rad | 0,82 maal |
| Laadklep | scharnier, as x, negatief | 1,20 rad | 0,82 maal |
| Portier linksvoor / rechtsvoor | scharnier, as y | 1,17 rad, teken per zijde | 0,82 maal |
| Portier linksachter / rechtsachter | scharnier, as y | 1,05 rad | 0,82 maal |
| Zijruiten | schuif omlaag 0,36 m | | 0,82 maal de slag |
| Spiegels | scharnier, as y | 1,15 rad | 0,82 maal |
| Achterklep | scharnier, as x, positief | 1,15 rad | 0,82 maal |

Geen `hideWhen` en geen volgers in versie 1. `tools/open_allow.json` is het lege sjabloon.

## 10. Regels

`d` verplicht. `spec` alleen voor de feiten in de spec-doc. `inner` voor wat dicht niet zichtbaar is. Openers hebben `open.min` van minstens 0,8 maal de volle hoek of slag.
