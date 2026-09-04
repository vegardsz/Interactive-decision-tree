const CAT = {
  user:         { label: 'Bruker',     icon: '👤', badge: 'cat-user',         border: 'border-user',         head: 'head-user',         dot: 'dot-user',         tb: 'task-user',         tc: 'tcat-user'         },
  equipment:    { label: 'Utstyr',     icon: '📱', badge: 'cat-equipment',    border: 'border-equipment',    head: 'head-equipment',    dot: 'dot-equipment',    tb: 'task-equipment',    tc: 'tcat-equipment'    },
  subscription: { label: 'Abonnement', icon: '📋', badge: 'cat-subscription', border: 'border-subscription', head: 'head-subscription', dot: 'dot-subscription', tb: 'task-subscription', tc: 'tcat-subscription' }
};

const PHASE = {
  start:'user','bruker-bedrift':'user','bruker-avdeling':'user','bruker-policy':'user','bruker-policy-sett':'user',
  'utstyr-check':'equipment','enhet-type':'equipment',
  'enhet-produkt':'equipment','enhet-kjop':'equipment','enhet-leasing-varighet':'equipment','enhet-prognose':'equipment',
  'enhet-policy-check':'equipment','mellomlegg-betaling-utstyr':'equipment','mellomlegg-frekvens-utstyr':'equipment',
  'fakturadest-utstyr':'equipment',
  'enhet-imei':'equipment','enhet-serienummer':'equipment',
  'abo-check':'subscription','eksist-abo':'subscription',
  'abo-beholde-nr':'subscription','abo-nummereierskap':'subscription','abo-endre-type':'subscription',
  'abo-plan':'subscription','sim-type':'subscription',
  'abo-policy-check':'subscription','mellomlegg-betaling-abo':'subscription','mellomlegg-frekvens-abo':'subscription','fakturadest-abo':'subscription',
  done:'done'
};

// ── Screens ───────────────────────────────────────────────────────────────
// type: 'task'     → single confirmation button, logs as compact task entry
// type: 'decision' → multiple choice buttons (default)

