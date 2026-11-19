# Checklist acadêmico — CURRY

| Requisito | Evidência no projeto |
| --- | --- |
| [x] Pelo menos duas tabelas relacionadas | `usuarios → jogadores → treinos → arremessos` em `V1__esquema.sql` |
| [x] Chaves primárias e estrangeiras | Três PKs, duas FKs e exclusão em cascata |
| [x] CRUD completo | Jogadores, treinos e arremessos no Angular e na API REST |
| [x] JOIN | Consulta 1 do `queries.sql` une as três tabelas |
| [x] Agregações | Consultas 2 a 4 usam COUNT, SUM, GROUP BY e NULLIF |
| [x] Subconsulta | Consulta 5 compara a taxa de cada treino com a taxa geral do jogador |
| [x] Integração real | Angular → HTTP → Spring Boot → PostgreSQL |
| [x] Validação e integridade | Bean Validation, CHECK, UNIQUE e testes com PostgreSQL |
| [x] Dashboard e evolução | Totais da API, Chart.js, histórico por data e comparação entre sessões |
| [x] Quadra interativa | Cinco zonas em SVG, seletor de zona e edição dos resultados |
| [x] Comparação entre jogadores | Ranking com aproveitamento, volume e melhor zona |

## Verificações concluídas

- Builds Angular e Maven concluídos.
- Autenticação: 8 testes de integração executados com PostgreSQL 17.12, todos aprovados. 3 testes Playwright aprovados no aplicativo integrado.
- JOIN, agregações e subconsulta executados no banco.
- Dados e estatísticas preservados após reiniciar o PostgreSQL e a API.

## Roteiro de apresentação

1. Abra o dashboard com os dados opcionais de `database/demo.sql` ou cadastre um jogador.
2. Crie um treino, clique em uma zona da quadra e tente salvar acertos acima das tentativas. Corrija e salve.
3. Abra o detalhe do treino. Em **Gerenciar**, edite uma zona e volte ao dashboard para mostrar o recálculo.
4. Abra **Evolução** e compare duas sessões. Abra **Ranking** para comparar os jogadores.
5. Execute `queries.sql` no PostgreSQL. Mostre as chaves em `V1__esquema.sql` e as views que alimentam a API em `V2__consultas_estatisticas.sql`.
6. Consulte a seção **Testes** do README para reproduzir as verificações.


## Contas e privacidade

- [x] Cadastro com nome, e-mail único e senha validada.
- [x] Login, restauração da sessão e logout.
- [x] Senhas com BCrypt; sessão HttpOnly e proteção CSRF.
- [x] Jogadores, treinos, arremessos e estatísticas individuais restritos ao proprietário no backend.
- [x] Ranking compartilhado somente com nomes e resultados agregados.
- [x] Sem links para perfis de terceiros no ranking.
- [x] Registros anteriores preservados pela migração V3 e roteiro de vinculação pelo operador.
- [x] Testes de acesso por ID de outra conta, filtros, gravações, exclusões e ranking.
- [x] Executor de testes de navegador com esquema PostgreSQL descartável.
- [x] Atualização V2 → V3 com dados existentes, vinculação e duas cargas sem duplicação verificadas em PostgreSQL.
- [x] As seis consultas do `queries.sql` executadas com sucesso.

Na apresentação, crie duas contas em navegadores ou sessões separadas. Cadastre um jogador e um treino em cada uma. Mostre que cada lista contém apenas os próprios registros e que o ranking contém os resultados das duas contas. Tentativas de abrir um ID da outra conta recebem 404 na API. Mostre a FK `jogadores.usuario_id` da migração V3 e a consulta 6 de `queries.sql`, sem exibir hashes nem credenciais.
