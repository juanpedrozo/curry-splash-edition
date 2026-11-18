# Checklist acadêmico — CURRY

| Requisito | Evidência no projeto |
| --- | --- |
| [x] Pelo menos duas tabelas relacionadas | `jogadores → treinos → arremessos` em `V1__esquema.sql` |
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
- 5 testes de integração no PostgreSQL 17.9 e 2 testes de navegador concluídos.
- JOIN, agregações e subconsulta executados no banco.
- Dados e estatísticas preservados após reiniciar o PostgreSQL e a API.

## Roteiro de apresentação

1. Abra o dashboard com os dados opcionais de `database/demo.sql` ou cadastre um jogador.
2. Crie um treino, clique em uma zona da quadra e tente salvar acertos acima das tentativas. Corrija e salve.
3. Abra o detalhe do treino. Em **Gerenciar**, edite uma zona e volte ao dashboard para mostrar o recálculo.
4. Abra **Evolução** e compare duas sessões. Abra **Ranking** para comparar os jogadores.
5. Execute `queries.sql` no PostgreSQL. Mostre as chaves em `V1__esquema.sql` e as views que alimentam a API em `V2__consultas_estatisticas.sql`.
6. Consulte a seção **Testes** do README para reproduzir as verificações.