const screens = {

  // ── Bruker ──
  start: {
    category: 'user', question: 'Finnes bruker fra før?',
    description: 'Sjekk om brukeren allerede er registrert i systemet.',
    choices: [
      { label: 'Ja – bruk eksisterende profil', edge: 'JA',
        logEntry: { category: 'user', title: 'Bruk eksisterende profil', isTask: false, aspects: [] },
        next: 'utstyr-check' },
      { label: 'Nei – opprett ny bruker', edge: 'NEI',
        logEntry: { category: 'user', title: 'Opprett / legg til bruker', isTask: false, aspects: [] },
        next: 'bruker-bedrift' }
    ]
  },

  'bruker-bedrift': {
    type: 'task', category: 'user',
    question: 'Tilknytt riktig bedrift',
    description: 'Knytt brukeren til riktig bedrift og organisasjonsenhet i systemet.',
    taskIcon: '🏢',
    choices: [{ label: 'Fullført – gå videre',
      logEntry: { category: 'user', title: 'Tilknytt riktig bedrift', isTask: true, aspects: [] },
      next: 'bruker-avdeling' }]
  },
  'bruker-avdeling': {
    type: 'task', category: 'user',
    question: 'Sett avdeling og brukergruppe',
    description: 'Velg hvilken avdeling eller brukergruppe brukeren skal tilhøre.',
    taskIcon: '🗂️',
    choices: [{ label: 'Fullført – gå videre',
      logEntry: { category: 'user', title: 'Sett avdeling / brukergruppe', isTask: true, aspects: [] },
      next: 'bruker-policy' }]
  },
  'bruker-policy': {
    category: 'user',
    question: 'Har brukeren allerede en policy via avdeling/brukergruppe?',
    description: 'Policy kan arves automatisk fra avdelingen, eller settes individuelt for denne brukeren.',
    choices: [
      { label: 'Ja – arver policy fra avdeling',
        logEntry: { category: 'user', title: 'Policy', isTask: false,
          aspects: ['Arvet fra avdeling / brukergruppe – ingen videre handling nødvendig'] },
        next: 'utstyr-check' },
      { label: 'Nei – sett individuell policy',
        logEntry: { category: 'user', title: 'Policy', isTask: false,
          aspects: ['Individuell policy – overstyrer avdelingens standardpolicy'] },
        next: 'bruker-policy-sett' }
    ]
  },
  'bruker-policy-sett': {
    type: 'task', category: 'user',
    question: 'Konfigurer individuell policy',
    description: 'Tilordne en spesifikk policy direkte til brukeren, uavhengig av avdelingens standardpolicy.',
    taskIcon: '🔐',
    choices: [{ label: 'Fullført – gå videre',
      logEntry: { category: 'user', title: 'Individuell policy', isTask: true, aspects: [] },
      next: 'utstyr-check' }]
  },

  // ── Utstyr ──
  'utstyr-check': {
    category: 'equipment', question: 'Trenger bruker utstyr?',
    description: 'Skal det tilknyttes en enhet til brukeren?',
    choices: [
      { label: 'Ja – trenger utstyr', edge: 'JA', logEntry: null, next: 'enhet-type' },
      { label: 'Nei – ingen utstyr',  edge: 'NEI', logEntry: null, next: 'abo-check' }
    ]
  },

  'enhet-type': {
    category: 'equipment', question: 'Hvilken enhet-situasjon gjelder?',
    choices: [
      { label: 'Bestille ny enhet',
        logEntry: { category: 'equipment', title: 'Bestille ny enhet', isTask: false, aspects: [] },
        next: 'enhet-produkt' },
      { label: 'Bruke / registrere eksisterende enhet',
        logEntry: { category: 'equipment', title: 'Knytte eksisterende enhet til bruker', isTask: false, aspects: [] },
        next: 'enhet-imei' },
      { label: 'Ingen enhet for nå',
        logEntry: { category: 'equipment', title: 'Ingen enhet tilknyttes', isTask: false, aspects: [] },
        next: 'abo-check' }
    ]
  },

  // Ny enhet – sub-steg
  'enhet-produkt': {
    type: 'task', category: 'equipment',
    question: 'Velge produkt', description: 'Finn og velg riktig enhet fra produktkatalogen.',
    taskIcon: '📦',
    choices: [{ label: 'Fullført – gå videre',
      logEntry: { category: 'equipment', title: 'Velge produkt', isTask: true, aspects: [] },
      next: 'enhet-kjop' }]
  },
  'enhet-kjop': {
    category: 'equipment', question: 'Kjøp eller leasing?',
    choices: [
      { label: 'Kjøp – engangsbetaling',
        logEntry: { category: 'equipment', title: 'Innkjøpsmodell', isTask: false,
          aspects: ['Kjøp – engangsbetaling'] },
        next: 'enhet-prognose' },
      { label: 'Leasing / avdrag',
        logEntry: { category: 'equipment', title: 'Innkjøpsmodell', isTask: false,
          aspects: ['Leasing – månedlige betalinger over avtalt periode'] },
        next: 'enhet-leasing-varighet' }
    ]
  },
  'enhet-leasing-varighet': {
    category: 'equipment',
    question: 'Hva er leasingperiodens varighet?',
    description: 'Varigheten bestemmer månedlig leiekostnad og kostnadsdeling ved eventuelt mellomlegg.',
    choices: [
      { label: '12 måneder',
        logEntry: { category: 'equipment', title: 'Leasingavtale', isTask: false,
          aspects: ['Varighet: 12 måneder', 'Mellomlegg ved overskridelse beregnes per måned'] },
        next: 'enhet-prognose' },
      { label: '24 måneder',
        logEntry: { category: 'equipment', title: 'Leasingavtale', isTask: false,
          aspects: ['Varighet: 24 måneder', 'Mellomlegg ved overskridelse beregnes per måned'] },
        next: 'enhet-prognose' },
      { label: '36 måneder',
        logEntry: { category: 'equipment', title: 'Leasingavtale', isTask: false,
          aspects: ['Varighet: 36 måneder', 'Mellomlegg ved overskridelse beregnes per måned'] },
        next: 'enhet-prognose' }
    ]
  },
  'enhet-prognose': {
    type: 'task', category: 'equipment',
    question: 'Registrer i prognose / utvalg', description: 'Legg enheten inn i prognose eller tilgjengelig produktutvalg.',
    taskIcon: '📊',
    choices: [{ label: 'Fullført – gå videre',
      logEntry: { category: 'equipment', title: 'Prognose / produktutvalg registrert', isTask: true, aspects: [] },
      next: 'enhet-policy-check' }]
  },

  // Policy og mellomlegg – utstyr
  'enhet-policy-check': {
    category: 'equipment',
    question: 'Er valgt enhet innenfor tildelt policy?',
    description: 'Policy bestemmer hva ansatt kan velge og hvem som dekker kostnadene. Velges noe over policy-rammen betaler ansatt mellomlegget.',
    choices: [
      { label: 'Ja – innenfor policy (bedrift dekker)',
        edge: 'JA',
        logEntry: { category: 'equipment', title: 'Kostnad utstyr', isTask: false, aspects: ['Innenfor policy – bedrift dekker alt'] },
        next: 'fakturadest-utstyr' },
      { label: 'Nei – over policy (ansatt betaler mellomlegg)',
        edge: 'NEI',
        logEntry: { category: 'equipment', title: 'Kostnad utstyr', isTask: false, aspects: ['Over policy – ansatt betaler mellomlegg'] },
        next: 'mellomlegg-betaling-utstyr' }
    ]
  },
  'mellomlegg-betaling-utstyr': {
    category: 'equipment', question: 'Hvordan betales mellomlegget for utstyret?',
    choices: [
      { label: 'Lønnstrekk',
        logEntry: { category: 'equipment', title: 'Mellomlegg utstyr', isTask: false, aspects: ['Lønnstrekk'] },
        next: 'mellomlegg-frekvens-utstyr' },
      { label: 'Direkte betaling / upfront',
        logEntry: { category: 'equipment', title: 'Mellomlegg utstyr', isTask: false, aspects: ['Direkte betaling'] },
        next: 'fakturadest-utstyr' }
    ]
  },
  'mellomlegg-frekvens-utstyr': {
    category: 'equipment', question: 'Over hvor mange måneder nedbetales mellomlegget?',
    choices: [
      { label: '1 måneds lønnstrekk', logEntry: { category: 'equipment', title: 'Mellomlegg nedbetaling', isTask: false, aspects: ['Lønnstrekk – 1 måned'] }, next: 'fakturadest-utstyr' },
      { label: '3 månedlige lønnstrekk', logEntry: { category: 'equipment', title: 'Mellomlegg nedbetaling', isTask: false, aspects: ['Lønnstrekk – 3 måneder'] }, next: 'fakturadest-utstyr' },
      { label: '6 månedlige lønnstrekk', logEntry: { category: 'equipment', title: 'Mellomlegg nedbetaling', isTask: false, aspects: ['Lønnstrekk – 6 måneder'] }, next: 'fakturadest-utstyr' },
      { label: 'Engangsbeløp', logEntry: { category: 'equipment', title: 'Mellomlegg nedbetaling', isTask: false, aspects: ['Engangsbeløp'] }, next: 'fakturadest-utstyr' }
    ]
  },
  'fakturadest-utstyr': {
    category: 'equipment', question: 'Hvem er fakturamottaker for bedriftens andel?',
    choices: [
      { label: 'Kostnadssenter / avdeling',
        logEntry: { category: 'equipment', title: 'Fakturering utstyr', isTask: false, aspects: ['Kostnadssenter / avdeling'] },
        next: 'abo-check' },
      { label: 'Sentralfakturering (bedriftskonto)',
        logEntry: { category: 'equipment', title: 'Fakturering utstyr', isTask: false, aspects: ['Sentralfakturering'] },
        next: 'abo-check' }
    ]
  },

  // Eksisterende enhet – sub-steg
  'enhet-imei': {
    type: 'task', category: 'equipment',
    question: 'Registrer IMEI-nummer', description: 'Finn og registrer IMEI-nummeret på enheten.',
    taskIcon: '🔢',
    choices: [{ label: 'Fullført – gå videre',
      logEntry: { category: 'equipment', title: 'IMEI registrert', isTask: true, aspects: [] },
      next: 'enhet-serienummer' }]
  },
  'enhet-serienummer': {
    type: 'task', category: 'equipment',
    question: 'Registrer serienummer', description: 'Finn og registrer enhetens serienummer.',
    taskIcon: '🔢',
    choices: [{ label: 'Fullført – gå videre',
      logEntry: { category: 'equipment', title: 'Serienummer registrert', isTask: true, aspects: [] },
      next: 'abo-check' }]
  },

  // ── Abonnement ──
  'abo-check': {
    category: 'subscription', question: 'Skal bruker ha abonnement?',
    choices: [
      { label: 'Ja', edge: 'JA', logEntry: null, next: 'eksist-abo' },
      { label: 'Nei – ingen abonnement', edge: 'NEI', logEntry: null, next: 'done' }
    ]
  },

  'eksist-abo': {
    category: 'subscription', question: 'Har bruker abonnement fra før?',
    choices: [
      { label: 'Ja – eksisterende abonnement', edge: 'JA',
        logEntry: { category: 'subscription', title: 'Eksisterende abonnement', isTask: false, aspects: [] },
        next: 'abo-beholde-nr' },
      { label: 'Nei – opprett nytt abonnement', edge: 'NEI',
        logEntry: { category: 'subscription', title: 'Opprette nytt abonnement', isTask: false, aspects: [] },
        next: 'abo-plan' }
    ]
  },

  // Eksisterende abo – sub-beslutninger
  'abo-beholde-nr': {
    category: 'subscription', question: 'Skal eksisterende nummer beholdes?',
    choices: [
      { label: 'Ja – behold nummeret',
        logEntry: { category: 'subscription', title: 'Nummer', isTask: false, aspects: ['Eksisterende nummer beholdes'] },
        next: 'abo-nummereierskap' },
      { label: 'Nei – hent nytt nummer',
        logEntry: { category: 'subscription', title: 'Nummer', isTask: false, aspects: ['Nytt nummer tildeles'] },
        next: 'abo-nummereierskap' }
    ]
  },
  'abo-nummereierskap': {
    category: 'subscription', question: 'Overføres nummereierskap?',
    choices: [
      { label: 'Ja – overfør til bedrift',
        logEntry: { category: 'subscription', title: 'Nummereierskap', isTask: false, aspects: ['Overført til bedrift'] },
        next: 'abo-endre-type' },
      { label: 'Nei – beholdes som det er',
        logEntry: { category: 'subscription', title: 'Nummereierskap', isTask: false, aspects: ['Ingen overføring'] },
        next: 'abo-endre-type' }
    ]
  },
  'abo-endre-type': {
    category: 'subscription', question: 'Skal abonnementstype endres?',
    choices: [
      { label: 'Ja – endre abonnementstype',
        logEntry: { category: 'subscription', title: 'Abonnementstype', isTask: false, aspects: ['Endres til ny type'] },
        next: 'done' },
      { label: 'Nei – behold eksisterende type',
        logEntry: { category: 'subscription', title: 'Abonnementstype', isTask: false, aspects: ['Beholder eksisterende type'] },
        next: 'done' }
    ]
  },

  'abo-plan': {
    type: 'task', category: 'subscription',
    question: 'Velg abonnementsplan', description: 'Policy bestemmer hvilke planer som er tilgjengelig for brukeren. Velg plan fra godkjent utvalg.',
    taskIcon: '📋',
    choices: [{ label: 'Plan valgt – gå videre',
      logEntry: { category: 'subscription', title: 'Abonnementsplan valgt', isTask: true, aspects: [] },
      next: 'sim-type' }]
  },

  'sim-type': {
    category: 'subscription', question: 'Hvilken SIM-type skal brukes?',
    choices: [
      { label: 'Fysisk SIM-kort',
        logEntry: { category: 'subscription', title: 'SIM', isTask: false, aspects: ['Fysisk SIM-kort'] },
        next: 'abo-policy-check' },
      { label: 'eSIM',
        logEntry: { category: 'subscription', title: 'SIM', isTask: false, aspects: ['eSIM', 'eSIM-provisjonering'] },
        next: 'abo-policy-check' }
    ]
  },

  // Policy og mellomlegg – abonnement
  'abo-policy-check': {
    category: 'subscription',
    question: 'Er valgt abonnement innenfor tildelt policy?',
    description: 'Policy bestemmer hva ansatt kan velge og hvem som dekker kostnadene. Velges noe over policy-rammen betaler ansatt mellomlegget.',
    choices: [
      { label: 'Ja – innenfor policy (bedrift dekker)',
        edge: 'JA',
        logEntry: { category: 'subscription', title: 'Kostnad abonnement', isTask: false, aspects: ['Innenfor policy – bedrift dekker alt'] },
        next: 'fakturadest-abo' },
      { label: 'Nei – over policy (ansatt betaler mellomlegg)',
        edge: 'NEI',
        logEntry: { category: 'subscription', title: 'Kostnad abonnement', isTask: false, aspects: ['Over policy – ansatt betaler mellomlegg'] },
        next: 'mellomlegg-betaling-abo' }
    ]
  },
  'mellomlegg-betaling-abo': {
    category: 'subscription', question: 'Hvordan betales mellomlegget for abonnementet?',
    choices: [
      { label: 'Lønnstrekk',
        logEntry: { category: 'subscription', title: 'Mellomlegg abonnement', isTask: false, aspects: ['Lønnstrekk'] },
        next: 'mellomlegg-frekvens-abo' },
      { label: 'Direkte betaling / upfront',
        logEntry: { category: 'subscription', title: 'Mellomlegg abonnement', isTask: false, aspects: ['Direkte betaling'] },
        next: 'fakturadest-abo' }
    ]
  },
  'mellomlegg-frekvens-abo': {
    category: 'subscription', question: 'Frekvens på lønnstrekk for mellomlegg?',
    choices: [
      { label: 'Månedlig', logEntry: { category: 'subscription', title: 'Mellomlegg frekvens', isTask: false, aspects: ['Månedlig lønnstrekk'] }, next: 'fakturadest-abo' },
      { label: 'Engangsbeløp', logEntry: { category: 'subscription', title: 'Mellomlegg frekvens', isTask: false, aspects: ['Engangsbeløp'] }, next: 'fakturadest-abo' }
    ]
  },

  'fakturadest-abo': {
    category: 'subscription',
    question: 'Hvem er fakturamottaker for abonnementet?',
    description: 'Kan settes separat fra fakturasted for utstyr.',
    choices: [
      { label: 'Kostnadssenter / avdeling',
        logEntry: { category: 'subscription', title: 'Fakturering abonnement', isTask: false,
          aspects: ['Kostnadssenter / avdeling'] },
        next: 'done' },
      { label: 'Sentralfakturering (bedriftskonto)',
        logEntry: { category: 'subscription', title: 'Fakturering abonnement', isTask: false,
          aspects: ['Sentralfakturering'] },
        next: 'done' }
    ]
  }
};

