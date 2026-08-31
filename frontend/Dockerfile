FROM node:24.19-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Usar npm install em vez de npm ci (quando não há package-lock.json)
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 5173

# Servir o bundle de produção já gerado.
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
