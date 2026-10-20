/* ===================== carrosserie: Renault 5 E-Tech electric, MY26 ===================== */
// Autoframe: x links, y omhoog vanaf de grond, z naar voren. Maten in meter.
// Lengte 3.922 mm, wielbasis 2.540 mm, overhang voor 749 mm en achter 633 mm (Renault).
// Eén geloft vlak (golf 2): de onderbak is per z een doorsnede van bodem, flank, schouder en dek (bodSec), de kas daarboven
// een doorsnede van gordel, zijruit, dakrand en dak (bodGh). Panelen zijn stukken van die vlakken (bodPatch), zodat de naden
// spleten zijn en geen losse dozen. De steunpunten komen uit data/silhouet.json (brochure, genormaliseerd).
const ZF = 1.961, ZR = -1.961;
const AXF = 1.212, AXR = -1.328, AY = 0.336;          // wielmidden: straal 195/55 R18 (0,336 m)
// framework: halve breedte zonder en met spiegels, hoogte (integrity.py leest ze). 0,909 is de bovengrens van de maatpoort (1.818 mm).
const BOD_WMAX = 0.909, BOD_MIRW = 1.010, BOD_H = 1.498;
const bodARCH = 0.395;                                   // wielkastuitsparing, straal om de wielas
const bodFLW = 0.085, bodFLT = 0.022;                  // wielkastrand: breedte van de flens en dikte buiten de huid
const bodWS0 = 1.0, bodWS1 = 0.12, bodRW0 = -1.22, bodSP = -1.665; // voorruitvoet, voorruitkop, dakeinde (spoilerlip), onderrand achterruit

MAT.paint.color.setHex(0xF4C400);
MAT.paint.roughness = 0.18;
MAT.paint.metalness = 0.55;
MAT.paint.clearcoat = 1;
MAT.paint.clearcoatRoughness = 0.08;
std('bodRoof', 0x111216, 0.35, 0.26);
phys('bodGlass', { color: 0x081016, metalness: 0.05, roughness: 0.04, transparent: true, opacity: 0.8, depthWrite: false, envMapIntensity: 1.1 });   // donker getint, zoals op de foto's
std('bodLamp', 0x121418, 0.45, 0.32);
phys('bodDRL', { color: 0xf4fbff, emissive: 0xd7f1ff, emissiveIntensity: 2.4, roughness: 0.18, metalness: 0 });
std('bodSocket', 0x1c1e22, 0.3, 0.45);
std('bodGrain', 0x18191c, 0, 0.86, { envMapIntensity: 0.25 });   // zwart generfd kunststof: wielkastranden, dorpels, onderbumpers
std('bodPillar', 0x08090a, 0.2, 0.3, { envMapIntensity: 0.5 });  // glanzend zwart van stijlen en raamkaders
std('bodTrimIn', 0x2a2c30, 0, 0.8);                               // binnenbekleding van portieren en klep
std('bodArchIn', 0x141518, 0, 0.92, { envMapIntensity: 0.2 });   // zwart kunststof van wielkasten en binnenschermen

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
const bodSstep = t => { const u = clamp(t, 0, 1); return u * u * (3 - 2 * u); };
// halve breedte van de flank zonder wielkastranden. Met de rand erbij (bodFLT) volgt het bovenaanzicht van de brochure:
// 0,885 over de voorwielkast, 0,864 langs de portieren, 0,887 over de achterwielkast; stompe neus en staart.
const HW = bodPchip([[-1.961, 0.66], [-1.955, 0.71], [-1.935, 0.755], [-1.90, 0.788], [-1.85, 0.803], [-1.70, 0.812], [-1.50, 0.853], [-1.30, 0.864], [-1.10, 0.857],
  [-0.80, 0.852], [-0.40, 0.860], [0.20, 0.864], [0.80, 0.864], [1.00, 0.864], [1.25, 0.862], [1.50, 0.845], [1.70, 0.784], [1.80, 0.762], [1.88, 0.735], [1.935, 0.68], [1.961, 0.58]]);
// onderrand van de carrosserie (dorpel op 216 tot 230 mm, bumpers hoger)
const YB = bodPchip([[-1.961, 0.37], [-1.90, 0.335], [-1.85, 0.32], [-1.75, 0.279], [-1.40, 0.24], [-0.80, 0.226], [-0.40, 0.223], [0.20, 0.219],
  [0.60, 0.216], [1.40, 0.232], [1.75, 0.242], [1.85, 0.254], [1.92, 0.27], [1.961, 0.30]]);
