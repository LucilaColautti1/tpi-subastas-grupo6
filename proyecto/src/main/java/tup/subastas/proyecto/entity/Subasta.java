package tup.subastas.proyecto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tup.subastas.proyecto.enums.EstadoSubasta;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "subastas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subasta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @ManyToOne(optional = false)
    @JoinColumn(name = "vendedor_id")
    private Usuario vendedor;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal precioBase;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montoActual; // empieza igual al precioBase

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal incrementoMinimo;

    @Column(nullable = false)
    private LocalDateTime fechaInicio; // siempre UTC

    @Column(nullable = false)
    private LocalDateTime fechaCierre; // siempre UTC

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSubasta estado = EstadoSubasta.BORRADOR;

    @ManyToOne
    @JoinColumn(name = "ganador_id")
    private Usuario ganador; // null hasta que se adjudica

    @Column(precision = 19, scale = 2)
    private BigDecimal precioFinal; // null hasta que se adjudica

    @Column(nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now(ZoneOffset.UTC);

    @Version
    @Column(nullable = false)
    private Long version = 0L;
}