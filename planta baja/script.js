// Variables globales del sistema (exactamente como en el diagrama)
let HA = { inicio: 8, fin: 20.5 }; // 08:00-20:30
let HS = { inicio: 9, fin: 12.5 }; // 09:00-12:30
let CH = 0, MH = 20.5, CD = 0, NMD = 6;
let CMS = 80, NC = 13, UA = 0, PD = 0;
let DES = 0, CE = 0, SP = 0, PCU = 0;
let PCL = 13, TPU = 0, API = 0, HP = false;
let CHP = 0, CS = 0, TS = 0, ULP = 0;
let UCP = 0, ELS = 0, TPE = 0, TLP = 0;
let US = 0, IS = 0, MHS = 12.5;

// Nuevas variables agregadas
let EPHP = 0, TSA = 0, TPC = 0, TPL = 0;

let simulacionActiva = false;
let intervalId = null;
let velocidadSimulacion = 1000;

// Inicializar UI
document.getElementById('speedSlider').addEventListener('input', function(e) {
    velocidadSimulacion = parseInt(e.target.value);
    document.getElementById('speedLabel').textContent = velocidadSimulacion + 'ms';
    if (simulacionActiva) {
        detenerSimulacion();
        iniciarSimulacion();
    }
});

function log(mensaje) {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${mensaje}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function actualizarUI() {
    document.getElementById('dia').textContent = CD;
    document.getElementById('hora').textContent = formatearHora(CH);
    document.getElementById('tipoDia').textContent = IS === 1 ? 'Sábado' : 'Normal';
    document.getElementById('horaPico').textContent = CHP === 1 ? 'Sí' : 'No';
    
    document.getElementById('usuariosActivos').textContent = UA;
    document.getElementById('espaciosLibres').textContent = DES;
    document.getElementById('porcentajeOcupacion').textContent = Math.round((UA / CMS) * 100) + '%';
    
    document.getElementById('pcsEnUso').textContent = PCU;
    document.getElementById('pcsLibres').textContent = PCL;
    document.getElementById('porcentajePCs').textContent = Math.round((PCU / NC) * 100) + '%';
    
    document.getElementById('totalEntradas').textContent = TPE;
    document.getElementById('totalSalidas').textContent = TSA;
    document.getElementById('usuariosRechazados').textContent = US;
    document.getElementById('prestamos').textContent = TPL;
    
    // Nuevas estadísticas
    document.getElementById('entradasHoraPico').textContent = EPHP;
    document.getElementById('totalUsoPC').textContent = TPC;
    document.getElementById('permanenciaLarga').textContent = ULP;
    document.getElementById('permanenciaCorta').textContent = UCP;
    
    document.getElementById('api').textContent = API;
    document.getElementById('tpu').textContent = TPU;
    document.getElementById('solicitudesPrestamo').textContent = SP;
    document.getElementById('estadoSistema').textContent = simulacionActiva ? 'Activo' : 'Inactivo';
    
    // Actualizar barra de progreso
    const occupancyPercentage = (UA / CMS) * 100;
    document.getElementById('occupancyProgress').style.width = occupancyPercentage + '%';
    
    // Indicador de hora pico
    if (CHP === 1) {
        document.getElementById('horaPico').parentElement.style.background = 'linear-gradient(45deg, #FF69B4, #DC143C)';
        document.getElementById('horaPico').parentElement.style.color = 'white';
    } else {
        document.getElementById('horaPico').parentElement.style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
        document.getElementById('horaPico').parentElement.style.color = '#2E5A8A';
    }
}

function formatearHora(hora) {
    const horas = Math.floor(hora);
    const minutos = Math.round((hora - horas) * 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

function aleatorioAlto() {
    return Math.floor(Math.random() * 8) + 5; // 5-12 usuarios
}

function aleatorioNormal() {
    return Math.floor(Math.random() * 5) + 1; // 1-5 usuarios
}

function tiempoAleatorio() {
    return Math.floor(Math.random() * 180) + 30; // 30-210 minutos
}

function definirHoraPico() {
    if (IS === 0) { // Solo en días normales
        return (CH >= 9 && CH <= 11) || (CH >= 14 && CH <= 16);
    }
    return false;
}

function determinarTipoServicio() {
    return Math.random() < 0.3 ? 'domicilio' : (Math.random() < 0.6 ? 'pc' : 'mesa');
}

function actualizarStatusBar(mensaje) {
    document.getElementById('statusBar').textContent = mensaje;
}

async function procesarHora() {
    // Verificar si es día laborable
    if (CD > NMD) {
        if (CD === 6) { // Es sábado
            IS = 1;
            log(`🗓️ SÁBADO - Día ${CD}: Horario especial 09:00-12:30`);
            actualizarStatusBar(`🗓️ SÁBADO - Horario: 09:00-12:30`);
        } else {
            log(`📅 Fin de semana - Reseteando semana`);
            CD = 0;
            IS = 0;
            return;
        }
    } else {
        // Día normal
        IS = 0;
        if (CD === 1) {
            log(`📅 NUEVO DÍA ${CD}: Horario normal 08:00-20:30`);
            actualizarStatusBar(`📅 Día ${CD} - Horario: 08:00-20:30`);
        }
    }

    // Configurar horario según tipo de día
    if (IS === 1) { // Sábado
        CH = HS.inicio;
        MH = MHS;
    } else { // Día normal
        CH = HA.inicio;
        MH = HA.fin;
    }

    // Procesar cada hora del día
    while (CH <= MH) {
        // Verificar hora pico
        HP = definirHoraPico();
        CHP = HP ? 1 : 0;

        if (HP) {
            API = aleatorioAlto();
            EPHP += API; // Contabilizar entradas en hora pico
            log(`⚡ HORA PICO ${formatearHora(CH)}: ${API} usuarios llegando`);
        } else {
            API = aleatorioNormal();
            log(`⏰ Hora normal ${formatearHora(CH)}: ${API} usuarios llegando`);
        }

        TPE += API;

        // Verificar capacidad
        if (UA + API <= CMS) {
            UA += API;
            log(`✅ Usuarios ingresados: ${API}. Total activos: ${UA}`);
        } else {
            const rechazados = (UA + API) - CMS;
            UA = CMS;
            US += rechazados;
            TSA += rechazados;
            log(`❌ Capacidad excedida. Rechazados: ${rechazados}`);
        }

        // Calcular espacios disponibles
        DES = CMS - UA;
        CE = UA;
        CS = UA;

        // Procesar tipos de servicio para cada usuario que ingresó
        let usuariosIngresados = Math.min(API, CMS - (UA - API));
        for (let i = 0; i < usuariosIngresados; i++) {
            TS = determinarTipoServicio();
            
            if (TS === 'domicilio') {
                SP += 1;
                PD += 1;
                TLP += 1;
                TPL += 1;
                US += 1;
                TSA += 1;
                log(`📚 Préstamo a domicilio procesado`);
            } else if (TS === 'pc') {
                if (PCL > 0) {
                    PCU += 1;
                    PCL -= 1;
                    TPC += 1;
                    TPU = tiempoAleatorio();
                    
                    if (TPU > 60) {
                        ULP += 1;
                        log(`💻 PC asignada - Permanencia larga: ${TPU} min`);
                    } else {
                        UCP += 1;
                        log(`💻 PC asignada - Permanencia corta: ${TPU} min`);
                    }
                } else {
                    US += 1;
                    TSA += 1;
                    log(`❌ PC no disponible - Usuario rechazado`);
                }
            } else { // mesa
                if (DES > 0) {
                    DES -= 1;
                    TPU = tiempoAleatorio();
                    
                    if (TPU > 60) {
                        ULP += 1;
                        log(`📖 Mesa asignada - Permanencia larga: ${TPU} min`);
                    } else {
                        UCP += 1;
                        log(`📖 Mesa asignada - Permanencia corta: ${TPU} min`);
                    }
                } else {
                    US += 1;
                    TSA += 1;
                    log(`❌ Mesa no disponible - Usuario rechazado`);
                }
            }
        }

        // Procesar salidas (usuarios que terminan)
        const usuariosSalientes = Math.floor(UA * 0.1); // 10% de usuarios salen cada hora
        if (usuariosSalientes > 0) {
            UA -= usuariosSalientes;
            TSA += usuariosSalientes;
            
            // Calcular usuarios de PC que salen proporcionalmente
            const usuariosPCSalientes = Math.floor(usuariosSalientes * (PCU / (UA + usuariosSalientes)));
            PCU = Math.max(0, PCU - usuariosPCSalientes);
            PCL = Math.min(NC, PCL + usuariosPCSalientes);
            
            log(`🚪 ${usuariosSalientes} usuarios salieron. ${usuariosPCSalientes} liberaron PCs`);
        }

        // Calcular espacios libres
        ELS = CMS - UA;
        
        actualizarUI();
        
        CH += 1;
        US = 0; // Reset usuarios salientes para próxima hora
        
        // Pausa para visualización
        if (simulacionActiva) {
            await new Promise(resolve => setTimeout(resolve, velocidadSimulacion));
        }
        
        if (!simulacionActiva) return;
    }

    // Cerrar día
    log(`🌙 Cerrando día ${CD}`);
    CH = 0;
    UA = 0;
    PCU = 0;
    PCL = 13;
    MH = 20.5;
    IS = 0;
}

async function ejecutarSimulacion() {
    CD = 1;
    
    while (CD <= NMD && simulacionActiva) {
        await procesarHora();
        CD += 1;
        
        if (!simulacionActiva) return;
        
        // Pausa entre días
        await new Promise(resolve => setTimeout(resolve, velocidadSimulacion * 2));
    }
    
    if (simulacionActiva) {
        generarReporteFinal();
        simulacionActiva = false;
        log(`🏁 Simulación completada - 6 días procesados`);
        actualizarStatusBar(`✅ Simulación Completada - Ver Reporte Final`);
    }
}

function generarReporteFinal() {
    const finalReport = document.getElementById('finalReport');
    const reportGrid = document.getElementById('reportGrid');
    
    reportGrid.innerHTML = `
        <div class="report-item">
            <h4>📊 Total de Entradas</h4>
            <p>${TPE}</p>
        </div>
        <div class="report-item">
            <h4>🚪 Total de Salidas</h4>
            <p>${TSA}</p>
        </div>
        <div class="report-item">
            <h4>⚡ Entradas en Hora Pico</h4>
            <p>${EPHP}</p>
        </div>
        <div class="report-item">
            <h4>💻 Total Uso de PCs</h4>
            <p>${TPC}</p>
        </div>
        <div class="report-item">
            <h4>📚 Total Préstamos</h4>
            <p>${TPL}</p>
        </div>
        <div class="report-item">
            <h4>❌ Usuarios Rechazados</h4>
            <p>${US}</p>
        </div>
        <div class="report-item">
            <h4>🕒 Permanencia Larga</h4>
            <p>${ULP}</p>
        </div>
        <div class="report-item">
            <h4>⏳ Permanencia Corta</h4>
            <p>${UCP}</p>
        </div>
    `;
    finalReport.style.display = 'block';
}

function iniciarSimulacion() {
    if (!simulacionActiva) {
        simulacionActiva = true;
        ejecutarSimulacion();
        actualizarStatusBar('▶️ Simulación en curso...');
    }
}

function pausarSimulacion() {
    if (simulacionActiva) {
        simulacionActiva = false;
        actualizarStatusBar('⏸️ Simulación pausada');
        log('⏸️ Simulación pausada');
    }
}

function detenerSimulacion() {
    simulacionActiva = false;
    CD = 0;
    CH = 0;
    UA = 0;
    PCU = 0;
    PCL = 13;
    TPE = 0;
    TSA = 0;
    EPHP = 0;
    TPC = 0;
    TPL = 0;
    ULP = 0;
    UCP = 0;
    US = 0;
    actualizarUI();
    actualizarStatusBar('⏹️ Simulación detenida');
    log('⏹️ Simulación detenida y reiniciada');
    document.getElementById('finalReport').style.display = 'none';
}

function reiniciarSimulacion() {
    detenerSimulacion();
    iniciarSimulacion();
}

// Inicializar la UI al cargar
actualizarUI();
