/* ═══ ANA UYGULAMA — Premium v2 ═══ */
const TEACHER_EMAIL = 'kavacikuzun@gmail.com';
let currentUser=null,userProfile=null,drone=null,canvas=null,blocks=[],currentLevel=1,earnedBadges=[],missionProgress={},activeMission=null;

// ═══ EKRAN ═══
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active')}
function showTab(t){document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('login-form').classList.toggle('hidden',t!=='login');document.getElementById('register-form').classList.toggle('hidden',t==='login');document.querySelectorAll('.tab-btn')[t==='login'?0:1].classList.add('active')}
function showStudentTab(t){document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));document.getElementById('tab-'+t).classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('nav-'+t)?.classList.add('active');if(t==='sim'&&canvas)setTimeout(()=>canvas._resize(),100);if(t==='badges')updateBadgesPage();if(t==='design')updateDesignPage()}
function showError(m){const e=document.getElementById('auth-error');e.textContent=m;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),4000)}

// ═══ AUTH ═══
async function handleRegister(e){e.preventDefault();const n=document.getElementById('reg-name').value,em=document.getElementById('reg-email').value,pw=document.getElementById('reg-password').value,role=em.toLowerCase()===TEACHER_EMAIL?'teacher':'student';document.getElementById('auth-loading').classList.remove('hidden');try{const c=await auth.createUserWithEmailAndPassword(em,pw);await DB.saveProfile(c.user.uid,{name:n,email:em,role,level:1,totalMissions:0,bestGrade:'F',totalDistance:0,totalPhotos:0,createdAt:Date.now(),lastActive:Date.now()})}catch(er){showError(er.message)}document.getElementById('auth-loading').classList.add('hidden')}
async function handleLogin(e){e.preventDefault();const em=document.getElementById('login-email').value,pw=document.getElementById('login-password').value;document.getElementById('auth-loading').classList.remove('hidden');try{await auth.signInWithEmailAndPassword(em,pw)}catch(er){showError(er.message)}document.getElementById('auth-loading').classList.add('hidden')}
function logout(){auth.signOut()}

auth.onAuthStateChanged(async u=>{if(u){currentUser=u;userProfile=await DB.getProfile(u.uid);const isT=u.email.toLowerCase()===TEACHER_EMAIL;if(!userProfile){userProfile={name:u.displayName||u.email.split('@')[0],email:u.email,role:isT?'teacher':'student',level:1,totalMissions:0,bestGrade:'F',totalDistance:0,totalPhotos:0,createdAt:Date.now(),lastActive:Date.now()};await DB.saveProfile(u.uid,userProfile)}if(isT&&userProfile.role!=='teacher'){userProfile.role='teacher';await DB.saveProfile(u.uid,{role:'teacher'})}userProfile.role==='teacher'?initTeacher():initStudent()}else{currentUser=null;userProfile=null;showScreen('auth-screen')}});

// ═══ ÖĞRENCİ ═══
async function initStudent(){showScreen('student-screen');document.getElementById('student-name').textContent='👤 '+userProfile.name;document.getElementById('student-level').textContent='Seviye '+(userProfile.level||1);
if(!canvas)canvas=new DroneCanvas('drone-canvas');drone=new DroneSim();drone.onUpdate=d=>{canvas.update(d);updateTelemetry(d)};drone.onLog=(m,t)=>logConsole(m,t);drone.reset();
earnedBadges=await DB.getBadges(currentUser.uid);
const snap=await DB.getMissions(currentUser.uid,100);missionProgress={};snap.forEach(m=>{if(!missionProgress[m.missionId]||m.score>missionProgress[m.missionId].score)missionProgress[m.missionId]=m});
renderMissionMap();loadNotifications();loadAssignments();logConsole('🚁 Hoş geldin, '+userProfile.name+'!')}

