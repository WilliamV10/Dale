// app.js
// Estructura de datos: personas [{id, nombre, saldoDale, transacciones: [{tipo, cantidad, fecha}]}]

const personList = document.getElementById('personList');
const addPersonBtn = document.getElementById('addPersonBtn');
const personModal = document.getElementById('personModal');
const closePersonModal = document.getElementById('closePersonModal');
const savePersonBtn = document.getElementById('savePersonBtn');
const personNameInput = document.getElementById('personName');
const initialDaleInput = document.getElementById('initialDale');

const transactionModal = document.getElementById('transactionModal');
const closeTransactionModal = document.getElementById('closeTransactionModal');
const transactionAmount = document.getElementById('transactionAmount');
const transactionType = document.getElementById('transactionType');
const saveTransactionBtn = document.getElementById('saveTransactionBtn');

const daleModal = document.getElementById('daleModal');
const closeDaleModal = document.getElementById('closeDaleModal');
const daleAmount = document.getElementById('daleAmount');
const saveDaleBtn = document.getElementById('saveDaleBtn');

let editingPersonId = null;

function getPeople() {
    return JSON.parse(localStorage.getItem('people') || '[]');
}

function savePeople(people) {
    localStorage.setItem('people', JSON.stringify(people));
}

function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

function renderPeople() {
    const people = getPeople();
    personList.innerHTML = '';
    
    if (people.length === 0) {
        personList.innerHTML = `
            <div style="text-align:center; padding: 3rem; color: white; font-size: 1.2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎲</div>
                <p style="font-weight: 600;">No hay personas registradas.</p>
                <p style="opacity: 0.8; font-size: 1rem;">¡Agrega una persona para empezar a llevar el control!</p>
            </div>
        `;
        return;
    }
    
    people.forEach(person => {
        // Calcular totales
        const totalRecarga = person.transacciones
            .filter(t => t.tipo === 'recarga')
            .reduce((acc, t) => acc + t.cantidad, 0);
        
        const totalRetiro = person.transacciones
            .filter(t => t.tipo === 'retiro')
            .reduce((acc, t) => acc + t.cantidad, 0);
        
        const saldoDale = person.saldoDale || 0;
        
        // Ganancia Real = Retiro - Recarga
        const gananciaReal = totalRetiro - totalRecarga;
        
        // Ganancia Total = Dale + Retiro - Recarga (o Dale + Ganancia Real)
        const gananciaTotal = saldoDale + gananciaReal;
        
        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = `
            <div class="person-header">
                <span class="person-name">${person.nombre}</span>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card recarga">
                    <div class="stat-label">💳 Total Recargado</div>
                    <div class="stat-value">${formatCurrency(totalRecarga)}</div>
                </div>
                
                <div class="stat-card retiro">
                    <div class="stat-label">💵 Total Retirado</div>
                    <div class="stat-value">${formatCurrency(totalRetiro)}</div>
                </div>
                
                <div class="stat-card dale">
                    <div class="stat-label">💰 Saldo en Dale</div>
                    <div class="stat-value">${formatCurrency(saldoDale)}</div>
                </div>
                
                <div class="stat-card ganancia-real">
                    <div class="stat-label">📊 Ganancia Retirada</div>
                    <div class="stat-value ${gananciaReal >= 0 ? '' : 'negativo'}">${formatCurrency(gananciaReal)}</div>
                </div>
                
                <div class="stat-card ganancia-total">
                    <div class="stat-label">💎 Ganancia Total</div>
                    <div class="stat-value-subtitle">(Dale + Retiro)</div>
                    <div class="stat-value ${gananciaTotal >= 0 ? '' : 'negativo'}">${formatCurrency(gananciaTotal)}</div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="action-btn movimiento" onclick="openTransactionModal('${person.id}')">
                    <span>💸</span> Registrar Movimiento
                </button>
                <button class="action-btn actualizar-dale" onclick="openDaleModal('${person.id}')">
                    <span>💰</span> Actualizar Dale
                </button>
            </div>
            
            ${person.transacciones.length > 0 ? `
                <div class="transactions">
                    <strong>📋 Historial de Movimientos</strong>
                    <ul>
                        ${person.transacciones.slice().reverse().map(t => `
                            <li>
                                <span class="transaction-type ${t.tipo === 'recarga' ? 'transaction-recarga' : 'transaction-retiro'}">
                                    ${t.tipo === 'recarga' ? '💳 Recarga' : '💵 Retiro'}: ${formatCurrency(t.cantidad)}
                                </span>
                                <span class="transaction-date">${new Date(t.fecha).toLocaleDateString('es-ES', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        personList.appendChild(card);
    });
}

// Modal Persona
addPersonBtn.onclick = () => {
    personModal.style.display = 'flex';
    personNameInput.value = '';
    initialDaleInput.value = '0';
};

closePersonModal.onclick = () => {
    personModal.style.display = 'none';
};

savePersonBtn.onclick = () => {
    const nombre = personNameInput.value.trim();
    const saldoDale = parseFloat(initialDaleInput.value) || 0;
    
    if (!nombre) {
        alert('❌ Por favor escribe un nombre');
        return;
    }
    
    const people = getPeople();
    people.push({
        id: Date.now().toString(),
        nombre,
        saldoDale,
        transacciones: []
    });
    savePeople(people);
    personModal.style.display = 'none';
    renderPeople();
};

// Modal Transacción
function openTransactionModal(personId) {
    editingPersonId = personId;
    transactionModal.style.display = 'flex';
    transactionAmount.value = '';
    transactionType.value = 'recarga';
}

window.openTransactionModal = openTransactionModal;

closeTransactionModal.onclick = () => {
    transactionModal.style.display = 'none';
};

saveTransactionBtn.onclick = () => {
    const cantidad = parseFloat(transactionAmount.value);
    const tipo = transactionType.value;
    
    if (isNaN(cantidad) || cantidad <= 0) {
        alert('❌ Por favor ingresa una cantidad válida');
        return;
    }
    
    const people = getPeople();
    const idx = people.findIndex(p => p.id === editingPersonId);
    
    if (idx === -1) return;
    
    // Agregar transacción
    people[idx].transacciones.push({
        tipo,
        cantidad,
        fecha: new Date().toISOString()
    });
    
    // Actualizar saldo en Dale automáticamente
    if (tipo === 'recarga') {
        // Recarga: se suma al saldo en Dale (porque metes dinero)
        people[idx].saldoDale = (people[idx].saldoDale || 0) + cantidad;
    } else if (tipo === 'retiro') {
        // Retiro: se resta del saldo en Dale (porque sacas dinero)
        people[idx].saldoDale = (people[idx].saldoDale || 0) - cantidad;
    }
    
    savePeople(people);
    transactionModal.style.display = 'none';
    renderPeople();
};

// Modal Actualizar Dale
function openDaleModal(personId) {
    editingPersonId = personId;
    const people = getPeople();
    const person = people.find(p => p.id === personId);
    
    if (person) {
        daleAmount.value = person.saldoDale || 0;
    }
    
    daleModal.style.display = 'flex';
}

window.openDaleModal = openDaleModal;

closeDaleModal.onclick = () => {
    daleModal.style.display = 'none';
};

saveDaleBtn.onclick = () => {
    const nuevoSaldo = parseFloat(daleAmount.value);
    
    if (isNaN(nuevoSaldo) || nuevoSaldo < 0) {
        alert('❌ Por favor ingresa un saldo válido');
        return;
    }
    
    const people = getPeople();
    const idx = people.findIndex(p => p.id === editingPersonId);
    
    if (idx === -1) return;
    
    people[idx].saldoDale = nuevoSaldo;
    
    savePeople(people);
    daleModal.style.display = 'none';
    renderPeople();
};

// Cerrar modales al hacer click fuera
window.onclick = function(event) {
    if (event.target === personModal) personModal.style.display = 'none';
    if (event.target === transactionModal) transactionModal.style.display = 'none';
    if (event.target === daleModal) daleModal.style.display = 'none';
};

// Inicializar
renderPeople();
