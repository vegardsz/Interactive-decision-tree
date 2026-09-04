// ── Wizard state ──────────────────────────────────────────────────────────
let currentView = 'wizard', currentId = 'start', log = [], history = [], selectedUcId = null;

// ── Avdeling state ────────────────────────────────────────────────────────
function makeAvdelingStates() {
  const s = {};
  for (const [key, p] of Object.entries(AVDELING_PRESETS))
    s[key] = { avdeling: { navn: p.navn, kostnadssenter: p.kostnadssenter }, policy: { ...p.policy } };
  return s;
}
let avdelingStates = makeAvdelingStates();
let currentAvdeling = 'it';

function syncAvdelingDOM() {
  const navnEl = document.getElementById('tc-avdeling-navn');
  const ksEl   = document.getElementById('tc-avdeling-ks');
  if (navnEl) navnEl.value = testState.avdeling.navn;
  if (ksEl)   ksEl.value   = testState.avdeling.kostnadssenter;

  const policySection = document.getElementById('tc-policy-section');
  if (!policySection) return;
  const policyChecks = policySection.querySelectorAll('input[type="checkbox"]');
  if (policyChecks[0]) policyChecks[0].checked = testState.policy.policyAktiv;
  if (policyChecks[1]) policyChecks[1].checked = testState.policy.enhetAktiv;
  if (policyChecks[2]) policyChecks[2].checked = testState.policy.aboAktiv;
  if (policyChecks[3]) policyChecks[3].checked = testState.policy.enhetUtvalg;
  const policyNums = policySection.querySelectorAll('input[type="number"]');
  if (policyNums[0]) policyNums[0].value = testState.policy.enhetMaxPris;
  if (policyNums[1]) policyNums[1].value = testState.policy.aboMaxPris;
  const textarea = policySection.querySelector('textarea');
  if (textarea) textarea.value = testState.policy.enhetUtvalgListe;
  document.getElementById('tc-policy-sub').style.display = testState.policy.policyAktiv ? '' : 'none';
}

function velgAvdeling(key) {
  if (!AVDELING_PRESETS[key]) return;
  avdelingStates[currentAvdeling] = {
    avdeling: { ...testState.avdeling },
    policy:   { ...testState.policy }
  };
  currentAvdeling = key;
  const state = avdelingStates[key];
  Object.assign(testState.avdeling, state.avdeling);
  Object.assign(testState.policy,   state.policy);
  syncAvdelingDOM();
  renderTestGraph();
}

// ── Testbruker state ──────────────────────────────────────────────────────
const testState = {
  tilordning:  { type: 'personlig', kontekstNavn: 'Møterom A' },
  bruker:      { navn: 'Ola Nordmann' },
  avdeling:    { navn: 'IT-avdelingen', kostnadssenter: 'KS-1234' },
  policy:      { policyAktiv: true, enhetAktiv: true,  enhetMaxPris: 12000, aboAktiv: false, aboMaxPris: 400, enhetUtvalg: true, enhetUtvalgListe: 'iPhone 16, Samsung S25, Pixel 9' },
  enhet:       { aktiv: false, pris: 14990, 'kjøpsmodell': 'kjøp', leasingMåneder: 24 },
  abonnement:  { aktiv: false, plan: 'Business L', pris: 449, simType: 'eSIM' },
  fakturasted: { enhet: 'kostnadssenter', abo: 'kostnadssenter', splitAbo: false },
  betaling:    { frekvens: 'månedlig', kjøpMåneder: 1 }
};
let drawnEdgesTest = new Set();

function formatKr(n) {
  return Number(n).toLocaleString('no-NO') + ' kr';
}

