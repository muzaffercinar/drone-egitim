/* ═══ DRONE SİMÜLASYON MOTORU (JavaScript) ═══
   Uzman Seviye - 3D Hareket ve Güvenlik Protokolleri Eklenmiştir */

class DroneSim {
    constructor() {
        this.x = 0; this.y = 0; this.z = 0;
        this.battery = 100; this.motorOn = false;
        this.mode = 'Yerde'; this.cancelled = false;
        this.maxAlt = 50; this.hasCamera = true; this.hasGPS = true;
        this.wind = { active: false, dir: 0, speed: 0 };
        this.obstacles = []; this.nfzZones = [];
        this.stats = { distance: 0, photos: 0, cargo: 0, maxAlt: 0 };
        this.onUpdate = null; this.onLog = null;
        this._animFrame = null;
    }

    reset() {
        this.x = 0; this.y = 0; this.z = 0;
        this.battery = 100; this.motorOn = false;
        this.mode = 'Yerde'; this.cancelled = false;
        this.stats = { distance: 0, photos: 0, cargo: 0, maxAlt: 0, collectedLetters: [] };
        if (this.letters) {
            this.letters.forEach(l => l.collected = false);
        }
        this._update();
    }

    _log(msg, type = 'info') {
        if (this.onLog) this.onLog(msg, type);
    }

    _update() {
        if (this.onUpdate) this.onUpdate({
            x: this.x, y: this.y, z: this.z,
            battery: this.battery, motor: this.motorOn,
            mode: this.mode, wind: this.wind
        });
    }

    _consumeBattery(amount) {
        const mult = 1.0 + Math.max(0, (50 - this.battery) * 0.02);
        const windExtra = this.wind.active ? this.wind.speed * 0.08 : 0;
        this.battery = Math.max(0, this.battery - (amount * mult + windExtra));
        this._update();
        return this.battery < 20;
    }

    _checkNFZ(px, py) {
        for (const z of this.nfzZones) {
            const dist = Math.sqrt((px - z.x) ** 2 + (py - z.y) ** 2);
            if (dist <= z.radius) {
                this._log(`🚫 YASAK BÖLGE: '${z.name}'! Giriş engellendi.`, 'error');
                return true;
            }
        }
        return false;
    }

    _checkObstacle(px, py, pz) {
        for (const o of this.obstacles) {
            const distXY = Math.sqrt((px - o.x) ** 2 + (py - o.y) ** 2);
            // Z ekseni (Yükseklik) kontrolü
            const objHeight = o.type === 'building' ? 20 : 10; 
            if (distXY < (o.size / 2 + 3) && pz <= objHeight) {
                this._log(`💥 ENGEL: ${o.type} (${o.x},${o.y}) yüksekliği kurtarmadı! Durduruluyor.`, 'error');
                return true;
            }
        }
        return false;
    }