// ── Use cases ─────────────────────────────────────────────────────────────
function computeLog(steps) {
  return steps
    .map(([sid, idx]) => screens[sid]?.choices[idx]?.logEntry)
    .filter(Boolean)
    .map(e => ({ ...e, aspects: [...e.aspects] }));
}

const useCases = [
  { id:'uc-1', title:'Ny bruker, ny enhet, nytt abonnement (innenfor policy)', description:'Typisk onboarding av ny ansatt – alt innenfor policy, bedrift dekker',
    tags:[['Ny bruker','user'],['Ny enhet','equipment'],['Nytt abonnement','subscription']],
    steps:[['start',1],['utstyr-check',0],['enhet-type',0],['enhet-kjop',0],['enhet-policy-check',0],['fakturadest-utstyr',0],['abo-check',0],['eksist-abo',1],['sim-type',0],['abo-policy-check',0]] },
  { id:'uc-2', title:'Ny bruker, ny enhet – ingen abonnement', description:'Ny ansatt trenger kun enhet, innenfor policy, ikke abonnement',
    tags:[['Ny bruker','user'],['Ny enhet','equipment']],
    steps:[['start',1],['utstyr-check',0],['enhet-type',0],['enhet-kjop',0],['enhet-policy-check',0],['fakturadest-utstyr',0],['abo-check',1]] },
  { id:'uc-3', title:'Ny bruker, nytt abonnement – ingen enhet', description:'Ny ansatt bruker egen enhet, trenger kun abonnement innenfor policy',
    tags:[['Ny bruker','user'],['Nytt abonnement','subscription']],
    steps:[['start',1],['utstyr-check',1],['abo-check',0],['eksist-abo',1],['sim-type',0],['abo-policy-check',0]] },
  { id:'uc-4', title:'Ny bruker, eksisterende enhet, nytt abonnement', description:'Ny bruker tar over enhet fra tidligere ansatt + nytt abonnement',
    tags:[['Ny bruker','user'],['Eksist. enhet','equipment'],['Nytt abonnement','subscription']],
    steps:[['start',1],['utstyr-check',0],['enhet-type',1],['abo-check',0],['eksist-abo',1],['sim-type',0],['abo-policy-check',0]] },
  { id:'uc-5', title:'Enhet over policy – ansatt betaler mellomlegg (lønnstrekk)', description:'Ansatt velger enhet over policy-grensen og betaler mellomlegg via lønnstrekk',
    tags:[['Ny bruker','user'],['Ny enhet','equipment'],['Mellomlegg','equipment']],
    steps:[['start',1],['utstyr-check',0],['enhet-type',0],['enhet-kjop',0],['enhet-policy-check',1],['mellomlegg-betaling-utstyr',0],['mellomlegg-frekvens-utstyr',0],['fakturadest-utstyr',0],['abo-check',0],['eksist-abo',1],['sim-type',0],['abo-policy-check',0]] },
  { id:'uc-6', title:'Eksisterende bruker, ny enhet – beholder abonnement', description:'Ansatt bytter enhet (innenfor policy), beholder eksisterende abonnement',
    tags:[['Eksist. bruker','user'],['Ny enhet','equipment'],['Eksist. abonnement','subscription']],
    steps:[['start',0],['utstyr-check',0],['enhet-type',0],['enhet-kjop',0],['enhet-policy-check',0],['fakturadest-utstyr',0],['abo-check',0],['eksist-abo',0],['abo-beholde-nr',0],['abo-nummereierskap',1],['abo-endre-type',1]] },
  { id:'uc-7', title:'Eksisterende bruker, nytt abonnement – beholder enhet', description:'Ansatt bytter abonnement (innenfor policy), beholder eksisterende enhet',
    tags:[['Eksist. bruker','user'],['Nytt abonnement','subscription']],
    steps:[['start',0],['utstyr-check',1],['abo-check',0],['eksist-abo',1],['sim-type',0],['abo-policy-check',0]] },
  { id:'uc-8', title:'Eksisterende bruker, eksisterende abonnement – endringer', description:'Justeringer på eksisterende abonnement (nummer, eierskap, type)',
    tags:[['Eksist. bruker','user'],['Eksist. abonnement','subscription']],
    steps:[['start',0],['utstyr-check',1],['abo-check',0],['eksist-abo',0],['abo-beholde-nr',0],['abo-nummereierskap',1],['abo-endre-type',1]] },
  { id:'uc-9', title:'Eksisterende bruker, ny enhet – ingen abonnement', description:'Ansatt bytter kun enhet (innenfor policy), ingen abonnementsendring',
    tags:[['Eksist. bruker','user'],['Ny enhet','equipment']],
    steps:[['start',0],['utstyr-check',0],['enhet-type',0],['enhet-kjop',0],['enhet-policy-check',0],['fakturadest-utstyr',0],['abo-check',1]] },
  { id:'uc-10', title:'Eksisterende bruker, registrere eksisterende enhet', description:'Knytte en enhet brukeren allerede har til systemet',
    tags:[['Eksist. bruker','user'],['Eksist. enhet','equipment']],
    steps:[['start',0],['utstyr-check',0],['enhet-type',1],['abo-check',1]] }
];

