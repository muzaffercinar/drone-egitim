/* ═══ GÖREV & MÜFREDAT SİSTEMİ ═══
   5 Seviye + Final = Toplam 16 Görev
   Basitten karmaşığa, havacılığı sevdiren hikâyeli görevler */

const CURRICULUM = {
    levels: [
        // ═══════ SEVİYE 1: PİLOT ADAYI ═══════
        {
            id: 1, name: 'Pilot Adayı', icon: '🟢', color: '#3fb950',
            unlockScore: 0, // İlk seviye hep açık
            story: 'Hoş geldin pilot adayı! Drone dünyasına ilk adımını atıyorsun. Motorları tanı, gökyüzüyle tanış!',
            funFact: '💡 Biliyor muydun? Drone kelimesi İngilizce\'de "erkek arı" demektir. 4 pervane sayesinde havada kalır!',
            missions: [
                {
                    id: 'm1_1', name: 'İlk Motor Testi',
                    icon: '⚙️', minScore: 60,
                    briefing: 'Motorlarını çalıştır, 10 metre yüksel ve güvenli iniş yap. Bu kadar basit!',
                    hint: 'Sıra: Motor Aç → Havalan (10m) → İniş',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'IN_YAP'],
                    environment: { wind: false, windSpeed: 0, obstacles: [], nfz: [], battery: 100 },
                    objectives: [
                        { type: 'maxAlt', value: 8, label: '8m+ yüksekliğe ulaş' },
                        { type: 'land', label: 'Güvenli iniş yap' }
                    ]
                },
                {
                    id: 'm1_2', name: 'İlk Rota',
                    icon: '📍', minScore: 60,
                    briefing: 'Şimdi sadece yükselmek yetmez — bir noktaya uçmayı öğren! (20,0) koordinatına git ve geri dön.',
                    hint: 'Motor Aç → Havalan → (20,0) Git → (0,0) Git → İniş',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'ROTA_GIT', 'IN_YAP'],
                    environment: { wind: false, windSpeed: 0, obstacles: [], nfz: [], battery: 100 },
                    objectives: [
                        { type: 'visitPoint', x: 20, y: 0, radius: 5, label: '(20,0) noktasına ulaş' },
                        { type: 'returnHome', label: 'Eve geri dön' }
                    ]
                },
                {
                    id: 'm1_3', name: 'Kare Uçuş',
                    icon: '⬜', minScore: 60,
                    briefing: 'Bir kare çizerek uç! 4 köşeye sırayla git: (20,0) → (20,20) → (0,20) → (0,0). Tam bir pilot gibi!',
                    hint: 'Motor Aç → Havalan → 4 noktaya Git → İniş',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'ROTA_GIT', 'ROTA_GIT', 'ROTA_GIT', 'IN_YAP'],
                    environment: { wind: false, windSpeed: 0, obstacles: [], nfz: [], battery: 100 },
                    objectives: [
                        { type: 'visitPoint', x: 20, y: 0, radius: 5, label: 'Köşe 1: (20,0)' },
                        { type: 'visitPoint', x: 20, y: 20, radius: 5, label: 'Köşe 2: (20,20)' },
                        { type: 'visitPoint', x: 0, y: 20, radius: 5, label: 'Köşe 3: (0,20)' },
                        { type: 'returnHome', label: 'Eve dön' }
                    ]
                }
            ]
        },

        // ═══════ SEVİYE 2: GENÇ PİLOT ═══════
        {
            id: 2, name: 'Genç Pilot', icon: '🟡', color: '#d29922',
            unlockScore: 60,
            story: 'Artık uçabiliyorsun! Şimdi gerçek görevlere geçiyoruz — fotoğraf çek, kargo taşı, verimli uç!',
            funFact: '💡 Gerçek drone\'lar tarımda kullanılır. Bir drone, 100 dönüm tarlanın haritasını 15 dakikada çıkarabilir!',
            missions: [
                {
                    id: 'm2_1', name: 'Fotoğraf Görevi',
                    icon: '📸', minScore: 65,
                    briefing: '3 farklı noktayı ziyaret et ve her birinde fotoğraf çek. Bir keşif pilotu gibi!',
                    hint: 'Her noktaya gittikten sonra Foto Çek bloğunu kullan',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'FOTO_CEK', 'ROTA_GIT', 'FOTO_CEK', 'ROTA_GIT', 'FOTO_CEK', 'IN_YAP'],
                    environment: { wind: false, windSpeed: 0, obstacles: [], nfz: [], battery: 100 },
                    objectives: [
                        { type: 'photos', value: 3, label: '3 fotoğraf çek' },
                        { type: 'land', label: 'Güvenli iniş' }
                    ]
                },
                {
                    id: 'm2_2', name: 'Kargo Teslimatı',
                    icon: '📦', minScore: 65,
                    briefing: 'Bir paket al, (30,15) noktasına ulaştır, kargo bırak ve üsse geri dön!',
                    hint: 'Motor Aç → Havalan → Git → Kargo Bırak → Eve Dön → İniş',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'KARGO_BIRAK', 'ROTA_GIT', 'IN_YAP'],
                    environment: { wind: false, windSpeed: 0, obstacles: [], nfz: [], battery: 100 },
                    objectives: [
                        { type: 'cargo', value: 1, label: 'Kargoyu teslim et' },
                        { type: 'returnHome', label: 'Üsse geri dön' }
                    ]
                },
                {
                    id: 'm2_3', name: 'Verimli Pilot',
                    icon: '🔋', minScore: 65,
                    briefing: 'Bataryayı boşa harcama! Üçgen rota çiz: (25,0) → (12,20) → (0,0). En az batarya ile!',
                    hint: 'Direkt rota çiz, gereksiz blok ekleme. Batarya tasarrufu skor kazandırır!',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'ROTA_GIT', 'ROTA_GIT', 'IN_YAP'],
                    environment: { wind: false, windSpeed: 0, obstacles: [], nfz: [], battery: 85 },
                    objectives: [
                        { type: 'batteryLeft', value: 40, label: '%40+ batarya ile bitir' },
                        { type: 'returnHome', label: 'Eve dön' }
                    ]
                },
                {
                    id: 'm2_4', name: 'Harf Tarlası',
                    icon: '🔤', minScore: 70,
                    briefing: 'Ekranda isminin harfleri var! Drone ile doğru sırayla bu harflerin üzerine uçarak adını topla.',
                    hint: 'Harflerin koordinatlarını haritadan bul ve Rota Git bloklarıyla sırayla onlara uç.',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'IN_YAP'],
                    environment: { wind: false, windSpeed: 0, obstacles: [], nfz: [], battery: 100, isLetterField: true },
                    objectives: [
                        { type: 'spellName', label: 'Adını harf harf topla' },
                        { type: 'returnHome', label: 'Eve dön' }
                    ]
                }
            ]
        },

        // ═══════ SEVİYE 3: DRONE PİLOTU ═══════
        {
            id: 3, name: 'Drone Pilotu', icon: '🟠', color: '#f0883e',
            unlockScore: 65,
            story: 'Gökyüzü her zaman boş değil! Engelleri ve yasak bölgeleri tanı. Gerçek pilotlar böyle olur!',
            funFact: '💡 Havaalanlarının etrafında 5 km\'lik yasak bölge vardır. İzinsiz drone uçurmak yasaktır ve cezası çok ağırdır!',
            missions: [
                {
                    id: 'm3_1', name: 'Engelden Kaçın',
                    icon: '🏢', minScore: 70,
                    briefing: 'Hedefe ulaş ama dikkat — yolda bir bina var! Etrafından dolanmalısın.',
                    hint: 'Binayı yan tarafından dolanacak bir ara nokta ekle',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'ROTA_GIT', 'IN_YAP'],
                    environment: {
                        wind: false, windSpeed: 0, battery: 100,
                        obstacles: [{ x: 15, y: 0, size: 10, type: 'building' }],
                        nfz: []
                    },
                    objectives: [
                        { type: 'visitPoint', x: 30, y: 0, radius: 5, label: 'Hedefe ulaş (30,0)' },
                        { type: 'noCollision', label: 'Çarpışma olmadan' }
                    ]
                },
                {
                    id: 'm3_2', name: 'Yasak Bölge',
                    icon: '🚫', minScore: 70,
                    briefing: 'Askeri bölgenin yakınında fotoğraf çekmelisin ama İÇİNE GİRME! Yasak bölge: (-20,-20) çevresinde.',
                    hint: 'Yasak bölgenin kenarından dolaş, içine girme',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'FOTO_CEK', 'ROTA_GIT', 'IN_YAP'],
                    environment: {
                        wind: false, windSpeed: 0, battery: 100,
                        obstacles: [],
                        nfz: [{ x: -20, y: -20, radius: 12, name: 'Askeri Alan' }]
                    },
                    objectives: [
                        { type: 'photos', value: 1, label: 'Fotoğraf çek' },
                        { type: 'noNFZ', label: 'Yasak bölgeye girme' }
                    ]
                },
                {
                    id: 'm3_3', name: 'Çoklu Teslimat',
                    icon: '📦📦', minScore: 70,
                    briefing: 'İki ayrı noktaya kargo teslim et. Yolda ağaçlar var, dikkatli uç!',
                    hint: 'Engelleri dolanacak ara noktalar ekle',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'KARGO_BIRAK', 'ROTA_GIT', 'KARGO_BIRAK', 'ROTA_GIT', 'IN_YAP'],
                    environment: {
                        wind: false, windSpeed: 0, battery: 95,
                        obstacles: [
                            { x: 10, y: 10, size: 6, type: 'tree' },
                            { x: 25, y: -5, size: 6, type: 'tree' }
                        ],
                        nfz: []
                    },
                    objectives: [
                        { type: 'cargo', value: 2, label: '2 kargo teslim et' },
                        { type: 'returnHome', label: 'Eve dön' }
                    ]
                }
            ]
        },

        // ═══════ SEVİYE 4: KAPTAN PİLOT ═══════
        {
            id: 4, name: 'Kaptan Pilot', icon: '🔴', color: '#f85149',
            unlockScore: 70,
            story: 'Rüzgar altında uçmak gerçek ustalık gerektirir! Meteorolojiyi tanı, strateji geliştir.',
            funFact: '💡 Gerçek drone pilotları uçuş öncesinde hava durumunu kontrol eder. 40 km/s üstü rüzgarda drone uçurmak tehlikelidir!',
            missions: [
                {
                    id: 'm4_1', name: 'Rüzgarlı Uçuş',
                    icon: '🌬️', minScore: 75,
                    briefing: 'Hafif rüzgar var! Rüzgarın seni saptıracağını hesaba kat ve hedefe ulaş.',
                    hint: 'Rüzgar yönünün tersine sapma payı bırak',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'ROTA_GIT', 'IN_YAP'],
                    environment: {
                        wind: true, windSpeed: 4, battery: 90,
                        obstacles: [], nfz: []
                    },
                    objectives: [
                        { type: 'visitPoint', x: 35, y: 20, radius: 8, label: 'Hedefe ulaş (35,20)' },
                        { type: 'returnHome', label: 'Eve dön' }
                    ]
                },
                {
                    id: 'm4_2', name: 'Arama Kurtarma',
                    icon: '🔍', minScore: 75,
                    briefing: 'Kayıp bir dağcı aranıyor! 4 farklı bölgeyi tara ve fotoğraf çek. Rüzgar ve engeller var.',
                    hint: 'Sistematik tara: saat yönünde 4 noktayı ziyaret et',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'FOTO_CEK', 'ROTA_GIT', 'FOTO_CEK', 'ROTA_GIT', 'FOTO_CEK', 'ROTA_GIT', 'FOTO_CEK', 'IN_YAP'],
                    environment: {
                        wind: true, windSpeed: 5, battery: 85,
                        obstacles: [{ x: 0, y: 20, size: 8, type: 'building' }],
                        nfz: []
                    },
                    objectives: [
                        { type: 'photos', value: 4, label: '4 bölgede fotoğraf çek' },
                        { type: 'returnHome', label: 'Üsse dön' }
                    ]
                },
                {
                    id: 'm4_3', name: 'Hassas Teslimat',
                    icon: '🎯', minScore: 75,
                    briefing: 'Fırtına geliyor! Tıbbi malzemeyi köy okuluna yetiştir. Engeller, rüzgar ve düşük batarya!',
                    hint: 'En kısa rotayı hesapla, bataryayı israf etme',
                    expectedBlocks: ['MOTOR_AC', 'HAVALAN', 'ROTA_GIT', 'ROTA_GIT', 'KARGO_BIRAK', 'ROTA_GIT', 'IN_YAP'],
                    environment: {
                        wind: true, windSpeed: 6, battery: 75,
                        obstacles: [
                            { x: 15, y: 10, size: 8, type: 'building' },
                            { x: -10, y: 15, size: 6, type: 'tree' }
                        ],
                        nfz: [{ x: -25, y: -25, radius: 10, name: 'Askeri Alan' }]
                    },
                    objectives: [
                        { type: 'cargo', value: 1, label: 'Tıbbi malzemeyi teslim et' },
                        { type: 'batteryLeft', value: 20, label: '%20+ batarya ile bitir' }
                    ]
                }
            ]
        },

        // ═══════ SEVİYE 5: UZMAN PİLOT ═══════
        {
            id: 5, name: 'Uzman Pilot', icon: '💀', color: '#8b5cf6',
            unlockScore: 75,
            story: 'Son sınav! Tüm becerilerini göster. Bu seviyeyi geçersen kendi drone\'unu tasarlayabilirsin!',
            funFact: '💡 Türkiye\'de drone pilotluk lisansı almak için SHGM\'den (Sivil Havacılık Genel Müdürlüğü) sertifika gerekir!',
            missions: [
                {
                    id: 'm5_1', name: 'Tarla Tarama',
                    icon: '🌾', minScore: 80,
                    briefing: 'Zigzag deseninde tarla tara. Engeller, yasak bölge ve rüzgar var. Verimli ol!',
                    hint: 'Zigzag: (0,0)→(30,0)→(30,15)→(0,15)→(0,30)→(30,30)',
                    expectedBlocks: [],
                    environment: {
                        wind: true, windSpeed: 7, battery: 80,
                        obstacles: [
                            { x: 15, y: 7, size: 6, type: 'tree' },
                            { x: 20, y: 22, size: 7, type: 'building' }
                        ],
                        nfz: [{ x: -15, y: 15, radius: 10, name: 'NFZ' }]
                    },
                    objectives: [
                        { type: 'photos', value: 3, label: '3 fotoğraf çek' },
                        { type: 'distance', value: 80, label: '80m+ mesafe kat et' },
                        { type: 'returnHome', label: 'Eve dön' }
                    ]
                },
                {
                    id: 'm5_2', name: 'Acil Kurtarma',
                    icon: '🚨', minScore: 80,
                    briefing: 'Deprem sonrası 3 noktaya acil yardım paketi bırak! Yıkık binalar, güçlü rüzgar, az batarya!',
                    hint: 'En verimli rotayı planla — her saniye önemli!',
                    expectedBlocks: [],
                    environment: {
                        wind: true, windSpeed: 8, battery: 70,
                        obstacles: [
                            { x: 10, y: 5, size: 7, type: 'building' },
                            { x: -5, y: 20, size: 6, type: 'building' },
                            { x: 25, y: 15, size: 8, type: 'building' }
                        ],
                        nfz: [{ x: -20, y: -10, radius: 12, name: 'Tehlike' }]
                    },
                    objectives: [
                        { type: 'cargo', value: 3, label: '3 yardım paketi bırak' },
                        { type: 'batteryLeft', value: 15, label: '%15+ batarya kalsın' },
                        { type: 'returnHome', label: 'Üsse dön' }
                    ]
                },
                {
                    id: 'm5_3', name: 'Final Sınavı',
                    icon: '🏆', minScore: 80,
                    briefing: 'BÜYÜK FİNAL! Fotoğraf çek + kargo teslim et + engel aş + rüzgar + yasak bölge. Tüm becerilerin test ediliyor!',
                    hint: 'Her şeyi planla: rota, batarya, engeller, yasak bölgeler...',
                    expectedBlocks: [],
                    environment: {
                        wind: true, windSpeed: 9, battery: 65,
                        obstacles: [
                            { x: 12, y: 8, size: 7, type: 'building' },
                            { x: -8, y: 25, size: 6, type: 'tree' },
                            { x: 30, y: -5, size: 8, type: 'building' },
                            { x: 20, y: 30, size: 5, type: 'tree' }
                        ],
                        nfz: [
                            { x: -25, y: -15, radius: 10, name: 'Askeri Alan' },
                            { x: 35, y: 25, radius: 8, name: 'Havaalanı' }
                        ]
                    },
                    objectives: [
                        { type: 'photos', value: 2, label: '2 fotoğraf çek' },
                        { type: 'cargo', value: 2, label: '2 kargo teslim et' },
                        { type: 'returnHome', label: 'Eve güvenle dön' }
                    ]
                }
            ]
        }
    ],

    // ═══════ BONUS: KENDİ DRONE'UNU TASARLA ═══════
    designLevel: {
        id: 6, name: 'Drone Mühendisi', icon: '🔧', color: '#58a6ff',
        unlockScore: 80,
        story: 'Tebrikler, tüm seviyeleri geçtin! Artık kendi drone\'unu tasarlayabilirsin. Pervane sayısı, batarya kapasitesi, kamera tipi ve motor gücünü seç — sonra serbest uçuş yap!',
        funFact: '💡 Gerçek drone mühendisleri; aerodinamik, elektronik ve yazılım bilgisi kullanarak drone tasarlar. Sen de bir gün yapabilirsin!',
        designParams: {
            frames: [
                { id: 'mini', name: 'Mini Drone', icon: '🐝', weight: 250, maxPayload: 0, desc: 'Hafif, hızlı, fotoğraf için ideal' },
                { id: 'standard', name: 'Standart Drone', icon: '🚁', weight: 800, maxPayload: 500, desc: 'Dengeli, çok amaçlı' },
                { id: 'heavy', name: 'Ağır Yük Drone', icon: '🦅', weight: 2000, maxPayload: 2000, desc: 'Kargo taşımak için güçlü' },
                { id: 'racing', name: 'Yarış Drone', icon: '⚡', weight: 400, maxPayload: 0, desc: 'Ultra hızlı, yarış için' }
            ],
            batteries: [
                { id: 'small', name: '2200 mAh', capacity: 60, weight: 150 },
                { id: 'medium', name: '5000 mAh', capacity: 85, weight: 350 },
                { id: 'large', name: '10000 mAh', capacity: 100, weight: 600 }
            ],
            cameras: [
                { id: 'none', name: 'Kamera Yok', icon: '❌', weight: 0 },
                { id: 'basic', name: '720p Kamera', icon: '📷', weight: 50 },
                { id: 'hd', name: '4K Kamera', icon: '📸', weight: 150 },
                { id: 'thermal', name: 'Termal Kamera', icon: '🌡️', weight: 200 }
            ],
            motors: [
                { id: 'eco', name: 'Eko Motor', power: 0.7, efficiency: 1.3 },
                { id: 'standard', name: 'Standart Motor', power: 1.0, efficiency: 1.0 },
                { id: 'power', name: 'Güçlü Motor', power: 1.5, efficiency: 0.7 }
            ]
        }
    }
};

// Yıldız hesaplama
function getStars(score, minScore) {
    if (score < minScore) return 0;
    if (score >= 90) return 3;
    if (score >= 75) return 2;
    return 1;
}

// Seviye açık mı kontrolü
function isLevelUnlocked(levelId, progress) {
    if (levelId === 1) return true;
    const prevLevel = CURRICULUM.levels.find(l => l.id === levelId - 1);
    if (!prevLevel) return false;
    return prevLevel.missions.every(m => {
        const p = progress[m.id];
        return p && p.score >= m.minScore;
    });
}

// Görev açık mı (seviye içinde sıralı)
function isMissionUnlocked(levelId, missionIndex, progress) {
    if (!isLevelUnlocked(levelId, progress)) return false;
    if (missionIndex === 0) return true;
    const level = CURRICULUM.levels.find(l => l.id === levelId);
    const prevMission = level.missions[missionIndex - 1];
    const p = progress[prevMission.id];
    return p && p.score >= prevMission.minScore;
}

// Tasarım seviyesi açık mı
function isDesignUnlocked(progress) {
    return CURRICULUM.levels.every(level =>
        level.missions.every(m => {
            const p = progress[m.id];
            return p && p.score >= m.minScore;
        })
    );
}
