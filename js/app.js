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

  const ucPresetEl = document.getElementById('tc-uc-preset');
  if (ucPresetEl) ucPresetEl.value = '';
  const ucDescEl = document.getElementById('tc-uc-desc');
  if (ucDescEl) ucDescEl.textContent = '';

  syncAllDOM();
  drawnEdgesTest = new Set();
  renderTestGraph();
}

function setView(v) {
  currentView = v;
  document.getElementById('tab-wizard').classList.toggle('active', v === 'wizard');
  document.getElementById('tab-testbruker').classList.toggle('active', v === 'testbruker');
  document.getElementById('decision-panel').style.display = v === 'wizard' ? '' : 'none';
  document.getElementById('log-panel').style.display = v === 'testbruker' ? 'none' : '';
  const tbPanel = document.getElementById('testbruker-panel');
  tbPanel.style.display = v === 'testbruker' ? 'flex' : 'none';
  document.getElementById('log-sub-text').textContent = 'Aspekter som gjelder for denne brukeren';
  if (v === 'testbruker') { drawnEdgesTest.clear(); renderTestGraph(); }
  else renderAll();
}


setView('testbruker');
