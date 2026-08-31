const request = require('supertest');
const express = require('express');
const { validate, handleValidation } = require('../middleware/validationMiddleware');

describe('Validação de criação de processos', () => {
  test('deve rejeitar numero_processo com letras', async () => {
    const app = express();
    app.use(express.json());
    app.post('/processos', validate('criarProcesso'), handleValidation, (req, res) => {
      res.status(201).json({ ok: true });
    });

    const response = await request(app)
      .post('/processos')
      .send({
        numero_processo: 'qweqweeqweqw',
        titulo: 'Processo teste',
        contato_assistido: '11999999999'
      });

    expect(response.status).toBe(400);
    expect(response.body.erro).toBe('Dados inválidos fornecidos');
    expect(response.body.detalhes.some((d) => d.campo === 'numero_processo')).toBe(true);
  });

  test('deve aceitar numero_processo com formato brasileiro', async () => {
    const app = express();
    app.use(express.json());
    app.post('/processos', validate('criarProcesso'), handleValidation, (req, res) => {
      res.status(201).json({ ok: true });
    });

    const response = await request(app)
      .post('/processos')
      .send({
        numero_processo: '0001234-56.2024.8.07.0001',
        titulo: 'Processo teste',
        contato_assistido: '11999999999'
      });

    expect(response.status).toBe(201);
  });
});
