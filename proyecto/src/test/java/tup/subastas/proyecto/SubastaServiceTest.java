package tup.subastas.proyecto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tup.subastas.proyecto.entity.*;
import tup.subastas.proyecto.enums.EstadoSubasta;
import tup.subastas.proyecto.enums.NombreRol;
import tup.subastas.proyecto.repository.*;
import tup.subastas.proyecto.service.EmailService;
import tup.subastas.proyecto.service.SubastaService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubastaServiceTest {

    @Mock SubastaRepository subastaRepository;
    @Mock PujaRepository pujaRepository;
    @Mock HistorialEstadoRepository historialEstadoRepository;
    @Mock NotificacionRepository notificacionRepository;
    @Mock EmailService emailService;

    @InjectMocks SubastaService subastaService;

    private Usuario vendedor;
    private Usuario admin;
    private Subasta subasta;
    private Producto producto;

    @BeforeEach
    void setUp() {
        Rol rolSeller = new Rol();
        rolSeller.setNombre(NombreRol.SELLER);

        Rol rolAdmin = new Rol();
        rolAdmin.setNombre(NombreRol.ADMIN);

        vendedor = new Usuario();
        vendedor.setId(1L);
        vendedor.setNombre("Vendedor Test");
        vendedor.setEmail("vendedor@test.com");
        vendedor.setRoles(Set.of(rolSeller));

        admin = new Usuario();
        admin.setId(99L);
        admin.setNombre("Admin Test");
        admin.setEmail("admin@test.com");
        admin.setRoles(Set.of(rolAdmin));

        producto = new Producto();
        producto.setId(1L);
        producto.setTitulo("Camiseta Test");

        subasta = new Subasta();
        subasta.setId(1L);
        subasta.setVendedor(vendedor);
        subasta.setProducto(producto);
        subasta.setEstado(EstadoSubasta.BORRADOR);
        subasta.setPrecioBase(BigDecimal.valueOf(100));
        subasta.setMontoActual(BigDecimal.valueOf(100));
        subasta.setIncrementoMinimo(BigDecimal.valueOf(10));
        subasta.setFechaInicio(LocalDateTime.now().plusHours(1));
        subasta.setFechaCierre(LocalDateTime.now().plusDays(1));
        subasta.setVersion(0L);
    }

    // --- PUBLICAR ---

    @Test
    void publicar_exitoso() {
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(subastaRepository.save(any())).thenReturn(subasta);

        Subasta resultado = subastaService.publicar(1L, vendedor);

        assertEquals(EstadoSubasta.PUBLICADA, resultado.getEstado());
        verify(historialEstadoRepository).save(any());
    }

    @Test
    void publicar_fallaNoEsVendedor() {
        Usuario otro = new Usuario();
        otro.setId(2L);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> subastaService.publicar(1L, otro));
        assertEquals("No autorizado", ex.getMessage());
    }

    @Test
    void publicar_fallaSiNoEstaBorrador() {
        subasta.setEstado(EstadoSubasta.ACTIVA);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> subastaService.publicar(1L, vendedor));
        assertTrue(ex.getMessage().contains("BORRADOR"));
    }

    @Test
    void publicar_fallaFechaCierreAnteriorAInicio() {
        subasta.setFechaInicio(LocalDateTime.now().plusDays(2));
        subasta.setFechaCierre(LocalDateTime.now().plusDays(1));
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        assertThrows(RuntimeException.class, () -> subastaService.publicar(1L, vendedor));
    }

    @Test
    void publicar_fallaSubastaNoExiste() {
        when(subastaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> subastaService.publicar(99L, vendedor));
    }

    // --- CANCELAR ---

    @Test
    void cancelar_vendedorSinPujas_exitoso() {
        subasta.setEstado(EstadoSubasta.PUBLICADA);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(pujaRepository.findTopBySubastaOrderByMontoDesc(any())).thenReturn(Optional.empty());
        when(subastaRepository.save(any())).thenReturn(subasta);

        Subasta resultado = subastaService.cancelar(1L, vendedor, "No quiero vender");

        assertEquals(EstadoSubasta.CANCELADA, resultado.getEstado());
        verify(historialEstadoRepository).save(any());
    }

    @Test
    void cancelar_vendedorConPujas_falla() {
        subasta.setEstado(EstadoSubasta.ACTIVA);
        Puja puja = new Puja();
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(pujaRepository.findTopBySubastaOrderByMontoDesc(any())).thenReturn(Optional.of(puja));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> subastaService.cancelar(1L, vendedor, "Motivo"));
        assertTrue(ex.getMessage().contains("pujas"));
    }

    @Test
    void cancelar_adminConPujas_exitoso() {
        subasta.setEstado(EstadoSubasta.ACTIVA);
        Puja puja = new Puja();
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(pujaRepository.findTopBySubastaOrderByMontoDesc(any())).thenReturn(Optional.of(puja));
        when(subastaRepository.save(any())).thenReturn(subasta);

        Subasta resultado = subastaService.cancelar(1L, admin, "Fraude detectado");

        assertEquals(EstadoSubasta.CANCELADA, resultado.getEstado());
    }

    @Test
    void cancelar_fallaSiYaCerrada() {
        subasta.setEstado(EstadoSubasta.FINALIZADA);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        assertThrows(RuntimeException.class,
            () -> subastaService.cancelar(1L, vendedor, "Motivo"));
    }

    @Test
    void cancelar_fallaSiAdjudicada() {
        subasta.setEstado(EstadoSubasta.ADJUDICADA);
        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));

        assertThrows(RuntimeException.class,
            () -> subastaService.cancelar(1L, vendedor, "Motivo"));
    }

    @Test
    void cancelar_otroUsuarioNoAutorizado() {
        subasta.setEstado(EstadoSubasta.PUBLICADA);
        Usuario otro = new Usuario();
        otro.setId(50L);
        Rol rolUser = new Rol();
        rolUser.setNombre(NombreRol.USER);
        otro.setRoles(Set.of(rolUser));

        when(subastaRepository.findById(1L)).thenReturn(Optional.of(subasta));
        when(pujaRepository.findTopBySubastaOrderByMontoDesc(any())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> subastaService.cancelar(1L, otro, "Motivo"));
    }

    // --- LISTAR ---

    @Test
    void listarActivas_devuelveListaVacia() {
        when(subastaRepository.findByEstado(EstadoSubasta.ACTIVA)).thenReturn(java.util.List.of());

        var resultado = subastaService.listarActivas();

        assertTrue(resultado.isEmpty());
    }

    @Test
    void listarActivas_devuelveSubastas() {
        when(subastaRepository.findByEstado(EstadoSubasta.ACTIVA)).thenReturn(java.util.List.of(subasta));

        var resultado = subastaService.listarActivas();

        assertEquals(1, resultado.size());
    }
}
