package br.com.curry.repository;

import br.com.curry.entity.Treino;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface TreinoRepository extends JpaRepository<Treino, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Treino t where t.id = :id and t.jogador.usuario.id = :usuarioId")
    Optional<Treino> findLockedById(long id, long usuarioId);
}
