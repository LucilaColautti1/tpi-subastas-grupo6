package tup.subastas.proyecto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tup.subastas.proyecto.enums.EstadoSubasta;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "historial_estados")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "subasta_id")
    private Subasta subasta;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario; // null si el cambio fue automático por fecha

    @Enumerated(EnumType.STRING)
    private EstadoSubasta estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSubasta estadoNuevo;

    private String motivo;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now(ZoneOffset.UTC);
}