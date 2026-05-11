const STORAGE_KEY = 'checklist-adrenalyn-xl-worldcup-26';
const USERS_KEY = `${STORAGE_KEY}:users`;
const SESSION_KEY = `${STORAGE_KEY}:session`;
const runtimeConfig = window.CHECKLIST_SUPABASE_CONFIG || {};
const CONFIG = {
  googleClientId: runtimeConfig.googleClientId || 'GOOGLE_CLIENT_ID_PENDING',
  backendMode: runtimeConfig.url && runtimeConfig.anonKey ? 'supabase' : 'mock',
  supabaseUrl: runtimeConfig.url || '',
  supabaseAnonKey: runtimeConfig.anonKey || ''
};

const state = {
  cards: [],
  activeUser: null,
  users: {},
  filters: { q: '', section: '', type: '', status: '' }
};

const el = {
  loginScreen: document.getElementById('loginScreen'),
  appShell: document.getElementById('appShell'),
  googleLoginButton: document.getElementById('googleLoginButton'),
  emailLoginForm: document.getElementById('emailLoginForm'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  loginMessage: document.getElementById('loginMessage'),
  currentUser: document.getElementById('currentUser'),
  logoutButton: document.getElementById('logoutButton'),
  dashboard: document.getElementById('dashboard'),
  ownedCount: document.getElementById('ownedCount'),
  missingCount: document.getElementById('missingCount'),
  duplicateCount: document.getElementById('duplicateCount'),
  progressPercent: document.getElementById('progressPercent'),
  search: document.getElementById('search'),
  teamFilter: document.getElementById('teamFilter'),
  typeFilter: document.getElementById('typeFilter'),
  statusFilter: document.getElementById('statusFilter'),
  cardsGrid: document.getElementById('cardsGrid'),
  template: document.getElementById('cardTemplate'),
  imageModal: document.getElementById('imageModal'),
  modalImage: document.getElementById('modalImage'),
  closeModal: document.getElementById('closeModal'),
  backupSlot: document.getElementById('backupSlot'),
  adminLink: document.getElementById('adminLink'),
  appView: document.getElementById('appView'),
  adminView: document.getElementById('adminView'),
  adminTable: document.getElementById('adminTable'),
  createUserForm: document.getElementById('createUserForm'),
  adminEmailInput: document.getElementById('adminEmailInput'),
  adminPasswordInput: document.getElementById('adminPasswordInput'),
  adminPlanInput: document.getElementById('adminPlanInput'),
  adminMessage: document.getElementById('adminMessage'),
  backToAppButton: document.getElementById('backToAppButton')
};

const placeholder = './placeholder-card.svg';
const teamCodeMap = {'ALGERIA':'dz','ARGENTINA':'ar','AUSTRALIA':'au','AUSTRIA':'at','BELGIUM':'be','BRAZIL':'br','CANADA':'ca','CAPE VERDE':'cv','COLOMBIA':'co','CROATIA':'hr','CURACAO':'cw','ECUADOR':'ec','EGYPT':'eg','ENGLAND':'gb-eng','FRANCE':'fr','GERMANY':'de','GHANA':'gh','HAITI':'ht','IRAN':'ir','IVORY COAST':'ci','JAPAN':'jp','JORDAN':'jo','SOUTH KOREA':'kr','MEXICO':'mx','MOROCCO':'ma','NETHERLANDS':'nl','NEW ZEALAND':'nz','NORWAY':'no','PANAMA':'pa','PARAGUAY':'py','PORTUGAL':'pt','QATAR':'qa','SAUDI ARABIA':'sa','SCOTLAND':'gb-sct','SENEGAL':'sn','SOUTH AFRICA':'za','SPAIN':'es','SWITZERLAND':'ch','TUNISIA':'tn','UNITED STATES':'us','URUGUAY':'uy','UZBEKISTAN':'uz'};
const specialLabels = {golden_baller:'Golden Ballers',contenders:'Contenders',top_keeper:'Top Keepers',defensive_rock:'Defensive Rocks',midfield_maestro:'Midfield Maestro',goal_machine:'Goal Machines',master_rookie:'Master Rookie',official_emblem:'Emblema',official_mascot:'Mascotas',eternos_22:'Eternos 22'};

const api = {
  getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  },
  saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  getChecklist(userId) {
    return JSON.parse(localStorage.getItem(`${STORAGE_KEY}:checklist:${userId}`) || '{}');
  },
  saveChecklist(userId, checklist) {
    localStorage.setItem(`${STORAGE_KEY}:checklist:${userId}`, JSON.stringify(checklist));
  }
};

