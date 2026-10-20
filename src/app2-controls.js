/* ===================== bediening (2/5): handelingen, isoleren, openmodus, weergave, explosieschuif, presets en rondleiding ===================== */

/* ---------- handelingen ---------- */
function uiAct(p) {
  if (!p) { uiBackground(); return; }
  uiMode().act(p);
}
function tapNode(n) { uiAct(n); }
function doExplode(g) {
  uiPush();
  setTarget(g, 1); updateGround();
  CTX = g; uiLabelForce = false; clearPreset();
  select(g);
  uiSoftFrame([g]);
  uiAfterAction();
}
function doCollapse(a) {
  uiPush();
  collapseTree(a); updateGround(); // I4: de vloer volgt de eindstand
  CTX = a.parent && uiOpen(a.parent) ? a.parent : null; uiLabelForce = false; clearPreset();
  select(a);
  uiAfterAction();
}
function uiCollapseAt(p) { uiMode().collapse(p); }
function uiBackground() {
  const r = uiScopeRoot();
  if (SEL === r && !uiLifted) return;
  uiPush(); uiDrop(); select(r); uiAfterAction();
}
// Dubbelklik: alle dichte groepen op het pad van de isolatiewortel (of de auto) tot en met de ouder van P openen, laag voor laag.
function uiDive(p) {
  if (!p) return;
  uiPush();
  const lv = [...pathFrom(p)].filter(a => a.asm && a !== p && !uiOpen(a)), st = uiStaffel(CFG.tijd.staffelS, lv.length, CFG.tijd.staffelMaxS);
  lv.forEach((a, i) => setTarget(a, 1, i * st));
  CTX = p.parent || p; uiLabelForce = false; clearPreset();
  if (uiMode().dim) uiSetDim(p); // U19
  select(p);
  focusNodes([p], null, p.asm ? 1.15 : 1.7, { min: 0.3, dur: Math.max(0.95, lv.length * st + 0.55) });
  uiAfterAction();
}
function reveal(n) { uiMode().reveal(n); }
// in Openen klapt niets uit: alleen selecteren en in beeld brengen
function uiRevealOpen(n) {
  uiPush();
  if (uiSheetBottom() && els.sheet.dataset.state === 'open') setSheet('peek');
  select(n);
  focusNodes([n], null, n.asm ? 1.12 : 1.6, { min: 0.3 });
  uiAfterAction();
}
function uiRevealExplode(n) {
  uiPush();
  if (ISO.length && !uiInScope(n)) { ISO = []; applyVisibility(); updateGround(); }
  const lv = [...ancestors(n)].filter(a => !uiOpen(a)), st = uiStaffel(CFG.tijd.tonenStaffelS, lv.length, CFG.tijd.staffelMaxS);
  lv.forEach((a, i) => setTarget(a, 1, i * st));
  CTX = n.parent || null; uiLabelForce = false; clearPreset();
  uiSetDim(n); // U19 (de wortel zet het uit)
  // telefoon: paneel terug naar de smalle stand, zodat je ziet wat er gebeurt
  if (uiSheetBottom() && els.sheet.dataset.state === 'open') setSheet('peek');
  select(n);
  focusNodes([n], null, n.asm ? 1.12 : 1.6, { min: 0.3, dur: Math.max(0.95, lv.length * st + 0.55) });
  uiAfterAction();
}
function uiUp() {
  const a = SEL && uiClosedAbove(SEL);
  if (a) doExplode(a);
}
// Kadreren na een klik: alleen bewegen als de groep niet (goed) in beeld is.
function uiSoftFrame(nodes) {
  const pts = uiCollect(nodes, true);
  if (!pts.length) return;
  const b = uiProject(pts), v = uiFreeView();
  const inside = b && b.x0 >= v.x0 && b.x1 <= v.x1 && b.y0 >= v.y0 && b.y1 <= v.y1;
  const cover = b ? ((b.x1 - b.x0) * (b.y1 - b.y0)) / Math.max(1, (v.x1 - v.x0) * (v.y1 - v.y0)) : 0;
  if (inside && cover > 0.06) return;
  const f = uiFitPoints(pts, null, 1.3, { min: 0.45 });
  if (f) { animCam(f.pos, f.target, 0.9); uiLastFit = { nodes, dir: null, pad: 1.3, opt: { min: 0.45 } }; }
}
const uiPv = V3(0, 0, 0);
// Een wereldpunt naar schermpixels in een vlak van w bij h (linksboven 0,0). v wordt ter plekke omgezet; z blijft de diepte
// van project() (boven 1 ligt het punt achter de camera). Golf 5c-2, K3: was vier keer uitgeschreven.
function uiToScreen(v, w = W, h = H) { v.project(camera); v.x = (v.x * 0.5 + 0.5) * w; v.y = (-v.y * 0.5 + 0.5) * h; return v; }
function uiProject(pts) {
  camera.updateMatrixWorld();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < pts.length; i += 3) {
    uiToScreen(uiPv.set(pts[i], pts[i + 1], pts[i + 2]));
    if (uiPv.z > 1) return null;
    const x = uiPv.x, y = uiPv.y;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
}
function uiFreeView() { return { x0: VIEW.l, y0: VIEW.t, x1: W - VIEW.r, y1: H - VIEW.b }; }
// U4: isoleren met een korte fade van wat uit beeld gaat (uiFadeFrom in app1.js) en de badge in het dock (uiSyncIso)
function isolate(list) {
  uiSetDim(null);
  const before = uiVisibleMeshes();
  ISO = list.slice(); applyVisibility(); uiFadeFrom(before); applyMats(); updateGround(); uiSyncIso(); requestRender();
}
function uiSyncIso() {
  const on = ISO.length > 0, txt = TXT.namenEn(ISO.map(n => n.name));
  // Eerst de tekst, dan de badge en de maat: een andere naam kan de badge laten omslaan, en het dock verandert dan meteen
  // (niet pas bij de ResizeObserver, die op een trage machine na het kadreren komt).
  let relayout = false;
  if (on && els.isoName.textContent !== txt) { els.isoName.textContent = txt; uiUiDirty = true; relayout = true; }
  if (els.isoBadge.hidden !== !on) { els.isoBadge.hidden = !on; uiUiChanged(); relayout = true; }
  if (relayout) layoutView();
}
$('isoShowAll').onclick = () => $('btnShowAll').click();

els.toggle.onclick = () => { const n = SEL; if (!n.asm) return; uiOpen(n) ? doCollapse(n) : doExplode(n); };
els.all.onclick = () => { const n = SEL; if (!n.asm) return; uiPush(); explodeAllUnder(n); CTX = n; uiLabelForce = false; clearPreset(); focusNodes([n], null, 1.04); uiAfterAction(); };
els.up.onclick = uiUp;
els.dim.onclick = () => { uiPush(); uiSetDim(null); uiAfterAction(); };
els.dive.onclick = () => uiDive(SEL);
els.iso.onclick = () => {
  uiPush();
  const on = ISO.length && (ISO.includes(SEL) || SEL === ROOT);
  isolate(on ? [] : [SEL]); clearPreset();
  focusNodes(on ? [ROOT] : [SEL]);
  uiAfterAction();
};
els.focus.onclick = () => { focusNodes([SEL], null, SEL.asm ? 1.08 : 1.6, { min: 0.25 }); };

