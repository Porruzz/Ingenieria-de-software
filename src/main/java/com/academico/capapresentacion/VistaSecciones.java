package com.academico.capapresentacion;

// ============================================================
//  US-08 | Cupos Disponibles por Sección
//  Capa: Presentación  |  Clase: VistaSecciones
// ============================================================

import com.academico.capadatos.Seccion;
import com.academico.capalogica.ServicioSecciones;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;

/**
 * US-08 — Capa de Presentación: Interfaz Gráfica (Swing)
 *
 * Muestra al estudiante las secciones con cupos disponibles de una materia.
 * Se comunica exclusivamente con {@link ServicioSecciones} (capa lógica),
 * sin conocer detalles de persistencia (capa de datos).
 *
 * Historia de Usuario (US-08):
 *   "Como estudiante, quiero ver qué secciones de una materia tienen
 *    cupos disponibles, para evaluar un posible cambio de sección."
 */
public class VistaSecciones extends JFrame {

    // ── Componentes de la interfaz ────────────────────────────────────────────

    /** Menú desplegable con los nombres de todas las materias disponibles */
    private final JComboBox<String> comboMaterias;

    /** Tabla que muestra las secciones con cupos disponibles */
    private final JTable tablaSecciones;

    /** Modelo de datos de la tabla (columnas y filas) */
    private final DefaultTableModel modeloTabla;

    /** Etiqueta de estado que informa al usuario del resultado de la búsqueda */
    private final JLabel lblEstado;

    /** Servicio de negocio (US-08): provee la lógica de filtrado */
    private final ServicioSecciones servicio;

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * Inicializa la ventana principal de US-08:
     * crea el servicio, construye los componentes Swing y carga las materias.
     */
    public VistaSecciones() {
        this.servicio = new ServicioSecciones();

        // Configuración básica de la ventana
        setTitle("US-08 | Secciones con Cupos Disponibles");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(680, 450);
        setLocationRelativeTo(null);
        setResizable(false);

        // ── Panel principal ───────────────────────────────────────────────────
        JPanel panelPrincipal = new JPanel(new BorderLayout(10, 10));
        panelPrincipal.setBorder(new EmptyBorder(15, 15, 15, 15));
        panelPrincipal.setBackground(new Color(245, 247, 250));

        // ── Título ────────────────────────────────────────────────────────────
        JLabel lblTitulo = new JLabel("US-08 — Cupos Disponibles por Sección", SwingConstants.CENTER);
        lblTitulo.setFont(new Font("SansSerif", Font.BOLD, 16));
        lblTitulo.setForeground(new Color(33, 82, 154));
        lblTitulo.setBorder(new EmptyBorder(0, 0, 8, 0));
        panelPrincipal.add(lblTitulo, BorderLayout.NORTH);

        // ── Panel de búsqueda ─────────────────────────────────────────────────
        JPanel panelBusqueda = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        panelBusqueda.setBackground(new Color(245, 247, 250));

        JLabel lblMateria = new JLabel("Materia:");
        lblMateria.setFont(new Font("SansSerif", Font.PLAIN, 13));

        comboMaterias = new JComboBox<>();
        comboMaterias.setPreferredSize(new Dimension(280, 30));
        comboMaterias.setFont(new Font("SansSerif", Font.PLAIN, 13));

        JButton btnBuscar = new JButton("Buscar secciones disponibles");
        btnBuscar.setFont(new Font("SansSerif", Font.BOLD, 12));
        btnBuscar.setBackground(new Color(33, 82, 154));
        btnBuscar.setForeground(Color.WHITE);
        btnBuscar.setFocusPainted(false);
        btnBuscar.setCursor(new Cursor(Cursor.HAND_CURSOR));

        panelBusqueda.add(lblMateria);
        panelBusqueda.add(comboMaterias);
        panelBusqueda.add(btnBuscar);
        panelPrincipal.add(panelBusqueda, BorderLayout.CENTER);

        // ── Tabla de resultados ───────────────────────────────────────────────
        String[] columnas = {"Sección", "Materia", "Cupos Máx.", "Cupos Ocup.", "Cupos Libres"};
        modeloTabla = new DefaultTableModel(columnas, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false; // tabla de solo lectura
            }
        };
        tablaSecciones = new JTable(modeloTabla);
        tablaSecciones.setFont(new Font("SansSerif", Font.PLAIN, 13));
        tablaSecciones.setRowHeight(24);
        tablaSecciones.getTableHeader().setFont(new Font("SansSerif", Font.BOLD, 12));
        tablaSecciones.getTableHeader().setBackground(new Color(33, 82, 154));
        tablaSecciones.getTableHeader().setForeground(Color.WHITE);
        tablaSecciones.setSelectionBackground(new Color(173, 216, 230));
        tablaSecciones.setGridColor(new Color(210, 215, 220));

