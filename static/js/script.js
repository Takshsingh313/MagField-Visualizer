
const CONFIG = {
  
    MU_0: 1.0,              
    SOFTENING: 5.0,         

    DIPOLE_MOMENT: 100.0,   
    DIPOLE_RADIUS: 15,      

    WIRE_CURRENT: 50.0,     
    WIRE_LENGTH: 1000,      

    ARROW_SCALE: 2.0,       
    MAX_FIELD_DISPLAY: 5.0, 
};


const state = {
    dipoles: [],
    wires: [],
    settings: {
        showVectors: true,
        showStreamlines: true,
        gridSpacing: 40,
        streamDensity: 15,
        streamLength: 200,
        stepSize: 2.0,
    },
    interaction: {
        dragging: null,
        rotating: null,
        offset: { x: 0, y: 0 },
    },
    rendering: {
        animationId: null,
        needsRender: true,
        isRendering: false,
        progressiveMode: false,
        streamlineChunks: [],
        currentChunk: 0,
    }
};


const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    requestRender();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Dipole {
    constructor(x, y, angle = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;  
        this.moment = CONFIG.DIPOLE_MOMENT;
        this.radius = CONFIG.DIPOLE_RADIUS;
    }

     */
    getField(px, py) {

        const dx = px - this.x;
        const dy = py - this.y;
        const r2 = dx * dx + dy * dy;
        const r2_soft = r2 + CONFIG.SOFTENING * CONFIG.SOFTENING;
        const r = Math.sqrt(r2_soft);
        const r3 = r2_soft * r;

        if (r < 1e-6) return { x: 0, y: 0 };

       
        const mx = this.moment * Math.cos(this.angle);
        const my = this.moment * Math.sin(this.angle);

     
        const rx_hat = dx / r;
        const ry_hat = dy / r;

        const m_dot_r = mx * rx_hat + my * ry_hat;

     
        const factor = CONFIG.MU_0 / r3;
        const Bx = factor * (3 * m_dot_r * rx_hat - mx);
        const By = factor * (3 * m_dot_r * ry_hat - my);

        return { x: Bx, y: By };
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(this.radius * 0.8, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

     
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.8, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

       
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', this.radius * 0.8, 0);
        ctx.fillText('S', -this.radius * 0.8, 0);

       
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.radius * 2, 0, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    contains(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius * 1.5;
    }

    handleContains(px, py) {
        const handleX = this.x + this.radius * 2 * Math.cos(this.angle);
        const handleY = this.y + this.radius * 2 * Math.sin(this.angle);
        const dx = px - handleX;
        const dy = py - handleY;
        return Math.sqrt(dx * dx + dy * dy) < 8;
    }
}


 */
class Wire {
    constructor(x, y, current = CONFIG.WIRE_CURRENT) {
        this.x = x;
        this.y = y;
        this.current = current; 
        this.radius = 10;
    }


     */
    getField(px, py) {
       
        const dx = px - this.x;
        const dy = py - this.y;
        const r2 = dx * dx + dy * dy;
        const r2_soft = r2 + CONFIG.SOFTENING * CONFIG.SOFTENING;
        const r = Math.sqrt(r2_soft);

        if (r < 1e-6) return { x: 0, y: 0 };

        const B_mag = (CONFIG.MU_0 * this.current) / (2 * Math.PI * r);

        return {
            x: -B_mag * dy / r,
            y: B_mag * dx / r
        };
    }

    draw() {
        ctx.save();

     
        if (this.current > 0) {
            
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = '#059669';
        } else {
           
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#d97706';
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

     
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        if (this.current > 0) {
          
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        } else {
       
            ctx.beginPath();
            ctx.moveTo(this.x - 5, this.y - 5);
            ctx.lineTo(this.x + 5, this.y + 5);
            ctx.moveTo(this.x + 5, this.y - 5);
            ctx.lineTo(this.x - 5, this.y + 5);
            ctx.stroke();
        }

        ctx.restore();
    }

    contains(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
       
        return Math.sqrt(dx * dx + dy * dy) < this.radius * 3;
    }
}

function getTotalField(x, y) {
    let Bx = 0, By = 0;

    for (const dipole of state.dipoles) {
        const field = dipole.getField(x, y);
        Bx += field.x;
        By += field.y;
    }

  
    for (const wire of state.wires) {
        const field = wire.getField(x, y);
        Bx += field.x;
        By += field.y;
    }

    return { x: Bx, y: By };
}


function rk4Step(x, y, h, forward = true) {
    const sign = forward ? 1 : -1;

 
    const B1 = getTotalField(x, y);
    const mag1 = Math.sqrt(B1.x * B1.x + B1.y * B1.y);
    if (mag1 < 1e-6) return null;
    const k1x = sign * B1.x / mag1;
    const k1y = sign * B1.y / mag1;

    const B2 = getTotalField(x + h * k1x / 2, y + h * k1y / 2);
    const mag2 = Math.sqrt(B2.x * B2.x + B2.y * B2.y);
    if (mag2 < 1e-6) return null;
    const k2x = sign * B2.x / mag2;
    const k2y = sign * B2.y / mag2;

 
    const B3 = getTotalField(x + h * k2x / 2, y + h * k2y / 2);
    const mag3 = Math.sqrt(B3.x * B3.x + B3.y * B3.y);
    if (mag3 < 1e-6) return null;
    const k3x = sign * B3.x / mag3;
    const k3y = sign * B3.y / mag3;

    const B4 = getTotalField(x + h * k3x, y + h * k3y);
    const mag4 = Math.sqrt(B4.x * B4.x + B4.y * B4.y);
    if (mag4 < 1e-6) return null;
    const k4x = sign * B4.x / mag4;
    const k4y = sign * B4.y / mag4;


    const nextX = x + h * (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
    const nextY = y + h * (k1y + 2 * k2y + 2 * k3y + k4y) / 6;

    return { x: nextX, y: nextY };
}

function traceStreamline(x0, y0) {
    const points = [];
    const maxSteps = state.settings.streamLength;
    const stepSize = state.settings.stepSize;

    let x = x0, y = y0;
    for (let i = 0; i < maxSteps; i++) {
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) break;

        const field = getTotalField(x, y);
        const mag = Math.sqrt(field.x * field.x + field.y * field.y);
        points.push({ x, y, mag });

        const next = rk4Step(x, y, stepSize, true);
        if (!next) break;

        x = next.x;
        y = next.y;
    }

    x = x0;
    y = y0;
    for (let i = 0; i < maxSteps; i++) {
        const next = rk4Step(x, y, stepSize, false);
        if (!next) break;

        x = next.x;
        y = next.y;

        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) break;

        const field = getTotalField(x, y);
        const mag = Math.sqrt(field.x * field.x + field.y * field.y);
        points.unshift({ x, y, mag });
    }

    return points;
}


function magnitudeToColor(mag) {
    const normalized = Math.min(mag / CONFIG.MAX_FIELD_DISPLAY, 1.0);

    if (normalized < 0.25) {
        const t = normalized / 0.25;
        return `rgb(${Math.floor(66 * (1 - t) + 6 * t)}, ${Math.floor(153 * (1 - t) + 182 * t)}, ${Math.floor(245 * (1 - t) + 212 * t)})`;
    } else if (normalized < 0.5) {
        const t = (normalized - 0.25) / 0.25;
        return `rgb(${Math.floor(6 * (1 - t) + 16 * t)}, ${Math.floor(182 * (1 - t) + 185 * t)}, ${Math.floor(212 * (1 - t) + 129 * t)})`;
    } else if (normalized < 0.75) {
        const t = (normalized - 0.5) / 0.25;
        return `rgb(${Math.floor(16 * (1 - t) + 245 * t)}, ${Math.floor(185 * (1 - t) + 158 * t)}, ${Math.floor(129 * (1 - t) + 11 * t)})`;
    } else {
        const t = (normalized - 0.75) / 0.25;
        return `rgb(${Math.floor(245 * (1 - t) + 239 * t)}, ${Math.floor(158 * (1 - t) + 68 * t)}, ${Math.floor(11 * (1 - t) + 68 * t)})`;
    }
}

function requestRender() {
    state.rendering.needsRender = true;
    if (!state.rendering.animationId) {
        state.rendering.animationId = requestAnimationFrame(animationLoop);
    }
}

function animationLoop() {
    if (state.rendering.needsRender) {
        state.rendering.needsRender = false;
        state.rendering.isRendering = true;

        const isInteracting = state.interaction.dragging || state.interaction.rotating;

        if (isInteracting) {
            renderFast();
        } else {
            const streamCount = state.settings.streamDensity * state.settings.streamDensity;
            if (state.settings.showStreamlines && streamCount > 100) {
                startProgressiveRender();
            } else {
                render();
            }
        }

        state.rendering.isRendering = false;
    }

    if (state.rendering.progressiveMode && !state.interaction.dragging && !state.interaction.rotating) {
        renderNextChunk();
    }

    
    state.rendering.animationId = requestAnimationFrame(animationLoop);
}


function renderFast() {
  
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.settings.showVectors) {
        drawVectorField();
    }

    if (state.settings.showStreamlines) {
        drawStreamlines(8); 
    }

    for (const dipole of state.dipoles) dipole.draw();
    for (const wire of state.wires) wire.draw();
}

function render() {
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.settings.showVectors) {
        drawVectorField();
    }

    if (state.settings.showStreamlines) {
        drawStreamlines();
    }

    for (const dipole of state.dipoles) {
        dipole.draw();
    }
    for (const wire of state.wires) {
        wire.draw();
    }
}

