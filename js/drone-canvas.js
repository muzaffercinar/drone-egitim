/* ═══ DRONE CANVAS RENDERER (HTML5 Canvas) ═══ */

class DroneCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.trail = [];
        this.drone = { x:0, y:0, z:0, motor:false, mode:'Yerde' };
        this.wind = { active:false, dir:0, speed:0 };
        this.obstacles = [];
        this.nfzZones = [];
        this.propAngle = 0;
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._animate();
    }

    _resize() {
        const r = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = r.width;
        this.canvas.height = r.height;
        this.draw();
    }

    update(data) {
        if ((data.x !== this.drone.x || data.y !== this.drone.y) && data.motor) {
            this.trail.push({ x: this.drone.x, y: this.drone.y });
            if (this.trail.length > 500) this.trail = this.trail.slice(-500);
        }
        this.drone = { x:data.x, y:data.y, z:data.z, motor:data.motor, mode:data.mode };
        if (data.wind) this.wind = data.wind;
    }

    setEnvironment(obstacles, nfzZones, letters = []) {
        this.obstacles = obstacles || [];
        this.nfzZones = nfzZones || [];
        this.letters = letters;
    }

    reset() {
        this.trail = [];
        this.drone = { x:0, y:0, z:0, motor:false, mode:'Yerde' };
    }

    _w2s(wx, wy) {
        const w = this.canvas.width, h = this.canvas.height;
        const scale = Math.min(w, h) / 160;
        return [w/2 + wx * scale, h/2 - wy * scale];
    }

    _w2sR(r) {
        return r * Math.min(this.canvas.width, this.canvas.height) / 160;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width, h = this.canvas.height;
        if (w < 10 || h < 10) return;
        const cx = w/2, cy = h/2;

        // Arka plan
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#1a2233'; ctx.lineWidth = 1;
        for (let i = -80; i <= 80; i += 10) {
            let [sx, sy] = this._w2s(i, -80);
            let [ex, ey] = this._w2s(i, 80);
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
            [sx, sy] = this._w2s(-80, i);
            [ex, ey] = this._w2s(80, i);
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        }

        // Eksenler
        ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#8b949e'; ctx.font = '10px Consolas';
        ctx.fillText('X+', w-20, cy-8);
        ctx.fillText('Y+', cx+8, 14);

        // Yasak bölgeler
        for (const z of this.nfzZones) {
            const [zx, zy] = this._w2s(z.x, z.y);
            const r = this._w2sR(z.radius);
            ctx.beginPath(); ctx.arc(zx, zy, r, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(248,81,73,0.08)'; ctx.fill();
            ctx.strokeStyle = '#f85149'; ctx.lineWidth = 2; ctx.setLineDash([5,3]);
            ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = '#f85149'; ctx.font = 'bold 10px Consolas';
            ctx.textAlign = 'center'; ctx.fillText(`🚫 ${z.name}`, zx, zy+4);
        }

        // Engeller
        for (const o of this.obstacles) {
            const [ox, oy] = this._w2s(o.x, o.y);
            const r = this._w2sR(o.size / 2);
            if (o.type === 'building') {
                ctx.fillStyle = '#2d333b'; ctx.strokeStyle = '#6e7681'; ctx.lineWidth = 2;
                ctx.fillRect(ox-r, oy-r, r*2, r*2);
                ctx.strokeRect(ox-r, oy-r, r*2, r*2);
                ctx.font = `${Math.max(10, r)}px Consolas`;
                ctx.textAlign = 'center'; ctx.fillText('🏢', ox, oy+r*0.3);
            } else {
                ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI*2);
                ctx.fillStyle = '#0d4421'; ctx.fill();
                ctx.strokeStyle = '#2ea043'; ctx.lineWidth = 2; ctx.stroke();
                ctx.font = `${Math.max(10, r)}px Consolas`;
                ctx.textAlign = 'center'; ctx.fillText('🌳', ox, oy+r*0.3);
            }
        }

        // Harfler
        if (this.letters && this.letters.length > 0) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (const l of this.letters) {
                const [lx, ly] = this._w2s(l.x, l.y);
                if (l.collected) {
                    ctx.font = 'bold 12px Consolas';
                    ctx.fillStyle = '#3fb950';
                    ctx.fillText('✔️', lx, ly);
                } else {
                    ctx.font = 'bold 16px Inter, sans-serif';
                    ctx.fillStyle = '#f0d78c';
                    ctx.fillText(l.char, lx, ly);
                }
                ctx.strokeStyle = l.collected ? '#2ea043' : '#d4a843';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(lx, ly, 12, 0, Math.PI*2);
                ctx.stroke();
            }
        }

        // Home noktası
        ctx.fillStyle = '#f0883e'; ctx.font = 'bold 11px Consolas';
        ctx.textAlign = 'center'; ctx.fillText('⌂ HOME', cx, cy+20);
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
        ctx.strokeStyle = '#f0883e'; ctx.lineWidth = 2; ctx.stroke();

        // Uçuş izi
        if (this.trail.length > 1) {
            ctx.strokeStyle = '#1f6feb'; ctx.lineWidth = 2;
            ctx.beginPath();
            let [fx, fy] = this._w2s(this.trail[0].x, this.trail[0].y);
            ctx.moveTo(fx, fy);
            for (let i = 1; i < this.trail.length; i++) {
                let [tx, ty] = this._w2s(this.trail[i].x, this.trail[i].y);
                ctx.lineTo(tx, ty);
            }
            ctx.stroke();
            // Son nokta → drone
            const [lx, ly] = this._w2s(this.trail[this.trail.length-1].x, this.trail[this.trail.length-1].y);
            const [dx, dy] = this._w2s(this.drone.x, this.drone.y);
            ctx.setLineDash([3,3]);
            ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(dx, dy); ctx.stroke();
            ctx.setLineDash([]);
        }

        // Drone çiz
        const [dx, dy] = this._w2s(this.drone.x, this.drone.y);
        this._drawDrone(dx, dy);

        // Rüzgar göstergesi
        if (this.wind.active) this._drawWind(w, h);
    }

    _drawDrone(px, py) {
        const ctx = this.ctx;
        const kol = 32, motorR = 8, gw = 14, gh = 18;
        const positions = [
            [px-kol, py-kol], [px+kol, py-kol],
            [px+kol, py+kol], [px-kol, py+kol]
        ];

        // Gölge
        if (this.drone.z > 0) {
            const off = Math.min(this.drone.z * 0.4, 15);
            const sr = 30;
            ctx.beginPath(); ctx.ellipse(px+off, py+off, sr, sr*0.7, 0, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
        }

        // Pervane blur
        if (this.drone.motor) {
            for (const [kx, ky] of positions) {
                ctx.beginPath(); ctx.arc(kx, ky, 14, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(31,111,235,0.1)'; ctx.fill();
                ctx.strokeStyle = 'rgba(88,166,255,0.3)'; ctx.lineWidth = 1;
                ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]);
            }
        }

        // Kollar
        for (const [kx, ky] of positions) {
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(kx, ky);
            ctx.strokeStyle = '#4a4f5c'; ctx.lineWidth = 4; ctx.stroke();
            ctx.strokeStyle = '#6e7681'; ctx.lineWidth = 2; ctx.stroke();
        }

        // Motorlar
        for (const [kx, ky] of positions) {
            ctx.beginPath(); ctx.arc(kx, ky, motorR, 0, Math.PI*2);
            ctx.fillStyle = '#2d333b'; ctx.fill();
            ctx.strokeStyle = '#4a4f5c'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(kx, ky, 3, 0, Math.PI*2);
            ctx.fillStyle = '#555d6b'; ctx.fill();
        }

        // Pervane kanatları
        if (this.drone.motor) {
            const a = this.propAngle * Math.PI / 180;
            ctx.strokeStyle = '#a0c4ff'; ctx.lineWidth = 2;
            for (const [kx, ky] of positions) {
                for (const off of [0, Math.PI/2]) {
                    const lx = Math.cos(a+off)*12, ly = Math.sin(a+off)*12;
                    ctx.beginPath(); ctx.moveTo(kx-lx, ky-ly); ctx.lineTo(kx+lx, ky+ly); ctx.stroke();
                }
            }
        }

        // Gövde
        ctx.fillStyle = '#2d333b';
        ctx.strokeStyle = '#4a4f5c'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px-gw, py-gh, gw*2, gh*2, 4);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#363d49';
        ctx.fillRect(px-gw+3, py-gh+3, (gw-3)*2, (gh-3)*2);

        // LED'ler
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.arc(px-gw+5, py-gh+5, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#33ff33';
        ctx.beginPath(); ctx.arc(px+gw-5, py-gh+5, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ccccff';
        ctx.beginPath(); ctx.arc(px-gw+5, py+gh-5, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px+gw-5, py+gh-5, 2, 0, Math.PI*2); ctx.fill();

        // Kamera
        ctx.fillStyle = '#0d1117';
        ctx.beginPath(); ctx.arc(px, py+gh*0.5, 5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#4a4f5c'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#5088cc';
        ctx.beginPath(); ctx.arc(px, py+gh*0.5, 2, 0, Math.PI*2); ctx.fill();

        // GPS anten
        ctx.fillStyle = '#58a6ff';
        ctx.beginPath(); ctx.arc(px, py-gh-6, 3, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#555d6b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py-gh-3); ctx.lineTo(px, py-gh+1); ctx.stroke();

        // Koordinat
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Consolas'; ctx.textAlign = 'center';
        ctx.fillText(`(${this.drone.x.toFixed(0)}, ${this.drone.y.toFixed(0)})`, px, py-38);

        // Mod
        const colors = { 'Havada':'#3fb950', 'Eve Dönüyor':'#d29922', 'Acil İniş':'#f85149', 'Yerde':'#8b949e' };
        ctx.fillStyle = colors[this.drone.mode] || '#8b949e';
        ctx.font = 'bold 9px Consolas';
        ctx.fillText(`▸ ${this.drone.mode.toUpperCase()}`, px, py+42);
    }

    _drawWind(w, h) {
        const ctx = this.ctx;
        const cx = w-55, cy = 50, r = 22;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(22,27,34,0.9)'; ctx.fill();
        ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#8b949e'; ctx.font = '8px Consolas'; ctx.textAlign = 'center';
        ctx.fillText('N', cx, cy-r-4);
        const rad = this.wind.dir * Math.PI / 180;
        const ax = cx + Math.sin(rad)*(r-5), ay = cy - Math.cos(rad)*(r-5);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay);
        ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 3; ctx.stroke();
        // Ok ucu
        const angle = Math.atan2(ay-cy, ax-cx);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax-8*Math.cos(angle-0.4), ay-8*Math.sin(angle-0.4));
        ctx.lineTo(ax-8*Math.cos(angle+0.4), ay-8*Math.sin(angle+0.4));
        ctx.closePath(); ctx.fillStyle = '#58a6ff'; ctx.fill();
        ctx.fillStyle = '#58a6ff'; ctx.font = 'bold 9px Consolas';
        ctx.fillText(`💨 ${this.wind.speed}m/s`, cx, cy+r+14);
    }

    _animate() {
        if (this.drone.motor) this.propAngle = (this.propAngle + 25) % 360;
        this.draw();
        requestAnimationFrame(() => this._animate());
    }
}
