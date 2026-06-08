const STORAGE_KEY = 'panini-world-cup-2026';
const PROJECT_KEY = 'panini-world-cup-2026';
const COLLECTION_KEY = 'panini-world-cup-2026';
const UPLOAD_APIS = [
  '/api/panini-album-image',
  'https://77.237.243.139.nip.io:4314/panini-world-cup-2026/album-image'
];
const LOCALE_KEY = `${STORAGE_KEY}:locale`;
const REMEMBER_KEY = `${STORAGE_KEY}:remember`;
const REMEMBER_EMAIL_KEY = `${STORAGE_KEY}:remember:email`;
const runtimeConfig = window.CHECKLIST_SUPABASE_CONFIG || {};
const { dictionaries, defaultLocale } = window.ChecklistI18n;
const CONFIG = { supabaseUrl: runtimeConfig.url || '', supabaseAnonKey: runtimeConfig.anonKey || '' };
const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, { auth: { storageKey: `sb-${PROJECT_KEY}-auth` } });
const state = {
  cards: [],
  activeUser: null,
  membership: null,
  checklistId: null,
  filters: { q: '', section: '', type: '', status: '' },
  trialMode: true,
  projectId: null,
  isAdminView: false,
  isAlbumEditMode: false,
  pendingImageChanges: new Map(),
  locale: localStorage.getItem(LOCALE_KEY) || defaultLocale,
  admin: {
    users: [],
    projects: [],
    filters: { q: '', projectId: '', plan: '', status: '' }
  }
};
window.__checklistDebug = { state };
const trialSections = new Set([
  'intro',
  'group-a-mex', 'group-a-rsa', 'group-a-kor', 'group-a-cze',
  'group-b-can', 'group-b-bih', 'group-b-qat', 'group-b-sui',
  'group-c-bra', 'group-c-mar', 'group-c-hai', 'group-c-sco'
]);
const GROUP_TEAMS = {
  'A': [['Mexico','MEX'],['South Africa','RSA'],['South Korea','KOR'],['Czechia','CZE']],
  'B': [['Canada','CAN'],['Bosnia and Herzegovina','BIH'],['Qatar','QAT'],['Switzerland','SUI']],
  'C': [['Brazil','BRA'],['Morocco','MAR'],['Haiti','HAI'],['Scotland','SCO']],
  'D': [['USA','USA'],['Paraguay','PAR'],['Australia','AUS'],['Türkiye','TUR']],
  'E': [['Germany','GER'],['Curaçao','CUW'],['Ivory Coast','CIV'],['Ecuador','ECU']],
  'F': [['Netherlands','NED'],['Japan','JPN'],['Sweden','SWE'],['Tunisia','TUN']],
  'G': [['Belgium','BEL'],['Egypt','EGY'],['Iran','IRN'],['New Zealand','NZL']],
  'H': [['Spain','ESP'],['Cape Verde','CPV'],['Saudi Arabia','KSA'],['Uruguay','URU']],
  'I': [['France','FRA'],['Senegal','SEN'],['Iraq','IRQ'],['Norway','NOR']],
  'J': [['Argentina','ARG'],['Algeria','ALG'],['Austria','AUT'],['Jordan','JOR']],
  'K': [['Portugal','POR'],['Congo DR','COD'],['Uzbekistan','UZB'],['Colombia','COL']],
  'L': [['England','ENG'],['Croatia','CRO'],['Ghana','GHA'],['Panama','PAN']]
};
const SECTION_ORDER = ['intro', ...Object.entries(GROUP_TEAMS).flatMap(([group, teams]) => teams.map(([,code]) => `group-${group.toLowerCase()}-${code.toLowerCase()}`)), 'museum'];
const el = {
  loginScreen: document.getElementById('loginScreen'),
  appShell: document.getElementById('appShell'),
  emailLoginForm: document.getElementById('emailLoginForm'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  togglePasswordButton: document.getElementById('togglePasswordButton'),
  emailSignInButton: document.getElementById('emailSignInButton'),
  emailSignUpButton: document.getElementById('emailSignUpButton'),
  loginMessage: document.getElementById('loginMessage'),
  currentUser: document.getElementById('currentUser'),
  adminLink: document.getElementById('adminLink'),
  albumEditorLink: document.getElementById('albumEditorLink'),
  trialUpgradeSlot: document.getElementById('trialUpgradeSlot'),
  logoutButton: document.getElementById('logoutButton'),
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
  installAppModal: document.getElementById('installAppModal'),
  closeInstallAppModal: document.getElementById('closeInstallAppModal'),
  installAppHelpButton: document.getElementById('installAppHelpButton'),
  installAppTitle: document.getElementById('installAppTitle'),
  installAppIntro: document.getElementById('installAppIntro'),
  installAppAndroidTitle: document.getElementById('installAppAndroidTitle'),
  installAppAndroidSteps: document.getElementById('installAppAndroidSteps'),
  installAppIphoneTitle: document.getElementById('installAppIphoneTitle'),
  installAppIphoneSteps: document.getElementById('installAppIphoneSteps'),
  installAppOutro: document.getElementById('installAppOutro'),
  lastScrollY: 0,
  backupSlot: document.getElementById('backupSlot'),
  backupUploadInput: document.getElementById('backupUploadInput'),
  backupUploadLabel: document.getElementById('backupUploadLabel'),
  albumEditorToolbar: document.getElementById('albumEditorToolbar'),
  albumEditorPendingCount: document.getElementById('albumEditorPendingCount'),
  albumEditorSaveButton: document.getElementById('albumEditorSaveButton'),
  albumEditorDiscardButton: document.getElementById('albumEditorDiscardButton'),
  appView: document.getElementById('appView'),
  adminView: document.getElementById('adminView'),
  adminTable: document.getElementById('adminTable'),
  adminMessage: document.getElementById('adminMessage'),
  backToAppButton: document.getElementById('backToAppButton'),
  localeSelectorTop: document.getElementById('localeSelectorTop'),
  localeSelectorLogin: document.getElementById('localeSelectorLogin'),
  rememberMeCheckbox: document.getElementById('rememberMeCheckbox'),
  rememberMeLabel: document.getElementById('rememberMeLabel'),
  adminSearchInput: document.getElementById('adminSearchInput'),
  adminProjectFilter: document.getElementById('adminProjectFilter'),
  adminPlanFilter: document.getElementById('adminPlanFilter'),
  adminStatusFilter: document.getElementById('adminStatusFilter'),
  adminCreateProject: document.getElementById('adminCreateProject'),
  adminCreateButton: document.getElementById('adminCreateButton')
};
const placeholder = './placeholder-card.svg';
const rotatedLandscapeCodes = new Set(['MEX13', 'BRA13', 'MAR13', 'JPN13', 'URU13', 'FRA13', 'NOR13', 'ARG13']);
const t = key => key.split('.').reduce((acc, part) => acc?.[part], dictionaries[state.locale]) || key;
const queuedImageChange = card => state.pendingImageChanges.get(card.id);
const setLoginMessage = (text, error = false) => { el.loginMessage.textContent = text; el.loginMessage.dataset.error = error ? 'true' : 'false'; };
const setAdminMessage = (text, error = false) => { el.adminMessage.textContent = text; el.adminMessage.dataset.error = error ? 'true' : 'false'; };
const formatDate = value => value ? new Intl.DateTimeFormat(state.locale).format(new Date(value)) : '-';
const crestUrl = card => card?.flagCode ? `https://flagcdn.com/h40/${card.flagCode}.png` : '';
const getStatus = card => card.owned > 1 ? 'duplicates' : card.owned === 1 ? 'owned' : 'missing';
const getTeamLabel = code => dictionaries[state.locale]?.teams?.[code] || code;
const getSectionKey = card => card.section;
const getSectionLabel = key => {
  if (key === 'intro' || key === 'museum') return t(`labels.${key}`);
  const match = key.match(/^group-([a-z])-([a-z0-9]+)$/);
  if (!match) return key;
  const group = match[1].toUpperCase();
  const code = match[2].toUpperCase();
  const team = GROUP_TEAMS[group]?.find(([, teamCode]) => teamCode === code);
  return team ? `${getTeamLabel(team[1])} · Grupo ${group}` : key;
};
const getTypeLabel = type => t(`labels.${type}`);
const visiblePool = () => state.trialMode ? state.cards.filter(card => trialSections.has(card.section)) : state.cards;
const filteredCards = () => visiblePool().filter(card => {
  const q = state.filters.q;
  return (!q || `${card.number} ${card.albumCode} ${card.name} ${card.team} ${getTeamLabel(card.teamCode)}`.toLowerCase().includes(q)) && (!state.filters.section || card.section === state.filters.section) && (!state.filters.type || card.type === state.filters.type) && (!state.filters.status || getStatus(card) === state.filters.status);
});
const buildSections = list => {
  const map = new Map();
  list.forEach(card => { const key = getSectionKey(card); if (!map.has(key)) map.set(key, []); map.get(key).push(card); });
  return SECTION_ORDER.filter(key => map.has(key)).map(key => ({ key, items: map.get(key).sort((a,b) => a.number - b.number) }));
};
const placeholderDataUrl = label => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 336"><rect width="240" height="336" rx="18" fill="#0b1220"/><rect x="12" y="12" width="216" height="312" rx="12" fill="#182338" stroke="#f0f3ff" stroke-width="2" stroke-dasharray="8 8"/><text x="120" y="150" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#ffffff">${label}</text><text x="120" y="188" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#9fb3d9">pendiente</text></svg>`)}`;
const cardImage = card => queuedImageChange(card)?.previewUrl || (card.image && card.image !== placeholder ? card.image : placeholderDataUrl(card.placeholderLabel || card.albumCode || card.id));
const downloadBackup = stateObj => { const blob = new Blob([JSON.stringify(stateObj, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); el.backupSlot.innerHTML = `<a id="backupLink" class="backup-link" download="checklist-backup.json" href="${url}">${t('app.backup')}</a>`; };
const renderInstallAppHelp = () => {
  if (!el.installAppTitle || !el.installAppAndroidSteps || !dictionaries[state.locale]?.installApp) return;
  const copy = dictionaries[state.locale].installApp;
  el.installAppTitle.textContent = copy.title;
  el.installAppIntro.textContent = copy.intro;
  el.installAppAndroidTitle.textContent = copy.androidTitle;
  el.installAppAndroidSteps.innerHTML = copy.androidSteps.map(step => `<li>${step}</li>`).join('');
  el.installAppIphoneTitle.textContent = copy.iphoneTitle;
  el.installAppIphoneSteps.innerHTML = copy.iphoneSteps.map(step => `<li>${step}</li>`).join('');
  el.installAppOutro.textContent = copy.outro;
};
const renderTrialUpgradeButton = () => { const shouldShow = state.membership?.role !== 'admin' && state.membership?.plan !== 'paid'; el.trialUpgradeSlot.hidden = !shouldShow; if (!shouldShow) { el.trialUpgradeSlot.innerHTML = ''; return; } el.trialUpgradeSlot.innerHTML = `<button class="trial-upgrade-fallback" type="button">${t('login.unlockFull')}</button>`; el.trialUpgradeSlot.querySelector('button').onclick = () => window.open('https://ko-fi.com/U7U51ZIXYB', '_blank', 'noopener,noreferrer'); };
const renderDashboard = () => { const total = visiblePool().length; const owned = visiblePool().filter(c => c.owned > 0).length; const duplicates = visiblePool().reduce((sum, c) => sum + Math.max(0, c.owned - 1), 0); el.ownedCount.textContent = owned; el.missingCount.textContent = total - owned; el.duplicateCount.textContent = duplicates; el.progressPercent.textContent = `${Math.round((owned / total) * 100) || 0}%`; };
const getAccessToken = async () => (await supabase.auth.getSession()).data.session?.access_token || '';
const askImageReplacement = card => `¿Quieres cambiar la imagen del cromo ${card.albumCode || card.id} · ${card.playerName || card.name}?`;
const updateAlbumEditorToolbar = () => {
  if (!el.albumEditorToolbar || !el.albumEditorPendingCount || !el.albumEditorSaveButton || !el.albumEditorDiscardButton) return;
  const pendingCount = state.pendingImageChanges.size;
  const visible = state.isAlbumEditMode && isPlatformAdmin();
  el.albumEditorToolbar.hidden = !visible;
  el.albumEditorPendingCount.textContent = pendingCount === 1 ? '1 cambio pendiente' : `${pendingCount} cambios pendientes`;
  el.albumEditorSaveButton.disabled = pendingCount === 0;
  el.albumEditorDiscardButton.disabled = pendingCount === 0;
};
const queueImageChange = (card, file) => {
  const previous = queuedImageChange(card);
  if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
  state.pendingImageChanges.set(card.id, { file, previewUrl: URL.createObjectURL(file) });
  updateAlbumEditorToolbar();
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitForPublishedImages = async expectedCards => {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const response = await fetch(`./data/cards.json?ts=${Date.now()}`, { cache: 'no-store' });
    const cards = await response.json();
    const cardMap = new Map(cards.map(card => [card.id, card]));
    const ready = expectedCards.every(item => {
      const published = cardMap.get(item.id);
      return published?.image && published.image !== item.previousImage;
    });
    if (ready) {
      state.cards = state.cards.map(card => {
        const published = cardMap.get(card.id);
        return published ? { ...card, image: published.image, owned: card.owned } : card;
      });
      return;
    }
    await wait(3000);
  }
  throw new Error('La imagen se subió, pero la publicación tardó demasiado.');
};
const clearPendingImageChanges = () => {
  state.pendingImageChanges.forEach(change => {
    if (change.previewUrl) URL.revokeObjectURL(change.previewUrl);
  });
  state.pendingImageChanges.clear();
  updateAlbumEditorToolbar();
};
const savePendingImageChanges = async () => {
  const pendingEntries = [...state.pendingImageChanges.entries()];
  if (!pendingEntries.length) return;
  el.albumEditorSaveButton.disabled = true;
  el.albumEditorDiscardButton.disabled = true;
  el.albumEditorPendingCount.textContent = 'Subiendo cambios...';
  try {
    const expectedCards = [];
    for (const [, [cardId, change]] of pendingEntries.entries()) {
      const card = state.cards.find(item => item.id === cardId);
      if (!card) continue;
      expectedCards.push({ id: card.id, previousImage: card.image || '' });
      await openManualUploadWindow(card, change.file, { waitForDeploy: false });
    }
    el.albumEditorPendingCount.textContent = 'Publicando cambios...';
    await waitForPublishedImages(expectedCards);
    clearPendingImageChanges();
    renderCards();
    setLoginMessage('');
    alert('Cambios guardados.');
  } catch (error) {
    console.error('album-image batch upload error', error);
    alert(error.message || 'No se pudieron guardar los cambios.');
  } finally {
    updateAlbumEditorToolbar();
  }
};
const uploadCardImage = async (token, form) => {
  let lastError = null;
  for (const url of UPLOAD_APIS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
      return payload;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('upload_failed');
};
const openManualUploadWindow = async (card, file, { waitForDeploy = false } = {}) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Sesión no válida.');
  const form = new FormData();
  form.append('cardId', card.id);
  form.append('file', file, file.name);
  form.append('waitForDeploy', waitForDeploy ? '1' : '0');
  const payload = await uploadCardImage(token, form);
  card.image = `${payload.image}?v=${Date.now()}`;
  return payload;
};
const bindImageEditor = (node, card) => {
  if (!state.isAlbumEditMode || !isPlatformAdmin()) return;
  const input = node.querySelector('.image-upload-input');
  if (!input) return;
  node.classList.add('edit-mode');
  const runUpload = async file => {
    if (!file) return;
    if (!window.confirm(askImageReplacement(card))) {
      input.value = '';
      return;
    }
    queueImageChange(card, file);
    renderCards();
    input.value = '';
  };
  input.addEventListener('change', event => runUpload(event.target.files?.[0]));
  node.addEventListener('dragover', event => { event.preventDefault(); node.classList.add('uploading'); });
  node.addEventListener('dragleave', () => node.classList.remove('uploading'));
  node.addEventListener('drop', event => {
    event.preventDefault();
    node.classList.remove('uploading');
    runUpload(event.dataTransfer?.files?.[0]);
  });
};
const renderCards = () => {
  el.cardsGrid.innerHTML = '';
  buildSections(filteredCards()).forEach(section => {
    const owned = section.items.filter(card => card.owned > 0).length;
    const wrapper = document.createElement('section'); wrapper.className = 'group'; wrapper.dataset.sectionKey = section.key;
    const head = document.createElement('div'); head.className = 'group-head';
    const firstCard = section.items[0];
    const flag = firstCard?.flagCode ? `<img class="crest" src="${crestUrl(firstCard)}" alt="${getTeamLabel(firstCard.teamCode)}">` : '<span class="crest crest-fallback">📘</span>';
    head.innerHTML = `<div class="group-title">${flag}<div><h2>${getSectionLabel(section.key)}</h2><p>${owned} de ${section.items.length}</p></div></div>`;
    const row = document.createElement('div'); row.className = 'cards-row';
    section.items.forEach(card => {
      const node = el.template.content.firstElementChild.cloneNode(true);
      node.dataset.cardNumber = card.number;
      node.dataset.cardCode = card.albumCode || card.id || '';
      node.classList.toggle('owned', card.owned >= 1);
      node.classList.toggle('pending-image', !!queuedImageChange(card));
      node.classList.toggle('landscape', !!card.landscape);
      node.classList.toggle('rotated-landscape', rotatedLandscapeCodes.has(card.albumCode || card.id));
      node.querySelector('.num').textContent = card.albumCode;
      node.querySelector('.badge').textContent = card.owned > 1 ? `${card.owned}` : '';
      node.querySelector('.badge').style.display = card.owned > 1 ? 'grid' : 'none';
      node.querySelector('.name').textContent = card.playerName || card.name;
      const cardIdNode = node.querySelector('.card-id');
      if (cardIdNode) cardIdNode.textContent = card.albumCode || card.id;
      const teamNode = node.querySelector('.team');
      if (teamNode) teamNode.innerHTML = '';
      const metaNode = node.querySelector('.meta');
      if (metaNode) metaNode.textContent = '';
      const img = node.querySelector('.thumb'); img.loading = 'lazy'; img.decoding = 'async'; img.src = cardImage(card); img.alt = `${card.name} ${getTeamLabel(card.teamCode)}`;
      node.querySelector('.thumb-button').onclick = () => {
        state.lastScrollY = window.scrollY;
        el.modalImage.src = cardImage(card);
        el.modalImage.classList.toggle('rotated-landscape', rotatedLandscapeCodes.has(card.albumCode || card.id));
        el.imageModal.showModal();
      };
      node.querySelector('[data-action="increment"]').onclick = () => updateCard(card, 1);
      node.querySelector('[data-action="decrement"]').onclick = () => updateCard(card, -1);
      bindImageEditor(node, card);
      row.appendChild(node);
    });
    wrapper.append(head, row); el.cardsGrid.appendChild(wrapper);
  });
  if (state.trialMode && state.membership?.role !== 'admin' && state.membership?.plan !== 'paid') {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'trial-upgrade-inline';
    ctaWrap.innerHTML = `<button class="trial-upgrade-fallback" type="button">${t('login.unlockFull')}</button>`;
    ctaWrap.querySelector('button').onclick = () => window.open('https://ko-fi.com/U7U51ZIXYB', '_blank', 'noopener,noreferrer');
    el.cardsGrid.appendChild(ctaWrap);
  }
};
const fillFilters = () => {
  const currentSection = state.filters.section; const currentType = state.filters.type; const visibleCards = visiblePool(); const visibleSections = buildSections(visibleCards).map(s => s.key); const visibleTypes = [...new Set(visibleCards.map(c => c.type))];
  el.teamFilter.innerHTML = `<option value="">${t('app.allSections')}</option>`; el.typeFilter.innerHTML = `<option value="">${t('app.allTypes')}</option>`;
  visibleSections.forEach(key => { const option = document.createElement('option'); option.value = key; option.textContent = getSectionLabel(key); el.teamFilter.appendChild(option); });
  visibleTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = getTypeLabel(type); el.typeFilter.appendChild(option); });
  el.teamFilter.value = visibleSections.includes(currentSection) ? currentSection : ''; el.typeFilter.value = visibleTypes.includes(currentType) ? currentType : '';
  if (!visibleSections.includes(currentSection)) state.filters.section = ''; if (!visibleTypes.includes(currentType)) state.filters.type = '';
};
const ensureProfile = async user => { const { data: existing, error } = await supabase.from('app_users').select('*').eq('id', user.id).maybeSingle(); if (error) throw error; if (!existing) { const { error: insertError } = await supabase.from('app_users').insert({ id: user.id, email: user.email, display_name: user.user_metadata?.full_name || user.email, last_seen_at: new Date().toISOString() }); if (insertError) throw insertError; return; } const { error: updateError } = await supabase.from('app_users').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id); if (updateError) throw updateError; };
const ensureProject = async () => { const { data, error } = await supabase.from('platform_projects').select('*').eq('project_key', PROJECT_KEY).maybeSingle(); if (error) throw error; if (!data && state.membership?.project_id) { state.projectId = state.membership.project_id; return { id: state.projectId, project_key: PROJECT_KEY }; } if (!data) throw new Error(t('errors.projectMissing')); state.projectId = data.id; return data; };
const ensureMembership = async user => { const { data: membership, error } = await supabase.from('project_memberships').select('*').eq('project_id', state.projectId).eq('user_id', user.id).maybeSingle(); if (error) throw error; if (membership) return membership; const now = new Date(); const trialEnds = new Date(now.getTime() + 183 * 24 * 60 * 60 * 1000); const { data, error: insertError } = await supabase.from('project_memberships').insert({ project_id: state.projectId, user_id: user.id, role: 'user', status: 'active', plan: 'basic', trial_started_at: now.toISOString(), trial_ends_at: trialEnds.toISOString() }).select('*').maybeSingle(); if (insertError) throw insertError; return data; };
const ensureChecklist = async user => { const { data: checklist, error } = await supabase.from('checklists').select('*').eq('project_id', state.projectId).eq('user_id', user.id).eq('collection_key', COLLECTION_KEY).maybeSingle(); if (error) throw error; if (checklist) return checklist; const { data, error: insertError } = await supabase.from('checklists').insert({ project_id: state.projectId, user_id: user.id, collection_key: COLLECTION_KEY, name: 'Mi checklist' }).select('*').maybeSingle(); if (insertError) throw insertError; return data; };
const loadChecklistCards = async checklistId => { const { data, error } = await supabase.from('checklist_cards').select('card_number, owned_count').eq('checklist_id', checklistId); if (error) throw error; const map = new Map((data || []).map(item => [item.card_number, item.owned_count])); state.cards = state.cards.map(card => ({ ...card, owned: map.get(card.number) || 0 })); downloadBackup(Object.fromEntries(state.cards.map(card => [card.id, card.owned]))); };
const persistChecklistCard = async card => { await supabase.from('checklist_cards').upsert({ checklist_id: state.checklistId, card_number: card.number, owned_count: card.owned }, { onConflict: 'checklist_id,card_number' }); downloadBackup(Object.fromEntries(state.cards.map(item => [item.id, item.owned]))); };
const importBackup = async file => { const text = await file.text(); const parsed = JSON.parse(text); for (const card of state.cards) { card.owned = Math.max(0, Number(parsed[card.id] ?? parsed[String(card.number)] ?? 0) || 0); } const rows = state.cards.map(card => ({ checklist_id: state.checklistId, card_number: card.number, owned_count: card.owned })); await supabase.from('checklist_cards').upsert(rows, { onConflict: 'checklist_id,card_number' }); renderDashboard(); renderCards(); downloadBackup(Object.fromEntries(state.cards.map(item => [item.id, item.owned]))); };
const isPlatformAdmin = () => state.membership?.role === 'admin';
const planPatch = plan => {
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 183 * 24 * 60 * 60 * 1000);
  return plan === 'paid'
    ? { plan: 'paid', status: 'active', checklist_limit: 10, trial_started_at: null, trial_ends_at: null, deactivated_at: null, payment_note: 'admin update' }
    : { plan: 'basic', status: 'active', checklist_limit: 1, trial_started_at: now.toISOString(), trial_ends_at: trialEnds.toISOString(), deactivated_at: null, payment_note: 'admin update' };
};
const statusPatch = status => status === 'disabled'
  ? { status: 'disabled', deactivated_at: new Date().toISOString() }
  : { status: 'active', deactivated_at: null };
