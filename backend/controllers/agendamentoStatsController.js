
const { agendamentoModel: Agendamento } = require('../models/indexModel');
const { Op } = require('sequelize');

class AgendamentoStatsController {
  
  static async getStats(req, res) {
    try {
      const { id: usuario_id } = req.user;
      
      const statusStats = await Agendamento.findAll({
        attributes: [
          'status',
          [Agendamento.sequelize.fn('COUNT', Agendamento.sequelize.col('id')), 'count']
        ],
        where: {
          criado_por: usuario_id
        },
        group: ['status'],
        raw: true
      });
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyStats = await Agendamento.findAll({
        attributes: [
          [Agendamento.sequelize.fn('YEAR', Agendamento.sequelize.col('createdAt')), 'year'],
          [Agendamento.sequelize.fn('MONTH', Agendamento.sequelize.col('createdAt')), 'month'],
          [Agendamento.sequelize.fn('COUNT', Agendamento.sequelize.col('id')), 'count']
        ],
        where: {
          criado_por: usuario_id,
          createdAt: {
            [Op.gte]: sixMonthsAgo
          }
        },
        group: ['year', 'month'],
        order: [['year', 'ASC'], ['month', 'ASC']],
        raw: true
      });
      
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
      
      const agendamentosHoje = await Agendamento.count({
        where: {
          criado_por: usuario_id,
          data_inicio: {
            [Op.between]: [inicioHoje, fimHoje]
          }
        }
      });
      
      const seteDiasDepois = new Date();
      seteDiasDepois.setDate(seteDiasDepois.getDate() + 7);
      
      const agendamentosProximos = await Agendamento.count({
        where: {
          criado_por: usuario_id,
          data_inicio: {
            [Op.between]: [new Date(), seteDiasDepois]
          },
          status: {
            [Op.in]: ['marcado', 'confirmado']
          }
        }
      });
      
      const totalAgendamentos = await Agendamento.count({
        where: {
          criado_por: usuario_id
        }
      });
      
      const stats = {
        total: totalAgendamentos,
        hoje: agendamentosHoje,
        proximos: agendamentosProximos,
        porStatus: statusStats.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        porMes: monthlyStats
      };
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  static async getConviteStats(req, res) {
    try {
      const { id: usuario_id } = req.user;
      
      const agendamentos = await Agendamento.findAll({
        where: {
          criado_por: usuario_id
        },
        attributes: ['id', 'convidados'],
        raw: true
      });
      
      let totalConvites = 0;
      let convitesAceitos = 0;
      let convitesRecusados = 0;
      let convitesPendentes = 0;
      
      agendamentos.forEach(agendamento => {
        if (agendamento.convidados) {
          try {
            const convidados = JSON.parse(agendamento.convidados);
            totalConvites += convidados.length;
            
            convidados.forEach(convidado => {
              switch (convidado.status) {
                case 'aceito':
                  convitesAceitos++;
                  break;
                case 'recusado':
                  convitesRecusados++;
                  break;
                default:
                  convitesPendentes++;
              }
            });
          } catch (error) {
          }
        }
      });
      
      const conviteStats = {
        total: totalConvites,
        aceitos: convitesAceitos,
        recusados: convitesRecusados,
        pendentes: convitesPendentes,
        taxaAceitacao: totalConvites > 0 ? ((convitesAceitos / totalConvites) * 100).toFixed(1) : 0
      };
      
      res.json({
        success: true,
        data: conviteStats
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas de convites:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = {
  getStats: AgendamentoStatsController.getStats,
  getConviteStats: AgendamentoStatsController.getConviteStats
};
