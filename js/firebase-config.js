/* ═══ FIREBASE KONFİGÜRASYON — Realtime Database (Ücretsiz, kart gerekmez) ═══
   1. https://console.firebase.google.com
   2. Authentication > Email/Password etkinleştirin
   3. Realtime Database > Create Database > Test Mode
   4. Proje Ayarları > Web uygulaması ekle > Config'i buraya yapıştırın
*/

const firebaseConfig = {
    apiKey: "AIzaSyBx-t9o8u45OKrie1PVlwGpfGBSY1luEQY",
    authDomain: "drone-egitim.firebaseapp.com",
    databaseURL: "https://drone-egitim-default-rtdb.firebaseio.com",
    projectId: "drone-egitim",
    storageBucket: "drone-egitim.firebasestorage.app",
    messagingSenderId: "931595447782",
    appId: "1:931595447782:web:224b617ad5c0747035fa27"
};

// Firebase başlat
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const rtdb = firebase.database();

// ═══ YARDIMCI FONKSİYONLAR (Realtime Database) ═══
const DB = {
    async saveProfile(uid, data) {
        const updates = { ...data };
        if (updates.createdAt) updates.createdAt = Date.now();
        if (updates.lastActive) updates.lastActive = Date.now();
        await rtdb.ref('users/' + uid).update(updates);
    },

    async getProfile(uid) {
        const snap = await rtdb.ref('users/' + uid).once('value');
        return snap.val();
    },

    async saveMission(uid, missionData) {
        const key = rtdb.ref('missions').push().key;
        await rtdb.ref('missions/' + key).set({
            userId: uid,
            ...missionData,
            createdAt: Date.now()
        });
        // Toplam görev sayısını artır
        const snap = await rtdb.ref('users/' + uid + '/totalMissions').once('value');
        const current = snap.val() || 0;
        await rtdb.ref('users/' + uid).update({
            totalMissions: current + 1,
            lastActive: Date.now()
        });
    },

    async saveBadge(uid, badgeId) {
        await rtdb.ref('badges/' + uid + '/' + badgeId).set({
            earnedAt: Date.now()
        });
    },

    async getBadges(uid) {
        const snap = await rtdb.ref('badges/' + uid).once('value');
        const data = snap.val();
        return data ? Object.keys(data) : [];
    },

    async getMissions(uid, limit = 10) {
        const snap = await rtdb.ref('missions')
            .orderByChild('userId').equalTo(uid)
            .limitToLast(limit).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.entries(data).map(([id, v]) => ({ id, ...v })).reverse();
    },

    async getAllStudents() {
        const snap = await rtdb.ref('users')
            .orderByChild('role').equalTo('student').once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.entries(data).map(([id, v]) => ({ id, ...v }));
    },

    async getAllMissions() {
        const snap = await rtdb.ref('missions')
            .limitToLast(100).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.entries(data).map(([id, v]) => ({ id, ...v })).reverse();
    },

    async assignTask(teacherId, studentId, task) {
        const key = rtdb.ref('assignments').push().key;
        await rtdb.ref('assignments/' + key).set({
            teacherId, studentId,
            ...task,
            status: 'pending',
            createdAt: Date.now()
        });
    },

    async getAssignments(uid) {
        const snap = await rtdb.ref('assignments')
            .orderByChild('studentId').equalTo(uid).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.entries(data).map(([id, v]) => ({ id, ...v })).reverse();
    },

    async sendFeedback(teacherId, studentId, message) {
        const key = rtdb.ref('notifications').push().key;
        await rtdb.ref('notifications/' + key).set({
            fromId: teacherId,
            toId: studentId,
            message,
            read: false,
            createdAt: Date.now()
        });
    },

    async getNotifications(uid) {
        const snap = await rtdb.ref('notifications')
            .orderByChild('toId').equalTo(uid).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.entries(data).map(([id, v]) => ({ id, ...v })).reverse().slice(0, 20);
    }
};