/* ---------- openmodus: bediening ---------- */
// Openers (OPENERS in app1.js) draaien of schuiven open. In de modus Openen doet een klik dat in plaats van uitklappen.
// Klikregel: neem de openers op het pad van het geraakte onderdeel, van buiten naar binnen (volgers tellen als hun leider).
// De eerste dichte opener gaat open; zijn ze allemaal open, dan sluit de binnenste. Een klik op de ruit van een dicht
// portier opent dus het portier, daarna de ruit; een tweede klik op de ruit sluit de ruit weer. Rechtsklik, Shift+klik en
// lang drukken sluiten de binnenste open opener op het pad. Ingang: alles ingeklapt (Gemonteerd), openers blijven; uitgang: openers blijven staan.
function uiOpenPath(p) {
  const chain = []; for (let a = p; a; a = a.parent) chain.unshift(a);
  const out = [];
  for (const a of chain) if (a.opn) { const l = a.opn.lead || a; if (!out.includes(l)) out.push(l); }
  return out;
}
// wat een klik op p nu doet: { n: de opener, open: true om te openen, false om te sluiten } of null
function uiOpenPlan(p) {
  const list = p ? uiOpenPath(p) : [];
  if (!list.length) return null;
  const closed = list.find(n => n.ot === 0);
  return closed ? { n: closed, open: true } : { n: list[list.length - 1], open: false };
}
// paneel en Enter: staat de selectie zelf voor een opener (een leider), dan werkt de knop op die opener, ook als een
// buitenste opener dicht is (de knop past dan bij de badge Open of Dicht); bij een ander onderdeel geldt de klikregel
function uiPanelPlan(p) {
  if (p && p.opn && !p.opn.lead) return { n: p, open: p.ot === 0 };
  return uiOpenPlan(p);
}
// camera bij openen: richting en kader uit open.look, het kader in de eindstand (focusNodes rekent de doelstand mee)
function uiOpenFrame(nodes, dir, pad) { focusNodes(nodes, dir, pad, { min: 0.3 }); }
function uiOpenTo(n, open) {
  uiStopPlay(); uiStopTour(); hideHint();
  uiPush();
  uiSetOpen(n, open ? 1 : 0);
  clearPreset(); CTX = null; uiLabelForce = false;
  select(n); // eerst het paneel: de kaart wordt bij een selectie hoger en het vrije beeld rekent met zijn werkelijke hoogte
  if (open) { // bij sluiten beweegt de camera niet
    if (uiSheetBottom()) { syncSheetHeight(); layoutView(); }
    const lk = n.opn.look || {}, nodes = (lk.nodes || []).map(r => uiRef(r, n.name)).filter(Boolean);
    uiOpenFrame(nodes.length ? nodes : [n], lk.dir ? V3(...lk.dir) : null, 1.1);
  }
  uiAfterAction();
}
function uiOpenAct(p) {
  const pl = uiOpenPlan(p);
  if (pl) uiOpenTo(pl.n, pl.open);
  else { uiPush(); select(p); uiAfterAction(); }
}
function uiOpenClose(p) {
  const open = p ? uiOpenPath(p).filter(n => n.ot > 0) : [];
  if (open.length) uiOpenTo(open[open.length - 1], false);
  else if (p) { uiPush(); select(p); uiAfterAction(); }
}
function uiOpenAllTo(v) {
  uiStopPlay(); uiStopTour(); hideHint();
  uiPush();
  for (const n of OPENERS) uiSetOpen(n, v ? 1 : 0);
  clearPreset();
  if (v) uiOpenFrame([ROOT], DIRS.iso, 1.04);
  uiAfterAction();
}
function uiSetOpenMode(on) {
  on = !!on;
  if (COCKPIT) uiCkExit(); // Uitklappen of Openen kiezen stapt eerst uit de cockpit
  if (on === OPENMODE) return;
  uiStopPlay(); uiStopTour();
  uiPush();
  // de openstand blijft bij elke wissel staan: een geopende motorkap blijft open in Uitklappen (en kan daar uitgeklapt
  // worden), en terug in Openen gaat de explosie dicht maar blijven de openers zoals ze waren
  if (on) appApplyPreset(appPresetById.get('assembled'), { noHistory: true, openMode: true, keepOpen: true });
  else OPENMODE = false;
  clearPreset();
  uiUiChanged();
  uiAfterAction();
}