function drawVectorField() {
    const spacing = state.settings.gridSpacing;
    const hasAnySources = state.dipoles.length > 0 || state.wires.length > 0;

    for (let x = spacing / 2; x < canvas.width; x += spacing) {
        for (let y = spacing / 2; y < canvas.height; y += spacing) {
            const field = getTotalField(x, y);
            const mag = Math.sqrt(field.x * field.x + field.y * field.y);

            if (!hasAnySources) {
                drawPlaceholderArrow(x, y, spacing);
                continue;
            }

            if (mag < 1e-6) continue;


            const scale = Math.min(CONFIG.ARROW_SCALE * spacing / 3, mag * spacing / 5);
            const dx = (field.x / mag) * scale;
            const dy = (field.y / mag) * scale;

     
            const color = magnitudeToColor(mag);
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + dx, y + dy);
            ctx.stroke();

            const angle = Math.atan2(dy, dx);
            const headLen = 4;
            ctx.beginPath();
            ctx.moveTo(x + dx, y + dy);
            ctx.lineTo(
                x + dx - headLen * Math.cos(angle - Math.PI / 6),
                y + dy - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                x + dx - headLen * Math.cos(angle + Math.PI / 6),
                y + dy - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
        }
    }
}


function drawPlaceholderArrow(x, y, spacing) {
    const scale = spacing / 4;
    const dx = scale;
    const dy = 0;

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();

    const angle = Math.atan2(dy, dx);
    const headLen = 3;
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(
        x + dx - headLen * Math.cos(angle - Math.PI / 6),
        y + dy - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x + dx - headLen * Math.cos(angle + Math.PI / 6),
        y + dy - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

function drawStreamlines(densityOverride = null) {
    const density = densityOverride || state.settings.streamDensity;
    const seedPoints = generateSeedPoints(density);

    for (const seed of seedPoints) {
        const points = traceStreamline(seed.x, seed.y);
        if (points.length < 2) continue;
        drawSingleStreamline(points);
    }
}

function generateSeedPoints(density) {
    const seeds = [];
    for (let x = 0; x < canvas.width; x += canvas.width / density) {
        for (let y = 0; y < canvas.height; y += canvas.height / density) {
            const seedX = x + (Math.random() - 0.5) * (canvas.width / density) * 0.5;
            const seedY = y + (Math.random() - 0.5) * (canvas.height / density) * 0.5;
            seeds.push({ x: seedX, y: seedY });
        }
    }
    return seeds;
}


function drawSingleStreamline(points) {
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        ctx.strokeStyle = magnitudeToColor(p1.mag);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function startProgressiveRender() {
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.settings.showVectors) {
        drawVectorField();
    }

    for (const dipole of state.dipoles) dipole.draw();
    for (const wire of state.wires) wire.draw();

    showLoadingIndicator();

    const density = state.settings.streamDensity;
    const seedPoints = generateSeedPoints(density);

    const chunkSize = 10;
    state.rendering.streamlineChunks = [];
    for (let i = 0; i < seedPoints.length; i += chunkSize) {
        state.rendering.streamlineChunks.push(seedPoints.slice(i, i + chunkSize));
    }

    state.rendering.currentChunk = 0;
    state.rendering.progressiveMode = true;
}

function renderNextChunk() {
    if (state.rendering.currentChunk >= state.rendering.streamlineChunks.length) {
        state.rendering.progressiveMode = false;
        hideLoadingIndicator();
        return;
    }

    const chunk = state.rendering.streamlineChunks[state.rendering.currentChunk];

    for (const seed of chunk) {
        const points = traceStreamline(seed.x, seed.y);
        if (points.length >= 2) {
            drawSingleStreamline(points);
        }
    }

    for (const dipole of state.dipoles) dipole.draw();
    for (const wire of state.wires) wire.draw();

    const progress = Math.round((state.rendering.currentChunk / state.rendering.streamlineChunks.length) * 100);
    updateLoadingProgress(progress);

    state.rendering.currentChunk++;
}

function showLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        indicator.textContent = 'Rendering: 0%';
    }
}

