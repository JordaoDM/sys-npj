# Arquitetura de agendamentos

O backend possui uma única implementação para agendamentos.

## Componentes canônicos

- `routes/agendamentos.js`: define o contrato HTTP, autenticação, autorização e validações de entrada.
- `controllers/agendamentoController.js`: concentra criação, consulta, atualização, exclusão, convites, lembretes e mudanças de status.
- `controllers/agendamentoStatsController.js`: fornece as estatísticas de agendamentos e convites.
- `middleware/antiDuplicacaoMiddleware.js`: impede solicitações duplicadas de criação.
- `middleware/roleMiddleware.js`: aplica as permissões administrativas nas rotas protegidas.

As rotas chamam os controllers diretamente. Não existe chave de ambiente, seleção dinâmica, fallback ou segunda implementação das regras de negócio.

## Verificação

Execute no diretório `backend`:

```bash
npm test
npm run test:api
```

O teste de API valida o contrato real usando banco de testes e deve ser executado antes de publicar alterações relacionadas a agendamentos.
