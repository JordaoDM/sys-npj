describe('Navegação autenticada real', () => {
  beforeEach(() => {
    cy.loginAdmin()
  })

  it('carrega as principais áreas protegidas pelo menu lateral', () => {
    const routes = [
      ['Dashboard', '/dashboard'],
      ['Processos', '/processos'],
      ['Agendamentos', '/agendamentos'],
      ['Arquivos', '/arquivos'],
      ['Perfil', '/profile'],
      ['Usuários', '/usuarios'],
      ['Configurações', '/configuracoes/lembretes']
    ]

    cy.visit('/dashboard')
    routes.forEach(([label, pathname]) => {
      cy.contains('a', label).click()
      cy.location('pathname').should('eq', pathname)
      cy.get('main').should('be.visible')
    })
  })

  it('abre o formulário de processo e apresenta validações reais', () => {
    cy.visit('/processos/novo')
    cy.contains('h1', 'Cadastrar Novo Processo').should('be.visible')
    cy.get('input[name="numero_processo"]').should('have.attr', 'required')
    cy.get('input[name="titulo"]').should('have.attr', 'required')
    cy.get('input[name="contato_assistido"]').should('have.attr', 'required')
    cy.contains('button', 'Criar Processo').click()
    cy.get('input[name="numero_processo"]').then(($input) => {
      expect($input[0].checkValidity()).to.eq(false)
      expect($input[0].validationMessage).not.to.eq('')
    })
  })

  it('aplica automaticamente a máscara de telefone', () => {
    cy.visit('/processos/novo')
    cy.get('input[name="contato_assistido"]').type('65999999999')
    cy.get('input[name="contato_assistido"]').should('have.value', '(65) 99999-9999')
  })

  it('abre a criação de agendamento e carrega processos do backend', () => {
    cy.intercept('GET', '**/api/processos/usuario?concluidos=false').as('processosUsuario')
    cy.visit('/agendamentos/novo')
    cy.wait('@processosUsuario').its('response.statusCode').should('eq', 200)
    cy.contains('h1', 'Novo Agendamento').should('be.visible')
  })

  it('encerra a sessão pelo botão Sair', () => {
    cy.visit('/dashboard')
    cy.contains('button', 'Sair').click()
    cy.location('pathname').should('eq', '/')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq(null)
      expect(win.localStorage.getItem('user')).to.eq(null)
    })
  })
})