// schouder = gordellijn (onderrand zijruiten, brochure 1,053 tot 1,079) en voor de voorruit de naad van kap en scherm
const YT = bodPchip([[-1.961, 0.86], [-1.92, 0.93], [-1.86, 0.985], [-1.78, 1.03], [-1.665, 1.058], [-1.40, 1.074], [-1.10, 1.077], [-0.90, 1.075],
  [-0.70, 1.070], [-0.50, 1.063], [-0.10, 1.056], [0.10, 1.052], [0.30, 1.049], [0.60, 1.043], [0.80, 1.030], [1.00, 1.000], [1.30, 0.952],
  [1.60, 0.900], [1.75, 0.870], [1.85, 0.848], [1.92, 0.815], [1.961, 0.75]]);
// hartlijn van het dek: motorkap (brochure z 1,0 tot 1,7) en achterklep onder de achterruit; in de kas niet zichtbaar
const YD = bodPchip([[-1.961, 0.80], [-1.935, 0.90], [-1.90, 0.965], [-1.84, 1.02], [-1.76, 1.052], [-1.70, 1.068], [-1.665, 1.078],
  [-1.60, 1.08], [0.90, 1.07], [1.00, 1.086], [1.20, 1.058], [1.40, 1.022], [1.60, 0.984], [1.70, 0.945], [1.78, 0.922], [1.85, 0.898], [1.90, 0.874], [1.935, 0.84], [1.961, 0.78]]);
// exponent van het dekprofiel: vlak midden en afgeronde randen; op de kap vlakker, met een strakke rand naar de schermen
const bodDP = bodPchip([[-1.961, 2.4], [-1.70, 2.8], [0.90, 3.6], [1.20, 4.4], [1.80, 4.2], [1.961, 3.2]]);
// straal van de schouder: klein (strak) op kap en achterheupen, ruimer langs de portieren
const bodRS = bodPchip([[-1.961, 0.05], [-1.55, 0.042], [-1.00, 0.055], [-0.60, 0.075], [0.60, 0.075], [1.05, 0.052], [1.961, 0.045]]);
// daklijn op de hartlijn: voorruit (brochure 1,083 tot 1,470), vlak hoog dak (1,498), achterruit (1,239 en 1,158)
const YR = bodPchip([[bodSP, 1.078], [-1.60, 1.158], [-1.50, 1.239], [-1.40, 1.318], [-1.30, 1.392], [bodRW0, 1.452], [-1.10, 1.474], [-0.80, 1.492],
  [-0.40, 1.498], [0.00, 1.493], [bodWS1, 1.486], [0.20, 1.472], [0.40, 1.401], [0.60, 1.294], [0.80, 1.182], [bodWS0, 1.086]]);
function bodHoodY(z) { return YD(z); }   // contract: hoogte van de motorkap op de hartlijn (integrity.py: 2,5 cm onder de buitenhuid)

