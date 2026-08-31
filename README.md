# Sistema NPJ

Sistema web para gestão de um Núcleo de Prática Jurídica. A aplicação reúne
controle de usuários, processos, documentos, histórico e agendamentos em uma
interface única.

## Funcionalidades

- Autenticação com access token e refresh token.
- Perfis de acesso para administrador, professor e aluno.
- Cadastro, edição, conclusão e reabertura de processos.
- Vinculação de usuários aos processos.
- Histórico de movimentações dos processos.
- Upload e gerenciamento de arquivos.
- Agendamentos vinculados a processos, com convidados e lembretes por e-mail.
- Dashboard e filtros para acompanhamento das atividades.
- Caixa de e-mail local com Mailpit.

## Tecnologias

- Frontend: React 18, Vite e Tailwind CSS.
- Backend: Node.js, Express e Sequelize.
- Banco de dados: MySQL 8.
- Autenticação: JWT.
- Docker

## Estrutura do projeto

```text
backend/                         API, regras de negócio e migrations
  migrations/                   baseline e migrations incrementais
  schema/baseline.sql           estrutura completa do banco
frontend/                        aplicação React
docker-compose.yml              serviços locais
.env.example                    modelo de configuração do Docker
env/main.env.example            modelo para execução sem Docker
```

## Instalação com Docker

### Requisitos

- Docker Desktop ou Docker Engine.
- Docker Compose v2, disponível pelo comando `docker compose`.
- Portas livres: `5173`, `3001`, `8025`, `1025` e a porta definida em
  `DB_HOST_PORT`.

### 1. Configure as variáveis de ambiente

```powershell
Copy-Item .env.example .env
```

Abra o `.env` e substitua todos os valores. As variáveis mais
importantes são:

| Variável | Finalidade |
| --- | --- |
| `DB_ROOT_PASSWORD` | Senha administrativa do MySQL local |
| `DB_NAME` | Nome do banco da aplicação |
| `DB_USER` | Usuário MySQL da aplicação |
| `DB_PASSWORD` | Senha do usuário MySQL |
| `DB_HOST_PORT` | Porta do MySQL exposta na máquina |
| `JWT_SECRET` | Assinatura dos tokens de acesso |
| `JWT_REFRESH_SECRET` | Assinatura dos refresh tokens |
| `ADMIN_EMAIL` | E-mail do administrador inicial |
| `ADMIN_PASSWORD` | Senha do administrador inicial, mínimo de 12 caracteres |
| `SEED_TEST_USERS` | Cria professores e alunos de teste quando definido como `true` |
| `EMAIL_FROM` | Remetente das mensagens do sistema |
| `FRONTEND_URL` | Origem permitida do frontend |

Use valores aleatórios e diferentes para os dois segredos JWT. Não envie o
arquivo `.env` para o repositório.

### 2. Inicie os serviços

```powershell
docker compose up -d --build
```

Na primeira inicialização, o backend executa automaticamente a migration
consolidada e prepara as tabelas e catálogos do sistema.

### 3. Administrador inicial

O backend cria o administrador automaticamente usando `ADMIN_EMAIL` e
`ADMIN_PASSWORD`. Se o e-mail já existir, não cria outro usuário.

### 4. Acesse o sistema

| Serviço | Endereço |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Mailpit | http://localhost:8025 |
| MySQL | `localhost:<DB_HOST_PORT>` |

Entre no frontend usando os valores configurados em `ADMIN_EMAIL` e
`ADMIN_PASSWORD`.

## Uso básico

Depois do primeiro login como administrador:

1. Cadastre professores e alunos na área de usuários.
2. Crie um processo e informe os dados do assistido e da tramitação.
3. Vincule os usuários que poderão acompanhar o processo.
4. Registre movimentações e envie documentos quando necessário.
5. Crie agendamentos pela área de agendamentos ou diretamente nos detalhes do
   processo.
6. Acompanhe as alterações no histórico do processo.

### Perfis de acesso

| Perfil | Uso esperado |
| --- | --- |
| Admin | Administração completa do sistema e dos usuários |
| Professor | Supervisão de processos, alunos e agendamentos |
| Aluno | Acesso aos processos aos quais estiver vinculado |

### Recriar um banco vazio

O comando abaixo apaga definitivamente o volume do MySQL e todos os dados locais:

```powershell
docker compose down -v
docker compose up -d --build
docker compose exec -T backend npm run admin:create
```

## Execução sem Docker

### Requisitos

- Node.js `24.19.0` (linha LTS usada pelo projeto) e npm `11` ou superior.
- npm.
- MySQL 8.
- Um servidor SMTP (Mailpit).

### 1. Instale as dependências

Na raiz do projeto:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure o backend

```powershell
Copy-Item env/main.env.example env/main.env
```

Edite `env/main.env`. Para um MySQL exposto pelo Docker deste projeto serão usados:

```dotenv
DB_HOST=localhost
DB_PORT=13306
```

Para um MySQL instalado diretamente, ajuste host e porta conforme o ambiente.

### 3. Inicie backend e frontend

Em dois terminais:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Ou, depois de instalar as dependências da raiz:

```powershell
npm run dev
```


### 4. Crie o administrador

Com o backend já iniciado e a migration concluída, execute:

```powershell
npm run admin:create
```

## Banco de dados e migrations

O sistema usa um executor próprio e roda migrations automaticamente quando o
backend inicia.

- Bancos novos executam
  `backend/migrations/00000000000000_current_schema_baseline.js`.
- A estrutura completa está em `backend/schema/baseline.sql`.
- Bancos existentes são validados antes de adotar a baseline.

Comandos operacionais disponíveis na raiz:

```powershell
# Verifica se existem migrations pendentes; não altera o banco
npm run migrate:check

# Executa somente as migrations pendentes
npm run migrate

# Cria o administrador configurado em env/main.env
npm run admin:create

# Executa migrations e depois cria o administrador
npm run setup
```

Os comandos retornam código de erro quando a conexão, a migration ou a criação
do administrador falha, permitindo seu uso em scripts de implantação e CI.

## Testes

Executar toda a suíte do backend:

```powershell
npm test --prefix backend
```

Executar somente os testes completos da API:

```powershell
npm run test:api
```

Antes dos testes de API, o comando recria automaticamente o banco isolado
`npj_test` e aplica a migration consolidada. Há uma trava que recusa qualquer
nome de banco que não termine em `_test`; o banco de desenvolvimento não é
alterado.

A suíte usa requisições HTTP reais com Supertest e cobre saúde da aplicação,
autenticação e renovação de token, permissões de Admin/Professor/Aluno,
usuários, processos e vínculos, histórico, arquivos, agendamentos, tabelas
auxiliares e dashboard. Os cenários são construídos sem convidados ou ações
de lembrete, portanto não disparam e-mail nem calendário externo.

Outros grupos de testes:

```powershell
npm run test:unit --prefix backend
npm run test:integration --prefix backend
```

Compilar o frontend:

```powershell
npm run build --prefix frontend
```

Testes end-to-end do frontend:

```powershell
npm run test:e2e --prefix frontend
```

## E-mails no ambiente local

O Docker Compose utiliza o Mailpit:

- SMTP: `mailpit:1025` dentro da rede Docker.
- Interface web: http://localhost:8025.

