/* ═══ ANA UYGULAMA — Auth, Öğrenci, Öğretmen Paneli ═══ */

// ⚠️ ÖĞRETMEN E-POSTASI — sadece bu e-posta öğretmen paneline erişir
const TEACHER_EMAIL = 'kavacikuzum@gmail.com';

let currentUser = null;
let userProfile = null;
let drone = null;
let canvas = null;
let blocks = [];
let currentLevel = 1;
let earnedBadges = [];

// ═══ EKRAN YÖNETİMİ ═══
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'student-screen' && canvas) setTimeout(() => canvas._resize(), 100);
}

function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg; el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

// ═══ AUTH ═══
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = (email.toLowerCase() === TEACHER_EMAIL.toLowerCase()) ? 'teacher' : 'student';
    document.getElementById('auth-loading').classList.remove('hidden');

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await DB.saveProfile(cred.user.uid, {
            name, email, role,
            level: 1, totalMissions: 0, bestGrade: 'F',
            totalDistance: 0, totalPhotos: 0,
            createdAt: Date.now(),
            lastActive: Date.now()
        });
        logConsole(`✅ Kayıt başarılı: ${name}`);
    } catch (err) {
        showError(err.message);
    }
    document.getElementById('auth-loading').classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    document.getElementById('auth-loading').classList.remove('hidden');

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        showError(err.message);
    }
    document.getElementById('auth-loading').classList.add('hidden');
}

function logout() {
    auth.signOut();
}

// Firebase auth state listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        userProfile = await DB.getProfile(user.uid);
        if (!userProfile) {
            // Profil yoksa otomatik oluştur
            userProfile = {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                role: 'student',
                level: 1, totalMissions: 0, bestGrade: 'F',
                totalDistance: 0, totalPhotos: 0,
                createdAt: Date.now(),
                lastActive: Date.now()
            };
            await DB.saveProfile(user.uid, userProfile);
        }
        if (userProfile.role === 'teacher') {
            initTeacher();
        } else {
            initStudent();
        }
    } else {
        currentUser = null; userProfile = null;
        showScreen('auth-screen');
    }
});

// ═══ ÖĞRENCİ PANELİ ═══
async function initStudent() {
    showScreen('student-screen');
    document.getElementById('student-name').textContent = `👤 ${userProfile.name}`;
    document.getElementById('student-level').textContent = `Seviye ${userProfile.level || 1}`;

    // Canvas başlat
    if (!canvas) canvas = new DroneCanvas('drone-canvas');
    // Drone başlat
    drone = new DroneSim();
    drone.onUpdate = (data) => {
        canvas.update(data);
        updateTelemetry(data);
    };
    drone.onLog = (msg, type) => logConsole(msg, type);
    drone.reset();

    // Rozetleri yükle
    earnedBadges = await DB.getBadges(currentUser.uid);
    updateBadgesGrid();
    document.getElementById('student-badges').textContent = `🏅 ${earnedBadges.length}`;

    // Atanan görevleri yükle
    loadAssignments();
    // Bildirimleri yükle
    loadNotifications();

    logConsole('🚁 Drone Eğitim Platformu hazır!');
    logConsole(`👤 Hoş geldin, ${userProfile.name}!`);
}

function updateTelemetry(data) {
    document.getElementById('tel-mode').textContent = data.mode;
    document.getElementById('tel-x').textContent = data.x.toFixed(1);
    document.getElementById('tel-y').textContent = data.y.toFixed(1);
    document.getElementById('tel-z').textContent = data.z.toFixed(1);
    document.getElementById('tel-bat').textContent = data.battery.toFixed(0);
    document.getElementById('tel-motor').textContent = data.motor ? 'AÇIK⚡' : 'KAPALI';
    // Batarya rengi
    const batEl = document.getElementById('tel-bat');
    batEl.style.color = data.battery > 50 ? '#3fb950' : data.battery > 20 ? '#d29922' : '#f85149';
}

function logConsole(msg, type='info') {
    const el = document.getElementById('console-log');
    const cls = type === 'error' ? 'log-error' : type === 'warn' ? 'log-warn' : '';
    el.innerHTML += `<div class="${cls}">${msg}</div>`;
    el.scrollTop = el.scrollHeight;
}

