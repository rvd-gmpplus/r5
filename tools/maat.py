"""Maatpoort: meet de gemonteerde auto en vergelijkt met de opgegeven maten van Renault (externe waarheid).

    python3 tools/maat.py               # exitcode 1 als een maat buiten de grenzen valt
    python3 tools/maat.py --diepte      # ook de diepteminima per hoofdgroep (golfdoel 5) tellen als poort
    python3 tools/maat.py --zelftest    # alleen de beoordeling, zonder browser: bewijst dat elke grens naar beide kanten werkt

Bron van de doelen: Renault Nederland, prijslijst 31 mei 2024 (tabel Afmetingen) en de brochure van oktober 2026
(blad 25, afmetingen en volumes). Zie docs/onderzoek/exterieur-maten.md voor de bronnen en de afwegingen.

Wat het meet, in het autoframe (x links +, y omhoog, z voor +, meter, y = 0 is de grond), met de auto gemonteerd en alles dicht:
- de omhullende doos van de carrosserie (meshes onder Carrosserie die echt zichtbaar zijn: de mesh en elke ouder tot de
  scène) zonder buitenspiegels en met buitenspiegels. Antenne, ruitenwissers en grepen tellen niet mee, net als in
  tools/silhouette.py;
- per wiel het midden en het buitenvlak van de band (knoop Band onder Wiel ...), daaruit spoor voor, spoor achter en wielbasis;
- per wiel de huid van de carrosserie ernaast: stralen van buiten naar binnen, in z binnen de omtrek van de band en in y van
  ashoogte tot een handbreedte boven de band (de wielkastrand); de buitenste treffer is de huid. Alleen huidpanelen tellen:
  dorpels, onderlip, onderinlaat, diffusor, kentekens en glas niet (HUID_NIET; grepen vallen al weg met NIET_CARROSSERIE). De band moet 0 tot 45 mm binnen die
  huid blijven (INZET).
  Beperking: de uitsluiting gaat op knoopnaam. Een nieuw onderdeel naast de wielkast met een andere naam (een sierlijst,
  een spatlap) telt als huid tot het in HUID_NIET staat; de regel naast elk wiel noemt daarom ook waar de huid is geraakt.
Elke maat heeft een onder- en een bovengrens. De diepte (aantal onderdelen per hoofdgroep)
komt uit data/diepte.json; zonder --diepte meldt dit script die alleen.
"""
import sys, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
EPS = 1e-6   # tolerantie bij het vergelijken met een grens (floats nooit exact)

# Doelen in meter: (sleutel, omschrijving, doel, min, max, bron)
PL = 'Renault NL prijslijst 31 mei 2024, Afmetingen'
BR = 'Renault NL brochure oktober 2026, blad 25'
DOELEN = [
    ('lengte', 'lengte carrosserie', 3.922, 3.912, 3.932, PL + '; ' + BR),
    # Breedte zonder spiegels: de bronnen verschillen. Brochure en prijslijst geven 1774 mm als maximale breedte tussen de
    # spatborden; dezelfde prijslijst geeft 1808 mm als totale breedte zonder zijspiegels, en Renault NL (website) noemt 1808
    # bij spiegels ingeklapt. Welke van de twee de wielkastbollingen meeneemt, is niet te zien (docs/specificaties-en-bronnen.md).
    # De poort laat daarom beide toe: 10 mm onder 1774 tot 10 mm boven 1808.
    ('breedte', 'breedte zonder spiegels (1774 tot 1808, zie bron)', 1.774, 1.764, 1.818, PL + ' (maximale breedte tussen spatborden 1774; totale breedte zonder zijspiegels 1808); ' + BR),
    ('hoogte', 'hoogte', 1.498, 1.488, 1.508, PL + '; ' + BR),
    ('wielbasis', 'wielbasis', 2.540, 2.535, 2.545, PL + '; ' + BR),
    ('spoorVoor', 'spoor voor (wielmidden tot wielmidden)', 1.548, 1.538, 1.558, PL),
    ('spoorAchter', 'spoor achter (wielmidden tot wielmidden)', 1.532, 1.522, 1.542, PL),
    ('overhangVoor', 'overhang voor (vooras tot neus)', 0.749, 0.739, 0.759, PL + '; ' + BR),
    ('overhangAchter', 'overhang achter (achteras tot staart)', 0.633, 0.623, 0.643, PL + '; ' + BR),
    ('breedteSpiegels', 'breedte met uitgeklapte spiegels', 2.020, 1.990, 2.050, PL + '; ' + BR),
]
WIELEN = ['Wiel linksvoor', 'Wiel rechtsvoor', 'Wiel linksachter', 'Wiel rechtsachter']
# Band binnen de huid: minimaal 0 (de band steekt nooit buiten de carrosserie), maximaal 45 mm. Het buitenvlak van de band
# ligt op spoor/2 plus bandbreedte/2: 1548/2 + 195/2 = 871,5 mm (195/55 R18). De wielkastbolling kan tot de helft van 1808
# reiken, 904 mm; dan staat de band 32,5 mm binnen de huid. 45 mm geeft daar ruim een centimeter marge op.
INZET = (0.0, 0.045)
# Knopen naast de wielkast die geen huid zijn (onderrand, aanbouw en glas): stralen die alleen deze raken, tellen niet als huid.
# Onderbak staat er bewust niet in: in versie 1 is dat de zijwand van de carrosserie van 0,22 tot 1,05 m, de huid zelf.
HUID_NIET = r'^(Dorpel|Onderlip|Onderinlaat|Diffusor|Kenteken)|ruit|glas'
# Zoals tools/silhouette.py: deze knopen (en alles eronder) tellen niet mee in de maten van de carrosserie.
NIET_CARROSSERIE = r'Antenne|Ruitenwisser|Wisser|greep'

