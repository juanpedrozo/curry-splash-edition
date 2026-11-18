package br.com.curry.dto;

import br.com.curry.entity.Zona;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class EstatisticasDto {
    private EstatisticasDto() {}

    public record Totais(long totalTreinos, long tentativas, long acertos, BigDecimal percentual) {}
    public record ZonaTotal(Zona zona, long tentativas, long acertos, BigDecimal percentual) {}
    public record Ponto(LocalDate data, long totalTreinos, long tentativas, long acertos, BigDecimal percentual) {}

    public record Resumo(JogadorDto.Saida jogador, Totais totais, ZonaTotal melhorZona,
                         List<TreinoDto.Sessao> ultimosTreinos) {}

    public record Evolucao(List<Ponto> pontos, List<TreinoDto.Sessao> sessoes, TreinoDto.Sessao melhorTreino,
                           BigDecimal variacaoPp, LocalDate dataInicial, LocalDate dataFinal) {}

    public record Ranking(Integer colocacao, long jogadorId, String nome, String apelido, String posicao,
                          Totais totais, ZonaTotal melhorZona) {}
}
