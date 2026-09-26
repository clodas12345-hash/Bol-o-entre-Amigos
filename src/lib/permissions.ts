export type RoleType = 'admin' | 'counselor' | 'participant';

export type PermissionKey =
  // Apostas & Jogos
  | 'games_view'
  | 'games_create'
  | 'games_edit'
  | 'games_delete'
  | 'games_official_result_edit'
  // Participantes & Membros
  | 'members_view'
  | 'members_create'
  | 'members_edit'
  | 'members_change_role'
  | 'members_delete'
  | 'members_toggle_payment'
  | 'members_approve_quota'
  | 'members_send_reminder'
  // Financeiro & Caixa
  | 'finance_view_dashboard'
  | 'finance_view_detailed_report'
  | 'finance_manage_payments'
  | 'finance_export_print'
  // Desdobramentos
  | 'desdobramentos_generate'
  | 'desdobramentos_save_to_pool'
  // Regras & Normas
  | 'rules_view'
  | 'rules_edit'
  // Agenda & Calendário
  | 'calendar_view'
  | 'calendar_manage_events'
  // Chat & Comunicação
  | 'chat_view'
  | 'chat_send'
  | 'chat_moderate'
  // WhatsApp Hub
  | 'whatsapp_view'
  | 'whatsapp_broadcast'
  // Sistema & Bolões
  | 'system_manage_pools'
  | 'system_backup_restore'
  | 'system_manage_permissions';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: 'games' | 'members' | 'finance' | 'desdobramentos' | 'rules' | 'calendar' | 'chat' | 'whatsapp' | 'system';
}

