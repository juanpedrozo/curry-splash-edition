package br.com.curry.repository;

import br.com.curry.entity.Jogador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JogadorRepository extends JpaRepository<Jogador, Long> {
    List<Jogador> findAllByOrderByNomeAscIdAsc();
}
