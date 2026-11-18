package br.com.curry.controller;

import br.com.curry.dto.TreinoDto;
import br.com.curry.service.TreinoService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/treinos")
public class TreinoController {
    private final TreinoService service;

    public TreinoController(TreinoService service) {
        this.service = service;
    }

    @GetMapping
    public List<TreinoDto.Sessao> listar(@RequestParam(required = false) @Positive Long jogadorId) {
        return service.listar(jogadorId);
    }

    @GetMapping("/{id}")
    public TreinoDto.Detalhe consultar(@PathVariable @Positive long id) {
        return service.consultar(id);
    }

    @PostMapping
    public ResponseEntity<TreinoDto.Detalhe> criar(@Valid @RequestBody TreinoDto.Entrada entrada) {
        var treino = service.criar(entrada);
        return ResponseEntity.created(URI.create("/api/treinos/" + treino.sessao().id())).body(treino);
    }

    @PutMapping("/{id}")
    public TreinoDto.Detalhe atualizar(@PathVariable @Positive long id, @Valid @RequestBody TreinoDto.Entrada entrada) {
        return service.atualizar(id, entrada);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable @Positive long id) {
        service.excluir(id);
    }
}
