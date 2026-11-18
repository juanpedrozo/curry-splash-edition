package br.com.curry.controller;

import br.com.curry.dto.EstatisticasDto;
import br.com.curry.service.EstatisticasService;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estatisticas")
public class EstatisticasController {
    private final EstatisticasService service;

    public EstatisticasController(EstatisticasService service) {
        this.service = service;
    }

    @GetMapping("/jogadores/{id}/resumo")
    public EstatisticasDto.Resumo resumo(@PathVariable @Positive long id) {
        return service.resumo(id);
    }

    @GetMapping("/jogadores/{id}/zonas")
    public List<EstatisticasDto.ZonaTotal> zonas(@PathVariable @Positive long id) {
        return service.zonas(id);
    }

    @GetMapping("/jogadores/{id}/evolucao")
    public EstatisticasDto.Evolucao evolucao(@PathVariable @Positive long id) {
        return service.evolucao(id);
    }

    @GetMapping("/ranking")
    public List<EstatisticasDto.Ranking> ranking() {
        return service.ranking();
    }
}