MEASURE = r"""(cfg) => {
  const L = window.__model; L.collapseAll(); L.finishAll(); L.ROOT.obj.updateMatrixWorld(true);
  const body = L.ALL.find(n => n.name === 'Carrosserie');
  const under = (n, re) => { for (let p = n; p && p !== body; p = p.parent) if (re.test(p.name)) return true; return false; };
  const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };   // de hele keten, niet alleen de mesh
  const skip = new RegExp(cfg.niet, 'i'), notSkin = new RegExp(cfg.huidNiet, 'i');
  const all = body.meshes.filter(m => shown(m) && !under(m.userData.node, skip));
  const noMirror = all.filter(m => !under(m.userData.node, /^Buitenspiegel/));
  const skin = noMirror.filter(m => !under(m.userData.node, notSkin) && !(m.material && m.material.name === 'glass'));
  const boxOf = list => { const b = new THREE.Box3(), t = new THREE.Box3(); for (const m of list) { t.setFromObject(m, true); b.union(t); } return b; };
  const b0 = boxOf(noMirror), b1 = boxOf(all);
  const wheels = {};
  for (const name of cfg.wielen) {
    const w = L.ALL.find(n => n.name === name);
    if (!w) { wheels[name] = null; continue; }
    const tyre = []; (function walk(n) { if (!n.asm && /^Band/.test(n.name)) tyre.push(n); n.kids.forEach(walk); })(w);
    if (!tyre.length) { wheels[name] = null; continue; }
    const b = new THREE.Box3(), t = new THREE.Box3(); for (const n of tyre) { t.setFromObject(n.obj, true); b.union(t); }
    const c = b.getCenter(new THREE.Vector3()), s = c.x >= 0 ? 1 : -1;
    wheels[name] = { cx: c.x, cy: c.y, cz: c.z, r: (b.max.y - b.min.y) / 2, buiten: s > 0 ? b.max.x : -b.min.x, s };
  }
  // huid naast elk wiel: stralen van buiten naar binnen over de wielkastrand
  const rc = new THREE.Raycaster(); rc.layers.enableAll();   // gebundeld tekenen zet losse meshes op laag 1
  for (const w of Object.values(wheels)) {
    if (!w) continue;
    let huid = null, at = null, wie = null;
    for (let z = w.cz - 0.9 * w.r; z <= w.cz + 0.9 * w.r + 1e-9; z += 0.02)
      for (let y = w.cy; y <= w.cy + w.r + 0.15 + 1e-9; y += 0.01) {
        rc.set(new THREE.Vector3(w.s * 2.5, y, z), new THREE.Vector3(-w.s, 0, 0)); rc.far = 2.5;
        const h = rc.intersectObjects(skin, false)[0];
        if (h && (huid === null || Math.abs(h.point.x) > huid)) { huid = Math.abs(h.point.x); at = [y, z]; wie = h.object.userData.node.name; }
      }
    w.huid = huid; w.huidOp = at; w.huidKnoop = wie;
  }
  const parts = {};
  // zoals tools/integrity.py (content, parts): onderdelen onder de groep, de groep zelf niet meegeteld
  for (const g of L.ROOT.kids) { let c = 0; (function walk(n) { if (n !== g && !n.asm) c++; n.kids.forEach(walk); })(g); parts[g.name] = c; }
  return { b0: { min: b0.min.toArray(), max: b0.max.toArray() }, b1: { min: b1.min.toArray(), max: b1.max.toArray() }, wheels, parts, meshes: all.length, huidMeshes: skin.length };
}"""


