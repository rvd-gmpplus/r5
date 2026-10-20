# Specificaties en bronnen

Dit is de enige lijst met feiten over de auto. Elk feit heeft minstens één URL. Alleen feiten uit deze lijst mogen in `spec` op een knoop. Andere docs verwijzen hierheen en herhalen geen getallen die ervan afwijken. Een volledige bronnenlijst staat in [onderzoek/bronnen.md](onderzoek/bronnen.md).

De auto in het model is de Renault 5 E-Tech electric, uitvoering Techno Comfort Range, Pop-geel met zwart dak. Renault noemt geen modeljaar. De versie met 430 km WLTP is de vernieuwde versie van 25 augustus 2026; in de praktijk modeljaar 2027. In de docs: modeljaar 2026/2027 (vernieuwd augustus 2026). De instapversie Five is een andere auto en zit niet in dit model.

## Maten van de auto

| Gegeven | Waarde | Bron |
|---|---|---|
| Lengte | 3.922 mm | [Renault NL brochure](https://cdn.group.renault.com/ren/nl/brochures-en-prijslijsten/brochures/r5-brochure.pdf.asset.pdf/1c48d6a01a.pdf); [Renault NL specificaties](https://www.renault.nl/elektrische-autos/r5-e-tech-electric/specificaties.html) |
| Breedte tussen de spatborden | 1.774 mm | Renault NL brochure; [Renault NL prijslijst 31 mei 2024](https://cdn.group.renault.com/ren/nl/brochures-en-prijslijsten/prijzenarchief/renault5/renault5-prijslijst-mei-2024.pdf) ("Maximale breedte tussen spatborden"); [Renault AT prijslijst](https://cdn.group.renault.com/ren/at/renaultat/downloadcenter/renault-5/renault5-e-tech-electric-preisliste.pdf) |
| Totale breedte zonder spiegels | 1.808 mm | Renault NL prijslijst 31 mei 2024 ("Totale breedte zonder zijspiegels"); Renault NL specificaties ("Totale breedte"); Renault AT prijslijst |
| Breedte met spiegels uitgeklapt | 2.020 mm | Renault NL brochure; Renault NL prijslijst 31 mei 2024; Renault NL specificaties |
| Hoogte | 1.498 mm | Renault NL brochure; Renault NL specificaties |
| Wielbasis | 2.540 mm | Renault NL brochure; Renault NL specificaties |
| Overhang voor / achter | 749 mm / 633 mm | Renault NL brochure; Renault AT prijslijst |
| Spoor voor / achter | 1.548 mm / 1.532 mm | Renault NL prijslijst 31 mei 2024 ("Spoorbreedte voor", "Spoorbreedte achter"); Renault AT prijslijst |
| Bodemvrijheid | 145 mm | Renault NL brochure; Renault AT prijslijst |
| Banden | 195/55 R18 | [Continental, persbericht 6 juni 2025](https://www.continental.com/en/press/press-releases/20250606-renault-r5/) |
| Velg | 18 inch, Techno | Continental; [Renault NL, update 25 augustus 2026](https://nl.media.renaultgroup.com/renault-5-e-tech-electric-vernieuwd-met-een-groter-rijbereik-meer-kleuren-en-technologie/) (18-inch techno-wielen) |

Breedte, 1.774 of 1.808 mm: de NL prijslijst noemt beide, 1.774 als maximale breedte tussen de spatborden en 1.808 als totale breedte zonder zijspiegels; Renault NL specificaties noemt 1.808 alleen "Totale breedte". Of 1.808 zonder spiegels of met ingeklapte spiegels is gemeten, en welke van de twee maten de wielkastbollingen meeneemt, zeggen de bronnen niet eenduidig. De maatpoort `tools/maat.py` laat daarom 1.764 tot 1.818 mm toe; het silhouet schaalt het bovenaanzicht op 1.774 mm (besluit van de eigenaar). Andere docs verwijzen hierheen.

## Aandrijving, batterij en laden

| Gegeven | Waarde | Bron |
|---|---|---|
| Motor | 6AK, synchroonmotor met gewikkelde rotor (EESM, extern bekrachtigd), zonder zeldzame aardmetalen | [Renault Group over motoren zonder zeldzame aardmetalen](https://www.renaultgroup.com/en/magazine/energy-and-powertrains/all-about-electric-motors-with-no-rare-earths/); Renault NL specificaties (motortype 6AK); [Renault perskit (Zwitserland)](https://media.renault.ch/__/151405.f8f47bba.dl) ("moteur électrique synchrone à rotor bobiné") |
| Vermogen en koppel | 110 kW piek (150 pk), 245 Nm | Renault perskit (Zwitserland); [Renault UK aandrijving](https://www.renault.co.uk/electric-vehicles/r5-e-tech-electric/powertrain.html) |
| Batterij | 52 kWh netto, 55 kWh bruto, 400 V | [Battery Design](https://www.batterydesign.net/renault-5-e-tech/); [EV Database](https://ev-database.org/car/2135) |
| Opbouw batterij | 4 modules, 184 pouchcellen | Battery Design; Renault Spanje catalogus (4 modules) |
| WLTP | tot 430 km sinds de update van 25 augustus 2026; daarvoor tot 410 km | Renault NL, update 25 augustus 2026 |
| Wat de update van 25 augustus 2026 veranderde | aerodynamica aan onder meer de onderzijde van de carrosserie en de buitenspiegels, en de elektronica van de batterij | Renault NL, update 25 augustus 2026 |
| Boordlader | 11 kW AC, bidirectioneel (V2L en V2G) | Renault perskit (Zwitserland); Renault UK aandrijving (11 kW AC) |
| V2L | 3,7 kW (3.700 W) | Renault perskit (Zwitserland) |
| Snelladen | DC 100 kW (CCS) | Renault perskit (Zwitserland); Renault UK aandrijving |
| Laadklep | AC en CCS DC in het linker voorscherm, niet op de motorkap | [Car Design News, interview met Gilles Vidal](https://www.cardesignnews.com/cars/vidal-on-the-renault-5-reborn-electric/485914) |
| Verlichte '5' op de motorkap | toont de laadstand in stappen van 20 % | Car Design News |
| Warmtepomp | standaard vanaf evolution, dus ook op Techno | Renault NL brochure (lijst evolution); [Renault Spanje catalogus maart 2025](https://catalogo.renault.es/es/mobile/renault5/mobile/ct_renault_5_es_march_2025.pdf) ("bomba de calor: sí"); Renault UK aandrijving |
| Platform | AmpR Small | Renault UK aandrijving |

## Onderstel en carrosserie

| Gegeven | Waarde | Bron |
|---|---|---|
| Vooras | pseudo-McPherson (veerpoot) | [Autozine](https://www.autozine.org/Archive/Renault/new/R5_2024.html) ("F: strut", McPherson-veerpoot van de Captur). Renault UK aandrijving noemt alleen een geoptimaliseerde vooras. |
| Achteras | multilink, geen torsieas | Renault UK aandrijving ("multi-link rear axle"); Autozine |
| Remmen voor | geventileerde schijven 296 mm | Renault NL specificaties; Renault Spanje catalogus (296 x 26) |
| Remmen achter | schijven 280 mm, geen trommels | Renault NL specificaties; Renault Spanje catalogus (280 x 9,6) |
| Koplampen | smal, met een pupilvorm; de twee afgeronde vierkanten zitten in de bumper. "Vierkante koplampen" is fout. | Car Design News |
| Middenscherm | OpenR link, 10,1 inch bij Techno | Renault NL brochure (lijst techno) |

## Wat het model nog niet volgt

Versie 1 wijkt op deze punten af van de lijst hierboven. De herbouw herstelt ze (zie [contract.md](contract.md)):

- Hoofdmaten, gemeten met `tools/maat.py` (golf 1): lengte 3.821 mm, breedte zonder spiegels 1.764 mm (zonder portiergrepen; met grepen 1.796 mm), hoogte 1.418 mm, wielbasis 2.540 mm, spoor 1.280 mm voor en achter, overhang 719 mm voor en 562 mm achter, breedte met spiegels 1.940 mm. Dit is de enige lijst met de maten van het model; andere docs nemen deze getallen over.
- `data/silhouet.json` komt sinds golf 1 uit de maattekening van de brochure, genormaliseerd op 3.922, 1.498 en 1.774 mm (tolerantie 30 mm; methode in [onderzoek/exterieur-maten.md](onderzoek/exterieur-maten.md)). Het model haalt het niet: `silhouette.py` is rood tot golf 2.
- De laadklep zit op de motorkap; golf 3 zet hem in het linker voorscherm.
- Achter staan trommels en een torsieas; het moeten schijven en een multilink zijn.
- Teksten in de code noemen de motor nog "fremderregte synchroonmotor" en de koplampen "vierkant".

## Wat het model bewust niet doet

- Geen Renault-ruit en geen letters RENAULT. De verlichte '5' op de kap wordt wel getekend, als lamp (besluit van de eigenaar).
- Geen kenteken en geen chassisnummer.
- Onderdeelnummers zijn niet onderzocht.