const rolePatch = role => ({ role, status: 'active' });
const loadAdminData = async () => {
  const { data: projects, error: projectsError } = await supabase.from('platform_projects').select('id,project_key,name,status').order('name');
  if (projectsError) throw projectsError;
  state.admin.projects = projects || [];
  const { data: memberships, error: membershipsError } = await supabase.from('project_memberships').select('id,project_id,user_id,role,plan,status,trial_started_at,trial_ends_at,deactivated_at,created_at').order('created_at', { ascending: true });
  if (membershipsError) throw membershipsError;
  const ids = [...new Set((memberships || []).map(item => item.user_id).filter(Boolean))];
  let users = [];
  if (ids.length) {
    const { data, error } = await supabase.from('app_users').select('id,email,display_name,created_at,last_seen_at').in('id', ids);
    if (error) throw error;
    users = data || [];
  }
  const userMap = new Map(users.map(user => [user.id, user]));
  const projectMap = new Map((projects || []).map(project => [project.id, project]));
  state.admin.users = ids.map(userId => {
    const profile = userMap.get(userId) || { id: userId, email: userId, display_name: '' };
    const projectMemberships = (memberships || []).filter(item => item.user_id === userId).map(item => ({ ...item, project: projectMap.get(item.project_id) || null }));
    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name || '',
      createdAt: profile.created_at || null,
      lastSeenAt: profile.last_seen_at || null,
      memberships: projectMemberships
    };
  }).sort((a, b) => (a.email || '').localeCompare(b.email || ''));
};
const fillAdminProjectSelectors = () => {
  const options = [`<option value="">Todos los proyectos</option>`].concat(state.admin.projects.map(project => `<option value="${project.id}">${project.name}</option>`));
  el.adminProjectFilter.innerHTML = options.join('');
  el.adminCreateProject.innerHTML = `<option value="">Proyecto inicial</option>${state.admin.projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('')}`;
  el.adminProjectFilter.value = state.admin.filters.projectId;
};
const filteredAdminUsers = () => {
  const q = state.admin.filters.q.trim().toLowerCase();
  return state.admin.users.filter(user => {
    const textOk = !q || `${user.email} ${user.displayName}`.toLowerCase().includes(q);
    const membershipOk = user.memberships.some(item => (!state.admin.filters.projectId || item.project_id === state.admin.filters.projectId) && (!state.admin.filters.plan || item.plan === state.admin.filters.plan) && (!state.admin.filters.status || item.status === state.admin.filters.status));
    return textOk && membershipOk;
  });
};
const countProjectAdmins = projectId => state.admin.users.flatMap(user => user.memberships).filter(item => item.project_id === projectId && item.role === 'admin' && item.status === 'active').length;
const membershipActionsDisabled = membership => !isPlatformAdmin() || (membership.role === 'admin' && countProjectAdmins(membership.project_id) <= 1);
const renderMembershipCard = membership => {
  const disabled = membershipActionsDisabled(membership);
  const lockTag = disabled && membership.role === 'admin' ? `<span class="admin-lock">último admin</span>` : '';
  return `
    <div class="admin-project-card" data-membership-id="${membership.id}">
      <div class="admin-project-top">
        <div>
          <div class="admin-project-name">${membership.project?.name || membership.project_id}</div>
          <div class="admin-subline">${membership.project?.project_key || 'PENDIENTE DE CONFIRMAR'}</div>
        </div>
        ${lockTag}
      </div>
      <div class="admin-project-actions">
        <select data-admin-role="${membership.id}" ${disabled ? 'disabled' : ''}>
          <option value="user" ${membership.role === 'user' ? 'selected' : ''}>user</option>
          <option value="admin" ${membership.role === 'admin' ? 'selected' : ''}>admin</option>
        </select>
        <select data-admin-plan="${membership.id}" ${disabled ? 'disabled' : ''}>
          <option value="basic" ${membership.plan === 'basic' ? 'selected' : ''}>trial</option>
          <option value="paid" ${membership.plan === 'paid' ? 'selected' : ''}>paid</option>
        </select>
        <select data-admin-status="${membership.id}" ${disabled ? 'disabled' : ''}>
          <option value="active" ${membership.status === 'active' ? 'selected' : ''}>active</option>
          <option value="disabled" ${membership.status === 'disabled' ? 'selected' : ''}>disabled</option>
        </select>
        <button class="admin-inline-button" type="button" data-admin-disable-project="${membership.id}" ${disabled ? 'disabled' : ''}>Quitar acceso</button>
      </div>
      <div class="admin-subline">trial: ${formatDate(membership.trial_started_at)} → ${formatDate(membership.trial_ends_at)} · desactivado: ${formatDate(membership.deactivated_at)}</div>
    </div>`;
};
const renderAdmin = async () => {
  try {
    setAdminMessage('');
    await loadAdminData();
    fillAdminProjectSelectors();
    const users = filteredAdminUsers();
    if (!users.length) {
      el.adminTable.innerHTML = '<div class="admin-empty">No hay usuarios para esos filtros.</div>';
      return;
    }
    const projectOptions = state.admin.projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
    const rows = users.map(user => `
      <tr>
        <td>
          <strong>${user.email}</strong>
          <div class="admin-subline">${user.displayName || '-'}</div>
        </td>
        <td>${formatDate(user.lastSeenAt)}</td>
        <td>
          <div class="admin-projects">${user.memberships.map(renderMembershipCard).join('')}</div>
          <div style="margin-top:10px">
            <select data-admin-add-project="${user.id}"><option value="">Añadir acceso a proyecto</option>${projectOptions}</select>
          </div>
        </td>
      </tr>`).join('');
    el.adminTable.innerHTML = `<table><thead><tr><th>Usuario</th><th>Última conexión</th><th>Accesos por proyecto</th></tr></thead><tbody>${rows}</tbody></table>`;
    bindAdminTableActions();
  } catch (error) {
    console.error(error);
    setAdminMessage(error.message || t('errors.loadAdminUsers'), true);
  }
};
const updateMembership = async (membershipId, patch) => {
  const { error } = await supabase.from('project_memberships').update(patch).eq('id', membershipId);
  if (error) throw error;
};
const addMembership = async (userId, projectId) => {
  const existing = state.admin.users.find(user => user.id === userId)?.memberships.find(item => item.project_id === projectId);
  if (existing) throw new Error('Ese usuario ya tiene acceso a ese proyecto.');
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 183 * 24 * 60 * 60 * 1000);
  const { error } = await supabase.from('project_memberships').insert({ project_id: projectId, user_id: userId, role: 'user', status: 'active', plan: 'basic', checklist_limit: 1, trial_started_at: now.toISOString(), trial_ends_at: trialEnds.toISOString(), deactivated_at: null, payment_note: 'admin add project' });
  if (error) throw error;
};
const bindAdminTableActions = () => {
  el.adminTable.querySelectorAll('select[data-admin-plan]').forEach(select => {
    select.addEventListener('change', async () => {
      try { await updateMembership(select.dataset.adminPlan, planPatch(select.value)); setAdminMessage('Plan actualizado.'); await renderAdmin(); } catch (error) { setAdminMessage(error.message, true); }
    });
  });
  el.adminTable.querySelectorAll('select[data-admin-status]').forEach(select => {
    select.addEventListener('change', async () => {
      try { await updateMembership(select.dataset.adminStatus, statusPatch(select.value)); setAdminMessage('Estado actualizado.'); await renderAdmin(); } catch (error) { setAdminMessage(error.message, true); }
    });
  });
  el.adminTable.querySelectorAll('select[data-admin-role]').forEach(select => {
    select.addEventListener('change', async () => {
      try { await updateMembership(select.dataset.adminRole, rolePatch(select.value)); setAdminMessage('Rol actualizado.'); await renderAdmin(); } catch (error) { setAdminMessage(error.message, true); }
    });
  });
  el.adminTable.querySelectorAll('button[data-admin-disable-project]').forEach(button => {
    button.addEventListener('click', async () => {
      try { await updateMembership(button.dataset.adminDisableProject, statusPatch('disabled')); setAdminMessage('Acceso desactivado.'); await renderAdmin(); } catch (error) { setAdminMessage(error.message, true); }
    });
  });
  el.adminTable.querySelectorAll('select[data-admin-add-project]').forEach(select => {
    select.addEventListener('change', async () => {
      if (!select.value) return;
      try { await addMembership(select.dataset.adminAddProject, select.value); setAdminMessage('Acceso añadido.'); await renderAdmin(); } catch (error) { setAdminMessage(error.message, true); select.value = ''; }
    });
  });
};
const showAdmin = async () => { if (!isPlatformAdmin()) return; state.isAdminView = true; state.isAlbumEditMode = false; el.appView.hidden = true; el.adminView.hidden = false; updateAlbumEditorToolbar(); await renderAdmin(); };
const showApp = () => { state.isAdminView = false; state.isAlbumEditMode = false; el.adminView.hidden = true; el.appView.hidden = false; updateAlbumEditorToolbar(); renderCards(); };
const showAlbumEditor = () => {
  if (!isPlatformAdmin()) return;
  state.isAlbumEditMode = true;
  state.isAdminView = false;
  el.adminView.hidden = true;
  el.appView.hidden = false;
  updateAlbumEditorToolbar();
  fillFilters();
  renderDashboard();
  renderCards();
};
const setActiveUser = async user => {
  state.activeUser = user;
  state.trialMode = false;
  try {
    await ensureProfile(user);
    await ensureProject();
    state.membership = await ensureMembership(user);
    if (state.membership.status !== 'active') {
      await supabase.auth.signOut();
      setLoginMessage(t('errors.accountDisabled'), true);
      return;
    }
    state.trialMode = state.membership.role !== 'admin' && state.membership.plan !== 'paid';
    const planTag = state.membership.role === 'admin'
      ? `${t('common.adminPlan')} · ${state.membership.plan === 'paid' ? t('common.paidPlan') : t('common.trialPlan')}`
      : (state.membership.plan === 'paid' ? t('common.paidPlan') : t('common.trialPlan'));
    el.currentUser.textContent = `${user.email} · ${planTag}`;
    renderTrialUpgradeButton();
    el.loginScreen.style.display = 'none';
    el.loginScreen.hidden = true;
    el.appShell.hidden = false;
    el.appShell.style.display = 'block';
    el.adminLink.hidden = !isPlatformAdmin();
    el.albumEditorLink.hidden = !isPlatformAdmin();
    if (isPlatformAdmin()) {
      state.checklistId = null;
      fillFilters();
      renderDashboard();
      renderCards();
      await showAdmin();
    } else {
      const checklist = await ensureChecklist(user);
      state.checklistId = checklist.id;
      await loadChecklistCards(checklist.id);
      fillFilters();
      renderDashboard();
      renderCards();
      showApp();
    }
  } catch (error) {
    console.error(error);
    setLoginMessage(error.message || t('errors.loadAccount'), true);
  }
};
const updateVisibleCard = card => { const cardNode = document.querySelector(`.card-item[data-card-number="${card.number}"]`); if (!cardNode) return false; cardNode.classList.toggle('owned', card.owned >= 1); const badge = cardNode.querySelector('.badge'); badge.textContent = card.owned > 1 ? `${card.owned}` : ''; badge.style.display = card.owned > 1 ? 'grid' : 'none'; return true; };
const refreshSectionProgress = card => { const sectionKey = getSectionKey(card); const sectionNode = document.querySelector(`.group[data-section-key="${sectionKey}"]`); if (!sectionNode) return; const sectionCards = filteredCards().filter(item => getSectionKey(item) === sectionKey); const owned = sectionCards.filter(item => item.owned > 0).length; const progress = sectionNode.querySelector('.group-title p'); if (progress) progress.textContent = `${owned} de ${sectionCards.length}`; };
const updateCard = async (card, delta) => { const nextOwned = Math.max(0, card.owned + delta); if (nextOwned === card.owned) return; card.owned = nextOwned; await persistChecklistCard(card); renderDashboard(); updateVisibleCard(card); refreshSectionProgress(card); };
const getEmailCredentials = () => ({ email: el.emailInput.value.trim().toLowerCase(), password: el.passwordInput.value });
const persistRememberMe = () => { if (el.rememberMeCheckbox.checked) { localStorage.setItem(REMEMBER_KEY, '1'); localStorage.setItem(REMEMBER_EMAIL_KEY, el.emailInput.value.trim().toLowerCase()); } else { localStorage.removeItem(REMEMBER_KEY); localStorage.removeItem(REMEMBER_EMAIL_KEY); } };
const handleEmailSignIn = async () => { const { email, password } = getEmailCredentials(); const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) return setLoginMessage(error.message, true); persistRememberMe(); setLoginMessage(''); if (data.user) await setActiveUser(data.user); };
const handleEmailSignUp = async () => { const { email, password } = getEmailCredentials(); const { data, error } = await supabase.auth.signUp({ email, password }); if (error) return setLoginMessage(error.message, true); persistRememberMe(); setLoginMessage(t('errors.accountCreatedSignIn')); if (data.user) await setActiveUser(data.user); };
const logout = async () => { const keepRemember = el.rememberMeCheckbox.checked; clearPendingImageChanges(); await supabase.auth.signOut(); state.activeUser = null; state.membership = null; state.checklistId = null; state.trialMode = true; el.appShell.hidden = true; el.appShell.style.display = 'none'; el.trialUpgradeSlot.innerHTML = ''; el.trialUpgradeSlot.hidden = true; el.loginScreen.hidden = false; el.loginScreen.style.display = 'grid'; el.emailLoginForm.reset(); if (keepRemember) { el.emailInput.value = localStorage.getItem(REMEMBER_EMAIL_KEY) || ''; el.rememberMeCheckbox.checked = true; } setLoginMessage(''); };
const applyTranslations = () => {
  document.documentElement.lang = dictionaries[state.locale].htmlLang;
  document.title = t('pageTitle');
  document.getElementById('loginTitle').textContent = t('login.title');
  document.getElementById('loginSubtitle').textContent = t('login.subtitle');
  el.emailInput.placeholder = t('login.emailPlaceholder');
  el.passwordInput.placeholder = t('login.passwordPlaceholder');
  el.togglePasswordButton.textContent = el.passwordInput.type === 'password' ? t('login.showPassword') : t('login.hidePassword');
  el.emailSignInButton.textContent = t('login.signIn');
  el.emailSignUpButton.textContent = t('login.signUp');
  el.rememberMeLabel.textContent = t('login.rememberMe');
  document.getElementById('appTitle').textContent = t('app.title');
  document.getElementById('appSubtitle').textContent = t('app.subtitle');
  el.adminLink.textContent = 'Admin';
  if (el.albumEditorLink) el.albumEditorLink.textContent = 'Editar imágenes del álbum';
  el.logoutButton.textContent = t('app.logout');
  document.getElementById('labelOwned').textContent = t('app.owned');
  document.getElementById('labelMissing').textContent = t('app.missing');
  document.getElementById('labelDuplicates').textContent = t('app.duplicates');
  document.getElementById('labelCompleted').textContent = t('app.completed');
  el.search.placeholder = t('app.searchPlaceholder');
  el.statusFilter.innerHTML = `<option value="">${t('app.allStatuses')}</option><option value="owned">${t('app.statusOwned')}</option><option value="missing">${t('app.statusMissing')}</option><option value="duplicates">${t('app.statusDuplicates')}</option>`;
  document.getElementById('legendOwned').textContent = t('app.statusOwned');
  document.getElementById('legendMissing').textContent = t('app.statusMissing');
  document.getElementById('legendDuplicates').textContent = t('app.statusDuplicates');
  if (el.installAppHelpButton) el.installAppHelpButton.textContent = t('app.installApp');
  el.backupUploadLabel.textContent = t('app.uploadBackup');
  document.getElementById('adminPanelTitle').textContent = t('admin.panelTitle');
  el.backToAppButton.textContent = t('admin.back');
  el.localeSelectorTop.value = state.locale;
  el.localeSelectorLogin.value = state.locale;
  renderInstallAppHelp();
  fillFilters();
  if (state.isAdminView) renderAdmin(); else if (!el.appShell.hidden) { renderDashboard(); renderCards(); }
};
const setLocale = locale => { state.locale = dictionaries[locale] ? locale : defaultLocale; localStorage.setItem(LOCALE_KEY, state.locale); applyTranslations(); };
const bindEvents = () => {
  ['input','change'].forEach(evt => {
    el.search.addEventListener(evt, () => { state.filters.q = el.search.value.trim().toLowerCase(); renderCards(); });
    el.teamFilter.addEventListener(evt, () => { state.filters.section = el.teamFilter.value; renderCards(); });
    el.typeFilter.addEventListener(evt, () => { state.filters.type = el.typeFilter.value; renderCards(); });
    el.statusFilter.addEventListener(evt, () => { state.filters.status = el.statusFilter.value; renderCards(); });
  });
  el.closeModal.onclick = () => { el.imageModal.close(); window.scrollTo(0, state.lastScrollY || 0); };
  el.imageModal.addEventListener('click', event => { if (event.target === el.imageModal) { el.imageModal.close(); window.scrollTo(0, state.lastScrollY || 0); } });
  el.imageModal.addEventListener('close', () => { window.scrollTo(0, state.lastScrollY || 0); });
  if (el.installAppHelpButton && el.installAppModal) el.installAppHelpButton.addEventListener('click', () => el.installAppModal.showModal());
  if (el.closeInstallAppModal && el.installAppModal) el.closeInstallAppModal.addEventListener('click', () => el.installAppModal.close());
  if (el.installAppModal) el.installAppModal.addEventListener('click', event => { if (event.target === el.installAppModal) el.installAppModal.close(); });
  el.emailLoginForm.addEventListener('submit', event => event.preventDefault());
  el.togglePasswordButton.addEventListener('click', () => { const hidden = el.passwordInput.type === 'password'; el.passwordInput.type = hidden ? 'text' : 'password'; el.togglePasswordButton.textContent = hidden ? t('login.hidePassword') : t('login.showPassword'); });
  el.emailSignInButton.addEventListener('click', handleEmailSignIn);
  el.emailSignUpButton.addEventListener('click', handleEmailSignUp);
  el.logoutButton.addEventListener('click', logout);
  el.adminLink.addEventListener('click', showAdmin);
  if (el.albumEditorLink) el.albumEditorLink.addEventListener('click', showAlbumEditor);
  el.backToAppButton.addEventListener('click', showApp);
  if (el.albumEditorSaveButton) el.albumEditorSaveButton.addEventListener('click', savePendingImageChanges);
  if (el.albumEditorDiscardButton) el.albumEditorDiscardButton.addEventListener('click', () => {
    clearPendingImageChanges();
    renderCards();
  });
  el.localeSelectorTop.addEventListener('change', event => setLocale(event.target.value));
  el.localeSelectorLogin.addEventListener('change', event => setLocale(event.target.value));
  el.rememberMeCheckbox.addEventListener('change', persistRememberMe);
  el.backupUploadInput.addEventListener('change', async event => { const file = event.target.files?.[0]; if (!file) return; try { await importBackup(file); setLoginMessage(''); } catch (error) { console.error(error); setLoginMessage('Backup no válido.', true); } event.target.value = ''; });
  if (el.adminSearchInput) el.adminSearchInput.addEventListener('input', () => { state.admin.filters.q = el.adminSearchInput.value.trim().toLowerCase(); renderAdmin(); });
  if (el.adminProjectFilter) el.adminProjectFilter.addEventListener('change', () => { state.admin.filters.projectId = el.adminProjectFilter.value; renderAdmin(); });
  if (el.adminPlanFilter) el.adminPlanFilter.addEventListener('change', () => { state.admin.filters.plan = el.adminPlanFilter.value; renderAdmin(); });
  if (el.adminStatusFilter) el.adminStatusFilter.addEventListener('change', () => { state.admin.filters.status = el.adminStatusFilter.value; renderAdmin(); });
  if (el.adminCreateButton) el.adminCreateButton.addEventListener('click', () => setAdminMessage('PENDIENTE DE CONFIRMAR: crear/invitar usuario requiere flujo seguro fuera del frontend público.', true));
};
const init = async () => {
  state.cards = await fetch(`./data/cards.json?ts=${Date.now()}`, { cache: 'no-store' }).then(r => r.json());
  bindEvents();
  const params = new URLSearchParams(window.location.search);
  const forceLogout = params.get('logout') === '1';
  const adminRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/admin') || params.get('admin') === '1';
  const remembered = !forceLogout && localStorage.getItem(REMEMBER_KEY) === '1';
  if (forceLogout) {
    sessionStorage.clear();
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
    localStorage.removeItem(`sb-${PROJECT_KEY}-auth`);
    await supabase.auth.signOut().catch(() => {});
    history.replaceState({}, '', window.location.pathname);
  }
  el.rememberMeCheckbox.checked = remembered;
  if (remembered) el.emailInput.value = localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
  applyTranslations();
  updateAlbumEditorToolbar();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!forceLogout && sessionData.session?.user) await setActiveUser(sessionData.session.user);
  if (adminRoute && !sessionData.session?.user) {
    el.loginScreen.hidden = false;
    el.loginScreen.style.display = 'grid';
  }
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) await setActiveUser(session.user);
    if (event === 'SIGNED_OUT') {
      state.activeUser = null;
      state.trialMode = true;
      el.appShell.hidden = true;
      el.appShell.style.display = 'none';
      el.trialUpgradeSlot.innerHTML = '';
      el.trialUpgradeSlot.hidden = true;
      el.loginScreen.hidden = false;
      el.loginScreen.style.display = 'grid';
    }
  });
};
init();