const bodS1 = 0.12, bodS2 = 0.20, bodS3 = 0.62, bodS4 = 0.74, bodBUL = 0.012, bodCRW = 0.022;
// doorsnede van de onderbak op z
function bodSec(z) {
  const hw = HW(z), yb = YB(z), yt = YT(z), d = yt - yb, bul = Math.min(bodBUL * (1 - 0.65 * Math.exp(-Math.pow((z - AXR) / 0.4, 2))), hw * 0.15);   // achterheup: minder bolling, breder op de schouder
  const rb = Math.min(0.06, d * 0.28, (hw - bul) * 0.45), rs = Math.min(bodRS(z), d * 0.3, (hw - bul) * 0.45);
  const yd = Math.max(yt + 0.004, YD(z)), c = yd - yt, p = bodDP(z);
  const cx = hw - bul - rs;                       // middelpunt van de schouderboog
  let xe = cx + rs * 0.3, th = 1.2;
  for (let i = 0; i < 3; i++) { th = Math.atan2(xe, c * p); xe = cx + rs * Math.cos(th); }
  // achter z -1,0 (C-stijl en klep) stopt de schouderboog op de hoek van de kas, zodat flank en stijl zonder richel in elkaar
  // overlopen; onder de achterruit wordt die hoek de zijrand van de klep
  const wP = bodSstep((-1.0 - z) / 0.1);
  if (wP > 0) { th = lerp(th, Math.atan(bodTUMB), wP); xe = cx + rs * Math.cos(th); }
  const cy = yt - rs * Math.sin(th);
  return { hw, yb, yt, rb, rs, yd, c, p, cx, cy, th, xe, bul };
}
// halve doorsnede, s van 0 (bodem op de hartlijn) via bodem, flank en schouder naar 1 (dek op de hartlijn)
function bodHalf(z, s, c) {
  const { hw, yb, yt, rb, rs, cx, cy, th, xe, c: cr, p, bul } = c;
  if (s <= bodS1) return [s / bodS1 * (hw - bul - rb), yb];
  if (s <= bodS2) { const a = -HALF + (s - bodS1) / (bodS2 - bodS1) * HALF; return [hw - bul - rb + rb * Math.cos(a), yb + rb + rb * Math.sin(a)]; }
  if (s <= bodS3) { const t = (s - bodS2) / (bodS3 - bodS2), y = yb + rb + t * (cy - yb - rb); return [hw + bul * Math.sin(PI * t) - bul, y]; }
  if (s <= bodS4) { const a = (s - bodS3) / (bodS4 - bodS3) * th; return [cx + rs * Math.cos(a), cy + rs * Math.sin(a)]; }
  const t = (s - bodS4) / (1 - bodS4); return [xe * (1 - t), yt + cr * (1 - Math.pow(1 - t, p))];
}
function bodHalfPt(z, s) { return bodHalf(z, s, bodSec(z)); }
// parameter s bij hoogte y (flank, schouder en dek)
function bodSAtY(z, y) {
  const c = bodSec(z), y0 = c.yb + c.rb, y1 = c.cy;
  if (y <= y0) { const a = Math.asin(clamp((y - y0) / c.rb, -1, 0)); return bodS1 + (a + HALF) / HALF * (bodS2 - bodS1); }
  if (y <= y1) return bodS2 + (y - y0) / Math.max(1e-6, y1 - y0) * (bodS3 - bodS2);
  if (y <= c.yt) { const a = Math.asin(clamp((y - c.cy) / c.rs, 0, 1)); return bodS3 + Math.min(1, a / c.th) * (bodS4 - bodS3); }
  const u = clamp((y - c.yt) / Math.max(1e-6, c.c), 0, 1), t = 1 - Math.pow(1 - u, 1 / c.p);
  return bodS4 + t * (1 - bodS4);
}
// parameter s op het dek bij |x|
function bodSAtX(z, x) { const c = bodSec(z); return bodS4 + (1 - bodS4) * clamp(1 - Math.abs(x) / c.xe, 0, 1); }
// halve breedte van de onderbak op hoogte y (0 boven het dek)
function bodRingX(z, y) { const c = bodSec(z); if (y > c.yd) return 0; return Math.max(0, bodHalf(z, bodSAtY(z, y), c)[0]); }
// onderrand van de flank in de wielkast: s van de boog r = bodARCH om de as
function bodArchS(z) {
  for (const az of [AXF, AXR]) { const dz = z - az; if (Math.abs(dz) <= bodARCH) return bodSAtY(z, AY + Math.sqrt(bodARCH * bodARCH - dz * dz)); }
  return 0;
}
const bodARCH_BREAKS = [AXF - bodARCH, AXF - bodARCH + 0.004, AXF + bodARCH - 0.004, AXF + bodARCH, AXR - bodARCH, AXR - bodARCH + 0.004, AXR + bodARCH - 0.004, AXR + bodARCH];
// bovenrand van de wielkastrand (r = bodARCH + bodFLW) op z, of 0 buiten de rand
function bodFlareTop(z) {
  for (const az of [AXF, AXR]) { const dz = z - az, R = bodARCH + bodFLW; if (Math.abs(dz) < R) return AY + Math.sqrt(R * R - dz * dz); }
  return 0;
}
/* ---------- kas (ruiten, stijlen, dak) ---------- */
// halve kas: q = 0 gordel, bodQG bovenrand zijruit, bodQS begin dakrand, bodQR begin dak (of voorruit, achterruit), 1 hartlijn
const bodQS = 0.54, bodQR = 0.72, bodQG = 0.50, bodTUMB = 0.40;
function bodGh(z) {
  const yb = YT(z), xb = bodSec(z).xe, yc = Math.max(yb + 0.002, YR(z)), h = yc - yb;
  // achter het dakeinde wordt de dakrand ruimer, zodat de C-stijl rond in de achterruit overloopt in plaats van te knikken
  const rw = bodSstep((bodRW0 + 0.04 - z) / 0.3), cr = Math.min(bodCRW, h * 0.3), yre = yc - cr, rr = Math.min(lerp(0.06, 0.12, rw), (yre - yb) * lerp(0.3, 0.5, rw)), ye = yre - rr;
  const xe = xb - bodTUMB * (ye - yb), xr = xe - rr * 0.8;
  return { yb, xb, yc, cr, yre, rr, ye, xe, xr };
}
function bodGhHalf(z, q, g) {
  g = g || bodGh(z);
  if (q <= bodQS) { const t = q / bodQS; return [g.xb + (g.xe - g.xb) * t + 0.008 * Math.sin(PI * t) * Math.min(1, (g.ye - g.yb) / 0.2), g.yb + (g.ye - g.yb) * t]; }
  if (q <= bodQR) { const a = (q - bodQS) / (bodQR - bodQS) * HALF; return [g.xr + (g.xe - g.xr) * Math.cos(a), g.ye + (g.yre - g.ye) * Math.sin(a)]; }
  const t = (q - bodQR) / (1 - bodQR), x = g.xr * (1 - t); return [x, g.yre + g.cr * t * (2 - t)];
}
// parameter q (halve kas) op hoogte y langs de zijruit
function bodQAtY(z, y) { const g = bodGh(z); return clamp((y - g.yb) / Math.max(1e-6, g.ye - g.yb), 0, 1) * bodQS; }
/* ---------- buitenhuid voor andere onderdelen ---------- */
function surfX(z, y) {
  const yt = YT(z);
  if (y <= yt || z < bodSP || z > bodWS0) return bodRingX(z, Math.min(y, bodSec(z).yd));
  const g = bodGh(z);
  if (y <= g.ye) return bodGhHalf(z, bodQAtY(z, y), g)[0];
  if (y <= g.yre) { const a = Math.asin(clamp((y - g.ye) / Math.max(1e-6, g.yre - g.ye), 0, 1)); return g.xr + (g.xe - g.xr) * Math.cos(a); }
  if (y >= g.yc) return 0;
  const u = clamp((y - g.yre) / g.cr, 0, 1), t = 1 - Math.sqrt(1 - u); return g.xr * (1 - t);
}
/* ---------- vlakken bouwen ---------- */
// raster over u (met extra kolommen op breaks) en per u een v-bereik vr(u); fn(u, v) geeft het punt
function bodPatch(fn, u0, u1, nu, vr, nv, breaks = []) {
  const us = [];
  for (let i = 0; i <= nu; i++) us.push(u0 + (u1 - u0) * i / nu);
  breaks.forEach(b => { if (b > u0 + 1e-4 && b < u1 - 1e-4) us.push(b); });
  us.sort((a, b) => a - b);
  // kolommen die (binnen 1e-6) samenvallen, één keer; driehoeken zonder oppervlak (kolom die tot een punt krimpt) vallen weg
  for (let i = us.length - 1; i > 0; i--) if (us[i] - us[i - 1] < 1e-6) us.splice(i, 1);
  const pos = [], idx = [], rows = nv + 1;
  for (const u of us) { const [v0, v1] = vr(u); for (let j = 0; j <= nv; j++) { const p = fn(u, v0 + (v1 - v0) * j / nv); pos.push(p[0], p[1], p[2]); } }
  const tri = (a, b, c) => {
    const ax = pos[3 * b] - pos[3 * a], ay = pos[3 * b + 1] - pos[3 * a + 1], az = pos[3 * b + 2] - pos[3 * a + 2];
    const bx = pos[3 * c] - pos[3 * a], by = pos[3 * c + 1] - pos[3 * a + 1], bz = pos[3 * c + 2] - pos[3 * a + 2];
    const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
    if (cx * cx + cy * cy + cz * cz > 1e-16) idx.push(a, b, c);
  };
  for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < nv; j++) {
    const a = i * rows + j, b = (i + 1) * rows + j, c = b + 1, d = a + 1;
    tri(a, b, d); tri(b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// naar buiten wijzende normaal van de onderbak (linkerhelft) in (z, s)
function bodN(z, s) {
  const e = 1e-3, a = bodHalfPt(z, Math.max(0, s - e)), b = bodHalfPt(z, Math.min(1, s + e)), f = bodHalfPt(z + e, s), k = bodHalfPt(z - e, s);
  const ds = [b[0] - a[0], b[1] - a[1], 0], dz = [f[0] - k[0], f[1] - k[1], 2 * e];
  const n = [ds[1] * dz[2] - ds[2] * dz[1], ds[2] * dz[0] - ds[0] * dz[2], ds[0] * dz[1] - ds[1] * dz[0]], l = Math.hypot(...n) || 1;
  return [n[0] / l, n[1] / l, n[2] / l];
}
// punt van de onderbak, p van 0 tot 2 over beide helften (1 = dek op de hartlijn), met verschuiving langs de normaal (in > 0 = naar binnen)
function bodLow(z, p, inw = 0) {
  const q = ((p % 2) + 2) % 2, sd = q <= 1 ? 1 : -1, s = q <= 1 ? q : 2 - q, [x, y] = bodHalfPt(z, s);
  if (!inw) return [sd * x, y, z];
  const n = bodN(z, s); return [sd * (x - n[0] * inw), y - n[1] * inw, z - n[2] * inw];
}
// punt op de buitenhuid op (z, y), met afstand out langs de normaal naar buiten
function bodAt(z, y, out = 0) { const sv = bodSAtY(z, y), [x, yy] = bodHalfPt(z, sv), n = bodN(z, sv); return [x + n[0] * out, yy + n[1] * out, z + n[2] * out]; }
const bodSideR = (s, a, b) => (s > 0 ? [a, b] : [2 - b, 2 - a]);
// paneel op de onderbak aan zijde s; vr(z) geeft [s0, s1] van de linkerhelft; off = verschuiving naar binnen
function bodLowSide(s, z0, z1, nu, vr, nv, breaks, off) {
  return bodPatch((z, p) => bodLow(z, p, off || 0), z0, z1, nu, z => bodSideR(s, ...vr(z)), nv, breaks);
}
// dekpaneel over beide helften: sLo(z) geeft de s-ondergrens; het paneel loopt over de hartlijn
function bodDeck(z0, z1, nu, sLo, nv, breaks, off) {
  return bodPatch((z, p) => bodLow(z, p, off || 0), z0, z1, nu, z => { const a = sLo(z); return [a, 2 - a]; }, nv, breaks);
}
// kaspaneel aan zijde s met q-bereik per z (linkerhelft, q in [0,1]); out = verschuiving naar buiten
function bodGhSide(s, z0, z1, nu, vr, nv, breaks, out = 0) {
  return bodPatch((z, q) => { const [x, y] = bodGhHalf(z, q); const o = out * (q <= bodQS ? 1 : 0.7); return [s * (x + o), y + (q > bodQS ? out * 0.7 : 0), z]; }, z0, z1, nu, vr, nv, breaks);
}
// kaspaneel over de hartlijn (dak, voorruit, achterruit): q van qLo(z) links tot 2 - qLo(z) rechts
function bodGhTop(z0, z1, nu, qLo, nv, breaks, out = 0) {
  return bodPatch((z, w) => { const sd = w <= 1 ? 1 : -1, q = w <= 1 ? w : 2 - w, [x, y] = bodGhHalf(z, q); return [sd * x, y + out, z]; }, z0, z1, nu, z => { const a = qLo(z); return [a, 2 - a]; }, nv, breaks);
}
// sluitvlak op een uiterste z (neus, staart): van de onderrand tot het dek, over de breedte van de doorsnede
function bodCap(z, y0, y1, ny = 8, nx = 16) {
  const c = bodSec(z), a = Math.max(c.yb + 1e-4, y0 === undefined ? -1 : y0), b = Math.min(c.yd - 1e-4, y1 === undefined ? 9 : y1);
  return bodPatch((y, t) => { const X = bodRingX(z, y); return [X * t, y, z]; }, a, b, ny, () => [-1, 1], nx);
}

function bodHinge(pivot, axis, angle, extra) { return hinge(pivot, axis, angle, Object.assign({ min: Math.abs(angle) * 0.82 }, extra)); }
function bodSlide(move, extra) {
  const len = Math.hypot(move[0], move[1], move[2]);
  return Object.assign({ type: 'slide', move, min: len * 0.82 }, extra);
}
