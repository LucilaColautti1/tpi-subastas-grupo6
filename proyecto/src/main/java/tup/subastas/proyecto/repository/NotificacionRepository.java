package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
}