// ═══ BLOK PROGRAMLAMA ═══
const BLOCK_DEFS = {
    MOTOR_AC:    { color:'#6e7681', icon:'⚙️', label:'Motor Aç', params:[] },
    HAVALAN:     { color:'#238636', icon:'🚀', label:'Havalan', params:[{key:'height',label:'m',def:10}] },
    ROTA_GIT:    { color:'#1f6feb', icon:'📍', label:'Git', params:[{key:'x',label:'X',def:0},{key:'y',label:'Y',def:0}] },
    FOTO_CEK:    { color:'#8b5cf6', icon:'📸', label:'Foto', params:[] },
    BEKLE:       { color:'#d29922', icon:'⏳', label:'Bekle', params:[{key:'seconds',label:'sn',def:3}] },
    KARGO_BIRAK: { color:'#f0883e', icon:'📦', label:'Kargo', params:[] },
    IN_YAP:      { color:'#f85149', icon:'🔽', label:'İniş', params:[] }
};

function addBlock(type) {
    const def = BLOCK_DEFS[type];
    const id = Date.now();
    blocks.push({ id, type, params:{} });

    const container = document.getElementById('block-program');
    const div = document.createElement('div');
    div.className = 'block-item';
    div.style.background = def.color;
    div.id = `block-${id}`;

    let paramsHTML = '';
    for (const p of def.params) {
        paramsHTML += `<span style="margin-left:4px;font-size:10px">${p.label}:</span>
            <input type="number" value="${p.def}" data-block="${id}" data-param="${p.key}" 
            onchange="updateBlockParam(${id},'${p.key}',this.value)">`;
    }

    div.innerHTML = `
        <span>${blocks.length}. ${def.icon} ${def.label}</span>
        <span>${paramsHTML}
            <button class="block-del" onclick="removeBlock(${id})">✕</button>
        </span>`;
    container.appendChild(div);
    logConsole(`🧩 Blok eklendi: ${def.icon} ${def.label}`);
}

function updateBlockParam(blockId, param, value) {
    const block = blocks.find(b => b.id === blockId);
    if (block) block.params[param] = parseFloat(value) || 0;
}

function removeBlock(id) {
    blocks = blocks.filter(b => b.id !== id);
    const el = document.getElementById(`block-${id}`);
    if (el) el.remove();
    // Yeniden numarala
    const items = document.querySelectorAll('#block-program .block-item');
    items.forEach((item, i) => {
        const span = item.querySelector('span');
        const text = span.textContent;
        span.textContent = `${i+1}. ${text.substring(text.indexOf('.')+2)}`;
    });
}

function clearBlocks() {
    blocks = [];
    document.getElementById('block-program').innerHTML = '';
    logConsole('🧹 Bloklar temizlendi.');
}

// ═══ GÖREV ÇALIŞTIR ═══
async function runMission() {
    if (!drone) { logConsole('⚠️ Önce drone tanımlayın!', 'warn'); return; }
    if (blocks.length === 0) { logConsole('⚠️ Blok programı boş!', 'warn'); return; }

    // Drone ayarlarını uygula
    drone.maxAlt = parseFloat(document.getElementById('drone-maxalt').value) || 50;
    drone.hasCamera = document.getElementById('drone-camera').checked;
    drone.hasGPS = document.getElementById('drone-gps').checked;
    drone.reset();
    canvas.reset();

    // Seviye uygula
    applyLevel();

    // Blokları görev listesine çevir
    const tasks = blocks.map(b => {
        const def = BLOCK_DEFS[b.type];
        return {
            type: b.type,
            label: `${def.icon} ${def.label}`,
            params: { ...getDefaultParams(b.type), ...b.params }
        };
    });

    const score = await drone.runMission(tasks);
    showScore(score);

    // Firebase'e kaydet
    if (currentUser) {
        try {
            await DB.saveMission(currentUser.uid, {
                score: score.points,
                grade: score.grade,
                distance: score.distance,
                duration: score.duration,
                level: currentLevel,
                photos: score.photos,
                cargo: score.cargo
            });

            // Profili güncelle
            const updates = { lastActive: Date.now() };
            if (score.points > 0) {
                const gradeOrder = {A:5,B:4,C:3,D:2,F:1};
                if ((gradeOrder[score.grade]||0) > (gradeOrder[userProfile.bestGrade]||0)) {
                    updates.bestGrade = score.grade;
                }
                updates.totalDistance = (userProfile.totalDistance || 0) + score.distance;
                updates.totalPhotos = (userProfile.totalPhotos || 0) + score.photos;
            }
            await DB.saveProfile(currentUser.uid, updates);

            // Rozet kontrolü
            await checkBadges(score);
        } catch(e) { console.error('Save error:', e); }
    }
}

function getDefaultParams(type) {
    switch(type) {
        case 'HAVALAN': return {height:10};
        case 'ROTA_GIT': return {x:0,y:0};
        case 'BEKLE': return {seconds:3};
        default: return {};
    }
}

