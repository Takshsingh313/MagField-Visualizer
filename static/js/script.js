
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

        // North pole (N)
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

    // Contribution from all dipoles
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
