package br.com.curry.controller;

import br.com.curry.dto.ArremessoDto;
import br.com.curry.service.ArremessoService;
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
@RequestMapping("/api/arremessos")
public class ArremessoController {
    private final ArremessoService service;

    public ArremessoController(ArremessoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ArremessoDto.Saida> listar(@RequestParam(required = false) @Positive Long treinoId,
                                         @RequestParam(required = false) @Positive Long jogadorId) {
        return service.listar(treinoId, jogadorId);
    }

    @GetMapping("/{id}")
    public ArremessoDto.Saida consultar(@PathVariable @Positive long id) {
        return service.consultar(id);
    }

    @PostMapping
    public ResponseEntity<ArremessoDto.Saida> criar(@Valid @RequestBody ArremessoDto.Entrada entrada) {
        var arremesso = service.criar(entrada);
        return ResponseEntity.created(URI.create("/api/arremessos/" + arremesso.id())).body(arremesso);
    }

    @PutMapping("/{id}")
    public ArremessoDto.Saida atualizar(@PathVariable @Positive long id,
                                       @Valid @RequestBody ArremessoDto.Entrada entrada) {
        return service.atualizar(id, entrada);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable @Positive long id) {
        service.excluir(id);
    }
}
