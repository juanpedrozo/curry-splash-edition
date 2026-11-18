package br.com.curry.dto;

import br.com.curry.dto.ArremessoDto.Dados;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class TreinoDto {
    private TreinoDto() {}

    public record Entrada(
            @NotNull(message = "Selecione um jogador.") @Positive Long jogadorId,
            @NotNull(message = "Informe a data do treino.") LocalDate data,
            @NotNull(message = "Informe a duração.") @Positive Integer duracaoMinutos,
            @Size(max = 4000) String observacoes,
            @Size(max = 5, message = "O limite é de cinco zonas por treino.")
            List<@NotNull @Valid Dados> arremessos
    ) {}

    public record Sessao(long id, long jogadorId, String jogadorNome, LocalDate data, int duracaoMinutos,
                         String observacoes, LocalDateTime criadoEm, long tentativas, long acertos,
                         BigDecimal percentual) {}

    public record Detalhe(Sessao sessao, List<ArremessoDto.Saida> arremessos) {}
}
