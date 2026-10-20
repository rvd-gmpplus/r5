# Exterieurmaten: externe waarheid voor de maat- en silhouetpoort

Golf 1 van de herbouw, 20 oktober 2026. Doel: de poorten die zichzelf als referentie gebruikten vervangen door maten van
buiten, zodat het huidige grove model zichtbaar faalt. Na golf 1 liggen `data/silhouet.json`, `tools/maat.py`,
`data/diepte.json` en `tools/anchors.json` vast; wijzigen alleen met toestemming van de eigenaar.

## Bronnen

| Bron | Wat | Status |
|---|---|---|
| Renault Nederland, brochure Renault 5 E-Tech electric, oktober 2026, blad 25 "afmetingen en volumes": https://cdn.group.renault.com/ren/nl/brochures-en-prijslijsten/brochures/r5-brochure.pdf.asset.pdf/1c48d6a01a.pdf | maattekening zij-, voor-, achter- en bovenaanzicht met 749, 2540, 633, 3922, 145, 2041, 1498, 1774, 2020 | getallen bevestigd; tekening niet op schaal (zie hieronder) |
| Renault Nederland, prijslijst 31 mei 2024, tabel Afmetingen: https://cdn.group.renault.com/ren/nl/brochures-en-prijslijsten/prijzenarchief/renault5/renault5-prijslijst-mei-2024.pdf | spoorbreedte voor 1548, achter 1532; maximale breedte tussen spatborden 1774; totale breedte zonder zijspiegels 1808; met zijspiegels 2020; lengte 3922, wielbasis 2540, overhang 749 en 633, hoogte 1498 | bevestigd (tekst van de fabrikant) |

De brochure noemt geen spoorbreedte; 1548 en 1532 komen uit de prijslijst. Over de breedte (1774 tussen de spatborden,
1808 zonder zijspiegels) verschillen de bronnen; de afweging staat één keer, in
[../specificaties-en-bronnen.md](../specificaties-en-bronnen.md) onder de maattabel. Gevolg hier: de maatpoort laat 1764
tot 1818 mm toe, en het bovenaanzicht van het silhouet is genormaliseerd op 1774.

De brochure is lokaal opgehaald en gerenderd; het beeld staat niet in de repo.

## Methode tekening

- Blad 25 gerenderd met `pdftoppm -r 300` (4688 bij 6700 pixels; 4,1671 pixel per punt). De auto's zijn een ingebedde
  JPEG van 2026 bij 1718 pixels op 144 ppi; de maatlijnen zijn vector.
- Maatlijnen gevonden als kolommen of rijen waar meer dan 80 procent van de pixels in een band donker is (grijswaarde
  onder 120, of 170 voor de grijze grondlijn). Randen van de auto: eerste pixel die niet wit is (helderheid onder 200 of
  verzadiging boven 40).
- Pixelcoördinaten hieronder zijn die van de 300-dpi-render, x naar rechts, y naar beneden.

### Zijaanzicht (neus links)

| Lijn | Pixel |
|---|---|
| hulplijn neus (begin 749 en 3922) | x 291,5 |
| hulplijn vooras (eind 749, begin 2540) | x 697,5 |
| hulplijn achteras (eind 2540, begin 633) | x 2184,0 |
| hulplijn staart (eind 633 en 3922) | x 2541,0 |
| bovenlijn 2041 (klep open) | y 1164,9 |
| grondlijn (onderkant 2041) | y 2337,7 |
| hoogste punt dak | x 1510, y 1471 |

Schaal volgens het draaiboek: wielbasis 2184,0 min 697,5 = 1486,5 pixel voor 2540 mm, dus 0,58524 pixel per mm.

| Controle | Pixel | Met schaal wielbasis | Opgave | Afwijking |
|---|---|---|---|---|
| lengte | 2249,5 | 3844 mm | 3922 mm | min 2,0 procent |
| hoogte (dak tot grond) | 866,7 | 1481 mm | 1498 mm | min 1,1 procent |
| hoogte klep open | 1172,8 | 2004 mm | 2041 mm | min 1,8 procent |

Beide controles van het draaiboek (lengte en hoogte binnen 1 procent) falen: de tekening is niet op schaal. Daarom is de
meting eerst gestopt. De eigenaar besloot daarna (golf 1, ronde 2) de tekening genormaliseerd te gebruiken; zie
Genormaliseerde meting hieronder.

Ter informatie: met de lengte als schaal (0,57356 pixel per mm) klopt de hoogte met klep open wel (2045 mm, plus 0,2
procent) en de daklijn (1511 mm, plus 0,9 procent), maar dan wordt de wielbasis 2592 mm (plus 2,0 procent) en de overhang
voor 708 mm in plaats van 749. De tekenaar heeft de voorwielen dus ongeveer 40 mm te ver naar voren gezet, of de tekening
is een vrije illustratie. Geen van beide schalen voldoet aan het draaiboek.

