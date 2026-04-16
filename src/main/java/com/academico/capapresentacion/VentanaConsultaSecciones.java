package com.academico.capapresentacion;

import com.academico.capalogica.ServicioSecciones;
import com.academico.capadatos.Seccion;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.DefaultTableCellRenderer;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.List;

/**
 * US-08: Capa de Presentación — Interfaz Gráfica (Swing)
 *
 * Ventana principal que permite al estudiante consultar qué secciones
 * de una materia tienen cupos disponibles para evaluar un cambio manual
 * de sección, según lo definido en la Historia de Usuario US-08.
 *
 * Componentes:
 *   - JTextField: ingreso del nombre de la materia a buscar.
 *   - JButton:    dispara la consulta al ServicioSecciones.
 *   - JTable:     muestra ID de sección, cupos máximos, ocupados y disponibles.
 *   - JLabel:     retroalimentación de estado al usuario.
 */
public class VentanaConsultaSecciones extends JFrame {

    // ── Colores del tema ─────────────────────────────────────────────────────
    private static final Color COLOR_FONDO          = new Color(18, 18, 35);
    private static final Color COLOR_PANEL          = new Color(28, 28, 50);
    private static final Color COLOR_ACENTO         = new Color(99, 102, 241);  // índigo
    private static final Color COLOR_ACENTO_HOVER   = new Color(79, 82, 221);
    private static final Color COLOR_TEXTO          = new Color(226, 232, 240);
    private static final Color COLOR_TEXTO_SUAVE    = new Color(148, 163, 184);
    private static final Color COLOR_FILA_PAR       = new Color(30, 30, 55);
    private static final Color COLOR_FILA_IMPAR     = new Color(38, 38, 65);
    private static final Color COLOR_VERDE          = new Color(52, 211, 153);
    private static final Color COLOR_BORDE          = new Color(55, 55, 90);

    // ── Componentes de la interfaz ───────────────────────────────────────────
    private JTextField campoBusqueda;
    private JButton    botonConsultar;
    private JTable     tablaResultados;
    private DefaultTableModel modeloTabla;
    private JLabel     etiquetaEstado;
    private JComboBox<String> comboBusquedaRapida;

    // ── Capa Lógica ──────────────────────────────────────────────────────────
    private final ServicioSecciones servicio;

    /**
     * Constructor: inicializa el servicio y construye la interfaz gráfica.
     */
    public VentanaConsultaSecciones() {
        this.servicio = new ServicioSecciones();
        configurarVentana();
        construirInterfaz();
    }

    /** Configuración base del JFrame */
    private void configurarVentana() {
        setTitle("US-08 — Consulta de Cupos por Sección");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(820, 580);
        setMinimumSize(new Dimension(680, 480));
        setLocationRelativeTo(null);
        getContentPane().setBackground(COLOR_FONDO);
        setLayout(new BorderLayout(0, 0));
    }

    /** Ensambla todos los paneles de la interfaz */
    private void construirInterfaz() {
        add(crearPanelEncabezado(), BorderLayout.NORTH);
        add(crearPanelCentral(),   BorderLayout.CENTER);
        add(crearPanelPie(),       BorderLayout.SOUTH);
    }

    // ── Panel superior: título de la aplicación ──────────────────────────────

    private JPanel crearPanelEncabezado() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(COLOR_PANEL);
        panel.setBorder(new EmptyBorder(20, 28, 16, 28));

        // Barra de color superior decorativa
        JPanel barraColor = new JPanel();
        barraColor.setBackground(COLOR_ACENTO);
        barraColor.setPreferredSize(new Dimension(0, 4));
        panel.add(barraColor, BorderLayout.NORTH);

        // Título principal
        JLabel titulo = new JLabel("Consulta de Disponibilidad de Secciones");
        titulo.setFont(new Font("Segoe UI", Font.BOLD, 22));
        titulo.setForeground(COLOR_TEXTO);
        titulo.setBorder(new EmptyBorder(12, 0, 2, 0));

        // Subtítulo descriptivo
        JLabel subtitulo = new JLabel("US-08 · Evalúa qué secciones de una materia tienen cupos libres");
        subtitulo.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        subtitulo.setForeground(COLOR_TEXTO_SUAVE);

        JPanel textos = new JPanel();
        textos.setLayout(new BoxLayout(textos, BoxLayout.Y_AXIS));
        textos.setOpaque(false);
        textos.add(titulo);
        textos.add(subtitulo);
        panel.add(textos, BorderLayout.CENTER);