        JScrollPane scrollTabla = new JScrollPane(tablaSecciones);
        scrollTabla.setBorder(BorderFactory.createLineBorder(new Color(200, 210, 220)));

        // ── Etiqueta de estado ────────────────────────────────────────────────
        lblEstado = new JLabel(" Seleccione una materia y presione Buscar.", SwingConstants.LEFT);
        lblEstado.setFont(new Font("SansSerif", Font.ITALIC, 12));
        lblEstado.setForeground(Color.GRAY);

        JPanel panelSur = new JPanel(new BorderLayout(5, 5));
        panelSur.setBackground(new Color(245, 247, 250));
        panelSur.add(scrollTabla, BorderLayout.CENTER);
        panelSur.add(lblEstado, BorderLayout.SOUTH);
        panelPrincipal.add(panelSur, BorderLayout.SOUTH);

        // ── Ajuste de layout para que la tabla ocupe el espacio correcto ──────
        panelPrincipal.setLayout(new BorderLayout(10, 10));
        panelPrincipal.add(lblTitulo,      BorderLayout.NORTH);
        panelPrincipal.add(panelBusqueda,  BorderLayout.CENTER);
        panelPrincipal.add(panelSur,       BorderLayout.SOUTH);

        // Redimensionar el panel sur para que ocupe más espacio
        panelSur.setPreferredSize(new Dimension(650, 300));

        add(panelPrincipal);

        // ── Cargar materias en el combo ───────────────────────────────────────
        cargarMaterias();

        // ── Evento del botón Buscar ───────────────────────────────────────────
        btnBuscar.addActionListener(e -> buscarSecciones());
    }

    // ── Métodos privados ──────────────────────────────────────────────────────

    /**
     * Consulta al servicio las materias disponibles y las carga en el combo.
     * Se ejecuta al iniciar la ventana.
     */
    private void cargarMaterias() {
        List<String> materias = servicio.obtenerNombresMaterias();
        for (String materia : materias) {
            comboMaterias.addItem(materia);
        }
    }

    /**
     * US-08 — Acción principal:
     * Lee la materia seleccionada, consulta al servicio y actualiza la tabla
     * con las secciones que tienen cupos disponibles.
     */
    private void buscarSecciones() {
        // Limpiar resultados anteriores
        modeloTabla.setRowCount(0);

        String materiaSeleccionada = (String) comboMaterias.getSelectedItem();
        if (materiaSeleccionada == null) {
            lblEstado.setText(" ⚠ Seleccione una materia primero.");
            lblEstado.setForeground(Color.ORANGE.darker());
            return;
        }

        // Delegar la búsqueda al servicio (capa lógica)
        List<Seccion> disponibles = servicio.obtenerSeccionesDisponibles(materiaSeleccionada);

        if (disponibles.isEmpty()) {
            lblEstado.setText(" ✗ No hay secciones con cupos disponibles para \"" + materiaSeleccionada + "\".");
            lblEstado.setForeground(Color.RED.darker());
        } else {
            // Poblar la tabla con los resultados
            for (Seccion s : disponibles) {
                modeloTabla.addRow(new Object[]{
                        s.getIdSeccion(),
                        s.getNombreMateria(),
                        s.getCuposMaximos(),
                        s.getCuposOcupados(),
                        s.getCuposDisponibles()
                });
            }
            lblEstado.setText(" ✓ " + disponibles.size() + " sección(es) disponible(s) para \"" + materiaSeleccionada + "\".");
            lblEstado.setForeground(new Color(0, 128, 0));
        }
    }

    // ── Punto de entrada ──────────────────────────────────────────────────────

    /**
     * US-08 — Punto de entrada de la aplicación.
     * Lanza la ventana principal en el hilo de Swing (Event Dispatch Thread).
     *
     * @param args Argumentos de línea de comandos (no utilizados)
     */
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            new VistaSecciones().setVisible(true);
        });
    }
}
