package com.academico.capadatos;

// ============================================================
//  US-08 | Cupos Disponibles por Sección
//  Capa: Datos  |  Clase: RepositorioSecciones
// ============================================================

import java.util.ArrayList;
import java.util.List;

/**
 * US-08 — Capa de Datos: Repositorio de Secciones
 *
 * Simula la fuente de datos (base de datos / API académica) que almacena
 * todas las secciones disponibles en el sistema.
 * En un entorno real, este repositorio consultaría una BD relacional o servicio REST.
 *
 * Historia de Usuario (US-08):
 *   "Como estudiante, quiero ver qué secciones de una materia tienen
 *    cupos disponibles, para evaluar un posible cambio de sección."
 */
public class RepositorioSecciones {

    /**
     * Retorna la lista completa de secciones registradas en el sistema.
     * Los datos están embebidos aquí como simulación (datos de prueba).
     * En producción, este método ejecutaría una consulta SQL o llamada HTTP.
     *
     * @return Lista con todas las secciones del semestre actual
     */
    public List<Seccion> obtenerTodasLasSecciones() {
        List<Seccion> secciones = new ArrayList<>();

        // ── Cálculo Diferencial ───────────────────────────────────────────────
        secciones.add(new Seccion("CAL-101-A", "Cálculo Diferencial", 35, 35)); // LLENA
        secciones.add(new Seccion("CAL-101-B", "Cálculo Diferencial", 35, 20)); // disponible
        secciones.add(new Seccion("CAL-101-C", "Cálculo Diferencial", 30, 28)); // disponible
        secciones.add(new Seccion("CAL-101-D", "Cálculo Diferencial", 40, 40)); // LLENA

        // ── Álgebra Lineal ────────────────────────────────────────────────────
        secciones.add(new Seccion("ALG-201-A", "Álgebra Lineal", 30, 15));      // disponible
        secciones.add(new Seccion("ALG-201-B", "Álgebra Lineal", 30, 30));      // LLENA
        secciones.add(new Seccion("ALG-201-C", "Álgebra Lineal", 25, 10));      // disponible

        // ── Ingeniería de Software ────────────────────────────────────────────
        secciones.add(new Seccion("ING-301-A", "Ingeniería de Software", 40, 39)); // disponible
        secciones.add(new Seccion("ING-301-B", "Ingeniería de Software", 40, 40)); // LLENA
        secciones.add(new Seccion("ING-301-C", "Ingeniería de Software", 35, 12)); // disponible

        // ── Estructuras de Datos ──────────────────────────────────────────────
        secciones.add(new Seccion("EST-401-A", "Estructuras de Datos", 30, 30)); // LLENA
        secciones.add(new Seccion("EST-401-B", "Estructuras de Datos", 30, 30)); // LLENA
        secciones.add(new Seccion("EST-401-C", "Estructuras de Datos", 25,  5)); // disponible

        // ── Bases de Datos ────────────────────────────────────────────────────
        secciones.add(new Seccion("BDD-501-A", "Bases de Datos", 35, 20));      // disponible
        secciones.add(new Seccion("BDD-501-B", "Bases de Datos", 35, 35));      // LLENA

        return secciones;
    }
}