function updateTelemetry(d){document.getElementById('tel-mode').textContent=d.mode;document.getElementById('tel-x').textContent=d.x.toFixed(1);document.getElementById('tel-y').textContent=d.y.toFixed(1);document.getElementById('tel-z').textContent=d.z.toFixed(1);const b=document.getElementById('tel-bat');b.textContent=d.battery.toFixed(0);b.style.color=d.battery>50?'#3fb950':d.battery>20?'#d29922':'#f85149'}
function logConsole(m,t='info'){const e=document.getElementById('console-log');e.innerHTML+=`<div class="${t==='error'?'log-error':t==='warn'?'log-warn':''}">${m}</div>`;e.scrollTop=e.scrollHeight}

// ═══ GÖREV HARİTASI ═══
function renderMissionMap(){const map=document.getElementById('mission-map');map.innerHTML='';
CURRICULUM.levels.forEach((lvl,li)=>{const unlocked=isLevelUnlocked(lvl.id,missionProgress);const allDone=lvl.missions.every(m=>missionProgress[m.id]&&missionProgress[m.id].score>=m.minScore);
if(li>0){const conn=document.createElement('div');conn.className='level-connector'+(unlocked?' active':'');map.appendChild(conn)}
const row=document.createElement('div');row.className='level-row '+(unlocked?(allDone?'unlocked':'current'):'locked');
let missionsHTML='';lvl.missions.forEach((m,mi)=>{const p=missionProgress[m.id];const mUnlocked=isMissionUnlocked(lvl.id,mi,missionProgress);const done=p&&p.score>=m.minScore;const stars=done?getStars(p.score,m.minScore):0;
missionsHTML+=`<div class="mission-card ${done?'completed':mUnlocked?'':'locked'}" onclick="${mUnlocked?`openBriefing(${lvl.id},${mi})`:''}">
<span class="mc-icon">${mUnlocked?m.icon:'🔒'}</span>
<div class="mc-name">${m.name}</div>
${done?`<div class="mc-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="mc-score">${p.score}/100</div>`:(mUnlocked?'<div class="mc-score">Başla →</div>':'<div class="mc-lock">🔒</div>')}
</div>`});

row.innerHTML=`<div class="level-header"><span class="level-icon">${unlocked?lvl.icon:'🔒'}</span><span class="level-name" style="color:${lvl.color}">${lvl.name}</span>${allDone?'<span style="margin-left:auto;color:#3fb950">✅</span>':''}</div>
<div class="level-story">${lvl.story}</div><div class="missions-row">${missionsHTML}</div>`;
map.appendChild(row)});

// Design level
const dUnlocked=isDesignUnlocked(missionProgress);const conn2=document.createElement('div');conn2.className='level-connector'+(dUnlocked?' active':'');map.appendChild(conn2);
const dl=CURRICULUM.designLevel;const drow=document.createElement('div');drow.className='level-row design '+(dUnlocked?'unlocked':'locked');
drow.innerHTML=`<div class="level-header"><span class="level-icon">${dUnlocked?'🔧':'🔒'}</span><span class="level-name" style="color:${dl.color}">${dl.name}</span></div><div class="level-story">${dl.story}</div>
${dUnlocked?'<button class="btn btn-primary" onclick="showStudentTab(\'design\')" style="margin-top:8px">🔧 Drone Tasarla →</button>':'<div class="dim-text">Tüm görevleri tamamla!</div>'}`;
map.appendChild(drow)}

// ═══ BRİFİNG ═══
function openBriefing(levelId,mIdx){const lvl=CURRICULUM.levels.find(l=>l.id===levelId);const m=lvl.missions[mIdx];activeMission={levelId,mIdx,mission:m,level:lvl};
document.getElementById('bp-level-icon').textContent=m.icon;document.getElementById('bp-title').textContent=m.name;document.getElementById('bp-story').textContent=m.briefing;
document.getElementById('bp-objectives').innerHTML=m.objectives.map(o=>`<div class="bp-obj">⬜ ${o.label}</div>`).join('');
document.getElementById('bp-hint').innerHTML='💡 İpucu: '+m.hint;
document.getElementById('briefing-popup').classList.remove('hidden')}
function closeBriefing(){document.getElementById('briefing-popup').classList.remove('hidden');document.getElementById('briefing-popup').classList.add('hidden')}

function startMissionFromBriefing(){closeBriefing();showStudentTab('sim');if(!activeMission)return;const m=activeMission.mission;
document.getElementById('mission-title').textContent=m.icon+' '+m.name;document.getElementById('mission-briefing').textContent=m.briefing;
document.getElementById('mission-objectives').innerHTML=m.objectives.map(o=>`<div class="obj-item"><span class="obj-check">⬜</span> ${o.label}</div>`).join('');
document.getElementById('mission-hint').classList.remove('hidden');document.getElementById('hint-text').textContent=m.hint;
const env=m.environment;drone.reset();canvas.reset();drone.wind={active:env.wind,dir:Math.floor(Math.random()*360),speed:env.windSpeed};drone.obstacles=env.obstacles||[];drone.nfzZones=env.nfz||[];drone.battery=env.battery||100;canvas.setEnvironment(env.obstacles,env.nfz);canvas.draw();
clearBlocks();logConsole('═'.repeat(30));logConsole('📋 Görev: '+m.name);logConsole(m.briefing);logConsole('═'.repeat(30))}

// ═══ BLOK PROGRAMLAMA ═══
const BLOCK_DEFS={MOTOR_AC:{color:'#6e7681',icon:'⚙️',label:'Motor Aç',params:[]},HAVALAN:{color:'#238636',icon:'🚀',label:'Havalan',params:[{key:'height',label:'m',def:10}]},ROTA_GIT:{color:'#1f6feb',icon:'📍',label:'Git',params:[{key:'x',label:'X',def:0},{key:'y',label:'Y',def:0}]},FOTO_CEK:{color:'#8b5cf6',icon:'📸',label:'Foto',params:[]},BEKLE:{color:'#d29922',icon:'⏳',label:'Bekle',params:[{key:'seconds',label:'sn',def:3}]},KARGO_BIRAK:{color:'#f0883e',icon:'📦',label:'Kargo',params:[]},IN_YAP:{color:'#f85149',icon:'🔽',label:'İniş',params:[]}};

function addBlock(type){const d=BLOCK_DEFS[type],id=Date.now();blocks.push({id,type,params:{}});const c=document.getElementById('block-program'),div=document.createElement('div');div.className='block-item';div.style.background=d.color;div.id='block-'+id;
let ph='';d.params.forEach(p=>{ph+=`<span style="margin-left:4px;font-size:10px">${p.label}:</span><input type="number" value="${p.def}" onchange="updateBlockParam(${id},'${p.key}',this.value)">`});
div.innerHTML=`<span>${blocks.length}. ${d.icon} ${d.label}</span><span>${ph}<button class="block-del" onclick="removeBlock(${id})">✕</button></span>`;c.appendChild(div);logConsole('🧩 +'+d.label)}
function updateBlockParam(bid,p,v){const b=blocks.find(x=>x.id===bid);if(b)b.params[p]=parseFloat(v)||0}
function removeBlock(id){blocks=blocks.filter(b=>b.id!==id);document.getElementById('block-'+id)?.remove()}
function clearBlocks(){blocks=[];document.getElementById('block-program').innerHTML=''}

// ═══ GÖREV ÇALIŞTIR ═══
async function runMission(){if(!drone||blocks.length===0){logConsole('⚠️ Blok ekleyin!','warn');return}
drone.maxAlt=50;drone.hasCamera=true;drone.hasGPS=true;
const tasks=blocks.map(b=>{const d=BLOCK_DEFS[b.type];return{type:b.type,label:d.icon+' '+d.label,params:{...getDefP(b.type),...b.params}}});
const score=await drone.runMission(tasks);showScore(score);
if(currentUser&&activeMission){try{const m=activeMission.mission;await DB.saveMission(currentUser.uid,{missionId:m.id,score:score.points,grade:score.grade,distance:score.distance,duration:score.duration,level:activeMission.levelId,photos:score.photos,cargo:score.cargo});
missionProgress[m.id]={score:score.points,grade:score.grade};await DB.saveProfile(currentUser.uid,{lastActive:Date.now(),totalMissions:(userProfile.totalMissions||0)+1});userProfile.totalMissions=(userProfile.totalMissions||0)+1;
if(score.points>=m.minScore)showLevelComplete(score,activeMission);
await checkBadges(score);renderMissionMap()}catch(e){console.error(e)}}}
function getDefP(t){return t==='HAVALAN'?{height:10}:t==='ROTA_GIT'?{x:0,y:0}:t==='BEKLE'?{seconds:3}:{}}
function showScore(s){const c={A:'#3fb950',B:'#58a6ff',C:'#d29922',D:'#f0883e',F:'#f85149'};const stars=s.points>=90?'⭐⭐⭐':s.points>=75?'⭐⭐☆':s.points>=60?'⭐☆☆':'☆☆☆';
document.getElementById('score-display').innerHTML=`<div class="score-big" style="color:${c[s.grade]}">${s.points}/100</div><div class="score-stars">${stars}</div><div style="font-size:20px;color:${c[s.grade]};font-weight:800">${s.grade}</div><div class="dim-text" style="margin-top:8px">⏱${s.duration}s | 📍${s.distance}m | 🔋%${s.batteryLeft}</div>`}

function showLevelComplete(score,am){const lvl=am.level;document.getElementById('lp-stars').textContent=score.points>=90?'⭐⭐⭐':score.points>=75?'⭐⭐':score.points>=60?'⭐':'';
document.getElementById('lp-title').textContent='✅ '+am.mission.name+' Tamamlandı!';document.getElementById('lp-score').textContent=score.points+'/100';
document.getElementById('lp-fact').textContent=lvl.funFact;document.getElementById('level-popup').classList.remove('hidden');fireConfetti()}
function closeLevelPopup(){document.getElementById('level-popup').classList.add('hidden')}

// ═══ ROZETLER ═══
async function checkBadges(score){if(!currentUser)return;const ms=Object.values(missionProgress);const tM=ms.length,tP=ms.reduce((s,m)=>s+(m.photos||0),0),tC=ms.reduce((s,m)=>s+(m.cargo||0),0),tD=ms.reduce((s,m)=>s+(m.distance||0),0);
const checks={ilk_ucus:tM>=1,pilot:tM>=5,kaptan:tM>=15,fotograf:tP>=10,kargoci:tC>=5,yuksek:score.maxAlt>=50,maraton:tD>=500,puan_a:ms.some(m=>m.grade==='A'),ruzgar:score.level>=4&&score.points>0,seviye5:ms.some(m=>m.level>=5&&m.score>0)};
const nb=[];for(const[id,ok]of Object.entries(checks)){if(ok&&!earnedBadges.includes(id)){earnedBadges.push(id);await DB.saveBadge(currentUser.uid,id);nb.push(id)}}
if(nb.length>0){showBadgePopup(nb);const nl=Math.min(5,Math.floor(earnedBadges.length/2)+1);if(nl>(userProfile.level||1)){await DB.saveProfile(currentUser.uid,{level:nl});userProfile.level=nl;document.getElementById('student-level').textContent='Seviye '+nl}}}
function updateBadgesPage(){const g=document.getElementById('badges-grid');g.innerHTML='';for(const[id,b]of Object.entries(BADGES)){const e=earnedBadges.includes(id);g.innerHTML+=`<div class="badge-cell-big ${e?'earned':'locked'}"><span class="bc-icon">${e?b.icon:'🔒'}</span><div class="bc-name">${b.name}</div><div class="bc-desc">${b.desc}</div></div>`}}
function showBadgePopup(ids){document.getElementById('badge-popup-body').innerHTML=ids.map(id=>{const b=BADGES[id];return`<div class="popup-badge">${b.icon} <b>${b.name}</b> — ${b.desc}</div>`}).join('');document.getElementById('badge-popup').classList.remove('hidden')}
function closeBadgePopup(){document.getElementById('badge-popup').classList.add('hidden')}

// ═══ DRONE TASARIM ═══
let designChoices={frame:'standard',battery:'medium',camera:'hd',motor:'standard'};
function updateDesignPage(){const unlocked=isDesignUnlocked(missionProgress);const done=Object.values(missionProgress).filter(p=>p.score>=60).length;
document.getElementById('design-locked').classList.toggle('hidden',unlocked);document.getElementById('design-unlocked').classList.toggle('hidden',!unlocked);
document.getElementById('design-progress').textContent='İlerleme: '+done+'/15 görev';
if(!unlocked)return;const dp=CURRICULUM.designLevel.designParams;
['frame','battery','camera','motor'].forEach(cat=>{const el=document.getElementById(cat==='frame'?'frame-options':cat+'-options');if(!el)return;
const items=dp[cat+'s']||dp[cat+'ies'];if(!items)return;
el.innerHTML=items.map(it=>`<div class="design-opt ${designChoices[cat]===it.id?'selected':''}" onclick="selectDesign('${cat}','${it.id}')">
<span class="do-icon">${it.icon||'⚡'}</span><div><div class="do-name">${it.name}</div><div class="do-desc">${it.desc||''}</div></div></div>`).join('')});
updateDesignStats()}
function selectDesign(cat,id){designChoices[cat]=id;updateDesignPage()}
function updateDesignStats(){const dp=CURRICULUM.designLevel.designParams;const f=dp.frames.find(x=>x.id===designChoices.frame)||dp.frames[1];const b=dp.batteries.find(x=>x.id===designChoices.battery)||dp.batteries[1];const m=dp.motors.find(x=>x.id===designChoices.motor)||dp.motors[1];
const totalW=f.weight+b.weight;const bat=Math.round(b.capacity*m.efficiency);const speed=Math.round(m.power*10);
document.getElementById('design-stats').innerHTML=`<div class="ds-item"><div class="ds-value">${totalW}g</div><div class="ds-label">Ağırlık</div></div><div class="ds-item"><div class="ds-value">${bat}%</div><div class="ds-label">Batarya</div></div><div class="ds-item"><div class="ds-value">${speed}m/s</div><div class="ds-label">Hız</div></div><div class="ds-item"><div class="ds-value">${f.maxPayload}g</div><div class="ds-label">Yük Kap.</div></div>`}
function launchCustomDrone(){showStudentTab('sim');activeMission=null;drone.reset();canvas.reset();
document.getElementById('mission-title').textContent='🔧 Serbest Uçuş';document.getElementById('mission-briefing').textContent='Kendi drone\'unla istediğin yere uç! Engel yok, kural yok.';document.getElementById('mission-objectives').innerHTML='';document.getElementById('mission-hint').classList.add('hidden');
drone.battery=80;drone.wind={active:false,dir:0,speed:0};drone.obstacles=[];drone.nfzZones=[];canvas.setEnvironment([],[]);clearBlocks();logConsole('🔧 Özel drone hazır — serbest uçuş modu!')}

// ═══ BİLDİRİMLER ═══
async function loadAssignments(){if(!currentUser)return;try{const t=await DB.getAssignments(currentUser.uid);const el=document.getElementById('assignments-list');el.innerHTML=t.length?t.map(a=>`<div class="assignment-item"><strong>${a.title||a.template}</strong><br><span class="dim-text">${a.description||''}</span></div>`).join(''):'<p class="dim-text">Henüz görev yok</p>'}catch(e){}}
async function loadNotifications(){if(!currentUser)return;try{const n=await DB.getNotifications(currentUser.uid);const el=document.getElementById('notifications');el.innerHTML=n.length?n.map(x=>`<div class="notification-item">💬 ${x.message}<div class="notif-time">${x.createdAt?new Date(x.createdAt).toLocaleDateString('tr'):''}</div></div>`).join(''):'<p class="dim-text">Henüz mesaj yok</p>'}catch(e){}}

// ═══ ÖĞRETMEN ═══
async function initTeacher(){showScreen('teacher-screen');document.getElementById('teacher-name').textContent='👤 '+userProfile.name;await refreshTeacherData()}
async function refreshTeacherData(){try{const students=await DB.getAllStudents(),missions=await DB.getAllMissions();
document.getElementById('stat-students').textContent=students.length;document.getElementById('stat-missions').textContent=missions.length;
const avg=missions.length?Math.round(missions.reduce((s,m)=>s+(m.score||0),0)/missions.length):'—';document.getElementById('stat-avg').textContent=avg;
const today=new Date().toDateString();document.getElementById('stat-active').textContent=students.filter(s=>s.lastActive&&new Date(s.lastActive).toDateString()===today).length;
const opts=students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');document.getElementById('assign-student').innerHTML='<option value="">Öğrenci seçin...</option>'+opts;document.getElementById('feedback-student').innerHTML='<option value="">Öğrenci seçin...</option>'+opts;
const grid=document.getElementById('students-grid');grid.innerHTML='';for(const s of students){const sm=missions.filter(m=>m.userId===s.id);const ls=sm.length?sm[0].score:'—';const lg=sm.length?sm[0].grade:'—';const badges=await DB.getBadges(s.id);const c={A:'#3fb950',B:'#58a6ff',C:'#d29922',D:'#f0883e',F:'#f85149'};
grid.innerHTML+=`<div class="student-card"><div class="sc-name">👤 ${s.name}</div><div class="sc-row"><span>🎮 Seviye</span><span>${s.level||1}/5</span></div><div class="sc-row"><span>📊 Görev</span><span>${sm.length}</span></div><div class="sc-row"><span>🏆 Son Skor</span><span style="color:${c[lg]||'#fff'}">${ls}/100 (${lg})</span></div><div class="sc-row"><span>🏅 Rozet</span><span>${badges.length}/${Object.keys(BADGES).length}</span></div><div class="sc-row"><span>📅 Son Giriş</span><span>${s.lastActive?new Date(s.lastActive).toLocaleDateString('tr'):'—'}</span></div><div class="sc-badges">${badges.map(b=>BADGES[b]?.icon||'').join(' ')}</div></div>`}}catch(e){console.error(e)}}
async function assignTask(){const sid=document.getElementById('assign-student').value,tmpl=document.getElementById('assign-template').value,desc=document.getElementById('assign-desc').value;if(!sid){alert('Öğrenci seçin!');return}const ts={tarla:'🌾 Tarla Tarama',arama:'🔍 Arama Kurtarma',kargo:'📦 Kargo Teslimat',foto:'📸 Fotoğraf Turu',ozel:'✏️ Özel Görev'};await DB.assignTask(currentUser.uid,sid,{title:ts[tmpl]||tmpl,template:tmpl,description:desc});document.getElementById('assign-desc').value='';alert('✅ Görev atandı!')}
async function sendFeedback(){const sid=document.getElementById('feedback-student').value,msg=document.getElementById('feedback-text').value;if(!sid||!msg){alert('Öğrenci ve mesaj gerekli!');return}await DB.sendFeedback(currentUser.uid,sid,msg);document.getElementById('feedback-text').value='';alert('✅ Mesaj gönderildi!')}

// ═══ KONFETİ ═══
function fireConfetti(){const c=document.getElementById('confetti-canvas'),ctx=c.getContext('2d');c.width=window.innerWidth;c.height=window.innerHeight;const ps=[];const colors=['#f85149','#3fb950','#58a6ff','#d29922','#8b5cf6','#f0883e'];for(let i=0;i<150;i++)ps.push({x:Math.random()*c.width,y:-10-Math.random()*200,w:Math.random()*8+4,h:Math.random()*6+3,color:colors[Math.floor(Math.random()*colors.length)],vy:Math.random()*3+2,vx:(Math.random()-0.5)*4,rot:Math.random()*360,vr:Math.random()*10-5});
let frames=0;function draw(){ctx.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.y+=p.vy;p.x+=p.vx;p.rot+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()});frames++;if(frames<120)requestAnimationFrame(draw);else ctx.clearRect(0,0,c.width,c.height)}draw()}
