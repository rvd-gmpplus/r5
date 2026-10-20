# Bouwcontract Renault 5 E-Tech

Afgeleid van [docs/sjabloon-contract.md](sjabloon-contract.md). De architectuur van de app staat in [docs/ontwerp-en-architectuur.md](ontwerp-en-architectuur.md) en verandert per auto niet. Feiten en bronnen staan alleen in [docs/specificaties-en-bronnen.md](specificaties-en-bronnen.md); dit contract noemt de getallen die de code nodig heeft.

Dit contract beschrijft de boom na golf 2 en wat de herbouw (golf 1 tot en met 5) eraan verandert. Wat gepland is, staat als gepland; namen van knopen die nog niet bestaan, liggen pas vast als de golf ze bouwt.

## 1. De auto

| Onderwerp | Keuze |
|---|---|
| Model en fase | Renault 5 E-Tech electric, modeljaar 2026/2027 (vernieuwd augustus 2026) |
| Uitvoering | Techno Comfort Range |
| Lak | Pop-geel, zwart dak |
| Wielen en banden | 18 inch Techno, 195/55 R18 |
| Motor | 6AK, synchroonmotor met gewikkelde rotor (extern bekrachtigd), 110 kW piek, 245 Nm, één verhouding |
| Batterij | 52 kWh netto, 400 V, 4 modules |
| Laadklep | AC en CCS in het linker voorscherm. Versie 1 heeft hem nog op de motorkap; golf 3 verplaatst hem. |
| Verlichte '5' | op de motorkap, als lamp voor de laadstand (bewuste uitzondering op "geen beeldmerk") |
| Bijzonderheden | geen uitlaat, geen panoramadak, geen Renault-ruit, geen letters RENAULT |

Kenteken en chassisnummer van de eigenaar komen nooit in de repo, de pagina of een commitbericht.

## 2. Assen en hoofdmaten

Meter. x links, y omhoog vanaf de grond, z naar voren. De auto is in de lengte gecentreerd. Symbolen in `src/body.js` en `src/chassis.js`.

| Symbool | Doel (extern) | Na golf 2 (versie 1 tussen haakjes) |
|---|---|---|
| `ZF`, `ZR` | 1,961 en -1,961 (lengte 3.922 mm) | gelijk; `tools/maat.py` meet 3,929 m, overhang 753 en 636 mm (versie 1: 3,821 m) |
| `AXF`, `AXR` | 1,212 en -1,328 (wielbasis 2.540 mm, overhang 749 en 633 mm) | gelijk |
| `AY` | 0,336 (straal 195/55 R18) | gelijk |
| `BOD_WMAX` | testgrens net boven de halve carrosseriebreedte 0,887 (1.774 mm; over 1.808 zie de bronlijst) | 0,909; `tools/maat.py` meet 1,774 m (versie 1: 0,904 en 1,764 m) |
| `BOD_MIRW` | 1,010 (2.020 mm met spiegels uit) | gelijk; `tools/maat.py` meet 2,016 m met spiegels (versie 1: 1,940 m) |
| `BOD_H` | 1,498 (hoogte) | 1,498; `tools/maat.py` meet 1,498 m (versie 1: 1,418 m) |
| halve spoor voor / achter | 0,774 en 0,766 (spoor 1.548 en 1.532 mm) | `CHS_TRACK_F` 0,774 en `CHS_TRACK_R` 0,766 in `chassis.js`, plus de eigen kopie `DRV_TRACK` 0,774 in `drivetrain.js` (laadt eerder dan `chassis.js`; houd ze gelijk); `tools/maat.py` meet 1.548 en 1.532 mm (versie 1: één waarde `CHS_TRACK` 0,64) |
| `HW`, `YB`, `YT`, `YD`, `YR`, `bodDP`, `surfX` | huid in `body.js` | geloft vlak: profielen met `bodPchip` over z, doorsnede `bodSec`/`bodHalf` met vier hoekpunten (`bodS1` tot `bodS4`) en schouderstraal `bodRS`, wielkastbogen (`bodARCH` 0,395, `bodArchS`, `bodFlareTop`), kas `bodGh` en de patchbouwers `bodPatch`, `bodGhSide`, `bodGhTop`, `bodCap`, `bodDeck`. Alle eigen namen in `body.js` en `bodyparts.js` dragen het voorvoegsel `bod`, behalve de frameworknamen `HW`, `YB`, `YT`, `YD`, `YR` en `surfX` (versie 1: loft van vlakke panelen) |

Golf 1 legde deze doelen vast in `data/silhouet.json` (zij- en bovenaanzicht van de brochure, genormaliseerd op 3.922, 1.498 en 1.774 mm, tolerantie 30 mm; zie `docs/onderzoek/exterieur-maten.md`) en in de maatpoort `tools/maat.py`. Op versie 1 zijn beide rood. Na golf 1 liggen ze vast; wijzigen alleen met toestemming van de eigenaar. Golf 2 bouwde de carrosserie die deze maten haalt; beide poorten zijn groen. De banden staan 15 mm (voor) en 22 mm (achter) binnen de huid.

## 3. Motorframe

Geen krukasframe. De motor staat dwars in het autocoördinaat. Het motorhuis staat op y 0,46 en z 1,38. Er zijn geen `fromPT` / `ENG2CAR` in versie 1.

## 4. Motorkap

