const dictionaries = {
  'es-ES': {
    htmlLang: 'es',
    pageTitle: 'Sticker Squad World Cup 26',
    login: {
      title: 'Entra en tu colección',
      subtitle: 'Controla tus cromos, repetidos, escudos y selecciones en una checklist digital hecha para coleccionistas.',
      emailPlaceholder: 'tu@email.com',
      passwordPlaceholder: 'Contraseña',
      showPassword: 'Ver',
      hidePassword: 'Ocultar',
      rememberMe: 'Recordar acceso',
      signIn: 'Entrar',
      signUp: 'Crear cuenta gratis',
      unlockFull: 'Dona un café y desbloquea la checklist completa'
    },
    app: {
      title: 'Sticker Squad World Cup 26',
      subtitle: 'Controla tus cromos, repetidos, escudos y selecciones en una checklist digital hecha para coleccionistas.',
      admin: 'Admin',
      logout: 'Salir',
      owned: 'Tengo',
      missing: 'Me faltan',
      duplicates: 'Repetidas',
      completed: 'Completado',
      searchPlaceholder: 'Buscar por código, nombre o selección',
      allSections: 'Todas las secciones',
      allTypes: 'Todos los tipos',
      allStatuses: 'Todos los estados',
      backup: 'Descargar backup',
      uploadBackup: 'Cargar backup',
      installApp: 'Instalar app',
      statusOwned: 'Tengo',
      statusMissing: 'Me falta',
      statusDuplicates: 'Repetida'
    },
    installApp: {
      title: 'Instala esta checklist en tu móvil',
      intro: 'Añade Sticker Squad a la pantalla de inicio y úsala como una app.',
      androidTitle: 'Android',
      iphoneTitle: 'iPhone',
      androidSteps: [
        'Abre la web en Chrome.',
        'Toca los tres puntos del navegador.',
        'Pulsa Instalar aplicación o Añadir a pantalla de inicio.',
        'Confirma con Instalar o Añadir.'
      ],
      iphoneSteps: [
        'Abre la web en Safari.',
        'Toca el botón de Compartir.',
        'Pulsa Añadir a pantalla de inicio.',
        'Confirma con Añadir.'
      ],
      outro: 'Después podrás abrir la checklist directamente desde el icono de tu móvil.'
    },
    admin: { panelTitle: 'Panel de usuarios', back: 'Volver' },
    common: {
      language: 'Idioma', spanish: 'Español', portuguese: 'Português', adminPlan: 'admin', paidPlan: 'paid', trialPlan: 'trial'
    },
    errors: {
      accountDisabled: 'Cuenta desactivada.', loadAccount: 'Error cargando la cuenta.', loadAdminUsers: 'Error cargando usuarios del panel admin.', projectMissing: 'Proyecto no encontrado en Supabase.', accountCreatedSignIn: 'Cuenta creada. Si no entra aún, usa el botón Entrar.'
    },
    labels: {
      intro: 'Intro / FIFA World Cup 26', museum: 'FIFA Museum',
      badge_foil: 'Escudo foil', player: 'Jugador', team_photo: 'Foto de equipo', foil: 'Foil', special: 'Especial'
    },
    teams: {
      MEX:'México', RSA:'Sudáfrica', KOR:'Corea del Sur', CZE:'República Checa', CAN:'Canadá', BIH:'Bosnia y Herzegovina', QAT:'Qatar', SUI:'Suiza', BRA:'Brasil', MAR:'Marruecos', HAI:'Haití', SCO:'Escocia', USA:'Estados Unidos', PAR:'Paraguay', AUS:'Australia', TUR:'Turquía', GER:'Alemania', CUW:'Curazao', CIV:'Costa de Marfil', ECU:'Ecuador', NED:'Países Bajos', JPN:'Japón', SWE:'Suecia', TUN:'Túnez', BEL:'Bélgica', EGY:'Egipto', IRN:'Irán', NZL:'Nueva Zelanda', ESP:'España', CPV:'Cabo Verde', KSA:'Arabia Saudí', URU:'Uruguay', FRA:'Francia', SEN:'Senegal', IRQ:'Irak', NOR:'Noruega', ARG:'Argentina', ALG:'Argelia', AUT:'Austria', JOR:'Jordania', POR:'Portugal', COD:'RD Congo', UZB:'Uzbekistán', COL:'Colombia', ENG:'Inglaterra', CRO:'Croacia', GHA:'Ghana', PAN:'Panamá'
    }
  },
  'pt-PT': {
    htmlLang: 'pt',
    pageTitle: 'Sticker Squad World Cup 26',
    login: {
      title: 'Entra na tua coleção',
      subtitle: 'Controla os teus cromos, repetidos, escudos e seleções numa checklist digital feita para colecionadores.',
      emailPlaceholder: 'teu@email.com',
      passwordPlaceholder: 'Palavra-passe',
      showPassword: 'Ver',
      hidePassword: 'Ocultar',
      rememberMe: 'Lembrar acesso',
      signIn: 'Entrar',
      signUp: 'Criar conta grátis',
      unlockFull: 'Oferece um café e desbloqueia a checklist completa'
    },
    app: {
      title: 'Sticker Squad World Cup 26',
      subtitle: 'Controla os teus cromos, repetidos, escudos e seleções numa checklist digital feita para colecionadores.',
      admin: 'Admin',
      logout: 'Sair',
      owned: 'Tenho',
      missing: 'Faltam-me',
      duplicates: 'Repetidas',
      completed: 'Concluído',
      searchPlaceholder: 'Pesquisar por código, nome ou seleção',
      allSections: 'Todas as secções',
      allTypes: 'Todos os tipos',
      allStatuses: 'Todos os estados',
      backup: 'Descarregar backup',
      uploadBackup: 'Carregar backup',
      installApp: 'Instalar app',
      statusOwned: 'Tenho',
      statusMissing: 'Falta-me',
      statusDuplicates: 'Repetida'
    },
    installApp: {
      title: 'Instala esta checklist no teu telemóvel',
      intro: 'Adiciona o Sticker Squad ao ecrã principal e usa-o como uma app.',
      androidTitle: 'Android',
      iphoneTitle: 'iPhone',
      androidSteps: [
        'Abre o site no Chrome.',
        'Toca nos três pontos do navegador.',
        'Carrega em Instalar aplicação ou Adicionar ao ecrã principal.',
        'Confirma com Instalar ou Adicionar.'
      ],
      iphoneSteps: [
        'Abre o site no Safari.',
        'Toca no botão Partilhar.',
        'Carrega em Adicionar ao ecrã principal.',
        'Confirma com Adicionar.'
      ],
      outro: 'Depois poderás abrir a checklist diretamente a partir do ícone no teu telemóvel.'
    },
    admin: { panelTitle: 'Painel de utilizadores', back: 'Voltar' },
    common: {
      language: 'Idioma', spanish: 'Español', portuguese: 'Português', adminPlan: 'admin', paidPlan: 'paid', trialPlan: 'trial'
    },
    errors: {
      accountDisabled: 'Conta desativada.', loadAccount: 'Erro ao carregar a conta.', loadAdminUsers: 'Erro ao carregar utilizadores do painel admin.', projectMissing: 'Projeto não encontrado no Supabase.', accountCreatedSignIn: 'Conta criada. Se ainda não entrar, usa o botão Entrar.'
    },
    labels: {
      intro: 'Intro / FIFA World Cup 26', museum: 'FIFA Museum',
      badge_foil: 'Escudo foil', player: 'Jogador', team_photo: 'Foto de equipa', foil: 'Foil', special: 'Especial'
    },
    teams: {
      MEX:'México', RSA:'África do Sul', KOR:'Coreia do Sul', CZE:'República Checa', CAN:'Canadá', BIH:'Bósnia e Herzegovina', QAT:'Catar', SUI:'Suíça', BRA:'Brasil', MAR:'Marrocos', HAI:'Haiti', SCO:'Escócia', USA:'Estados Unidos', PAR:'Paraguai', AUS:'Austrália', TUR:'Turquia', GER:'Alemanha', CUW:'Curaçau', CIV:'Costa do Marfim', ECU:'Equador', NED:'Países Baixos', JPN:'Japão', SWE:'Suécia', TUN:'Tunísia', BEL:'Bélgica', EGY:'Egito', IRN:'Irão', NZL:'Nova Zelândia', ESP:'Espanha', CPV:'Cabo Verde', KSA:'Arábia Saudita', URU:'Uruguai', FRA:'França', SEN:'Senegal', IRQ:'Iraque', NOR:'Noruega', ARG:'Argentina', ALG:'Argélia', AUT:'Áustria', JOR:'Jordânia', POR:'Portugal', COD:'RD Congo', UZB:'Uzbequistão', COL:'Colômbia', ENG:'Inglaterra', CRO:'Croácia', GHA:'Gana', PAN:'Panamá'
    }
  }
};

window.ChecklistI18n = { dictionaries, defaultLocale: 'es-ES' };
