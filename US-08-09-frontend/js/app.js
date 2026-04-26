// ============================================================
//  US-08 | Consulta de Cupos Disponibles — Frontend Logic
//  Consume: GET http://localhost:8080/api/secciones/{materiaId}/disponibles
// ============================================================

const US08 = (() => {

    const API_BASE = 'http://localhost:8080/api';

    // ── DOM ────────────────────────────────────────────────────────────────
    const form        = document.getElementById('form-us08');
    const inputId     = document.getElementById('materiaId');
    const btnBuscar   = document.getElementById('btn-buscar');
    const resultados  = document.getElementById('resultados-us08');
    const tbody       = document.getElementById('tbody-us08');
    const alertBox    = document.getElementById('alert-us08');
    const countBadge  = document.getElementById('count-us08');

    // ── Helpers ────────────────────────────────────────────────────────────

    function mostrarAlert(msg, tipo = 'info') {
        const icons = { success:'✅', warning:'⚠️', error:'❌', info:'ℹ️' };
        alertBox.className = `alert alert-${tipo}`;
        alertBox.innerHTML = `<span>${icons[tipo]}</span> ${msg}`;
        alertBox.style.display = 'flex';
    }

    function ocultarAlert() {
        alertBox.style.display = 'none';
    }

    function renderTabla(secciones) {
        tbody.innerHTML = '';

        if (!secciones.length) {
            tbody.innerHTML = `
                <tr><td colspan="4" class="empty-state">
                    No hay secciones con cupos disponibles para esta materia.
                </td></tr>`;
            countBadge.textContent = '0 resultados';
            return;
        }

        secciones.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${s.id}</strong></td>
                <td>${s.nombre}</td>
                <td>${s.materiaId}</td>
                <td>
                    <span style="
                        background: rgba(34,197,94,0.15);
                        color: #22c55e;
                        padding: 3px 10px;
                        border-radius: 99px;
                        font-weight: 600;
                        font-size: 0.82rem;
                    ">${s.cuposDisponibles} cupos</span>
                </td>`;
            tbody.appendChild(tr);
        });

        countBadge.textContent = `${secciones.length} sección(es)`;
    }

    // ── Acción principal ───────────────────────────────────────────────────

    async function buscarSecciones(e) {
        e.preventDefault();
        ocultarAlert();

        const materiaId = inputId.value.trim();
        if (!materiaId || isNaN(materiaId) || Number(materiaId) <= 0) {
            mostrarAlert('Ingresa un ID de materia válido (número positivo).', 'warning');
            return;
        }

        // Mostrar spinner
        btnBuscar.disabled = true;
        btnBuscar.innerHTML = '<span class="spinner"></span> Buscando...';

        try {
            const res = await fetch(`${API_BASE}/secciones/${materiaId}/disponibles`);

            if (!res.ok) {
                throw new Error(`Error del servidor: ${res.status} ${res.statusText}`);
            }

            const secciones = await res.json();
            renderTabla(secciones);
            resultados.style.display = 'block';

            if (secciones.length > 0) {
                mostrarAlert(`Se encontraron <strong>${secciones.length}</strong> sección(es) disponibles.`, 'success');
            } else {
                mostrarAlert('No hay secciones con cupos disponibles para esa materia.', 'warning');
            }

        } catch (err) {
            mostrarAlert(`No se pudo conectar al backend. ¿Está corriendo en el puerto 8080?<br><small>${err.message}</small>`, 'error');
            resultados.style.display = 'none';
        } finally {
            btnBuscar.disabled = false;
            btnBuscar.innerHTML = '🔍 Buscar Secciones';
        }
    }

    // ── Init ───────────────────────────────────────────────────────────────
    function init() {
        form.addEventListener('submit', buscarSecciones);
    }

    return { init };
})();


// ============================================================
//  US-09 | Matching de Intercambios — Frontend Logic
//  Consume: POST http://localhost:8080/api/intercambios/registrar
// ============================================================

const US09 = (() => {

    const API_BASE = 'http://localhost:8080/api';

    // ── DOM ────────────────────────────────────────────────────────────────
    const form         = document.getElementById('form-us09');
    const btnRegistrar = document.getElementById('btn-registrar');
    const alertBox     = document.getElementById('alert-us09');
    const resultCard   = document.getElementById('result-us09');

    // ── Helpers ────────────────────────────────────────────────────────────

    function mostrarAlert(msg, tipo = 'info') {
        const icons = { success:'✅', warning:'⚠️', error:'❌', info:'ℹ️' };
        alertBox.className = `alert alert-${tipo}`;
        alertBox.innerHTML = `<span>${icons[tipo]}</span> ${msg}`;
        alertBox.style.display = 'flex';
    }

    function renderResultado(intercambio) {
        const isMatched = intercambio.estado === 'MATCHED';
        resultCard.innerHTML = `
            <div class="card" style="border-color: ${isMatched ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'}; animation: fadeIn 0.4s ease;">
                <div class="card-title">
                    <span class="icon">${isMatched ? '🎉' : '⏳'}</span>
                    Resultado del Intercambio
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.9rem;">
                    <div>
                        <span style="color:var(--color-muted); font-size:0.78rem; text-transform:uppercase;">ID Intercambio</span>
                        <div style="font-weight:600; margin-top:2px;">#${intercambio.id}</div>
                    </div>
                    <div>
                        <span style="color:var(--color-muted); font-size:0.78rem; text-transform:uppercase;">Estado</span>
                        <div style="margin-top:4px;">
                            <span class="badge-estado ${isMatched ? 'badge-matched' : 'badge-pendiente'}">
                                ${isMatched ? '● MATCHED' : '● PENDIENTE'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <span style="color:var(--color-muted); font-size:0.78rem; text-transform:uppercase;">Estudiante ID</span>
                        <div style="font-weight:600; margin-top:2px;">${intercambio.estudianteId}</div>
                    </div>
                    <div>
                        <span style="color:var(--color-muted); font-size:0.78rem; text-transform:uppercase;">Materia Deseada</span>
                        <div style="font-weight:600; margin-top:2px;">#${intercambio.materiaDeseadaId}</div>
                    </div>
                    <div>
                        <span style="color:var(--color-muted); font-size:0.78rem; text-transform:uppercase;">Materia Ofrecida</span>
                        <div style="font-weight:600; margin-top:2px;">#${intercambio.materiaOfrecidaId}</div>
                    </div>
                </div>
                ${isMatched ? `
                    <div style="margin-top:16px; padding:12px; background:rgba(34,197,94,0.1);
                                border-radius:8px; color:#22c55e; font-size:0.88rem;">
                        🎉 ¡Se encontró un match! Ambos intercambios han sido confirmados automáticamente.
                    </div>` : `
                    <div style="margin-top:16px; padding:12px; background:rgba(245,158,11,0.1);
                                border-radius:8px; color:#f59e0b; font-size:0.88rem;">
                        ⏳ Tu solicitud quedó en espera. Se notificará cuando se encuentre un match compatible.
                    </div>`}
            </div>`;
        resultCard.style.display = 'block';
    }

    // ── Validación ─────────────────────────────────────────────────────────

    function validarCampos(datos) {
        if (!datos.estudianteId || datos.estudianteId <= 0)
            return 'El ID del estudiante debe ser un número positivo.';
        if (!datos.materiaDeseadaId || datos.materiaDeseadaId <= 0)
            return 'El ID de materia deseada debe ser un número positivo.';
        if (!datos.materiaOfrecidaId || datos.materiaOfrecidaId <= 0)
            return 'El ID de materia ofrecida debe ser un número positivo.';
        if (datos.materiaDeseadaId === datos.materiaOfrecidaId)
            return 'La materia deseada y la ofrecida no pueden ser la misma.';
        return null;
    }

    // ── Acción principal ───────────────────────────────────────────────────

    async function registrarIntercambio(e) {
        e.preventDefault();
        alertBox.style.display = 'none';
        resultCard.style.display = 'none';

        const datos = {
            estudianteId:    Number(document.getElementById('estudianteId').value),
            materiaDeseadaId:  Number(document.getElementById('materiaDeseadaId').value),
            materiaOfrecidaId: Number(document.getElementById('materiaOfrecidaId').value),
        };

        const error = validarCampos(datos);
        if (error) { mostrarAlert(error, 'warning'); return; }

        // Spinner
        btnRegistrar.disabled = true;
        btnRegistrar.innerHTML = '<span class="spinner"></span> Procesando...';

        try {
            const res = await fetch(`${API_BASE}/intercambios/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(`${res.status}: ${errBody}`);
            }

            const intercambio = await res.json();
            renderResultado(intercambio);

            if (intercambio.estado === 'MATCHED') {
                mostrarAlert('¡Match encontrado! El intercambio fue confirmado automáticamente.', 'success');
            } else {
                mostrarAlert('Solicitud registrada. Quedará en espera hasta encontrar un match.', 'info');
            }

        } catch (err) {
            mostrarAlert(`No se pudo conectar al backend. ¿Está corriendo en el puerto 8080?<br><small>${err.message}</small>`, 'error');
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '🔀 Registrar Intercambio';
        }
    }

    // ── Init ───────────────────────────────────────────────────────────────
    function init() {
        form.addEventListener('submit', registrarIntercambio);
    }

    return { init };
})();


// ============================================================
//  Tabs Navigation
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // Init módulos
    US08.init();
    US09.init();

    // Tabs
    const tabBtns   = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
});
