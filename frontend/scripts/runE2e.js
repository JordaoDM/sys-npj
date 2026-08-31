import { spawn } from 'node:child_process'
import http from 'node:http'

const npmCli = process.env.npm_execpath
const serverUrl = 'http://127.0.0.1:5174'

if (!npmCli) {
  throw new Error('Não foi possível localizar o executável do npm')
}

const waitForServer = async (attempts = 60) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const ready = await new Promise((resolve) => {
      const request = http.get(serverUrl, (response) => {
        response.resume()
        resolve(response.statusCode >= 200 && response.statusCode < 500)
      })
      request.on('error', () => resolve(false))
      request.setTimeout(500, () => {
        request.destroy()
        resolve(false)
      })
    })
    if (ready) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Frontend E2E não iniciou em ${serverUrl}`)
}

const runNpm = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [npmCli, ...args], { stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', (code) => resolve(code ?? 1))
})

let exitCode = 1
let frontend
try {
  process.env.VITE_API_URL = serverUrl
  const buildCode = await runNpm(['run', 'build'])
  if (buildCode !== 0) throw new Error('Não foi possível compilar o frontend para o teste E2E')

  frontend = spawn(process.execPath, [npmCli, 'run', 'preview', '--', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], {
    stdio: 'inherit',
    shell: false,
    detached: process.platform !== 'win32'
  })
  await waitForServer()
  exitCode = await runNpm(['run', 'test:e2e:direct'])
} catch (error) {
  console.error(error.message)
} finally {
  if (frontend?.pid) {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(frontend.pid), '/T', '/F'], { stdio: 'ignore' })
      await new Promise((resolve) => killer.on('exit', resolve))
    } else {
      process.kill(-frontend.pid, 'SIGTERM')
    }
  }
}

process.exit(exitCode)
