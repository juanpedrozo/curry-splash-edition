package br.com.curry;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "CURRY_TEST_DB_URL", matches = ".+")
class CurryApiTest {
    private static final String SCHEMA = "teste_" + UUID.randomUUID().toString().replace("-", "");
    private static final String URL = System.getenv("CURRY_TEST_DB_URL");
    private static final String USER = System.getenv().getOrDefault("CURRY_TEST_DB_USER", "curry");
    private static final String PASSWORD = System.getenv().getOrDefault("CURRY_TEST_DB_PASSWORD", "");

    @Autowired
    MockMvc api;

    @Autowired
    ObjectMapper json;

    @Autowired
    JdbcTemplate sql;

    @Autowired
    PasswordEncoder senhas;

    @DynamicPropertySource
    static void banco(DynamicPropertyRegistry props) throws SQLException {
        executarDdl("CREATE SCHEMA " + SCHEMA);
        props.add("spring.datasource.url", () -> URL);
        props.add("spring.datasource.username", () -> USER);
        props.add("spring.datasource.password", () -> PASSWORD);
        props.add("spring.datasource.hikari.schema", () -> SCHEMA);
        props.add("spring.flyway.default-schema", () -> SCHEMA);
        props.add("spring.jpa.properties.hibernate.default_schema", () -> SCHEMA);
    }

