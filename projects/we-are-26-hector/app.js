const storageKey = 'we-are-26-hector';
const cardsGrid = document.getElementById('cardsGrid');
const template = document.getElementById('cardTemplate');
const search = document.getElementById('search');
const teamFilter = document.getElementById('teamFilter');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
let cards = [];

const loadState = () => JSON.parse(localStorage.getItem(storageKey) || '{}');
const saveState = () => localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(cards.map(card => [card.id, card.owned]))));
const applyState = baseCards => {
  const state = loadState();
  return baseCards.map(card => ({ ...card, owned: state[card.id] ?? 0 }));
};
const getStatus = card => card.owned > 1 ? 'duplicates' : card.owned === 1 ? 'owned' : 'missing';
const labelType = type => ({golden_baller:'Golden Baller',base:'Base',contenders:'Contenders',top_keeper:'Top Keepers',defensive_rock:'Defensive Rocks',midfield_maestro:'Midfield Maestros',goal_machine:'Goal Machines',master_rookie:'Master Rookies',official_emblem:'Official Emblem',official_mascot:'Official Mascot',eternos_22:'Eternos 22'})[type] || type;
const crestUrl = team => `https://flagcdn.com/h40/${(teamCodeMap[team] || '').toLowerCase()}.png`;
const teamCodeMap = {
  'ALGERIA':'dz','ARGENTINA':'ar','AUSTRALIA':'au','AUSTRIA':'at','BELGIUM':'be','BRAZIL':'br','CANADA':'ca','CAPE VERDE':'cv','COLOMBIA':'co','CROATIA':'hr','CURAÇAO':'cw','ECUADOR':'ec','EGYPT':'eg','ENGLAND':'gb-eng','FRANCE':'fr','GERMANY':'de','GHANA':'gh','HAITI':'ht','IRAN':'ir','IVORY COAST':'ci','JAPAN':'jp','JORDAN':'jo','KOREA REPUBLIC':'kr','MEXICO':'mx','MOROCCO':'ma','NETHERLANDS':'nl','NEW ZEALAND':'nz','NORWAY':'no','PANAMA':'pa','PARAGUAY':'py','PORTUGAL':'pt','QATAR':'qa','SAUDI ARABIA':'sa','SCOTLAND':'gb-sct','SENEGAL':'sn','SOUTH AFRICA':'za','SPAIN':'es','SWITZERLAND':'ch','TUNISIA':'tn','UNITED STATES':'us','URUGUAY':'uy','UZBEKISTAN':'uz','FIFA':''
};

const groupedCards = cards => {
  const order = [];
  const map = new Map();
  cards.forEach(card => {
    const key = `${card.team}__${card.type}`;
    if (!map.has(key)) {
      map.set(key, { team: card.team, type: card.type, items: [] });
      order.push(key);
    }
    map.get(key).items.push(card);
  });
  return order.map(key => map.get(key));
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

const filteredCards = () => cards.filter(card => {
  const q = search.value.trim().toLowerCase();
  return (!q || `${card.number} ${card.name} ${card.team}`.toLowerCase().includes(q))
    && (!teamFilter.value || card.team === teamFilter.value)
    && (!typeFilter.value || card.type === typeFilter.value)
    && (!statusFilter.value || getStatus(card) === statusFilter.value);
});

const renderCards = () => {
  cardsGrid.innerHTML = '';
  groupedCards(filteredCards()).forEach(group => {
    const section = document.createElement('section');
    section.className = 'group';
    const head = document.createElement('div');
    head.className = 'group-head';
    const crest = teamCodeMap[group.team] ? `<img class="crest" src="${crestUrl(group.team)}" alt="${group.team}">` : '<span class="crest crest-fallback">★</span>';
    head.innerHTML = `<div class="group-title">${crest}<div><h2>${group.team}</h2><p>${labelType(group.type)}</p></div></div><span>${group.items.length} cards</span>`;
    const grid = document.createElement('div');
    grid.className = 'cards-grid';
    group.items.forEach(card => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.classList.toggle('owned', card.owned === 1);
      node.classList.toggle('duplicate', card.owned > 1);
      node.querySelector('.num').textContent = `#${card.number}`;
      node.querySelector('.badge').textContent = card.owned > 1 ? `${card.owned}` : '';
      node.querySelector('.name').textContent = card.name;
      node.querySelector('.team').textContent = card.team;
      node.querySelector('.meta').textContent = card.subtype.replaceAll('_', ' ');
      node.querySelector('[data-action="increment"]').onclick = () => { card.owned += 1; saveState(); renderDashboard(); renderCards(); };
      node.querySelector('[data-action="decrement"]').onclick = () => { card.owned = Math.max(0, card.owned - 1); saveState(); renderDashboard(); renderCards(); };
      grid.appendChild(node);
    });
    section.appendChild(head);
    section.appendChild(grid);
    cardsGrid.appendChild(section);
  });
};

const fillTeamFilter = () => [...new Set(cards.map(c => c.team).filter(Boolean))].sort().forEach(team => {
  const option = document.createElement('option');
  option.value = team; option.textContent = team; teamFilter.appendChild(option);
});
['input','change'].forEach(evt => [search,teamFilter,typeFilter,statusFilter].forEach(el => el.addEventListener(evt, renderCards)));
fetch('./data/cards.json').then(r => r.json()).then(data => { cards = applyState(data); fillTeamFilter(); renderDashboard(); renderCards(); });
