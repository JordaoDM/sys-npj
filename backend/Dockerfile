FROM node:24.19-alpine

WORKDIR /app

# Instalar dependências necessárias para bcrypt
RUN apk add --no-cache python3 make g++

# Copiar apenas os arquivos de dependências primeiro
COPY package*.json ./

# Usar npm install em vez de npm ci
RUN npm install --only=production

# Copiar o resto do código
COPY . .

EXPOSE 3001

CMD ["npm", "start"]
