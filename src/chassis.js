/* ===================== onderstel: McPherson voor, torsieas achter, 195/55 R18 ===================== */
// halve spoorbreedte voor en achter, wielmidden tot wielmidden (spoor 1.548 en 1.532 mm, Renault NL prijslijst)
const CHS_TRACK_F = 0.774, CHS_TRACK_R = 0.766;

function chsWheel(s, front) {
  const p = [s * (front ? CHS_TRACK_F : CHS_TRACK_R), AY, front ? AXF : AXR];
  const name = `Wiel ${sideName(s)}${front ? 'voor' : 'achter'}`;
  return A(name, { d: 'Lichtmetalen wiel met band 195/55 R18. De bandmaat staat op het Britse gegevensblad van de 90 kW; de Techno rijdt op dezelfde maat.', ex: [s * 0.28, 0.05, 0] }, [
    P('Band', G.cyl('x', AY, AY, 0.195, 28), MAT.rubber, { d: 'Band 195/55 R18.', p, ex: [s * 0.06, 0, 0] }),
    P('Velg', G.cyl('x', 0.21, 0.21, 0.16, 20), MAT.alu, { d: 'Lichtmetalen velg, 18 inch, met een gesloten gezicht.', p, ex: [s * 0.1, 0, 0] }),
    P('Wielbout', G.cyl('x', 0.012, 0.012, 0.04, 6), MAT.steel, { d: 'Eén bout als vertegenwoordiger van de wielbouten.', p: [p[0] + s * 0.02, p[1] + 0.08, p[2]], ex: [s * 0.08, 0.04, 0] }),
    P('Naafdop', G.cyl('x', 0.04, 0.04, 0.02, 12), MAT.plastic, { d: 'Naafdop in het midden van de velg.', p: [p[0] + s * 0.09, p[1], p[2]], ex: [s * 0.08, 0, 0] }),
    P('Ventiel', G.cyl('y', 0.006, 0.006, 0.03, 8), MAT.rubber, { d: 'Ventiel in de velg.', p: [p[0], p[1] + 0.2, p[2]], ex: [0, 0.08, 0] }),
  ]);
}
function chsCorner(s) {
  const x = s * (CHS_TRACK_F - 0.11), z = AXF;
  return A(`Wielophanging ${sideName(s)}voor`, {
    d: 'McPherson-veerpoot met draagarm en spoorstang.',
    ex: [s * 0.2, -0.15, 0.08],
  }, [
    P('Draagarm', G.box(0.42, 0.03, 0.06), MAT.iron, { d: 'Onderste draagarm van de vooras.', p: [s * 0.46, 0.22, z], ex: [0, -0.1, 0] }),
    P('Fusee', G.box(0.06, 0.12, 0.08), MAT.iron, { d: 'Fusee tussen draagarm, veerpoot en naaf.', p: [x, 0.30, z], ex: [s * 0.06, 0, 0] }),
    P('Veer', spring(0.045, 0.008, 0.28, 6, 'y'), MAT.darkSteel, { d: 'Schroefveer om de demper.', p: [s * 0.55, 0.58, z], ex: [0, 0.16, 0] }),
    P('Demper', G.cyl('y', 0.022, 0.022, 0.32, 12), MAT.steel, { d: 'Schokdemper in de veer.', p: [s * 0.55, 0.58, z], ex: [s * 0.06, 0.1, 0] }),
    P('Spoorstang', rodBetween([s * 0.15, 0.28, z + 0.04], [x, 0.28, z], 0.01, 8), MAT.steel, { d: 'Spoorstang van het stuurhuis naar de fusee.', ex: [0, 0.06, 0.06] }),
  ]);
}
function buildFrontAxle() {
  return A('Vooras en stuurinrichting', {
    d: 'McPherson-vooras met een elektrische tandheugel. De spoorbreedte in het model is een schatting binnen de carrosserie.',
    ex: [0, -0.35, 0.25],
  }, [
    chsCorner(1), chsCorner(-1),
    A('Stuurinrichting', { d: 'Elektrisch bekrachtigde tandheugel, vast aan het subframe.', ex: [0, -0.12, 0.12] }, [
      P('Stuurhuis', G.cyl('x', 0.035, 0.035, 0.7, 16), MAT.aluCast, { d: 'Tandheugelhuis over de breedte van het subframe.', p: [0, 0.28, AXF + 0.06], ex: [0, -0.08, 0.08] }),
      P('Stuurmotor', G.cyl('z', 0.04, 0.04, 0.12, 14), MAT.alu, { d: 'Elektromotor van de bekrachtiging op het stuurhuis.', p: [0.12, 0.32, AXF + 0.08], ex: [0.08, 0.08, 0] }),
    ]),
    P('Subframe voor', G.box(1.05, 0.06, 0.4), MAT.iron, { d: 'Subframe van de vooras, onder de motor.', p: [0, 0.2, 1.25], ex: [0, -0.16, 0] }),
  ]);
}
function buildRearAxle() {
  return A('Achteras', {
    d: 'Torsieas met langsarmen, schroefveren en dempers. Geen aangedreven achterwielen.',
    ex: [0, -0.35, -0.25],
  }, [
    P('Torsiebalk', G.box(1.30, 0.07, 0.08), MAT.iron, { d: 'Dwarse torsiebalk tussen de langsarmen.', p: [0, 0.24, AXR + 0.12], ex: [0, -0.12, 0] }),
    ...[1, -1].map(s => A(`Langsarm ${sideName(s)}`, { d: 'Langsarm van de achteras.', ex: [s * 0.12, -0.08, -0.08] }, [
      P('Arm', G.box(0.06, 0.05, 0.42), MAT.iron, { d: 'Langsarm van de torsieas naar de naaf.', p: [s * (CHS_TRACK_R - 0.12), 0.26, AXR + 0.1], ex: [s * 0.06, 0, 0] }),
      P('Veer achter', spring(0.04, 0.007, 0.24, 6, 'y'), MAT.darkSteel, { d: 'Schroefveer naast de langsarm.', p: [s * 0.48, 0.42, AXR + 0.02], ex: [0, 0.14, 0] }),
      P('Demper achter', G.cyl('y', 0.02, 0.02, 0.3, 10), MAT.steel, { d: 'Schokdemper van de achteras.', p: [s * 0.5, 0.45, AXR - 0.05], ex: [s * 0.05, 0.08, 0] }),
    ])),
  ]);
}
function chsCaliper(s) {
  const p = [s * (CHS_TRACK_F - 0.005), AY + 0.05, AXF + 0.11];
  return A(`Remklauw ${sideName(s)}voor`, { d: 'Zwevende remklauw op een geventileerde schijf.', ex: [s * 0.08, 0.08, 0.06] }, [
    P('Remschijf', G.cyl('x', 0.148, 0.148, 0.026, 24), MAT.iron, { d: 'Geventileerde remschijf voor. Het Britse blad van de 90 kW noemt 296 mm bij 26 mm; die maat is hier overgenomen als huis, niet als losse bevestiging voor de 110 kW.', p: [s * CHS_TRACK_F, AY, AXF], ex: [s * 0.05, 0, 0] }),
    P('Remklauwhuis', G.box(0.05, 0.08, 0.12), MAT.iron, { d: 'Huis van de remklauw.', p, ex: [0, 0.06, 0] }),
    P('Remblok', G.box(0.012, 0.05, 0.09), MAT.friction, { d: 'Remblok tegen de schijf.', p: [p[0] - s * 0.014, p[1], p[2]], ex: [s * -0.04, 0, 0], inner: true }),
  ]);
}
function buildBrakeSystem() {
  return A('Remsysteem', {
    d: 'Schijfremmen voor en trommels achter, plus een elektrische parkeerrem op de achteras. De trommelmaat is niet voor deze uitvoering apart bevestigd.',
    ex: [0, 0.2, 0],
  }, [
    chsCaliper(1), chsCaliper(-1),
    ...[1, -1].map(s => P(`Remtrommel ${sideName(s)}`, G.cyl('x', 0.12, 0.12, 0.06, 20), MAT.iron, { d: 'Remtrommel achter.', p: [s * CHS_TRACK_R, AY, AXR], ex: [s * 0.08, 0, 0] })),
    P('Parkeerremmotor', G.rbox(0.08, 0.05, 0.06, 0.008), MAT.ecu, { d: 'Motor van de elektrische parkeerrem op de achteras.', p: [0.2, 0.3, AXR + 0.05], ex: [0.08, 0.06, 0] }),
  ]);
}
function buildChassis() {
  const wheels = A('Wielen', { d: 'Vier wielen, 195/55 R18.', ex: [0, 0.35, 0] }, [chsWheel(1, true), chsWheel(-1, true), chsWheel(1, false), chsWheel(-1, false)]);
  return A('Onderstel', {
    d: 'Onderstel op het platform AmpR Small: McPherson voor, torsieas achter, elektrische stuurbekrachtiging.',
    spec: [['Vooras', 'McPherson'], ['Achteras', 'Torsieas'], ['Banden', '195/55 R18']],
    ex: [0, -0.5, 0],
  }, [buildFrontAxle(), buildRearAxle(), wheels, buildBrakeSystem()]);
}
