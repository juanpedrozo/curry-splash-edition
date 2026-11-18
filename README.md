# CURRY — Splash Edition 🏀

**Every Shot Counts.** Plataforma para jogadores amadores acompanharem o arremesso de três pontos. Registre sessões e resultados nas cinco zonas da quadra, consulte a evolução e compare atletas. A interface usa uma identidade esportiva original.

## Executar com Docker

Requer Docker com Compose. No PowerShell, dentro da pasta do projeto:

```powershell
Copy-Item .env.example .env
notepad .env
```

Defina `DB_PASSWORD` no arquivo `.env` e execute:

```powershell
docker compose up --build -d
docker compose logs -f app
```

Abra [http://localhost:8080](http://localhost:8080) quando a aplicação iniciar. O pacote serve o Angular e a API na mesma origem. O PostgreSQL usa o volume `curry_pgdata`, que conserva os registros após reiniciar os serviços. Para parar, use `docker compose down`.

O banco começa vazio. Cadastre um jogador pela interface ou carregue a demonstração após iniciar a API:

```powershell
docker compose cp database/demo.sql db:/tmp/curry-demo.sql
docker compose exec -T db psql -U curry -d curry -v ON_ERROR_STOP=1 -f /tmp/curry-demo.sql
```

O script cadastra três atletas e treinos em datas diferentes. A carga é manual e uma segunda execução com os mesmos perfis presentes não duplica os dados.

## Executar em desenvolvimento

Requer JDK 21, Maven 3.9, Node.js 24.15 ou superior da linha 24 e PostgreSQL. Crie o banco `curry` e um usuário com permissão para construir o esquema, ou inicie somente o banco com `docker compose up -d db` usando a configuração anterior.

Em um terminal PowerShell, configure e execute a API:

```powershell
$env:DB_URL = 'jdbc:postgresql://127.0.0.1:5432/curry'
$env:DB_USER = 'curry'
$env:DB_PASSWORD = Read-Host 'Senha do PostgreSQL'
mvn -f backend/pom.xml spring-boot:run
```

Em outro terminal, execute o Angular:

```powershell
cd frontend
npm ci
npm start
```

Abra [http://localhost:4200](http://localhost:4200). O Angular CLI encaminha `/api` para a porta 8080. Se usar outra porta para o backend, ajuste o destino no arquivo `frontend/proxy.conf.json`. Em Bash, use `export NOME=valor` para configurar as variáveis de ambiente.

| Variável | Uso | Padrão |
| --- | --- | --- |
| `DB_URL` | URL JDBC do PostgreSQL | `jdbc:postgresql://127.0.0.1:5432/curry` |
| `DB_USER` | Usuário do banco | `curry` |
| `DB_PASSWORD` | Senha do banco | Configurada no ambiente |
| `SERVER_ADDRESS` | Endereço em que a API escuta | `127.0.0.1` |
| `SERVER_PORT` | Porta da API | `8080` |
| `CORS_ORIGINS` | Origens da API, separadas por vírgula | `http://localhost:4200,http://127.0.0.1:4200` |

### Conectar ao Neon

No painel do Neon, copie o host da conexão direta, o banco e o nome do usuário. Configure o backend com TLS e uma função autorizada a criar tabelas e views. O Flyway aplica o esquema quando a API inicia. [Guia JDBC do Neon](https://neon.com/docs/guides/java)

```powershell
$env:DB_URL = 'jdbc:postgresql://HOST_DIRETO:5432/BANCO?sslmode=require'
$env:DB_USER = 'USUARIO_DO_NEON'
$env:DB_PASSWORD = Read-Host 'Senha do Neon'
mvn -f backend/pom.xml spring-boot:run
```

## Arquitetura e estrutura

O Angular 22 usa componentes standalone, Router, Reactive Forms, HttpClient, Bootstrap 5, Bootstrap Icons e Chart.js. A área de trabalho clara usa tabelas, formulários e controles do Bootstrap. O azul-marinho e o dourado identificam a navegação. As fontes Poppins e Inter são servidas pela aplicação. O Spring Boot 3.5 usa Java 21, Spring Web, Spring Data JPA, Hibernate, Bean Validation e Flyway. Os CRUDs usam JPA e os relatórios consultam views PostgreSQL por SQL parametrizado.

```text
curry-splash-edition/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/br/com/curry/
│       │   ├── config/       # CORS e rotas da SPA
│       │   ├── controller/   # contratos HTTP
│       │   ├── dto/          # entradas e respostas validadas
│       │   ├── entity/       # mapeamento JPA
│       │   ├── exception/    # erros padronizados
│       │   ├── repository/   # JPA e consultas SQL
│       │   └── service/      # regras e transações
│       ├── main/resources/db/migration/
│       └── test/java/br/com/curry/
├── frontend/
│   ├── public/              # identidade visual do CURRY
│   ├── src/app/             # core, layout, shared e features
│   └── e2e/                 # testes Playwright
├── database/demo.sql
├── queries.sql
├── compose.yml
├── Dockerfile
├── .env.example
├── CHECKLIST.md
└── README.md
```

### Modelo de dados

| Tabela | PK | FK | Conteúdo |
| --- | --- | --- | --- |
| `jogadores` | `id` | | Nome, apelido, posição e data de cadastro automática |
| `treinos` | `id` | `jogador_id → jogadores.id` | Data, duração, observações e data de cadastro |
| `arremessos` | `id` | `treino_id → treinos.id` | Zona, tentativas e acertos |

Os relacionamentos são 1:N nos dois níveis. As FKs têm `ON DELETE CASCADE`. Há uma zona por treino, garantida por `UNIQUE (treino_id, zona)`. As restrições `CHECK` validam zona, duração positiva e a regra `0 ≤ acertos ≤ tentativas`. Os índices atendem à busca por jogador, data e treino.

### Funcionalidades e cálculos

- **Dashboard** com os últimos treinos em primeiro plano, totais do jogador ativo, gráfico de evolução, quadra interativa e tabela de aproveitamento por zona. A escolha do jogador é lembrada no navegador.
- **Jogadores e treinos** com cadastro, listagem, detalhe, edição e exclusão com confirmação.
- **Arremessos** com edição e consulta por zona. Na tela do treino, clicar na quadra muda a zona de entrada. A sessão e os resultados preenchidos são gravados na mesma transação.
- **Evolução** com série por data, melhor sessão, variação em pontos percentuais, duas sessões comparáveis e histórico cronológico.
- **Ranking** com taxa de acerto, quantidade de tentativas, acertos, treinos e melhor zona. Jogadores sem tentativas aparecem sem colocação. Empates compartilham a colocação.
- **Taxa de acerto** é `100 × SUM(acertos) / SUM(tentativas)`. Sessões na mesma data entram na mesma soma do gráfico. Com zero tentativas, a API devolve `null` e a interface exibe um traço. A melhor zona utiliza a taxa e, no empate, favorece o volume de tentativas.
- **Quadra** com pontos acionáveis por toque, mouse ou teclado. A cor acompanha o valor textual. Cinza indica ausência de tentativas, lilás indica taxa abaixo de 35%, verde-água indica taxa entre 35% e 50% e dourado começa em 50%.

## API REST

| Método | Caminho | Operação |
| --- | --- | --- |
| GET, POST | `/api/jogadores` | Listar ou cadastrar |
| GET, PUT, DELETE | `/api/jogadores/{id}` | Consultar, editar ou excluir |
| GET, POST | `/api/treinos` | Listar ou cadastrar. GET aceita `jogadorId` |
| GET, PUT, DELETE | `/api/treinos/{id}` | Detalhar, editar ou excluir |
| GET, POST | `/api/arremessos` | Listar ou cadastrar. GET aceita `treinoId` e `jogadorId` |
| GET, PUT, DELETE | `/api/arremessos/{id}` | Consultar, editar ou excluir |
| GET | `/api/estatisticas/jogadores/{id}/resumo` | Totais, melhor zona e últimos cinco treinos |
| GET | `/api/estatisticas/jogadores/{id}/zonas` | Totais das cinco zonas |
| GET | `/api/estatisticas/jogadores/{id}/evolucao` | Pontos por data, sessões e melhor treino |
| GET | `/api/estatisticas/ranking` | Comparação entre jogadores |

POST responde com `201 Created` e cabeçalho `Location`. DELETE responde com `204 No Content`. Os erros incluem `400` para dados inválidos, `404` para registro inexistente e `409` para conflito. Requisições usam JSON com data no formato `AAAA-MM-DD`.

Exemplo de corpo para cadastrar um treino com um registro por zona em `POST /api/treinos`. Use o ID de um jogador existente.

```json
{
  "jogadorId": 1,
  "data": "2026-11-16",
  "duracaoMinutos": 45,
  "observacoes": "Trabalhei a finalização após o drible.",
  "arremessos": [
    { "zona": "TOPO_DO_ARCO", "tentativas": 20, "acertos": 11 }
  ]
}
```

Em `PUT /api/treinos/{id}`, omita `arremessos` para manter as zonas atuais, ou envie a lista completa para substituí-las. `[]` limpa o treino. Para gravar uma zona individual em `/api/arremessos`, envie `treinoId`, `zona`, `tentativas` e `acertos`. Em um PUT individual, use o `treinoId` original.

## SQL para apresentar

O arquivo [queries.sql](queries.sql) inclui o JOIN entre as tabelas, COUNT, SUM, percentuais protegidos por NULLIF, agrupamento por zona e por data e uma subconsulta correlacionada. As views usadas pela API estão na [migração de estatísticas](backend/src/main/resources/db/migration/V2__consultas_estatisticas.sql).

```powershell
docker compose cp queries.sql db:/tmp/curry-queries.sql
docker compose exec -T db psql -U curry -d curry -v ON_ERROR_STOP=1 -f /tmp/curry-queries.sql
```

## Testes

Os testes do backend usam um banco PostgreSQL de teste. Informe uma URL JDBC, um usuário com permissão de criação de esquemas e a senha local, se aplicável. A suíte cria e remove um esquema próprio. Sem a URL, os testes de integração são ignorados.

```powershell
$env:CURRY_TEST_DB_URL = 'jdbc:postgresql://127.0.0.1:5432/curry_test'
$env:CURRY_TEST_DB_USER = 'curry'
$env:CURRY_TEST_DB_PASSWORD = Read-Host 'Senha do banco de teste'
mvn -f backend/pom.xml verify
```

Com a aplicação em execução, compile e rode o fluxo de navegador:

```powershell
cd frontend
npm ci
npm run build
npx playwright install chromium
npm run test:e2e
```

O Playwright usa a URL `http://127.0.0.1:8080` por padrão. Para testar o Angular em modo de desenvolvimento, defina `CURRY_E2E_BASE_URL=http://127.0.0.1:4200` no ambiente. A suíte cria e remove seus próprios jogadores.

### Verificações executadas

- Build de produção do Angular e empacotamento Maven com Java 21 concluídos.
- Cinco testes de integração passaram contra PostgreSQL 17.9, cobrindo CRUD, validação, restrições, cascata, ranking e médias ponderadas.
- Dois testes Playwright passaram no aplicativo integrado. O fluxo registrou as cinco zonas, recalculou o gráfico após uma edição, passou pelos três CRUDs e verificou a quadra e a navegação em 390 px.
- As cinco consultas do `queries.sql` foram executadas no PostgreSQL. Duas cargas do roteiro de demonstração mantiveram 3 jogadores, 15 treinos e 75 registros.
- A API devolveu os mesmos totais depois de reiniciar o PostgreSQL e o backend. O proxy do Angular CLI também respondeu com dados do banco.

## Limitações

Esta versão foi projetada para demonstração em ambiente controlado. A API permite leituras e alterações sem login. Qualquer publicação para uso público exige controles de acesso. O ranking informa o volume de tentativas para que uma amostra pequena possa ser interpretada. A conexão com o Neon exige suas credenciais. A validação executada usou PostgreSQL local e o pacote integrado Spring Boot. O Docker Compose está configurado para execução local e ficou fora das verificações deste ambiente.

Consulte o [CHECKLIST.md](CHECKLIST.md) para a apresentação acadêmica.