function updateLoadingProgress(progress) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.textContent = `Rendering: ${progress}%`;
    }
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

let lastCursorUpdate = 0;
const CURSOR_UPDATE_THROTTLE = 50;

function updateCursorInfo(x, y) {
    const now = Date.now();
    if (now - lastCursorUpdate < CURSOR_UPDATE_THROTTLE) {
        return;
    }
    lastCursorUpdate = now;

    const field = getTotalField(x, y);
    const mag = Math.sqrt(field.x * field.x + field.y * field.y);

    const posValue = document.getElementById('posValue');
    const fieldValue = document.getElementById('fieldValue');

    if (posValue && fieldValue) {
        posValue.textContent = [(${Math.round(x)}, ${Math.round(y)})]
        fieldValue.textContent = mag.toFixed(3);
    }
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const dipole of state.dipoles) {
        if (dipole.handleContains(x, y)) {
            state.interaction.rotating = dipole;
            return;
        }
    }

    for (const dipole of state.dipoles) {
        if (dipole.contains(x, y)) {
            state.interaction.dragging = dipole;
            state.interaction.offset = {
                x: x - dipole.x,
                y: y - dipole.y
            };
            return;
        }
    }

    for (const wire of state.wires) {
        if (wire.contains(x, y)) {
            state.interaction.dragging = wire;
            state.interaction.offset = {
                x: x - wire.x,
                y: y - wire.y
            };
            return;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.interaction.dragging) {
        if (e.buttons !== 1) {
            state.interaction.dragging = null;
            state.interaction.rotating = null;
            canvas.style.cursor = 'default';
            return;
        }

        state.interaction.dragging.x = x - state.interaction.offset.x;
        state.interaction.dragging.y = y - state.interaction.offset.y;
        canvas.style.cursor = 'grabbing';
        requestRender();
        return;
    }

    if (state.interaction.rotating) {
        const dx = x - state.interaction.rotating.x;
        const dy = y - state.interaction.rotating.y;
        state.interaction.rotating.angle = Math.atan2(dy, dx);
        canvas.style.cursor = 'grabbing';
        requestRender();
        return;
    }

    let hovering = false;

    for (const dipole of state.dipoles) {
        if (dipole.handleContains(x, y)) {
            canvas.style.cursor = 'grab';
            hovering = true;
            break;
        }
    }

    if (!hovering) {
        for (const dipole of state.dipoles) {
            if (dipole.contains(x, y)) {
                canvas.style.cursor = 'move';
                hovering = true;
                break;
            }
        }
    }

    if (!hovering) {
        for (const wire of state.wires) {
            if (wire.contains(x, y)) {
                canvas.style.cursor = 'move';
                hovering = true;
                break;
            }
        }
    }

    if (!hovering) {
        canvas.style.cursor = 'default';
    }

    updateCursorInfo(x, y);
});

