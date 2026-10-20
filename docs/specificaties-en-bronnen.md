# Specificaties en bronnen

Alleen feiten die meer dan één openbare bron noemt, of die één primaire bron letterlijk geeft, staan in `spec` op de knoop. De rest staat in `d` of hier, met de bron. Het model is schematisch: huisafmetingen van motor, batterij en stoelen zijn geen catalogusmaten.

De uitvoering in het model is Techno Comfort Range, modeljaar 2026, Pop-geel met zwart dak. De instapversie Five (80 kW, LFP 36,5 kWh) is een andere auto en zit niet in dit model.

## Maten van de auto

| Gegeven | Waarde in het model | Bron |
|---|---|---|
| Lengte | 3.922 mm (`ZF` 1,961, `ZR` -1,961) | [Renault Ierland](https://www.renault.ie/electric-vehicles/r5-e-tech-electric.html) noemt 3,92 m. [GreenGear](https://www.greengear.de/renault-5-e-tech-110-kw-52-kwh-elektroauto-technische-daten/) schrijft in de lopende tekst 3.922 mm. De tabel op diezelfde pagina zet 3.992 mm; dat getal volgt dit model niet. |
| Hoogte | 1.498 mm (`BOD_H`) | GreenGear |
| Wielbasis | 2.540 mm | GreenGear |
| Breedte met spiegels | 2.020 mm (`BOD_MIRW` 1,010) | GreenGear |
| Breedte van de carrosserie | omhullende `BOD_WMAX` 0,904 m (1.808 mm) | Testgrens, ruimer dan de huid. GreenGear noemt 1.744 mm zonder spiegels. Andere bladen noemen 1.774 mm. Geen van die twee is als enige maat in `spec` gezet. |
| Overhang voor / achter | 749 mm / 633 mm, zodat de assen op 2.540 mm in 3.922 mm vallen | Plaatsing in dit model, niet een aparte brochureregel. `AXF` 1,212, `AXR` -1,328. |
| Band | 195/55 R18, straal 0,336 m (`AY`) | Wielmaat van het model. De straal volgt de maataanduiding van de band. |
| Spoor in het model | halve spoorbreedte 0,64 m | Naar binnen gezet zodat remschijf en trommel binnen `surfX` blijven. Geen brochure-spoor. |
| Bodemvrijheid | 145 mm | GreenGear. Niet als constante in de code. |

## Aandrijving en batterij

| Gegeven | Waarde | Bron |
|---|---|---|
| Motor | fremderregte synchroonmotor, 110 kW (150 pk), code 6AK in dit model | GreenGear: fremderregte synchroonmotor, 110 kW, 245 Nm. De code 6AK komt uit het Britse specificatieblad van de reeks en staat in `d` en `spec`. |
| Koppel | 245 Nm | GreenGear. Staat in dit document, niet als aparte `spec`-regel. |
| Batterij Comfort Range | 52 kWh, 400 V, NMC in de tekst van het model | GreenGear: 52,0 kWh, 400 V, lithium-ion. De pers van 16 oktober 2026 houdt de capaciteit gelijk. |
| WLTP | tot 430 km voor Comfort Range | [Pers, 16 oktober 2026](https://www.ilgiornaleditalia.it/news/italpress/830353/renault-5-e-tech-electric-nuova-gamma-con-autonomia-fino-a-430-km.html): van 410 naar 430 km door onderbodem, spiegels en elektronica. Renault Ierland noemt tot 430 km voor evolution comfort range 52 kWh. Een Italiaanse prijslijst van die dag zet Techno op 425 km, nog in homologatie. `spec` zegt daarom "tot 430 km (Comfort Range)", niet een los Techno-cijfer. |
| Urban Range | 40 kWh, 90 kW, tot 315 km | Dezelfde pers. Niet deze auto. |
| Five | 80 kW, LFP 36,5 kWh, tot 305 km, later | Dezelfde pers. Niet deze auto. |
| Laden | CCS links op de motorkap, AC 11 kW, DC 100 kW | GreenGear: "CCS (vorne links)", AC 11 kW, DC 100 kW. De pers bevestigt 100 kW DC voor 52 kWh. |
| Platform | AmpR Small | Gangbare naam van het platform in de Renault-communicatie. |
| Schermen | OpenR, twee schermen van 10 inch | [Renault Ierland](https://www.renault.ie/electric-vehicles/r5-e-tech-electric.html) ("2x10"). |
| Warmtepomp | aanwezig in het model | Het Britse blad van de 90 kW noemt een warmtepomp. De tekst bij het onderdeel zegt dat, en claimt hem niet als losse bevestiging voor alleen de 110 kW. |
| Remmen | schijven voor, trommels achter | Het Britse blad van de 90 kW noemt schijven 296 × 26 mm. Die maat staat in `d` van de schijf, niet als bevestigde maat van de 110 kW. |

## Wat het model bewust niet doet

- Geen Renault-ruit en geen cijfer 5.
- Geen kenteken en geen chassisnummer.
- De huid is een lofts van `HW`, `YB`, `YT` en de kap- en klepfuncties. `data/silhouet.json` bewaart de stations van die huid (versie 1, gemeten aan het model) tot er een foto-opmeting is.
- Onderdeelnummers zijn niet onderzocht.

## Bronnen

- Renault Ierland, R5 E-Tech electric, pagina met 430 km, 3,92 m, OpenR 2×10 inch en 326 l: https://www.renault.ie/electric-vehicles/r5-e-tech-electric.html
- GreenGear, technische gegevens 110 kW / 52 kWh, 18 juni 2026: https://www.greengear.de/renault-5-e-tech-110-kw-52-kwh-elektroauto-technische-daten/
- Persbericht via Il Giornale d'Italia / Italpress, 16 oktober 2026 (Urban 315 km, Comfort 430 km, Five later): https://www.ilgiornaleditalia.it/news/italpress/830353/renault-5-e-tech-electric-nuova-gamma-con-autonomia-fino-a-430-km.html
