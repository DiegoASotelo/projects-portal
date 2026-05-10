const storageKey = 'we-are-26-hector';
const cardsGrid = document.getElementById('cardsGrid');
const template = document.getElementById('cardTemplate');
const search = document.getElementById('search');
const teamFilter = document.getElementById('teamFilter');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
let cards = [];

const loadState = () => JSON.parse(localStorage.getItem(storageKey) || '{}');
const saveState = () => {
  const state = Object.fromEntries(cards.map(card => [card.id, card.owned]));
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const applyState = (baseCards) => {
  const state = loadState();
  return baseCards.map(card => ({ ...card, owned: state[card.id] ?? 0 }));
};

const getStatus = (card) => card.owned > 1 ? 'duplicates' : card.owned === 1 ? 'owned' : 'missing';

const renderDashboard = () => {
  const total = cards.length;
  const owned = cards.filter(c => c.owned > 0).length;
  const duplicates = cards.reduce((sum, c) => sum + Math.max(0, c.owned - 1), 0);
  const missing = total - owned;
  document.getElementById('ownedCount').textContent = owned;
  document.getElementById('missingCount').textContent = missing;
  document.getElementById('duplicateCount').textContent = duplicates;
  document.getElementById('progressPercent').textContent = `${Math.round((owned / total) * 100) || 0}%`;
};

const filteredCards = () => cards.filter(card => {
  const q = search.value.trim().toLowerCase();
  const team = teamFilter.value;
  const type = typeFilter.value;
  const status = statusFilter.value;
  const matchesQ = !q || `${card.number} ${card.name} ${card.team || ''}`.toLowerCase().includes(q);
  const matchesTeam = !team || card.team === team;
  const matchesType = !type || card.type === type;
  const matchesStatus = !status || getStatus(card) === status;
  return matchesQ && matchesTeam && matchesType && matchesStatus;
});

const renderCards = () => {
  cardsGrid.innerHTML = '';
  filteredCards().forEach(card => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.toggle('owned', card.owned === 1);
    node.classList.toggle('duplicate', card.owned > 1);
    node.querySelector('.num').textContent = `#${card.number}`;
    node.querySelector('.badge').textContent = card.owned > 1 ? `x${card.owned}` : card.owned === 1 ? 'Tengo' : 'Falta';
    node.querySelector('.name').textContent = card.name;
    node.querySelector('.team').textContent = card.team || 'Especial';
    node.querySelector('.meta').textContent = `${card.type} · ${card.subtype}`;
    node.querySelector('[data-action="increment"]').onclick = () => { card.owned += 1; saveState(); renderDashboard(); renderCards(); };
    node.querySelector('[data-action="decrement"]').onclick = () => { card.owned = Math.max(0, card.owned - 1); saveState(); renderDashboard(); renderCards(); };
    cardsGrid.appendChild(node);
  });
};

const fillTeamFilter = () => {
  [...new Set(cards.map(c => c.team).filter(Boolean))].sort().forEach(team => {
    const option = document.createElement('option');
    option.value = team;
    option.textContent = team;
    teamFilter.appendChild(option);
  });
};

['input','change'].forEach(evt => {
  search.addEventListener(evt, renderCards);
  teamFilter.addEventListener(evt, renderCards);
  typeFilter.addEventListener(evt, renderCards);
  statusFilter.addEventListener(evt, renderCards);
});

fetch('./data/cards.json')
  .then(r => r.json())
  .then(data => {
    cards = applyState(data);
    fillTeamFilter();
    renderDashboard();
    renderCards();
  });