window.addEventListener('mouseup', () => {
    if (state.interaction.dragging || state.interaction.rotating) {
        state.interaction.dragging = null;
        state.interaction.rotating = null;
        requestRender();
    }
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedRender = debounce(requestRender, 150);



document.getElementById('addDipole').addEventListener('click', () => {
    state.dipoles.push(new Dipole(
        canvas.width / 2 + (Math.random() - 0.5) * 100,
        canvas.height / 2 + (Math.random() - 0.5) * 100,
        Math.random() * Math.PI * 2
    ));
    requestRender();
});

document.getElementById('addWirePositive').addEventListener('click', () => {
    state.wires.push(new Wire(
        canvas.width / 2 + (Math.random() - 0.5) * 100,
        canvas.height / 2 + (Math.random() - 0.5) * 100,
        CONFIG.WIRE_CURRENT 
    ));
    requestRender();
});

document.getElementById('addWireNegative').addEventListener('click', () => {
    state.wires.push(new Wire(
        canvas.width / 2 + (Math.random() - 0.5) * 100,
        canvas.height / 2 + (Math.random() - 0.5) * 100,
        -CONFIG.WIRE_CURRENT 
    ));
    requestRender();
});

document.getElementById('clearAll').addEventListener('click', () => {
    state.dipoles = [];
    state.wires = [];
    requestRender();
});

document.getElementById('showVectors').addEventListener('change', (e) => {
    state.settings.showVectors = e.target.checked;
    requestRender();
});

document.getElementById('showStreamlines').addEventListener('change', (e) => {
    state.settings.showStreamlines = e.target.checked;
    requestRender();
});

const STRENGTH_LEVELS = {
    dipole: [50, 100, 300],
    wire: [50, 100, 300]
};

document.querySelectorAll('.segment-btn').forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode') || 'dipole'; 

        const levels = mode === 'wire' ? STRENGTH_LEVELS.wire : STRENGTH_LEVELS.dipole;
        const strength = levels[index];

        if (mode === 'wire') {
            CONFIG.WIRE_CURRENT = strength;
            for (const wire of state.wires) {
                const sign = wire.current >= 0 ? 1 : -1;
                wire.current = strength * sign;
            }
        } else {
            CONFIG.DIPOLE_MOMENT = strength;
            for (const dipole of state.dipoles) dipole.moment = strength;
        }

        requestRender();
    });
});

