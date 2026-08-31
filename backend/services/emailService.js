const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');
const LogService = require('./logService');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../env/main.env'), quiet: true });


const smtpOptions = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true'
};

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpOptions.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };
}

const transporter = nodemailer.createTransport(smtpOptions);

function stripEmailEmojis(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[\p{Extended_Pictographic}\u2600-\u27BF\uFE0F\u200D]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function sanitizeEmailData(emailData) {
  return {
    ...emailData,
    subject: stripEmailEmojis(emailData.subject),
    html: stripEmailEmojis(emailData.html),
    text: stripEmailEmojis(emailData.text),
  };
}

const senderConfig = {
  fromEmail: process.env.EMAIL_FROM || 'noreply@npj.ufmt.br',
  fromName: 'NPJ - Sistema de Agendamentos'
};

async function enviarNotificacaoAprovacaoAgendamento(agendamento) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0066cc;"> Nova Solicitação de Agendamento</h2>
        <p><strong>Título:</strong> ${agendamento.titulo}</p>
        <p><strong>Descrição:</strong> ${agendamento.descricao || 'Não informado'}</p>
        <p><strong>Data/Hora:</strong> ${new Date(agendamento.data_inicio).toLocaleString('pt-BR')} - ${new Date(agendamento.data_fim).toLocaleString('pt-BR')}</p>
        <p><strong>Local:</strong> ${agendamento.local || 'Não informado'}</p>
        <p><strong>Solicitante:</strong> ${agendamento.usuario?.nome} (${agendamento.usuario?.email})</p>
        ${agendamento.processo ? `<p><strong>Processo:</strong> ${agendamento.processo.numero_processo} - ${agendamento.processo.titulo}</p>` : ''}
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc;">
          <p><strong>Ação Necessária:</strong> Este agendamento precisa ser aprovado ou recusado por um responsável (Admin/Professor).</p>
        </div>
        
        <p>Acesse o sistema para tomar uma decisão sobre esta solicitação.</p>
      </div>
    `;
    
    const { usuarioModel: Usuario } = require('../models/indexModel');
    const { roleModel: Role } = require('../models/indexModel');
    const responsaveis = await Usuario.findAll({
      include: [{
        model: Role,
        as: 'role',
        where: { nome: ['Admin', 'Professor'] }
      }]
    });
    
    for (const responsavel of responsaveis) {
      await enviarEmail({
        to: [{ email: responsavel.email, name: responsavel.nome }],
        subject: `Nova Solicitação de Agendamento - ${agendamento.titulo}`,
        html
      });
    }
    
    console.log(' Notificação de aprovação enviada para responsáveis');
  } catch (error) {
    console.error(' Erro ao enviar notificação de aprovação:', error);
  }
}

async function enviarNotificacaoRecusaAgendamento(agendamento, motivoRecusa) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #dc3545;"> Agendamento Recusado</h2>
        <p><strong>Título:</strong> ${agendamento.titulo}</p>
        <p><strong>Data/Hora:</strong> ${new Date(agendamento.data_inicio).toLocaleString('pt-BR')} - ${new Date(agendamento.data_fim).toLocaleString('pt-BR')}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545;">
          <h3 style="color: #721c24; margin-top: 0;">Motivo da Recusa:</h3>
          <p style="margin-bottom: 0;">${motivoRecusa}</p>
        </div>
        
        <p>Você pode criar uma nova solicitação de agendamento considerando as observações acima.</p>
      </div>
    `;
    
    await enviarEmail({
      to: [{ email: agendamento.usuario.email, name: agendamento.usuario.nome }],
      subject: `Agendamento Recusado - ${agendamento.titulo}`,
      html
    });
    
    console.log(' Notificação de recusa enviada para solicitante');
  } catch (error) {
    console.error(' Erro ao enviar notificação de recusa:', error);
  }
}

