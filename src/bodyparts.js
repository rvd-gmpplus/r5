/* ===================== carrosserie: panelen uit het geloft vlak ===================== */
// Elk paneel is een stuk van de onderbak (bodLow, s per z) of van de kas (bodGhHalf, q per z) uit body.js. Naden zijn
// spleten van 4 tot 6 mm tussen buurpanelen, zodat de huid gesloten leest en een opener langs zijn naad vrij draait.
const bodGS = 0.003;                                   // naad in s op de flank (ongeveer 5 mm)
const bodZFD = 0.742, bodZB = -0.286, bodZRD = -0.99;  // voorrand voorportier, naad tussen de portieren, achterrand achterportier
const bodSH = bodS4 - 0.02;                               // zijrand van motorkap en neusband op de schouder
const bodYSill = 0.30;                                 // bovenrand van de zwarte dorpel
const bodYBF = 0.56, bodYBR = 0.56;                    // naad bumper en scherm voor en achter
const bodXTG = z => Math.min(0.60, bodSec(z).xe * 0.9);           // zijrand van de achterklep onder de ruit
const bodSTG = z => bodSAtX(z, bodXTG(z));
// rand van de achterruit in q: aan het dakeinde over de volle breedte, naar onderen smaller tot |x| 0,60
function bodQScr(z) {
  const t = clamp((bodRW0 - z) / (bodRW0 - bodSP), 0, 1), g = bodGh(z), x0 = bodGh(bodRW0).xr - 0.006, xe = lerp(x0, 0.60, bodSstep(t));
  return bodQR + (1 - bodQR) * clamp(1 - xe / Math.max(1e-4, g.xr), 0.004, 0.9);
}
// onderrand van het achterportier: boven de dorpel, en boven de wielkastrand waar die eronder komt
const bodRDlo = z => Math.max(bodYSill, bodFlareTop(z) > 0 ? bodFlareTop(z) + 0.016 : 0);
// achterrand van de ruit in het achterportier: schuin naar voren met de C-stijl, van z bodDLO0 op de gordel tot bodDLO1 aan de
// bovenrand; de gordel loopt naar achteren iets op (bodQBelt)
const bodDLO0 = -0.975, bodDLO1 = -0.86;
const bodQTrail = z => bodQG * clamp((z - bodDLO0) / (bodDLO1 - bodDLO0), 0, 1);
const bodQBelt = z => 0.004 + 0.07 * bodSstep((-0.84 - z) / (-0.84 - bodDLO0));
// punt op de kas bij |x| op z (dak, voor- of achterruit), via bisectie over q van bodQR tot de hartlijn
function bodKasAtX(z, x) {
  let a = bodQR, b = 1; const g = bodGh(z);
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (bodGhHalf(z, m, g)[0] > x) a = m; else b = m; }
  return bodGhHalf(z, (a + b) / 2, g);
}
const bodDense = (a, b, n) => { const out = []; for (let i = 1; i < n; i++) out.push(a + (b - a) * i / n); return out; };

// wielkastrand: zwart generfde flens van r = bodARCH tot bodARCH + bodFLW. Aan de wielkast staat hij bodFLT buiten de huid; naar
// buiten loopt hij als een heup glad terug in het scherm, zodat er geen losse ring met een spleet ertussen leest
const bodFlareOut = t => bodFLT * Math.pow(Math.cos(clamp(t, 0, 1) * HALF), 1.4) + 0.0012;
function bodFlare(s, az) {
  const top = bodPatch((a, t) => {
    const r = bodARCH + t * bodFLW, z = az + r * Math.cos(a), y = AY + r * Math.sin(a);
    const p = bodAt(z, Math.max(y, YB(z) + 0.01), bodFlareOut(t)); return [s * p[0], p[1], p[2]];
  }, -0.22, PI + 0.22, 56, () => [0, 1], 8);
  // binnenrand: van de buitenkant van de flens recht naar binnen tot achter de huid, zodat de snijrand van het scherm niet te zien is
  const lip = bodPatch((a, t) => {
    const z = az + bodARCH * Math.cos(a), y = Math.max(AY + bodARCH * Math.sin(a), YB(z) + 0.01), p = bodAt(z, y, bodFlareOut(0)); return [s * (p[0] - t * 0.07), p[1], p[2]];
  }, -0.22, PI + 0.22, 40, () => [0, 1], 1);
  return merge([top, lip]);
}
// binnenkap van een wielkast: cilinderstuk van x 0,60 tot net binnen de huid, onder de as door tot de onderrand van de carrosserie,
// zodat je van opzij niet langs het wiel de motorruimte of de vloer in kijkt
function bodLiner(s, az) {
  const r = bodARCH + 0.006;
  return bodPatch((a, x) => { const z = az + r * Math.cos(a); return [s * x, Math.max(AY + r * Math.sin(a), YB(z) + 0.004), z]; }, -0.48, PI + 0.48, 48, () => [0.60, 0.83], 3);
}
// rand tussen buitenhuid en binnenbekleding op een vaste z (voor- of achterkant van een portier of klep)
function bodEdgeZ(s, z, s0, s1, off, nv = 16, zIn = z) {
  return bodPatch((v, t) => { const a = bodLow(z, v), b = bodLow(zIn, v, off); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }, ...bodSideR(s, s0, s1), nv, () => [0, 1], 1);
}
// rand langs de onderkant van een portier (s = lo(z))
function bodEdgeS(s, z0, z1, lo, off, nu = 30, loIn = lo) {
  return bodPatch((z, t) => { const v = bodSideR(s, lo(z), lo(z))[0], w = bodSideR(s, loIn(z), loIn(z))[0], a = bodLow(z, v), b = bodLow(z, w, off); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }, z0, z1, nu, () => [0, 1], 1);
}
// vlak op de huid tussen twee hoogtes per z, met afstand out naar buiten (lampen, plaatshouders voor golf 3)
function bodSkinPatch(s, z0, z1, y0, y1, out, nu = 14, nv = 6) {
  return bodPatch((z, y) => { const p = bodAt(z, y, out); return [s * p[0], p[1], p[2]]; }, z0, z1, nu, z => [y0(z), y1(z)], nv);
}

