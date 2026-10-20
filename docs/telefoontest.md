# Telefoontest: de pagina op een echt apparaat

De tests in de repo draaien in headless Chromium met software-rendering (SwiftShader). Dit is het protocol voor de ene
meting die daar niet uit komt: de pagina op een echte telefoon en een echte GPU. Het kost ongeveer tien minuten.

## Vooraf

- Open de pagina op GitHub Pages met de debug-overlay: `https://rvd-gmpplus.github.io/r5/?debug=1`.
  De overlay bovenin toont: beelden per seconde (fps) tijdens beweging, tekenopdrachten, driehoeken, pixelverhouding
  (dpr), of de lichte weergave aanstaat, en de versie. Maak van elke stap hieronder een screenshot met de overlay in beeld.
- Noteer het toestel (merk, type, jaar), de browser en of de telefoon aan de lader hing.

## Stappen

| Nr | Doe | Let op |
|---|---|---|
| 1 | Laad de pagina met een stopwatch (of de netwerktab). | Seconden tot de auto in beeld staat; verscheen de melding "lichte weergave" in Weergave? |
| 2 | Draai de auto met één vinger, tien seconden. | fps in de overlay; voelt het schokkerig? |
| 3 | Preset Overzicht, Alles uit elkaar. | fps tijdens de animatie en daarna. |
| 4 | Preset Openen, Alles open. | fps; staan portieren, kap, achterklep en laadklep open zonder gaten? |
| 5 | Modus Uitklappen, tik op de motorkap, dubbeltik op een onderdeel van de kap. | Klapt de kap uit, duikt de dubbeltik naar dat onderdeel? |
| 6 | Houd een onderdeel 1 seconde vast. | Loopt de ring vol en klapt de groep in, zonder dat de telefoon een menu opent? |
| 7 | Preset Overzicht, Gemonteerd, kijk van boven op de motorkap (Weergave, camerastand Boven). | Donkere spikkels op de lak? Onder SwiftShader zijn die er; op een echte GPU horen ze er niet te zijn. |
| 8 | Draai de telefoon naar liggend en terug. | Staat het paneel als zijkolom, springt de camera niet weg? |
| 9 | Zet in Weergave de lichte weergave aan en uit. | Verschil in fps en in glans van de lak? |
| 10 | Deel de link vanuit de adresbalk na stap 3. | Opent de link bij een ander op dezelfde stand? |

## Melden

Per stap: wat je zag, het fps-getal uit de overlay en het screenshot. Een melding zonder getal is een indruk; met het
getal is het een meting. Zet het verslag in `docs/onderzoek/telefoontest-<datum>.md` of stuur het in de sessie.