function showScore(score) {
    const colors = {A:'#3fb950',B:'#58a6ff',C:'#d29922',D:'#f0883e',F:'#f85149'};
    document.getElementById('score-display').innerHTML = `
        <div class="score-big" style="color:${colors[score.grade]||'#fff'}">${score.points}/100</div>
        <div style="font-size:20px;color:${colors[score.grade]};font-weight:800">${score.grade}</div>
        <div class="dim-text" style="margin-top:8px">
            ⏱ ${score.duration}s | 📍 ${score.distance}m<br>
            🔋 %${score.batteryLeft} | ✅ ${score.completed}
        </div>`;
}

// ═══ SEVİYE ═══
function applyLevel() {
    if (!drone) return;
    currentLevel = parseInt(document.getElementById('difficulty-level').value);
    const lvl = LEVELS[currentLevel];
    drone.wind = { active: lvl.wind, dir: Math.floor(Math.random()*360), speed: lvl.windSpeed };
    drone.obstacles = lvl.obstacles;
    drone.nfzZones = lvl.nfz;
    drone.battery = Math.min(100, Math.max(30, 100 + lvl.batteryBonus));
    canvas.setEnvironment(lvl.obstacles, lvl.nfz);
    canvas.draw();
    logConsole(`🎮 Seviye ${currentLevel}: ${lvl.name}`);
}

// ═══ ROZET KONTROLÜ ═══
async function checkBadges(score) {
    if (!currentUser) return;
    const missions = await DB.getMissions(currentUser.uid, 100);
    const totalMissions = missions.length;
    const totalPhotos = missions.reduce((s,m) => s + (m.photos||0), 0);
    const totalCargo = missions.reduce((s,m) => s + (m.cargo||0), 0);
    const totalDist = missions.reduce((s,m) => s + (m.distance||0), 0);
    const hasA = missions.some(m => m.grade === 'A');
    const hasWind = score.level >= 4 && score.points > 0;
    const hasSev5 = missions.some(m => m.level >= 5 && m.score > 0);

    const checks = {
        ilk_ucus: totalMissions >= 1,
        pilot: totalMissions >= 5,
        kaptan: totalMissions >= 15,
        fotograf: totalPhotos >= 10,
        kargoci: totalCargo >= 5,
        yuksek: score.maxAlt >= 50,
        maraton: totalDist >= 500,
        puan_a: hasA,
        ruzgar: hasWind,
        seviye5: hasSev5
    };

    const newBadges = [];
    for (const [id, earned] of Object.entries(checks)) {
        if (earned && !earnedBadges.includes(id)) {
            earnedBadges.push(id);
            await DB.saveBadge(currentUser.uid, id);
            newBadges.push(id);
        }
    }

    if (newBadges.length > 0) {
        showBadgePopup(newBadges);
        document.getElementById('student-badges').textContent = `🏅 ${earnedBadges.length}`;
        updateBadgesGrid();
        // Seviye güncelle
        const newLevel = Math.min(5, Math.floor(earnedBadges.length / 2) + 1);
        if (newLevel > (userProfile.level||1)) {
            await DB.saveProfile(currentUser.uid, { level: newLevel });
            userProfile.level = newLevel;
            document.getElementById('student-level').textContent = `Seviye ${newLevel}`;
            logConsole(`🎉 SEVİYE ATLADIN! → Seviye ${newLevel}`, 'warn');
        }
    }
}

function updateBadgesGrid() {
    const grid = document.getElementById('badges-grid');
    grid.innerHTML = '';
    for (const [id, b] of Object.entries(BADGES)) {
        const earned = earnedBadges.includes(id);
        grid.innerHTML += `
            <div class="badge-cell ${earned ? 'earned' : 'locked'}">
                <span class="badge-icon">${earned ? b.icon : '🔒'}</span>
                <div>${b.name}</div>
            </div>`;
    }
}

function showBadgePopup(badgeIds) {
    const body = document.getElementById('badge-popup-body');
    body.innerHTML = badgeIds.map(id => {
        const b = BADGES[id];
        return `<div class="popup-badge"><span class="pb-icon">${b.icon}</span> <b>${b.name}</b><br><small style="color:#8b949e">${b.desc}</small></div>`;
    }).join('');
    document.getElementById('badge-popup').classList.remove('hidden');
}

function closeBadgePopup() {
    document.getElementById('badge-popup').classList.add('hidden');
}

// ═══ ATANAN GÖREVLER & BİLDİRİMLER ═══
async function loadAssignments() {
    if (!currentUser) return;
    try {
        const tasks = await DB.getAssignments(currentUser.uid);
        const el = document.getElementById('assignments-list');
        if (tasks.length === 0) { el.innerHTML = '<p class="dim-text">Henüz görev atanmadı</p>'; return; }
        el.innerHTML = tasks.map(t => `
            <div class="assignment-item ${t.status==='completed'?'completed':''}">
                <strong>${t.title || t.template}</strong><br>
                <span class="dim-text">${t.description || ''}</span>
            </div>`).join('');
    } catch(e) { console.error(e); }
}

