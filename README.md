# Renault 5 E-Tech explosietekening

Interactieve 3D-explosietekening van een Renault 5 E-Tech electric, modeljaar 2026, uitvoering Techno Comfort Range: Pop-geel met zwart dak, fremderregte motor 6AK van 110 kW en een batterij van 52 kWh. Versie 1 staat op het framework van [laguna3](https://github.com/rvd-gmpplus/laguna3). De geometrie is in code opgebouwd; er zijn geen 3D-bestanden. Het model is schematisch: het is herkenbaar als deze auto, niet een montagevoorschrift en niet de diepte van de Laguna.

![Gemonteerd](docs/screenshots/gemonteerd.png)

## Openen

Open `index.html` in een moderne browser. Het bestand laadt three.js r147 van jsDelivr en lettertypes van Google Fonts. Verder is alles ingebouwd. Het werkt op desktop en telefoon, in licht en donker thema (het thema volgt het systeem).

Klik op een onderdeel om de eigen groep uit te klappen. Dubbelklik duikt erheen. Rechtsklik, Shift+klik of vasthouden klapt in. De toets O wisselt naar Openen: motorkap, laadklep, vier portieren, zijruiten, spiegels en achterklep. Presets staan onder de tekening. `?` legt de bediening uit.

De adresbalk is een deelbare link: `?preset=battery` opent de tractiebatterij, `?open=Motorkap` opent de kap.

## Wat erin zit

Acht hoofdgroepen, in de volgorde van het framework: Carrosserie, Interieur, Aandrijflijn, Onderstel, Koeling en luchtinlaat, Uitlaatsysteem, Brandstofsysteem, Elektrisch systeem.

Deze auto heeft geen uitlaat en geen brandstoftank. Uitlaatsysteem is de gladde onderbodem van de update van 2026. Brandstofsysteem is het laadpad: CCS-contact links op de motorkap, boordlader 11 kW en de kabel naar de batterij. Elektrisch systeem is de vloeraccu van 52 kWh, het BMS, de DC-DC-omzetter en de 12V-accu.

Beeldmerken zijn niet nagetekend: geen ruit en geen cijfer 5.

## Bouwen

```bash
python3 tools/setup.sh
python3 build.py --lint
python3 build.py
```

`index.html` hoort bij `src/` en wordt gecommit. Nederlands is de taal van de teksten. Geen em-dashes. `spec` alleen voor feiten die in [docs/specificaties-en-bronnen.md](docs/specificaties-en-bronnen.md) staan. Het chassisnummer en het kenteken van de gebruiker komen niet in deze repo.

## Tests die versie 1 groen heeft

`python3 build.py --lint`, `python3 tools/framework.py check`, `python3 tools/smoke.py`, `python3 tools/integrity.py`, `python3 tools/silhouette.py`, `python3 tools/tri.py --gate`, `python3 tools/pncheck.py`.

Het silhouet in `data/silhouet.json` is de gemeten huid van dit model, tot er een fotometing is. De volledige set van laguna3 (visdiff, opentest, itest) is hier nog niet ingericht; nightly verwacht die pas als de basislijn bestaat.

## Verder lezen

- [CHANGELOG.md](CHANGELOG.md)
- [docs/contract.md](docs/contract.md)
- [docs/specificaties-en-bronnen.md](docs/specificaties-en-bronnen.md)
- [docs/framework.md](docs/framework.md)
