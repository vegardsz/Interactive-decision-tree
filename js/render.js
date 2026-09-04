function renderTestGraph() {
  const container = document.getElementById('test-graph-area');
  if (!container) return;
  const { active, edges, enhetMellomlegg, aboMellomlegg, isKontekstuell } = computeTestNodeState();

  for (const k of [...drawnEdgesTest]) {
    if (!edges.has(k)) drawnEdgesTest.delete(k);
  }

  const isLeasing = testState.enhet['kjøpsmodell'] === 'leasing';
  const måneder   = testState.enhet.leasingMåneder || 24;
  const mndSum    = Math.round(testState.enhet.pris / måneder);
  const fmtFaktura = v => v === 'kostnadssenter' ? 'KS' : 'Sentral';

  const enhetBedrift = testState.enhet.aktiv
    ? (isLeasing ? mndSum - enhetMellomlegg : testState.enhet.pris - enhetMellomlegg)
    : 0;
  const aboBedrift = testState.abonnement.aktiv
    ? testState.abonnement.pris - aboMellomlegg
    : 0;
  const enhetSuffix = isLeasing ? '/mnd' : '';

  const split = testState.fakturasted.splitAbo;
  const nodeDetail2 = {
    fakturasted: testState.enhet.aktiv && testState.abonnement.aktiv && !split
      ? formatKr(enhetBedrift) + enhetSuffix + ' + ' + formatKr(aboBedrift) + '/mnd'
      : testState.enhet.aktiv && !split
        ? formatKr(enhetBedrift) + enhetSuffix
        : testState.abonnement.aktiv && !split
          ? formatKr(aboBedrift) + '/mnd'
          : testState.enhet.aktiv
            ? formatKr(enhetBedrift) + enhetSuffix
            : '',
    'fakturasted-abo': testState.abonnement.aktiv ? formatKr(aboBedrift) + '/mnd' : ''
  };

  const mlParts = [];
  if (enhetMellomlegg > 0) mlParts.push('Enhet: +' + formatKr(enhetMellomlegg) + (isLeasing ? '/mnd' : ''));
  if (aboMellomlegg   > 0) mlParts.push('Abo: +' + formatKr(aboMellomlegg) + '/mnd');

  const nodeDetail = {
    user:            isKontekstuell ? testState.tilordning.kontekstNavn : testState.bruker.navn,
    avdeling:        testState.avdeling.navn,
    fakturasted:     testState.fakturasted.splitAbo
                       ? 'Utstyr · ' + fmtFaktura(testState.fakturasted.enhet)
                       : fmtFaktura(testState.fakturasted.enhet),
    'fakturasted-abo': 'Abo · ' + fmtFaktura(testState.fakturasted.abo),
    katalog:         testState.policy.enhetUtvalgListe || '',
    policy: (function() {
      const parts = [];
      if (testState.policy.enhetAktiv) parts.push('Enhet: ' + formatKr(testState.policy.enhetMaxPris));
      if (testState.policy.aboAktiv)   parts.push('Abo: ' + formatKr(testState.policy.aboMaxPris) + '/mnd');
      return parts.join(' · ');
    })(),
    enhet:           isLeasing
                       ? formatKr(mndSum) + '/mnd · ' + måneder + ' mnd'
                       : formatKr(testState.enhet.pris) + ' · kjøp',
    abo:             testState.abonnement.plan + ' · ' + formatKr(testState.abonnement.pris) + '/mnd',
    sim:             testState.abonnement.simType,
    mellomlegg:      mlParts.join(' · ') || '',
    betalingsmetode: (function() {
      const isLønnstrekk = testState.betaling.frekvens === 'månedlig';
      const kjøpOver = !isLeasing && enhetMellomlegg > 0;
      if (isLønnstrekk && kjøpOver) {
        const mnd = testState.betaling.kjøpMåneder || 1;
        return 'Lønnstrekk · ' + mnd + ' mnd · ' + formatKr(Math.ceil(enhetMellomlegg / mnd)) + '/mnd';
      }
      return isLønnstrekk ? 'Lønnstrekk' : 'Engangs';
    })()
  };

  function edgePts(fromKey, toKey) {
    const p1 = NODE_POS_TEST[fromKey], p2 = NODE_POS_TEST[toKey];
    const r1 = NODE_META[fromKey].r,   r2 = NODE_META[toKey].r;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const d  = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx/d, uy = dy/d;
    return { x1: p1.x + ux*r1, y1: p1.y + uy*r1,
             x2: p2.x - ux*r2, y2: p2.y - uy*r2 };
  }

  let edgesSvg = '';
  for (const key of edges) {
    const parts = key.split('-');
    const fromKey = parts[0], toKey = parts.slice(1).join('-');
    const meta = EDGE_META[key];
    if (!meta) continue;
    if (!NODE_POS_TEST[fromKey] || !NODE_POS_TEST[toKey]) continue;
    const { x1, y1, x2, y2 } = edgePts(fromKey, toKey);
    const len = Math.ceil(Math.sqrt((x2-x1)**2 + (y2-y1)**2));
    const isNew = !drawnEdgesTest.has(key);
    if (isNew) drawnEdgesTest.add(key);

    let animSvg = '';
    if (isNew) {
      animSvg = meta.dash
        ? `<animate attributeName="opacity" from="0" to="1" dur="0.3s" fill="freeze"/>`
        : `<animate attributeName="stroke-dashoffset" from="${len}" to="0" dur="0.5s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>`;
    }
    const dashAttr = meta.dash
      ? `stroke-dasharray="${meta.dash}"`
      : `stroke-dasharray="${len}" stroke-dashoffset="0"`;

    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const chipW = meta.label.length * 5.6 + 14;
    edgesSvg += `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
        stroke="${meta.color}" stroke-width="${meta.w}" stroke-linecap="round"
        ${dashAttr}>${animSvg}</line>
      <rect x="${mx - chipW/2}" y="${my - 14}" width="${chipW}" height="14" rx="7"
        fill="white" stroke="${meta.color}" stroke-width="1" style="pointer-events:none"/>
      <text x="${mx}" y="${my - 3.5}" text-anchor="middle"
        font-size="8.5" font-weight="700" font-family="system-ui" fill="${meta.color}"
        style="pointer-events:none">${meta.label}</text>`;
  }

  let nodesSvg = '';
  for (const [key, pos] of Object.entries(NODE_POS_TEST)) {
    let meta = NODE_META[key];
    if (!meta) continue;
    if (key === 'user' && isKontekstuell) {
      meta = { ...meta, label: 'Kontekst', icon: '📍', fill: '#1e3a5f', stroke: '#1d4ed8' };
    }
    const isActive = active[key];
    if (!isActive && key === 'fakturasted-abo') continue;
    const r = meta.r;
    const labelY  = pos.y + r + 15;
    const detailY = pos.y + r + 27;

    if (isActive) {
      const detail  = (nodeDetail[key]  || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
      const detail2 = (nodeDetail2[key] || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
      nodesSvg += `
        <circle cx="${pos.x}" cy="${pos.y}" r="${r}" fill="${meta.fill}" stroke="${meta.stroke}" stroke-width="2.5"/>
        <text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle"
          font-size="${r > 35 ? 20 : 15}" style="pointer-events:none">${meta.icon}</text>
        <text x="${pos.x}" y="${labelY}" text-anchor="middle"
          font-size="10" font-weight="700" font-family="system-ui" fill="${meta.fill}">${meta.label}</text>
        ${detail ? `<text x="${pos.x}" y="${detailY}" text-anchor="middle"
          font-size="8" font-family="system-ui" fill="#555" style="pointer-events:none">${detail}</text>` : ''}
        ${detail2 ? `<text x="${pos.x}" y="${detailY + 12}" text-anchor="middle"
          font-size="8.5" font-weight="600" font-family="system-ui" fill="#047857" style="pointer-events:none">${detail2}</text>` : ''}`;
    } else {
      nodesSvg += `
        <circle cx="${pos.x}" cy="${pos.y}" r="${r}" fill="#f9fafb" stroke="#e5e7eb"
          stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle"
          font-size="${r > 35 ? 20 : 15}" opacity="0.25" style="pointer-events:none">${meta.icon}</text>
        <text x="${pos.x}" y="${labelY}" text-anchor="middle"
          font-size="10" font-weight="600" font-family="system-ui" fill="#d1d5db">${meta.label}</text>`;
    }
  }

  const enhetTypeLabel = isLeasing ? '' : '<span class="tc-cc-unit"> engangs</span>';
  const kjøpLønnstrekk = !isLeasing && enhetMellomlegg > 0 && testState.betaling.frekvens === 'månedlig';
  const kjøpMndAntall  = testState.betaling.kjøpMåneder || 1;
  const kjøpMndBelop   = kjøpLønnstrekk ? Math.ceil(enhetMellomlegg / kjøpMndAntall) : 0;
  const kjøpMndLabel   = kjøpMndBelop > 0
    ? `<br><span class="tc-cc-unit">(${formatKr(kjøpMndBelop)} / ${kjøpMndAntall} mnd)</span>`
    : '';

  let costRows = '';
  if (testState.enhet.aktiv) {
    costRows += `
      <tr>
        <td class="tc-cc-cat">📱 Utstyr</td>
        <td class="tc-cc-val">${formatKr(enhetBedrift)}${enhetSuffix}${enhetTypeLabel}</td>
        <td class="tc-cc-val ${enhetMellomlegg > 0 ? 'tc-cc-bruker' : 'tc-cc-zero'}">
          ${enhetMellomlegg > 0 ? formatKr(enhetMellomlegg) + enhetSuffix + kjøpMndLabel : '–'}
        </td>
      </tr>`;
  }
  if (testState.abonnement.aktiv) {
    costRows += `
      <tr>
        <td class="tc-cc-cat">📡 Abonnement</td>
        <td class="tc-cc-val">${formatKr(aboBedrift)}/mnd</td>
        <td class="tc-cc-val ${aboMellomlegg > 0 ? 'tc-cc-bruker' : 'tc-cc-zero'}">
          ${aboMellomlegg > 0 ? formatKr(aboMellomlegg) + '/mnd' : '–'}
        </td>
      </tr>`;
  }

  const costCard = costRows ? `
    <div class="tc-cost-card">
      <div class="tc-cc-title">Kostnadsoversikt</div>
      <table class="tc-cost-table">
        <thead><tr>
          <th class="tc-cc-head">–</th>
          <th class="tc-cc-head">Bedrift</th>
          <th class="tc-cc-head">Ansatt</th>
        </tr></thead>
        <tbody>${costRows}</tbody>
      </table>
    </div>` : '';

  container.innerHTML = `
    <svg viewBox="0 0 600 630" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      ${edgesSvg}
      ${nodesSvg}
    </svg>
    ${costCard}`;

  const betalingSection = document.getElementById('tc-betaling-section');
  if (betalingSection) {
    const hasMl = enhetMellomlegg > 0 || aboMellomlegg > 0;
    betalingSection.style.opacity = hasMl ? '1' : '0.3';
    betalingSection.style.pointerEvents = hasMl ? '' : 'none';
  }

  const leasingFields = document.getElementById('tc-leasing-fields');
  if (leasingFields) leasingFields.style.display = isLeasing ? '' : 'none';

  const splitAboFields = document.getElementById('tc-faktura-abo-fields');
  if (splitAboFields) splitAboFields.style.display = testState.fakturasted.splitAbo ? '' : 'none';

  const pef = document.getElementById('tc-policy-enhet-fields');
  const pen = document.getElementById('tc-policy-enhet-note');
  if (pef) pef.style.display = testState.policy.enhetAktiv ? '' : 'none';
  if (pen) pen.style.display = testState.policy.enhetAktiv ? 'none' : '';
  const paf = document.getElementById('tc-policy-abo-fields');
  const pan = document.getElementById('tc-policy-abo-note');
  if (paf) paf.style.display = testState.policy.aboAktiv ? '' : 'none';
  if (pan) pan.style.display = testState.policy.aboAktiv ? 'none' : '';
  const utf = document.getElementById('tc-utvalg-fields');
  if (utf) utf.style.display = testState.policy.enhetUtvalg ? '' : 'none';

  const isK = testState.tilordning.type === 'kontekstuell';
  const brukerF   = document.getElementById('tc-bruker-fields');
  const kontekstF = document.getElementById('tc-kontekst-fields');
  if (brukerF)   brukerF.style.display   = isK ? 'none' : '';
  if (kontekstF) kontekstF.style.display = isK ? '' : 'none';

  const mndEl = document.getElementById('tc-mnd-sum');
  if (mndEl && isLeasing) {
    mndEl.innerHTML = `<span style="font-size:11px;color:#555">≈ ${formatKr(mndSum)}/mnd over ${måneder} mnd</span>`;
  }

  const kjøpOver = !isLeasing && enhetMellomlegg > 0;
  const isLønnstrekk = testState.betaling.frekvens === 'månedlig';
  const kjøpMndFields = document.getElementById('tc-kjop-maaneder-fields');
  if (kjøpMndFields) kjøpMndFields.style.display = (kjøpOver && isLønnstrekk) ? '' : 'none';
  const kjøpMndSum = document.getElementById('tc-kjop-mnd-sum');
  if (kjøpMndSum && kjøpOver && isLønnstrekk) {
    const mnd = testState.betaling.kjøpMåneder || 1;
    kjøpMndSum.innerHTML = `<span style="font-size:11px;color:#555">≈ ${formatKr(Math.ceil(enhetMellomlegg / mnd))}/mnd over ${mnd} mnd</span>`;
  }

  const ml = document.getElementById('tc-mellomlegg-info');
  if (ml) {
    if (enhetMellomlegg > 0) {
      const suffix = isLeasing ? '/mnd' : '';
      ml.innerHTML = `<span class="tc-chip-over">Over policy: +${formatKr(enhetMellomlegg)}${suffix}</span>`;
    } else {
      ml.innerHTML = `<span class="tc-chip-ok">✓ Innenfor policy</span>`;
    }
  }

  const mlAbo = document.getElementById('tc-mellomlegg-abo-info');
  if (mlAbo) {
    if (aboMellomlegg > 0) {
      mlAbo.innerHTML = `<span class="tc-chip-over">Over policy: +${formatKr(aboMellomlegg)}/mnd</span>`;
    } else {
      mlAbo.innerHTML = `<span class="tc-chip-ok">✓ Innenfor policy</span>`;
    }
  }
}

// ── Phase track / wizard render ───────────────────────────────────────────
function phaseTrackHTML() {
  const phases = [{key:'user',label:'1. Bruker'},{key:'equipment',label:'2. Utstyr'},{key:'subscription',label:'3. Abonnement'}];
  const current = PHASE[currentId];
  const seen = new Set(history.map(h => PHASE[h.id]));
  const items = phases.map((p,i) => {
    let cls = 'phase-item';
    if (current === p.key) cls += ' active';
    else if (seen.has(p.key)) cls += ' done';
    return `<span class="${cls}">${p.label}</span>${i < 2 ? '<span class="phase-sep">›</span>' : ''}`;
  }).join('');
  return `<div class="decision-breadcrumb">${items}</div>`;
}
function renderPhaseTrack() {}

function renderDecision() {
  const panel = document.getElementById('decision-panel');
  const bc = phaseTrackHTML();
  if (currentId === 'done') {
    const total = log.length;
    panel.innerHTML = `
      ${bc}
      <div class="done-card">
        <div class="done-icon">✅</div>
        <div class="done-title">Ferdig kartlagt!</div>
        <div class="done-sub">
          <strong>${total} steg</strong> fullført.<br>Se hele oversikten i panelet til høyre.
        </div>
        <button class="btn-restart" onclick="reset()">Start en ny flyt</button>
      </div>
      <div class="back-area"><button class="btn-back" onclick="goBack()">← Gå tilbake</button></div>`;
    return;
  }
  const screen = screens[currentId];
  const cat = CAT[screen.category];

  if (screen.type === 'task') {
    panel.innerHTML = `
      ${bc}
      <div class="task-card">
        <div class="task-icon-row">${screen.taskIcon || '✏️'}</div>
        <div class="category-badge ${cat.badge}">${cat.icon} ${cat.label}</div>
        <div class="task-title">${screen.question}</div>
        ${screen.description ? `<div class="task-desc">${screen.description}</div>` : ''}
        <button class="task-btn" onclick="choose(0)">✓ Fullført – gå videre</button>
      </div>
      <div class="back-area"><button class="btn-back" onclick="goBack()" ${!history.length ? 'disabled' : ''}>← Gå tilbake</button></div>`;
    return;
  }

  const choicesHtml = screen.choices.map((c, i) => {
    const edgeHtml = c.edge ? `<span class="choice-edge ${c.edge==='JA'?'edge-ja':'edge-nei'}">${c.edge}</span>` : '';
    return `<button class="choice-btn" onclick="choose(${i})">${edgeHtml}<span class="choice-label">${c.label}</span><span class="choice-arrow">→</span></button>`;
  }).join('');
  panel.innerHTML = `
    ${bc}
    <div class="decision-card">
      <div class="category-badge ${cat.badge}">${cat.icon} ${cat.label}</div>
      <div class="question-text">${screen.question}</div>
      ${screen.description ? `<div class="question-desc">${screen.description}</div>` : ''}
      <div class="choices">${choicesHtml}</div>
    </div>
    <div class="back-area"><button class="btn-back" onclick="goBack()" ${!history.length ? 'disabled' : ''}>← Gå tilbake</button></div>`;
}

function renderUseCases() {
  const panel = document.getElementById('uc-panel');
  const nyBruker     = useCases.filter(u => u.steps[0][1] === 1);
  const eksistBruker = useCases.filter(u => u.steps[0][1] === 0);
  function ucCard(uc) {
    const l = computeLog(uc.steps);
    return `
      <div class="uc-card ${selectedUcId===uc.id?'selected':''}" onclick="selectUseCase('${uc.id}')">
        <div class="uc-card-title">${uc.title}</div>
        <div class="uc-tags">${uc.tags.map(([t,c])=>`<span class="uc-tag tag-${c}">${t}</span>`).join('')}</div>
        <div class="uc-card-desc">${uc.description} · ${l.length} steg</div>
      </div>`;
  }
  panel.innerHTML = `
    <div class="uc-intro"><h2>Use cases</h2><p>Velg en konfigurasjon for å se alle steg og aspekter for den situasjonen.</p></div>
    <div class="uc-section"><div class="uc-section-title">👤 Ny bruker</div><div class="uc-grid">${nyBruker.map(ucCard).join('')}</div></div>
    <div class="uc-section"><div class="uc-section-title">👤 Eksisterende bruker</div><div class="uc-grid">${eksistBruker.map(ucCard).join('')}</div></div>`;
}

function setLogView(v) {
  logView = v;
  if (v === 'node') drawnEdges.clear();
  document.getElementById('log-tab-list').classList.toggle('active', v === 'list');
  document.getElementById('log-tab-node').classList.toggle('active', v === 'node');
  document.getElementById('log-body').style.display  = v === 'list' ? '' : 'none';
  document.getElementById('node-view').style.display = v === 'node' ? '' : 'none';
  renderLog();
}

function renderNodeView() {
  const container = document.getElementById('node-view');
  const { active, edges } = computeNodeState();

  let edgesSvg = '';
  for (const key of edges) {
    const parts = key.split('-');
    const fromKey = parts[0];
    const toKey   = parts.slice(1).join('-');
    const meta = EDGE_META[key];
    const p1 = NODE_POS[fromKey], p2 = NODE_POS[toKey];
    const len = Math.ceil(Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2));
    const isNew = !drawnEdges.has(key);
    if (isNew) drawnEdges.add(key);

    let animSvg = '';
    if (isNew) {
      animSvg = meta.dash
        ? `<animate attributeName="opacity" from="0" to="1" dur="0.35s" fill="freeze"/>`
        : `<animate attributeName="stroke-dashoffset" from="${len}" to="0" dur="0.55s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>`;
    }
    const dashAttr = meta.dash
      ? `stroke-dasharray="${meta.dash}"`
      : `stroke-dasharray="${len}" stroke-dashoffset="0"`;

    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const chipW = meta.label.length * 5.6 + 14;
    edgesSvg += `
      <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
        stroke="${meta.color}" stroke-width="${meta.w}" stroke-linecap="round"
        ${dashAttr}>${animSvg}</line>
      <rect x="${mx - chipW/2}" y="${my - 14}" width="${chipW}" height="14"
        rx="7" fill="white" stroke="${meta.color}" stroke-width="1"
        style="pointer-events:none"/>
      <text x="${mx}" y="${my - 7 + 3.5}" text-anchor="middle"
        font-size="8.5" font-weight="700" font-family="system-ui" fill="${meta.color}"
        style="pointer-events:none">${meta.label}</text>`;
  }

  let nodesSvg = '';
  for (const [key, pos] of Object.entries(NODE_POS)) {
    const meta = NODE_META[key];
    const isActive = active[key];
    const labelY = pos.y + meta.r + 15;
    if (isActive) {
      nodesSvg += `
        <circle cx="${pos.x}" cy="${pos.y}" r="${meta.r}" fill="${meta.fill}" stroke="${meta.stroke}" stroke-width="2.5"/>
        <text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle"
          font-size="${meta.r > 35 ? 20 : 16}" style="pointer-events:none">${meta.icon}</text>
        <text x="${pos.x}" y="${labelY}" text-anchor="middle"
          font-size="10" font-weight="700" font-family="system-ui" fill="${meta.fill}">${meta.label}</text>`;
    } else {
      nodesSvg += `
        <circle cx="${pos.x}" cy="${pos.y}" r="${meta.r}" fill="#f9fafb" stroke="#e5e7eb"
          stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle"
          font-size="${meta.r > 35 ? 20 : 16}" opacity="0.25" style="pointer-events:none">${meta.icon}</text>
        <text x="${pos.x}" y="${labelY}" text-anchor="middle"
          font-size="10" font-weight="600" font-family="system-ui" fill="#d1d5db">${meta.label}</text>`;
    }
  }

  const hint = edges.size === 0
    ? `<text x="220" y="310" text-anchor="middle" font-size="11" font-family="system-ui" fill="#d1d5db">Ta valg i veiviseren for å se koblinger</text>`
    : '';

  container.innerHTML = `
    <svg viewBox="0 0 440 490" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      ${edgesSvg}
      ${nodesSvg}
      ${hint}
    </svg>`;
}

function renderLog() {
  const body   = document.getElementById('log-body');
  const footer = document.getElementById('log-footer');
  const count  = document.getElementById('step-count');

  if (logView === 'node') {
    renderNodeView();
    if (log.length) { count.textContent = log.length; footer.classList.add('visible'); }
    else footer.classList.remove('visible');
    return;
  }

  if (!log.length) {
    body.innerHTML = `<div class="log-empty"><div class="log-empty-icon">📋</div><div class="log-empty-text">${
      currentView==='usecases' ? 'Klikk på en konfigurasjon til venstre' : 'Ta valg til venstre –\nstegene samler seg her'
    }</div></div>`;
    footer.classList.remove('visible'); return;
  }
  body.innerHTML = log.map(entry => {
    const cat = CAT[entry.category];
    if (entry.isTask) {
      return `
        <div class="log-task ${cat.tb}">
          <div class="log-task-check">✓</div>
          <div class="log-task-label">${entry.title}</div>
          <div class="log-task-cat ${cat.tc}">${cat.label}</div>
        </div>`;
    }
    const aspectsHtml = entry.aspects.length
      ? `<div class="log-aspects">${entry.aspects.map(a=>`<div class="log-aspect"><div class="log-aspect-dot ${cat.dot}"></div><span>${a}</span></div>`).join('')}</div>`
      : '';
    return `
      <div class="log-entry ${cat.border}">
        <div class="log-entry-header ${cat.head}"><span>${cat.icon}</span><span class="${cat.badge}">${cat.label}</span></div>
        <div class="log-entry-title">${entry.title}</div>
        ${aspectsHtml}
      </div>`;
  }).join('');
  count.textContent = log.length;
  footer.classList.add('visible');
  body.scrollTop = body.scrollHeight;
}

function renderAll() {
  renderPhaseTrack();
  if (currentView === 'wizard')   renderDecision();
  if (currentView === 'usecases') renderUseCases();
  renderLog();
}
