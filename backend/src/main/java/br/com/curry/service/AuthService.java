package br.com.curry.service;

import br.com.curry.dto.AuthDto;
import br.com.curry.entity.Usuario;
import br.com.curry.exception.CampoInvalidoException;
import br.com.curry.exception.ConflitoException;
import br.com.curry.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder senhas;
    public AuthService(UsuarioRepository usuarios, PasswordEncoder senhas) {
        this.usuarios = usuarios;
        this.senhas = senhas;
    }

    @Transactional
    public AuthDto.Conta cadastrar(AuthDto.Cadastro entrada) {
        validarSenha(entrada.senha());
        String email = normalizarEmail(entrada.email());
        if (usuarios.existsByEmail(email)) throw new ConflitoException("Este e-mail já está cadastrado. Entre na sua conta.");
        Usuario usuario = usuarios.saveAndFlush(new Usuario(entrada.nome().strip(), email, senhas.encode(entrada.senha())));
        return saida(usuario);
    }

    public static void validarSenha(String senha) {
        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new CampoInvalidoException("senha", "Use uma senha com até 72 bytes, considerando acentos e símbolos.");
        }
    }
    public static String normalizarEmail(String email) { return email.strip().toLowerCase(Locale.ROOT); }
    public static AuthDto.Conta saida(Usuario usuario) {
        return new AuthDto.Conta(usuario.getId(), usuario.getNome(), usuario.getEmail());
    }
}
