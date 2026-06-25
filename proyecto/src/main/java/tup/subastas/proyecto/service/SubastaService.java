package tup.subastas.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tup.subastas.proyecto.dto.SubastaEditRequest;
import tup.subastas.proyecto.entity.*;
import tup.subastas.proyecto.enums.EstadoSubasta;
import tup.subastas.proyecto.repository.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubastaService {

    private final SubastaRepository subastaRepository;
    private final PujaRepository pujaRepository;
    private final HistorialEstadoRepository historialEstadoRepository;
    private final NotificacionRepository notificacionRepository;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void procesarSubastas() {
        LocalDateTime ahora = LocalDateTime.now(ZoneOffset.UTC);

        // PUBLICADA → ACTIVA si llegó la fecha de inicio
        List<Subasta> paraActivar = subastaRepository
                .findByEstadoAndFechaInicioBefore(EstadoSubasta.PUBLICADA, ahora);
        for (Subasta s : paraActivar) {
            try {
                registrarCambioEstado(s, EstadoSubasta.ACTIVA, null, "Inicio automático por fecha");
                s.setEstado(EstadoSubasta.ACTIVA);
                subastaRepository.save(s);
            } catch (ObjectOptimisticLockingFailureException e) {
                // reintento en próximo barrido
            }
        }

        // ACTIVA → ADJUDICADA o FINALIZADA si pasó la fecha de cierre
        List<Subasta> paraCerrar = subastaRepository
                .findByEstadoAndFechaCierreBefore(EstadoSubasta.ACTIVA, ahora);
        for (Subasta s : paraCerrar) {
            try {
                cerrarSubasta(s);
            } catch (ObjectOptimisticLockingFailureException e) {
                // reintento en próximo barrido
            }
        }
    }

    private void cerrarSubasta(Subasta subasta) {
        Optional<Puja> mejorPuja = pujaRepository.findTopBySubastaOrderByMontoDesc(subasta);

        EstadoSubasta estadoNuevo;

        if (mejorPuja.isPresent()) {
            subasta.setGanador(mejorPuja.get().getUsuario());
            subasta.setPrecioFinal(mejorPuja.get().getMonto());
            estadoNuevo = EstadoSubasta.ADJUDICADA;

            // Notificación al ganador
            notificar(subasta.getGanador(), subasta,
                "¡Ganaste la subasta: " + subasta.getProducto().getTitulo() + "!");

            // Notificación al vendedor
            notificar(subasta.getVendedor(), subasta,
                "Tu subasta '" + subasta.getProducto().getTitulo() + "' fue adjudicada.");
        } else {
            estadoNuevo = EstadoSubasta.FINALIZADA;
            notificar(subasta.getVendedor(), subasta,
                "Tu subasta '" + subasta.getProducto().getTitulo() + "' finalizó sin pujas.");
        }

        registrarCambioEstado(subasta, estadoNuevo, null, "Cierre automático por fecha");
        subasta.setEstado(estadoNuevo);
        subastaRepository.save(subasta);
    }

    @Transactional
    public Subasta publicar(Long subastaId, Usuario vendedor) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));
        if (!subasta.getVendedor().getId().equals(vendedor.getId()))
            throw new RuntimeException("No autorizado");
        if (subasta.getEstado() != EstadoSubasta.BORRADOR)
            throw new RuntimeException("Solo se pueden publicar subastas en BORRADOR");
        if (!subasta.getFechaCierre().isAfter(subasta.getFechaInicio()))
            throw new RuntimeException("La fecha de cierre debe ser posterior a la de inicio");

        registrarCambioEstado(subasta, EstadoSubasta.PUBLICADA, vendedor, "Publicada por el vendedor");
        subasta.setEstado(EstadoSubasta.PUBLICADA);
        return subastaRepository.save(subasta);
    }

    @Transactional
    public Subasta cancelar(Long subastaId, Usuario actor, String motivo) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        EstadoSubasta estado = subasta.getEstado();
        if (estado == EstadoSubasta.FINALIZADA || estado == EstadoSubasta.ADJUDICADA)
            throw new RuntimeException("No se puede cancelar una subasta ya cerrada");

        boolean tieneRolAdmin = actor.getRoles().stream()
                .anyMatch(r -> r.getNombre().name().equals("ADMIN"));

        boolean tienePujas = pujaRepository.findTopBySubastaOrderByMontoDesc(subasta).isPresent();

        if (!tieneRolAdmin) {
            if (!subasta.getVendedor().getId().equals(actor.getId()))
                throw new RuntimeException("No autorizado");
            if (tienePujas)
                throw new RuntimeException("No podés cancelar una subasta que ya tiene pujas. Contactá al administrador.");
        }

        registrarCambioEstado(subasta, EstadoSubasta.CANCELADA, actor, motivo);
        subasta.setEstado(EstadoSubasta.CANCELADA);
        return subastaRepository.save(subasta);
    }

    @Transactional
    public Subasta editar(Long subastaId, tup.subastas.proyecto.dto.SubastaEditRequest req, Usuario actor) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));
        if (!subasta.getVendedor().getId().equals(actor.getId()))
            throw new RuntimeException("No autorizado");
        if (subasta.getEstado() != EstadoSubasta.BORRADOR &&
            subasta.getEstado() != EstadoSubasta.PUBLICADA)
            throw new RuntimeException("Solo se pueden editar subastas en BORRADOR o PUBLICADA");
        if (!req.getFechaCierre().isAfter(req.getFechaInicio()))
            throw new RuntimeException("La fecha de cierre debe ser posterior a la de inicio");
        subasta.setPrecioBase(req.getPrecioBase());
        subasta.setMontoActual(req.getPrecioBase());
        subasta.setIncrementoMinimo(req.getIncrementoMinimo());
        subasta.setFechaInicio(req.getFechaInicio());
        subasta.setFechaCierre(req.getFechaCierre());
        return subastaRepository.save(subasta);
    }

    public List<Subasta> listarActivas() {
        return subastaRepository.findByEstado(EstadoSubasta.ACTIVA);
    }

    public List<Subasta> listarTodas() {
        return subastaRepository.findAll();
    }

    private void registrarCambioEstado(Subasta subasta, EstadoSubasta nuevo, Usuario actor, String motivo) {
        HistorialEstado h = new HistorialEstado();
        h.setSubasta(subasta);
        h.setEstadoAnterior(subasta.getEstado());
        h.setEstadoNuevo(nuevo);
        h.setUsuario(actor);
        h.setMotivo(motivo);
        historialEstadoRepository.save(h);
    }

    private void notificar(Usuario usuario, Subasta subasta, String mensaje) {
        Notificacion n = new Notificacion();
        n.setUsuario(usuario);
        n.setSubasta(subasta);
        n.setMensaje(mensaje);
        notificacionRepository.save(n);
    }
}