### Vooraanzicht en achteraanzicht

| Lijn | Pixel |
|---|---|
| 1498 boven en onder | y 1451,1 en 2346,1 |
| 1774 voor, links en rechts | x 3220,0 en 4401,0 |
| 2020 links en rechts | x 3200,0 en 4416,0 |
| 1774 achter, links en rechts | x 3221,0 en 4401,5 |

Met 1774 als schaal (0,66573 pixel per mm) wordt de hoogte 1344 mm (min 10 procent) en de breedte met spiegels 1827 mm
(min 10 procent). Het vooraanzicht is een illustratie met andere verhoudingen, niet bruikbaar voor dakbreedte, raambreedte
of spoor.

### Bovenaanzicht

Er is een bovenaanzicht (dak weggelaten, interieur zichtbaar, spiegels uitgeklapt), zonder buitenmaten. Lengte 2184 pixel
(x 292 tot 2476); grootste breedte zonder spiegels 1009 pixel (bij x 1458, met de portiergreep). Met de lengte 3922 als
schaal is dat 1812 mm, plus 2,1 procent op 1774. Ook dit aanzicht haalt de grens van 1 procent niet; het is daarom ook
genormaliseerd gemeten (hieronder).

## Genormaliseerde meting (besluit eigenaar)

Label in `data/silhouet.json`: "brochure, genormaliseerd". Elk aanzicht krijgt een affiene schaal met een eigen factor per
richting, zodat de tekening precies de opgegeven maten heeft. De assen komen uit de constanten `axf` 1,212 en `axr` -1,328
(overhang 749 en 633 mm), niet uit de tekening: na normalisatie staat de vooras van de tekening op z 1,253 (41 mm te ver
naar voren) en de achteras op z -1,339 (11 mm). Tolerantie in `silhouette.py`: 30 mm voor en tussen de assen (`tolAs` en
`tolOverhang` 0,030), `maxBuiten` 0.

Randen: eerste pixel die niet wit is (helderheid onder 200 of verzadiging boven 40), drie pixels breed of hoog.

### Zijaanzicht

| Ankers | Pixel | Maat | Schaal |
|---|---|---|---|
| neus tot staart (hulplijnen 3922) | x 291,5 tot 2541,0 | 3922 mm | 1,74350 mm per pixel |
| grond (onderkant 2041) tot hoogste punt dak | y 2337,7 tot 1471 | 1498 mm | 1,72840 mm per pixel |

Omrekening naar het autoframe: z = (1416,25 min x) maal 1,74350 mm; y = (2337,7 min pixel-y) maal 1,72840 mm. De auto is
in de lengte gecentreerd, dus de neus ligt op z 1,961 en de staart op z -1,961.

`top`, hoogste punt per z (de motorkaplijn is `top` van z 1,0 tot 1,7). Helling dy/dz over 20 pixel (achter over 0,1 m, onder
de gasveer), ter beoordeling van de tolerantie: bij een helling van 0,74 wordt 30 mm in z ongeveer 22 mm in y.

| z (m) | pixel x | pixel y | y (m) | helling |
|---|---|---|---|---|
| 1,70 | 441 | 1795 | 0,938 | -0,74 |
| 1,60 | 499 | 1769 | 0,983 | -0,30 |
| 1,40 | 613 | 1747 | 1,021 | -0,15 |
| 1,20 | 728 | 1727 | 1,056 | -0,20 |
| 1,00 | 843 | 1711 | 1,083 | -0,05 |
| 0,80 | 957 | 1654 | 1,182 | -0,50 |
| 0,60 | 1072 | 1589 | 1,294 | -0,59 |
| 0,40 | 1187 | 1527 | 1,401 | -0,50 |
| 0,20 | 1302 | 1487 | 1,470 | -0,20 |
| 0,00 | 1416 | 1475 | 1,491 | -0,05 |
| -0,40 | 1646 | 1471 | 1,498 | 0,00 |
| -0,80 | 1875 | 1475 | 1,491 | 0,05 |
| -1,50 | 2277 | 1621 | 1,239 | 0,83 |
| -1,60 | 2334 | 1668 | 1,158 | 0,83 |
| -1,70 | 2391 | 1719 | 1,069 | 0,98 |

Niet gemeten: z 1,75 tot 1,96 (neus, helling steiler dan 1,1), z -0,9 tot -1,5 (in de tekening staat de achterklep open;
de spoiler steekt daar tot y 1448 uit en de gasveer kruist de rand), z -1,75 tot -1,96 (sprong bij achterlicht en bumper).
Van z -1,5 tot -1,7 is de rand die van het zijpaneel onder de open klep; met de klep dicht ligt die in lijn met de klep.
Aanname: in zijaanzicht is het hoogste punt per z ook dat op de middellijn, die `silhouette.py` meet (straal omlaag op x 0).

