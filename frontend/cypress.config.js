import { defineConfig } from 'cypress'
import fs from 'node:fs'
import path from 'node:path'

const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split(/\r?\n/)
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
      .map((line) => {
        const separator = line.indexOf('=')
        return [line.slice(0, separator), line.slice(separator + 1)]
      })
  )
}

const localEnv = readEnvFile(path.resolve('../.env'))

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5174',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    env: {
      apiUrl: 'http://localhost:3001/api',
      adminEmail: process.env.ADMIN_EMAIL || localEnv.ADMIN_EMAIL,
      adminPassword: process.env.ADMIN_PASSWORD || localEnv.ADMIN_PASSWORD
    }
  }
})