function bodLamp(s) {
  // plaatshouder: smalle lamp op de hoek onder de voorrand van de kap; vorm en pupil volgen in golf 3
  const y0 = z => lerp(0.735, 0.70, (z - 1.70) / 0.21), y1 = z => Math.min(YT(z) - 0.012, lerp(0.83, 0.765, (z - 1.70) / 0.21));
  return A(`Koplamp ${sideName(s)}`, { d: 'Smalle koplamp op de hoek van het voorscherm, onder de voorrand van de motorkap. Plaatshouder: de pupilvorm en de lampen in de bumper volgen later.', ex: [s * 0.14, 0.04, 0.16] }, [
    P('Huis', bodSkinPatch(s, 1.70, 1.91, y0, y1, 0.003), MAT.bodLamp, { d: 'Zwart huis van de koplamp in de hoek van scherm en bumper.', ex: [s * 0.04, 0, 0.03] }),
    P('Dagrijlicht', bodSkinPatch(s, 1.74, 1.89, z => y0(z) + 0.022, z => y1(z) - 0.022, 0.006, 10, 2), MAT.bodDRL, { d: 'Lichtgevende strook in het huis, het dagrijlicht.', ex: [s * 0.03, 0, 0.08] }),
    P('Lichtgeleider', bodSkinPatch(s, 1.705, 1.905, z => y0(z) + 0.004, z => y1(z) - 0.004, 0.009, 12, 3), MAT.lensClear, { d: 'Doorzichtige kap over de koplamp.', ex: [s * 0.02, 0, 0.05] }),
    P('Knipperlicht', bodSkinPatch(s, 1.78, 1.88, z => y0(z) - 0.024, z => y0(z) - 0.012, 0.003, 8, 1), MAT.amber, { d: 'Oranje strook onder de koplamp.', ex: [0, -0.04, 0.04] }),
  ]);
}
function bodTailLamp(s) {
  // plaatshouder: staand achterlicht op de hoek naast de klep; de lichtbladen volgen in golf 3
  const z0 = -1.95, z1 = -1.80, y0 = () => 0.80, y1 = z => YT(z) - 0.01;
  return A(`Achterlicht ${sideName(s)}`, { d: 'Staand achterlicht op de hoek naast de achterklep. Plaatshouder: de lichtbladen volgen later.', ex: [s * 0.12, 0.04, -0.12] }, [
    P('Huis achterlicht', bodSkinPatch(s, z0, z1, y0, y1, 0.003, 10, 8), MAT.bodLamp, { d: 'Zwart huis van het achterlicht.', ex: [s * 0.03, 0, 0] }),
    P('Lens', bodSkinPatch(s, z0 + 0.012, z1 - 0.012, z => 0.815, z => YT(z) - 0.025, 0.006, 8, 6), MAT.lensRed, { d: 'Rode lens van het achterlicht.', ex: [s * 0.02, 0, -0.06] }),
  ]);
}
function bodMirror(s) {
  // klassieke spiegel op een zwarte voet op de schouder van het voorportier; uitgeklapt tot 1.010 mm van de hartlijn
  const z = 0.655, piv = [s * 0.872, 1.03, z];
  const name = s > 0 ? 'Buitenspiegel links' : 'Buitenspiegel rechts';
  const foot = bodAt(z, YT(z) - 0.03, 0);
  return A(name, {
    d: 'Buitenspiegel met een zwarte kap op een korte voet aan de voet van het raam. Inklappen draait de kap naar achteren langs het portier.',
    ex: [s * 0.18, 0.08, 0],
    open: bodHinge(piv, [0, 1, 0], s > 0 ? 1.15 : -1.15, { label: s > 0 ? 'Spiegel links' : 'Spiegel rechts', look: { dir: [s, 0.35, 0.8], nodes: [name] } }),
  }, [
    P('Spiegelvoet', merge([rodBetween([s * (foot[0] - 0.01), foot[1], z], [s * 0.874, 1.05, z], 0.018, 10), xf(G.rbox(0.03, 0.05, 0.07, 0.01), [s * (foot[0] - 0.005), foot[1], z])]), MAT.bodPillar, { d: 'Korte zwarte voet van de spiegel op de schouder van het voorportier.', stay: true, ex: [s * 0.03, 0.03, 0] }),
    P('Spiegelkap', xf(G.rbox(0.14, 0.10, 0.12, 0.03), [s * 0.938, 1.075, z]), MAT.bodPillar, { d: 'Zwarte spiegelkap.', ex: [s * 0.06, 0.03, 0] }),
    P('Spiegelglas', xf(G.box(0.12, 0.08, 0.004), [s * 0.938, 1.075, z - 0.062]), MAT.lensClear, { d: 'Spiegelglas aan de achterkant van de kap.', ex: [0, 0, -0.04] }),
  ]);
}
function bodDoor(s, front) {
  const name = `Portier ${sideName(s)}${front ? 'voor' : 'achter'}`;
  const glass = `Zijruit ${sideName(s)}${front ? 'voor' : 'achter'}`;
  const z0 = front ? bodZB + 0.003 : bodZRD, z1 = front ? bodZFD : bodZB - 0.003;
  const gz0 = front ? bodZB + 0.03 : bodDLO0, gz1 = front ? bodZFD - 0.008 : bodZB - 0.03;
  const lo = front ? () => bodYSill + 0.004 : z => bodRDlo(z) + 0.004;
  const sLo = z => bodSAtY(z, lo(z)), IN = 0.085, CH = front ? 0.05 : 0.09;
  // achter loopt de onderrand van de bekleding 4,5 cm hoger dan die van de huid: boven de wielkast zakt de naad steil, en de binnenkant
  // schuift bij het openen een paar millimeter naar achteren
  const tLo = front ? sLo : z => bodSAtY(z, lo(z) + 0.045);
  const br = front ? [] : bodDense(-0.99, -0.86, 8);
  const pz = front ? bodZFD + 0.004 : bodZB - 0.0055;
  const ang = (s > 0 ? -1 : 1) * (front ? 1.15 : 1.05);
  const kids = [
    P('Buitenhuid', bodLowSide(s, z0, z1, front ? 48 : 40, z => [sLo(z), bodS4], 26, br), MAT.paint, { d: 'Buitenhuid van het portier, een stuk van de geloft flank tot de gordel, in dezelfde lak als de rest van de carrosserie.', ex: [s * 0.06, 0, 0] }),
    // de achterrand loopt schuin naar voren (CH), zodat de binnenkant bij het openen niet achter de naad door het scherm zwaait;
    // de bekleding stopt onder de schouder, zodat de zakkende ruit ertussen past
    P('Binnenplaat', merge([bodLowSide(s, z0 + CH, z1, 24, z => [tLo(z), bodS3 - 0.01], 12, br, IN), bodEdgeZ(s, z0, sLo(z0), bodS3 - 0.01, IN, 16, z0 + CH), bodEdgeZ(s, z1, sLo(z1), bodS3 - 0.01, IN), bodEdgeS(s, z0 + CH, z1, sLo, IN, 30, tLo)]), MAT.bodTrimIn, { d: 'Binnenplaat met de deurbekleding en de randen naar de buitenhuid; dicht verborgen, bij een open portier de binnenkant.', ex: [s * -0.05, 0, 0] }),
    P(glass, bodGhSide(s, gz0, gz1, 30, front ? () => [0.004, bodQG] : z => [bodQBelt(z), Math.max(bodQBelt(z), bodQTrail(z))], 10, front ? [] : [bodDLO1]), MAT.bodGlass, { d: 'Zijruit, gebogen in het vlak van de kas en verzonken in het raamkader. Bij openen zakt het glas in het portier.', ex: [s * 0.03, 0.08, 0], open: bodSlide([s * 0.035, -0.28, 0], { label: glass, look: { dir: [s * 0.9, 0.75, 0.1], nodes: [name] } }) }),
  ];
  if (front) {
    kids.push(P('Portiergreep', xf(G.rbox(0.02, 0.026, 0.15, 0.008), bodAt(0.40, 0.90, 0.008).map((v, i) => i ? v : s * v)), MAT.bodPillar, { d: 'Greep in de buitenhuid van het voorportier.', ex: [s * 0.06, 0.03, 0] }));
    kids.push(bodMirror(s));
  } else {
    // raamkader in lakkleur: de C-stijl loopt erin door boven de schuine achterrand van de ruit en onder de oplopende gordel
    kids.push(P('Raamkader', merge([
      bodGhSide(s, z0 + 0.006, bodDLO1, 16, z => [Math.min(bodQG, Math.max(bodQBelt(z), bodQTrail(z)) + 0.004), bodQG], 10, [bodDLO0], 0.001),
      bodGhSide(s, z0 + 0.006, -0.84, 16, z => [0.004, Math.max(0.004, bodQBelt(z) - 0.003)], 4, [bodDLO0], 0.001),
    ]), MAT.paint, { d: 'Raamkader van het achterportier in lakkleur, de voortzetting van de C-stijl boven en achter de ruit.', ex: [s * 0.04, 0.03, 0] }));
    kids.push(P('Verborgen greep', xf(G.box(0.008, 0.02, 0.06), [s * (bodGhHalf(-0.95, 0.32)[0] + 0.005), bodGhHalf(-0.95, 0.32)[1], -0.95]), MAT.blackGloss, { d: 'Greep in het raamkader achter de ruit, zodat de flank als één vlak leest.', ex: [s * 0.06, 0.03, 0] }));
  }
  return A(name, {
    d: front ? 'Voorportier met zijruit, greep en buitenspiegel, uit de flank gesneden van achter de voorwielkast tot de middenstijl. Het scharnier zit aan de voorrand.' : 'Achterportier met zijruit, uit de flank gesneden van de middenstijl tot boven de achterwielkast. De greep zit verborgen in het zwarte vlak achter de ruit.',
    ex: [s * 0.42, 0.04, 0],
    open: bodHinge([s * 0.875, 0.65, pz], [0, 1, 0], ang, { label: name, look: { dir: [s * 1.0, 0.65, front ? 0.45 : -0.2], nodes: [name] } }),
  }, kids);
}

