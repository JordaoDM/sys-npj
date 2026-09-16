describe('Sistema NPJ', () => {
  it('carrega a página inicial', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('abre a página de login', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('button', 'Entrar no Sistema').should('be.visible');
    cy.contains('button', 'Esqueci minha senha').should('be.visible');
  });

  it('redireciona visitante de rota protegida para a página inicial', () => {
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/');
  });

  it('abre o fluxo de recuperação de senha', () => {
    cy.visit('/login');
    cy.contains('button', 'Esqueci minha senha').click();
    cy.location('pathname').should('eq', '/esqueci-senha');
    cy.get('input[type="email"]').should('be.visible');
  });

  it('abre o único fluxo público de cadastro pela tela de login', () => {
    cy.visit('/login');
    cy.contains('button', 'Criar Nova Conta').click();
    cy.location('pathname').should('eq', '/register');
    cy.contains('Cadastro de Aluno').should('be.visible');
    cy.contains('perfil de Aluno').should('be.visible');
    cy.get('#register-nome').should('be.visible');
    cy.get('#register-confirmarSenha').should('be.visible');
  });

  it('aplica máscara de telefone e valida a confirmação da senha', () => {
    cy.visit('/register');
    cy.get('#register-nome').type('Aluno Teste');
    cy.get('#register-email').type('aluno.teste@example.com');
    cy.get('#register-telefone').type('65999998888').should('have.value', '(65) 99999-8888');
    cy.get('#register-senha').type('senha123');
    cy.get('#register-confirmarSenha').type('outra123');
    cy.contains('button', 'Criar conta de aluno').click();
    cy.contains('A confirmação da senha não corresponde.').should('be.visible');
    cy.location('pathname').should('eq', '/register');
  });

  it('exibe a página de rota inexistente', () => {
    cy.visit('/rota-que-nao-existe');
    cy.contains(/não encontrada|404/i).should('be.visible');
  });
});
