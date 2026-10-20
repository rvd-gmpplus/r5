/* ===================== aandrijflijn: motor 6AK en reductie ===================== */
// Fremderregte synchroonmotor, dwars voorin, met een vaste reductie. Maten van het huis zijn schematisch.

function engMotor() {
  const c = [0.02, 0.46, 1.38];
  return A('Motor 6AK', {
    d: 'Fremderregte synchroonmotor 6AK, dwars voorin. 110 kW (150 pk) bij de Comfort Range van 52 kWh. Het huis is een gesloten gietstuk; stator, rotor en resolver zitten erin en zijn pas zichtbaar als de groep open gaat.',
    spec: [['Type', 'Fremderregte synchroonmotor'], ['Code', '6AK'], ['Vermogen', '110 kW (150 pk)'], ['Plaats', 'Dwars, voorin']],
    ex: [0, 0.35, 0.2],
  }, [
    P('Motorhuis', G.rbox(0.52, 0.32, 0.34, 0.03), MAT.aluCast, { d: 'Aluminium huis van de motor, dwars op de rijrichting.', p: c, ex: [0, 0.05, 0] }),
    P('Stator', G.cyl('x', 0.145, 0.145, 0.22, 28), MAT.iron, { d: 'Statorblik met wikkelingen. De wikkelkoppen zijn tot één ring vereenvoudigd.', p: c, ex: [0, 0.16, 0], inner: true }),
    P('Rotor', G.cyl('x', 0.08, 0.08, 0.24, 24), MAT.darkSteel, { d: 'Rotor van de fremderregte machine. Er zitten geen permanente magneten in.', p: c, ex: [0.22, 0.1, 0], inner: true }),
    P('As', G.cyl('x', 0.018, 0.018, 0.4, 12), MAT.steel, { d: 'Rotoras, uitkomend aan de kant van de reductie.', p: [c[0] + 0.02, c[1], c[2]], ex: [0.3, 0, 0], inner: true }),
    P('Resolver', G.cyl('x', 0.04, 0.04, 0.03, 16), MAT.ecu, { d: 'Resolver op de as voor de stand van de rotor.', p: [c[0] - 0.2, c[1], c[2]], ex: [-0.12, 0.06, 0], inner: true }),
    P('Klemmenkast', G.rbox(0.14, 0.08, 0.1, 0.01), MAT.plastic, { d: 'Klemmenkast bovenop het huis, waar de fasen van de omvormer aankomen.', p: [c[0], c[1] + 0.18, c[2]], ex: [0, 0.14, 0] }),
    P('Koelmantel', G.box(0.48, 0.04, 0.3), MAT.alu, { d: 'Koelmantel om de stator. De koelvloeistof komt uit het voorste koelpakket.', p: [c[0], c[1] - 0.14, c[2]], ex: [0, -0.1, 0] }),
  ]);
}
function engReductor() {
  const c = [0.02, 0.40, 1.22];
  return A('Reductiebak', {
    d: 'Vaste tandwielreductie tussen motor en differentieel, met één verhouding. De tanden zijn schematisch.',
    ex: [-0.28, 0.12, -0.1],
  }, [
    P('Bakhuis', G.rbox(0.28, 0.26, 0.22, 0.02), MAT.aluCast, { d: 'Aluminium huis van de reductie, tegen de motor.', p: c, ex: [0, 0.08, 0] }),
    P('Primair tandwiel', gear(22, 0.07, 0.055, 0.03, 0.02, 'x'), MAT.steel, { d: 'Tandwiel op de motoras.', p: [c[0], c[1] + 0.04, c[2]], ex: [0.1, 0.08, 0], inner: true }),
    P('Secundair tandwiel', gear(40, 0.11, 0.09, 0.03, 0.025, 'x'), MAT.steel, { d: 'Groot tandwiel op de differentieelas.', p: [c[0], c[1] - 0.05, c[2]], ex: [-0.1, -0.06, 0], inner: true }),
    P('Differentieelhuis', G.cyl('x', 0.07, 0.07, 0.1, 20), MAT.iron, { d: 'Huis van het differentieel in de reductiebak.', p: [c[0], c[1] - 0.05, c[2] + 0.02], ex: [0, -0.12, 0.08], inner: true }),
    P('Olievulplug', G.cyl('y', 0.01, 0.01, 0.02, 8), MAT.steel, { d: 'Plug bovenop de bak.', p: [c[0], c[1] + 0.14, c[2]], ex: [0, 0.1, 0] }),
  ]);
}
function buildPowertrain() {
  return A('Aandrijflijn', {
    d: 'Voorwielaandrijving: motor 6AK, reductiebak met differentieel, en twee aandrijfassen. Er is geen versnellingsbak met meerdere trappen.',
    ex: [0, 0.4, 0.9],
  }, [engMotor(), engReductor(), drvShafts(), engInverter()]);
}
