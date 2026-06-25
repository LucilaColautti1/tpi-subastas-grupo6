package tup.subastas.proyecto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "disputas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Disputa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "subasta_id")
    private Subasta subasta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "iniciador_id")
    private Usuario iniciador; // vendedor o ganador que abre la disputa

    @Column(nullable = false)
    private String motivo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "resolutor_id")
    private Usuario resolutor;

    private String resolucionAdmin; // null hasta que el admin resuelve

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now(ZoneOffset.UTC);

    private LocalDateTime fechaResolucion; // null hasta que se resuelve
}
