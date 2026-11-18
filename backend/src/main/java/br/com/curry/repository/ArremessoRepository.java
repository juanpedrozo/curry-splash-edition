package br.com.curry.repository;

import br.com.curry.entity.Arremesso;
import br.com.curry.entity.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ArremessoRepository extends JpaRepository<Arremesso, Long> {
    List<Arremesso> findByTreino_Id(long treinoId);

    boolean existsByTreino_IdAndZona(long treinoId, Zona zona);

    @Query("select a.treino.id from Arremesso a where a.id = :id")
    Optional<Long> findTreinoId(long id);

    @Query("""
            select a from Arremesso a join a.treino t
            where (:treinoId is null or t.id = :treinoId)
              and (:jogadorId is null or t.jogador.id = :jogadorId)
            order by t.data desc, t.id desc, a.id
            """)
    List<Arremesso> listar(Long treinoId, Long jogadorId);
}
