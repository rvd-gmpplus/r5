/* ===================== aandrijfassen ===================== */
function drvShaft(s) {
  const hub = [s * 0.64, AY, AXF], box = [s * 0.12, 0.35, 1.22];
  const mid = [(hub[0] + box[0]) / 2, (hub[1] + box[1]) / 2, (hub[2] + box[2]) / 2];
  return A(`Aandrijfas ${sideName(s)}`, {
    d: 'Aandrijfas met een homokineet aan de bak en een homokineet aan de naaf.',
    ex: [s * 0.15, -0.12, 0.05],
  }, [
    P('As', rodBetween(box, hub, 0.014, 10), MAT.steel, { d: 'Stalen as tussen de twee koppelingen.', ex: [0, 0.06, 0] }),
    P('Homokineet bak', G.sphere(0.04, 12), MAT.darkSteel, { d: 'Homokinetische koppeling aan de reductiebak.', p: box, ex: [s * -0.06, 0, -0.04] }),
    P('Homokineet wiel', G.sphere(0.045, 12), MAT.darkSteel, { d: 'Homokinetische koppeling in de naaf.', p: hub, ex: [s * 0.08, 0, 0.04] }),
    P('Stofhoes', G.cyl('z', 0.028, 0.02, 0.07, 10), MAT.rubber, { d: 'Rubber hoes over de askant van de wielkoppeling.', p: mid, ex: [0, 0.05, 0] }),
  ]);
}
function drvShafts() {
  return A('Aandrijfassen', {
    d: 'Linker en rechter aandrijfas van de reductiebak naar de voorwielen.',
    ex: [0, -0.2, 0.15],
  }, [drvShaft(1), drvShaft(-1)]);
}
