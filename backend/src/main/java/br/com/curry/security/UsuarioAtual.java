package br.com.curry.security;

import br.com.curry.entity.Usuario;
import br.com.curry.repository.UsuarioRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class UsuarioAtual {
    private final UsuarioRepository usuarios;
    public UsuarioAtual(UsuarioRepository usuarios) { this.usuarios = usuarios; }

    public Usuario conta() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw semSessao();
        return usuarios.findByEmail(auth.getName()).orElseThrow(UsuarioAtual::semSessao);
    }
    public long id() { return conta().getId(); }
    private static AuthenticationCredentialsNotFoundException semSessao() {
        return new AuthenticationCredentialsNotFoundException("Entre na sua conta para continuar.");
    }
}
