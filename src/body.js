/* ===================== carrosserie: Renault 5 E-Tech electric, MY26 ===================== */
// Autoframe: x links, y omhoog vanaf de grond, z naar voren. Maten in meter.
// Lengte 3.922 mm, wielbasis 2.540 mm, overhang voor 749 mm en achter 633 mm (Renault).
// Halve breedte: 904 mm dekt de 1.808 mm met ingeklapte spiegels; spiegels tot 1.010 mm (2.020 mm uitgeklapt).
const ZF = 1.961, ZR = -1.961;
const AXF = 1.212, AXR = -1.328, AY = 0.336;
const BOD_WMAX = 0.904, BOD_MIRW = 1.010, BOD_H = 1.498;
const BOD_ARCH_R = 0.42, BOD_ARCH_RY = 0.38;

MAT.paint.color.setHex(0xF4C400);
MAT.paint.roughness = 0.2;
MAT.paint.metalness = 0.62;
MAT.paint.clearcoatRoughness = 0.06;
std('bodRoof', 0x121418, 0.25, 0.32);
std('bodGlassIn', 0x9bb0c4, 0.05, 0.12, { transparent: true, opacity: 0.35, depthWrite: false });
std('bodLamp', 0x16181c, 0.4, 0.35);
phys('bodDRL', { color: 0xe7f6ff, emissive: 0xc5e8ff, emissiveIntensity: 1.1, roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.95 });
std('bodSocket', 0x1c1e22, 0.3, 0.45);

function bodPchip(pts) {
  const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), h = [], dl = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; dl[i] = (ys[i + 1] - ys[i]) / h[i]; }
  m[0] = dl[0]; m[n - 1] = dl[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (dl[i - 1] * dl[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]); }
  }
  return x => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}