`bodHoodY` in `body.js` (sinds golf 2 gelijk aan het dekprofiel `YD`). `integrity.py` eist 2,5 cm onder de buitenhuid en 0,5 cm onder een kaplaag. De motor en de omvormer blijven daaronder. Versie 1 heeft de laadklep als kind van `Motorkap`; na golf 3 zit er geen laadklep meer op de kap. De verlichte '5' komt op de kap als lamp.

## 5. Aansluitpunten

Geen `ENG_PORTS` of `DRV_PORTS` in versie 1. De aandrijfassen komen uit `drivetrain.js` en eindigen op het spoor.

## 6. Namen

Wortel `Renault 5 E-Tech`. Acht kinderen in de frameworkvolgorde: Carrosserie, Interieur, Aandrijflijn, Onderstel, Koeling en luchtinlaat, Uitlaatsysteem, Brandstofsysteem, Elektrisch systeem. Onderstel: Vooras en stuurinrichting, Achteras, Wielen, Remsysteem. Motor: `Motor 6AK`. Kap: `Motorkap`. Laadklep: `Laadklep`, in versie 1 onder `Carrosserie/Motorkap`. De lijst die de test leest staat in `tools/anchors.json`.

Aantal onderdelen per hoofdgroep in versie 1 (230 knopen, 178 onderdelen): Carrosserie 59, Interieur 29, Aandrijflijn 23, Onderstel 49, Koeling en luchtinlaat 5, Uitlaatsysteem 3, Brandstofsysteem 4, Elektrisch systeem 6.

Na golf 2 (`data/tree.json`, 257 knopen, 205 onderdelen): Carrosserie 86 (67.956 driehoeken), de andere groepen gelijk aan versie 1. Het hele model telt 85.116 driehoeken. Weg uit de Carrosserie: Neus, Neusvlak, Onderbak, Stijlen, Middenstijl, Dakrand links en rechts, Motorkap/Isolatie kap en Achterklep/Kenteken achter (nu `Kenteken achter` direct onder Carrosserie). De diepteminima van `data/diepte.json` blijven op versie 1 gebaseerd.

## 7. Eigendom en voorvoegsels

Zoals het sjabloon. `panorama.js` blijft leeg: deze uitvoering heeft geen schuifdak. `bodyparts.js` bouwt sinds golf 2 de panelen op de huid van `body.js`: `buildBody`, portieren (`bodDoor`), spiegels (`bodMirror`), wielkastranden, binnenschermen en bagageruimte, met voorvoegsel `bod`. `auto.json` heeft `"cockpit": null`: geen modus Cockpit.

## 8. Budgetten en ondergrens

`tools/anchors.json`: totaal 700.000 driehoeken. Versie 1 zit daar ver onder (`tri.py --gate`).

Diepte: de minima per hoofdgroep staan in `data/diepte.json`, factor 5 op de aantallen van versie 1 in sectie 6 (besluit van de eigenaar). Ze zijn een poort alleen met `python3 tools/maat.py --diepte`; dat is het doel van golf 5. CI en `finaltests.sh` toetsen ze niet. Ze staan niet in `tools/anchors.json`, omdat `integrity.py` elke sleutel daar als knooplijst leest.

## 9. Openers

Er zijn 13 openers (`openers` in `tools/anchors.json`). Waarden uit `src/body.js` (`bodHinge`, `bodSlide`):

| Opener | Type | Hoek of slag | min |
|---|---|---|---|
| Motorkap | scharnier, as x, negatief | 1,05 rad | 0,82 maal |
| Laadklep (nu onder Motorkap) | scharnier, as x, negatief | 1,15 rad | 0,82 maal |
| Portier linksvoor / rechtsvoor | scharnier, as y | 1,15 rad, teken per zijde | 0,82 maal |
| Portier linksachter / rechtsachter | scharnier, as y | 1,05 rad | 0,82 maal |
| Zijruiten (vier) | schuif omlaag 0,28 m, 0,035 m naar buiten (golf 2; versie 1: 0,36 m) | | 0,82 maal de slag |
| Spiegels (twee) | scharnier, as y | 1,15 rad | 0,82 maal |
| Achterklep | scharnier, as x, positief | 1,10 rad | 0,82 maal |

Geen `hideWhen` en geen volgers in versie 1. `tools/open_allow.json` is het lege sjabloon. Golf 3 verplaatst de Laadklep naar het linker voorscherm; het pad in `openers` en de preset `openCharge` gaan dan mee.

## 10. Wat de golven toevoegen

| Golf | Wat |
|---|---|
| 0 | Docs waar en r5-eigen. Geen code. |
| 1 | Externe maten: `data/silhouet.json` uit de maattekening van de brochure (genormaliseerd, tolerantie 30 mm) en de maatpoort `tools/maat.py`, beide rood op versie 1 en daarna vast. Diepteminima in `data/diepte.json` (poort met `tools/maat.py --diepte`, doel golf 5). |
| 2 | Gedaan (nog niet gepubliceerd): carrosserie op een geloft vlak die de externe maten haalt, spoor 1.548 en 1.532 mm. De opentestmelding over de achterklep is weg. |
| 3 | Laadklep in het linker voorscherm. |
| 4 | Nog niet vastgelegd in dit contract. De golf voor de verlichte '5' op de kap ligt ook nog niet vast. |
| 5 | Diepte: minstens factor 5 op het aantal onderdelen per hoofdgroep van versie 1. |

## 11. Regels

`d` verplicht. `spec` alleen voor feiten met bron in de spec-doc. `inner` voor wat dicht niet zichtbaar is. Openers hebben `open.min` van minstens 0,8 maal de volle hoek of slag.
