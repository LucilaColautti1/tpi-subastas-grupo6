package tup.subastas.proyecto.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import tup.subastas.proyecto.entity.Categoria;
import tup.subastas.proyecto.entity.Rol;
import tup.subastas.proyecto.enums.NombreRol;
import tup.subastas.proyecto.repository.CategoriaRepository;
import tup.subastas.proyecto.repository.RolRepository;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    public void run(String... args) {
        Arrays.stream(NombreRol.values()).forEach(nombre -> {
            if (rolRepository.findByNombre(nombre).isEmpty()) {
                Rol rol = new Rol();
                rol.setNombre(nombre);
                rolRepository.save(rol);
            }
        });

        List<String> categorias = List.of(
            "Camisetas de selecciones",
            "Camisetas de clubes",
            "Botines",
            "Indumentaria deportiva",
            "Accesorios",
            "Coleccionables"
        );

        categorias.forEach(nombre -> {
            if (categoriaRepository.findAll().stream().noneMatch(c -> c.getNombre().equals(nombre))) {
                Categoria cat = new Categoria();
                cat.setNombre(nombre);
                categoriaRepository.save(cat);
            }
        });
    }
}
