package com.academico.capadatos;

/**
 * US-08: Capa de Datos
 * Representa una sección de una materia universitaria.
 * Contiene la lógica base para verificar si tiene cupos disponibles,
 * criterio central del filtrado requerido en la historia de usuario US-08.
 */
public class Seccion {

    /** Identificador único de la sección (ej: "MAT-101-A") */
    private String idSeccion;

    /** Nombre de la materia a la que pertenece esta sección (ej: "Cálculo I") */
    private String nombreMateria;

    /** Número máximo de estudiantes que puede albergar la sección */
    private int cuposMaximos;

    /** Número de estudiantes actualmente inscritos en la sección */
    private int cuposOcupados;

    /**
     * Constructor completo para inicializar una sección.
     *
     * @param idSeccion      Identificador único de la sección
     * @param nombreMateria  Nombre de la materia asociada
     * @param cuposMaximos   Cupos totales disponibles
     * @param cuposOcupados  Cupos ya utilizados por estudiantes inscritos
     */
    public Seccion(String idSeccion, String nombreMateria, int cuposMaximos, int cuposOcupados) {
        this.idSeccion = idSeccion;
        this.nombreMateria = nombreMateria;
        this.cuposMaximos = cuposMaximos;
        this.cuposOcupados = cuposOcupados;
    }

    /**
     * US-08 — Lógica de negocio base:
     * Determina si esta sección todavía tiene cupos libres para inscripción.
     * Un cupo está disponible cuando los cupos máximos superan a los ocupados.
     *
     * @return {@code true} si hay al menos un cupo libre; {@code false} si está llena
     */
    public boolean tieneDisponibilidad() {
        return cuposMaximos > cuposOcupados;
    }

    /**
     * Calcula cuántos cupos quedan libres en esta sección.
     *
     * @return Número de cupos libres (siempre >= 0)
     */
    public int getCuposDisponibles() {
        int disponibles = cuposMaximos - cuposOcupados;
        return disponibles > 0 ? disponibles : 0;
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public String getIdSeccion() {
        return idSeccion;
    }

    public String getNombreMateria() {
        return nombreMateria;
    }

    public int getCuposMaximos() {
        return cuposMaximos;
    }

    public int getCuposOcupados() {
        return cuposOcupados;
    }

    // ── Setters ──────────────────────────────────────────────────────────────

    public void setIdSeccion(String idSeccion) {
        this.idSeccion = idSeccion;
    }

    public void setNombreMateria(String nombreMateria) {
        this.nombreMateria = nombreMateria;
    }

    public void setCuposMaximos(int cuposMaximos) {
        this.cuposMaximos = cuposMaximos;
    }

    public void setCuposOcupados(int cuposOcupados) {
        this.cuposOcupados = cuposOcupados;
    }

    @Override
    public String toString() {
        return "Seccion{" +
                "idSeccion='" + idSeccion + '\'' +
                ", nombreMateria='" + nombreMateria + '\'' +
                ", cuposMaximos=" + cuposMaximos +
                ", cuposOcupados=" + cuposOcupados +
                ", cuposDisponibles=" + getCuposDisponibles() +
                '}';
    }
}