document.getElementById('gridSpacing').addEventListener('input', (e) => {
    state.settings.gridSpacing = parseInt(e.target.value);
    document.getElementById('gridSpacingValue').textContent = e.target.value;
    debouncedRender(); 
});

document.getElementById('streamDensity').addEventListener('input', (e) => {
    state.settings.streamDensity = parseInt(e.target.value);
    document.getElementById('streamDensityValue').textContent = e.target.value;
    debouncedRender(); 
});

document.getElementById('streamLength').addEventListener('input', (e) => {
    state.settings.streamLength = parseInt(e.target.value);
    document.getElementById('streamLengthValue').textContent = e.target.value;
    debouncedRender(); 
});

document.getElementById('stepSize').addEventListener('input', (e) => {
    state.settings.stepSize = parseFloat(e.target.value);
    document.getElementById('stepSizeValue').textContent = e.target.value;
    debouncedRender(); 
});

document.getElementById('exportPNG').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `magnetic-field-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});


const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

document.getElementById('themeToggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    localStorage.setItem('theme', newTheme);
    requestRender(); 
});

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

if (mode === 'dipole') {
    document.getElementById('addDipole').style.display = 'flex';
    document.getElementById('addWirePositive').parentElement.style.display = 'none';

    const title = document.getElementById('strengthTitle');
    if (title) title.textContent = 'Dipole Strength';

    state.dipoles.push(new Dipole(canvas.width / 2, canvas.height / 2));
} else if (mode === 'wire') {
    document.getElementById('addDipole').style.display = 'none';
    document.getElementById('addWirePositive').parentElement.style.display = 'flex';

    const title = document.getElementById('strengthTitle');
    if (title) title.textContent = 'Wire Strength';

    state.wires.push(new Wire(canvas.width / 2, canvas.height / 2, CONFIG.WIRE_CURRENT));
}

animationLoop();
requestRender();