`belt`, onderrand van het zijraam. De portieren aan de kant van de kijker zijn in de tekening weggelaten; gemeten is de
onderrand van de ruit aan de verre kant, door de open portieren heen (laatste rij van een strook van minstens 15 pixel in het
grijs van het glas, helderheid 125 tot 160). Aanname: links en rechts gelijk. Bij z 0,45 tot 0,80 staan stuur en stijl voor
de ruit, bij z -0,20 tot -0,40 de middenstijl en de stoel.

| z (m) | pixel x | pixel y | y (m) |
|---|---|---|---|
| 0,30 | 1244 | 1728 | 1,053 |
| 0,10 | 1359 | 1726 | 1,056 |
| -0,10 | 1474 | 1724 | 1,060 |
| -0,50 | 1703 | 1720 | 1,067 |
| -0,70 | 1818 | 1716 | 1,074 |
| -0,90 | 1932 | 1713 | 1,079 |

`onder`, onderrand van de carrosserie buiten de wielen, alleen ter informatie (`silhouette.py` leest het niet): eerste
pixel van onderen boven de schaduwlijn.

| z (m) | 1,85 | 1,75 | 0,60 | 0,20 | -0,40 | -0,80 | -1,75 | -1,85 |
|---|---|---|---|---|---|---|---|---|
| pixel y | 2190 | 2197 | 2212 | 2210 | 2206 | 2204 | 2176 | 2146 |
| y (m) | 0,254 | 0,242 | 0,216 | 0,220 | 0,227 | 0,230 | 0,279 | 0,330 |

De dorpel staat in de tekening op 216 tot 230 mm; de bodemvrijheid van 145 mm geldt voor het laagste punt van de bodem,
dat in zijaanzicht achter de dorpel valt.

### Bovenaanzicht

| Ankers | Pixel | Maat | Schaal |
|---|---|---|---|
| neus tot staart | x 292 tot 2476 (2185 pixel) | 3922 mm | 1,79497 mm per pixel |
| grootste breedte over de wielkasten, zonder spiegels en greep | y 3134 tot 4139 (1006 pixel, bij x 700 en x 2100) | 1774 mm | 1,76342 mm per pixel |

Middellijn y 3636 (links en rechts gelijk binnen 2 pixel). Omrekening: z = (1384 min x) maal 1,79497 mm; halve breedte is
de helft van de breedte in pixel maal 1,76342 mm. De vorige meting (1009 pixel, 1812 mm) nam de portiergreep bij x 1400 tot
1500 mee; zonder greep is de grootste breedte 1006 pixel.

`plan`, halve breedte per z. `silhouette.py` meet die met zijstralen tussen y 0,20 en 1,40 m (`planY`), dus over de hele
hoogte zoals het bovenaanzicht. `neusMax` en `staartMax` zijn het eerste en het laatste station plus 30 mm: 0,814 en 0,850.

| z (m) | pixel x | halve breedte (m) |
|---|---|---|
| 1,70 | 437 | 0,784 |
| 1,50 | 548 | 0,859 |
| 1,25 | 688 | 0,885 |
| 1,00 | 827 | 0,874 |
| 0,80 | 938 | 0,864 |
| 0,20 | 1273 | 0,864 |
| -0,40 | 1607 | 0,861 |
| -0,80 | 1830 | 0,853 |
| -1,10 | 1997 | 0,873 |
| -1,30 | 2108 | 0,887 |
| -1,50 | 2220 | 0,875 |
| -1,70 | 2331 | 0,820 |

Niet gemeten: z 0,33 tot 0,69 (spiegels, x 1000 tot 1200), z 0,06 tot -0,21 (portiergreep), en de neus en staart voorbij
z 1,70 en -1,70 (helling boven 1).

### Vooraanzicht

Niet gebruikt: met 1774 als schaal wordt de hoogte 1344 mm (min 10 procent). Dakbreedte en raambreedte zijn niet gemeten.

## Status per reeks

| Reeks | Status | Bron |
|---|---|---|
| top (hoogste punt per z, met de motorkaplijn) | 15 stations | brochure, genormaliseerd |
| belt (onderrand zijraam) | 6 stations | brochure, genormaliseerd |
| plan (halve breedte per z) | 12 stations | brochure, genormaliseerd |
| onder (onderrand carrosserie) | 8 stations, informatief | brochure, genormaliseerd |
| dakbreedte, raambreedte | niet gemeten | vooraanzicht niet bruikbaar |
| lengte, breedte, hoogte, wielbasis, spoor, overhang, breedte met spiegels | bevestigd | tekst van de fabrikant; poort in `tools/maat.py` |

