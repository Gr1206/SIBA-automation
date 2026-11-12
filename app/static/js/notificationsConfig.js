export const NOTIFICATION_TEMPLATES = {
  MISSING_NIF: {
    title: "NIF em Falta",
    description: "Adicione o seu NIF de faturação para emitir boletins.",
    severity: "warning", // warning | error | info
    actionUrl: "/profile",
    actionText: "Configurar Perfil"
  },
  MISSING_SIBA_CODE: {
    title: "Código de Estabelecimento SIBA",
    description: "O código da sua unidade no SEF/SIBA não está preenchido.",
    severity: "warning",
    actionUrl: "/profile",
    actionText: "Adicionar Código"
  },
  MISSING_SIBA_KEY: {
    title: "Chave de Autenticação SIBA",
    description: "Insira a chave Web Service para permitir o envio automático.",
    severity: "importante",
    actionUrl: "/profile",
    actionText: "Registar Chave"
  },
  MISSING_PROPERTY_INFO: {
    title: "Informações da Propriedade em Falta",
    description: "Complete os detalhes da sua propriedade para uma melhor gestão.",
    severity: "warning",
    actionUrl: "/profile",
    actionText: "Atualizar Informações"
  },
  PENDING_RESERVATIONS: {
    title: "Reservas Pendentes",
    description: "Existem reservas que ainda não foram enviadas para o SIBA.",
    severity: "warning",
    actionUrl: "/dashboard",
    actionText: "Ver Reservas"
  },
  ERROR_RESERVATIONS: {
    title: "Erros nas Reservas",
    description: "Algumas reservas apresentaram erros durante o envio para o SIBA.",
    severity: "importante",
    actionUrl: "/dashboard",
    actionText: "Corrigir Erro De Formulário"
  },
  // Template de fallback se aparecer um código desconhecido
  DEFAULT: {
    title: "Aviso do Sistema",
    description: "Verifique as configurações pendentes da sua conta.",
    severity: "info",
    actionUrl: "/profile",
    actionText: "Ver Perfil"
  }
};

export const SEVERITY_STYLES = {
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    badge: "text-amber-700 bg-amber-100",
    btn: "text-amber-700 hover:text-amber-900"
  },
  importante: {
    container: "bg-rose-50 border-rose-200 text-rose-800",
    badge: "text-rose-700 bg-rose-100",
    btn: "text-rose-700 hover:text-rose-900"
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    badge: "text-blue-700 bg-blue-100",
    btn: "text-blue-700 hover:text-blue-900"
  }
};