def afleiden(r):
    """Model-maten uit de ruwe meting; ontbrekend wordt None."""
    b0, b1, w = r['b0'], r['b1'], r['wheels']
    lv, rv, la, ra = (w.get(n) for n in WIELEN)
    m = {
        'lengte': b0['max'][2] - b0['min'][2],
        'breedte': b0['max'][0] - b0['min'][0],
        'hoogte': b0['max'][1],
        'breedteSpiegels': b1['max'][0] - b1['min'][0],
    }
    m['spoorVoor'] = lv['cx'] - rv['cx'] if lv and rv else None
    m['spoorAchter'] = la['cx'] - ra['cx'] if la and ra else None
    if lv and rv and la and ra:
        zf, zr = (lv['cz'] + rv['cz']) / 2, (la['cz'] + ra['cz']) / 2
        m['wielbasis'] = zf - zr
        m['overhangVoor'] = b0['max'][2] - zf
        m['overhangAchter'] = zr - b0['min'][2]
    else:
        m['wielbasis'] = m['overhangVoor'] = m['overhangAchter'] = None
    inzet = {}
    for n in WIELEN:
        x = w.get(n)
        inzet[n] = (x['huid'] - x['buiten']) if x and x.get('huid') is not None else None
    return m, inzet


def mm(v):
    return '-' if v is None else f'{v * 1000:.0f} mm'


def beoordeel(m, inzet):
    """Regels en fouten. Elke grens is inclusief, met EPS als marge tegen afronding."""
    rows, fails = [], []
    for k, oms, doel, lo, hi, _ in DOELEN:
        v = m.get(k)
        ok = v is not None and lo - EPS <= v <= hi + EPS
        rows.append(f'  {oms:<48} model {mm(v):>8}  doel {mm(doel):>8}  grens {lo * 1000:.0f} tot {hi * 1000:.0f} mm  {"ok" if ok else "BUITEN DE GRENS"}')
        if not ok:
            fails.append(f'{oms}: model {mm(v)}, doel {mm(doel)} (afwijking {"-" if v is None else f"{(v - doel) * 1000:+.0f} mm"})')
    for n in WIELEN:
        v = inzet.get(n)
        ok = v is not None and INZET[0] - EPS <= v <= INZET[1] + EPS
        rows.append(f'  {"band binnen de huid, " + n:<48} model {mm(v):>8}  doel {INZET[0] * 1000:.0f} tot {INZET[1] * 1000:.0f} mm{"":19}{"ok" if ok else "BUITEN DE GRENS"}')
        if not ok:
            wat = 'geen band of geen huid gevonden' if v is None else ('band steekt buiten de huid' if v < 0 else 'band staat te ver binnen de huid')
            fails.append(f'{n}: {wat} ({mm(v)}, toegestaan {INZET[0] * 1000:.0f} tot {INZET[1] * 1000:.0f} mm)')
    return rows, fails


DIEPTE = os.path.join(HERE, '..', 'data', 'diepte.json')


def diepte_regels(pad=DIEPTE):
    """Diepteminima per hoofdgroep uit data/diepte.json ({hoofdgroep: minimum aantal onderdelen}); sleutels met _ zijn uitleg.
    Bewust niet in anchors.json: integrity.py (generiek) zou de sleutel als knooplijst lezen, en onder content tot golf 5 rood staan."""
    with open(pad, encoding='utf-8') as fh:
        a = json.load(fh)
    return {g: int(n) for g, n in a.items() if not g.startswith('_')}


def beoordeel_diepte(parts, minima):
    """Regels en fouten voor de diepte: per hoofdgroep minstens het minimum; een ontbrekende groep telt als 0."""
    rows, fails = [], []
    for g, mn in minima.items():
        c = parts.get(g, 0)
        rows.append(f'  {g:<26} {c:>5} onderdelen, minimaal {mn:>5}  {"ok" if c >= mn else "te weinig"}')
        if c < mn:
            fails.append(f'diepte {g}: {c} onderdelen, minimaal {mn}')
    return rows, fails


def alle_fouten(fails, dfails, gate_diepte):
    """De poort: de maten altijd, de diepte alleen met --diepte (golfdoel 5)."""
    return fails + (dfails if gate_diepte else [])