        return panel;
    }

    // ── Panel central: búsqueda + tabla de resultados ────────────────────────

    private JPanel crearPanelCentral() {
        JPanel panel = new JPanel(new BorderLayout(0, 16));
        panel.setBackground(COLOR_FONDO);
        panel.setBorder(new EmptyBorder(20, 28, 0, 28));

        panel.add(crearPanelBusqueda(),   BorderLayout.NORTH);
        panel.add(crearPanelTabla(),      BorderLayout.CENTER);

        return panel;
    }

    /** Fila superior con campo de texto, combo de sugerencias y botón */
    private JPanel crearPanelBusqueda() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(COLOR_PANEL);
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(COLOR_BORDE, 1),
                new EmptyBorder(16, 20, 16, 20)
        ));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(0, 0, 0, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Etiqueta
        JLabel etiqueta = new JLabel("Materia:");
        etiqueta.setFont(new Font("Segoe UI", Font.BOLD, 13));
        etiqueta.setForeground(COLOR_TEXTO);
        gbc.gridx = 0; gbc.gridy = 0; gbc.weightx = 0;
        panel.add(etiqueta, gbc);

        // Campo de texto principal
        campoBusqueda = new JTextField();
        campoBusqueda.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        campoBusqueda.setBackground(new Color(15, 15, 30));
        campoBusqueda.setForeground(COLOR_TEXTO);
        campoBusqueda.setCaretColor(COLOR_ACENTO);
        campoBusqueda.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(COLOR_BORDE),
                new EmptyBorder(8, 10, 8, 10)
        ));
        campoBusqueda.setToolTipText("Escribe el nombre de la materia (ej: Cálculo)");
        // Permitir buscar pulsando Enter
        campoBusqueda.addActionListener(e -> ejecutarBusqueda());
        gbc.gridx = 1; gbc.weightx = 1.0;
        panel.add(campoBusqueda, gbc);

        // Combo de búsqueda rápida
        List<String> materias = servicio.obtenerNombresMaterias();
        String[] opcionesMaterias = new String[materias.size() + 1];
        opcionesMaterias[0] = "— Seleccionar atajo —";
        for (int i = 0; i < materias.size(); i++) opcionesMaterias[i + 1] = materias.get(i);

        comboBusquedaRapida = new JComboBox<>(opcionesMaterias);
        comboBusquedaRapida.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        comboBusquedaRapida.setBackground(new Color(15, 15, 30));
        comboBusquedaRapida.setForeground(COLOR_TEXTO);
        comboBusquedaRapida.setToolTipText("Selecciona una materia rápidamente");
        comboBusquedaRapida.addActionListener(e -> {
            String seleccion = (String) comboBusquedaRapida.getSelectedItem();
            if (seleccion != null && !seleccion.startsWith("—")) {
                campoBusqueda.setText(seleccion);
            }
        });
        gbc.gridx = 2; gbc.weightx = 0.6;
        panel.add(comboBusquedaRapida, gbc);

        // Botón consultar
        botonConsultar = new JButton("Consultar Disponibilidad");
        botonConsultar.setFont(new Font("Segoe UI", Font.BOLD, 13));
        botonConsultar.setBackground(COLOR_ACENTO);
        botonConsultar.setForeground(Color.WHITE);
        botonConsultar.setFocusPainted(false);
        botonConsultar.setBorderPainted(false);
        botonConsultar.setCursor(new Cursor(Cursor.HAND_CURSOR));
        botonConsultar.setBorder(new EmptyBorder(10, 20, 10, 20));

        // Efecto hover en el botón
        botonConsultar.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseEntered(java.awt.event.MouseEvent e) {
                botonConsultar.setBackground(COLOR_ACENTO_HOVER);
            }
            public void mouseExited(java.awt.event.MouseEvent e) {
                botonConsultar.setBackground(COLOR_ACENTO);
            }
        });

        botonConsultar.addActionListener(e -> ejecutarBusqueda());
        gbc.gridx = 3; gbc.weightx = 0; gbc.insets = new Insets(0, 0, 0, 0);
        panel.add(botonConsultar, gbc);

        return panel;
    }

    /** Tabla de resultados con encabezado y scroll */
    private JScrollPane crearPanelTabla() {
        // Columnas de la tabla
        String[] columnas = {
            "ID Sección",
            "Materia",
            "Cupos Máx.",
            "Cupos Ocupados",
            "Cupos Disponibles"
        };

        modeloTabla = new DefaultTableModel(columnas, 0) {
            @Override
            public boolean isCellEditable(int fila, int columna) {
                return false; // Tabla de solo lectura
            }
        };

        tablaResultados = new JTable(modeloTabla);
        tablaResultados.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        tablaResultados.setForeground(COLOR_TEXTO);
        tablaResultados.setBackground(COLOR_FILA_PAR);
        tablaResultados.setGridColor(COLOR_BORDE);
        tablaResultados.setRowHeight(36);
        tablaResultados.setShowVerticalLines(false);
        tablaResultados.setSelectionBackground(new Color(99, 102, 241, 80));
        tablaResultados.setSelectionForeground(COLOR_TEXTO);
        tablaResultados.setIntercellSpacing(new Dimension(0, 0));

        // Encabezado de la tabla
        tablaResultados.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 12));
        tablaResultados.getTableHeader().setBackground(COLOR_PANEL);
        tablaResultados.getTableHeader().setForeground(COLOR_TEXTO_SUAVE);
        tablaResultados.getTableHeader().setBorder(BorderFactory.createLineBorder(COLOR_BORDE));

        // Renderer personalizado: filas alternadas + columna de cupos verdes
        tablaResultados.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(
                    JTable tabla, Object valor, boolean seleccionado,
                    boolean enfocado, int fila, int columna) {

                super.getTableCellRendererComponent(tabla, valor, seleccionado, enfocado, fila, columna);
                setHorizontalAlignment(columna >= 2 ? SwingConstants.CENTER : SwingConstants.LEFT);
                setBorder(new EmptyBorder(0, 12, 0, 12));

                if (!seleccionado) {
                    setBackground(fila % 2 == 0 ? COLOR_FILA_PAR : COLOR_FILA_IMPAR);
                    // Columna "Cupos Disponibles" resaltada en verde
                    setForeground(columna == 4 ? COLOR_VERDE : COLOR_TEXTO);
                } else {
                    setBackground(new Color(99, 102, 241, 100));
                    setForeground(COLOR_TEXTO);
                }

                return this;
            }
        });

        // Anchos de columna
        tablaResultados.getColumnModel().getColumn(0).setPreferredWidth(130);
        tablaResultados.getColumnModel().getColumn(1).setPreferredWidth(200);
        tablaResultados.getColumnModel().getColumn(2).setPreferredWidth(100);
        tablaResultados.getColumnModel().getColumn(3).setPreferredWidth(120);
        tablaResultados.getColumnModel().getColumn(4).setPreferredWidth(140);

        JScrollPane scroll = new JScrollPane(tablaResultados);
        scroll.setBackground(COLOR_FONDO);
        scroll.getViewport().setBackground(COLOR_FILA_PAR);
        scroll.setBorder(BorderFactory.createLineBorder(COLOR_BORDE));
        return scroll;
    }

    // ── Panel inferior: etiqueta de estado ───────────────────────────────────

    private JPanel crearPanelPie() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.LEFT, 28, 10));
        panel.setBackground(COLOR_PANEL);
        panel.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, COLOR_BORDE));

        etiquetaEstado = new JLabel("Ingresa el nombre de una materia y pulsa «Consultar Disponibilidad».");
        etiquetaEstado.setFont(new Font("Segoe UI", Font.ITALIC, 12));
        etiquetaEstado.setForeground(COLOR_TEXTO_SUAVE);
        panel.add(etiquetaEstado);

        return panel;
    }

    // ── Lógica de consulta ───────────────────────────────────────────────────

    /**
     * US-08 — Acción del botón "Consultar Disponibilidad":
     * Invoca al ServicioSecciones con el nombre de materia ingresado
     * y popula la JTable con las secciones que tienen cupos libres.
     */
    private void ejecutarBusqueda() {
        String nombreMateria = campoBusqueda.getText().trim();

        if (nombreMateria.isEmpty()) {
            etiquetaEstado.setText("⚠  Por favor, ingresa el nombre de la materia a consultar.");
            etiquetaEstado.setForeground(new Color(251, 191, 36));
            modeloTabla.setRowCount(0);
            return;
        }

        // Delegar la búsqueda filtrada a la Capa Lógica
        List<Seccion> seccionesDisponibles = servicio.obtenerSeccionesDisponibles(nombreMateria);

        // Limpiar resultados anteriores
        modeloTabla.setRowCount(0);

        if (seccionesDisponibles.isEmpty()) {
            etiquetaEstado.setText(
                "ℹ  No se encontraron secciones con cupos disponibles para \"" + nombreMateria + "\"."
            );
            etiquetaEstado.setForeground(COLOR_TEXTO_SUAVE);
        } else {
            // Poblar la tabla con cada sección encontrada
            for (Seccion seccion : seccionesDisponibles) {
                modeloTabla.addRow(new Object[]{
                    seccion.getIdSeccion(),
                    seccion.getNombreMateria(),
                    seccion.getCuposMaximos(),
                    seccion.getCuposOcupados(),
                    seccion.getCuposDisponibles()   // cupos libres = max - ocupados
                });
            }

            etiquetaEstado.setText(
                "✔  Se encontraron " + seccionesDisponibles.size() +
                " sección(es) con cupos disponibles para \"" + nombreMateria + "\"."
            );
            etiquetaEstado.setForeground(COLOR_VERDE);
        }
    }

    // ── Punto de entrada ─────────────────────────────────────────────────────

    /**
     * Método main: lanza la interfaz gráfica en el hilo de despacho de eventos
     * de Swing (Event Dispatch Thread), siguiendo la buena práctica de Java Swing.
     */
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                // Si no se puede aplicar el L&F del sistema, se usa el predeterminado
            }

            VentanaConsultaSecciones ventana = new VentanaConsultaSecciones();
            ventana.setVisible(true);
        });
    }
}
