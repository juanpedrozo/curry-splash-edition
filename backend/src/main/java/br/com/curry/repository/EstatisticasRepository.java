package br.com.curry.repository;

import br.com.curry.dto.EstatisticasDto;
import br.com.curry.security.UsuarioAtual;
import br.com.curry.dto.TreinoDto;
import br.com.curry.entity.Zona;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class EstatisticasRepository {
    private final JdbcClient jdbc;

    private final UsuarioAtual atual;

    public EstatisticasRepository(JdbcClient jdbc, UsuarioAtual atual) {
        this.atual = atual;
        this.jdbc = jdbc;
    }

    public List<TreinoDto.Sessao> sessoes(Long jogadorId, Long treinoId, boolean recentesPrimeiro, Integer limite) {
        String ordem = recentesPrimeiro ? "v.data_treino DESC, v.id DESC" : "v.data_treino, v.id";
        return jdbc.sql("""
                SELECT v.id, v.jogador_id, j.nome AS jogador_nome, v.data_treino, t.duracao_minutos,
                       t.observacoes, t.criado_em, v.tentativas, v.acertos, v.percentual
                FROM vw_treino_totais v
                JOIN treinos t ON t.id = v.id
                JOIN jogadores j ON j.id = v.jogador_id
                WHERE j.usuario_id = :usuarioId
                  AND (:jogadorId IS NULL OR v.jogador_id = :jogadorId)
                  AND (:treinoId IS NULL OR v.id = :treinoId)
                ORDER BY %s
                LIMIT :limite
                """.formatted(ordem))
                .param("usuarioId", atual.id())
                .param("jogadorId", jogadorId, Types.BIGINT)
                .param("treinoId", treinoId, Types.BIGINT)
                .param("limite", limite, Types.INTEGER)
                .query((rs, n) -> new TreinoDto.Sessao(
                        rs.getLong("id"), rs.getLong("jogador_id"), rs.getString("jogador_nome"),
                        rs.getObject("data_treino", LocalDate.class), rs.getInt("duracao_minutos"),
                        rs.getString("observacoes"), rs.getObject("criado_em", LocalDateTime.class),
                        rs.getLong("tentativas"), rs.getLong("acertos"), rs.getBigDecimal("percentual")))
                .list();
    }

    public EstatisticasDto.Totais totais(long jogadorId) {
        return jdbc.sql("SELECT * FROM vw_jogador_totais WHERE jogador_id = :id")
                .param("id", jogadorId)
                .query((rs, n) -> totais(rs))
                .single();
    }

    public List<EstatisticasDto.ZonaTotal> zonas(long jogadorId) {
        return jdbc.sql("SELECT * FROM vw_jogador_zonas WHERE jogador_id = :id")
                .param("id", jogadorId)
                .query((rs, n) -> zona(rs))
                .list();
    }

    public Optional<EstatisticasDto.ZonaTotal> melhorZona(long jogadorId) {
        return jdbc.sql("SELECT * FROM vw_jogador_melhor_zona WHERE jogador_id = :id")
                .param("id", jogadorId)
                .query((rs, n) -> zona(rs))
                .optional();
    }

    public List<EstatisticasDto.Ponto> evolucao(long jogadorId) {
        return jdbc.sql("SELECT * FROM vw_jogador_evolucao WHERE jogador_id = :id ORDER BY data_treino")
                .param("id", jogadorId)
                .query((rs, n) -> new EstatisticasDto.Ponto(rs.getObject("data_treino", LocalDate.class),
                        rs.getLong("total_treinos"), rs.getLong("tentativas"), rs.getLong("acertos"),
                        rs.getBigDecimal("percentual")))
                .list();
    }

    public List<EstatisticasDto.Ranking> ranking() {
        return jdbc.sql("""
                WITH resultados AS (
                    SELECT j.id, j.nome, j.apelido, j.posicao, v.total_treinos, v.tentativas, v.acertos,
                           v.percentual, v.acertos::numeric / NULLIF(v.tentativas, 0) AS taxa
                    FROM jogadores j
                    JOIN vw_jogador_totais v ON v.jogador_id = j.id
                    WHERE j.usuario_id IS NOT NULL
                )
                SELECT r.*,
                       CASE WHEN r.taxa IS NOT NULL THEN
                           RANK() OVER (ORDER BY r.taxa DESC NULLS LAST)::integer
                       END AS colocacao,
                       m.zona, m.tentativas AS zona_tentativas, m.acertos AS zona_acertos,
                       m.percentual AS zona_percentual
                FROM resultados r
                LEFT JOIN vw_jogador_melhor_zona m ON m.jogador_id = r.id
                ORDER BY r.taxa DESC NULLS LAST, r.tentativas DESC, r.nome, r.id
                """).query((rs, n) -> {
            String zona = rs.getString("zona");
            EstatisticasDto.ZonaTotal melhorZona = null;
            if (zona != null) {
                melhorZona = new EstatisticasDto.ZonaTotal(Zona.valueOf(zona), rs.getLong("zona_tentativas"),
                        rs.getLong("zona_acertos"), rs.getBigDecimal("zona_percentual"));
            }
            return new EstatisticasDto.Ranking(rs.getObject("colocacao", Integer.class), rs.getLong("id"),
                    rs.getString("nome"), rs.getString("apelido"), rs.getString("posicao"),
                    totais(rs), melhorZona);
        }).list();
    }

    private EstatisticasDto.Totais totais(ResultSet rs) throws SQLException {
        return new EstatisticasDto.Totais(rs.getLong("total_treinos"), rs.getLong("tentativas"),
                rs.getLong("acertos"), rs.getBigDecimal("percentual"));
    }

    private EstatisticasDto.ZonaTotal zona(ResultSet rs) throws SQLException {
        return new EstatisticasDto.ZonaTotal(Zona.valueOf(rs.getString("zona")), rs.getLong("tentativas"),
                rs.getLong("acertos"), rs.getBigDecimal("percentual"));
    }
}
