package tup.subastas.proyecto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tup.subastas.proyecto.dto.ResolucionDisputaRequest;
import tup.subastas.proyecto.entity.*;
import tup.subastas.proyecto.enums.EstadoSubasta;
import tup.subastas.proyecto.repository.*;
import tup.subastas.proyecto.service.DisputaService;
import tup.subastas.proyecto.service.EmailService;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DisputaServiceTest {

    @Mock DisputaRepository disputaRepository;
    @Mock SubastaRepository subastaRepository;
    @Mock HistorialEstadoRepository historialEstadoRepository;
    @Mock EmailService emailService;

    @InjectMocks DisputaService disputaService;

    private Usuario vendedor;
    private Usuario ganador;
    private Usuario admin;
    private Usuario otro;
    private Subasta subasta;
    private Producto producto;

    @BeforeEach
    void setUp() {
        vendedor = new Usuario();
        vendedor.setId(1L);
        vendedor.setEmail("vendedor@test.com");

        ganador = new Usuario();
        ganador.setId(2L);
        ganador.setEmail("ganador@test.com");

        admin = new Usuario();
        admin.setId(99L);

        otro = new Usuario();
        otro.setId(50L);

        producto = new Producto();
        producto.setId(1L);
        producto.setTitulo("Camiseta Test");

        subasta = new Subasta();
        subasta.setId(1L);
        subasta.setVendedor(vendedor);
        subasta.setGanador(ganador);
        subasta.setProducto(producto);
        subasta.setEstado(EstadoSubasta.ADJUDICADA);
        subasta.setPrecioFinal(BigDecimal.valueOf(500));
    }

    @Test
    void abrir_vendedorPuedeDisputar() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(disputaRepository.findBySubasta(any())).thenReturn(Optional.empty());
        when(disputaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(subastaRepository.save(any())).thenReturn(subasta);

        Disputa resultado = disputaService.abrir(1L, vendedor, "Pago no recibido", "No me pagaron");

        assertNotNull(resultado);
        assertEquals("Pago no recibido", resultado.getMotivo());
        assertEquals(EstadoSubasta.EN_DISPUTA, subasta.getEstado());
        verify(emailService).notificarDisputaAbierta(anyString(), anyString(), anyString());
    }

    @Test
    void abrir_ganadorPuedeDisputar() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(disputaRepository.findBySubasta(any())).thenReturn(Optional.empty());
        when(disputaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(subastaRepository.save(any())).thenReturn(subasta);

        Disputa resultado = disputaService.abrir(1L, ganador, "Producto distinto", "No es lo que mostraba");

        assertNotNull(resultado);
    }

    @Test
    void abrir_fallaUsuarioNoInvolucrado() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        assertThrows(RuntimeException.class,
            () -> disputaService.abrir(1L, otro, "Motivo", "Desc"));
    }

    @Test
    void abrir_fallaSiNoEstaAdjudicada() {
        subasta.setEstado(EstadoSubasta.ACTIVA);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> disputaService.abrir(1L, vendedor, "Motivo", "Desc"));
        assertTrue(ex.getMessage().contains("ADJUDICADA"));
    }

    @Test
    void abrir_fallaDisputaYaExiste() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(disputaRepository.findBySubasta(any())).thenReturn(Optional.of(new Disputa()));

        assertThrows(RuntimeException.class,
            () -> disputaService.abrir(1L, vendedor, "Motivo", "Desc"));
    }

    @Test
    void resolver_exitoso() {
        Disputa disputa = new Disputa();
        disputa.setId(1L);
        disputa.setSubasta(subasta);
        subasta.setEstado(EstadoSubasta.EN_DISPUTA);

        ResolucionDisputaRequest req = new ResolucionDisputaRequest();
        req.setResolucion("Se resuelve a favor del comprador");
        req.setEstadoFinal(EstadoSubasta.CANCELADA);

        when(disputaRepository.findById(1L)).thenReturn(Optional.of(disputa));
        when(disputaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(subastaRepository.save(any())).thenReturn(subasta);

        Disputa resultado = disputaService.resolver(1L, admin, req);

        assertNotNull(resultado.getResolucionAdmin());
        assertEquals(EstadoSubasta.CANCELADA, subasta.getEstado());
    }

    @Test
    void resolver_fallaEstadoFinalInvalido() {
        Disputa disputa = new Disputa();
        disputa.setId(1L);
        disputa.setSubasta(subasta);
        subasta.setEstado(EstadoSubasta.EN_DISPUTA);

        ResolucionDisputaRequest req = new ResolucionDisputaRequest();
        req.setResolucion("Resolución");
        req.setEstadoFinal(EstadoSubasta.ACTIVA);

        when(disputaRepository.findById(1L)).thenReturn(Optional.of(disputa));

        assertThrows(RuntimeException.class,
            () -> disputaService.resolver(1L, admin, req));
    }

    @Test
    void resolver_fallaSiNoEstaEnDisputa() {
        Disputa disputa = new Disputa();
        disputa.setId(1L);
        disputa.setSubasta(subasta);
        subasta.setEstado(EstadoSubasta.ADJUDICADA);

        ResolucionDisputaRequest req = new ResolucionDisputaRequest();
        req.setResolucion("Resolución");
        req.setEstadoFinal(EstadoSubasta.CANCELADA);

        when(disputaRepository.findById(1L)).thenReturn(Optional.of(disputa));

        assertThrows(RuntimeException.class,
            () -> disputaService.resolver(1L, admin, req));
    }
}
