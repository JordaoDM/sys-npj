
export const getUserRole = (user) => {
 return user?.role || null;
};

export const hasRole = (user, roles) => {
 const userRole = getUserRole(user);
 if (!userRole) return false;
 
 const allowedRoles = Array.isArray(roles) ? roles : [roles];
 return allowedRoles.includes(userRole);
};

export const isAdmin = (user) => hasRole(user, 'Admin');

export const isProfessor = (user) => hasRole(user, 'Professor');

export const isAluno = (user) => hasRole(user, 'Aluno');

export const canCreateProcess = (user) => hasRole(user, ['Admin', 'Professor']);

export const canManageUsers = (user) => hasRole(user, ['Admin', 'Professor']);

export const formatDate = (date) => {
 if (!date) return "-";
 try {
 return new Date(date).toLocaleDateString('pt-BR');
 } catch (error) {
 return "-";
 }
};

export const formatDateTime = (date) => {
 if (!date) return "-";
 try {
 return new Date(date).toLocaleString('pt-BR');
 } catch (error) {
 return "-";
 }
};

export const formatValue = (value) => {
 if (value === null || value === undefined || value === '') return '-';

 if (typeof value === 'number') {
 return new Intl.NumberFormat('pt-BR').format(value);
 }

 if (value instanceof Date) {
 return value.toLocaleString('pt-BR');
 }

 if (typeof value === 'string') {
 const trimmed = value.trim();
 if (!trimmed) return '-';
 return trimmed;
 }

 if (typeof value === 'object') {
 if (value.nome) return value.nome;
 if (value.name) return value.name;
 if (value.titulo) return value.titulo;
 if (value.title) return value.title;
 if (value.descricao) return value.descricao;
 if (value.description) return value.description;
 return JSON.stringify(value);
 }

 return String(value);
};

export const normalizeBrazilianText = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value !== "string") return String(value);

  const trimmed = value.trim();
  if (!trimmed || !/[ÃÂâð]/.test(trimmed)) return trimmed;

  try {
    const bytes = Uint8Array.from(trimmed, (character) =>
      character.charCodeAt(0),
    );
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return decoded.includes("�") ? trimmed : decoded;
  } catch {
    return trimmed;
  }
};

export const formatDateTimeForInput = (date) => {
 if (!date) return '';
 try {
 const d = new Date(date);
 const offset = d.getTimezoneOffset();
 d.setMinutes(d.getMinutes() - offset);
 return d.toISOString().slice(0, 16);
 } catch (error) {
 return '';
 }
};

export const renderValue = (value) => {
 if (value === null || value === undefined || value === '') {
 return "-";
 }

 if (typeof value === 'object') {
 if (value.nome) return value.nome;
 if (value.name) return value.name;
 if (value.titulo) return value.titulo;
 if (value.title) return value.title;
 if (value.descricao) return value.descricao;
 if (value.description) return value.description;

 if (value.id && (value.nome || value.name)) {
 return value.nome || value.name;
 }

 return JSON.stringify(value);
 }

 return formatValue(value);
};

