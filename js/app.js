function choose(idx) {
  const choice = screens[currentId].choices[idx];
  history.push({ id: currentId, logLen: log.length });
  if (choice.logEntry) log.push({ ...choice.logEntry, aspects: [...choice.logEntry.aspects] });
  currentId = choice.next;
  renderAll();
}

function goBack() {
  if (!history.length) return;
  const prev = history.pop();
  currentId = prev.id; log.splice(prev.logLen); renderAll();
}

function reset() {
  currentId = 'start'; log = []; history = []; selectedUcId = null; drawnEdges.clear(); renderAll();
  resetTestState();
}

function resetTestState() {
  Object.assign(testState.tilordning, { type: 'personlig', kontekstNavn: 'Møterom A' });
  Object.assign(testState.bruker,     { navn: 'Ola Nordmann' });
  avdelingStates = makeAvdelingStates();
  currentAvdeling = 'it';
  const avdPresetEl = document.getElementById('tc-avdeling-preset');
  if (avdPresetEl) avdPresetEl.value = 'it';
  Object.assign(testState.avdeling, AVDELING_PRESETS.it);
  Object.assign(testState.policy,   AVDELING_PRESETS.it.policy);
  Object.assign(testState.enhet,      { ...DEFAULT_ENHET });
  Object.assign(testState.abonnement, { ...DEFAULT_ABONNEMENT });
  Object.assign(testState.fakturasted,{ enhet: 'kostnadssenter', abo: 'kostnadssenter', splitAbo: false });
  Object.assign(testState.betaling,   { frekvens: 'månedlig', kjøpMåneder: 1 });

  document.querySelector('input[name="tilordning"][value="personlig"]').checked = true;
  document.querySelector('#tc-bruker-fields .tc-input').value = 'Ola Nordmann';
  document.querySelector('#tc-kontekst-fields .tc-input').value = 'Møterom A';

  syncAvdelingDOM();

  document.querySelector('input[name="betfrekvens"][value="månedlig"]').checked = true;
  document.querySelector('input[name="kjopmaaneder"][value="1"]').checked = true;

  document.querySelector('input[name="fakturasted-enhet"][value="kostnadssenter"]').checked = true;
  document.getElementById('tc-split-faktura').checked = false;
  document.querySelector('input[name="fakturasted-abo"][value="kostnadssenter"]').checked = true;

  drawnEdgesTest = new Set();
  renderTestGraph();
}

function setView(v) {
  currentView = v;
  document.getElementById('tab-wizard').classList.toggle('active', v === 'wizard');
  document.getElementById('tab-usecases').classList.toggle('active', v === 'usecases');
  document.getElementById('tab-testbruker').classList.toggle('active', v === 'testbruker');
  document.getElementById('decision-panel').style.display = v === 'wizard' ? '' : 'none';
  document.getElementById('uc-panel').classList.toggle('active', v === 'usecases');
  document.getElementById('log-panel').style.display = v === 'testbruker' ? 'none' : '';
  const tbPanel = document.getElementById('testbruker-panel');
  tbPanel.style.display = v === 'testbruker' ? 'flex' : 'none';
  document.getElementById('log-sub-text').textContent = v === 'wizard'
    ? 'Aspekter som gjelder for denne brukeren'
    : 'Aspekter for valgt konfigurasjon';
  if (v === 'testbruker') { drawnEdgesTest.clear(); renderTestGraph(); }
  else renderAll();
}

function selectUseCase(id) {
  selectedUcId = id;
  log = computeLog(useCases.find(u => u.id === id).steps);
  renderUseCases(); renderLog();
}

setView('testbruker');