Uitslag op versie 1 (`python3 tools/silhouette.py`, 20 oktober 2026): `SILHOUET NIET OK`, top 13, plan 3 en raam 6
stations buiten tolerantie, en de neus te breed (halve breedte 0,845 bij z 1,70, maximaal 0,814). Het dak van het model
staat op 1,418 m, 8 cm onder de 1,498 m van het silhouet.

## Maatpoort

`tools/maat.py` (extra test `maat` in `auto.json`) meet het gemonteerde model en vergelijkt met de bevestigde maten, elk
met een onder- en een bovengrens:

| Maat | Doel | Grens |
|---|---|---|
| lengte | 3922 mm | 10 mm |
| breedte zonder spiegels | 1774 mm | 1764 tot 1818 mm (10 mm onder 1774 tot 10 mm boven 1808) |
| hoogte | 1498 mm | 10 mm |
| wielbasis | 2540 mm | 5 mm |
| spoor voor en achter | 1548 en 1532 mm | 10 mm |
| overhang voor en achter | 749 en 633 mm | 10 mm |
| breedte met spiegels | 2020 mm | 30 mm |
| band binnen de huid, per wiel | 0 tot 45 mm | |

Breedte: de bronnen geven 1774 en 1808 (zie de bronlijst). De poort laat beide toe, met 10 mm marge aan elke kant.

Band binnen de huid, 0 tot 45 mm: het buitenvlak van de band ligt op spoor/2 plus bandbreedte/2, 1548/2 + 195/2 = 871,5 mm.
De wielkastbolling kan tot de helft van 1808 reiken, 904 mm; dan staat de band 32,5 mm binnen de huid. 45 mm laat daar
ruim een centimeter marge op. Onder 0 steekt de band buiten de carrosserie.

Welke meshes meetellen: onder Carrosserie, zichtbaar over de hele keten van ouders (niet alleen de mesh zelf), zonder
antenne, ruitenwissers en grepen (zoals `silhouette.py`). Zonder de portiergrepen meet versie 1 1764 mm breed; met de
grepen was dat 1796 mm.

De huid naast een wiel is de buitenste treffer van stralen van buiten naar binnen, in z binnen 0,9 maal de straal van de
band rond het wielmidden en in y van ashoogte tot 15 cm boven de band (de wielkastrand). Alleen huidpanelen tellen:
dorpels, onderlip, onderinlaat, diffusor, kentekens en glas niet (`HUID_NIET` in `tools/maat.py`). In versie 1 is de
`Onderbak` de zijwand van de carrosserie (0,22 tot 1,05 m hoog) en telt dus wel. Beperking: de uitsluiting gaat op
knoopnaam; een nieuw onderdeel naast de wielkast met een andere naam telt als huid tot het in `HUID_NIET` staat. De
uitvoer noemt per wiel de knoop waar de huid is geraakt, zodat dat te zien is.

`--zelftest` bewijst zonder browser dat elke grens naar beide kanten werkt, ook de inzet voor elk van de vier wielen, het
lezen van `data/diepte.json` en de diepte met en zonder `--diepte`. `--diepte` maakt de diepteminima uit
`data/diepte.json` tot poort.

Uitslag op versie 1 (`python3 tools/maat.py`, 20 oktober 2026): `MATEN NIET OK`. Model: lengte 3821, breedte 1764 (zonder
grepen), hoogte 1418, wielbasis 2540, spoor 1280 en 1280, overhang 719 en 562, met spiegels 1940 mm; band 108 mm binnen
de huid bij elk wiel. Binnen de grens: breedte en wielbasis.

## Diepte

Besluit van de eigenaar: het minimum voor golf 5 is vijf keer het aantal onderdelen van golf 1 per hoofdgroep (geteld met
`tools/orkestratie/stats.py` op 20 oktober 2026, 178 onderdelen):

| Hoofdgroep | Golf 1 | Minimum golf 5 |
|---|---|---|
| Carrosserie | 59 | 295 |
| Interieur | 29 | 145 |
| Aandrijflijn | 23 | 115 |
| Onderstel | 49 | 245 |
| Koeling en luchtinlaat | 5 | 25 |
| Uitlaatsysteem | 3 | 15 |
| Brandstofsysteem | 4 | 20 |
| Elektrisch systeem | 6 | 30 |

De minima staan in `data/diepte.json`. Alleen `tools/maat.py` leest dat bestand, en alleen `python3 tools/maat.py --diepte`
maakt ze tot poort (doel golf 5). CI, `finaltests.sh` en `tools/integrity.py` toetsen ze niet. Ze staan bewust niet in
`tools/anchors.json`: `integrity.py` (generiek) leest elke sleutel daar als lijst knoopnamen, en onder `content` zou de
toets tot golf 5 rood staan.
