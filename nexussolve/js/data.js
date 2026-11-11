/* ==========================================================
   data.js - Datos semilla (objetos planos): usuario demo, 13 retos
   y soluciones iniciales. Las clases del modelo los convierten en
   objetos (ver models.js). Todo el código de ejemplo es JavaScript.
   ========================================================== */
const SeedData = (function () {
  const DEMO_USER = {
    username: 'Angelo2008',
    password: 'Sago2008',
    displayName: 'Angelo García',
    bio: 'Desarrollador Full-Stack & Ingeniero de Software.'
  };

  // difficulty: 1 Básico · 2 Intermedio · 3 Avanzado · 4 Experto
  const CHALLENGES = [
    {
      id: 'chl-1', number: 1, company: 'Puerto de Callao Logistics', industry: 'Logística', difficulty: 3,
      title: 'Optimización de rutas de contenedores y predicción de cuellos de botella',
      summary: 'Optimización en tiempo real de rutas de contenedores y predicción de cuellos de botella en patio portuario.',
      reward: 4500, tags: ['Algoritmos de grafos', 'IoT', 'Logística'], deadline: '2026-12-15', file: 'container_optimizer.js',
      starter: `// Puerto de Callao Logistics - Rutas óptimas con Dijkstra
function optimizeContainerRoutes(yardGraph, startBay, destinationCranes) {
  const dist = {};
  for (const node of Object.keys(yardGraph)) dist[node] = Infinity;
  dist[startBay] = 0;
  const queue = [[0, startBay]];

  while (queue.length > 0) {
    queue.sort((a, b) => a[0] - b[0]);
    const [cost, current] = queue.shift();
    if (cost > dist[current]) continue;
    for (const [neighbor, weight] of yardGraph[current] || []) {
      if (cost + weight < dist[neighbor]) {
        dist[neighbor] = cost + weight;
        queue.push([dist[neighbor], neighbor]);
      }
    }
  }

  const result = {};
  for (const crane of destinationCranes) result[crane] = dist[crane];
  return result;
}

const patio = {
  Bay_A: [['Lane_1', 3], ['Lane_2', 6]],
  Lane_1: [['Grua_STS_1', 4]],
  Lane_2: [],
  Grua_STS_1: []
};
console.log('Rutas óptimas calculadas:', JSON.stringify(optimizeContainerRoutes(patio, 'Bay_A', ['Grua_STS_1'])));
`
    },
    {
      id: 'chl-2', number: 2, company: 'FinTech Global Sol', industry: 'Finanzas', difficulty: 3,
      title: 'Detección de anomalías en transacciones transfronterizas mediante microservicios',
      summary: 'Detección de anomalías en transacciones transfronterizas mediante microservicios de baja latencia.',
      reward: 6000, tags: ['Machine Learning', 'Microservicios', 'Estadística'], deadline: '2026-12-01', file: 'anomaly_detector.js',
      starter: `// Detector de anomalías por puntaje Z (z-score)
function detectAnomalies(transactions, threshold = 2.5) {
  const amounts = transactions.map(t => t.amount);
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  return transactions.map(tx => {
    const zScore = Math.abs((tx.amount - avg) / (stdDev || 1));
    return {
      id: tx.id,
      amount: tx.amount,
      zScore: Number(zScore.toFixed(2)),
      isFraud: zScore > threshold || tx.amount > 30000
    };
  });
}

const muestra = [
  { id: 'TX1', amount: 150 }, { id: 'TX2', amount: 210 },
  { id: 'TX3', amount: 180 }, { id: 'TX4', amount: 48000 }
];
console.log(JSON.stringify(detectAnomalies(muestra), null, 2));
`
    },
    {
      id: 'chl-3', number: 3, company: 'EcoEnergy Corp', industry: 'Energía', difficulty: 2,
      title: 'Sistema de balanceo de carga para red distribuida de paneles solares residenciales',
      summary: 'Sistema de balanceo de carga para red distribuida de paneles solares residenciales.',
      reward: 3200, tags: ['Energía', 'Ciencia de datos', 'Redes'], deadline: '2026-11-30', file: 'solar_balancer.js',
      starter: `// Balanceo dinámico de una red fotovoltaica residencial
function balanceSolarGrid(generationKw, demandKw, batteryKwh, maxBattery = 15) {
  const net = generationKw - demandKw;
  if (net > 0) {
    const charge = Math.min(net, maxBattery - batteryKwh);
    return { action: 'ALMACENAR_Y_EXPORTAR', chargeKw: charge, gridKw: +(net - charge).toFixed(2) };
  }
  const deficit = Math.abs(net);
  const discharge = Math.min(deficit, batteryKwh);
  return { action: 'CUBRIR_DEFICIT', batteryKw: discharge, gridImportKw: +(deficit - discharge).toFixed(2) };
}

console.log(balanceSolarGrid(6.2, 2.5, 8.0));
console.log(balanceSolarGrid(1.0, 4.5, 2.0));
`
    },
    {
      id: 'chl-4', number: 4, company: 'AgriTech Solutions', industry: 'Agricultura', difficulty: 3,
      title: 'Algoritmo de procesamiento de imágenes satelitales para detección temprana de plagas',
      summary: 'Algoritmo de procesamiento de imágenes satelitales para detección temprana de plagas.',
      reward: 5000, tags: ['Visión por computador', 'NDVI', 'Agricultura'], deadline: '2026-12-20', file: 'pest_ndvi_detector.js',
      starter: `// Detección de estrés foliar con el índice NDVI
function calculateNdviStress(nir, red, threshold = 0.33) {
  const total = nir + red;
  const ndvi = total > 0 ? (nir - red) / total : 0;
  return { ndvi: Number(ndvi.toFixed(3)), pestAlert: ndvi < threshold };
}

const parcelas = [
  { nombre: 'Parcela Norte', nir: 0.45, red: 0.28 },
  { nombre: 'Parcela Sur', nir: 0.62, red: 0.11 }
];
for (const p of parcelas) {
  console.log(p.nombre, JSON.stringify(calculateNdviStress(p.nir, p.red)));
}
`
    },
    {
      id: 'chl-5', number: 5, company: 'HealthSync Systems', industry: 'Salud', difficulty: 4,
      title: 'Módulo de encriptación end-to-end con especificación FHIR para historias clínicas',
      summary: 'Módulo de encriptación end-to-end con especificación FHIR para historias clínicas.',
      reward: 7500, tags: ['Ciberseguridad', 'Criptografía', 'FHIR'], deadline: '2026-11-25', file: 'fhir_encryption.js',
      starter: `// Cifrado AES-256-GCM de recursos HL7 FHIR con Web Crypto
async function encryptFhirResource(resource) {
  if (!globalThis.crypto || !crypto.subtle) {
    console.log('Web Crypto no está disponible en este contexto.');
    return null;
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(resource));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);
  const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return {
    resourceType: resource.resourceType,
    id: resource.id,
    algorithm: 'AES-256-GCM',
    iv: toHex(iv),
    ciphertext: toHex(cipher).slice(0, 48) + '...'
  };
}

encryptFhirResource({ resourceType: 'Patient', id: 'P101', name: 'Paciente de prueba' })
  .then(r => console.log(JSON.stringify(r, null, 2)));
`
    },
    {
      id: 'chl-6', number: 6, company: 'CodeAcademy Labs', industry: 'Educación', difficulty: 1,
      title: 'Aplicación simple de software en clase de programación: Script "Hola Mundo"',
      summary: 'Script básico de "Hola Mundo" con reporte de validación para dar la bienvenida a nuevos programadores.',
      reward: 1200, tags: ['JavaScript', 'Básico', 'Educación'], deadline: '2026-12-30', file: 'hola_mundo.js',
      starter: `// CodeAcademy Labs - Reto inicial: Script "Hola Mundo"
function holaMundo(nombreUsuario) {
  const saludo = '¡Hola Mundo desde NexusSolve! Bienvenido/a, ' + nombreUsuario + '.';
  return {
    status: 200,
    saludo: saludo,
    usuario: nombreUsuario,
    longitudCaracteres: saludo.length,
    lenguaje: 'JavaScript',
    verificado: true
  };
}

const resultado = holaMundo('NexusSolve');
console.log(resultado.saludo);
console.log(JSON.stringify(resultado, null, 2));
`
    },
    {
      id: 'chl-7', number: 7, company: 'PokeWorld Gaming', industry: 'Entretenimiento', difficulty: 2,
      title: 'Mini simulación de combate por turnos basada en estadísticas de Pokémon',
      summary: 'Mini simulación de combate por turnos basada en estadísticas de Pokémon usando clases y estructuras de datos básicas.',
      reward: 2500, tags: ['POO', 'Juegos', 'Simulación'], deadline: '2026-12-10', file: 'pokemon_battle_sim.js',
      starter: `// PokeWorld Gaming - Simulación de combate por turnos
class Pokemon {
  constructor(name, hp, attack, defense, speed) {
    this.name = name;
    this.hp = hp;
    this.attack = attack;
    this.defense = defense;
    this.speed = speed;
  }
  attackTo(rival) {
    const damage = Math.max(5, Math.floor((this.attack / rival.defense) * 22));
    rival.hp = Math.max(0, rival.hp - damage);
    return damage;
  }
}

function simulateBattle(a, b, maxTurns = 10) {
  const log = ['¡Comienza el combate: ' + a.name + ' vs ' + b.name + '!'];
  let first = a.speed >= b.speed ? a : b;
  let second = first === a ? b : a;
  for (let turn = 1; turn <= maxTurns && a.hp > 0 && b.hp > 0; turn++) {
    const d1 = first.attackTo(second);
    log.push('Turno ' + turn + ': ' + first.name + ' causa ' + d1 + ' a ' + second.name + ' (HP: ' + second.hp + ')');
    if (second.hp === 0) break;
    const d2 = second.attackTo(first);
    log.push('Turno ' + turn + ': ' + second.name + ' causa ' + d2 + ' a ' + first.name + ' (HP: ' + first.hp + ')');
  }
  const winner = a.hp >= b.hp ? a : b;
  log.push('🏆 Ganador: ' + winner.name);
  return log;
}

simulateBattle(new Pokemon('Pikachu', 90, 55, 40, 90), new Pokemon('Squirtle', 95, 48, 65, 43))
  .forEach(line => console.log(line));
`
    },
    {
      id: 'chl-8', number: 8, company: 'RetailChain Andina', industry: 'Comercio', difficulty: 2,
      title: 'Motor de recomendación de productos basado en historial de compras locales',
      summary: 'Motor de recomendación de productos basado en historial de compras locales en tiendas de Bogotá.',
      reward: 3800, tags: ['Recomendación', 'Ciencia de datos', 'Retail'], deadline: '2026-12-05', file: 'recommendation_engine.js',
      starter: `// Motor de recomendación ítem-ítem (producto punto)
function recommend(product, matrix, top = 2) {
  const base = matrix[product] || [];
  return Object.entries(matrix)
    .filter(([name]) => name !== product)
    .map(([name, vec]) => ({ producto: name, similitud: vec.reduce((s, v, i) => s + v * (base[i] || 0), 0) }))
    .sort((a, b) => b.similitud - a.similitud)
    .slice(0, top);
}

const datos = { 'Café': [1, 1, 0], 'Panela': [1, 0, 1], 'Arepas': [0, 1, 1] };
console.log('Recomendaciones para Café:', JSON.stringify(recommend('Café', datos)));
`
    },
    {
      id: 'chl-9', number: 9, company: 'SkyTraffic Control', industry: 'Aviación', difficulty: 4,
      title: 'Algoritmo en grafos para cálculo de rutas de aproximación de aeronaves',
      summary: 'Algoritmo en grafos para cálculo de rutas de aproximación de aeronaves en aeropuertos de alta densidad.',
      reward: 6200, tags: ['Grafos', 'Aviación', 'Planificación'], deadline: '2026-12-18', file: 'flight_approach.js',
      starter: `// Secuenciador de aproximación con separación mínima
function sequenceApproaches(flights, separationMin = 3) {
  const sorted = flights.slice().sort((a, b) => a.eta - b.eta);
  let lastSlot = -Infinity;
  return sorted.map(f => {
    const slot = Math.max(f.eta, lastSlot + separationMin);
    lastSlot = slot;
    return { callsign: f.callsign, eta: f.eta, assignedSlot: slot, delay: slot - f.eta, runway: 'RWY-36L' };
  });
}

const vuelos = [{ callsign: 'IBE10', eta: 10 }, { callsign: 'AVA20', eta: 11 }, { callsign: 'LAN30', eta: 12 }];
sequenceApproaches(vuelos).forEach(v => console.log(JSON.stringify(v)));
`
    },
    {
      id: 'chl-10', number: 10, company: 'GreenWater Utilities', industry: 'Saneamiento', difficulty: 2,
      title: 'Monitoreo IoT de presión en redes de acueducto para alerta temprana de fugas',
      summary: 'Monitoreo IoT de presión en redes de acueducto para alerta temprana de fugas.',
      reward: 4100, tags: ['IoT', 'Series temporales', 'Agua'], deadline: '2026-12-12', file: 'leak_detector.js',
      starter: `// Detector de caídas bruscas de presión hidráulica
function detectLeak(readings, thresholdDrop = 0.9) {
  const drops = [];
  for (let i = 0; i < readings.length - 1; i++) drops.push(+(readings[i] - readings[i + 1]).toFixed(2));
  const maxDrop = Math.max(...drops);
  return { leakDetected: maxDrop > thresholdDrop, maxDrop: maxDrop, atIndex: drops.indexOf(maxDrop) };
}

console.log(JSON.stringify(detectLeak([4.5, 4.4, 3.2, 2.9])));
`
    },
    {
      id: 'chl-11', number: 11, company: 'CyberShield Enterprise', industry: 'Ciberseguridad', difficulty: 3,
      title: 'Analizador de logs de acceso para detección de intentos de fuerza bruta en servidores SSH',
      summary: 'Analizador de logs de acceso para detección de intentos de fuerza bruta en servidores SSH.',
      reward: 5500, tags: ['Ciberseguridad', 'Logs', 'SSH'], deadline: '2026-11-28', file: 'ssh_guard.js',
      starter: `// Analizador de intentos fallidos en auth.log
function detectBruteForce(logs, maxFails = 3) {
  const counts = {};
  for (const line of logs) {
    const match = line.match(/Failed .* from (\\d+\\.\\d+\\.\\d+\\.\\d+)/);
    if (match) counts[match[1]] = (counts[match[1]] || 0) + 1;
  }
  return Object.entries(counts).filter(([, n]) => n >= maxFails).map(([ip, n]) => ({ ip: ip, intentos: n }));
}

const muestra = [
  'Failed password for root from 192.168.1.5 port 22',
  'Failed password for admin from 192.168.1.5 port 22',
  'Failed password for root from 192.168.1.5 port 22',
  'Accepted password for deploy from 10.0.0.8 port 22'
];
console.log('IPs a bloquear:', JSON.stringify(detectBruteForce(muestra)));
`
    },
    {
      id: 'chl-12', number: 12, company: 'CryptoFlow Exchange', industry: 'Blockchain', difficulty: 4,
      title: 'Indexador de transacciones en mempool para seguimiento de comisiones de gas en tiempo real',
      summary: 'Indexador de transacciones en mempool para seguimiento de comisiones de gas en tiempo real.',
      reward: 8000, tags: ['Blockchain', 'Finanzas', 'Tiempo real'], deadline: '2026-12-22', file: 'mempool_oracle.js',
      starter: `// Estimador de comisiones estilo EIP-1559
function estimateGasFees(baseFee, priorityFees) {
  const sorted = priorityFees.slice().sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 2.0;
  return {
    baseFee: baseFee + ' Gwei',
    medianTip: median + ' Gwei',
    suggestedMax: (baseFee * 2 + median).toFixed(1) + ' Gwei'
  };
}

console.log(JSON.stringify(estimateGasFees(22.0, [1.5, 2.0, 3.1]), null, 2));
`
    },
    {
      id: 'chl-13', number: 13, company: 'SmartCity Mobility', industry: 'Transporte Urbano', difficulty: 3,
      title: 'Simulación por autómatas celulares de tráfico vehicular en avenidas principales',
      summary: 'Simulación por autómatas celulares (modelo Nagel-Schreckenberg) de tráfico vehicular en avenidas principales.',
      reward: 4900, tags: ['Simulación', 'Smart Cities', 'Autómatas'], deadline: '2026-12-16', file: 'traffic_sim.js',
      starter: `// Modelo Nagel-Schreckenberg (sin frenado aleatorio, determinista)
// -1 = celda vacía, n >= 0 = vehículo con velocidad n
function step(road, vmax = 3) {
  const n = road.length;
  const next = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (road[i] === -1) continue;
    let gap = 0;
    while (gap < vmax && road[(i + gap + 1) % n] === -1) gap++;
    const v = Math.min(road[i] + 1, vmax, gap);
    next[(i + v) % n] = v;
  }
  return next;
}

const draw = (r) => r.map(c => (c === -1 ? '.' : c)).join(' ');
let road = [0, -1, 2, -1, 1, -1, -1, -1, 0, -1];
for (let t = 0; t < 5; t++) {
  console.log('t=' + t + '  ' + draw(road));
  road = step(road);
}
`
    }
  ];

  // Soluciones precargadas del usuario demo (el código es el starter del reto)
  function buildInitialSolutions() {
    const byId = (id) => CHALLENGES.find(c => c.id === id);
    return [
      {
        id: 'sol-06', challengeId: 'chl-6', username: DEMO_USER.username,
        repoName: 'angelo2008/codeacademy-holamundo-v1', fileName: 'hola_mundo.js',
        commitMessage: 'feat: implementación validada de Hola Mundo con reporte JSON', commitHash: 'a8f39c2',
        submittedAt: '2026-11-09 14:20', status: 'aceptada',
        description: 'Script que genera el saludo oficial de bienvenida y un reporte de validación.',
        code: byId('chl-6').starter
      },
      {
        id: 'sol-07', challengeId: 'chl-7', username: DEMO_USER.username,
        repoName: 'angelo2008/pokeworld-turn-battle-engine', fileName: 'pokemon_battle_sim.js',
        commitMessage: 'feat: motor de batalla por turnos con velocidad y daño', commitHash: 'b4e719d',
        submittedAt: '2026-11-09 16:45', status: 'en_revision',
        description: 'Simulador de combates Pokémon por turnos con registro detallado.',
        code: byId('chl-7').starter
      }
    ];
  }

  return { DEMO_USER, CHALLENGES, initialSolutions: buildInitialSolutions };
})();
