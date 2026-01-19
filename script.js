// CONFIGURATION FIREBASE
const firebaseConfig = {
    databaseURL: "https://grove-gear-8452f-default-rtdb.asia-southeast1.firebasedatabase.app/" 
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const PIN_ADMIN = "0000";
let isAdminMode = false;
let employees = [];

// KONFIGURASI PAYROLL DIAMBIL DARI KODINGAN LAMA
const PAYROLL_CONFIG = {
    "Manager": { rate: 2083.33, limit: 50000, items: "Tanpa Bonus" },
    "Expert Motier": { rate: 1250, limit: 30000, items: "10 Harness + 2 Kit" },
    "Novice": { rate: 1041.66, limit: 25000, items: "5 Harness + 2 Kit" },
    "Recruit": { rate: 0, limit: 0, items: "5 Harness + 2 Kit" }
};

const fmt = (v) => "Rp " + Math.floor(v).toLocaleString('id-ID');

// MENDENGARKAN PERUBAHAN DATA SECARA REALTIME
db.ref('employees').on('value', (snapshot) => {
    const data = snapshot.val();
    // Konversi objek database menjadi array
    employees = data ? Object.keys(data).map(key => ({...data[key], fbKey: key})) : [];
    render();
});

function render() {
    const list = document.getElementById('employeeList'), 
          q = document.getElementById('searchInput').value.toLowerCase();
    let totalPayroll = 0, counts = {};
    list.innerHTML = "";

    employees.filter(e => e.nama.toLowerCase().includes(q)).forEach(e => {
        const conf = PAYROLL_CONFIG[e.jabatan] || { rate: 0, limit: 0, items: "-" };
        let jam = (e.dtk || 0) / 3600;
        let gaji = Math.min(jam * conf.rate, conf.limit);
        
        totalPayroll += gaji;
        counts[e.jabatan] = (counts[e.jabatan] || 0) + 1;
        const isMaxed = jam >= 24;

        list.innerHTML += `
        <div class="glass-card rounded-[2rem] p-5 border border-white relative ${e.st === 'ON' ? 'ring-2 ring-emerald-500' : ''}">
            <div class="flex flex-col items-center">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-3 ${e.st === 'ON' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}">
                    ${e.nama.charAt(0)}
                </div>
                <h3 class="font-bold text-slate-800 truncate w-full text-center">${e.nama}</h3>
                <span class="text-[8px] font-black text-slate-400 uppercase mb-4">${e.jabatan}</span>
                
                <div class="w-full bg-slate-100 h-1.5 rounded-full mb-3 overflow-hidden">
                    <div class="h-full ${isMaxed ? 'bg-red-500' : 'bg-emerald-500'}" style="width: ${Math.min((jam/24)*100, 100)}%"></div>
                </div>
                
                <div class="flex justify-between w-full mb-4 text-[10px] font-bold">
                    <span class="${isMaxed ? 'text-red-500' : 'text-slate-500'}">${jam.toFixed(1)}j / 24j</span>
                    <span class="text-emerald-600">${fmt(gaji)}</span>
                </div>

                <button onclick="handleDuty(${e.id})" class="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest ${e.st === 'ON' ? 'bg-white border-2 border-emerald-500 text-emerald-600' : 'bg-slate-900 text-white'}">
                    ${e.st === 'ON' ? 'STOP' : 'START'}
                </button>
                <p class="mt-3 text-[8px] text-blue-500 font-bold italic">📦 ${conf.items}</p>
            </div>
        </div>`;
    });

    document.getElementById('totalGroupPayroll').innerText = fmt(totalPayroll);
    document.getElementById('statsContainer').innerHTML = Object.entries(counts).map(([k,v]) => `
        <div class="bg-white px-4 py-2 rounded-xl border text-[10px] font-bold flex gap-2">
            <span class="text-slate-400 uppercase">${k}</span>
            <span class="text-emerald-600">${v}</span>
        </div>`).join('');
    
    if(isAdminMode) renderAdminManagement();
}

function handleDuty(id) {
    let e = employees.find(x => x.id === id);
    let p = prompt(`PIN ${e.nama}:`);
    if (p !== e.pin) return p === null ? null : alert("PIN SALAH!");
    
    let updates = {};
    if (e.st === "OFF") {
        updates = { st: "ON", tgl: Date.now() };
    } else {
        let newDtk = (e.dtk || 0) + Math.floor((Date.now() - e.tgl)/1000);
        updates = { dtk: newDtk, st: "OFF" };
    }
    // Update langsung ke Firebase
    db.ref('employees/' + id).update(updates);
}

function toggleAdmin(s) {
    if(s && prompt("PASSWORD:") !== PIN_ADMIN) return;
    isAdminMode = s;
    document.getElementById('adminModal').style.display = s ? 'flex' : 'none';
    if(s) renderAdminManagement();
}

function saveEmployee() {
    const editId = document.getElementById('editId').value;
    const id = editId || Date.now();
    const n = document.getElementById('empName').value;
    const j = document.getElementById('empJabatan').value;
    const p = document.getElementById('empPin').value;
    
    if(!n || !p) return;

    const existing = employees.find(e => e.id == id);
    const empData = {
        id: parseInt(id),
        nama: n,
        jabatan: j,
        pin: p,
        dtk: existing ? (existing.dtk || 0) : 0,
        st: existing ? (existing.st || "OFF") : "OFF",
        tgl: existing ? (existing.tgl || 0) : 0
    };

    db.ref('employees/' + id).set(empData);
    
    // Reset Form
    document.getElementById('editId').value = ""; 
    document.getElementById('empName').value = ""; 
    document.getElementById('empPin').value = "";
}

function renderAdminManagement() {
    const container = document.getElementById('adminManageList');
    container.innerHTML = employees.map(e => `
        <div class="flex items-center justify-between p-3 bg-white border rounded-xl text-xs">
            <span><b>${e.nama}</b> (${e.pin})</span>
            <div class="flex gap-2">
                <button onclick="fillEdit(${e.id})" class="text-blue-500 font-bold">Edit</button>
                <button onclick="del(${e.id})" class="text-red-500 font-bold">Hapus</button>
            </div>
        </div>`).join('');
}

function fillEdit(id) {
    let e = employees.find(x => x.id === id);
    document.getElementById('editId').value = e.id;
    document.getElementById('empName').value = e.nama;
    document.getElementById('empJabatan').value = e.jabatan;
    document.getElementById('empPin').value = e.pin;
}

function del(id) { 
    if(confirm("Hapus karyawan ini secara permanen?")) { 
        db.ref('employees/' + id).remove(); 
    } 
}

function resetAllWeekly() { 
    if(confirm("Reset semua jam kerja karyawan ke 0?")) { 
        employees.forEach(e => {
            db.ref('employees/' + e.id).update({dtk: 0, st: "OFF", tgl: 0});
        });
    } 
}

function exportToWord() { 
    // Header tabel ditambahkan kolom Gaji
    let t = `
    <h2 style="text-align:center;">GROVE GEAR - ATTENDANCE REPORT</h2>
    <p style="text-align:center;">Generated: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
    <table border="1" style="width:100%; border-collapse: collapse; text-align: left;">
        <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px;">Nama</th>
            <th style="padding: 8px;">Jabatan</th>
            <th style="padding: 8px;">Total Jam</th>
            <th style="padding: 8px;">Estimasi Gaji</th>
        </tr>`;

    let grandTotal = 0;

    employees.forEach(e => {
        // Logika perhitungan gaji sesuai PAYROLL_CONFIG
        const conf = PAYROLL_CONFIG[e.jabatan] || { rate: 0, limit: 0 };
        let jam = (e.dtk || 0) / 3600;
        let gaji = Math.min(jam * conf.rate, conf.limit);
        
        grandTotal += gaji;

        t += `
        <tr>
            <td style="padding: 8px;">${e.nama}</td>
            <td style="padding: 8px;">${e.jabatan}</td>
            <td style="padding: 8px;">${jam.toFixed(1)}j</td>
            <td style="padding: 8px;">${fmt(gaji)}</td>
        </tr>`;
    });

    // Menambahkan baris Total Keseluruhan di akhir tabel
    t += `
        <tr style="font-weight: bold; background-color: #e2e8f0;">
            <td colspan="3" style="padding: 8px; text-align: right;">TOTAL PAYROLL:</td>
            <td style="padding: 8px;">${fmt(grandTotal)}</td>
        </tr>
    </table>`;

    const blob = new Blob(['\ufeff', t], {type:'application/msword'});
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = `Report_GroveGear_${new Date().toISOString().split('T')[0]}.doc`; 
    link.click();
}

// Update jam setiap detik
setInterval(() => { 
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = new Date().toLocaleTimeString('id-ID'); 
}, 1000);
