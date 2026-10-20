/* ===================== interieur: OpenR, vijf zitplaatsen ===================== */
function intSeat(name, x, z, sport) {
  const y = 0.48;
  return A(name, { d: sport ? 'Voorstoel met geïntegreerde hoofdsteun.' : 'Zitplaats van de achterbank.', ex: [x > 0 ? 0.15 : -0.15, 0.2, 0] }, [
    P('Zitting', G.rbox(0.46, 0.1, 0.46, 0.03), MAT.fabric, { d: 'Zitting, bekleed.', p: [x, y, z], ex: [0, 0.06, 0.08] }),
    P('Rugleuning', G.rbox(0.46, 0.5, 0.08, 0.03), MAT.fabric, { d: 'Rugleuning.', p: [x, y + 0.28, z - 0.2], ex: [0, 0.1, -0.06] }),
    P('Hoofdsteun', G.rbox(0.2, 0.14, 0.08, 0.02), MAT.fabric, { d: 'Hoofdsteun op de rugleuning.', p: [x, y + 0.58, z - 0.2], ex: [0, 0.12, 0] }),
    P('Gele bies', G.box(0.4, 0.008, 0.36), MAT.paint, { d: 'Gele bies in de zitting, in de kleur van de lak.', p: [x, y + 0.05, z], ex: [0, 0.05, 0] }),
  ]);
}
function buildInterior() {
  return A('Interieur', {
    d: 'Interieur met twee schermen naast elkaar (OpenR), een stuur links en vijf zitplaatsen. De bekleding is donker met een gele bies.',
    spec: [['Schermen', 'twee schermen van 10 inch (OpenR)'], ['Zitplaatsen', '5']],
    ex: [0, 0.7, -0.15],
  }, [
    P('Vloerbedekking', G.box(1.35, 0.02, 1.7), MAT.carpet, { d: 'Vloerbedekking boven de batterij.', p: [0, 0.34, -0.05], ex: [0, 0.08, 0] }),
    A('Dashboard', { d: 'Dashboard met het instrumentenpaneel en het aanraakscherm in één horizontale rij.', ex: [0, 0.15, 0.2] }, [
      P('Dashboarddrager', G.box(1.15, 0.16, 0.22), MAT.dash, { d: 'Zachte bovenkant van het dashboard.', p: [0, 0.80, 0.72], ex: [0, 0.08, 0.06] }),
      P('Instrumentenscherm', G.box(0.24, 0.12, 0.012), MAT.screen, { d: 'Digitaal instrumentenpaneel voor de bestuurder, onderdeel van OpenR.', p: [0.34, 0.9, 0.9], ex: [0, 0.08, 0.06] }),
      P('Middenscherm', G.box(0.24, 0.13, 0.012), MAT.screen, { d: 'Aanraakscherm in het midden, onderdeel van OpenR.', p: [-0.02, 0.9, 0.9], ex: [0, 0.08, 0.08] }),
      P('Stuurwiel', G.torus('z', 0.16, 0.016, 18, 8), MAT.leather, { d: 'Stuurwiel links, voor een auto met het stuur links.', p: [0.36, 0.84, 0.62], ex: [0.1, 0.06, 0.08] }),
      P('Stuurkolom', G.cyl('z', 0.02, 0.02, 0.22, 10), MAT.plastic, { d: 'Stuurkolom van het stuur naar het stuurhuis.', p: [0.36, 0.78, 0.78], ex: [0, -0.04, 0.06] }),
    ]),
    A('Stoelen', { d: 'Twee voorstoelen en een achterbank voor drie.', ex: [0, 0.35, 0] }, [
      intSeat('Bestuurdersstoel', 0.36, 0.2, true),
      intSeat('Bijrijdersstoel', -0.36, 0.2, true),
      intSeat('Achterbank links', 0.36, -0.55, false),
      intSeat('Achterbank midden', 0, -0.55, false),
      intSeat('Achterbank rechts', -0.36, -0.55, false),
    ]),
    P('Hemel', G.box(0.28, 0.012, 0.7), MAT.fabric, { d: 'Hemelbekleding onder het midden van het dak.', p: [0, 1.18, -0.05], ex: [0, 0.08, 0] }),
    P('Stuurpedaal', G.box(0.05, 0.012, 0.12), MAT.rubber, { d: 'Stuurpedaal. Er is geen koppeling.', p: [0.42, 0.36, 0.55], ex: [0, 0.05, 0.06] }),
    P('Rempedaal', G.box(0.06, 0.012, 0.1), MAT.rubber, { d: 'Rempedaal links van het stroompedaal.', p: [0.32, 0.36, 0.55], ex: [0, 0.05, 0.06] }),
  ]);
}
