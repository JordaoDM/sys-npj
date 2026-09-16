Cypress.Commands.add('loginByApi', () => {
  const email = Cypress.env('adminEmail')
  const senha = Cypress.env('adminPassword')

  expect(email, 'ADMIN_EMAIL configurado').to.be.a('string').and.not.be.empty
  expect(senha, 'ADMIN_PASSWORD configurado').to.be.a('string').and.not.be.empty

  return cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, { email, senha })
    .then(({ body }) => {
      expect(body.success).to.eq(true)
      window.localStorage.setItem('user', JSON.stringify(body.data.usuario))
      window.localStorage.setItem('token', body.data.token)
      window.localStorage.setItem('refreshToken', body.data.refreshToken)
      return body.data
    })
})

Cypress.Commands.add('loginAdmin', () => {
  cy.session('admin-api-session', () => {
    cy.loginByApi()
  }, {
    validate() {
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.a('string').and.not.be.empty
      })
    }
  })
})