export const PERMISSION_CATEGORIES: { id: PermissionDefinition['category']; label: string; icon: string }[] = [
  { id: 'games', label: 'Apostas & Bilhetes', icon: '🎰' },
  { id: 'members', label: 'Participantes & Membros', icon: '👥' },
  { id: 'finance', label: 'Financeiro & Caixa', icon: '💰' },
  { id: 'desdobramentos', label: 'Desdobramentos & Loterias', icon: '🎯' },
  { id: 'rules', label: 'Regulamento & Normas', icon: '📜' },
  { id: 'calendar', label: 'Agenda & Calendário', icon: '📅' },
  { id: 'chat', label: 'Chat do Grupo', icon: '💬' },
  { id: 'whatsapp', label: 'WhatsApp Hub', icon: '📢' },
  { id: 'system', label: 'Administração & Sistema', icon: '⚙️' },
];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Apostas & Jogos
  {
    key: 'games_view',
    category: 'games',
    label: 'Visualizar Apostas Cadastradas',
    description: 'Permite visualizar os jogos do dia, futuros e histórico do bolão.'
  },
  {
    key: 'games_create',
    category: 'games',
    label: 'Cadastrar Novas Apostas',
    description: 'Permite cadastrar bilhetes manualmente ou enviando fotos de comprovantes (OCR).'
  },
  {
    key: 'games_edit',
    category: 'games',
    label: 'Editar Apostas Cadastradas',
    description: 'Permite editar dados de jogos já salvos no bolão.'
  },
  {
    key: 'games_delete',
    category: 'games',
    label: 'Excluir Apostas do Bolão',
    description: 'Permite apagar bilhetes individuais ou concursos inteiros do bolão.'
  },
  {
    key: 'games_official_result_edit',
    category: 'games',
    label: 'Informar / Corrigir Resultado Oficial',
    description: 'Permite corrigir ou forçar manualmente as dezenas do concurso da Caixa.'
  },

  // Participantes & Membros
  {
    key: 'members_view',
    category: 'members',
    label: 'Visualizar Lista de Participantes',
    description: 'Permite consultar os cotistas, telefones e contatos do bolão.'
  },
  {
    key: 'members_create',
    category: 'members',
    label: 'Adicionar Novos Participantes',
    description: 'Permite cadastrar novos membros no grupo.'
  },
  {
    key: 'members_edit',
    category: 'members',
    label: 'Editar Participantes',
    description: 'Permite alterar nome, telefone, cotas e notas dos participantes.'
  },
  {
    key: 'members_change_role',
    category: 'members',
    label: 'Promover / Alterar Papel (Conselheiro)',
    description: 'Permite definir quem é Conselheiro ou Participante.'
  },
  {
    key: 'members_delete',
    category: 'members',
    label: 'Excluir Participantes',
    description: 'Permite remover participantes do grupo do bolão.'
  },
  {
    key: 'members_toggle_payment',
    category: 'members',
    label: 'Alterar Status de Pagamento (Pago / Pendente)',
    description: 'Permite confirmar e dar baixa em pagamentos de cotas.'
  },
  {
    key: 'members_approve_quota',
    category: 'members',
    label: 'Aprovar Pedidos de Alteração de Cotas',
    description: 'Permite aprovar solicitações de aumento ou redução de cotas.'
  },
  {
    key: 'members_send_reminder',
    category: 'members',
    label: 'Enviar Cobrança / Lembrete no WhatsApp',
    description: 'Permite abrir o WhatsApp com mensagem pronta de cobrança da cota.'
  },

  // Financeiro & Caixa
  {
    key: 'finance_view_dashboard',
    category: 'finance',
    label: 'Visualizar Painel Financeiro e Caixa',
    description: 'Permite ver o resumo financeiro, saldo arrecadado e prêmios.'
  },
  {
    key: 'finance_view_detailed_report',
    category: 'finance',
    label: 'Visualizar Relatório de Auditoria Detalhado',
    description: 'Permite acessar extratos detalhados de despesas e arrecadação.'
  },
  {
    key: 'finance_manage_payments',
    category: 'finance',
    label: 'Auditar Comprovantes e Lançar Pagamentos',
    description: 'Permite registrar novos aportes e validar comprovantes PIX.'
  },
  {
    key: 'finance_export_print',
    category: 'finance',
    label: 'Imprimir e Exportar Relatórios (PDF / CSV)',
    description: 'Permite imprimir e exportar relatórios contábeis.'
  },

  // Desdobramentos
  {
    key: 'desdobramentos_generate',
    category: 'desdobramentos',
    label: 'Gerar e Simular Desdobramentos',
    description: 'Permite criar fechamentos matemáticos para teste próprio.'
  },
  {
    key: 'desdobramentos_save_to_pool',
    category: 'desdobramentos',
    label: 'Salvar Jogos de Desdobramento no Bolão',
    description: 'Permite registrar jogos gerados diretamente na conta oficial do bolão.'
  },

  // Regras
  {
    key: 'rules_view',
    category: 'rules',
    label: 'Visualizar Regras e Regulamento',
    description: 'Permite ler as normas e regulamento do bolão.'
  },
  {
    key: 'rules_edit',
    category: 'rules',
    label: 'Editar Regras e Normas do Bolão',
    description: 'Permite alterar o texto oficial do regulamento.'
  },

  // Agenda
  {
    key: 'calendar_view',
    category: 'calendar',
    label: 'Visualizar Calendário de Sorteios e Eventos',
    description: 'Permite consultar a agenda de sorteios da Caixa e eventos do grupo.'
  },
  {
    key: 'calendar_manage_events',
    category: 'calendar',
    label: 'Criar e Excluir Eventos na Agenda',
    description: 'Permite agendar novos prazos, reuniões e assembleias.'
  },

  // Chat
  {
    key: 'chat_view',
    category: 'chat',
    label: 'Acessar e Ler Chat do Grupo',
    description: 'Permite abrir o bate-papo e ler conversas do grupo.'
  },
  {
    key: 'chat_send',
    category: 'chat',
    label: 'Enviar Mensagens e Fotos no Chat',
    description: 'Permite postar mensagens, dúvidas e fotos no chat.'
  },
  {
    key: 'chat_moderate',
    category: 'chat',
    label: 'Moderar e Trancar / Destrancar Chat',
    description: 'Permite trancar o chat para manter a ordem e apagar mensagens.'
  },

  // WhatsApp Hub
  {
    key: 'whatsapp_view',
    category: 'whatsapp',
    label: 'Acessar a Central WhatsApp Hub',
    description: 'Permite abrir a página do WhatsApp Hub.'
  },
  {
    key: 'whatsapp_broadcast',
    category: 'whatsapp',
    label: 'Disparar Comunicados em Massa',
    description: 'Permite gerar e enviar informativos do bolão para os contatos.'
  },

  // Sistema
  {
    key: 'system_manage_pools',
    category: 'system',
    label: 'Criar e Gerenciar Bolões',
    description: 'Permite criar novos bolões, alterar loterias e editar regras de cota.'
  },
  {
    key: 'system_backup_restore',
    category: 'system',
    label: 'Backup, Restauração e Limpeza de Dados',
    description: 'Permite exportar backup JSON, restaurar banco e resetar dados.'
  },
  {
    key: 'system_manage_permissions',
    category: 'system',
    label: 'Gerenciar Matriz de Permissões',
    description: 'Exclusivo do Gestor: define o que cada perfil pode fazer.'
  }
];

