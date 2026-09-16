const configuracaoPadrao = {
  id: 1,
  lembrete_24h_ativo: true,
  lembrete_dia_ativo: true,
  horario_lembrete_dia: '08:00:00',
  lembrete_antecipado_ativo: true,
  antecedencia_minutos: 60,
  fuso_horario: 'America/Sao_Paulo',
  alterado_por: null,
  alteradoPor: null,
  updated_at: '2026-09-15T00:00:00.000Z',
};

describe('Configurações administrativas de lembretes', () => {
  beforeEach(() => {
    const admin = { id: 1, nome: 'Administrador', email: 'admin@npj.local', role: 'Admin' };
    cy.intercept('GET', '**/api/auth/perfil', {
      statusCode: 200,
      body: { success: true, data: admin },
    }).as('validarSessao');
    cy.intercept('GET', '**/api/configuracoes/lembretes', {
      statusCode: 200,
      body: { success: true, data: configuracaoPadrao },
    }).as('obterConfiguracao');
    cy.visit('/configuracoes/lembretes', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user', JSON.stringify(admin));
        win.localStorage.setItem('token', 'token-admin-e2e');
      },
    });
  });

  it('abre a tela pelo menu exclusivo do Admin e exibe os padrões', () => {
    cy.location('pathname').should('eq', '/configuracoes/lembretes');
    cy.wait('@obterConfiguracao');

    cy.contains('a', 'Configurações').should('be.visible');
    cy.contains('h1', 'Configurações de lembretes').should('be.visible');
    cy.get('input[name="lembrete_24h_ativo"]').should('be.checked');
    cy.get('input[name="lembrete_dia_ativo"]').should('be.checked');
    cy.get('input[name="horario_lembrete_dia"]').should('have.value', '08:00');
    cy.get('input[name="antecedencia_valor"]').should('have.value', '1');
    cy.get('select[name="antecedencia_unidade"]').should('have.value', 'horas');
    cy.contains('Brasília (America/Sao_Paulo)').should('be.visible');
  });

  it('salva alterações e permite restaurar os padrões', () => {
    cy.intercept('PUT', '**/api/configuracoes/lembretes', (req) => {
      expect(req.body).to.include({
        lembrete_dia_ativo: false,
        antecedencia_minutos: 90,
      });
      req.reply({
        success: true,
        data: {
          ...configuracaoPadrao,
          lembrete_dia_ativo: false,
          antecedencia_minutos: 90,
          alterado_por: 1,
          alteradoPor: { id: 1, nome: 'Administrador', email: 'admin@npj.local' },
        },
      });
    }).as('salvarConfiguracao');
    cy.intercept('POST', '**/api/configuracoes/lembretes/restaurar', {
      statusCode: 200,
      body: { success: true, data: configuracaoPadrao },
    }).as('restaurarConfiguracao');

    cy.wait('@obterConfiguracao');
    cy.get('input[name="lembrete_dia_ativo"]').uncheck();
    cy.get('input[name="antecedencia_valor"]').clear().type('90');
    cy.get('select[name="antecedencia_unidade"]').select('minutos');
    cy.contains('button', 'Salvar alterações').click();
    cy.wait('@salvarConfiguracao');

    cy.contains('button', 'Restaurar padrões').click();
    cy.contains('h3', 'Restaurar configurações?').should('be.visible');
    cy.contains('button', 'Confirmar').click();
    cy.wait('@restaurarConfiguracao');
    cy.get('input[name="lembrete_dia_ativo"]').should('be.checked');
  });
});

describe('Restrição da tela de configurações por perfil', () => {
  const visitarComo = (role) => {
    const usuario = {
      id: role === 'Professor' ? 2 : 3,
      nome: `Usuário ${role}`,
      email: `${role.toLowerCase()}@npj.local`,
      role,
    };

    cy.intercept('GET', '**/api/auth/perfil', {
      statusCode: 200,
      body: { success: true, data: usuario },
    }).as(`validar${role}`);
    cy.intercept('GET', '**/api/configuracoes/lembretes').as('tentativaObterConfiguracao');
    cy.visit('/configuracoes/lembretes', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user', JSON.stringify(usuario));
        win.localStorage.setItem('token', `token-${role.toLowerCase()}-e2e`);
      },
    });
  };

  ['Professor', 'Aluno'].forEach((role) => {
    it(`redireciona ${role} e não carrega as configurações administrativas`, () => {
      visitarComo(role);

      cy.location('pathname').should('eq', '/dashboard');
      cy.contains('a', 'Configurações').should('not.exist');
      cy.get('@tentativaObterConfiguracao.all').should('have.length', 0);
    });
  });
});