/* ---------- cockpit: rondkijken vanaf een zitplaats (golf 5l) ---------- */
// AUTO.cockpit is optioneel (auto.json): { stoelen: [{ id, label, knoop, oog: [x, y, z], kijk: [yaw, pitch], verberg: [knopen] }],
// binnen: [groepen] }.
// Het veld wordt met haken gelezen: tools/framework.py eist elk veld dat als AUTO-punt-naam in de generieke laag staat, en een auto
// zonder cockpit toont gewoon geen knop Cockpit. Hoeken in graden: yaw 0 is recht vooruit (+z), positief naar links (+x); pitch
// positief omhoog. Het oog beweegt binnen de doos uit CFG.cockpit rond de zitplaats (uiCk.off, in het autoframe).
// Ingang: alles gemonteerd (preset assembled met keepOpen: openers blijven), geen isolatie, dimmen of röntgen; de ingesloten
// delen onder AUTO.cockpit.binnen worden getekend (uiCkShow, app1.js). In de cockpit geldt needs niet (uiSetOpen, app1.js): het
// dashboardkastje gaat open zonder eerst een portier. Uitgang: camera, doel, gezichtsveld en near/far exact terug.
const UI_CK = (() => { const c = AUTO['cockpit']; return c && Array.isArray(c.stoelen) && c.stoelen.length ? c : null; })();
const uiCkSeats = UI_CK ? UI_CK.stoelen : [];
const uiCk = { yaw: 0, pitch: 0, fov: CFG.cockpit.fov, off: V3(0, 0, 0), last: uiCkSeats.length ? uiCkSeats[0].id : null };
const uiCkV = V3(0, 0, 0), uiCkV2 = V3(0, 0, 0), uiCkM = new THREE.Matrix4(), uiCkUp = V3(0, 1, 0), UI_D2R = PI / 180;
function uiCkSeat(id) { return uiCkSeats.find(st => st.id === id) || null; }
// kijkrichting (eenheidsvector) uit yaw en pitch in graden
function uiCkDir(yaw, pitch, out) { const y = yaw * UI_D2R, p = pitch * UI_D2R; return out.set(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)); }
// de camerastand van de cockpit: het oog (zitplaats plus verschuiving) en de oriëntatie naar de kijkrichting
function uiCkPose(pos, quat) {
  pos.set(...COCKPIT.oog).add(uiCk.off);
  uiCkDir(uiCk.yaw, uiCk.pitch, uiCkV2).add(pos);
  quat.setFromRotationMatrix(uiCkM.lookAt(pos, uiCkV2, uiCkUp));
}
// het gezichtsveld geldt voor de korte kant van het beeld: liggend verticaal, staand (telefoon) horizontaal; camera.fov is verticaal
function uiCkVfov() {
  const a = camera.aspect, f = uiCk.fov;
  return a >= 1 ? f : Math.min(CFG.cockpit.vfovMax, 2 * Math.atan(Math.tan(f * UI_D2R / 2) / a) / UI_D2R);
}
function uiCkApply() {
  if (!COCKPIT || uiCkAnim) return;
  uiCkPose(camera.position, camera.quaternion);
  controls.target.copy(uiCkDir(uiCk.yaw, uiCk.pitch, uiCkV)).add(camera.position); // het doel een meter voor het oog
  const vf = uiCkVfov();
  if (camera.fov !== vf) { camera.fov = vf; camera.updateProjectionMatrix(); }
  // omkijken: de eigen hoofdsteun en rugleuning zouden het beeld vullen; die verdwijnen voorbij CFG.cockpit.verbergYaw
  const hide = Math.abs(uiCk.yaw) > CFG.cockpit.verbergYaw ? uiCkHideOf(COCKPIT) : null;
  if (hide !== uiCkHide) { uiCkHide = hide; applyVisibility(); }
  camera.updateMatrixWorld();
  requestRender();
}
function uiCkClamp() {
  const c = CFG.cockpit;
  uiCk.yaw = clamp(uiCk.yaw, -c.yawMax, c.yawMax); uiCk.pitch = clamp(uiCk.pitch, c.pitchMin, c.pitchMax);
  uiCk.off.set(clamp(uiCk.off.x, -c.opzij, c.opzij), clamp(uiCk.off.y, -c.omlaag, c.omhoog), clamp(uiCk.off.z, -c.achter, c.voor));
  uiCk.fov = clamp(uiCk.fov, c.fovMin, c.fovMax);
}
function uiCkLook(yaw, pitch) { uiCk.yaw = +yaw || 0; uiCk.pitch = +pitch || 0; uiCkClamp(); uiCkApply(); }
// hoofd draaien met dx, dy pixels: de scène volgt de vinger (zoals een panoramafoto), een volle schermhoogte is het gezichtsveld
function uiCkTurn(dx, dy) { const k = camera.fov / Math.max(1, H); uiCkLook(uiCk.yaw + dx * k, uiCk.pitch + dy * k); }
// vooroverbuigen en opzij, in meter: right naar rechts en fwd vooruit in de kijkrichting (horizontaal), up omhoog
function uiCkShift(right, fwd, up) {
  const y = uiCk.yaw * UI_D2R;
  uiCk.off.x += -Math.cos(y) * right + Math.sin(y) * fwd;
  uiCk.off.z += Math.sin(y) * right + Math.cos(y) * fwd;
  uiCk.off.y += up;
  uiCkClamp(); uiCkApply();
}
function uiCkZoom(f) { uiCk.fov *= f; uiCkClamp(); uiCkApply(); }
// dubbelklik en C: de blik terug naar de standaard van de zitplaats, het hoofd terug op zijn plaats (het gezichtsveld blijft)
function uiCkReset() { if (!COCKPIT) return; uiCk.off.set(0, 0, 0); const k = COCKPIT.kijk || [0, 0]; uiCkLook(k[0], k[1]); }
// de delen uit verberg van een zitplaats (pad of unieke naam), één keer per zitplaats opgezocht
const uiCkHideSets = new Map();
function uiCkHideOf(seat) {
  let set = uiCkHideSets.get(seat);
  if (!set) {
    set = new Set();
    for (const ref of seat.verberg || []) { const n = uiResolve(ref); if (n) set.add(n); else console.error('cockpit: verberg ' + JSON.stringify(ref) + ' van ' + seat.id + ' lost niet op'); }
    uiCkHideSets.set(seat, set);
  }
  return set.size ? set : null;
}
// Buitenwereld van de cockpit: een luchtkoepel en een grondvlak met kleurverlopen (CFG.cockpit.wereld, per thema), lui gebouwd en
// alleen zichtbaar zolang de cockpit aanstaat. Daarbuiten blijven de achtergrond van de pagina en het raster (ground) zoals ze waren.
// Vlak getekend (geen licht, geen toonafbeelding): de kleuren zijn wat er staat. De vertexkleuren zijn lineair, Color.setHex rekent om.
let uiCkWorld = null;
function uiCkWorldMake() {
  const R = CFG.cockpit.wereldR, g = new THREE.Group(); g.name = 'uiCockpitWereld'; g.visible = false;
  const mat = side => new THREE.MeshBasicMaterial({ vertexColors: true, side, toneMapped: false, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), mat(THREE.BackSide)); sky.renderOrder = -4;
  const gr = new THREE.Mesh(new THREE.RingGeometry(0.01, R * 0.98, 48, 12), mat(THREE.FrontSide)); gr.rotation.x = -HALF; gr.renderOrder = -3;
  for (const m of [sky, gr]) m.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(m.geometry.attributes.position.count * 3), 3));
  g.add(sky, gr); scene.add(g);
  return (uiCkWorld = { g, sky, gr });
}
function uiCkWorldColors(dark) {
  const w = uiCkWorld; if (!w) return;
  const c = CFG.cockpit.wereld[dark ? 'donker' : 'licht'], R = CFG.cockpit.wereldR, A = new THREE.Color(), B = new THREE.Color(), C = new THREE.Color();
  const fill = (mesh, f) => { const p = mesh.geometry.attributes.position, col = mesh.geometry.attributes.color; for (let i = 0; i < p.count; i++) { f(p.getX(i), p.getY(i), p.getZ(i), C); col.setXYZ(i, C.r, C.g, C.b); } col.needsUpdate = true; };
  // lucht: van de horizon naar het zenit (wortel: het licht blijft lang aan de horizon); onder de horizon de verre grond
  fill(w.sky, (x, y, z, out) => { const t = y / R; if (t >= 0) out.copy(A.setHex(c.horizon)).lerp(B.setHex(c.zenit), Math.sqrt(t)); else out.setHex(c.grondVer); });
  // grond (RingGeometry ligt in x, y voor het draaien): bij de auto vlak grijs, vanaf een kwart van de straal naar de vage horizon
  fill(w.gr, (x, y, z, out) => { const t = clamp((Math.hypot(x, y) / R - 0.12) / 0.88, 0, 1); out.copy(A.setHex(c.grond)).lerp(B.setHex(c.grondVer), Math.pow(t, 0.6)); });
}
// lichtstand van de cockpit (vanuit uiThemeLights in core.js, dat eerst de lichten van het thema zet): zon lager en zachter,
// meer hemellicht, het cabinelicht aan; de kleuren van de buitenwereld volgen het thema
function uiCkLights(dark) {
  const L = CFG.cockpit.licht;
  sun.intensity = L.zon; sun.position.set(...L.zonPos);
  uiHemi.intensity += L.hemiPlus;
  uiCabin.intensity = dark ? L.cabineDonker : L.cabine;
  uiCkWorldColors(dark);
}
// cockpit aan of uit voor de omgeving: buitenwereld, raster en lichten
function uiCkEnv(on) {
  if (on && !uiCkWorld) uiCkWorldMake();
  if (uiCkWorld) uiCkWorld.g.visible = on;
  ground.visible = !on;
  if (on) uiCabin.position.set(...(UI_CK.licht || [0, 1, 0]));
  uiCkLightOn = on; uiThemeLights();
  requestRender();
}
// Uitstappen: een opener die alleen van binnen open kon (needs dicht, zoals het dashboardkastje achter een dicht portier) gaat
// weer dicht, zodat buiten de regel van needs weer klopt; al het andere blijft zoals het in de cockpit stond
function uiCkCloseInside(instant) {
  for (let more = true; more;) {
    more = false;
    for (const n of OPENERS) if (n.ot > 0 && n.opn.needN && n.opn.needN.ot === 0) { uiSetOpen(n, 0, instant); more = true; }
  }
}
// de ingesloten knopen die in de cockpit zichtbaar zijn: alles met inner onder de groepen van AUTO.cockpit.binnen
function uiCkInner() {
  const set = new Set();
  for (const ref of UI_CK.binnen || []) {
    const g = uiResolve(ref);
    if (!g) { console.error('cockpit: groep ' + JSON.stringify(ref) + ' uit auto.json lost niet op'); continue; }
    for (const n of subtree(g)) if (n.inner) set.add(n);
  }
  return set;
}
// overgang van de huidige camerastand naar p1, q1, f1 (exit: terug naar de camera van voor de cockpit); bij minder beweging direct
function uiCkStart(p1, q1, f1, exit, instant) {
  const dur = REDUCED || instant ? 0 : CFG.cockpit.overgangS;
  uiCkAnim = { p0: camera.position.clone(), q0: camera.quaternion.clone(), f0: camera.fov, p1, q1, f1, t: 0, dur, exit };
  if (!dur) uiCkAnimEnd(); else uiWake();
}
function uiStepCk(dt) {
  const a = uiCkAnim; if (!a) return false;
  a.t = Math.min(1, a.t + dt / a.dur);
  const k = ease(a.t);
  camera.position.lerpVectors(a.p0, a.p1, k); camera.quaternion.slerpQuaternions(a.q0, a.q1, k);
  camera.fov = lerp(a.f0, a.f1, k); camera.updateProjectionMatrix();
  if (a.t >= 1) uiCkAnimEnd();
  return true;
}
function uiCkAnimEnd() {
  const a = uiCkAnim; if (!a) return;
  uiCkAnim = null;
  if (a.exit) uiCkRestore(); else uiCkApply();
}
// de camera van voor de cockpit exact terug, met het kader en de gebruikerscamera (geen herkadrering na het uitstappen)
function uiCkRestore() {
  const sv = uiCkSave; if (!sv) return;
  camera.position.copy(sv.pos); camera.quaternion.copy(sv.quat); controls.target.copy(sv.target);
  camera.fov = sv.fov; camera.near = sv.near; camera.far = sv.far; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // het kader van voor de cockpit hoort bij deze camera en bij het vrije beeld van nu (het dock is bij het uitstappen al
  // terug): zo herkadreert de wachtende layoutwijziging niet, en een latere formaatwissel wel
  uiLastFit = sv.lastFit; uiFitRef = sv.lastFit; uiFitFree = H - VIEW.t - VIEW.b; uiUserCam = sv.user;
  uiCkSave = null; controls.enabled = true;
  requestRender();
}
// instappen op zitplaats id (of overstappen); null stapt uit. opt.instant: zonder overgang (adresbalk, testhaak)
function uiSetCockpit(id, opt = {}) {
  if (id == null || id === false) return uiCkExit(opt.instant);
  const seat = UI_CK && uiCkSeat(String(id));
  if (!seat) return false;
  uiStopPlay(); uiStopTour(); hideHint(); uiCloseMenu(false);
  const first = !COCKPIT;
  if (first) {
    uiPush();
    if (!uiCkSave) { // (tijdens de overgang terug staat de oude camera er nog)
      // loopt er een camera-animatie, dan telt haar eindstand
      const pos = camAnim ? camAnim.p1.clone() : camera.position.clone(), target = camAnim ? camAnim.t1.clone() : controls.target.clone();
      const quat = camAnim ? new THREE.Quaternion().setFromRotationMatrix(uiCkM.lookAt(pos, target, camera.up)) : camera.quaternion.clone();
      uiCkSave = { pos, target, quat, fov: camera.fov, near: camera.near, far: camera.far, lastFit: uiLastFit, fitFree: uiLastFit === uiFitRef ? uiFitFree : H - VIEW.t - VIEW.b, user: uiUserCam };
    }
    camAnim = null; controls.enabled = false;
    uiCk.fov = CFG.cockpit.fov;
  }
  if (!uiCkShow) uiCkShow = uiCkInner();
  COCKPIT = seat; uiCk.last = seat.id;
  if (first) uiCkEnv(true);
  uiCk.off.set(0, 0, 0); const k = seat.kijk || [0, 0]; uiCk.yaw = k[0]; uiCk.pitch = k[1]; uiCkClamp();
  camera.near = CFG.cockpit.near; camera.far = CFG.cockpit.far; camera.updateProjectionMatrix();
  // alles gemonteerd en zonder isolatie, dimmen of röntgen; de openers en de klikmodus blijven (de camera staat al vast)
  if (first) appApplyPreset(appPresetById.get('assembled'), { noHistory: true, openMode: OPENMODE, keepOpen: true });
  else { uiVisDirty = true; }
  const p1 = V3(0, 0, 0), q1 = new THREE.Quaternion(); uiCkPose(p1, q1);
  uiCkStart(p1, q1, uiCkVfov(), false, opt.instant);
  uiAfterAction();
  return true;
}
function uiCkExit(instant) {
  if (!COCKPIT) return false;
  uiStopTour(); hideHint();
  COCKPIT = null; uiCkShow = null; uiCkHide = null; applyVisibility();
  uiCkEnv(false); uiCkCloseInside(instant);
  const sv = uiCkSave;
  if (sv) uiCkStart(sv.pos.clone(), sv.quat.clone(), sv.fov, true, instant); else uiCkAnim = null;
  uiAfterAction();
  return true;
}
function uiCkState() {
  if (!COCKPIT) return null;
  const r = v => +v.toFixed(4);
  return { seat: COCKPIT.id, label: COCKPIT.label, yaw: r(uiCk.yaw), pitch: r(uiCk.pitch), fov: r(uiCk.fov), off: uiCk.off.toArray().map(r), eye: V3(...COCKPIT.oog).add(uiCk.off).toArray().map(r), moving: !!uiCkAnim };
}
// keuzelijst van de zitplaatsen (in het dock op de plek van de explosieschuif) en de knop Uitstappen
const uiCkSel = $('ckSeat');
for (const st of uiCkSeats) { const o = document.createElement('option'); o.value = st.id; o.textContent = st.label; uiCkSel.appendChild(o); }
uiCkSel.addEventListener('change', () => { hideHint(); uiSetCockpit(uiCkSel.value); });
$('btnCkOut').onclick = () => uiCkExit();
// zonder cockpit in auto.json: geen knop, geen uitleg in de hulp
if (!UI_CK) { const b = document.querySelector('#openSeg [data-ckmode]'); if (b) b.remove(); $('openSeg').setAttribute('aria-label', TXT.segZonderCockpit); }
document.querySelectorAll('.ckhelp').forEach(e => { e.hidden = !UI_CK; });
// De segmentknop bovenin is één radiogroep: Uitklappen, Openen en Cockpit. De knop Cockpit heeft een eigen attribuut
// (data-ckmode): data-omode blijft de klikstand van Uitklappen of Openen, zoals de tests en de adresbalk die kennen.
const uiOpenBtns = [...document.querySelectorAll('#openSeg [role="radio"]')];
const uiViewModeOf = b => (b.dataset.ckmode ? 'cockpit' : b.dataset.omode);
function uiSetViewMode(m) { if (m === 'cockpit') uiSetCockpit(COCKPIT ? COCKPIT.id : uiCk.last); else uiSetOpenMode(m === 'open'); }
uiOpenBtns.forEach((b, i) => {
  b.addEventListener('click', () => { hideHint(); uiSetViewMode(uiViewModeOf(b)); });
  b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const j = (i + (e.key === 'ArrowRight' ? 1 : uiOpenBtns.length - 1)) % uiOpenBtns.length; uiSetViewMode(uiViewModeOf(uiOpenBtns[j])); uiOpenBtns[j].focus(); e.preventDefault(); });
});
$('btnOpenAll').onclick = () => uiOpenAllTo(true);
$('btnCloseAll').onclick = () => uiOpenAllTo(false);
els.open.onclick = () => { const pl = uiPanelPlan(SEL); if (pl) uiOpenTo(pl.n, pl.open); };
// openerlijst: een knop per opener (aria-pressed = open), bereikbaar met toetsenbord en schermlezer
const uiOpenChips = OPENERS.map(n => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = uiOpenLabel(n); b.setAttribute('aria-pressed', 'false');
  b.onclick = () => { uiCloseOpenList(); uiOpenTo(n, n.ot === 0); };
  $('openList').appendChild(b);
  return [n, b];
});
let uiOpenListOn = false;
$('btnOpenList').onclick = () => {
  uiOpenListOn = !uiOpenListOn; $('btnOpenList').setAttribute('aria-expanded', String(uiOpenListOn)); uiSyncOpenUi(); uiUiChanged(); layoutView();
  if (uiNarrow()) uiRefitSoon(); // de lijst neemt vrij beeld in of geeft het terug: de auto past in wat overblijft
};
// Op een smal scherm (telefoon staand en liggend, tablet) is de lijst een keuzemenu: na een keuze gaat hij dicht, zodat hij het
// beeld niet afdekt en het vrije beeld weer de volle hoogte heeft voordat de camera de opener kadreert. Op het bureaublad
// staat hij naast het beeld en blijft open.
function uiCloseOpenList() {
  if (!uiOpenListOn || !uiNarrow()) return;
  uiOpenListOn = false; $('btnOpenList').setAttribute('aria-expanded', 'false'); uiSyncOpenUi(); uiUiChanged(); layoutView();
}
let uiOpenWas = 'expand';
function uiSyncOpenUi() {
  uiUrlSync(); // de adresbalk volgt de openstand (ook via de testhaken setOpen en openAll)
  $('app').classList.toggle('omode', OPENMODE && !COCKPIT);
  $('app').classList.toggle('ckmode', !!COCKPIT);
  const cur = COCKPIT ? 'cockpit' : OPENMODE ? 'open' : 'expand';
  uiOpenBtns.forEach(b => { const on = uiViewModeOf(b) === cur; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
  if (UI_CK) { const v = COCKPIT ? COCKPIT.id : uiCk.last; if (uiCkSel.value !== v) uiCkSel.value = v; }
  let open = 0;
  for (const [n, b] of uiOpenChips) { const on = n.ot > 0; if (on) open++; if (b.getAttribute('aria-pressed') !== String(on)) b.setAttribute('aria-pressed', String(on)); }
  const txt = open + '/' + OPENERS.length;
  if ($('openCount').textContent !== txt) $('openCount').textContent = txt;
  const showList = OPENMODE && !COCKPIT && uiOpenListOn;
  if ($('openList').hidden === showList) $('openList').hidden = !showList;
  if (uiOpenWas !== cur) { uiOpenWas = cur; uiUiChanged(); layoutView(); }
}

/* ---------- weergave-bediening ---------- */
$('spread').addEventListener('input', e => { uiSetSpread(e.target.value / 100, false); $('spreadOut').textContent = TXT.procent(e.target.value); requestRender(); });
$('spread').addEventListener('change', () => { updateGround(); focusNodes(contextNodes()); });
$('tLabels').addEventListener('change', e => { LABELS = e.target.checked; requestRender(); });
$('tXray').addEventListener('change', e => { uiPush(); XRAY = e.target.checked; clearPreset(); applyMats(); uiAfterAction(); });
$('tSys').addEventListener('change', e => { uiPush(); SYSCOL = e.target.checked; clearPreset(); applyMats(); uiAfterAction(); });
$('tRotate').addEventListener('change', e => { controls.autoRotate = e.target.checked; requestRender(); });
els.quality.addEventListener('change', e => uiSetLite(!e.target.checked));
$('tDim').addEventListener('change', e => { uiDimOn = e.target.checked; if (!uiDimOn) uiSetDim(null); applyMats(); uiAfterAction(); });
$('tBatch').addEventListener('change', e => { uiSetBatching(e.target.checked); requestRender(); });
els.legend.innerHTML = Object.entries(SYS_COLORS).map(([k, c]) => `<span><i style="background:#${c.toString(16).padStart(6, '0')}"></i>${esc(k)}</span>`).join('');
document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => focusNodes(contextNodes(), DIRS[b.dataset.cam])));
// U5: thema. 'system' volgt prefers-color-scheme (geen data-theme); 'light' en 'dark' staan op <html> en in localStorage.
// De MutationObserver op data-theme (hieronder bij thema) past lichten en vloer aan.
const uiThemeBtns = [...document.querySelectorAll('#themeSeg [data-theme]')];
function uiThemeChoice() { const t = document.documentElement.getAttribute('data-theme'); return t === 'light' || t === 'dark' ? t : 'system'; }
function uiSetTheme(t) {
  t = t === 'light' || t === 'dark' ? t : 'system';
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  try { if (t === 'system') window.localStorage.removeItem(UI_THEME_KEY); else window.localStorage.setItem(UI_THEME_KEY, t); } catch (_) { }
  uiSyncTheme();
}
function uiSyncTheme() {
  const cur = uiThemeChoice();
  uiThemeBtns.forEach(b => { const on = b.dataset.theme === cur; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
uiThemeBtns.forEach((b, i) => {
  b.addEventListener('click', () => uiSetTheme(b.dataset.theme));
  b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const j = (i + (e.key === 'ArrowRight' ? 1 : uiThemeBtns.length - 1)) % uiThemeBtns.length; uiSetTheme(uiThemeBtns[j].dataset.theme); uiThemeBtns[j].focus(); e.preventDefault(); });
});
uiSyncTheme();
// U9: beeld opslaan en de kaart afdrukken
function uiSlug(s) { return uiNorm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || TXT.beeldNaam; }
function uiSaveImage() {
  const n = SEL || ROOT, r = uiPnRec(n), nums = r && r.kind === 'zelf' && r.u ? [...(r.u.oe || []).map(x => x[0]), ...(r.u.am || []).map(x => x[0] + ' ' + x[1])] : [];
  uiBatchSync(); renderer.render(scene, camera); // op verzoek tekenen: de buffer wordt na het tonen niet bewaard
  const dpr = renderer.getPixelRatio(), w = canvas.width, h = canvas.height, bar = Math.round(44 * dpr);
  const c2 = document.createElement('canvas'); c2.width = w; c2.height = h + bar;
  const g = c2.getContext('2d');
  const cs = getComputedStyle(document.body);
  g.fillStyle = cs.backgroundColor || '#e5e9ed'; g.fillRect(0, 0, w, h + bar);
  g.drawImage(canvas, 0, 0);
  g.fillStyle = cs.color || '#151a21'; g.textBaseline = 'middle';
  g.font = `700 ${Math.round(15 * dpr)}px ${cs.fontFamily}`; g.fillText(n.name, Math.round(14 * dpr), h + bar / 2, w * 0.55);
  g.font = `${Math.round(12 * dpr)}px ${cs.fontFamily}`; g.textAlign = 'right';
  g.fillText((nums.length ? TXT.beeldNummer(nums.slice(0, 2).join(', ')) : '') + TXT.beeldVoet(AUTO.titel, uiVersion), w - Math.round(14 * dpr), h + bar / 2, w * 0.43);
  const name = `${AUTO.id}-${uiSlug(n.name)}.png`;
  return new Promise(res => c2.toBlob(blob => {
    if (!blob) { uiToast(TXT.beeldMislukt); res(null); return; }
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    uiToast(TXT.beeldOpgeslagen(name));
    res({ name, w: c2.width, h: c2.height, numbers: nums });
  }, 'image/png'));
}
$('btnShot').onclick = () => { uiSaveImage(); };
$('btnPrint').onclick = () => { showTab('info'); try { window.print(); } catch (_) { } };
// korte melding onderin (U8, U9); een nieuwe vervangt de vorige
let uiToastTimer = 0;
function uiToast(txt) {
  els.toast.textContent = txt; els.toast.hidden = false; els.toast.classList.remove('gone');
  clearTimeout(uiToastTimer);
  uiToastTimer = setTimeout(() => { els.toast.classList.add('gone'); setTimeout(() => { if (els.toast.classList.contains('gone')) els.toast.hidden = true; }, REDUCED ? 0 : 300); }, CFG.tijd.toastMs);
}
// R2: melding die blijft staan tot ze wordt weggehaald (contextverlies)
function uiNotice(txt) { els.notice.hidden = !txt; els.notice.textContent = txt || ''; }
$('btnExplodeAll').onclick = () => { const r = uiScopeRoot(); uiPush(); explodeAllUnder(r); CTX = r; uiLabelForce = false; clearPreset(); focusNodes(contextNodes(), null, 1.02); uiAfterAction(); };
$('btnCollapseAll').onclick = () => { uiPush(); collapseAll(); uiDrop(); CTX = null; clearPreset(); focusNodes(contextNodes()); uiAfterAction(); };
$('btnShowAll').onclick = () => { uiPush(); isolate([]); clearPreset(); select(ROOT); focusNodes([ROOT]); uiAfterAction(); };
const uiModeBtns = [...document.querySelectorAll('#modes [data-mode]')];
function uiSetMode(m) {
  MODE = m;
  uiModeBtns.forEach(x => { const on = x.dataset.mode === m; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
  uiSetHover(null); uiHideTip(); requestRender();
}
uiModeBtns.forEach((b, i) => {
  b.addEventListener('click', () => uiSetMode(b.dataset.mode));
  b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const j = (i + (e.key === 'ArrowRight' ? 1 : uiModeBtns.length - 1)) % uiModeBtns.length; uiSetMode(uiModeBtns[j].dataset.mode); uiModeBtns[j].focus(); e.preventDefault(); });
});

/* ---------- explosieschuif en afspelen ---------- */
// Werkgroep: de geselecteerde groep, anders de enige geïsoleerde groep, anders de hele auto.
// Met L niveaus en x = waarde × L krijgt een groep op relatieve diepte r doel clamp(x − r, 0, 1).
function uiWorking() { if (SEL && SEL.asm) return SEL; if (ISO.length === 1) return ISO[0]; return ROOT; }
const uiLevelCache = new Map();
function uiLevels(w) {
  let L = uiLevelCache.get(w);
  if (!L) { L = []; for (const a of subtree(w)) if (a.asm) { const r = a.depth - w.depth; (L[r] || (L[r] = [])).push(a); } uiLevelCache.set(w, L); }
  return L;
}
function uiExplodeX(w) { let x = 0; for (const lv of uiLevels(w)) { let s = 0; for (const a of lv) s += a.target; x += s / lv.length; } return x; }
function uiApplyX(w, x, now) {
  uiLevels(w).forEach((lv, r) => { const t = clamp(x - r, 0, 1); for (const a of lv) now ? uiSetNow(a, t) : setTarget(a, t, 0, 0.6); });
  // Een opgetild onderdeel gaat terug zodra zijn groep dichtgaat, anders zweeft het buiten de gesloten auto.
  if (uiLifted && !uiOpen(uiLifted.parent)) uiDrop();
}
let uiDrag = false, uiPlayS = null;
// Golf 5c-2, P3: tijdens afspelen draait dit elk frame; de DOM (waarde, tekst, aria-* en het pictogram) alleen schrijven als
// er iets verandert.
function uiSyncExplode(fromSlider) {
  const w = uiWorking(), L = uiLevels(w).length, x = uiExplodeX(w), v = L ? x / L : 0;
  const val = String(Math.round(v * 1000)), pct = TXT.procent(Math.round(v * 100)), vt = TXT.lagen(x, L);
  if (!fromSlider && !uiDrag && els.explode.value !== val) els.explode.value = val;
  if (els.explodeOut.textContent !== pct) els.explodeOut.textContent = pct;
  if (els.explode.getAttribute('aria-valuetext') !== vt) els.explode.setAttribute('aria-valuetext', vt);
  if (els.explodeName.textContent !== w.name) { els.explodeName.textContent = w.name; uiUiDirty = true; }
  const lbl = uiPlayS ? TXT.stop : (v >= 0.999 ? TXT.monteren : TXT.demonteren);
  if (els.play.lastChild.textContent !== lbl) { els.play.lastChild.textContent = lbl; els.play.setAttribute('aria-label', lbl); uiUiDirty = true; }
  const pressed = String(!!uiPlayS);
  if (els.play.getAttribute('aria-pressed') !== pressed) els.play.setAttribute('aria-pressed', pressed);
  const icon = uiPlayS ? '<path d="M7 6h3v12H7zM14 6h3v12h-3z"/>' : (v >= 0.999 ? '<path d="M16 5L5 12l11 7z"/>' : '<path d="M8 5l11 7-11 7z"/>');
  if (els.play._icon !== icon) { els.play._icon = icon; els.play.firstChild.innerHTML = icon; }
}
els.explode.addEventListener('input', () => {
  if (!uiDrag) { uiDrag = true; uiStopPlay(); uiStopTour(); hideHint(); uiPush(); uiSetDim(null); applyMats(); }
  const w = uiWorking(), L = uiLevels(w).length;
  uiApplyX(w, (els.explode.value / 1000) * L, true);
  CTX = w; uiLabelForce = false; clearPreset();
  uiSyncExplode(true); requestRender();
});
els.explode.addEventListener('change', () => { uiDrag = false; updateGround(); uiAfterAction(); });
function uiSetExplodeValue(v) {
  uiStopPlay(); uiPush(); uiSetDim(null);
  const w = uiWorking();
  uiApplyX(w, clamp(v, 0, 1) * uiLevels(w).length, false);
  CTX = w; uiLabelForce = false; clearPreset(); updateGround();
  uiAfterAction();
}
function uiPlay() {
  if (uiPlayS) { uiStopPlay(); return; }
  uiStopTour(); uiPush(); uiSetDim(null);
  const w = uiWorking(), L = uiLevels(w).length, x0 = uiExplodeX(w);
  const up = x0 / L < 0.999, x1 = up ? L : 0;
  uiPlayS = { w, x: x0, x1, v: (up ? 1 : -1) / 0.8 };
  CTX = w; uiLabelForce = false; clearPreset();
  // camera naar de eindstand
  const saved = []; uiLevels(w).forEach((lv, r) => lv.forEach(a => { saved.push([a, a.target]); a.target = clamp(x1 - r, 0, 1); }));
  try { focusNodes([w], null, 1.05, { dur: Math.min(2.5, Math.abs(x1 - x0) * 0.8) }); } finally { saved.forEach(([a, t]) => { a.target = t; }); }
  if (REDUCED) finishAll();
  uiAfterAction();
}
function uiStepPlay(dt) {
  const s = uiPlayS; if (!s) return false;
  s.x += s.v * dt;
  const done = s.v > 0 ? s.x >= s.x1 : s.x <= s.x1;
  if (done) s.x = s.x1;
  uiApplyX(s.w, s.x, true);
  if (done) { uiPlayS = null; updateGround(); uiAfterAction(); } else uiSyncExplode();
  return true;
}
function uiStopPlay() { if (!uiPlayS) return; uiPlayS = null; updateGround(); uiAfterAction(); }
els.play.onclick = uiPlay;
els.undo.onclick = () => { uiStopPlay(); uiStopTour(); uiUndo(); };
function uiSyncUndo() { els.undo.disabled = !uiHist.length; }

/* ---------- presets: categorieknoppen en menu ---------- */
let uiMenuCat = null, uiMenuBtn = null;
function uiBuildCats() {
  els.presets.innerHTML = '';
  for (const cat of appCats) {
    const list = PRESETS.filter(p => p.cat === cat && appPresetOk(p));
    if (!list.length) continue;
    const b = document.createElement('button');
    b.className = 'cat'; b.dataset.cat = cat; b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false');
    b.tabIndex = els.presets.children.length ? -1 : 0; // U6: één tabstop voor de werkbalk, pijlen lopen erdoorheen
    b.innerHTML = `<b>${esc(cat)}</b><small></small>`;
    b.onclick = () => (uiMenuCat === cat ? uiCloseMenu(true) : uiOpenMenu(cat, b));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); uiOpenMenu(cat, b); } });
    b.addEventListener('focus', () => uiCatTabStop(b));
    els.presets.appendChild(b);
  }
  uiSyncCats();
}
function uiCatTabStop(b) { for (const c of els.presets.children) c.tabIndex = c === b ? 0 : -1; }
// pijlen links en rechts, Home en End in de werkbalk met presetcategorieën (role="toolbar")
els.presets.addEventListener('keydown', e => {
  if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return;
  const cats = [...els.presets.children], i = cats.indexOf(document.activeElement);
  if (i < 0 || !cats.length) return;
  const j = e.key === 'Home' ? 0 : e.key === 'End' ? cats.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : cats.length - 1)) % cats.length;
  e.preventDefault(); uiCatTabStop(cats[j]); cats[j].focus();
});
let uiCatSeen = null;
function uiSyncCats() {
  const p = ACTIVE_PRESET && appPresetById.get(ACTIVE_PRESET);
  let textChanged = false;
  for (const b of els.presets.children) {
    const cat = b.dataset.cat, n = PRESETS.filter(q => q.cat === cat && appPresetOk(q)).length;
    const on = !!p && p.cat === cat;
    b.classList.toggle('on', on);
    const txt = cat === 'Overzicht' && appTour ? TXT.tourLoopt : (on ? p.label : TXT.presetsAantal(n));
    if (b.lastChild.textContent !== txt) { b.lastChild.textContent = txt; uiUiDirty = true; textChanged = true; }
    b.setAttribute('aria-label', TXT.catAria(cat, on ? p.label : ''));
  }
  // De naam van de actieve preset kan de presetbalk laten omslaan naar een tweede rij en zo het vrije beeld verkleinen.
  // Direct opnieuw meten: layoutView ziet dan de nieuwe hoogte en laat de camera opnieuw inpassen (G1), nog voor de
  // ResizeObserver van het dock aan de beurt is.
  if (textChanged && uiReady) layoutView();
  // In een zijwaarts schuivende rij (telefoon) schuift een nieuwe actieve categorie in beeld; handmatig schuiven blijft ongemoeid
  const act = p ? p.cat : null;
  if (act !== uiCatSeen) {
    uiCatSeen = act;
    const on = act && els.presets.querySelector('.cat.on'), row = els.presets;
    if (on && row.scrollWidth > row.clientWidth + 1) {
      const rr = row.getBoundingClientRect(), br = on.getBoundingClientRect();
      if (br.left < rr.left + 16) row.scrollLeft += br.left - rr.left - 16;
      else if (br.right > rr.right - 24) row.scrollLeft += br.right - rr.right + 24;
    }
  }
}
function uiMenuItems() { return [...els.menu.querySelectorAll('.mi')]; }
function uiOpenMenu(cat, btn) {
  uiCloseMenu(false);
  uiMenuCat = cat; uiMenuBtn = btn;
  const m = els.menu;
  m.innerHTML = '';
  // U6: de kop met de sluitknop staat buiten het element met role="menu"; dat bevat alleen menuitems
  const head = document.createElement('div'); head.className = 'mhead';
  head.innerHTML = `<span>${esc(cat)}</span>`;
  const close = document.createElement('button'); close.className = 'mclose'; close.setAttribute('aria-label', TXT.menuSluiten); close.textContent = '×'; close.onclick = () => uiCloseMenu(true);
  head.appendChild(close); m.appendChild(head);
  const list = document.createElement('div'); list.setAttribute('role', 'menu'); list.setAttribute('aria-label', TXT.menuAria(cat)); m.appendChild(list);
  for (const p of PRESETS.filter(q => q.cat === cat && appPresetOk(q))) {
    const b = document.createElement('button');
    b.className = 'mi'; b.setAttribute('role', 'menuitem'); b.dataset.preset = p.id; b.tabIndex = -1;
    const label = p.tour && appTour ? TXT.tourStoppen : p.label;
    b.innerHTML = `<span class="mi-t">${esc(label)}${p.key ? `<kbd>${p.key}</kbd>` : ''}</span><span class="mi-n">${esc(p.note)}</span>`;
    if (p.id === ACTIVE_PRESET) b.setAttribute('aria-current', 'true');
    b.onclick = () => { uiCloseMenu(false); uiRunPreset(p.id); };
    list.appendChild(b);
  }
  m.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  uiPlaceMenu();
  const items = uiMenuItems();
  const cur = items.find(i => i.getAttribute('aria-current') === 'true') || items[0];
  if (cur) cur.focus({ preventScroll: true });
  uiUiChanged();
}
function uiPlaceMenu() {
  const m = els.menu, btn = uiMenuBtn;
  if (!btn || m.hidden) return;
  if (window.innerWidth <= CFG.indeling.smal) { m.style.left = ''; m.style.top = ''; m.style.bottom = ''; m.style.maxHeight = ''; return; }
  const r = btn.getBoundingClientRect();
  const w = m.offsetWidth;
  m.style.left = clamp(r.left, 8, window.innerWidth - w - 8) + 'px';
  m.style.top = 'auto';
  m.style.bottom = (window.innerHeight - r.top + 8) + 'px';
  m.style.maxHeight = Math.max(160, r.top - 16) + 'px';
}
function uiCloseMenu(focusBack) {
  if (!uiMenuCat) return;
  els.menu.hidden = true; els.menu.innerHTML = '';
  if (uiMenuBtn) { uiMenuBtn.setAttribute('aria-expanded', 'false'); if (focusBack) uiMenuBtn.focus({ preventScroll: true }); }
  uiMenuCat = null; uiMenuBtn = null;
  uiUiChanged();
}
function uiMenuKey(e) {
  const items = uiMenuItems(); if (!items.length) return false;
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const j = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length; items[j].focus(); return true; }
  if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); items[e.key === 'Home' ? 0 : items.length - 1].focus(); return true; }
  if (e.key === 'Escape') { e.preventDefault(); uiCloseMenu(true); return true; }
  if (e.key === 'Tab') { uiCloseMenu(false); return false; }
  if (e.key === 'Enter' || e.key === ' ') { if (i >= 0) { e.preventDefault(); items[i].click(); } return true; }
  return false;
}
document.addEventListener('pointerdown', e => {
  const t = e.target;
  if (uiMenuCat && !els.menu.contains(t) && !(uiMenuBtn && uiMenuBtn.contains(t))) uiCloseMenu(false);
  if (!(t.closest && t.closest('#play'))) uiStopPlay();
  if (!(t.closest && t.closest('#tourBar, #menu, [data-cat="Overzicht"], #help, #helpDlg'))) uiStopTour();
  hideHint();
}, true);
function uiRunPreset(id) {
  const p = appPresetById.get(id); if (!p) return false;
  hideHint(); uiCloseMenu(false);
  if (p.tour) { appTour ? uiStopTour() : uiStartTour(); return true; }
  return appApplyPreset(p);
}
function uiTourCaption(p, i, n) {
  if (!p) { els.tourBar.hidden = true; if (uiNarrow()) layoutView(); uiUiChanged(); return; }
  els.tourText.innerHTML = `<b>${TXT.tourKop(i + 1, n, esc(p.label))}</b>${esc(p.note)}`;
  els.tourBar.hidden = false;
  if (uiNarrow()) layoutView();
  uiUiChanged();
}
// R4: de knoppen in de rondleidingsbalk volgen de stand (pauze of hervat, vorige uit bij de eerste stap)
function uiSyncTour() {
  uiSyncCats();
  const t = appTour, paused = !!(t && t.paused), pb = $('tourPause');
  pb.setAttribute('aria-pressed', String(paused));
  pb.setAttribute('aria-label', paused ? TXT.hervatten : TXT.pauze); pb.title = paused ? TXT.tourHervatten : TXT.tourPauzeren;
  pb.firstElementChild.innerHTML = paused ? '<path d="M8 5l11 7-11 7z"/>' : '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
  $('tourPrev').disabled = !t || t.i <= 0;
  $('tourNext').disabled = !t;
}
els.tourStop.onclick = () => uiStopTour();
$('tourPause').onclick = () => uiTourPause(!(appTour && appTour.paused));
$('tourPrev').onclick = () => uiTourStep(-1);
$('tourNext').onclick = () => uiTourStep(1);
// een verborgen tabblad zet de rondleiding stil; komt het terug, dan loopt hij verder (een eigen pauze blijft staan)
document.addEventListener('visibilitychange', () => {
  if (!appTour) return;
  if (document.hidden) { if (!appTour.paused) { uiTourPause(true); appTour.auto = true; } }
  else if (appTour.auto) { appTour.auto = false; uiTourPause(false); }
});