def zelftest():
    """Beoordeling zonder browser: doelwaarden zijn groen, net binnen elke grens groen, net erbuiten (beide kanten) rood."""
    goed = {k: d for k, _, d, _, _, _ in DOELEN}
    inz = {n: 0.010 for n in WIELEN}
    gevallen = [('alles op het doel', goed, inz, True)]
    for k, _, d, lo, hi, _ in DOELEN:
        for v, verwacht, wat in ((lo, True, 'op de ondergrens'), (hi, True, 'op de bovengrens'),
                                 (lo - 0.001, False, '1 mm onder de ondergrens'), (hi + 0.001, False, '1 mm boven de bovengrens')):
            gevallen.append((f'{k} {wat}', {**goed, k: v}, inz, verwacht))
        gevallen.append((f'{k} ontbreekt', {**goed, k: None}, inz, False))
    lo, hi = INZET
    for n in WIELEN:   # elke grens van de inzet, voor elk wiel, naar beide kanten
        for v, verwacht, wat in ((lo, True, 'op de ondergrens'), (hi, True, 'op de bovengrens'),
                                 (lo - 0.001, False, '1 mm buiten de huid'), (hi + 0.001, False, '1 mm boven de bovengrens')):
            gevallen.append((f'{n} band {wat}', goed, {**inz, n: v}, verwacht))
        gevallen.append((f'{n} geen huid gevonden', goed, {**inz, n: None}, False))
    slecht = 0
    def check(naam, groen, verwacht):
        nonlocal slecht
        if groen != verwacht:
            slecht += 1
            print(f'ZELFTEST FOUT: {naam}: verwacht {"groen" if verwacht else "rood"}, kreeg {"groen" if groen else "rood"}')
    for naam, m, i, verwacht in gevallen:
        check(naam, not beoordeel(m, i)[1], verwacht)
    # diepte: het echte bestand, een tijdelijk bestand met uitleg en een getal als tekst, en de poort met en zonder --diepte
    import tempfile
    echt = diepte_regels()
    check('data/diepte.json heeft minima en geen uitlegsleutel', bool(echt) and all(isinstance(v, int) and not k.startswith('_') for k, v in echt.items()), True)
    with tempfile.TemporaryDirectory() as d:
        pad = os.path.join(d, 'diepte.json')
        with open(pad, 'w', encoding='utf-8') as fh:
            json.dump({'_uitleg': 'x', 'A': 10, 'B': '3'}, fh)
        check('diepte_regels leest een tijdelijk bestand goed', diepte_regels(pad) == {'A': 10, 'B': 3}, True)
    minima = {'A': 10, 'B': 3}
    n_diepte = 0
    for parts, verwacht, wat in (({'A': 10, 'B': 3}, True, 'op het minimum'), ({'A': 11, 'B': 4}, True, 'boven het minimum'),
                                 ({'A': 9, 'B': 3}, False, '1 onder het minimum'), ({'A': 10}, False, 'groep ontbreekt')):
        _, df = beoordeel_diepte(parts, minima)
        check(f'diepte {wat}, met --diepte', not alle_fouten([], df, True), verwacht)
        check(f'diepte {wat}, zonder --diepte', not alle_fouten([], df, False), True)
        n_diepte += 2
    check('maatfout blijft rood zonder --diepte', not alle_fouten(['x'], [], False), False)
    check('maatfout blijft rood met --diepte', not alle_fouten(['x'], [], True), False)
    n = len(gevallen) + 2 + n_diepte + 2
    print(f'zelftest: {n} gevallen, {slecht} fout')
    print('ZELFTEST OK' if not slecht else 'ZELFTEST NIET OK')
    return 1 if slecht else 0


def main():
    args = sys.argv[1:]
    if '--zelftest' in args:
        sys.exit(zelftest())
    gate_diepte = '--diepte' in args
    sys.path.insert(0, HERE)
    from harness import session
    with session() as s:
        pg = s.page(800, 600)
        r = pg.evaluate(MEASURE, {'wielen': WIELEN, 'niet': NIET_CARROSSERIE, 'huidNiet': HUID_NIET})
        m, inzet = afleiden(r)
        rows, fails = beoordeel(m, inzet)
        print(f"maten (bron: {PL}; {BR}), {r['meshes']} carrosseriemeshes gemeten, {r['huidMeshes']} als huid bij de wielen")
        print('\n'.join(rows))
        for n in WIELEN:
            w = r['wheels'].get(n)
            if w:
                print(f"  {n}: midden x {w['cx'] * 1000:+.0f} y {w['cy'] * 1000:.0f} z {w['cz'] * 1000:+.0f} mm, band buiten {w['buiten'] * 1000:.0f} mm, huid {mm(w.get('huid'))} ({w.get('huidKnoop') or '-'})")
        minima = diepte_regels()
        print('diepte (onderdelen per hoofdgroep, golfdoel 5: factor 5 op golf 1)' + ('' if gate_diepte else ', alleen gemeld; --diepte maakt dit een poort'))
        drows, dfails = beoordeel_diepte(r['parts'], minima)
        print('\n'.join(drows) if drows else '  geen diepteminima in data/diepte.json')
        alle = alle_fouten(fails, dfails, gate_diepte)
        print('MATEN OK' if not alle else 'MATEN NIET OK:\n  ' + '\n  '.join(alle))
        s.report()
        sys.exit(1 if alle or s.errors() else 0)


if __name__ == '__main__':
    main()
