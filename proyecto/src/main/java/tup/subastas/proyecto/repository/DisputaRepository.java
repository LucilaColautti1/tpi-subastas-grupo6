package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Disputa;
import tup.subastas.proyecto.entity.Subasta;
import tup.subastas.proyecto.entity.Usuario;

import java.util.List;
import java.util.Optional;

public interface DisputaRepository extends JpaRepository<Disputa, Long> {
    Optional<Disputa> findBySubasta(Subasta subasta);
    List<Disputa> findByIniciador(Usuario iniciador);
}
