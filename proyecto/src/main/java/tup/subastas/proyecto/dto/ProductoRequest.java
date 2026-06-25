package tup.subastas.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductoRequest {
    @NotBlank
    private String titulo;
    private String descripcion;
    @NotNull
    private Long categoriaId;
    private String imagenBase64;
}