// Bovenaanzicht: brede, bijna rechte flank, stompe neus en staart. De koplampen zitten in de neushoeken.
const HW = bodPchip([[-1.961, 0.22], [-1.90, 0.64], [-1.72, 0.84], [-1.30, 0.872], [-0.2, 0.878], [0.85, 0.878], [1.38, 0.86], [1.62, 0.82], [1.80, 0.76], [1.90, 0.52], [1.961, 0.18]]);
const YB = bodPchip([[-1.961, 0.38], [-1.82, 0.22], [-1.40, 0.15], [-0.2, 0.125], [1.15, 0.125], [1.55, 0.15], [1.78, 0.20], [1.90, 0.30], [1.961, 0.42]]);
const YT = bodPchip([[-1.961, 0.72], [-1.78, 1.04], [-1.22, 1.08], [0.20, 1.05], [0.85, 1.02], [1.15, 0.94], [1.45, 0.84], [1.68, 0.76], [1.86, 0.64], [1.961, 0.50]]);
const YR = bodPchip([[-1.18, 1.20], [-0.80, 1.42], [-0.20, 1.49], [0.28, 1.498], [0.55, 1.36], [0.78, 1.14], [1.00, 0.98]]);
function bodHoodY(z) { const t = clamp((z - 0.98) / 0.981, 0, 1); return 0.98 - 0.32 * t * t; }
function bodTailY(z) { const t = clamp((-1.15 - z) / 0.811, 0, 1); return 1.24 - 0.55 * Math.pow(t, 1.2); }
function bodTop(z) { if (z >= 1.02) return bodHoodY(z); if (z <= -1.15) return bodTailY(z); return YR(z); }
function bodWinTop(z) { return Math.min(bodTop(z) - 0.04, YT(z) + 0.40); }
function surfX(z, y) {
  const hw = HW(z), yb = YB(z), yt = YT(z), yr = Math.max(yt + 0.08, bodTop(z));
  if (y <= yb) return hw * 0.90;
  if (y < yt) {
    const t = clamp((y - yb) / Math.max(1e-4, yt - yb), 0, 1);
    return hw * (0.965 + 0.035 * Math.sin(t * PI));
  }
  const t = clamp((y - yt) / Math.max(1e-4, yr - yt), 0, 1);
  const k = t * t * (3 - 2 * t);
  // Kap en klep blijven breed; het dak knijpt naar de middennaad.
  const crown = z >= 1.00 ? 0.05 : (z <= -1.12 ? 0.22 : 0.12);
  const side = z >= 1.00 ? 0.94 : 0.90;
  return hw * (side * (1 - k) + crown * k);
}
function bodInArch(z, y) {
  if (y > 0.70) return false;
  for (const zc of [AXF, AXR]) {
    const dz = (z - zc) / BOD_ARCH_R, dy = (y - AY) / BOD_ARCH_RY;
    if (dz * dz + dy * dy < 1) return true;
  }
  return false;
}
function bodDoorZone(z) {
  if (z >= 0.18 && z <= 0.98) return 'voor';
  if (z >= -0.95 && z <= 0.14) return 'achter';
  return '';
}
function bodInDoor(z, x, y) {
  if (!bodDoorZone(z) || bodInArch(z, y)) return false;
  if (Math.abs(x) < 0.22) return false;
  return y > 0.28 && y < bodWinTop(z);
}
function bodInHood(z, x, y) {
  if (z < 1.04 || z > 1.72 || y < bodHoodY(z) - 0.07) return false;
  return Math.abs(x) < Math.min(0.74, HW(z) * 0.80);
}
function bodInFlap(z, x, y) { return bodInHood(z, x, y) && x > 0.08 && x < 0.44 && z > 1.22 && z < 1.55; }
function bodIsRoof(z, y) { return z < 0.46 && z > -1.12 && y > YT(z) + 0.02; }
function bodXYZ(z, s) {
  const left = s <= 1, u = left ? s : 2 - s;
  const yb = YB(z), yr = Math.max(yb + 0.08, bodTop(z));
  const y = yb + (yr - yb) * Math.pow(Math.max(u, 0), 0.42);
  return [(left ? 1 : -1) * surfX(z, y), y];
}
function bodSelectGeo(keep, push) {
  const nz = 96, ns = 40, pos = [], idx = [], map = new Map();
  const at = (i, j) => {
    const k = i + ':' + j;
    if (map.has(k)) return map.get(k);
    const z = ZR + (ZF - ZR) * i / nz, s = 2 * j / ns, [x0, y] = bodXYZ(z, s);
    const x = x0 + (x0 >= 0 ? 1 : -1) * (push || 0);
    const id = pos.length / 3;
    pos.push(x, y + (push && bodIsRoof(z, y) ? 0 : 0), z);
    map.set(k, id);
    return id;
  };
  for (let i = 0; i < nz; i++) for (let j = 0; j < ns; j++) {
    const z = ZR + (ZF - ZR) * (i + 0.5) / nz, s = 2 * (j + 0.5) / ns, [x, y] = bodXYZ(z, s);
    if (!keep(z, x, y)) continue;
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    idx.push(a, d, b, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const bodShellKeep = (z, x, y) => !bodInArch(z, y) && !bodInDoor(z, x, y) && !bodInHood(z, x, y) && !bodIsRoof(z, y);
const bodRoofKeep = (z, x, y) => bodIsRoof(z, y) && !bodInDoor(z, x, y) && !bodInHood(z, x, y);

function bodHinge(pivot, axis, angle, extra) { return hinge(pivot, axis, angle, Object.assign({ min: Math.abs(angle) * 0.82 }, extra)); }
function bodSlide(move, extra) {
  const len = Math.hypot(move[0], move[1], move[2]);
  return Object.assign({ type: 'slide', move, min: len * 0.82 }, extra);
}

function bodLamp(s) {
  const p = [s * 0.60, 0.58, 1.74];
  const house = merge([
    G.rbox(0.34, 0.32, 0.20, 0.025),
    xf(G.box(0.26, 0.24, 0.02), [0, 0, 0.09]),
  ]);
  return A(`Koplamp ${sideName(s)}`, { d: 'Koplamp in een bijna vierkant huis dat uit de neushoek steekt, met een lichtgevende rechthoek als dagrijlicht. De vorm volgt de productiefoto; de binnenoptiek is schematisch.', ex: [s * 0.16, 0.05, 0.22] }, [
    P('Huis', house, MAT.bodLamp, { d: 'Zwart huis van de koplamp, vast in het voorscherm.', p, ex: [s * 0.04, 0, 0.04] }),
    P('Dagrijlicht', G.rbox(0.22, 0.18, 0.012, 0.012), MAT.bodDRL, { d: 'Lichtgevende rechthoek in het midden van de koplamp, het herkenningspunt van de neus.', p: [p[0], p[1], p[2] + 0.09], ex: [0, 0, 0.12] }),
    P('Lichtgeleider', G.box(0.26, 0.22, 0.008), MAT.lensClear, { d: 'Doorzichtige kap over het dagrijlicht.', p: [p[0], p[1], p[2] + 0.102], ex: [0, 0, 0.08] }),
    P('Knipperlicht', G.box(0.20, 0.03, 0.01), MAT.amber, { d: 'Oranje strook onder het dagrijlicht.', p: [p[0], p[1] - 0.11, p[2] + 0.09], ex: [0, -0.06, 0.06] }),
  ]);
}
function bodTailLamp(s) {
  const p = [s * 0.72, 0.90, -1.76];
  return A(`Achterlicht ${sideName(s)}`, { d: 'Staand achterlicht op de hoek van de achterklep, met een rode lens. De grafiek van het licht is vereenvoudigd.', ex: [s * 0.14, 0.04, -0.16] }, [
    P('Huis achterlicht', G.rbox(0.11, 0.48, 0.10, 0.016), MAT.bodLamp, { d: 'Zwart huis van het achterlicht.', p, ex: [s * 0.04, 0, 0] }),
    P('Lens', G.rbox(0.08, 0.40, 0.02, 0.01), MAT.lensRed, { d: 'Rode lens van het achterlicht.', p: [p[0], p[1], p[2] - 0.045], ex: [0, 0, -0.08] }),
  ]);
}
function bodMirror(s) {
  const z = 0.78, y = 1.02, x = s * 0.80;
  return A(s > 0 ? 'Buitenspiegel links' : 'Buitenspiegel rechts', {
    d: 'Buitenspiegel op een smalle voet. Inklappen draait de kap naar achteren langs het portier.',
    ex: [s * 0.22, 0.1, 0],
    open: bodHinge([x, y, z], [0, 1, 0], s > 0 ? 1.15 : -1.15, { label: s > 0 ? 'Spiegel links' : 'Spiegel rechts', look: { dir: [s, 0.35, 0.8], nodes: [s > 0 ? 'Buitenspiegel links' : 'Buitenspiegel rechts'] } }),
  }, [
    P('Spiegelvoet', G.box(0.05, 0.06, 0.08), MAT.blackGloss, { d: 'Smalle voet van de spiegel op het voorportier.', p: [x, y, z], ex: [0, 0.05, 0] }),
    P('Spiegelkap', G.rbox(0.16, 0.1, 0.2, 0.02), MAT.blackGloss, { d: 'Zwarte spiegelkap.', p: [s * 0.92, y + 0.02, z - 0.02], ex: [s * 0.08, 0.04, 0] }),
    P('Spiegelglas', G.box(0.11, 0.07, 0.008), MAT.lensClear, { d: 'Spiegelglas in de kap.', p: [s * 0.92, y + 0.02, z + 0.07], ex: [0, 0, 0.06] }),
  ]);
}
function bodDoor(s, front) {
  const name = `Portier ${sideName(s)}${front ? 'voor' : 'achter'}`;
  const glass = `Zijruit ${sideName(s)}${front ? 'voor' : 'achter'}`;
  const zH = front ? 1.04 : 0.12;
  const ang = (s > 0 ? -1 : 1) * (front ? 1.17 : 1.05);
  const skin = bodSelectGeo((z, x, y) => bodInDoor(z, x, y) && (s > 0 ? x > 0 : x < 0) && bodDoorZone(z) === (front ? 'voor' : 'achter') && y <= YT(z) - 0.01, 0.006);
  const win = bodSelectGeo((z, x, y) => bodInDoor(z, x, y) && (s > 0 ? x > 0 : x < 0) && bodDoorZone(z) === (front ? 'voor' : 'achter') && y > YT(z) - 0.01, 0.004);
  const hz = front ? 0.62 : -0.42;
  const kids = [
    P('Buitenhuid', skin, MAT.paint, { d: 'Buitenhuid van het portier, in dezelfde lak als de rest van de carrosserie.', ex: [s * 0.08, 0, 0] }),
    P('Binnenplaat', G.box(0.02, 0.55, front ? 0.78 : 0.95), MAT.plasticGrey, { d: 'Binnenplaat van het portier met de raamsponning.', p: [s * 0.78, 0.72, hz], ex: [s * -0.06, 0, 0], inner: true }),
    P(glass, win, MAT.glass, { d: 'Zijruit. Bij openen zakt het glas in het portier.', ex: [s * 0.04, 0.12, 0], open: bodSlide([0, -0.36, 0], { label: glass }) }),
    P(front ? 'Portiergreep' : 'Verborgen greep', front ? G.box(0.025, 0.03, 0.16) : G.box(0.02, 0.025, 0.1), MAT.blackGloss, { d: front ? 'Uitschuifbare greep in de buitenhuid.' : 'Greep die in de zwarte stijl achter het glas schuilgaat, zoals bij de productiewagen.', p: [s * 0.88, front ? 0.78 : 0.96, front ? 0.55 : -0.55], ex: [s * 0.08, 0.04, 0] }),
  ];
  if (front) kids.push(bodMirror(s));
  return A(name, {
    d: front ? 'Voorportier met zijruit, greep en buitenspiegel. Het scharnier zit aan de A-stijl.' : 'Achterportier met zijruit. De greep zit verborgen in de C-stijl, zodat de flank als één vlak leest.',
    ex: [s * 0.55, 0.05, 0],
    open: bodHinge([s * 0.78, 0.78, zH], [0, 1, 0], ang, { label: name, look: { dir: [s * 1.1, 0.4, front ? 0.7 : -0.2], nodes: [name] } }),
  }, kids);
}

function buildBody() {
  const shell = bodSelectGeo(bodShellKeep, 0);
  const roof = bodSelectGeo(bodRoofKeep, 0.004);
  const hood = bodSelectGeo((z, x, y) => bodInHood(z, x, y) && !bodInFlap(z, x, y), 0);
  const screen = bodSelectGeo((z, x, y) => z > 0.50 && z < 1.02 && y > YT(z) - 0.02 && Math.abs(x) < HW(z) * 0.80 && !bodInDoor(z, x, y), -0.004);
  const motorkap = A('Motorkap', {
    d: 'Motorkap met de laadklep links op de kap, op de plek van de luchtinlaat van de oorspronkelijke Renault 5. De klep gaat open zonder de kap te lichten; de kap zelf gaat om het scharnier bij de voorruit omhoog.',
    ex: [0, 0.35, 0.15],
    open: bodHinge([0, bodHoodY(1.04), 1.04], [1, 0, 0], -1.13, { label: 'Motorkap', look: { dir: [0.4, 1.1, 1.2], nodes: ['Motorkap'] } }),
  }, [
    P('Kapblad', hood, MAT.paint, { d: 'Buitenblad van de motorkap.', ex: [0, 0.08, 0] }),
    P('Isolatie kap', G.box(0.7, 0.012, 0.55), MAT.fabric, { d: 'Dempende mat aan de binnenkant van de kap.', p: [0, bodHoodY(1.40) - 0.06, 1.40], ex: [0, -0.08, 0], inner: true }),
    A('Laadklep', {
      d: 'Klep links op de motorkap. Erachter zit de CCS-aansluiting. De klep kantelt om de achterrand omhoog.',
      ex: [0.2, 0.12, 0],
      open: bodHinge([0.26, bodHoodY(1.40), 1.22], [1, 0, 0], -1.2, { label: 'Laadklep', look: { dir: [0.8, 0.7, 1], nodes: ['Laadklep'] } }),
    }, [
      P('Klepblad', G.rbox(0.34, 0.016, 0.30, 0.006), MAT.paint, { d: 'Buitenblad van de laadklep, in de lak van de kap.', p: [0.26, bodHoodY(1.38) + 0.01, 1.38], ex: [0, 0.06, 0] }),
      P('Kleprand', G.box(0.32, 0.012, 0.28), MAT.blackGloss, { d: 'Zwarte rand onder het klepblad.', p: [0.26, bodHoodY(1.40) - 0.025, 1.40], ex: [0, -0.04, 0] }),
    ]),
  ]);
  const klep = A('Achterklep', {
    d: 'Achterklep van de hatchback, scharnierend aan de bovenrand. De achterruit zit in de klep.',
    ex: [0, 0.25, -0.2],
    open: bodHinge([0, 1.18, -1.16], [1, 0, 0], 1.15, { label: 'Achterklep', look: { dir: [0.5, 0.45, -1.2], nodes: ['Achterklep'] } }),
  }, [
    P('Klepblad achter', bodSelectGeo((z, x, y) => z < -1.16 && z > -1.90 && y > 0.62 && !bodInArch(z, y) && Math.abs(x) < HW(z) * 0.96, 0.003), MAT.paint, { d: 'Buitenblad van de achterklep.', ex: [0, 0.06, -0.06] }),
    P('Achterruit', G.box(0.78, 0.36, 0.012), MAT.glass, { d: 'Achterruit in de klep, donker van buiten.', p: [0, 1.08, -1.48], r: [0.55, 0, 0], ex: [0, 0.05, -0.08] }),
    P('Ruitenwisser achter', merge([G.box(0.02, 0.015, 0.28), xf(G.box(0.04, 0.03, 0.04), [0, 0, 0.14])]), MAT.blackGloss, { d: 'Ruitenwisser onderaan de achterruit.', p: [0.08, 0.92, -1.68], ex: [0.1, 0, -0.05] }),
    P('Kenteken achter', G.box(0.46, 0.11, 0.008), MAT.plateYellow, { d: 'Gele kentekenplaat, zoals in Nederland. Het kenteken zelf staat er niet op.', p: [0, 0.58, -1.90], ex: [0, -0.08, -0.06] }),
  ]);
  return A('Carrosserie', {
    d: 'Carrosserie van de Renault 5 E-Tech electric: vijfdeurs hatchback met korte neus, staande koplampen, zwarte kap en de laadklep op de motorkap. Pop-geel met zwart dak, modeljaar 2026.',
    ex: [0, 1.55, 0],
  }, [
    P('Onderbak', shell, MAT.paint, { d: 'Buitenhuid van de flanken, de dorpels, de bumpers en de schermen. Wielopeningen en portieropeningen zijn uitgesneden.', ex: [0, -0.15, 0] }),
    P('Dak', roof, MAT.bodRoof, { d: 'Zwarte dakplaat van de voorruit tot de achterruit.', ex: [0, 0.28, 0] }),
    P('Voorruit', screen, MAT.glass, { d: 'Voorruit, donker van buiten. Van binnen lichter, zoals het glas in het model van de referentieauto.', ex: [0, 0.2, 0.12] }),
    motorkap,
    bodDoor(1, true), bodDoor(-1, true), bodDoor(1, false), bodDoor(-1, false),
    klep,
    bodLamp(1), bodLamp(-1), bodTailLamp(1), bodTailLamp(-1),
    P('Neusvlak', G.box(1.05, 0.16, 0.03), MAT.plastic, { d: 'Zwart vlak tussen de koplampen. De neus heeft geen grille en geen beeldmerk.', p: [0, 0.62, 1.86], ex: [0, 0, 0.1] }),
    P('Onderinlaat', G.box(0.78, 0.12, 0.04), MAT.plastic, { d: 'Zwarte luchtinlaat in de voorbumper.', p: [0, 0.36, 1.90], ex: [0, -0.05, 0.08] }),
    P('Onderlip voor', G.box(1.50, 0.07, 0.08), MAT.plastic, { d: 'Zwarte onderlip van de voorbumper.', p: [0, 0.20, 1.86], ex: [0, -0.12, 0.12] }),
    P('Diffusor', G.box(1.40, 0.07, 0.10), MAT.plastic, { d: 'Zwarte onderlip achter. Er is geen uitlaatpijp.', p: [0, 0.20, -1.86], ex: [0, -0.1, -0.1] }),
    P('Kenteken voor', G.box(0.46, 0.10, 0.008), MAT.plateYellow, { d: 'Gele kentekenplaat voor. Het kenteken zelf staat er niet op.', p: [0, 0.30, 1.925], ex: [0, -0.06, 0.08] }),
  ]);
}
