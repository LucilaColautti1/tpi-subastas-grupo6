package tup.subastas.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PujaRequest {
    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal monto;
}
