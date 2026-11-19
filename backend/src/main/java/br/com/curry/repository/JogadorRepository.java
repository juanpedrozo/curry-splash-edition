package br.com.curry.repository;

import br.com.curry.entity.Jogador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JogadorRepository extends JpaRepository<Jogador, Long> {
    List<Jogador> findByUsuario_IdOrderByNomeAscIdAsc(long usuarioId);
    Optional<Jogador> findByIdAndUsuario_Id(long id, long usuarioId);
}
