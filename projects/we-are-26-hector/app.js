const storageKey = 'we-are-26-hector';
const cardsGrid = document.getElementById('cardsGrid');
const template = document.getElementById('cardTemplate');
const search = document.getElementById('search');
const teamFilter = document.getElementById('teamFilter');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModal = document.getElementById('closeModal');
let cards = [];
const placeholder = './placeholder-card.svg';
const goldenImageMap = {
  1: './assets/golden-drive/1.jpg',
  2: './assets/golden-drive/2.jpg',
  3: './assets/golden-drive/3.jpg',
  4: './assets/golden-drive/4.jpg',
  5: './assets/golden-drive/5.jpg',
  6: './assets/golden-drive/6.jpg',
  7: './assets/golden-drive/7.jpg',
  8: './assets/golden-drive/8.jpg',
  9: './assets/golden-drive/9.jpg'
};
const teamCodeMap = {'ALGERIA':'dz','ARGENTINA':'ar','AUSTRALIA':'au','AUSTRIA':'at','BELGIUM':'be','BRAZIL':'br','CANADA':'ca','CAPE VERDE':'cv','COLOMBIA':'co','CROATIA':'hr','CURACAO':'cw','ECUADOR':'ec','EGYPT':'eg','ENGLAND':'gb-eng','FRANCE':'fr','GERMANY':'de','GHANA':'gh','HAITI':'ht','IRAN':'ir','IVORY COAST':'ci','JAPAN':'jp','JORDAN':'jo','SOUTH KOREA':'kr','MEXICO':'mx','MOROCCO':'ma','NETHERLANDS':'nl','NEW ZEALAND':'nz','NORWAY':'no','PANAMA':'pa','PARAGUAY':'py','PORTUGAL':'pt','QATAR':'qa','SAUDI ARABIA':'sa','SCOTLAND':'gb-sct','SENEGAL':'sn','SOUTH AFRICA':'za','SPAIN':'es','SWITZERLAND':'ch','TUNISIA':'tn','UNITED STATES':'us','URUGUAY':'uy','UZBEKISTAN':'uz'};
const crestUrl = team => team === 'UNITED STATES' ? 'https://flagcdn.com/us.svg' : teamCodeMap[team] ? `https://flagcdn.com/h40/${teamCodeMap[team]}.png` : '';
const specialLabels = {golden_baller:'Golden Ballers',contenders:'Contenders',top_keeper:'Top Keepers',defensive_rock:'Defensive Rocks',midfield_maestro:'Midfield Maestro',goal_machine:'Goal Machines',master_rookie:'Master Rookie',official_emblem:'Emblema',official_mascot:'Mascotas',eternos_22:'Eternos 22'};
const apiUrl = 'https://german-state.tycoty.workers.dev/we-are-26/state';
const loadState = async () => {
  try {
    const res = await fetch(apiUrl);
    if (res.ok) return await res.json();
  } catch {}
  return JSON.parse(localStorage.getItem(storageKey) || '{}');
};
const saveState = async () => {
  const state = Object.fromEntries(cards.map(card => [card.id, card.owned]));
  localStorage.setItem(storageKey, JSON.stringify(state));
  downloadBackup(state);
  try {
    await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
  } catch {}
};
const downloadBackup = state => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  let link = document.getElementById('backupLink');
  if (!link) {
    link = document.createElement('a');
    link.id = 'backupLink';
    link.textContent = 'Descargar backup';
    link.download = 'we-are-26-hector-backup.json';
    link.className = 'backup-link';
    document.querySelector('.controls').appendChild(link);
  }
  link.href = url;
};
const resolveCardImage = card => goldenImageMap[card.number] || card.image || placeholder;
const applyState = (baseCards, state) => {
  downloadBackup(state);
  return baseCards.map(card => ({ ...card, owned: state[card.id] ?? 0, image: resolveCardImage(card) }));
};
const getStatus = card => card.owned > 1 ? 'duplicates' : card.owned === 1 ? 'owned' : 'missing';
const getSectionKey = card => {
  if (card.number <= 9) return 'golden_baller';
  if (card.number <= 513) return card.team;
  if (card.number <= 549) return 'contenders';
  if (card.number <= 558) return 'top_keeper';
  if (card.number <= 567) return 'defensive_rock';
  if (card.number <= 585) return 'midfield_maestro';
  if (card.number <= 607) return 'goal_machine';
  if (card.number <= 623) return 'master_rookie';
  if (card.number === 624) return 'official_emblem';
  if (card.number <= 627) return 'official_mascot';
  return 'eternos_22';
};
const getSectionLabel = key => specialLabels[key] || key;
const filteredCards = () => cards.filter(card => {
  const q = search.value.trim().toLowerCase();
  return (!q || `${card.number} ${card.name} ${card.team}`.toLowerCase().includes(q))
    && (!teamFilter.value || getSectionKey(card) === teamFilter.value)
    && (!typeFilter.value || card.type === typeFilter.value)
    && (!statusFilter.value || getStatus(card) === statusFilter.value);
});
const buildSections = list => {
  const map = new Map();
  list.forEach(card => {
    const key = getSectionKey(card);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(card);
  });
  const ordered = [];
  if (map.has('golden_baller')) ordered.push('golden_baller');
  const teamSections = [...map.keys()].filter(key => !['golden_baller','contenders','top_keeper','defensive_rock','midfield_maestro','goal_machine','master_rookie','official_emblem','official_mascot','eternos_22'].includes(key)).sort((a,b) => map.get(a)[0].number - map.get(b)[0].number);
  ordered.push(...teamSections);
  ['contenders','top_keeper','defensive_rock','midfield_maestro','goal_machine','master_rookie','official_emblem','official_mascot','eternos_22'].forEach(key => { if (map.has(key)) ordered.push(key); });
  return ordered.map(key => ({ key, items: map.get(key).sort((a,b) => a.number - b.number) }));
};
const renderDashboard = () => {
  const total = cards.length;
  const owned = cards.filter(c => c.owned > 0).length;
  const duplicates = cards.reduce((sum, c) => sum + Math.max(0, c.owned - 1), 0);
  document.getElementById('ownedCount').textContent = owned;
  document.getElementById('missingCount').textContent = total - owned;
  document.getElementById('duplicateCount').textContent = duplicates;
  document.getElementById('progressPercent').textContent = `${Math.round((owned / total) * 100) || 0}%`;
};
const rerenderKeepingPosition = () => {
  const scrollY = window.scrollY;
  const rows = [...document.querySelectorAll('.cards-row')].map(row => row.scrollLeft);
  renderDashboard();
  renderCards();
  window.scrollTo(0, scrollY);
  document.querySelectorAll('.cards-row').forEach((row, i) => { row.scrollLeft = rows[i] || 0; });
};
const updateCard = async (card, delta) => {
  card.owned = Math.max(0, card.owned + delta);
  await saveState();
  rerenderKeepingPosition();
};
const renderCards = () => {
  cardsGrid.innerHTML = '';
  buildSections(filteredCards()).forEach(section => {
    const owned = section.items.filter(card => card.owned > 0).length;
    const wrapper = document.createElement('section');
    wrapper.className = 'group';
    const head = document.createElement('div');
    head.className = 'group-head';
    const crest = crestUrl(section.key);
    head.innerHTML = `<div class="group-title">${crest ? `<img class="crest" src="${crest}" alt="${section.key}">` : '<span class="crest crest-fallback">★</span>'}<div><h2>${getSectionLabel(section.key)}</h2><p>${owned} de ${section.items.length}</p></div></div>`;
    const row = document.createElement('div');
    row.className = 'cards-row';
    section.items.forEach(card => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.classList.toggle('owned', card.owned >= 1);
      node.querySelector('.num').textContent = `#${card.number}`;
      node.querySelector('.badge').textContent = card.owned > 1 ? `${card.owned}` : '';
      node.querySelector('.badge').style.display = card.owned > 1 ? 'grid' : 'none';
      node.querySelector('.name').textContent = card.name;
      node.querySelector('.team').textContent = card.team;
      node.querySelector('.meta').textContent = card.subtype.replaceAll('_', ' ');
      const img = node.querySelector('.thumb');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = card.image;
      node.querySelector('.thumb-button').onclick = () => { modalImage.src = card.image; imageModal.showModal(); };
      node.querySelector('[data-action="increment"]').onclick = () => updateCard(card, 1);
      node.querySelector('[data-action="decrement"]').onclick = () => updateCard(card, -1);
      row.appendChild(node);
    });
    wrapper.append(head, row);
    cardsGrid.appendChild(wrapper);
  });
};
const fillFilters = () => {
  const orderedSections = buildSections(cards).map(s => s.key);
  orderedSections.forEach(key => {
    const option = document.createElement('option');
    option.value = key; option.textContent = getSectionLabel(key); teamFilter.appendChild(option);
  });
  [...new Set(cards.map(c => c.type))].forEach(type => {
    const option = document.createElement('option');
    option.value = type; option.textContent = getSectionLabel(type); typeFilter.appendChild(option);
  });
};
['input','change'].forEach(evt => [search,teamFilter,typeFilter,statusFilter].forEach(el => el.addEventListener(evt, renderCards)));
closeModal.onclick = () => imageModal.close();
imageModal.addEventListener('click', e => { if (e.target === imageModal) imageModal.close(); });
Promise.all([fetch('./data/cards.json').then(r => r.json()), loadState()]).then(([data, state]) => { cards = applyState(data, state); fillFilters(); renderDashboard(); renderCards(); });
