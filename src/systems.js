/* ===================== koeling, laden, batterij en de samenstelling ===================== */
function buildCooling() {
  const z = 1.72, y = 0.48;
  return A('Koeling en luchtinlaat', {
    d: 'Koelpakket voorin en de warmtepomp. De motor, de omvormer en de batterij delen de koelvloeistof. Er is geen intercooler van een verbrandingsmotor.',
    ex: [0, 0.2, 0.35],
  }, [
    P('Radiateur', G.box(0.62, 0.32, 0.03), MAT.alu, { d: 'Radiateur in de neus, waar de rijwind doorheen komt.', p: [0, y, z], ex: [0, 0, 0.1] }),
    P('Ventilator', G.cyl('z', 0.14, 0.14, 0.04, 18), MAT.plastic, { d: 'Elektrische ventilator achter de radiateur.', p: [0, y, z - 0.06], ex: [0, 0, -0.08] }),
    P('Warmtepomp', G.rbox(0.22, 0.16, 0.16, 0.015), MAT.aluCast, { d: 'Warmtepomp voor de verwarming van het interieur. Het Britse blad van de 90 kW noemt een warmtepomp; die staat ook in dit model.', p: [-0.28, 0.42, 1.58], ex: [-0.12, 0, 0] }),
    P('Expansievat', G.cyl('y', 0.05, 0.04, 0.1, 14), MAT.tank, { d: 'Reservoir van de koelvloeistof.', p: [0.32, 0.62, 1.55], ex: [0.1, 0.08, 0] }),
    P('Koelslang', tube([[0.2, 0.55, 1.7], [0.15, 0.55, 1.5], [0.05, 0.58, 1.4]], 0.012, 12, 6), MAT.rubber, { d: 'Slang van de radiateur naar de motor.', ex: [0, 0.08, 0] }),
  ]);
}
function buildExhaust() {
  return A('Uitlaatsysteem', {
    d: 'Deze auto heeft geen verbrandingsuitlaat. De groep bevat de onderbodem die in 2026 gladder is gemaakt voor de luchtweerstand, op de plek waar een uitlaat zou lopen.',
    ex: [0.15, -0.35, -0.4],
  }, [
    P('Onderplaat voor', G.box(0.9, 0.012, 0.7), MAT.underbody, { d: 'Gladde onderplaat onder de motorruimte.', p: [0, 0.21, 1.15], ex: [0, -0.1, 0.1] }),
    P('Onderplaat midden', G.box(1.15, 0.012, 1.2), MAT.underbody, { d: 'Onderplaat onder de batterij. De wijziging van 2026 zit in deze stroomlijn.', p: [0, 0.214, -0.05], ex: [0, -0.1, 0] }),
    P('Onderplaat achter', G.box(0.85, 0.012, 0.45), MAT.underbody, { d: 'Onderplaat voor de achteras.', p: [0, 0.195, -1.15], ex: [0, -0.1, -0.1] }),
  ]);
}
function buildFuel() {
  return A('Brandstofsysteem', {
    d: 'Geen brandstoftank. De energie komt via de laadklep op de motorkap: wisselstroom tot 11 kW en gelijkstroom voor de 52 kWh. De aansluiting zit links, achter de klep.',
    ex: [0.35, 0.15, 0.45],
  }, [
    A('Laadaansluiting', { d: 'CCS-aansluiting achter de laadklep.', ex: [0.1, 0.1, 0.08] }, [
      P('Laadcontact', G.cyl('y', 0.04, 0.04, 0.03, 16), MAT.bodSocket, { d: 'Ronde CCS-contactdoos, van boven bereikbaar als de klep open is.', p: [0.2, 0.74, 1.48], ex: [0, 0.08, 0] }),
      P('Klepcontact', G.box(0.08, 0.02, 0.08), MAT.plastic, { d: 'Huis om het contact, vast aan de binnenkant van de kapopening.', p: [0.2, 0.70, 1.48], ex: [0, -0.05, 0] }),
    ]),
    P('Boordlader', G.rbox(0.22, 0.08, 0.16, 0.01), MAT.alu, { d: 'Boordlader voor wisselstroom, 11 kW, in de voorste ruimte.', p: [-0.22, 0.55, 1.48], ex: [-0.14, 0.06, 0] }),
    P('Laadkabel hoogspanning', tube([[0.2, 0.72, 1.48], [0.2, 0.55, 1.45], [0.1, 0.42, 1.05], [0.02, 0.33, 0.70]], 0.012, 16, 6), MAT.copper, { d: 'Hoogspanningskabel van de aansluiting naar de batterij.', ex: [0.08, 0.06, 0] }),
  ]);
}
function buildElectrical() {
  return A('Elektrisch systeem', {
    d: 'Tractiebatterij van 52 kWh onder de vloer, met BMS, een DC-DC-omzetter en een 12V-accu. De oktoberupdate van 2026 laat de nettocapaciteit gelijk en haalt meer actieradius uit stroomlijn en elektronica.',
    spec: [['Tractiebatterij', '52 kWh NMC'], ['Spanning', '400 V'], ['Actieradius WLTP', '430 km']],
    ex: [0, 0.25, 0],
  }, [
    A('Tractiebatterij', { d: 'Vloerbatterij tussen de assen. De cellen zitten in het huis en zijn pas zichtbaar als de groep open gaat.', ex: [0, -0.2, 0] }, [
      P('Batterijhuis', G.rbox(1.2, 0.10, 1.25, 0.02), MAT.alu, { d: 'Aluminium huis van de batterij, onder de vloer.', p: [0, 0.272, 0.02], ex: [0, -0.08, 0] }),
      P('Celmodule', G.box(0.9, 0.05, 0.9), MAT.ecu, { d: 'Modules met NMC-cellen. De indeling in het huis is schematisch.', p: [0, 0.272, 0.02], ex: [0, 0.1, 0], inner: true }),
      P('BMS', G.rbox(0.12, 0.06, 0.03, 0.006), MAT.ecu, { d: 'Batterijbeheer op de voorkant van het huis.', p: [0.4, 0.272, 0.66], ex: [0.08, 0.06, 0] }),
    ]),
    P('DC-DC-omzetter', G.rbox(0.18, 0.07, 0.12, 0.008), MAT.alu, { d: 'Omzetter van de tractiespanning naar 12 V.', p: [0.28, 0.55, 1.25], ex: [0.12, 0.08, 0] }),
    P('Accu 12 V', G.rbox(0.2, 0.14, 0.12, 0.01), MAT.plastic, { d: '12V-accu in de voorste ruimte, voor de boordnetten.', p: [-0.36, 0.5, 1.55], ex: [-0.12, 0.08, 0] }),
    P('Zekeringkast', G.rbox(0.14, 0.06, 0.08, 0.006), MAT.plastic, { d: 'Zekeringkast naast de 12V-accu.', p: [-0.36, 0.62, 1.42], ex: [-0.08, 0.08, 0] }),
  ]);
}
function buildCar() {
  const car = A(AUTO.wortel, {
    d: 'Renault 5 E-Tech electric, modeljaar 2026, uitvoering Techno Comfort Range: Pop-geel, zwart dak, fremderregte motor van 110 kW en een batterij van 52 kWh. Klik op een onderdeel om het uit te klappen, dubbelklik om erheen te gaan, rechtsklik of houd vast om in te klappen. Wissel met O naar Openen voor de kap, de portieren, de klep en de laadklep.',
    spec: [['Uitvoering', 'Techno Comfort Range (MY26)'], ['Carrosserie', '5-deurs hatchback'], ['Platform', 'AmpR Small'], ['Motor', '6AK, 110 kW (150 pk)'], ['Batterij', '52 kWh'], ['Aandrijving', 'Voorwiel, 1 verhouding'], ['WLTP', 'tot 430 km (Comfort Range)'], ['L × H', '3.922 × 1.498 mm'], ['Breedte met spiegels', '2.020 mm'], ['Wielbasis', '2.540 mm'], ['Laadklep', 'Op de motorkap, links']],
  }, [buildBody(), buildInterior(), buildPowertrain(), buildChassis(), buildCooling(), buildExhaust(), buildFuel(), buildElectrical()]);
  const set = (name, v) => { const n = car.kids.find(k => k.name === name) || car.kids.find(k => k.name === 'Onderstel').kids.find(k => k.name === name); if (n) n.ex = V3(...v); };
  set('Carrosserie', [0, 1.55, 0]);
  set('Interieur', [0, 0.7, -0.15]);
  set('Aandrijflijn', [0, 0.4, 0.9]);
  set('Onderstel', [0, -0.5, 0]);
  set('Koeling en luchtinlaat', [0, 0.22, 0.55]);
  set('Uitlaatsysteem', [0.2, -0.4, -0.35]);
  set('Brandstofsysteem', [0.4, 0.2, 0.5]);
  set('Elektrisch systeem', [-0.35, 0.15, 0]);
  set('Vooras en stuurinrichting', [0, -0.3, 0.2]);
  set('Achteras', [0, -0.3, -0.2]);
  set('Wielen', [0, 0.4, 0]);
  set('Remsysteem', [0, 0.15, 0]);
  return car;
}
