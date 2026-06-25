package tup.subastas.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SubastaRequest {
    @NotNull
    private Long productoId;
    @NotNull @DecimalMin("0.01")
    private BigDecimal precioBase;
    @NotNull @DecimalMin("0.01")
    private BigDecimal incrementoMinimo;
    @NotNull @Future
    private LocalDateTime fechaInicio;
    @NotNull @Future
    private LocalDateTime fechaCierre;
}