export const buttonStyles = {
 blueWhite: {
 padding: '10px 20px',
 backgroundColor: '#007bff',
 color: 'white',
 border: '1px solid #007bff',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: '0 2px 4px rgba(0, 123, 255, 0.15)',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
 primary: {
 padding: '10px 20px',
 backgroundColor: '#007bff',
 color: 'white',
 border: 'none',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
 success: {
 padding: '10px 20px',
 backgroundColor: '#28a745',
 color: 'white',
 border: 'none',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
 danger: {
 padding: '10px 20px',
 backgroundColor: '#dc3545',
 color: 'white',
 border: 'none',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
 secondary: {
 padding: '10px 20px',
 backgroundColor: '#6c757d',
 color: 'white',
 border: 'none',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: '0 2px 4px rgba(108, 117, 125, 0.2)',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
 outline: {
 padding: '10px 20px',
 backgroundColor: 'transparent',
 color: '#007bff',
 border: '1px solid #007bff',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: 'none',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
 light: {
 padding: '10px 20px',
 backgroundColor: '#f8f9fa',
 color: '#212529',
 border: '1px solid #dee2e6',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
 link: {
 padding: '0',
 backgroundColor: 'transparent',
 color: '#007bff',
 border: 'none',
 borderRadius: '0',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'color 0.2s ease',
 boxShadow: 'none',
 textDecoration: 'underline',
 minHeight: 'auto',
 display: 'inline',
 alignItems: 'center',
 justifyContent: 'center'
 },
 blueWhite: {
 padding: '10px 20px',
 backgroundColor: '#007bff',
 color: 'white',
 border: '1px solid #007bff',
 borderRadius: '6px',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '500',
 transition: 'all 0.2s ease',
 boxShadow: '0 2px 4px rgba(0, 123, 255, 0.15)',
 minHeight: '38px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center'
 },
};

export const getStatusLabel = (status) => {
 if (status === null || status === undefined || status === '') return 'Desconhecido';

 const raw = String(status).trim();
 if (!raw) return 'Desconhecido';

 const normalized = raw
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .replace(/[^a-z0-9]+/g, '_')
 .replace(/^_|_$/g, '');

 const labels = {
 aberto: 'Aberto',
 em_andamento: 'Em andamento',
 andamento: 'Em andamento',
 aguardando: 'Aguardando',
 pendente: 'Pendente',
 finalizado: 'Finalizado',
 concluido: 'Concluído',
 concluido_ou_concluido: 'Concluído',
 arquivado: 'Arquivado',
 suspenso: 'Suspenso',
 fechado: 'Fechado',
 cancelado: 'Cancelado',
 cancelado_ou_canceled: 'Cancelado',
 em_analise: 'Em análise',
 aprovado: 'Aprovado',
 recusado: 'Recusado',
 confirmado: 'Confirmado',
 agendado: 'Agendado',
 marcado: 'Agendado',
 enviando_convites: 'Enviando convites',
 processando: 'Processando',
 desconhecido: 'Desconhecido'
 };

 return labels[normalized] || raw;
};

export const getStatusDescription = (status) => {
 switch (getStatusLabel(status)) {
 case 'Em andamento':
 return 'Processo em andamento';
 case 'Aguardando':
 return 'Aguardando atualização ou resposta';
 case 'Pendente':
 return 'Aguardando ação';
 case 'Finalizado':
 return 'Processo finalizado';
 case 'Concluído':
 return 'Concluído com sucesso';
 case 'Arquivado':
 return 'Processo arquivado';
 case 'Suspenso':
 return 'Processo suspenso';
 case 'Cancelado':
 return 'Processo cancelado';
 case 'Em análise':
 return 'Aguardando análise';
 case 'Aprovado':
 return 'Aprovado com sucesso';
 case 'Recusado':
 return 'Recusado';
 case 'Confirmado':
 return 'Confirmado';
 case 'Agendado':
 return 'Agendado';
 case 'Enviando convites':
 return 'Enviando convites';
 default:
 return 'Status não identificado';
 }
};

export const getStatusColor = (status) => {
 const statusText = getStatusLabel(status);
 switch (statusText) {
 case 'Aberto':
 return { bg: '#d4edda', color: '#155724' };
 case 'Em andamento':
 return { bg: '#fff3cd', color: '#856404' };
 case 'Aguardando':
 case 'Pendente':
 return { bg: '#ffe5d0', color: '#9c2c00' };
 case 'Finalizado':
 case 'Concluído':
 case 'Aprovado':
 case 'Confirmado':
 case 'Agendado':
 return { bg: '#d4edda', color: '#155724' };
 case 'Cancelado':
 case 'Recusado':
 return { bg: '#f8d7da', color: '#721c24' };
 case 'Arquivado':
 case 'Suspenso':
 return { bg: '#e2e3e5', color: '#383d41' };
 default:
 return { bg: '#f8f9fa', color: '#6c757d' };
 }
};
