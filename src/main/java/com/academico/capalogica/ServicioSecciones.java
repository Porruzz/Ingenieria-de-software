package com.academico.capalogica;

import com.academico.capadatos.RepositorioSecciones;
import com.academico.capadatos.Seccion;

import java.util.ArrayList;
import java.util.List;

/**
 * US-08: Capa Lógica — Servicio de Secciones
 *
 * Este servicio implementa el núcleo de la historia de usuario US-08:
 * "Como estudiante, quiero ver qué otras secciones de una misma materia
 * tienen cupos disponibles para evaluar cambios manuales."
 *
 * El método principal recibe el nombre de una materia y aplica dos filtros:
 *   1. Coincidencia de materia (ignorando mayúsculas/minúsculas).
 *   2. Disponibilidad de cupos mediante Seccion#tieneDisponibilidad().
 */
public class ServicioSecciones {

    /** Repositorio que provee la fuente de datos de secciones */
    private final RepositorioSecciones repositorio;

    /**
     * Constructor por defecto: instancia el repositorio de datos.
     * En un contexto de inyección de dependencias, el repositorio
     * podría recibirse como parámetro del constructor.
     */
    public ServicioSecciones() {
        this.repositorio = new RepositorioSecciones();
    }

    /**
     * US-08 — Método principal del servicio:
     * Busca todas las secciones que pertenecen a la materia indicada
     * y que aún tienen cupos libres para inscripción.
     *
     * Flujo:
     *   1. Obtiene el catálogo completo de secciones desde el repositorio.
     *   2. Filtra por nombre de materia (comparación sin distinción de case).
     *   3. De ese subconjunto, conserva solo las que tieneDisponibilidad() == true.
     *   4. Devuelve la lista resultante al llamador (capa de presentación).
     *
     * @param nombreMateria Nombre de la materia a consultar (no sensible a mayúsculas)
     * @return Lista de secciones con cupos disponibles para esa materia;
     *         lista vacía si no hay coincidencias o todas están llenas.
     */
    public List<Seccion> obtenerSeccionesDisponibles(String nombreMateria) {

        // Validación básica: si el parámetro viene nulo o vacío, retorno lista vacía
        if (nombreMateria == null || nombreMateria.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // Obtener todas las secciones registradas en el sistema
        List<Seccion> todasLasSecciones = repositorio.obtenerTodasLasSecciones();

        // Lista que acumulará los resultados que cumplen ambos filtros
        List<Seccion> seccionesDisponibles = new ArrayList<>();

        // Normalizo el término de búsqueda (trim + lowercase) para comparación robusta
        String terminoBusqueda = nombreMateria.trim().toLowerCase();

        for (Seccion seccion : todasLasSecciones) {

            // Filtro 1 — Coincidencia de materia (ignorando mayúsculas y espacios extra)
            boolean mismaMateria = seccion.getNombreMateria()
                    .toLowerCase()
                    .contains(terminoBusqueda);

            // Filtro 2 — Disponibilidad de cupos (delega la regla al objeto Seccion)
            boolean hayDisponibilidad = seccion.tieneDisponibilidad();

            // Solo se incluye la sección si cumple AMBOS criterios (AND lógico)
            if (mismaMateria && hayDisponibilidad) {
                seccionesDisponibles.add(seccion);
            }
        }

        return seccionesDisponibles;
    }

    /**
     * Retorna todos los nombres de materias únicos registrados en el sistema.
     * Útil para poblar listas de sugerencias en la interfaz gráfica.
     *
     * @return Lista de nombres de materias sin duplicados
     */
    public List<String> obtenerNombresMaterias() {
        List<Seccion> todasLasSecciones = repositorio.obtenerTodasLasSecciones();
        List<String> nombres = new ArrayList<>();

        for (Seccion seccion : todasLasSecciones) {
            if (!nombres.contains(seccion.getNombreMateria())) {
                nombres.add(seccion.getNombreMateria());
            }
        }

        return nombres;
    }
}