    async _animatedMove(tx, ty, tz, steps = 10) {
        tx = Number(tx); ty = Number(ty); tz = Number(tz);
        const startX = this.x, startY = this.y, startZ = this.z;

        for (let i = 1; i <= steps; i++) {
            if (this.cancelled) return false;
            
            let expectedX = startX + (tx - startX) * (i / steps);
            let expectedY = startY + (ty - startY) * (i / steps);
            let expectedZ = startZ + (tz - startZ) * (i / steps);

            let wx = 0, wy = 0;
            if (this.wind.active && this.wind.speed > 0) {
                const rad = this.wind.dir * Math.PI / 180;
                const turbulence = Math.random() * 0.8; 
                wx = Math.sin(rad) * this.wind.speed * 0.1 * turbulence;
                wy = Math.cos(rad) * this.wind.speed * 0.1 * turbulence;
            }

            const nx = expectedX + wx;
            const ny = expectedY + wy;
            
            if (this._checkNFZ(nx, ny) || this._checkObstacle(nx, ny, expectedZ)) return false;
            
            this.x = nx; 
            this.y = ny; 
            this.z = expectedZ;
            this.stats.maxAlt = Math.max(this.stats.maxAlt, this.z);
            
            if (this.letters && this.z <= 5 && this.targetName) { 
                const expectedChar = this.targetName[this.stats.collectedLetters.length];
                if (expectedChar) {
                    for (const l of this.letters) {
                        if (!l.collected && l.char === expectedChar && Math.sqrt((this.x - l.x)**2 + (this.y - l.y)**2) < 4) {
                            l.collected = true;
                            this.stats.collectedLetters.push(l.char);
                            this._log(`🔤 Harf Toplandı: ${l.char}`);
                            break;
                        }
                    }
                }
            }

            this._update();
            await this._sleep(120);
        }
        
        this.x = Math.round(tx * 10) / 10;
        this.y = Math.round(ty * 10) / 10;
        this.z = Math.round(tz * 10) / 10;
        
        const dist = Math.sqrt((this.x - startX) ** 2 + (this.y - startY) ** 2);
        this.stats.distance += dist;
        this._update();
        return true;
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ═══ KOMUTLAR ═══
    async motorAc() {
        if (this.motorOn) { this._log('Motorlar zaten açık.', 'warn'); return true; }
        this.motorOn = true;
        this._log('🔧 Motorlar çalıştırıldı.');
        this._update(); await this._sleep(500);
        return true;
    }

    async havalan(height) {
        if (!this.motorOn) { this._log('HATA: Motorlar kapalı!', 'error'); return false; }
        if (height > this.maxAlt) {
            this._log(`UYARI: ${height}m sınır üstü → ${this.maxAlt}m`, 'warn');
            height = this.maxAlt;
        }
        this.mode = 'Havada';
        this._log(`🚀 Havalanıyor → ${height}m`);
        if (this._consumeBattery(3 + height * 0.1)) {
            this._log('⚠️ Batarya kritik!', 'warn'); return false;
        }
        const ok = await this._animatedMove(this.x, this.y, height);
        if (ok) this._log(`✅ Yükseklik ${this.z}m — havada.`);
        return ok;
    }

    async yuksel(miktar) {
        if (this.mode !== 'Havada') { this._log('HATA: Havada olmalı!', 'error'); return false; }
        const yeniZ = Math.min(this.maxAlt, this.z + miktar);
        this._log(`🔼 Yükseliyor → ${yeniZ}m`);
        if (this._consumeBattery(miktar * 0.15)) {
            this._log('⚠️ Batarya kritik!', 'warn'); return false;
        }
        return await this._animatedMove(this.x, this.y, yeniZ);
    }

    async alcal(miktar) {
        if (this.mode !== 'Havada') { this._log('HATA: Havada olmalı!', 'error'); return false; }
        const yeniZ = Math.max(0, this.z - miktar);
        if (yeniZ === 0) {
            return await this.inYap();
        }
        this._log(`🔽 Alçalıyor → ${yeniZ}m`);
        if (this._consumeBattery(miktar * 0.05)) {
            this._log('⚠️ Batarya kritik!', 'warn'); return false;
        }
        return await this._animatedMove(this.x, this.y, yeniZ);
    }

    async rotaGit(tx, ty) {
        if (this.mode !== 'Havada') { this._log('HATA: Drone havada değil!', 'error'); return false; }
        const dist = Math.sqrt((tx - this.x) ** 2 + (ty - this.y) ** 2);
        this._log(`📍 Rota: İleri gidiliyor | ${dist.toFixed(1)}m`);
        if (this._consumeBattery(dist * 0.4)) {
            this._log('⚠️ Batarya kritik!', 'warn'); return false;
        }
        return await this._animatedMove(tx, ty, this.z);
    }

    async fotoCek() {
        if (!this.hasCamera) { this._log('HATA: Kamera yok!', 'error'); return false; }
        this._log(`📸 Fotoğraf — (${this.x}, ${this.y}, Yükseklik: ${this.z})`);
        this._consumeBattery(1); await this._sleep(800);
        this._log('✅ Fotoğraf kaydedildi.');
        this.stats.photos++;
        return true;
    }

    async bekle(seconds) {
        if (this.mode !== 'Havada') { this._log('HATA: Havada olmalı!', 'error'); return false; }
        this._log(`⏳ Bekleniyor: ${seconds}s`);
        const steps = Math.floor(seconds / 0.3);
        for (let i = 0; i < steps; i++) {
            if (this.cancelled) return false;
            this._consumeBattery(0.2);
            await this._sleep(300);
        }
        this._log('✅ Bekleme tamamlandı.');
        return true;
    }

    async kargoBirak() {
        if (this.z > 15) { this._log('⚠️ Kargo bırakmak için çok yüksek! Alçalın.', 'warn'); return false; }
        this._log('📦 Kargo bırakılıyor...');
        this._consumeBattery(0.5); await this._sleep(1000);
        this._log(`✅ Kargo bırakıldı — (${this.x}, ${this.y})`);
        this.stats.cargo++;
        return true;
    }

    async inYap() {
        if (this.mode === 'Yerde') { this._log('Zaten yerde.', 'warn'); return true; }
        this._log(`🔽 İniş — ${this.z}m`);
        this._consumeBattery(1.5);
        await this._animatedMove(this.x, this.y, 0);
        this.motorOn = false; this.mode = 'Yerde';
        this._log(`✅ İniş tamamlandı.`);
        this._update();
        return true;
    }

    async eveDon() {
        this._log('🏠 EVE DÖNÜŞ (RTH) BAŞLADI!', 'warn');
        this.mode = 'Eve Dönüyor'; this._update();
        
        // Önce güvenli bir yüksekliğe (20m) çık ki engellere çarpmasın
        if (this.z < 20) {
            this._log('🔼 Güvenli irtifaya çıkılıyor...');
            await this._animatedMove(this.x, this.y, 20, 5);
        }

        if (this.x !== 0 || this.y !== 0) {
            await this._animatedMove(0, 0, this.z, 15);
        }

        await this._animatedMove(0, 0, 0, 10);
        this.motorOn = false; this.mode = 'Yerde';
        this._log('✅ Eve dönüş güvenle tamamlandı.');
        this._update();
        return true;
    }

    // ═══ GÖREV ÇALIŞTIR ═══
    async runMission(tasks) {
        this.cancelled = false;
        const startTime = Date.now();
        const startBat = this.battery;
        let completed = 0, total = tasks.length;

        this._log('═'.repeat(35));
        this._log(`▶ GÖREV BAŞLADI — ${total} görev`);
        this._log('═'.repeat(35));

        for (let i = 0; i < tasks.length; i++) {
            if (this.cancelled) { this._log('⛔ İptal edildi.', 'warn'); break; }
            if (this.battery < 20 && tasks[i].type !== 'IN_YAP' && tasks[i].type !== 'EVE_DON') {
                this._log(`⚠️ BATARYA KRİTİK (%${this.battery.toFixed(1)})! Acil dönüş...`, 'warn');
                await this.eveDon(); break;
            }

            const t = tasks[i];
            this._log(`── Görev ${i + 1}/${total}: ${t.label || t.type}`);

            let ok = false;
            switch (t.type) {
                case 'MOTOR_AC': ok = await this.motorAc(); break;
                case 'HAVALAN': ok = await this.havalan(Number(t.params?.height || 10)); break;
                case 'YUKSEL': ok = await this.yuksel(Number(t.params?.amount || 5)); break;
                case 'ALCAL': ok = await this.alcal(Number(t.params?.amount || 5)); break;
                case 'ROTA_GIT': 
                    let eklenecekX = Number(t.params?.x || 0);
                    let eklenecekY = Number(t.params?.y || 0);
                    ok = await this.rotaGit(this.x + eklenecekX, this.y + eklenecekY); 
                    break;
                case 'EVE_DON': ok = await this.eveDon(); break;
                case 'FOTO_CEK': ok = await this.fotoCek(); break;
                case 'BEKLE': ok = await this.bekle(Number(t.params?.seconds || 3)); break;
                case 'KARGO_BIRAK': ok = await this.kargoBirak(); break;
                case 'IN_YAP': ok = await this.inYap(); break;
            }
            if (ok) completed++;
            else if (this.battery < 20) { await this.eveDon(); break; }
            await this._sleep(200);
        }

        const duration = (Date.now() - startTime) / 1000;
        const score = this._calculateScore(completed, total, startBat, duration);

        this._log('═'.repeat(35));
        this._log('■ GÖREV TAMAMLANDI');
        this._log(`  Skor: ${score.points}/100 (${score.grade})`);
        this._log(`  Süre: ${score.duration}s | Mesafe: ${score.distance}m`);
        this._log('═'.repeat(35));

        return score;
    }

    _calculateScore(completed, total, startBat, duration) {
        if (total === 0) return { points: 0, grade: 'F', duration: 0, distance: 0, batteryLeft: this.battery };
        const completion = (completed / total) * 40;
        const efficiency = (this.battery / Math.max(startBat, 1)) * 30;
        const speed = Math.max(0, 30 - duration * 0.3);
        const points = Math.min(100, Math.round(completion + efficiency + speed));
        let grade = 'F';
        if (points >= 90) grade = 'A';
        else if (points >= 80) grade = 'B';
        else if (points >= 70) grade = 'C';
        else if (points >= 60) grade = 'D';
        return {
            points, grade,
            duration: Math.round(duration),
            distance: Math.round(this.stats.distance),
            batteryLeft: Math.round(this.battery),
            completed: `${completed}/${total}`,
            photos: this.stats.photos,
            cargo: this.stats.cargo,
            maxAlt: Math.round(this.stats.maxAlt),
            collectedName: this.stats.collectedLetters ? this.stats.collectedLetters.join('') : ''
        };
    }
}

// ═══ SEVİYE SİSTEMİ ═══
const LEVELS = {
    1: { name:'Başlangıç', wind:false, windSpeed:0, obstacles:[], nfz:[], batteryBonus:20 },
    2: { name:'Kolay', wind:true, windSpeed:2,
         obstacles:[{x:25,y:15,size:6,type:'tree'}], nfz:[], batteryBonus:10 },
    3: { name:'Orta', wind:true, windSpeed:4,
         obstacles:[{x:20,y:10,size:8,type:'building'},{x:-15,y:25,size:6,type:'tree'}],
         nfz:[{x:-30,y:-30,radius:12,name:'Askeri Alan'}], batteryBonus:0 },
    4: { name:'Zor', wind:true, windSpeed:7,
         obstacles:[{x:15,y:10,size:8,type:'building'},{x:-10,y:20,size:6,type:'tree'},{x:30,y:-5,size:10,type:'building'}],
         nfz:[{x:-25,y:-20,radius:15,name:'Havaalanı'},{x:40,y:30,radius:10,name:'Askeri Alan'}], batteryBonus:-10 },
    5: { name:'Uzman', wind:true, windSpeed:10,
         obstacles:[{x:10,y:5,size:7,type:'building'},{x:-15,y:15,size:5,type:'tree'},{x:25,y:-10,size:9,type:'building'},{x:-5,y:35,size:6,type:'tree'},{x:35,y:20,size:8,type:'building'}],
         nfz:[{x:-20,y:-15,radius:12,name:'NFZ-A'},{x:30,y:35,radius:10,name:'NFZ-B'},{x:-35,y:25,radius:8,name:'NFZ-C'}], batteryBonus:-20 }
};

// ═══ ROZET SİSTEMİ ═══
const BADGES = {
    ilk_ucus:  { icon:'🛫', name:'İlk Uçuş',      desc:'İlk görevi tamamla' },
    pilot:     { icon:'✈️', name:'Pilot',          desc:'5 görev tamamla' },
    kaptan:    { icon:'🎖️', name:'Kaptan Pilot',   desc:'15 görev tamamla' },
    fotograf:  { icon:'📸', name:'Fotoğrafçı',     desc:'10 fotoğraf çek' },
    kargoci:   { icon:'📦', name:'Kargoci',        desc:'5 kargo teslim et' },
    yuksek:    { icon:'🏔️', name:'Yüksek Uçuş',   desc:'50m yüksekliğe ulaş' },
    maraton:   { icon:'🏃', name:'Maratoncı',      desc:'500m toplam mesafe' },
    puan_a:    { icon:'🏆', name:'A Notu',         desc:'Bir görevde A notu al' },
    ruzgar:    { icon:'🌪️', name:'Fırtına Avcısı', desc:'7+ m/s rüzgarda görev tamamla' },
    harf_oyunu:{ icon:'🔤', name:'Harf Avcısı',    desc:'Harf tarlasında adını başarıyla yazdın' },
    seviye5:   { icon:'💀', name:'Uzman Pilot',    desc:'Seviye 5 tamamla' }
};
