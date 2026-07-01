package tup.subastas.proyecto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tup.subastas.proyecto.entity.*;
import tup.subastas.proyecto.enums.EstadoSubasta;
import tup.subastas.proyecto.repository.*;
import tup.subastas.proyecto.service.EmailService;
import tup.subastas.proyecto.service.PujaService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PujaServiceTest {

    @Mock SubastaRepository subastaRepository;
    @Mock PujaRepository pujaRepository;
    @Mock EmailService emailService;

    @InjectMocks PujaService pujaService;

    private Usuario vendedor;
    private Usuario comprador;
    private Subasta subasta;
    private Producto producto;

    @BeforeEach
    void setUp() {
        vendedor = new Usuario();
        vendedor.setId(1L);
        vendedor.setEmail("vendedor@test.com");
        vendedor.setBloqueado(false);

        comprador = new Usuario();
        comprador.setId(2L);
        comprador.setEmail("comprador@test.com");
        comprador.setBloqueado(false);

        producto = new Producto();
        producto.setId(1L);
        producto.setTitulo("Camiseta Test");

        subasta = new Subasta();
        subasta.setId(1L);
        subasta.setVendedor(vendedor);
        subasta.setProducto(producto);
        subasta.setEstado(EstadoSubasta.ACTIVA);
        subasta.setPrecioBase(BigDecimal.valueOf(100));
        subasta.setMontoActual(BigDecimal.valueOf(100));
        subasta.setIncrementoMinimo(BigDecimal.valueOf(10));
        subasta.setFechaCierre(LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        subasta.setVersion(0L);
    }

    @Test
    void pujar_exitosoConMontoValido() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(subastaRepository.save(any())).thenReturn(subasta);
        when(pujaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Puja result = pujaService.pujar(1L, comprador, BigDecimal.valueOf(110));

        assertEquals(BigDecimal.valueOf(110), result.getMonto());
        assertEquals(comprador, result.getUsuario());
        verify(subastaRepository).save(any());
        verify(emailService).notificarNuevaPuja(anyString(), anyString(), anyString());
    }

    @Test
    void pujar_fallaMontoInsuficiente() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> pujaService.pujar(1L, comprador, BigDecimal.valueOf(105)));
        assertTrue(ex.getMessage().contains("mínimo"));
    }

    @Test
    void pujar_fallaSubastaInactiva() {
        subasta.setEstado(EstadoSubasta.FINALIZADA);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> pujaService.pujar(1L, comprador, BigDecimal.valueOf(200)));
        assertTrue(ex.getMessage().contains("no está activa"));
    }

    @Test
    void pujar_fallaVendedorPujaEnPropia() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> pujaService.pujar(1L, vendedor, BigDecimal.valueOf(200)));
        assertTrue(ex.getMessage().contains("vendedor"));
    }

    @Test
    void pujar_fallaUsuarioBloqueado() {
        comprador.setBloqueado(true);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> pujaService.pujar(1L, comprador, BigDecimal.valueOf(200)));
        assertTrue(ex.getMessage().contains("bloqueada"));
    }

    @Test
    void pujar_fallaSubastaCerrada() {
        subasta.setFechaCierre(LocalDateTime.now(ZoneOffset.UTC).minusHours(1));
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> pujaService.pujar(1L, comprador, BigDecimal.valueOf(200)));
        assertTrue(ex.getMessage().contains("cerró"));
    }

    @Test
    void pujar_fallaSubastaNoExiste() {
        when(subastaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> pujaService.pujar(99L, comprador, BigDecimal.valueOf(200)));
    }

    @Test
    void pujar_montoExactoMinimo_exitoso() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(subastaRepository.save(any())).thenReturn(subasta);
        when(pujaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Puja result = pujaService.pujar(1L, comprador, BigDecimal.valueOf(110));

        assertEquals(BigDecimal.valueOf(110), result.getMonto());
    }

    @Test
    void pujar_actualizaMontoActualSubasta() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(subastaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(pujaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        pujaService.pujar(1L, comprador, BigDecimal.valueOf(150));

        assertEquals(BigDecimal.valueOf(150), subasta.getMontoActual());
    }
}
