package br.com.curry.dto;

import jakarta.validation.constraints.*;

public final class AuthDto {
    private AuthDto() {}

    public record Cadastro(
            @NotBlank(message = "Informe seu nome.") @Size(max = 120) String nome,
            @NotBlank(message = "Informe seu e-mail.") @Email(message = "Informe um e-mail válido.")
            @Size(max = 254) String email,
            @NotBlank(message = "Informe uma senha.")
            @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.") String senha) {}

    public record Login(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 72) String senha) {}

    public record Conta(long id, String nome, String email) {}
    public record Csrf(String token, String headerName) {}
}