// ── Avdeling presets ─────────────────────────────────────────────────────
const AVDELING_PRESETS = {
  it:      { navn: 'IT-avdelingen', kostnadssenter: 'KS-1234',
             policy: { policyAktiv: true,  enhetAktiv: true,  enhetMaxPris: 12000, aboAktiv: false, aboMaxPris: 400, enhetUtvalg: true,  enhetUtvalgListe: 'iPhone 16, Samsung S25, Pixel 9' } },
  salg:    { navn: 'Salg',          kostnadssenter: 'KS-5678',
             policy: { policyAktiv: true,  enhetAktiv: true,  enhetMaxPris:  8000, aboAktiv: true,  aboMaxPris: 399, enhetUtvalg: false, enhetUtvalgListe: '' } },
  hr:      { navn: 'HR',            kostnadssenter: 'KS-9012',
             policy: { policyAktiv: true,  enhetAktiv: true,  enhetMaxPris:  6000, aboAktiv: true,  aboMaxPris: 299, enhetUtvalg: false, enhetUtvalgListe: '' } },
  ledelse: { navn: 'Ledelse',       kostnadssenter: 'KS-0001',
             policy: { policyAktiv: false, enhetAktiv: false, enhetMaxPris: 12000, aboAktiv: false, aboMaxPris: 400, enhetUtvalg: false, enhetUtvalgListe: '' } },
};