async function loadNotifications() {
    if (!currentUser) return;
    try {
        const notifs = await DB.getNotifications(currentUser.uid);
        const el = document.getElementById('notifications');
        if (notifs.length === 0) { el.innerHTML = '<p class="dim-text">Henüz mesaj yok</p>'; return; }
        el.innerHTML = notifs.map(n => `
            <div class="notification-item">
                💬 ${n.message}
                <div class="notif-time">${n.createdAt ? new Date(n.createdAt).toLocaleDateString('tr') : ''}</div>
            </div>`).join('');
    } catch(e) { console.error(e); }
}

// ═══ ÖĞRETMEN PANELİ ═══
async function initTeacher() {
    showScreen('teacher-screen');
    document.getElementById('teacher-name').textContent = `👤 ${userProfile.name}`;
    await refreshTeacherData();
}

async function refreshTeacherData() {
    try {
        const students = await DB.getAllStudents();
        const missions = await DB.getAllMissions();

        // İstatistikler
        document.getElementById('stat-students').textContent = students.length;
        document.getElementById('stat-missions').textContent = missions.length;
        const avg = missions.length > 0 ? Math.round(missions.reduce((s,m)=>s+(m.score||0),0)/missions.length) : '—';
        document.getElementById('stat-avg').textContent = avg;
        const today = new Date().toDateString();
        const active = students.filter(s => s.lastActive && new Date(s.lastActive.seconds*1000).toDateString() === today).length;
        document.getElementById('stat-active').textContent = active;

        // Öğrenci select'lerini doldur
        const opts = students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        document.getElementById('assign-student').innerHTML = '<option value="">Öğrenci seçin...</option>' + opts;
        document.getElementById('feedback-student').innerHTML = '<option value="">Öğrenci seçin...</option>' + opts;

        // Öğrenci kartları
        const grid = document.getElementById('students-grid');
        grid.innerHTML = '';
        for (const s of students) {
            const sMissions = missions.filter(m => m.userId === s.id);
            const lastScore = sMissions.length > 0 ? sMissions[0].score : '—';
            const lastGrade = sMissions.length > 0 ? sMissions[0].grade : '—';
            const badges = await DB.getBadges(s.id);
            const colors = {A:'#3fb950',B:'#58a6ff',C:'#d29922',D:'#f0883e',F:'#f85149'};

            grid.innerHTML += `
                <div class="student-card">
                    <div class="sc-name">👤 ${s.name}</div>
                    <div class="sc-row"><span>🎮 Seviye</span><span>${s.level||1}/5</span></div>
                    <div class="sc-row"><span>📊 Görev Sayısı</span><span>${sMissions.length}</span></div>
                    <div class="sc-row"><span>🏆 Son Skor</span><span style="color:${colors[lastGrade]||'#fff'}">${lastScore}/100 (${lastGrade})</span></div>
                    <div class="sc-row"><span>🏅 Rozet</span><span>${badges.length}/${Object.keys(BADGES).length}</span></div>
                    <div class="sc-row"><span>📅 Son Giriş</span><span>${s.lastActive ? new Date(s.lastActive).toLocaleDateString('tr') : '—'}</span></div>
                    <div class="sc-badges">${badges.map(b => BADGES[b]?.icon || '').join(' ')}</div>
                </div>`;
        }
    } catch(e) { console.error('Teacher data error:', e); }
}

async function assignTask() {
    const studentId = document.getElementById('assign-student').value;
    const template = document.getElementById('assign-template').value;
    const desc = document.getElementById('assign-desc').value;
    if (!studentId) { alert('Öğrenci seçin!'); return; }

    const templates = {tarla:'🌾 Tarla Tarama',arama:'🔍 Arama Kurtarma',kargo:'📦 Kargo Teslimat',foto:'📸 Fotoğraf Turu',yaris:'🏁 Yarış Parkuru',ozel:'✏️ Özel Görev'};

    await DB.assignTask(currentUser.uid, studentId, {
        title: templates[template] || template,
        template,
        description: desc
    });
    document.getElementById('assign-desc').value = '';
    alert('✅ Görev atandı!');
}

async function sendFeedback() {
    const studentId = document.getElementById('feedback-student').value;
    const message = document.getElementById('feedback-text').value;
    if (!studentId || !message) { alert('Öğrenci ve mesaj gerekli!'); return; }

    await DB.sendFeedback(currentUser.uid, studentId, message);
    document.getElementById('feedback-text').value = '';
    alert('✅ Mesaj gönderildi!');
}