async function enviarViaSMTP(emailData) {
  try {
    emailData = sanitizeEmailData(emailData);
    const info = await transporter.sendMail({
      from: `"${senderConfig.fromName}" <${senderConfig.fromEmail}>`,
      to: emailData.to.map(r => r.email).join(', '),
      subject: emailData.subject,
      html: emailData.html
    });
    console.log(` Email enviado via SMTP (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error(' Erro ao enviar via SMTP:', error.message);
    throw error;
  }
}

async function enviarEmail(emailData) {
  if (!emailConfig.podeEnviarEmail()) {
    emailConfig.logEmailDesabilitado(
      'geral', 
      emailData.to?.[0]?.email || 'destinatario_desconhecido',
      emailData.subject
    );
    const error = new Error('Envio de e-mail desabilitado');
    error.code = 'EMAIL_DISABLED';
    throw error;
  }

  try {
    return await enviarViaSMTP(emailData);
  } catch (error) {
    throw error;
  }
}

async function enviarConviteAgendamento(agendamento, emailConvidado, nomeConvidado) {
  try {
    const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!emailConvidado) {
      throw new Error('Email do convidado não informado');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const urlAceitar = `${baseUrl}/convite/${agendamento.id}/aceitar?email=${encodeURIComponent(emailConvidado)}`;
    const urlRecusar = `${baseUrl}/convite/${agendamento.id}/recusar?email=${encodeURIComponent(emailConvidado)}`;

    const emailData = {
      to: [{ email: emailConvidado, name: nomeConvidado || 'Convidado' }],
      subject: `Convite para Agendamento - ${agendamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;"> Convite para Agendamento</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${nomeConvidado || 'Convidado'}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 30px;">Você foi convidado para o seguinte agendamento:</p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #007bff;">
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 10px;"></span>
                  <span><strong>Título:</strong> ${agendamento.titulo}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 10px;"></span>
                  <span><strong>Data e Hora:</strong> ${dataFormatada}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 10px;"></span>
                  <span><strong>Local:</strong> ${agendamento.local || 'Não informado'}</span>
                </div>
                ${agendamento.descricao ? `
                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 10px;"></span>
                  <span><strong>Descrição:</strong> ${agendamento.descricao}</span>
                </div>
                ` : ''}
              </div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                <strong>Por favor, confirme sua participação:</strong>
              </p>
              
              <div style="display: inline-block; margin: 0 10px;">
                <a href="${urlAceitar}" 
                   style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; margin: 0 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.3s;">
                   Aceitar Convite
                </a>
              </div>
              
              <div style="display: inline-block; margin: 0 10px;">
                <a href="${urlRecusar}" 
                   style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; margin: 0 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.3s;">
                   Recusar Convite
                </a>
              </div>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 20px; margin-right: 10px;"></span>
                <strong style="color: #856404;">ATENÇÃO - PRAZO DE RESPOSTA</strong>
              </div>
              <p style="margin: 0; color: #856404; font-size: 14px;">
                Este convite tem <strong>validade de 24 horas</strong>. Após esse período, o link expirará.<br/>
                <strong>Se você não responder em até 24 horas, consideraremos como aceito automaticamente</strong> 
                e o agendamento será confirmado.
              </p>
            </div>

            <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin-top: 30px;">
              <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
                <strong>Importante:</strong> Este convite é válido até a data do agendamento. 
                Caso não consiga abrir os links, copie e cole a URL no seu navegador.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666;">
                Atenciosamente,<br>
                <strong style="color: #007bff;">Equipe NPJ</strong>
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await enviarEmail(emailData);
    console.log(` Convite enviado para ${emailConvidado} via ${result.provider}`);
    return result;
  } catch (error) {
    console.error(' Erro ao enviar convite:', error);
    throw error;
  }
}

async function enviarLembreteAgendamento(agendamento, emailParticipante, nomeParticipante) {
  try {
    const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tempoRestante = Math.round((new Date(agendamento.data_inicio) - new Date()) / (1000 * 60 * 60));

    if (!emailParticipante) {
      throw new Error('Email do participante não informado');
    }
    const emailData = {
      to: [{ email: emailParticipante, name: nomeParticipante || 'Participante' }],
      subject: ` Lembrete: ${agendamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e74c3c;"> Lembrete de Agendamento</h1>
          <p>Olá <strong>${nomeParticipante || 'Participante'}</strong>,</p>
          <p>Este é um lembrete sobre seu próximo agendamento:</p>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong> Título:</strong> ${agendamento.titulo}</li>
              <li style="margin: 10px 0;"><strong> Data e Hora:</strong> ${dataFormatada}</li>
              <li style="margin: 10px 0;"><strong> Local:</strong> ${agendamento.local || 'Não informado'}</li>
              <li style="margin: 10px 0;"><strong> Descrição:</strong> ${agendamento.descricao || 'Não informada'}</li>
              ${tempoRestante > 0 ? `<li style="margin: 10px 0;"><strong> Tempo restante:</strong> Aproximadamente ${tempoRestante} hora(s)</li>` : ''}
            </ul>
          </div>
          <p style="color: #e74c3c;"><strong> Não se esqueça!</strong></p>
          <p>Atenciosamente,<br><strong>Equipe NPJ</strong></p>
        </div>
      `
    };

    const result = await enviarEmail(emailData);
    console.log(` Lembrete enviado para ${emailParticipante} via ${result.provider}`);
    return result;
  } catch (error) {
    console.error(' Erro ao enviar lembrete:', error);
    throw error;
  }
}

async function enviarNotificacaoRejeicaoAdmin(agendamento, emailsAdmins, rejeicoes) {
  try {
    if (!emailsAdmins || emailsAdmins.length === 0) {
      console.log(' Nenhum email de admin fornecido para notificação de rejeição');
      return;
    }

    const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const listaRejeicoes = rejeicoes.map(r => `
      <div style="background-color: #ffebee; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f44336;">
        <strong> ${r.email}</strong><br/>
        <strong>Justificativa:</strong> ${r.justificativa || 'Não informada'}<br/>
        <small style="color: #666;">Respondido em: ${new Date(r.data_resposta).toLocaleString('pt-BR')}</small>
      </div>
    `).join('');

    const emailData = {
      to: emailsAdmins.map(email => ({ email, name: 'Admin/Professor' })),
      subject: ` Rejeições de Convite - ${agendamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;"> Rejeições de Convite</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Caro Admin/Professor,</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              O agendamento abaixo recebeu ${rejeicoes.length} rejeição(ões) de convite que requer(em) sua ação:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #007bff;">
              <h3 style="margin: 0 0 15px 0; color: #007bff;"> Detalhes do Agendamento</h3>
              <p><strong>Título:</strong> ${agendamento.titulo}</p>
              <p><strong>Data:</strong> ${dataFormatada}</p>
              <p><strong>Local:</strong> ${agendamento.local || 'Não informado'}</p>
              ${agendamento.descricao ? `<p><strong>Descrição:</strong> ${agendamento.descricao}</p>` : ''}
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #f44336; margin-bottom: 15px;"> Convites Rejeitados:</h3>
              ${listaRejeicoes}
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 15px 0; color: #856404;"> Ações Disponíveis:</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Remover o(s) convidado(s) que rejeitaram e manter o agendamento</li>
                <li>Cancelar o agendamento completamente</li>
                <li>Reagendar para nova data/hora</li>
                <li>Prosseguir com o agendamento mesmo com as rejeições</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #666;">
                Acesse o sistema para tomar as ações necessárias.
              </p>
            </div>

            <p>Atenciosamente,<br><strong>Sistema NPJ</strong></p>
          </div>
        </div>
      `
    };

    const result = await enviarEmail(emailData);
    console.log(` Notificação de rejeição enviada para admins via ${result.provider}`);
    return result;
  } catch (error) {
    console.error(' Erro ao enviar notificação de rejeição:', error);
    throw error;
  }
}

async function enviarNotificacaoCancelamento(agendamento, emailsConvidados) {
  try {
    if (!emailsConvidados || emailsConvidados.length === 0) {
      console.log(' Nenhum convidado para notificar sobre cancelamento');
      return;
    }

    const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric', 
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailData = {
      to: emailsConvidados.map(email => ({ email, name: 'Convidado' })),
      subject: ` Agendamento Cancelado - ${agendamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;"> Agendamento Cancelado</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Caro convidado,</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Informamos que o agendamento abaixo foi <strong>cancelado</strong>:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6c757d;">
              <p><strong> Título:</strong> ${agendamento.titulo}</p>
              <p><strong> Data:</strong> ${dataFormatada}</p>
              <p><strong> Local:</strong> ${agendamento.local || 'Não informado'}</p>
              ${agendamento.descricao ? `<p><strong> Descrição:</strong> ${agendamento.descricao}</p>` : ''}
            </div>

            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="margin: 0; color: #721c24; text-align: center;">
                <strong>Este agendamento não acontecerá mais.</strong><br/>
                Não é necessária nenhuma ação da sua parte.
              </p>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center;">
              Em caso de dúvidas, entre em contato conosco.
            </p>

            <p>Atenciosamente,<br><strong>Equipe NPJ</strong></p>
          </div>
        </div>
      `
    };

    const result = await enviarEmail(emailData);
    console.log(` Notificação de cancelamento enviada para ${emailsConvidados.length} convidado(s) via ${result.provider}`);
    return result;
  } catch (error) {
    console.error(' Erro ao enviar notificação de cancelamento:', error);
    throw error;
  }
}

async function enviarNotificacaoAgendamentoConfirmado(agendamento) {
  try {
    const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailsNotificar = [];
    
    if (agendamento.usuario && agendamento.usuario.email) {
      emailsNotificar.push({
        email: agendamento.usuario.email,
        nome: agendamento.usuario.nome
      });
    }
    
    if (agendamento.convidados && Array.isArray(agendamento.convidados)) {
      agendamento.convidados
        .filter(c => c.status === 'aceito')
        .forEach(c => emailsNotificar.push({
          email: c.email,
          nome: c.nome
        }));
    }

    const emailData = {
      to: emailsNotificar.map(e => ({ email: e.email, name: e.nome || 'Participante' })),
      subject: ` Agendamento Confirmado - ${agendamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;"> Agendamento Confirmado!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Ótima notícia!</p>
            <p style="font-size: 16px; margin-bottom: 30px;">Todos os convidados responderam e seu agendamento foi <strong>confirmado automaticamente</strong>:</p>
            
            <div style="background-color: #d4edda; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
              <div style="display: grid; gap: 15px;">
                <div><strong> Título:</strong> ${agendamento.titulo}</div>
                <div><strong> Data e Hora:</strong> ${dataFormatada}</div>
                <div><strong> Local:</strong> ${agendamento.local || 'Não informado'}</div>
                ${agendamento.descricao ? `<div><strong> Descrição:</strong> ${agendamento.descricao}</div>` : ''}
              </div>
            </div>

            <div style="background-color: #cce5ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0066cc;"> Lembretes Automáticos</h3>
              <p style="margin: 0; font-size: 14px;">Você receberá:</p>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li><strong>Lembrete do dia</strong> na manhã do agendamento</li>
                <li><strong>Lembrete urgente</strong> 1 hora antes do início</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Não esqueça! Chegue no horário e local indicados.
            </p>
          </div>
        </div>
      `
    };

    return await enviarViaSMTP(emailData);
  } catch (error) {
    throw error;
  }
}

async function enviarNotificacaoCancelamentoAutomatico(agendamento) {
  try {
    const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailData = {
      to: [{ email: agendamento.usuario.email, name: agendamento.usuario.nome }],
      subject: ` Agendamento Cancelado Automaticamente - ${agendamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;"> Agendamento Cancelado</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${agendamento.usuario.nome}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 30px;">Infelizmente, seu agendamento foi <strong>cancelado automaticamente</strong> porque todos os convidados recusaram o convite:</p>
            
            <div style="background-color: #f8d7da; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc3545;">
              <div style="display: grid; gap: 15px;">
                <div><strong> Título:</strong> ${agendamento.titulo}</div>
                <div><strong> Data e Hora:</strong> ${dataFormatada}</div>
                <div><strong> Local:</strong> ${agendamento.local || 'Não informado'}</div>
              </div>
            </div>

            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px 0; color: #856404;"> O que você pode fazer:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Criar um novo agendamento com outros horários</li>
                <li>Entrar em contato diretamente com os participantes</li>
                <li>Reagendar para uma data mais conveniente</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Se precisar de ajuda, entre em contato com a administração.
            </p>
          </div>
        </div>
      `
    };

    return await enviarViaSMTP(emailData);
  } catch (error) {
    throw error;
  }
}

async function enviarNotificacaoSituacaoMista(agendamento) {
  try {
    const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const convidados = agendamento.convidados || [];
    const aceites = convidados.filter(c => c.status === 'aceito');
    const recusas = convidados.filter(c => c.status === 'recusado');

    const Usuario = require('../models/usuarioModel');
    const admins = await Usuario.findAll({
      where: { role_id: { [require('sequelize').Op.in]: [1, 2] }, ativo: true },
      attributes: ['email', 'nome']
    });

    if (admins.length === 0) return;

    const emailData = {
      to: admins.map(admin => ({ email: admin.email, name: admin.nome })),
      subject: ` Ação Necessária: Agendamento com Respostas Mistas - ${agendamento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); color: #212529; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;"> Situação Mista em Agendamento</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Há uma situação que precisa de sua atenção:</p>
            <p style="font-size: 16px; margin-bottom: 30px;">O agendamento a seguir tem <strong>aceites e recusas simultaneamente</strong>:</p>
            
            <div style="background-color: #fff3cd; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
              <div style="display: grid; gap: 15px;">
                <div><strong> Título:</strong> ${agendamento.titulo}</div>
                <div><strong> Criador:</strong> ${agendamento.usuario.nome} (${agendamento.usuario.email})</div>
                <div><strong> Data e Hora:</strong> ${dataFormatada}</div>
                <div><strong> Local:</strong> ${agendamento.local || 'Não informado'}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
              <div style="background-color: #d4edda; padding: 15px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #155724;"> Aceitaram (${aceites.length})</h4>
                ${aceites.map(c => `<div style="font-size: 12px;">• ${c.nome || c.email}</div>`).join('')}
              </div>
              
              <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #721c24;"> Recusaram (${recusas.length})</h4>
                ${recusas.map(c => `<div style="font-size: 12px;">• ${c.nome || c.email}</div>`).join('')}
              </div>
            </div>

            <div style="background-color: #cce5ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0066cc;"> Ações Sugeridas:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Confirmar o agendamento apenas com quem aceitou</li>
                <li>Reagendar para incluir quem recusou</li>
                <li>Entrar em contato com o criador para decidir</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Este agendamento permanecerá como "pendente" até sua decisão.
            </p>
          </div>
        </div>
      `
    };

    return await enviarViaSMTP(emailData);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  enviarEmail,
  enviarConviteAgendamento,
  enviarLembreteAgendamento,
  enviarNotificacaoAprovacaoAgendamento,
  enviarNotificacaoRecusaAgendamento,
  enviarNotificacaoRejeicaoAdmin,
  enviarNotificacaoCancelamento,
  enviarNotificacaoAgendamentoConfirmado,
  enviarNotificacaoCancelamentoAutomatico,
  enviarNotificacaoSituacaoMista
};
