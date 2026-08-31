
const emailConfig = {
  emailsHabilitados: process.env.ENABLE_EMAILS !== 'false',
  
  logEmailsDesabilitados: process.env.LOG_DISABLED_EMAILS === 'true',
  
  ambiente: process.env.NODE_ENV || 'development',
  
  isProducao: () => {
    return process.env.NODE_ENV === 'production';
  },
  
  podeEnviarEmail: () => {
    if (process.env.ENABLE_EMAILS === 'false') {
      return false;
    }
    
    if (process.env.UNIVERSITY_TEST_MODE === 'true') {
      return process.env.ENABLE_EMAILS_IN_TEST === 'true';
    }
    
    return emailConfig.emailsHabilitados;
  },
  
  logEmailDesabilitado: (tipo, destinatario, assunto) => {
    if (emailConfig.logEmailsDesabilitados) {
      console.log(` [EMAIL DESABILITADO] Tipo: ${tipo} | Para: ${destinatario} | Assunto: ${assunto}`);
    }
  }
};

module.exports = emailConfig;