    @AfterAll
    static void limparEsquema() throws SQLException {
        executarDdl("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @BeforeEach
    void limpar() {
        sql.update("DELETE FROM jogadores");
        sql.update("DELETE FROM usuarios");
        sql.update("INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
                "Teste", "teste@curry.test", new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4).encode("Teste-12345"));
    }

    @Test
    @WithMockUser(username = "teste@curry.test")
    void crudJogadorEValidacao() throws Exception {
        api.perform(post("/api/jogadores").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"  \"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.nome").exists());
        long id = jogador("Rafa");
        api.perform(get("/api/jogadores")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id));
        api.perform(get("/api/jogadores/{id}", id)).andExpect(status().isOk()).andExpect(jsonPath("$.criadoEm").exists());
        api.perform(put("/api/jogadores/{id}", id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\" Rafael Lima \",\"apelido\":\"Rafa\",\"posicao\":\"Armador\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Rafael Lima"));
        api.perform(delete("/api/jogadores/{id}", id).with(csrf())).andExpect(status().isNoContent());
        api.perform(get("/api/jogadores/{id}", id)).andExpect(status().isNotFound());
        api.perform(get("/api/jogadores/-1")).andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "teste@curry.test")
    void crudTreinoAtualizaZonasAtomicamente() throws Exception {
        long jogador = jogador("Lívia");
        long outro = jogador("Gabriel");
        long treino = treino(jogador, "2026-11-10", """
                [{"zona":"TOPO_DO_ARCO","tentativas":10,"acertos":4}]
                """);
        long zona = sql.queryForObject("SELECT id FROM arremessos WHERE treino_id = ?", Long.class, treino);
        api.perform(get("/api/treinos").param("jogadorId", Long.toString(outro)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        api.perform(get("/api/treinos").param("jogadorId", Long.toString(jogador)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].percentual").value(40));
        api.perform(get("/api/treinos/{id}", treino)).andExpect(status().isOk())
                .andExpect(jsonPath("$.arremessos[0].id").value(zona));

        String duplicado = """
                [{"zona":"ALA_DIREITA","tentativas":10,"acertos":4},
                 {"zona":"ALA_DIREITA","tentativas":10,"acertos":1}]
                """;
        api.perform(put("/api/treinos/{id}", treino).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(treinoJson(jogador, "2026-11-11", duplicado)))
                .andExpect(status().isBadRequest());
        api.perform(get("/api/treinos/{id}", treino)).andExpect(jsonPath("$.sessao.data").value("2026-11-10"));

        api.perform(put("/api/treinos/{id}", treino).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(treinoJson(jogador, "2026-11-12", """
                                [{"zona":"TOPO_DO_ARCO","tentativas":20,"acertos":11},
                                 {"zona":"CANTO_DIREITO","tentativas":12,"acertos":5}]
                                """)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.sessao.data").value("2026-11-12"))
                .andExpect(jsonPath("$.sessao.percentual").value(50))
                .andExpect(jsonPath("$.arremessos[0].id").value(zona));
        api.perform(put("/api/treinos/{id}", treino).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jogadorId\":%d,\"data\":\"2026-11-12\",\"duracaoMinutos\":38}".formatted(jogador)))
                .andExpect(jsonPath("$.arremessos", hasSize(2)));
        api.perform(put("/api/treinos/{id}", treino).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(treinoJson(jogador, "2026-11-12", "[]")))
                .andExpect(jsonPath("$.arremessos", hasSize(0)));
        api.perform(delete("/api/treinos/{id}", treino).with(csrf())).andExpect(status().isNoContent());
        api.perform(get("/api/treinos/{id}", treino)).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "teste@curry.test")
    void crudArremessoValidaValoresEUnicidade() throws Exception {
        long jogador = jogador("Duda");
        long treino = treino(jogador, "2026-11-13", "[]");
        String valido = arremessoJson(treino, "ALA_ESQUERDA", 12, 6);
        api.perform(post("/api/arremessos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(arremessoJson(treino, "ALA_ESQUERDA", 5, 6)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.acertos").exists());
        api.perform(post("/api/arremessos").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(
                        "{\"treinoId\":%d,\"zona\":\"ALA_ESQUERDA\",\"tentativas\":1.5,\"acertos\":0}".formatted(treino)))
                .andExpect(status().isBadRequest());
        long id = id(api.perform(post("/api/arremessos").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(valido)), "/id");
        api.perform(post("/api/arremessos").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(valido))
                .andExpect(status().isConflict());
        api.perform(get("/api/arremessos/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.percentual").value(50));
        api.perform(get("/api/arremessos").param("treinoId", Long.toString(treino)).param("jogadorId", Long.toString(jogador)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        api.perform(put("/api/arremessos/{id}", id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(arremessoJson(treino, "ALA_DIREITA", 0, 0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.percentual").value(nullValue()));
        api.perform(delete("/api/arremessos/{id}", id).with(csrf())).andExpect(status().isNoContent());
        api.perform(get("/api/arremessos/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "teste@curry.test")
    void agregacoesPonderamOsTotaisEAgrupamSessoesDaMesmaData() throws Exception {
        long jogador = jogador("Bia");
        long semTreino = jogador("Sem registros");
        treino(jogador, "2026-11-10", """
                [{"zona":"TOPO_DO_ARCO","tentativas":10,"acertos":9},
                 {"zona":"CANTO_ESQUERDO","tentativas":0,"acertos":0}]
                """);
        treino(jogador, "2026-11-10", """
                [{"zona":"TOPO_DO_ARCO","tentativas":90,"acertos":1}]
                """);
        treino(jogador, "2026-11-11", """
                [{"zona":"ALA_DIREITA","tentativas":20,"acertos":10}]
                """);

        api.perform(get("/api/estatisticas/jogadores/{id}/resumo", jogador))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totais.totalTreinos").value(3))
                .andExpect(jsonPath("$.totais.acertos").value(20)).andExpect(jsonPath("$.totais.tentativas").value(120))
                .andExpect(jsonPath("$.totais.percentual").value(16.67))
                .andExpect(jsonPath("$.melhorZona.zona").value("ALA_DIREITA"));
        api.perform(get("/api/estatisticas/jogadores/{id}/zonas", jogador)).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5))).andExpect(jsonPath("$[2].percentual").value(10))
                .andExpect(jsonPath("$[0].percentual").value(nullValue()));
        api.perform(get("/api/estatisticas/jogadores/{id}/evolucao", jogador)).andExpect(status().isOk())
                .andExpect(jsonPath("$.pontos", hasSize(2))).andExpect(jsonPath("$.pontos[0].totalTreinos").value(2))
                .andExpect(jsonPath("$.pontos[0].percentual").value(10)).andExpect(jsonPath("$.variacaoPp").value(40))
                .andExpect(jsonPath("$.melhorTreino.percentual").value(90));
        api.perform(get("/api/estatisticas/jogadores/{id}/resumo", semTreino))
                .andExpect(jsonPath("$.totais.percentual").value(nullValue()));
        api.perform(get("/api/estatisticas/ranking")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].colocacao").value(1)).andExpect(jsonPath("$[1].colocacao").value(nullValue()));
    }

    @Test
    @WithMockUser(username = "teste@curry.test")
    void postgresGaranteChavesRestricoesECascata() throws Exception {
        long jogador = jogador("Caio");
        long treino = treino(jogador, "2026-11-15", """
                [{"zona":"CANTO_DIREITO","tentativas":10,"acertos":8}]
                """);
        String inserir = "INSERT INTO arremessos(treino_id, zona, tentativas, acertos) VALUES (?, ?, ?, ?)";
        assertThatThrownBy(() -> sql.update(inserir, treino, "CANTO_DIREITO", 10, 2))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> sql.update(inserir, treino, "ALA_DIREITA", 10, 11))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> sql.update(inserir, treino + 1000000, "ALA_DIREITA", 10, 2))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> sql.update("UPDATE treinos SET duracao_minutos = 0 WHERE id = ?", treino))
                .isInstanceOf(DataIntegrityViolationException.class);

        api.perform(delete("/api/jogadores/{id}", jogador).with(csrf())).andExpect(status().isNoContent());
        assertThat(sql.queryForObject("SELECT COUNT(*) FROM treinos WHERE id = ?", Long.class, treino)).isZero();
        assertThat(sql.queryForObject("SELECT COUNT(*) FROM arremessos WHERE treino_id = ?", Long.class, treino)).isZero();
    }

    @Test
    void cadastroLoginCsrfLogoutESenhaProtegida() throws Exception {
        api.perform(get("/api/jogadores")).andExpect(status().isUnauthorized());
        api.perform(get("/api/estatisticas/ranking")).andExpect(status().isUnauthorized());
        api.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
                .content(cadastroJson("Ana", "ANA@curry.test", "Senha-teste-123")))
                .andExpect(status().isForbidden());
        Navegador anonimo = visitante();
        api.perform(post("/api/auth/cadastro").session(anonimo.sessao()).header("X-CSRF-TOKEN", anonimo.token())
                .contentType(MediaType.APPLICATION_JSON).content(cadastroJson("Ana", "ANA@curry.test", "Senha-teste-123")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.email").value("ana@curry.test"))
                .andExpect(jsonPath("$.senha").doesNotExist()).andExpect(jsonPath("$.senhaHash").doesNotExist());
        String hash = sql.queryForObject("SELECT senha_hash FROM usuarios WHERE email = ?", String.class, "ana@curry.test");
        assertThat(hash).startsWith("$2a$12$").isNotEqualTo("Senha-teste-123");
        assertThat(senhas.matches("Senha-teste-123", hash)).isTrue();
        api.perform(post("/api/auth/cadastro").session(anonimo.sessao()).header("X-CSRF-TOKEN", anonimo.token())
                .contentType(MediaType.APPLICATION_JSON).content(cadastroJson("Outra", "ana@curry.test", "Senha-teste-123")))
                .andExpect(status().isConflict());
        api.perform(post("/api/auth/login").session(anonimo.sessao()).header("X-CSRF-TOKEN", anonimo.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"ana@curry.test\",\"senha\":\"incorreta\"}"))
                .andExpect(status().isUnauthorized());
        String antes = anonimo.sessao().getId();
        Navegador autenticado = entrar(anonimo, "ana@curry.test");
        assertThat(autenticado.sessao().getId()).isNotEqualTo(antes);
        api.perform(get("/api/auth/me").session(autenticado.sessao()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Ana"));
        api.perform(post("/api/jogadores").session(autenticado.sessao()).header("X-CSRF-TOKEN", anonimo.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"Ana Atleta\"}"))
                .andExpect(status().isForbidden());
        api.perform(post("/api/jogadores").session(autenticado.sessao()).header("X-CSRF-TOKEN", autenticado.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"Ana Atleta\"}"))
                .andExpect(status().isCreated());
        api.perform(post("/api/auth/logout").session(autenticado.sessao())).andExpect(status().isForbidden());
        api.perform(post("/api/auth/logout").session(autenticado.sessao()).header("X-CSRF-TOKEN", autenticado.token()))
                .andExpect(status().isNoContent());
        assertThat(autenticado.sessao().isInvalid()).isTrue();
        api.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void validaDadosDaContaELimiteDeBytesDaSenha() throws Exception {
        api.perform(post("/api/auth/cadastro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(cadastroJson(" ", "email-invalido", "curta")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists()).andExpect(jsonPath("$.campos.senha").exists());
        api.perform(post("/api/auth/cadastro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(cadastroJson("Ana", "ana@curry.test", "á".repeat(37))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.senha").exists());
        assertThat(sql.queryForObject("SELECT COUNT(*) FROM usuarios WHERE email = 'ana@curry.test'", Long.class)).isZero();
    }

    @Test
    void isolaTodosOsRecursosEntreDuasContasEMantemRankingCompartilhado() throws Exception {
        Navegador ana = cadastrarEEntrar("Ana", "ana@curry.test");
        Navegador bia = cadastrarEEntrar("Bia", "bia@curry.test");
        long a = criarJogador(ana, "Atleta Ana");
        long b = criarJogador(bia, "Atleta Bia");
        long ta = criarTreino(ana, a, "Segredo Ana");
        long tb = criarTreino(bia, b, "Segredo Bia");
        long aa = sql.queryForObject("SELECT id FROM arremessos WHERE treino_id = ?", Long.class, ta);
        long ab = sql.queryForObject("SELECT id FROM arremessos WHERE treino_id = ?", Long.class, tb);
        long legado = sql.queryForObject("INSERT INTO jogadores (nome) VALUES ('Legado privado') RETURNING id", Long.class);

        api.perform(get("/api/jogadores").session(ana.sessao())).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(a));
        api.perform(get("/api/jogadores").session(bia.sessao())).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(b));
        for (long id : new long[]{b, legado}) {
            api.perform(get("/api/jogadores/{id}", id).session(ana.sessao())).andExpect(status().isNotFound());
            api.perform(put("/api/jogadores/{id}", id).session(ana.sessao()).with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"Invadido\"}"))
                    .andExpect(status().isNotFound());
            api.perform(delete("/api/jogadores/{id}", id).session(ana.sessao()).with(csrf())).andExpect(status().isNotFound());
        }
        api.perform(get("/api/treinos").session(ana.sessao())).andExpect(jsonPath("$", hasSize(1)));
        api.perform(get("/api/treinos").param("jogadorId", "" + b).session(ana.sessao())).andExpect(jsonPath("$", hasSize(0)));
        api.perform(get("/api/treinos/{id}", tb).session(ana.sessao())).andExpect(status().isNotFound());
        api.perform(post("/api/treinos").session(ana.sessao()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(treinoJson(b, "2026-11-18", "[]"))).andExpect(status().isNotFound());
        for (long id : new long[]{ta, tb}) {
            api.perform(put("/api/treinos/{id}", id).session(ana.sessao()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                    .content(treinoJson(b, "2026-11-18", "[]"))).andExpect(status().isNotFound());
        }
        api.perform(delete("/api/treinos/{id}", tb).session(ana.sessao()).with(csrf())).andExpect(status().isNotFound());
        api.perform(get("/api/arremessos").session(ana.sessao())).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(aa));
        api.perform(get("/api/arremessos").param("treinoId", "" + tb).session(ana.sessao()))
                .andExpect(jsonPath("$", hasSize(0)));
        api.perform(get("/api/arremessos").param("jogadorId", "" + b).session(ana.sessao()))
                .andExpect(jsonPath("$", hasSize(0)));
        api.perform(get("/api/arremessos/{id}", ab).session(ana.sessao())).andExpect(status().isNotFound());
        api.perform(post("/api/arremessos").session(ana.sessao()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(arremessoJson(tb, "ALA_DIREITA", 10, 2))).andExpect(status().isNotFound());
        api.perform(put("/api/arremessos/{id}", ab).session(ana.sessao()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(arremessoJson(ta, "ALA_DIREITA", 10, 2))).andExpect(status().isNotFound());
        api.perform(delete("/api/arremessos/{id}", ab).session(ana.sessao()).with(csrf())).andExpect(status().isNotFound());
        for (String pagina : new String[]{"resumo", "zonas", "evolucao"}) {
            api.perform(get("/api/estatisticas/jogadores/{id}/" + pagina, b).session(ana.sessao()))
                    .andExpect(status().isNotFound());
        }
        String ranking = api.perform(get("/api/estatisticas/ranking").session(ana.sessao()))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(ranking).contains("Atleta Ana", "Atleta Bia").doesNotContain("Segredo", "@", "senha", "Legado privado");
        assertThat(sql.queryForObject("SELECT jogador_id FROM treinos WHERE id = ?", Long.class, ta)).isEqualTo(a);
        assertThat(sql.queryForObject("SELECT nome FROM jogadores WHERE id = ?", String.class, b)).isEqualTo("Atleta Bia");
    }

    private record Navegador(MockHttpSession sessao, String token) {}

    private Navegador visitante() throws Exception {
        var resultado = api.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        return new Navegador((MockHttpSession) resultado.getRequest().getSession(false),
                json.readTree(resultado.getResponse().getContentAsByteArray()).get("token").asText());
    }

    private Navegador cadastrarEEntrar(String nome, String email) throws Exception {
        var visitante = visitante();
        api.perform(post("/api/auth/cadastro").session(visitante.sessao()).header("X-CSRF-TOKEN", visitante.token())
                .contentType(MediaType.APPLICATION_JSON).content(cadastroJson(nome, email, "Senha-teste-123")))
                .andExpect(status().isCreated());
        return entrar(visitante, email);
    }

    private Navegador entrar(Navegador visitante, String email) throws Exception {
        api.perform(post("/api/auth/login").session(visitante.sessao()).header("X-CSRF-TOKEN", visitante.token())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("email", email, "senha", "Senha-teste-123"))))
                .andExpect(status().isOk());
        var resultado = api.perform(get("/api/auth/csrf").session(visitante.sessao())).andExpect(status().isOk()).andReturn();
        return new Navegador(visitante.sessao(), json.readTree(resultado.getResponse().getContentAsByteArray()).get("token").asText());
    }

    private String cadastroJson(String nome, String email, String senha) throws Exception {
        return json.writeValueAsString(java.util.Map.of("nome", nome, "email", email, "senha", senha));
    }

    private long criarJogador(Navegador conta, String nome) throws Exception {
        return id(api.perform(post("/api/jogadores").session(conta.sessao()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("nome", nome)))), "/id");
    }

    private long criarTreino(Navegador conta, long jogador, String observacoes) throws Exception {
        return id(api.perform(post("/api/treinos").session(conta.sessao()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("jogadorId", jogador, "data", "2026-11-18", "duracaoMinutos", 30,
                        "observacoes", observacoes, "arremessos", java.util.List.of(java.util.Map.of("zona", "TOPO_DO_ARCO", "tentativas", 10, "acertos", 5)))))), "/sessao/id");
    }

    private long jogador(String nome) throws Exception {
        return id(api.perform(post("/api/jogadores").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"%s\"}".formatted(nome))), "/id");
    }

    private long treino(long jogador, String data, String zonas) throws Exception {
        return id(api.perform(post("/api/treinos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(treinoJson(jogador, data, zonas))), "/sessao/id");
    }

    private long id(ResultActions result, String pointer) throws Exception {
        var response = result.andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andReturn().getResponse();
        return json.readTree(response.getContentAsByteArray()).at(pointer).asLong();
    }

    private static String treinoJson(long jogador, String data, String zonas) {
        return """
                {"jogadorId":%d,"data":"%s","duracaoMinutos":45,"arremessos":%s}
                """.formatted(jogador, data, zonas);
    }

    private static String arremessoJson(long treino, String zona, int tentativas, int acertos) {
        return """
                {"treinoId":%d,"zona":"%s","tentativas":%d,"acertos":%d}
                """.formatted(treino, zona, tentativas, acertos);
    }

    private static void executarDdl(String sql) throws SQLException {
        try (var conexao = DriverManager.getConnection(URL, USER, PASSWORD);
             var comando = conexao.createStatement()) {
            comando.execute(sql);
        }
    }
}