function buildBody() {
  const L = 1, R = -1, both = f => [L, R].map(f);
  /* ---------- motorkap met laadklep ---------- */
  const fl = { z0: 1.30, z1: 1.52, x0: 0.08, x1: 0.40 };
  const hoodR = bodWS0 + 0.02, hoodF = 1.88;
  const hoodSkin = merge([
    bodDeck(hoodR, fl.z0, 14, () => bodSH, 40),
    bodPatch((z, p) => bodLow(z, p), fl.z0, fl.z1, 10, z => [bodSH, bodSAtX(z, fl.x1)], 6),
    bodPatch((z, p) => bodLow(z, p), fl.z0, fl.z1, 10, z => [bodSAtX(z, fl.x0), 2 - bodSH], 34),
    bodDeck(fl.z1, hoodF, 16, () => bodSH, 40),
  ]);
  const flapY = bodLow(1.30, bodSAtX(1.30, 0.24))[1];
  const motorkap = A('Motorkap', {
    d: 'Korte, bolle motorkap van de voorruitvoet tot boven de koplampen, een stuk van het dek van de geloft carrosserie. Links zit in deze versie nog de laadklep; de kap gaat om het scharnier bij de voorruit omhoog.',
    ex: [0, 0.28, 0.12],
    open: bodHinge([0, YD(hoodR) + 0.012, hoodR - 0.012], [1, 0, 0], -1.05, { label: 'Motorkap', look: { dir: [0.35, 0.9, 1.15], nodes: ['Motorkap'] } }),
  }, [
    P('Kapblad', hoodSkin, MAT.paint, { d: 'Buitenblad van de motorkap met de uitsparing voor de laadklep.', ex: [0, 0.06, 0] }),
    P('Binnenframe kap', merge([bodDeck(hoodR + 0.01, hoodF - 0.01, 10, () => bodSH + 0.01, 20, [], 0.03), bodEdgeZ(1, hoodF, bodSH, 1, 0.03, 10), bodEdgeZ(-1, hoodF, bodSH, 1, 0.03, 10)]), MAT.paintIn, { d: 'Binnenframe aan de onderkant van de kap, 3 cm onder het buitenblad, met de dempende mat erop.', ex: [0, -0.06, 0] }),
    P('Laadkom', xf(G.rbox(0.30, 0.04, 0.20, 0.01), [0.24, YD(1.41) - 0.05, 1.41]), MAT.plastic, { d: 'Kunststof kom onder de laadklep waarin de laadkabel aansluit.', ex: [0, -0.04, 0] }),
    A('Laadklep', {
      d: 'Klep links op de motorkap, uit het kapblad gesneden. Erachter zit de laadaansluiting. De klep kantelt om de achterrand omhoog.',
      ex: [0.16, 0.1, 0],
      open: bodHinge([0.24, flapY + 0.008, 1.30], [1, 0, 0], -1.15, { label: 'Laadklep', look: { dir: [0.7, 0.6, 1], nodes: ['Laadklep'] } }),
    }, [
      P('Klepblad', bodPatch((z, p) => bodLow(z, p), fl.z0 + 0.004, fl.z1 - 0.004, 10, z => [bodSAtX(z, fl.x1 - 0.004), bodSAtX(z, fl.x0 + 0.004)], 10), MAT.paint, { d: 'Buitenblad van de laadklep, in de lak van de kap.', ex: [0, 0.05, 0] }),
      P('Kleprand', bodPatch((z, p) => bodLow(z, p, 0.01), fl.z0 + 0.012, fl.z1 - 0.012, 6, z => [bodSAtX(z, fl.x1 - 0.012), bodSAtX(z, fl.x0 + 0.012)], 6), MAT.blackGloss, { d: 'Zwarte binnenkant van het klepblad.', ex: [0, -0.03, 0] }),
    ]),
  ]);
  /* ---------- achterklep ---------- */
  const rgB = bodSP + 0.07, rgT = bodRW0 - 0.06, rgQ = z => bodQScr(z) + 0.035;   // achterruit binnen de zwarte rand
  const wz = rgB + 0.03, wa = bodKasAtX(wz, 0.0), wb = bodKasAtX(wz, 0.34);    // wisser in rust onderaan de ruit
  const tgR = bodSP - 0.003, tgT = bodRW0 - 0.004, tgPv = [0, YR(bodRW0) + 0.012, bodRW0 + 0.012];
  const klep = A('Achterklep', {
    d: 'Achterklep van de hatchback met de schuine achterruit en de zwarte lip aan de dakrand, scharnierend aan het dakeinde.',
    ex: [0, 0.22, -0.16],
    open: bodHinge(tgPv, [1, 0, 0], 1.1, { label: 'Achterklep', look: { dir: [0.3, 0.75, -1.0], nodes: ['Achterklep'] } }),
  }, [
    P('Klepblad achter', bodDeck(ZR + 0.004, tgR, 24, bodSTG, 30), MAT.paint, { d: 'Buitenblad van de klep onder de achterruit, tussen de achterlichten.', ex: [0, 0.05, -0.05] }),
    P('Achterruit', bodGhTop(rgB, rgT, 20, rgQ, 26, [], 0.001), MAT.bodGlass, { d: 'Achterruit in de klep, kleiner dan de opening en omlijst door de zwarte rand onder de daklip; de C-stijlen lopen er breed naast.', ex: [0, 0.04, -0.05] }),
    P('Ruitrand achter', merge([bodGhTop(bodSP + 0.002, rgB, 4, bodQScr, 28), bodGhTop(rgT, tgT, 3, bodQScr, 28), ...[1, -1].map(s => bodGhSide(s, rgB, rgT, 16, z => [bodQScr(z), rgQ(z)], 2))]), MAT.bodPillar, { d: 'Zwarte rand om de achterruit, onder de daklip.', ex: [0, 0.03, -0.04] }),
    P('Spoilerlip', bodPatch((z, w) => { const sd = w <= 1 ? 1 : -1, q = w <= 1 ? w : 2 - w, [x, y] = bodGhHalf(bodRW0, q); return [sd * x * 0.99, y + 0.006 - (bodRW0 - z) * 0.12, z]; }, bodRW0 - 0.11, bodRW0 - 0.006, 4, () => [bodQR - 0.04, 2 - bodQR + 0.04], 24), MAT.bodRoof, { d: 'Zwarte lip aan de dakrand boven de achterruit.', ex: [0, 0.05, -0.04] }),
    P('Binnenbekleding klep', bodDeck(ZR + 0.02, tgR - 0.01, 10, z => bodSTG(z) + 0.01, 14, [], 0.03), MAT.bodTrimIn, { d: 'Bekleding aan de binnenkant van de klep.', ex: [0, -0.03, 0.05] }),
    P('Ruitenwisser achter', merge([rodBetween([0.0, wa[1] + 0.009, wz], [wb[0], wb[1] + 0.009, wz], 0.006, 8), xf(G.cyl('y', 0.018, 0.02, 0.016), [0, wa[1] + 0.006, wz])]), MAT.blackGloss, { d: 'Ruitenwisser in rust onderaan de achterruit, plat op het glas.', ex: [0.08, 0, -0.04] }),
  ]);
  /* ---------- vaste huid ---------- */
  const fenderLo = z => { if (Math.abs(z - AXF) <= bodARCH) return bodArchS(z); if (z > AXF + bodARCH) return bodSAtY(z, bodYBF) + bodGS; return bodSAtY(z, bodYSill); };
  const fenderHi = z => (z < hoodR ? bodS4 : bodSH - bodGS * 0.5);
  const fender = s => bodLowSide(s, bodZFD + 0.004, 1.70, 52, z => [fenderLo(z), fenderHi(z)], 26, bodARCH_BREAKS.concat([hoodR, AXF + bodARCH + 0.001]));
  const bumperF = merge([
    bodPatch((z, p) => bodLow(z, p), AXF + bodARCH, ZF, 28, z => { const a = z < 1.70 ? bodSAtY(z, bodYBF) : bodSH - bodGS * 0.5; return [-a, a]; }, 60, [1.70, 1.7005]),
    bodCap(ZF, undefined, undefined, 10, 24),
  ]);
  const qLo = z => { if (z < AXR - bodARCH) return bodSAtY(z, bodYBR) + bodGS; if (Math.abs(z - AXR) <= bodARCH) return bodArchS(z); return bodSAtY(z, bodYSill); };
  const qHi = z => { if (z > bodZRD - 0.004) return bodSAtY(z, bodRDlo(z)) - bodGS; if (z > bodSP) return bodS4; return bodSTG(z) - 0.0008; };
  const quarter = s => bodLowSide(s, ZR + 0.0002, AXR + bodARCH + bodFLW, 56, z => [qLo(z), Math.max(qLo(z), qHi(z))], 28, bodARCH_BREAKS.concat([bodZRD - 0.004, bodZRD - 0.0035, bodSP, AXR - bodARCH - 0.001], bodDense(bodZRD, AXR + bodARCH + bodFLW, 6), bodDense(ZR, ZR + 0.07, 10)));
  const bumperR = merge([
    bodPatch((z, p) => bodLow(z, p), ZR, AXR - bodARCH, 16, z => { const a = bodSAtY(z, bodYBR); return [-a, a]; }, 60, bodDense(ZR, ZR + 0.07, 10)),
    bodCap(ZR, undefined, undefined, 10, 24),
  ]);
  // kas: dak, A-stijlen, middenstijlen en C-stijlen volgen het vlak van de kas
  const roof = merge([
    bodGhTop(bodRW0, bodWS1, 40, () => bodQG + 0.004, 32),
    ...both(s => bodGhSide(s, bodWS1, bodWS0 - 0.003, 24, () => [bodQG + 0.004, bodQR], 6)),
  ]);
  // C-stijl in twee stukken zonder sprong in het raster: de band naast de zijruit tot de gordel, en daarboven de wig van de dakrand tot de achterruit
  const cPillar = s => merge([
    bodGhSide(s, bodSP, bodZRD - 0.004, 34, () => [0.0, bodQG + 0.002], 14),
    bodGhSide(s, bodSP, bodRW0, 24, z => [bodQG + 0.002, bodQScr(z) - 0.004], 12),
  ]);
  return A('Carrosserie', {
    d: 'Carrosserie van de Renault 5 E-Tech electric: vijfdeurs hatchback uit één geloft vlak, met korte bolle kap, hoog vlak zwart dak, ronde wielkasten met zwarte randen en de laadklep nog op de motorkap. Pop-geel met zwart dak.',
    ex: [0, 1.4, 0],
  }, [
    ...both(s => P(`Voorscherm ${sideName(s)}`, fender(s), MAT.paint, { d: 'Voorscherm van de voorwielkast tot de voorrand van het portier en de zijrand van de kap.', ex: [s * 0.12, 0.02, 0.08] })),
    P('Voorbumper', bumperF, MAT.paint, { d: 'Voorbumper in lakkleur met het stompe frontvlak tussen de koplampen.', ex: [0, -0.02, 0.12] }),
    P('Neusband', bodDeck(hoodF + 0.004, ZF - 0.002, 8, () => bodSH, 40), MAT.bodPillar, { d: 'Zwarte band op de neus tussen de koplampen, onder de voorrand van de kap. Plaatshouder voor de neusband met lampen.', ex: [0, 0.04, 0.1] }),
    P('Torpedoplaat', bodDeck(bodWS0 - 0.035, hoodR - 0.003, 4, () => bodS4 - 0.004, 32, [], 0.008), MAT.plastic, { d: 'Zwarte afdekplaat tussen de achterrand van de kap en de voorruit, met de wisserbak eronder.', ex: [0, 0.06, 0.06] }),
    ...both(s => P(`Achterscherm ${sideName(s)}`, quarter(s), MAT.paint, { d: 'Achterscherm van de achterwielkast tot de achterlichten en de zijrand van de klep.', ex: [s * 0.12, 0.02, -0.08] })),
    P('Achterbumper', bumperR, MAT.paint, { d: 'Achterbumper in lakkleur; het achtervlak sluit de staart af onder de klep.', ex: [0, -0.02, -0.12] }),
    P('Dak', roof, MAT.bodRoof, { d: 'Zwart dak, hoog en vlak, met de A-stijlen langs de voorruit en de dakranden boven de zijruiten.', ex: [0, 0.22, 0] }),
    ...both(s => P(`Raamvlak voor ${sideName(s)}`, bodGhSide(s, bodZFD + 0.004, bodWS0 - 0.003, 10, () => [0.0, bodQG + 0.004], 8), MAT.bodPillar, { d: 'Zwart driehoekig vlak tussen de voorrand van het voorportier en de A-stijl, achter de spiegel.', ex: [s * 0.08, 0.04, 0.04] })),
    ...both(s => P(`Middenstijl ${sideName(s)}`, bodGhSide(s, bodZB - 0.045, bodZB + 0.045, 6, () => [0.0, bodQG + 0.006], 10, [], 0.004), MAT.bodPillar, { d: 'Zwarte middenstijl tussen de zijruiten, iets buiten het glas.', ex: [s * 0.08, 0.06, 0] })),
    ...both(s => P(`C-stijl ${sideName(s)}`, cPillar(s), MAT.paint, { d: 'Brede C-stijl in lakkleur naast de achterruit, tot de schouder boven de achterlichten.', ex: [s * 0.1, 0.06, -0.04] })),
    P('Zeefdrukrand voorruit', merge([bodGhTop(bodWS1, bodWS1 + 0.09, 4, () => bodQR, 32, [], 0.0015), ...both(s => bodGhSide(s, bodWS1 + 0.09, bodWS0 - 0.003, 16, () => [bodQR, bodQR + 0.035], 2, [], 0.0012))]), MAT.bodPillar, { d: 'Zwarte zeefdrukrand op de bovenkant en de zijkanten van de voorruit, waarin het dak en de A-stijlen overgaan.', ex: [0, 0.14, 0.09] }),
    P('Voorruit', bodGhTop(bodWS1, bodWS0 - 0.003, 26, () => bodQR, 32), MAT.bodGlass, { d: 'Voorruit, steil en gebogen in het vlak van de kas, tussen de zwarte A-stijlen.', ex: [0, 0.12, 0.08] }),
    ...both(s => P(`Wielkastrand ${sideName(s)}voor`, bodFlare(s, AXF), MAT.bodGrain, { d: 'Zwarte generfde rand om de voorwielkast, bol buiten de flank.', ex: [s * 0.1, 0.02, 0.04] })),
    ...both(s => P(`Wielkastrand ${sideName(s)}achter`, bodFlare(s, AXR), MAT.bodGrain, { d: 'Zwarte generfde rand om de achterwielkast, bol buiten de flank.', ex: [s * 0.1, 0.02, -0.04] })),
    ...both(s => P(`Dorpel ${sideName(s)}`, bodLowSide(s, AXR + bodARCH + 0.004, AXF - bodARCH - 0.004, 40, z => [bodS1 * 0.6, bodSAtY(z, bodYSill)], 6, [], -0.006), MAT.bodGrain, { d: 'Zwarte dorpelbekleding onder de portieren, van wielkast tot wielkast.', ex: [s * 0.08, -0.06, 0] })),
    P('Onderlip voor', merge([bodPatch((z, p) => bodLow(z, p, -0.004), AXF + bodARCH + 0.004, ZF - 0.004, 12, z => { const a = bodSAtY(z, YB(z) + 0.09); return [-a, a]; }, 40), xf(bodCap(ZF, YB(ZF), YB(ZF - 0.004) + 0.09, 3, 24), [0, 0, 0.002])]), MAT.bodGrain, { d: 'Zwarte onderrand van de voorbumper.', ex: [0, -0.08, 0.08] }),
    P('Onderinlaat', xf(G.rbox(0.80, 0.11, 0.02, 0.01), [0, 0.40, ZF - 0.006]), MAT.plastic, { d: 'Zwarte luchtinlaat in de voorbumper. Plaatshouder; de afgeronde vierkanten volgen later.', ex: [0, -0.04, 0.06] }),
    P('Diffusor', merge([bodPatch((z, p) => bodLow(z, p, -0.004), ZR + 0.004, AXR - bodARCH - 0.004, 10, z => { const a = bodSAtY(z, YB(z) + 0.115); return [-a, a]; }, 40), xf(bodCap(ZR, YB(ZR), YB(ZR + 0.004) + 0.115, 3, 24), [0, 0, -0.002])]), MAT.bodGrain, { d: 'Zwarte onderrand van de achterbumper. Er is geen uitlaatpijp.', ex: [0, -0.08, -0.08] }),
    P('Kenteken voor', G.box(0.52, 0.11, 0.004), MAT.plateYellow, { d: 'Gele kentekenplaat voor. Het kenteken zelf staat er niet op.', p: [0, 0.55, ZF + 0.0005], ex: [0, -0.05, 0.06] }),
    P('Kenteken achter', G.box(0.52, 0.11, 0.004), MAT.plateYellow, { d: 'Gele kentekenplaat op de achterbumper. Het kenteken zelf staat er niet op.', p: [0, 0.55, ZR - 0.0005], ex: [0, -0.06, -0.04] }),
    // binnenwerk van de kooi: houdt motorruimte, wielkasten en bagageruimte dicht, zodat een open opener geen gat toont
    ...both(s => P(`Wielkast ${sideName(s)}voor`, bodLiner(s, AXF), MAT.bodArchIn, { d: 'Binnenkap van de voorwielkast.', ex: [s * 0.06, 0.04, 0] })),
    ...both(s => P(`Wielkast ${sideName(s)}achter`, bodLiner(s, AXR), MAT.bodArchIn, { d: 'Binnenkap van de achterwielkast.', ex: [s * 0.06, 0.04, 0] })),
    ...both(s => P(`Binnenscherm ${sideName(s)}`, merge([
      bodPatch((z, y) => [s * 0.61, y, z], 0.95, 1.84, 12, z => [0.24, YT(z) - 0.075], 4),
      bodPatch((z, x) => [s * x, YT(z) - 0.075, z], 0.95, 1.84, 12, z => [0.61, surfX(z, YT(z) - 0.075) - 0.006], 2),
    ]), MAT.bodArchIn, { d: 'Zijwand van de motorruimte met de schermrand erboven, tussen motorruimte en voorwielkast.', ex: [s * 0.1, 0.04, 0.04] })),
    P('Schutbord', G.box(1.22, 0.66, 0.012), MAT.paintIn, { d: 'Scheidingswand tussen motorruimte en interieur.', p: [0, 0.58, 0.95], ex: [0, 0.04, 0.06] }),
    P('Frontpaneel', G.box(1.22, 0.50, 0.02), MAT.plastic, { d: 'Kunststof frontmodule achter de bumper, met de bevestiging van koelpakket, koplampen en slot.', p: [0, 0.52, 1.84], ex: [0, 0.02, 0.1] }),
    P('Bagagevloer', G.box(1.21, 0.012, 1.05), MAT.carpet, { d: 'Vloer van de bagageruimte boven de achteras.', p: [0, 0.625, -1.425], ex: [0, 0.06, -0.04] }),
    ...both(s => P(`Zijwand bagageruimte ${sideName(s)}`, merge([
      bodPatch((z, y) => [s * 0.60, y, z], -1.95, -1.00, 12, z => [0.30, YT(z) - 0.03], 4),
      bodPatch((z, x) => [s * x, YT(z) - 0.03, z], -1.95, -1.00, 12, z => [0.60, surfX(z, YT(z) - 0.03) - 0.006], 2),
    ]), MAT.bodTrimIn, { d: 'Bekleding van de zijwand van de bagageruimte, over de achterwielkast.', ex: [s * 0.06, 0.04, -0.04] })),
    motorkap,
    bodDoor(1, true), bodDoor(-1, true), bodDoor(1, false), bodDoor(-1, false),
    klep,
    bodLamp(1), bodLamp(-1), bodTailLamp(1), bodTailLamp(-1),
  ]);
}
