/* ===================== aandrijflijn: omvormer ===================== */
function engInverter() {
  const p = [0.02, 0.70, 1.42];
  return A('Omvormer', {
    d: 'Omvormer bovenop de motor. Hij maakt van de gelijkspanning van de batterij de draaistroom voor de motor.',
    ex: [0.2, 0.22, 0],
  }, [
    P('Omvormerhuis', G.rbox(0.32, 0.08, 0.22, 0.01), MAT.alu, { d: 'Aluminium huis van de omvormer met koelribben aan de onderkant.', p, ex: [0, 0.04, 0] }),
    P('Gelijkstroomkast', G.rbox(0.1, 0.06, 0.08, 0.008), MAT.plastic, { d: 'Aansluitkast voor de hoogspanningskabels vanaf de batterij.', p: [p[0] - 0.16, p[1], p[2]], ex: [-0.1, 0.06, 0] }),
    P('Stuurprint', G.box(0.22, 0.006, 0.14), MAT.ecu, { d: 'Stuurprint in het huis. De componenten zijn niet apart getekend.', p: [p[0], p[1] + 0.01, p[2]], ex: [0, 0.08, 0], inner: true }),
  ]);
}
