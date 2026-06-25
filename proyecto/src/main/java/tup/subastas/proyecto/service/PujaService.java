package tup.subastas.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tup.subastas.proyecto.entity.*;
import tup.subastas.proyecto.enums.EstadoSubasta;
import tup.subastas.proyecto.repository.*;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PujaService {

    private final SubastaRepository subastaRepository;
    private final PujaRepository pujaRepository;

    @Transactional
    public Puja pujar(Long subastaId, Usuario usuario, BigDecimal monto) {
        // Recarga siempre desde BD para tener el precio actualizado
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        if (subasta.getEstado() != EstadoSubasta.ACTIVA) {
            throw new RuntimeException("La subasta no está activa");
        }

        BigDecimal minimo = subasta.getMontoActual().add(subasta.getIncrementoMinimo());
        if (monto.compareTo(minimo) < 0) {
            throw new RuntimeException(
                "El monto mínimo para pujar es " + minimo
            );
        }

        if (subasta.getVendedor().getId().equals(usuario.getId())) {
            throw new RuntimeException("El vendedor no puede pujar en su propia subasta");
        }

        subasta.setMontoActual(monto);

        try {
            subastaRepository.save(subasta); // @Version lanza excepción si hubo conflicto
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new RuntimeException(
                "Otro usuario pujó al mismo tiempo. Recargá el precio actual y volvé a intentar."
            );
        }

        Puja puja = new Puja();
        puja.setSubasta(subasta);
        puja.setUsuario(usuario);
        puja.setMonto(monto);
        return pujaRepository.save(puja);
    }
}
