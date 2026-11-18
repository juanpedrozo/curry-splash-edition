package br.com.curry;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
    }

    @Test
    void crudJogadorEValidacao() throws Exception {
        api.perform(post("/api/jogadores").contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"  \"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.nome").exists());
        long id = jogador("Rafa");
        api.perform(get("/api/jogadores")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id));
        api.perform(get("/api/jogadores/{id}", id)).andExpect(status().isOk()).andExpect(jsonPath("$.criadoEm").exists());
        api.perform(put("/api/jogadores/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\" Rafael Lima \",\"apelido\":\"Rafa\",\"posicao\":\"Armador\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Rafael Lima"));
        api.perform(delete("/api/jogadores/{id}", id)).andExpect(status().isNoContent());
        api.perform(get("/api/jogadores/{id}", id)).andExpect(status().isNotFound());
        api.perform(get("/api/jogadores/-1")).andExpect(status().isBadRequest());
    }

    @Test
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
        api.perform(put("/api/treinos/{id}", treino).contentType(MediaType.APPLICATION_JSON)
                        .content(treinoJson(jogador, "2026-11-11", duplicado)))
                .andExpect(status().isBadRequest());
        api.perform(get("/api/treinos/{id}", treino)).andExpect(jsonPath("$.sessao.data").value("2026-11-10"));

        api.perform(put("/api/treinos/{id}", treino).contentType(MediaType.APPLICATION_JSON)
                        .content(treinoJson(jogador, "2026-11-12", """
                                [{"zona":"TOPO_DO_ARCO","tentativas":20,"acertos":11},
                                 {"zona":"CANTO_DIREITO","tentativas":12,"acertos":5}]
                                """)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.sessao.data").value("2026-11-12"))
                .andExpect(jsonPath("$.sessao.percentual").value(50))
                .andExpect(jsonPath("$.arremessos[0].id").value(zona));
        api.perform(put("/api/treinos/{id}", treino).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jogadorId\":%d,\"data\":\"2026-11-12\",\"duracaoMinutos\":38}".formatted(jogador)))
                .andExpect(jsonPath("$.arremessos", hasSize(2)));
        api.perform(put("/api/treinos/{id}", treino).contentType(MediaType.APPLICATION_JSON)
                        .content(treinoJson(jogador, "2026-11-12", "[]")))
                .andExpect(jsonPath("$.arremessos", hasSize(0)));
        api.perform(delete("/api/treinos/{id}", treino)).andExpect(status().isNoContent());
        api.perform(get("/api/treinos/{id}", treino)).andExpect(status().isNotFound());
    }

    @Test
    void crudArremessoValidaValoresEUnicidade() throws Exception {
        long jogador = jogador("Duda");
        long treino = treino(jogador, "2026-11-13", "[]");
        String valido = arremessoJson(treino, "ALA_ESQUERDA", 12, 6);
        api.perform(post("/api/arremessos").contentType(MediaType.APPLICATION_JSON)
                        .content(arremessoJson(treino, "ALA_ESQUERDA", 5, 6)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.acertos").exists());
        api.perform(post("/api/arremessos").contentType(MediaType.APPLICATION_JSON).content(
                        "{\"treinoId\":%d,\"zona\":\"ALA_ESQUERDA\",\"tentativas\":1.5,\"acertos\":0}".formatted(treino)))
                .andExpect(status().isBadRequest());
        long id = id(api.perform(post("/api/arremessos").contentType(MediaType.APPLICATION_JSON).content(valido)), "/id");
        api.perform(post("/api/arremessos").contentType(MediaType.APPLICATION_JSON).content(valido))
                .andExpect(status().isConflict());
        api.perform(get("/api/arremessos/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.percentual").value(50));
        api.perform(get("/api/arremessos").param("treinoId", Long.toString(treino)).param("jogadorId", Long.toString(jogador)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        api.perform(put("/api/arremessos/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content(arremessoJson(treino, "ALA_DIREITA", 0, 0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.percentual").value(nullValue()));
        api.perform(delete("/api/arremessos/{id}", id)).andExpect(status().isNoContent());
        api.perform(get("/api/arremessos/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
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

        api.perform(delete("/api/jogadores/{id}", jogador)).andExpect(status().isNoContent());
        assertThat(sql.queryForObject("SELECT COUNT(*) FROM treinos WHERE id = ?", Long.class, treino)).isZero();
        assertThat(sql.queryForObject("SELECT COUNT(*) FROM arremessos WHERE treino_id = ?", Long.class, treino)).isZero();
    }

    private long jogador(String nome) throws Exception {
        return id(api.perform(post("/api/jogadores").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"%s\"}".formatted(nome))), "/id");
    }

    private long treino(long jogador, String data, String zonas) throws Exception {
        return id(api.perform(post("/api/treinos").contentType(MediaType.APPLICATION_JSON)
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
