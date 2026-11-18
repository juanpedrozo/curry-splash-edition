package br.com.curry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class JogadorDto {
    private JogadorDto() {}

    public record Entrada(
            @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
            @Size(max = 60) String apelido,
            @Size(max = 30) String posicao
    ) {}

    public record Saida(long id, String nome, String apelido, String posicao, LocalDateTime criadoEm) {}
}
