const PIN_ADMIN = "0000";
let isAdminMode = false;

const PAYROLL_CONFIG = {
    "Manager": { rate: 2083.33, limit: 50000, items: "Tanpa Bonus" },
    "Expert Motier": { rate: 1250, limit: 30000, items: "10 Harness + 2 Kit" },
    "Novice": { rate: 1041.66, limit: 25000, items: "5 Harness + 2 Kit" },
    "Recruit": { rate: 0, limit: 0, items: "5 Harness + 2 Kit" }
};

let employees = JSON.parse(localStorage.getItem('gg_db_v10')) || [];

const fmt = (v) => "Rp " + Math.floor(v).toLocaleString('id-ID');

function render() {
    const list = document.getElementById('employeeList'), q = document.getElementById('searchInput').value.toLowerCase();
    let totalPayroll = 0, counts = {};
    list.innerHTML = "";

    employees.filter(e => e.nama.toLowerCase().includes(q)).forEach(e => {
        const conf = PAYROLL_CONFIG[e.jabatan] || { rate: 0, limit: 0, items: "-" };
        let jam = e.dtk / 3600;
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
    
    localStorage.setItem('gg_db_v10', JSON.stringify(employees));
    if(isAdminMode) renderAdminManagement();
}

function handleDuty(id) {
    let e = employees.find(x => x.id === id);
    let p = prompt(`PIN ${e.nama}:`);
    if (p !== e.pin) return p === null ? null : alert("PIN SALAH!");
    if (e.st === "OFF") { e.st = "ON"; e.tgl = Date.now(); } 
    else { e.dtk += Math.floor((Date.now() - e.tgl)/1000); e.st = "OFF"; }
    render();
}

function toggleAdmin(s) {
    if(s && prompt("PASSWORD:") !== PIN_ADMIN) return;
    isAdminMode = s;
    document.getElementById('adminModal').style.display = s ? 'flex' : 'none';
    render();
}

function saveEmployee() {
    const id = document.getElementById('editId').value, n = document.getElementById('empName').value, j = document.getElementById('empJabatan').value, p = document.getElementById('empPin').value;
    if(!n || !p) return;
    if(id) Object.assign(employees.find(e => e.id == id), {nama:n, jabatan:j, pin:p});
    else employees.push({id:Date.now(), nama:n, jabatan:j, pin:p, dtk:0, st:"OFF", tgl:0});
    document.getElementById('editId').value = ""; document.getElementById('empName').value = ""; document.getElementById('empPin').value = "";
    render();
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

function del(id) { if(confirm("Hapus?")) { employees = employees.filter(x => x.id !== id); render(); } }
function resetAllWeekly() { if(confirm("Reset jam?")) { employees.forEach(e => {e.dtk=0; e.st="OFF"}); render(); } }
function exportToWord() { 
    let t = `<h2>REPORT</h2><table border="1">`;
    employees.forEach(e => t += `<tr><td>${e.nama}</td><td>${(e.dtk/3600).toFixed(1)}j</td></tr>`);
    const blob = new Blob([t], {type:'application/msword'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Report.doc'; link.click();
}

setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString('id-ID'); }, 1000);
render();
