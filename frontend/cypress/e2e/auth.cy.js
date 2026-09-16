describe('Autenticação real', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  })

  it('informa credenciais incorretas, mantém o e-mail e limpa somente a senha', () => {
    const email = Cypress.env('adminEmail')
    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type('SenhaIncorreta123!', { log: false })
    cy.contains('button', 'Entrar no Sistema').click()

    cy.get('[role="alert"]').should('be.visible').and('not.be.empty')
    cy.get('input[type="email"]').should('have.value', email)
    cy.get('input[type="password"]').should('have.value', '')
    cy.location('pathname').should('eq', '/login')
  })

  it('autentica o administrador pela interface e abre o dashboard', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(Cypress.env('adminEmail'))
    cy.get('input[type="password"]').type(Cypress.env('adminPassword'), { log: false })
    cy.contains('button', 'Entrar no Sistema').click()

    cy.location('pathname', { timeout: 15000 }).should('eq', '/dashboard')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.a('string').and.not.be.empty
      expect(JSON.parse(win.localStorage.getItem('user'))).to.have.property('email', Cypress.env('adminEmail'))
    })
  })

  it('renova o access token inválido sem desconectar o usuário', () => {
    cy.loginByApi().then((session) => {
      window.localStorage.setItem('token', 'access-token-invalido')
      window.localStorage.setItem('refreshToken', session.refreshToken)
    })
    cy.intercept('POST', '**/api/auth/refresh').as('refreshToken')

    cy.visit('/dashboard')
    cy.wait('@refreshToken').its('response.statusCode').should('eq', 200)
    cy.location('pathname').should('eq', '/dashboard')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).not.to.eq('access-token-invalido')
      expect(win.localStorage.getItem('user')).not.to.eq(null)
    })
  })

  it('encerra somente a sessão irrecuperável e informa o motivo', () => {
    cy.loginByApi().then(() => {
      window.localStorage.setItem('token', 'access-token-invalido')
      window.localStorage.setItem('refreshToken', 'refresh-token-invalido')
    })

    cy.visit('/dashboard')
    cy.location('pathname', { timeout: 15000 }).should('eq', '/login')
    cy.get('[role="alert"]').should('contain.text', 'sessão expirou')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq(null)
      expect(win.localStorage.getItem('refreshToken')).to.eq(null)
      expect(win.localStorage.getItem('user')).to.eq(null)
    })
  })
})