function computeTestNodeState() {
  const isKontekstuell = testState.tilordning.type === 'kontekstuell';
  const isLeasing = testState.enhet['kjøpsmodell'] === 'leasing';
  const måneder   = testState.enhet.leasingMåneder || 24;

  // Mellomlegg is irrelevant for kontekstuell (company pays all)
  const policyOn = !isKontekstuell && testState.policy.policyAktiv;
  const enhetOver = policyOn && testState.enhet.aktiv && testState.policy.enhetAktiv
    ? Math.max(0, testState.enhet.pris - testState.policy.enhetMaxPris)
    : 0;
  const enhetMellomlegg = isLeasing && enhetOver > 0
    ? Math.round(enhetOver / måneder)
    : enhetOver;

  const aboMellomlegg = policyOn && testState.abonnement.aktiv && testState.policy.aboAktiv
    ? Math.max(0, testState.abonnement.pris - testState.policy.aboMaxPris)
    : 0;

  const hasMellomlegg  = enhetMellomlegg > 0 || aboMellomlegg > 0;
  const hasEnhetOrAbo  = testState.enhet.aktiv || testState.abonnement.aktiv;
  const katalogAktiv   = policyOn && testState.policy.enhetUtvalg && testState.enhet.aktiv;
  const policyVisible  = policyOn && (testState.policy.enhetAktiv || testState.policy.aboAktiv || katalogAktiv);

  const split = testState.fakturasted.splitAbo && !isKontekstuell;
  const active = {
    user:              true,
    avdeling:          true,
    policy:            policyVisible,
    katalog:           katalogAktiv,
    fakturasted:       split ? testState.enhet.aktiv : hasEnhetOrAbo,
    'fakturasted-abo': split && testState.abonnement.aktiv,
    enhet:             testState.enhet.aktiv,
    abo:               testState.abonnement.aktiv,
    sim:               testState.abonnement.aktiv,
    mellomlegg:        hasMellomlegg,
    betalingsmetode:   hasMellomlegg
  };

  const edges = new Set();
  edges.add('user-avdeling');
  if (!isKontekstuell && policyVisible) edges.add('avdeling-policy');
  if (split) {
    if (testState.enhet.aktiv)      edges.add('avdeling-fakturasted');
    if (testState.abonnement.aktiv) edges.add('avdeling-fakturasted-abo');
  } else {
    if (hasEnhetOrAbo) edges.add('avdeling-fakturasted');
  }
  if (active.enhet) {
    edges.add('user-enhet');
    if (!isKontekstuell) {
      if (policyOn && testState.policy.enhetAktiv) edges.add('policy-enhet');
      if (katalogAktiv) {
        edges.add('policy-katalog');
        edges.add('katalog-enhet');
      }
    }
  }
  if (active.abo) {
    edges.add('user-abo');
    if (policyOn && testState.policy.aboAktiv) edges.add('policy-abo');
    if (active.sim)                edges.add('abo-sim');
  }
  if (enhetMellomlegg > 0) edges.add('enhet-mellomlegg');
  if (aboMellomlegg   > 0) edges.add('abo-mellomlegg');
  if (hasMellomlegg)       edges.add('mellomlegg-betalingsmetode');

  return { active, edges, enhetMellomlegg, aboMellomlegg, isKontekstuell };
}

// ── Log / node view state ─────────────────────────────────────────────────
let logView = 'list';
let drawnEdges = new Set();

function computeNodeState() {
  const active = {
    user: true, avdeling: false, fakturasted: false, policy: false,
    enhet: false, abo: false, sim: false, mellomlegg: false, betalingsmetode: false
  };
  const edges = new Set();

  for (const e of log) {
    if (!e) continue;
    if (e.title === 'Sett avdeling / brukergruppe')     active.avdeling     = true;
    if (e.title === 'Policy' || e.title === 'Individuell policy' || e.title === 'Konfigurer policy og rettigheter') active.policy = true;
    if (e.title === 'Fakturering utstyr' || e.title === 'Fakturering abonnement') active.fakturasted = true;
    if (e.category === 'equipment')                      active.enhet        = true;
    if (e.category === 'subscription')                   active.abo          = true;
    if (e.title === 'SIM')                               active.sim          = true;
    if (e.title === 'Kostnad utstyr'      && e.aspects && e.aspects.some(a => a.includes('Over policy')))
      active.mellomlegg = true;
    if (e.title === 'Kostnad abonnement'  && e.aspects && e.aspects.some(a => a.includes('Over policy')))
      active.mellomlegg = true;
    if (e.title === 'Mellomlegg utstyr' || e.title === 'Mellomlegg abonnement')
      active.betalingsmetode = true;
  }

  if (active.avdeling)        edges.add('user-avdeling');
  if (active.policy)          edges.add('avdeling-policy');
  if (active.fakturasted)     edges.add('avdeling-fakturasted');
  if (active.enhet)           edges.add('user-enhet');
  if (active.abo)             edges.add('user-abo');
  if (active.sim)             edges.add('abo-sim');
  if (active.betalingsmetode) edges.add('mellomlegg-betalingsmetode');

  const costEnhet = log.some(e => e && e.title === 'Kostnad utstyr');
  const costAbo   = log.some(e => e && e.title === 'Kostnad abonnement');
  if (active.policy && active.enhet && costEnhet) edges.add('policy-enhet');
  if (active.policy && active.abo   && costAbo)   edges.add('policy-abo');

  if (active.mellomlegg) {
    if (log.some(e => e && e.title === 'Kostnad utstyr'     && e.aspects && e.aspects.some(a => a.includes('Over policy'))))
      edges.add('enhet-mellomlegg');
    if (log.some(e => e && e.title === 'Kostnad abonnement' && e.aspects && e.aspects.some(a => a.includes('Over policy'))))
      edges.add('abo-mellomlegg');
  }

  return { active, edges };
}

