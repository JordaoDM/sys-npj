const express = require('express');
const models = require('../models/indexModel');
const { processoModel, usuarioModel, agendamentoModel, arquivoModel } = models;
const Processo = processoModel;
const Usuario = usuarioModel;
const Agendamento = agendamentoModel;
const Arquivo = arquivoModel;
const authMiddleware = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

const router = express.Router();

router.use(authMiddleware);

function getUserRole(user) {
  if (user.role_id === 1) return 'Admin';
  if (user.role_id === 2) return 'Professor';
  if (user.role_id === 3) return 'Aluno';
  return 'Usuário';
}

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = getUserRole(req.user);
    
    if (!Processo || !Usuario) {
      return res.status(500).json({ erro: 'Modelos não disponíveis' });
    }

    let dashboardData = {};

    if (userRole === 'Aluno') {
      const processosDoAluno = await Processo.findAll({
        include: [{
          model: models.usuarioProcessoModel,
          as: 'usuariosProcesso',
          where: { usuario_id: userId },
          required: true
        }],
        attributes: ['id', 'status', 'numero_processo', 'titulo', 'criado_em']
      });

      const processosCount = processosDoAluno.length;
      const processosPorStatus = {};
      
      processosDoAluno.forEach(processo => {
        const status = processo.status || 'Sem status';
        processosPorStatus[status] = (processosPorStatus[status] || 0) + 1;
      });

      let arquivosDoAluno = [];
      let totalArquivos = 0;
      if (Arquivo) {
        try {
          arquivosDoAluno = await Arquivo.findAll({
            where: { usuario_id: userId },
            attributes: ['id', 'nome', 'tipo', 'tamanho', 'criado_em']
          });
          totalArquivos = arquivosDoAluno.length;
        } catch (arquivoError) {
          console.warn('Erro ao buscar arquivos do aluno:', arquivoError.message);
        }
      }


      let agendamentosDoAluno = [];
      if (Agendamento) {
        try {
          agendamentosDoAluno = await Agendamento.findAll({
            where: { criado_por: userId },
            attributes: ['id', 'tipo', 'status', 'data_inicio', 'titulo']
          });
        } catch (agendError) {
          console.warn('Erro ao buscar agendamentos do aluno:', agendError.message);
        }
      }

      dashboardData = {
        processosTotal: processosCount,
        processosAtivos: processosDoAluno.filter(p => 
          !['Concluído', 'Finalizado', 'Arquivado'].includes(p.status)
        ).length,
        processosPorStatus,
        totalArquivos,
        arquivos: arquivosDoAluno,
        agendamentosTotal: agendamentosDoAluno.length,
        agendamentos: agendamentosDoAluno,
        processos: processosDoAluno,
        userRole: 'Aluno'
      };

    } else {
      const totalProcessos = await Processo.count() || 0;
      const totalUsuarios = await Usuario.count() || 0;
      
      const processosAtivos = await Processo.count({ 
        where: { 
          status: { 
            [Op.notIn]: ['Arquivado', 'Concluído', 'Finalizado'] 
          } 
        } 
      }) || 0;
      
      const usuariosAtivos = await Usuario.count({ where: { ativo: true } }) || 0;

      let totalArquivos = 0;
      if (Arquivo) {
        try {
          totalArquivos = await Arquivo.count() || 0;
        } catch (arquivoError) {
          console.warn('Erro ao buscar contagem de arquivos:', arquivoError.message);
        }
      }


      const processosPorStatusQuery = await Processo.findAll({
        attributes: [
          'status', 
          [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const processosPorStatus = {};
      processosPorStatusQuery.forEach(row => {
        processosPorStatus[row.status || 'Sem status'] = parseInt(row.count) || 0;
      });

      const usuariosPorTipoQuery = await Usuario.findAll({
        attributes: [
          'role_id', 
          [require('sequelize').fn('COUNT', require('sequelize').col('role_id')), 'count']
        ],
        group: ['role_id'],
        raw: true
      });

      const usuariosPorTipo = { admin: 0, professor: 0, aluno: 0 };
      usuariosPorTipoQuery.forEach(row => {
        if (row.role_id === 1) usuariosPorTipo.admin = parseInt(row.count) || 0;
        else if (row.role_id === 2) usuariosPorTipo.professor = parseInt(row.count) || 0;
        else if (row.role_id === 3) usuariosPorTipo.aluno = parseInt(row.count) || 0;
      });

      let agendamentosData = { total: 0, porTipo: {}, porStatus: {} };
      if (Agendamento) {
        try {
          const totalAgendamentos = await Agendamento.count() || 0;
          
          const agendamentosPorTipo = await Agendamento.findAll({
            attributes: [
              'tipo', 
              [require('sequelize').fn('COUNT', require('sequelize').col('tipo')), 'count']
            ],
            group: ['tipo'],
            raw: true
          });

          const agendamentosPorStatus = await Agendamento.findAll({
            attributes: [
              'status', 
              [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
            ],
            group: ['status'],
            raw: true
          });

          agendamentosData.total = totalAgendamentos;
          
          agendamentosPorTipo.forEach(row => {
            agendamentosData.porTipo[row.tipo || 'outro'] = parseInt(row.count) || 0;
          });

          agendamentosPorStatus.forEach(row => {
            agendamentosData.porStatus[row.status || 'agendado'] = parseInt(row.count) || 0;
          });

        } catch (agendError) {
          console.warn('Erro ao buscar dados de agendamentos:', agendError.message);
        }
      }

      dashboardData = {
        processosTotal: totalProcessos,
        processosAtivos,
        processosPorStatus,
        totalUsuarios,
        usuariosAtivos,
        usuariosPorTipo,
        totalArquivos,
        agendamentosTotal: agendamentosData.total,
        agendamentosPorTipo: agendamentosData.porTipo,
        agendamentosPorStatus: agendamentosData.porStatus,
        userRole: userRole,
        estatisticas: {
          taxaProcessosAtivos: totalProcessos > 0 ? 
            ((processosAtivos / totalProcessos) * 100).toFixed(1) + '%' : '0%',
          taxaUsuariosAtivos: totalUsuarios > 0 ? 
            ((usuariosAtivos / totalUsuarios) * 100).toFixed(1) + '%' : '0%'
        }
      };
    }

    dashboardData.ultimaAtualizacao = new Date().toISOString();
    
    res.json(dashboardData);
  } catch (error) {
    console.error(' Erro no dashboard principal:', error);
    res.status(500).json({ 
      erro: 'Erro interno do servidor', 
      detalhes: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    let totalProcessos = 0;
    let processosAtivos = 0;
    let statusMap = { em_andamento: 0, aguardando: 0, finalizado: 0, arquivado: 0, suspenso: 0, outros: 0 };
    
    try {
      totalProcessos = await Processo.count() || 0;
      processosAtivos = await Processo.count({ 
        where: { 
          status: { 
            [Op.notIn]: ['arquivado', 'Concluído', 'concluído', 'Finalizado', 'finalizado'] 
          } 
        } 
      }) || 0;
      
      const processosPorStatus = await Processo.findAll({
        attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']],
        group: ['status'],
        raw: true
      });
      
      const normalize = s => s && s.normalize('NFD').replace(/[^\w\s]/g, '').toLowerCase();
      
      if (processosPorStatus && Array.isArray(processosPorStatus)) {
        processosPorStatus.forEach(row => {
          if (row && typeof row === 'object') {
            const raw = row.status || '';
            const n = normalize(raw);
            const count = parseInt(row.count) || 0;
            
            if (n.includes('andamento')) statusMap.em_andamento += count;
            else if (n.includes('aguard')) statusMap.aguardando += count;
            else if (n.includes('finaliz') || n.includes('conclu')) statusMap.finalizado += count;
            else if (n.includes('arquiv')) statusMap.arquivado += count;
            else if (n.includes('suspen')) statusMap.suspenso += count;
            else statusMap.outros += count;
          }
        });
      }
    } catch (processError) {
      console.error('Erro ao buscar dados de processos:', processError);
    }

    let totalUsuarios = 0;
    let usuariosAtivos = 0;
    let usuariosPorTipo = { aluno: 0, professor: 0, admin: 0, outros: 0 };
    
    try {
      totalUsuarios = await Usuario.count() || 0;
      usuariosAtivos = await Usuario.count({ where: { ativo: true } }) || 0;
      const usuarios = await Usuario.findAll({ attributes: ['role_id'], raw: true });
      
      if (usuarios && Array.isArray(usuarios)) {
        usuarios.forEach(u => {
          if (u && typeof u === 'object') {
            if (u.role_id === 1) usuariosPorTipo.admin++;
            else if (u.role_id === 2) usuariosPorTipo.professor++;
            else if (u.role_id === 3) usuariosPorTipo.aluno++;
            else usuariosPorTipo.outros++;
          }
        });
      }
    } catch (userError) {
      console.error('Erro ao buscar dados de usuários:', userError);
    }

    res.json({
      totalProcessos,
      processosAtivos,
      processosPorStatus: statusMap,
      totalUsuarios,
      usuariosAtivos,
      usuariosPorTipo
    });
  } catch (error) {
    console.error('Erro no dashboard/stats:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

router.get('/status-detalhado', async (req, res) => {
  try {
    const stats = {
      servidor: {
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      banco: {
        status: 'conectado',
        disponivel: global.dbAvailable || false
      },
      sistema: {
        versao: '1.0.0',
        ambiente: process.env.NODE_ENV || 'development'
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro no status-detalhado:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;
