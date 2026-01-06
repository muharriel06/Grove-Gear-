const PIN_ADMIN = "0000", TARIF = 1250, LIMIT = 30000;
let isAdminMode = false;

// Data Awal
const initialData = [
    {id: 1, nama: "Budi Santoso", jabatan: "Manager", pin: "1001"},
    {id: 2, nama: "Siti Aminah", jabatan: "Manager", pin: "1002"},
    {id: 5, nama: "Heri Cahyono", jabatan: "Expert Motier", pin: "1005"},
    {id: 9, nama: "Ani Maryani", jabatan: "Novice", pin: "1009"},
    {id: 13, nama: "Guntur Bumi", jabatan: "Recruit", pin: "1013"}
];

// Load Database dari LocalStorage
let employees = JSON.parse(localStorage.getItem('gg_db_v5')) || initialData.map(e => ({...e, dtk:0, st:"OFF", tgl:0}));

const fmt = (v) => "Rp " + Math.floor(v).toLocaleString('id-ID');

// Render Utama
function render() {
    const list = document.getElementById('employeeList'), q = document.getElementById('searchInput').value.toLowerCase();
    let total = 0, counts = {};
    list.innerHTML = "";

    employees.filter(e => e.nama.toLowerCase().includes(q)).forEach(e => {
        let jam = e.dtk/3600, gaji = Math.min(jam * TARIF, LIMIT);
        total += gaji;
        counts[e.jabatan] = (counts[e.jabatan] || 0) + 1;

        list.innerHTML += `
        <div class="flex flex-col md:flex-row items-center justify-between p-6 glass-card rounded-[2rem] border border-white ${e.st === 'ON' ? 'is-on-duty shadow-emerald-100' : ''}">
            <div class="flex items-center gap-5 w-full">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${e.st === 'ON' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}">
                    ${e.nama.charAt(0)}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <h3 class="font-bold text-slate-800 text-lg">${e.nama}</h3>
                        <span class="text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest border border-slate-200">${e.jabatan}</span>
                    </div>
                    <div class="flex gap-4 mt-1 font-bold text-[11px] text-slate-400">
                        <span>JAM: ${jam.toFixed(1)}j</span>
                        <span class="text-emerald-600 uppercase">Total: ${fmt(gaji)}</span>
                    </div>
                </div>
                <button onclick="handleDuty(${e.id})" class="px-8 py-3.5 rounded-2xl font-black text-xs transition-all active:scale-95 uppercase tracking-widest ${e.st === 'ON' ? 'bg-white border-2 border-emerald-500 text-emerald-600' : 'bg-slate-900 text-white shadow-lg'}">
                    ${e.st === 'ON' ? 'Stop' : 'Start'}
                </button>
            </div>
        </div>`;
    });

    document.getElementById('totalGroupPayroll').innerText = fmt(total);
    document.getElementById('statsContainer').innerHTML = Object.entries(counts).map(([k,v]) => `
        <div class="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span class="font-bold text-slate-600 uppercase text-xs tracking-tighter">${k}</span>
            <span class="bg-white px-4 py-1 rounded-full font-black text-xs text-emerald-600 shadow-sm">${v}</span>
        </div>`).join('');
    
    localStorage.setItem('gg_db_v5', JSON.stringify(employees));
    if(isAdminMode) renderAdminManagement();
}

// Render Manajemen di Modal Admin
function renderAdminManagement() {
    const container = document.getElementById('adminManageList');
    container.innerHTML = "";

    employees.forEach(e => {
        container.innerHTML += `
        <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-all">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">${e.nama[0]}</div>
                <div>
                    <h4 class="text-sm font-bold text-slate-800 leading-tight">${e.nama}</h4>
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">${e.jabatan} • PIN: ${e.pin}</p>
                </div>
            </div>
            <div class="flex gap-1">
                <button onclick="fillEdit(${e.id})" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button onclick="del(${e.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>`;
    });
}

// Fungsi Admin & Form
function handleDuty(id) {
    let e = employees.find(x => x.id === id);
    let p = prompt(`PIN ${e.nama}:`);
    if (p === null) return;
    if (p !== e.pin) return alert("PIN SALAH!");
    if (e.st === "OFF") { e.st = "ON"; e.tgl = Date.now(); } 
    else { e.dtk += Math.floor((Date.now() - e.tgl)/1000); e.st = "OFF"; }
    render();
}

function toggleAdmin(s) {
    if(s && prompt("PASSWORD ADMIN:") !== PIN_ADMIN) return alert("AKSES DITOLAK!");
    isAdminMode = s;
    document.getElementById('adminModal').style.display = s ? 'flex' : 'none';
    render();
}

function saveEmployee() {
    const id = document.getElementById('editId').value, n = document.getElementById('empName').value, j = document.getElementById('empJabatan').value, p = document.getElementById('empPin').value;
    if(!n || !p) return alert("Lengkapi data!");
    if(id) { 
        let x = employees.find(e => e.id == id);
        Object.assign(x, {nama:n, jabatan:j, pin:p});
    } else {
        employees.push({id:Date.now(), nama:n, jabatan:j, pin:p, dtk:0, st:"OFF", tgl:0});
    }
    resetForm(); render();
}

function fillEdit(id) {
    let e = employees.find(x => x.id === id);
    document.getElementById('editId').value = e.id;
    document.getElementById('empName').value = e.nama;
    document.getElementById('empJabatan').value = e.jabatan;
    document.getElementById('empPin').value = e.pin;
    document.getElementById('formLabel').innerText = "Edit: " + e.nama;
    document.getElementById('btnSave').innerText = "UPDATE";
    document.getElementById('btnCancel').classList.remove('hidden');
}

function del(id) {
    const e = employees.find(x => x.id === id);
    if(confirm(`Hapus ${e.nama}?`)) { employees = employees.filter(x => x.id !== id); render(); }
}

function resetForm() {
    document.getElementById('editId').value = ""; document.getElementById('empName').value = ""; document.getElementById('empPin').value = "";
    document.getElementById('formLabel').innerText = "Tambah / Edit Data";
    document.getElementById('btnSave').innerText = "SIMPAN";
    document.getElementById('btnCancel').classList.add('hidden');
}

function resetAllWeekly() {
    if(confirm("Reset semua jam kerja?")) { employees.forEach(e => {e.dtk=0; e.st="OFF"}); render(); }
}

function exportToWord() {
    let table = `<table border="1" style="width:100%; border-collapse: collapse;"><tr><th>No</th><th>Nama</th><th>Jabatan</th><th>Jam</th><th>Gaji</th></tr>`;
    employees.forEach((e,i) => {
        let jam = (e.dtk/3600).toFixed(1), gaji = Math.min((e.dtk/3600) * TARIF, LIMIT);
        table += `<tr><td style="text-align:center">${i+1}</td><td>${e.nama}</td><td>${e.jabatan}</td><td style="text-align:center">${jam}j</td><td style="text-align:right">${fmt(gaji)}</td></tr>`;
    });
    const blob = new Blob(['\ufeff', `<h2>REPORT GROVEGEAR</h2>` + table + `</table>`], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_GG.doc`;
    link.click();
}

// Jam Digital
setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString('id-ID'); }, 1000);

// Inisialisasi
render();