export type RolePermissions = Record<PermissionKey, boolean>;

export interface RolePermissionsMatrix {
  counselor: RolePermissions;
  participant: RolePermissions;
}

// Padrões seguros e recomendados
export const DEFAULT_COUNSELOR_PERMISSIONS: RolePermissions = {
  // Apostas & Jogos
  games_view: true,
  games_create: false,
  games_edit: false,
  games_delete: false,
  games_official_result_edit: true, // Conselheiro ajuda na conferência
  // Participantes & Membros
  members_view: true,
  members_create: false,
  members_edit: false,
  members_change_role: false,
  members_delete: false,
  members_toggle_payment: false,
  members_approve_quota: false,
  members_send_reminder: true, // Pode cobrar pelo WhatsApp
  // Financeiro & Caixa
  finance_view_dashboard: true,
  finance_view_detailed_report: true,
  finance_manage_payments: false,
  finance_export_print: true,
  // Desdobramentos
  desdobramentos_generate: true,
  desdobramentos_save_to_pool: false,
  // Regras
  rules_view: true,
  rules_edit: false,
  // Agenda
  calendar_view: true,
  calendar_manage_events: false,
  // Chat
  chat_view: true,
  chat_send: true,
  chat_moderate: true, // Conselheiro pode moderar chat
  // WhatsApp
  whatsapp_view: true,
  whatsapp_broadcast: false,
  // Sistema
  system_manage_pools: false,
  system_backup_restore: false,
  system_manage_permissions: false
};

export const DEFAULT_PARTICIPANT_PERMISSIONS: RolePermissions = {
  // Apostas & Jogos
  games_view: true,
  games_create: false,
  games_edit: false,
  games_delete: false,
  games_official_result_edit: false,
  // Participantes & Membros
  members_view: true,
  members_create: false,
  members_edit: false,
  members_change_role: false,
  members_delete: false,
  members_toggle_payment: false,
  members_approve_quota: false,
  members_send_reminder: false,
  // Financeiro & Caixa
  finance_view_dashboard: true,
  finance_view_detailed_report: false,
  finance_manage_payments: false,
  finance_export_print: false,
  // Desdobramentos
  desdobramentos_generate: true, // Pode gerar para si mesmo
  desdobramentos_save_to_pool: false, // Não salva no bolão do grupo
  // Regras
  rules_view: true,
  rules_edit: false,
  // Agenda
  calendar_view: true,
  calendar_manage_events: false,
  // Chat
  chat_view: true,
  chat_send: true,
  chat_moderate: false,
  // WhatsApp
  whatsapp_view: false,
  whatsapp_broadcast: false,
  // Sistema
  system_manage_pools: false,
  system_backup_restore: false,
  system_manage_permissions: false
};

export const DEFAULT_PERMISSIONS_MATRIX: RolePermissionsMatrix = {
  counselor: DEFAULT_COUNSELOR_PERMISSIONS,
  participant: DEFAULT_PARTICIPANT_PERMISSIONS
};
