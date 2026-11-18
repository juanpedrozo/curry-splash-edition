package br.com.curry.dto;

import br.com.curry.entity.Zona;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public final class ArremessoDto {
    private ArremessoDto() {}

    public record Dados(
            @NotNull(message = "Selecione uma zona.") Zona zona,
            @NotNull(message = "Informe as tentativas.") @PositiveOrZero Integer tentativas,
            @NotNull(message = "Informe os acertos.") @PositiveOrZero Integer acertos
    ) {}

    public record Entrada(
            @NotNull(message = "Selecione um treino.") @Positive Long treinoId,
            @NotNull(message = "Selecione uma zona.") Zona zona,
            @NotNull(message = "Informe as tentativas.") @PositiveOrZero Integer tentativas,
            @NotNull(message = "Informe os acertos.") @PositiveOrZero Integer acertos
    ) {
        public Dados dados() { return new Dados(zona, tentativas, acertos); }
    }

    public record Saida(long id, long treinoId, Zona zona, int tentativas, int acertos, BigDecimal percentual) {}
}