function syncAllDOM() {
  // Tilordning
  const tilEl = document.querySelector(`input[name="tilordning"][value="${testState.tilordning.type}"]`);
  if (tilEl) tilEl.checked = true;
  const brukerInput = document.querySelector('#tc-bruker-fields .tc-input');
  if (brukerInput) brukerInput.value = testState.bruker.navn;
  const kontekstInput = document.querySelector('#tc-kontekst-fields .tc-input');
  if (kontekstInput) kontekstInput.value = testState.tilordning.kontekstNavn;

  // Avdeling + Policy
  syncAvdelingDOM();

  // Enhet
  const enhetAktiv = document.getElementById('tc-enhet-aktiv');
  if (enhetAktiv) enhetAktiv.checked = testState.enhet.aktiv;
  const enhetPris = document.getElementById('tc-enhet-pris');
  if (enhetPris) enhetPris.value = testState.enhet.pris;
  const kjopsEl = document.querySelector(`input[name="kjopsmodell"][value="${testState.enhet['kjøpsmodell']}"]`);
  if (kjopsEl) kjopsEl.checked = true;
  const leasingEl = document.querySelector(`input[name="leasingmnd"][value="${testState.enhet.leasingMåneder}"]`);
  if (leasingEl) leasingEl.checked = true;

  // Abonnement
  const aboAktiv = document.getElementById('tc-abo-aktiv');
  if (aboAktiv) aboAktiv.checked = testState.abonnement.aktiv;
  const aboPlan = document.getElementById('tc-abo-plan');
  if (aboPlan) aboPlan.value = testState.abonnement.plan;
  const aboPris = document.getElementById('tc-abo-pris');
  if (aboPris) aboPris.value = testState.abonnement.pris;
  const simEl = document.querySelector(`input[name="simtype"][value="${testState.abonnement.simType}"]`);
  if (simEl) simEl.checked = true;

  // Betaling
  const betEl = document.querySelector(`input[name="betfrekvens"][value="${testState.betaling.frekvens}"]`);
  if (betEl) betEl.checked = true;
  const kjopMndEl = document.querySelector(`input[name="kjopmaaneder"][value="${testState.betaling.kjøpMåneder}"]`);
  if (kjopMndEl) kjopMndEl.checked = true;

  // Fakturasted
  const faktEnhet = document.querySelector(`input[name="fakturasted-enhet"][value="${testState.fakturasted.enhet}"]`);
  if (faktEnhet) faktEnhet.checked = true;
  const splitEl = document.getElementById('tc-split-faktura');
  if (splitEl) splitEl.checked = testState.fakturasted.splitAbo;
  const faktAbo = document.querySelector(`input[name="fakturasted-abo"][value="${testState.fakturasted.abo}"]`);
  if (faktAbo) faktAbo.checked = true;
}

function applyUseCasePreset(id) {
  if (!id) return;
  const preset = UC_PRESETS.find(p => p.id === id);
  if (!preset) return;

  Object.assign(testState.tilordning,  { ...preset.tilordning });
  Object.assign(testState.bruker,      { ...preset.bruker });
  Object.assign(testState.policy,      { ...preset.policy });
  Object.assign(testState.enhet,       { ...preset.enhet });
  Object.assign(testState.abonnement,  { ...preset.abonnement });
  Object.assign(testState.fakturasted, { ...preset.fakturasted });
  Object.assign(testState.betaling,    { ...preset.betaling });

  const descEl = document.getElementById('tc-uc-desc');
  if (descEl) descEl.textContent = preset.description || '';

  syncAllDOM();
  drawnEdgesTest.clear();
  renderTestGraph();
}