const normalizeEmail = value => value.trim().toLowerCase();
const crestUrl = team => team === 'UNITED STATES' ? 'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg' : teamCodeMap[team] ? `https://flagcdn.com/h40/${teamCodeMap[team]}.png` : '';
const hashPassword = async value => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
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
const setLoginMessage = (text, error = false) => {
  el.loginMessage.textContent = text;
  el.loginMessage.dataset.error = error ? 'true' : 'false';
};
const setAdminMessage = (text, error = false) => {
  el.adminMessage.textContent = text;
  el.adminMessage.dataset.error = error ? 'true' : 'false';
};
const ensureAdminSeed = async () => {
  const users = api.getUsers();
  if (!Object.values(users).some(user => user.role === 'admin')) {
    users['admin@checklist.local'] = {
      id: 'admin@checklist.local',
      email: 'admin@checklist.local',
      name: 'Admin',
      role: 'admin',
      status: 'active',
      plan: 'lifetime',
      passwordHash: await hashPassword('admin1234')
    };
    api.saveUsers(users);
  }
};
const saveSession = () => localStorage.setItem(SESSION_KEY, JSON.stringify(state.activeUser));
const loadSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
const clearSession = () => localStorage.removeItem(SESSION_KEY);
const filteredCards = () => state.cards.filter(card => {
  const q = state.filters.q;
  return (!q || `${card.number} ${card.name} ${card.team}`.toLowerCase().includes(q))
    && (!state.filters.section || getSectionKey(card) === state.filters.section)
    && (!state.filters.type || card.type === state.filters.type)
    && (!state.filters.status || getStatus(card) === state.filters.status);
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
const downloadBackup = stateObj => {
  const blob = new Blob([JSON.stringify(stateObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  el.backupSlot.innerHTML = `<a id="backupLink" class="backup-link" download="checklist-backup.json" href="${url}">Descargar backup</a>`;
};
const loadChecklistForUser = userId => {
  const checklist = api.getChecklist(userId);
  state.cards = state.cards.map(card => ({ ...card, owned: checklist[card.id] ?? 0 }));
  downloadBackup(checklist);
};
const persistChecklist = () => {
  const checklist = Object.fromEntries(state.cards.map(card => [card.id, card.owned]));
  api.saveChecklist(state.activeUser.id, checklist);
  downloadBackup(checklist);
};
const renderDashboard = () => {
  const total = state.cards.length;
  const owned = state.cards.filter(c => c.owned > 0).length;
  const duplicates = state.cards.reduce((sum, c) => sum + Math.max(0, c.owned - 1), 0);
  el.ownedCount.textContent = owned;
  el.missingCount.textContent = total - owned;
  el.duplicateCount.textContent = duplicates;
  el.progressPercent.textContent = `${Math.round((owned / total) * 100) || 0}%`;
};
const renderCards = () => {
  el.cardsGrid.innerHTML = '';
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
      const node = el.template.content.firstElementChild.cloneNode(true);
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
      img.src = card.image || placeholder;
      node.querySelector('.thumb-button').onclick = () => {
        el.modalImage.src = card.image || placeholder;
        el.imageModal.showModal();
      };
      node.querySelector('[data-action="increment"]').onclick = () => updateCard(card, 1);
      node.querySelector('[data-action="decrement"]').onclick = () => updateCard(card, -1);
      row.appendChild(node);
    });
    wrapper.append(head, row);
    el.cardsGrid.appendChild(wrapper);
  });
};
const fillFilters = () => {
  el.teamFilter.innerHTML = '<option value="">Todas las secciones</option>';
  el.typeFilter.innerHTML = '<option value="">Todos los tipos</option>';
  buildSections(state.cards).map(s => s.key).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = getSectionLabel(key);
    el.teamFilter.appendChild(option);
  });
  [...new Set(state.cards.map(c => c.type))].forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = getSectionLabel(type);
    el.typeFilter.appendChild(option);
  });
};
const renderAdmin = () => {
  const users = api.getUsers();
  const rows = Object.values(users).sort((a,b) => a.email.localeCompare(b.email)).map(user => `
    <tr>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${user.plan || '-'}</td>
      <td>${user.status}</td>
      <td>
        <button data-action="toggle" data-user="${user.id}">${user.status === 'active' ? 'Desactivar' : 'Activar'}</button>
        <button data-action="delete" data-user="${user.id}">Eliminar</button>
      </td>
    </tr>`).join('');
  el.adminTable.innerHTML = `<table><thead><tr><th>Email</th><th>Rol</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
  el.adminTable.querySelectorAll('button').forEach(button => {
    button.onclick = () => {
      const userId = button.dataset.user;
      const usersMap = api.getUsers();
      if (button.dataset.action === 'toggle') {
        usersMap[userId].status = usersMap[userId].status === 'active' ? 'disabled' : 'active';
      } else if (button.dataset.action === 'delete' && userId !== state.activeUser.id) {
        delete usersMap[userId];
        localStorage.removeItem(`${STORAGE_KEY}:checklist:${userId}`);
      }
      api.saveUsers(usersMap);
      renderAdmin();
    };
  });
};
const showAdmin = () => {
  el.appView.hidden = true;
  el.adminView.hidden = false;
  renderAdmin();
};
const showApp = () => {
  el.adminView.hidden = true;
  el.appView.hidden = false;
};
const setActiveUser = user => {
  state.activeUser = user;
  saveSession();
  el.currentUser.textContent = `${user.email}${user.role === 'admin' ? ' · admin' : ''}`;
  el.loginScreen.hidden = true;
  el.appShell.hidden = false;
  el.adminLink.hidden = user.role !== 'admin';
  loadChecklistForUser(user.id);
  renderDashboard();
  renderCards();
  showApp();
};
const updateCard = (card, delta) => {
  card.owned = Math.max(0, card.owned + delta);
  persistChecklist();
  renderDashboard();
  renderCards();
};
const handleEmailLogin = async event => {
  event.preventDefault();
  const email = normalizeEmail(el.emailInput.value);
  const password = el.passwordInput.value;
  if (!email || !password) return setLoginMessage('Completa email y contraseña.', true);
  const users = api.getUsers();
  const passwordHash = await hashPassword(password);
  if (!users[email]) {
    users[email] = { id: email, email, name: email.split('@')[0], role: 'user', status: 'active', plan: 'basic', passwordHash };
    api.saveUsers(users);
  }
  const user = users[email];
  if (user.passwordHash !== passwordHash) return setLoginMessage('Contraseña incorrecta.', true);
  if (user.status !== 'active') return setLoginMessage('Cuenta desactivada.', true);
  setLoginMessage('');
  setActiveUser(user);
};
const handleGoogleCredential = response => {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  const email = normalizeEmail(payload.email);
  const users = api.getUsers();
  if (!users[email]) users[email] = { id: email, email, name: payload.name || email, role: 'user', status: 'active', plan: 'basic', provider: 'google' };
  if (users[email].status !== 'active') return setLoginMessage('Cuenta desactivada.', true);
  api.saveUsers(users);
  setLoginMessage('');
  setActiveUser(users[email]);
};
const initGoogleLogin = () => {
  if (!window.google?.accounts?.id || CONFIG.googleClientId === 'GOOGLE_CLIENT_ID_PENDING') {
    el.googleLoginButton.innerHTML = '<button type="button" disabled>Google pendiente de configurar</button>';
    return;
  }
  google.accounts.id.initialize({ client_id: CONFIG.googleClientId, callback: handleGoogleCredential });
  google.accounts.id.renderButton(el.googleLoginButton, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill' });
};
const logout = () => {
  state.activeUser = null;
  clearSession();
  el.appShell.hidden = true;
  el.loginScreen.hidden = false;
  el.emailLoginForm.reset();
  setLoginMessage('');
};
const bindEvents = () => {
  ['input','change'].forEach(evt => {
    el.search.addEventListener(evt, () => { state.filters.q = el.search.value.trim().toLowerCase(); renderCards(); });
    el.teamFilter.addEventListener(evt, () => { state.filters.section = el.teamFilter.value; renderCards(); });
    el.typeFilter.addEventListener(evt, () => { state.filters.type = el.typeFilter.value; renderCards(); });
    el.statusFilter.addEventListener(evt, () => { state.filters.status = el.statusFilter.value; renderCards(); });
  });
  el.closeModal.onclick = () => el.imageModal.close();
  el.imageModal.addEventListener('click', event => { if (event.target === el.imageModal) el.imageModal.close(); });
  el.emailLoginForm.addEventListener('submit', handleEmailLogin);
  el.logoutButton.addEventListener('click', logout);
  el.adminLink.addEventListener('click', showAdmin);
  el.backToAppButton.addEventListener('click', showApp);
  el.createUserForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = normalizeEmail(el.adminEmailInput.value);
    const password = el.adminPasswordInput.value;
    const plan = el.adminPlanInput.value.trim() || 'basic';
    if (!email || !password) return setAdminMessage('Completa email y contraseña.', true);
    const users = api.getUsers();
    users[email] = { id: email, email, name: email.split('@')[0], role: 'user', status: 'active', plan, passwordHash: await hashPassword(password) };
    api.saveUsers(users);
    el.createUserForm.reset();
    setAdminMessage('Usuario creado.');
    renderAdmin();
  });
};

const init = async () => {
  await ensureAdminSeed();
  state.cards = await fetch('./data/cards.json').then(r => r.json());
  fillFilters();
  bindEvents();
  initGoogleLogin();
  const session = loadSession();
  if (session) {
    const users = api.getUsers();
    if (users[session.id] && users[session.id].status === 'active') setActiveUser(users[session.id]);
  }
};

init();
