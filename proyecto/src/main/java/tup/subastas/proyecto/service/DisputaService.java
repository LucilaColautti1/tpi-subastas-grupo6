package tup.subastas.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tup.subastas.proyecto.dto.ResolucionDisputaRequest;
import tup.subastas.proyecto.entity.*;
import tup.subastas.proyecto.enums.EstadoSubasta;
import tup.subastas.proyecto.repository.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class DisputaService {

    private final DisputaRepository disputaRepository;
    private final SubastaRepository subastaRepository;
    private final HistorialEstadoRepository historialEstadoRepository;
    private final EmailService emailService;

    @Transactional
    public Disputa abrir(Long subastaId, Usuario iniciador, String motivo, String descripcion) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        if (subasta.getEstado() != EstadoSubasta.ADJUDICADA)
            throw new RuntimeException("Solo se puede disputar una subasta ADJUDICADA");

        boolean esVendedor = subasta.getVendedor().getId().equals(iniciador.getId());
        boolean esGanador = subasta.getGanador() != null &&
                subasta.getGanador().getId().equals(iniciador.getId());
        if (!esVendedor && !esGanador)
            throw new RuntimeException("Solo el vendedor o el ganador pueden abrir una disputa");

        if (disputaRepository.findBySubasta(subasta).isPresent())
            throw new RuntimeException("Ya existe una disputa para esta subasta");

        Disputa disputa = new Disputa();
        disputa.setSubasta(subasta);
        disputa.setIniciador(iniciador);
        disputa.setMotivo(motivo);
        disputa.setDescripcion(descripcion);

        registrarCambioEstado(subasta, EstadoSubasta.EN_DISPUTA, iniciador, "Disputa abierta: " + motivo);
        subasta.setEstado(EstadoSubasta.EN_DISPUTA);
        subastaRepository.save(subasta);

        Disputa guardada = disputaRepository.save(disputa);
        emailService.notificarDisputaAbierta(subasta.getVendedor().getEmail(),
            subasta.getProducto().getTitulo(), motivo);
        return guardada;
    }

    @Transactional
    public Disputa resolver(Long disputaId, Usuario admin, ResolucionDisputaRequest req) {
        Disputa disputa = disputaRepository.findById(disputaId)
                .orElseThrow(() -> new RuntimeException("Disputa no encontrada"));

        Subasta subasta = disputa.getSubasta();
        if (subasta.getEstado() != EstadoSubasta.EN_DISPUTA)
            throw new RuntimeException("La subasta no está EN_DISPUTA");

        EstadoSubasta estadoFinal = req.getEstadoFinal();
        if (estadoFinal != EstadoSubasta.ADJUDICADA &&
            estadoFinal != EstadoSubasta.FINALIZADA &&
            estadoFinal != EstadoSubasta.CANCELADA)
            throw new RuntimeException("Estado final inválido para resolución de disputa");

        disputa.setResolutor(admin);
        disputa.setResolucionAdmin(req.getResolucion());
        disputa.setFechaResolucion(LocalDateTime.now(ZoneOffset.UTC));

        registrarCambioEstado(subasta, estadoFinal, admin, "Disputa resuelta: " + req.getResolucion());
        subasta.setEstado(estadoFinal);
        subastaRepository.save(subasta);

        Disputa resuelta = disputaRepository.save(disputa);

        // Notificar por email al vendedor y al ganador
        emailService.notificarDisputaResuelta(subasta.getVendedor().getEmail(),
            subasta.getProducto().getTitulo(), req.getResolucion(), estadoFinal.name());
        if (subasta.getGanador() != null) {
            emailService.notificarDisputaResuelta(subasta.getGanador().getEmail(),
                subasta.getProducto().getTitulo(), req.getResolucion(), estadoFinal.name());
        }

        return resuelta;
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
}
