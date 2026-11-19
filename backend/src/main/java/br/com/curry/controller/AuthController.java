package br.com.curry.controller;

import br.com.curry.dto.AuthDto;
import br.com.curry.security.UsuarioAtual;
import br.com.curry.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final UsuarioAtual atual;
    private final AuthenticationManager manager;
    private final SessionAuthenticationStrategy sessions;
    private final SecurityContextRepository contexts;
    public AuthController(AuthService auth, UsuarioAtual atual, AuthenticationManager manager,
                          SessionAuthenticationStrategy sessions, SecurityContextRepository contexts) {
        this.auth = auth;
        this.atual = atual;
        this.manager = manager;
        this.sessions = sessions;
        this.contexts = contexts;
    }

    @GetMapping("/csrf")
    public AuthDto.Csrf csrf(CsrfToken token) { return new AuthDto.Csrf(token.getToken(), token.getHeaderName()); }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDto.Conta cadastrar(@Valid @RequestBody AuthDto.Cadastro entrada) { return auth.cadastrar(entrada); }

    @PostMapping("/login")
    public AuthDto.Conta login(@Valid @RequestBody AuthDto.Login entrada,
                              HttpServletRequest request, HttpServletResponse response) {
        AuthService.validarSenha(entrada.senha());
        var autenticacao = manager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(
                AuthService.normalizarEmail(entrada.email()), entrada.senha()));
        sessions.onAuthentication(autenticacao, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(autenticacao);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return AuthService.saida(atual.conta());
    }

    @GetMapping("/me")
    public AuthDto.Conta me() { return AuthService.saida(atual.conta()); }
}
