package br.com.curry.controller;

import br.com.curry.dto.JogadorDto;
import br.com.curry.service.JogadorService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/jogadores")
public class JogadorController {
    private final JogadorService service;

    public JogadorController(JogadorService service) {
        this.service = service;
    }

    @GetMapping
    public List<JogadorDto.Saida> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public JogadorDto.Saida consultar(@PathVariable @Positive long id) {
        return service.consultar(id);
    }

    @PostMapping
    public ResponseEntity<JogadorDto.Saida> criar(@Valid @RequestBody JogadorDto.Entrada entrada) {
        var jogador = service.criar(entrada);
        return ResponseEntity.created(URI.create("/api/jogadores/" + jogador.id())).body(jogador);
    }

    @PutMapping("/{id}")
    public JogadorDto.Saida atualizar(@PathVariable @Positive long id, @Valid @RequestBody JogadorDto.Entrada entrada) {
        return service.atualizar(id, entrada);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable @Positive long id) {
        service.excluir(id);
    }
}