const DEFAULT_ENHET      = { aktiv: false, pris: 14990, 'kjøpsmodell': 'kjøp', leasingMåneder: 24 };
const DEFAULT_ABONNEMENT = { aktiv: false, plan: 'Business L', pris: 449, simType: 'eSIM' };

const NODE_POS_TEST = {
  user:              { x: 280, y: 285 },
  avdeling:          { x: 120, y:  80 },
  fakturasted:       { x: 400, y:  35 },
  'fakturasted-abo': { x: 520, y: 105 },
  policy:            { x: 280, y: 158 },
  katalog:           { x: 520, y: 210 },
  enhet:             { x: 465, y: 355 },
  abo:               { x:  88, y: 262 },
  sim:               { x:  48, y: 418 },
  mellomlegg:        { x: 280, y: 418 },
  betalingsmetode:   { x: 280, y: 568 }
};

// ── Node view constants ───────────────────────────────────────────────────
const NODE_POS = {
  user:            { x: 220, y: 232 },
  avdeling:        { x: 135, y:  65 },
  fakturasted:     { x: 335, y:  65 },
  policy:          { x: 220, y: 132 },
  enhet:           { x: 372, y: 212 },
  abo:             { x:  68, y: 212 },
  sim:             { x:  24, y: 318 },
  mellomlegg:      { x: 220, y: 362 },
  betalingsmetode: { x: 220, y: 448 }
};
const NODE_META = {
  user:            { label: 'Bruker',        icon: '👤', fill: '#111',    stroke: '#374151', r: 36 },
  avdeling:        { label: 'Avdeling',      icon: '🏢', fill: '#374151', stroke: '#111',    r: 26 },
  fakturasted:     { label: 'Fakturasted',   icon: '🧾', fill: '#059669', stroke: '#047857', r: 26 },
  'fakturasted-abo':{ label: 'Fakturasted',  icon: '🧾', fill: '#0d9488', stroke: '#0f766e', r: 22 },
  policy:          { label: 'Policy',        icon: '🔐', fill: '#6366f1', stroke: '#4f46e5', r: 28 },
  katalog:         { label: 'Katalog',       icon: '📋', fill: '#7c3aed', stroke: '#6d28d9', r: 24 },
  enhet:           { label: 'Enhet',         icon: '📱', fill: '#ea580c', stroke: '#c2410c', r: 28 },
  abo:             { label: 'Abonnement',    icon: '📡', fill: '#2563eb', stroke: '#1d4ed8', r: 28 },
  sim:             { label: 'SIM',           icon: '💳', fill: '#0891b2', stroke: '#0e7490', r: 22 },
  mellomlegg:      { label: 'Mellomlegg',    icon: '💸', fill: '#dc2626', stroke: '#b91c1c', r: 26 },
  betalingsmetode: { label: 'Betaling',      icon: '💰', fill: '#d97706', stroke: '#b45309', r: 22 }
};
const EDGE_META = {
  'user-avdeling':             { color: '#9ca3af', w: 2,   dash: null,  label: 'tilhører'   },
  'avdeling-policy':           { color: '#a78bfa', w: 2.5, dash: null,  label: 'definerer'  },
  'avdeling-fakturasted':      { color: '#6ee7b7', w: 2,   dash: null,  label: 'faktureres' },
  'avdeling-fakturasted-abo':  { color: '#5eead4', w: 2,   dash: null,  label: 'faktureres' },
  'user-enhet':                { color: '#fb923c', w: 2.5, dash: null,  label: 'tildelt'    },
  'user-abo':                  { color: '#60a5fa', w: 2.5, dash: null,  label: 'aktivert'   },
  'policy-enhet':              { color: '#818cf8', w: 2,   dash: '6,4', label: 'styrer'       },
  'policy-abo':                { color: '#818cf8', w: 2,   dash: '6,4', label: 'styrer'       },
  'policy-katalog':            { color: '#a78bfa', w: 2,   dash: '6,4', label: 'begrenser til' },
  'katalog-enhet':             { color: '#c4b5fd', w: 2,   dash: null,  label: 'fra utvalg'   },
  'abo-sim':                   { color: '#67e8f9', w: 2,   dash: null,  label: 'bruker'     },
  'enhet-mellomlegg':          { color: '#f87171', w: 2,   dash: null,  label: 'utløser'    },
  'abo-mellomlegg':            { color: '#f87171', w: 2,   dash: null,  label: 'utløser'    },
  'mellomlegg-betalingsmetode':{ color: '#fbbf24', w: 2,   dash: null,  label: 'betales via'}
};
