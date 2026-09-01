// ==================== MASTER VENDOR ====================
let masterVendors = [];

async function loadVendorsTable() {
  const tbody = document.getElementById('vendorTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-lg mb-2 block"></i>Memuat Master Vendor...</td></tr>';

  try {
    const { data, error } = await supabaseClient.from('vendors').select('*').order('id', { ascending: true });
    if (error) throw error;

    masterVendors = (data || []).map(v => ({
      rowIndex: v.id,
      vendorCode: v.vendor_code,
      vendorName: v.vendor_name,
      address: v.address,
      email: v.email,
      status: v.status,
      createdAt: new Date(v.created_at).toLocaleDateString('id-ID')
    }));

    renderVendorsTable(masterVendors);
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-6 text-red-400">Eror: ' + err.message + '</td></tr>';
  }
}

function renderVendorsTable(data) {
  const tbody = document.getElementById('vendorTableBody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-slate-400 font-medium">Belum ada data Master Vendor. Klik tombol + untuk menambah.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((v, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 text-center font-medium text-slate-500">${i + 1}.</td>
      <td class="p-3 font-bold text-emerald-800">${v.vendorCode || '-'}</td>
      <td class="p-3 font-extrabold text-slate-800">${v.vendorName || '-'}</td>
      <td class="p-3 text-slate-600 max-w-xs truncate" title="${v.address || '-'}">${v.address || '-'}</td>
      <td class="p-3 text-slate-600">${v.email || '-'}</td>
      <td class="p-3 text-center">
        <span class="${v.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'} px-2.5 py-1 rounded-md font-extrabold text-[10px]">
          ${v.status || 'Aktif'}
        </span>
      </td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openModalEditVendor(${v.rowIndex})" title="Edit Vendor" class="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="handleDeleteVendor(${v.rowIndex}, '${(v.vendorName || '').replace(/'/g, "\\'")}')" title="Hapus Vendor" class="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterVendorTable() {
  const query = (document.getElementById('vendorSearchInput').value || '').toLowerCase();
  const filtered = masterVendors.filter(v => 
    (v.vendorCode || '').toLowerCase().includes(query) ||
    (v.vendorName || '').toLowerCase().includes(query) ||
    (v.address || '').toLowerCase().includes(query)
  );
  renderVendorsTable(filtered);
}

function openModalAddVendor() {
  document.getElementById('formVendor').reset();
  document.getElementById('vendorIsEdit').value = "false";
  document.getElementById('vendorRowIndex').value = "";
  document.getElementById('modalVendorTitle').innerHTML = '<i class="fa-solid fa-truck-field mr-2"></i>Tambah Vendor Baru';
  
  const nextNum = masterVendors.length + 1;
  const autoCode = "VC" + String(nextNum).padStart(4, '0');
  document.getElementById('vendorCodeInput').value = autoCode;
  
  openModal('modalVendor');
}

function openModalEditVendor(rowIndex) {
  const v = masterVendors.find(item => Number(item.rowIndex) === Number(rowIndex));
  if (!v) return;

  document.getElementById('vendorIsEdit').value = "true";
  document.getElementById('vendorRowIndex').value = v.rowIndex;
  document.getElementById('vendorCodeInput').value = v.vendorCode;
  document.getElementById('vendorNameInput').value = v.vendorName;
  document.getElementById('vendorAddressInput').value = v.address;
  document.getElementById('vendorEmailInput').value = v.email;
  document.getElementById('vendorStatusSelect').value = v.status || 'Aktif';

  document.getElementById('modalVendorTitle').innerHTML = `<i class="fa-solid fa-pen-to-square mr-2"></i>Edit Vendor ${v.vendorCode}`;
  openModal('modalVendor');
}

function submitVendorForm(e) {
  e.preventDefault();
  const isEdit = document.getElementById('vendorIsEdit').value === "true";
  const btn = document.getElementById('btnSaveVendor');

  const vendorData = {
    rowIndex: document.getElementById('vendorRowIndex').value,
    vendorCode: document.getElementById('vendorCodeInput').value,
    vendorName: document.getElementById('vendorNameInput').value,
    address: document.getElementById('vendorAddressInput').value,
    email: document.getElementById('vendorEmailInput').value,
    status: document.getElementById('vendorStatusSelect').value
  };

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  const action = isEdit ? 'updateVendor' : 'addVendor';

  apiPost(action, { vendorData: vendorData })
    .then(res => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Vendor`;

      if (res.status === 'success') {
        alert(res.message);
        closeModal('modalVendor');
        loadVendorsTable();
      } else {
        alert("Gagal: " + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Vendor`;
      alert("Eror: " + err);
    });
}

function handleDeleteVendor(rowIndex, vendorName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus vendor '${vendorName}'?`)) return;

  apiPost('deleteVendor', { rowIndex: rowIndex })
    .then(res => {
      if (res.status === 'success') {
        alert(res.message);
        loadVendorsTable();
      } else {
        alert("Gagal menghapus: " + res.message);
      }
    })
    .catch(err => alert("Eror: " + err));
}

function exportVendorToExcel() {
  const query = (document.getElementById('vendorSearchInput')?.value || '').toLowerCase();
  const dataToExport = masterVendors.filter(v => 
    (v.vendorCode || '').toLowerCase().includes(query) ||
    (v.vendorName || '').toLowerCase().includes(query) ||
    (v.address || '').toLowerCase().includes(query)
  );

  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data vendor yang bisa di-export!");
    return;
  }

  const excelRows = dataToExport.map((v, index) => ({
    "No": index + 1,
    "Vendor Code": v.vendorCode || '-',
    "Vendor Name": v.vendorName || '-',
    "Address": v.address || '-',
    "Email": v.email || '-',
    "Status": v.status || 'Aktif',
    "Created At": v.createdAt || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  worksheet['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 30 }, { wch: 45 }, { wch: 25 }, { wch: 12 }, { wch: 15 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Master Vendor");

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Data_Master_Vendor_${today}.xlsx`);
}

// ==================== MASTER CLIENT ====================
let masterClients = [];

async function loadClientsTable() {
  const tbody = document.getElementById('clientTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-lg mb-2 block"></i>Memuat Master Client...</td></tr>';

  try {
    const { data, error } = await supabaseClient.from('clients').select('*').order('id', { ascending: true });
    if (error) throw error;

    masterClients = (data || []).map(c => ({
      rowIndex: c.id,
      clientCode: c.client_code,
      clientName: c.client_name,
      address: c.address,
      status: c.status,
      createdAt: new Date(c.created_at).toLocaleDateString('id-ID')
    }));

    renderClientsTable(masterClients);
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-6 text-red-400">Eror: ' + err.message + '</td></tr>';
  }
}

function renderClientsTable(data) {
  const tbody = document.getElementById('clientTableBody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400 font-medium">Belum ada data Master Client. Klik tombol + untuk menambah.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((c, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 text-center font-medium text-slate-500">${i + 1}.</td>
      <td class="p-3 font-bold text-purple-900">${c.clientCode || '-'}</td>
      <td class="p-3 font-extrabold text-slate-800">${c.clientName || '-'}</td>
      <td class="p-3 text-slate-600 max-w-xs truncate" title="${c.address || '-'}">${c.address || '-'}</td>
      <td class="p-3 text-center">
        <span class="${c.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'} px-2.5 py-1 rounded-md font-extrabold text-[10px]">
          ${c.status || 'Aktif'}
        </span>
      </td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openModalEditClient(${c.rowIndex})" title="Edit Client" class="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="handleDeleteClient(${c.rowIndex}, '${(c.clientName || '').replace(/'/g, "\\'")}')" title="Hapus Client" class="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterClientTable() {
  const query = (document.getElementById('clientSearchInput').value || '').toLowerCase();
  const filtered = masterClients.filter(c => 
    (c.clientCode || '').toLowerCase().includes(query) ||
    (c.clientName || '').toLowerCase().includes(query) ||
    (c.address || '').toLowerCase().includes(query)
  );
  renderClientsTable(filtered);
}

function openModalAddClient() {
  document.getElementById('formClient').reset();
  document.getElementById('clientIsEdit').value = "false";
  document.getElementById('clientRowIndex').value = "";
  document.getElementById('modalClientTitle').innerHTML = '<i class="fa-solid fa-building mr-2"></i>Tambah Client Baru';
  
  const nextNum = masterClients.length + 1;
  const autoCode = "CL" + String(nextNum).padStart(5, '0');
  document.getElementById('clientCodeInput').value = autoCode;
  
  openModal('modalClient');
}

function openModalEditClient(rowIndex) {
  const c = masterClients.find(item => Number(item.rowIndex) === Number(rowIndex));
  if (!c) return;

  document.getElementById('clientIsEdit').value = "true";
  document.getElementById('clientRowIndex').value = c.rowIndex;
  document.getElementById('clientCodeInput').value = c.clientCode;
  document.getElementById('clientNameInput').value = c.clientName;
  document.getElementById('clientAddressInput').value = c.address;
  document.getElementById('clientStatusSelect').value = c.status || 'Aktif';

  document.getElementById('modalClientTitle').innerHTML = `<i class="fa-solid fa-pen-to-square mr-2"></i>Edit Client ${c.clientCode}`;
  openModal('modalClient');
}

function submitClientForm(e) {
  e.preventDefault();
  const isEdit = document.getElementById('clientIsEdit').value === "true";
  const btn = document.getElementById('btnSaveClient');

  const clientData = {
    rowIndex: document.getElementById('clientRowIndex').value,
    clientCode: document.getElementById('clientCodeInput').value,
    clientName: document.getElementById('clientNameInput').value,
    address: document.getElementById('clientAddressInput').value,
    status: document.getElementById('clientStatusSelect').value
  };

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  const action = isEdit ? 'updateClient' : 'addClient';

  apiPost(action, { clientData: clientData })
    .then(res => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Client`;

      if (res.status === 'success') {
        alert(res.message);
        closeModal('modalClient');
        loadClientsTable();
      } else {
        alert("Gagal: " + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Client`;
      alert("Eror: " + err);
    });
}

function handleDeleteClient(rowIndex, clientName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus client '${clientName}'?`)) return;

  apiPost('deleteClient', { rowIndex: rowIndex })
    .then(res => {
      if (res.status === 'success') {
        alert(res.message);
        loadClientsTable();
      } else {
        alert("Gagal menghapus: " + res.message);
      }
    })
    .catch(err => alert("Eror: " + err));
}

function exportClientToExcel() {
  const query = (document.getElementById('clientSearchInput')?.value || '').toLowerCase();
  const dataToExport = masterClients.filter(c => 
    (c.clientCode || '').toLowerCase().includes(query) ||
    (c.clientName || '').toLowerCase().includes(query) ||
    (c.address || '').toLowerCase().includes(query)
  );

  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data client yang bisa di-export!");
    return;
  }

  const excelRows = dataToExport.map((c, index) => ({
    "No": index + 1,
    "Client Code": c.clientCode || '-',
    "Client Name": c.clientName || '-',
    "Address": c.address || '-',
    "Status": c.status || 'Aktif',
    "Created At": c.createdAt || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  worksheet['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 35 }, { wch: 45 }, { wch: 12 }, { wch: 15 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Master Client");

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Data_Master_Client_${today}.xlsx`);
}

// ==================== MASTER DRIVER ====================
let masterDrivers = [];

async function loadDriversTable() {
  const tbody = document.getElementById('driverTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-lg mb-2 block"></i>Memuat Master Driver...</td></tr>';

  try {
    const { data, error } = await supabaseClient.from('drivers').select('*').order('id', { ascending: true });
    if (error) throw error;

    masterDrivers = (data || []).map(d => ({
      rowIndex: d.id,
      driverCode: d.driver_code,
      driverName: d.driver_name,
      phone: d.phone,
      simNumber: d.sim_number,
      status: d.status,
      createdAt: new Date(d.created_at).toLocaleDateString('id-ID')
    }));

    renderDriversTable(masterDrivers);
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-6 text-red-400">Eror: ' + err.message + '</td></tr>';
  }
}

function renderDriversTable(data) {
  const tbody = document.getElementById('driverTableBody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-slate-400 font-medium">Belum ada data Master Driver. Klik tombol + untuk menambah.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((d, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 text-center font-medium text-slate-500">${i + 1}.</td>
      <td class="p-3 font-bold text-rose-800">${d.driverCode || '-'}</td>
      <td class="p-3 font-extrabold text-slate-800">${d.driverName || '-'}</td>
      <td class="p-3 text-slate-600">${d.phone || '-'}</td>
      <td class="p-3 text-slate-600">${d.simNumber || '-'}</td>
      <td class="p-3 text-center">
        <span class="${d.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'} px-2.5 py-1 rounded-md font-extrabold text-[10px]">
          ${d.status || 'Aktif'}
        </span>
      </td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openModalEditDriver(${d.rowIndex})" title="Edit Driver" class="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="handleDeleteDriver(${d.rowIndex}, '${(d.driverName || '').replace(/'/g, "\\'")}')" title="Hapus Driver" class="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterDriverTable() {
  const query = (document.getElementById('driverSearchInput').value || '').toLowerCase();
  const filtered = masterDrivers.filter(d => 
    (d.driverCode || '').toLowerCase().includes(query) ||
    (d.driverName || '').toLowerCase().includes(query) ||
    (d.phone || '').toLowerCase().includes(query)
  );
  renderDriversTable(filtered);
}

function openModalAddDriver() {
  document.getElementById('formDriver').reset();
  document.getElementById('driverIsEdit').value = "false";
  document.getElementById('driverRowIndex').value = "";
  document.getElementById('modalDriverTitle').innerHTML = '<i class="fa-solid fa-id-card mr-2"></i>Tambah Driver Baru';
  
  const nextNum = masterDrivers.length + 1;
  const autoCode = "DRV" + String(nextNum).padStart(3, '0');
  document.getElementById('driverCodeInput').value = autoCode;
  
  openModal('modalDriver');
}

function openModalEditDriver(rowIndex) {
  const d = masterDrivers.find(item => Number(item.rowIndex) === Number(rowIndex));
  if (!d) return;

  document.getElementById('driverIsEdit').value = "true";
  document.getElementById('driverRowIndex').value = d.rowIndex;
  document.getElementById('driverCodeInput').value = d.driverCode;
  document.getElementById('driverNameInput').value = d.driverName;
  document.getElementById('driverPhoneInput').value = d.phone;
  document.getElementById('driverSimInput').value = d.simNumber;
  document.getElementById('driverStatusSelect').value = d.status || 'Aktif';

  document.getElementById('modalDriverTitle').innerHTML = `<i class="fa-solid fa-pen-to-square mr-2"></i>Edit Driver ${d.driverCode}`;
  openModal('modalDriver');
}

function submitDriverForm(e) {
  e.preventDefault();
  const isEdit = document.getElementById('driverIsEdit').value === "true";
  const btn = document.getElementById('btnSaveDriver');

  const driverData = {
    rowIndex: document.getElementById('driverRowIndex').value,
    driverCode: document.getElementById('driverCodeInput').value,
    driverName: document.getElementById('driverNameInput').value,
    phone: document.getElementById('driverPhoneInput').value,
    simNumber: document.getElementById('driverSimInput').value,
    status: document.getElementById('driverStatusSelect').value
  };

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  const action = isEdit ? 'updateDriver' : 'addDriver';

  apiPost(action, { driverData: driverData })
    .then(res => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Driver`;

      if (res.status === 'success') {
        alert(res.message);
        closeModal('modalDriver');
        loadDriversTable();
      } else {
        alert("Gagal: " + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Driver`;
      alert("Eror: " + err);
    });
}

function handleDeleteDriver(rowIndex, driverName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus driver '${driverName}'?`)) return;

  apiPost('deleteDriver', { rowIndex: rowIndex })
    .then(res => {
      if (res.status === 'success') {
        alert(res.message);
        loadDriversTable();
      } else {
        alert("Gagal menghapus: " + res.message);
      }
    })
    .catch(err => alert("Eror: " + err));
}

function exportDriverToExcel() {
  const query = (document.getElementById('driverSearchInput')?.value || '').toLowerCase();
  const dataToExport = masterDrivers.filter(d => 
    (d.driverCode || '').toLowerCase().includes(query) ||
    (d.driverName || '').toLowerCase().includes(query) ||
    (d.phone || '').toLowerCase().includes(query)
  );

  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data driver yang bisa di-export!");
    return;
  }

  const excelRows = dataToExport.map((d, index) => ({
    "No": index + 1,
    "Driver Code": d.driverCode || '-',
    "Driver Name": d.driverName || '-',
    "Phone / WA": d.phone || '-',
    "No. SIM": d.simNumber || '-',
    "Status": d.status || 'Aktif',
    "Created At": d.createdAt || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  worksheet['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 15 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Master Driver");

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Data_Master_Driver_${today}.xlsx`);
}

// ==================== MASTER PRICE ====================
let masterPrices = [];
let currentPriceClient = "";

async function initPricePage() {
  document.getElementById('priceViewClientList').classList.remove('hidden');
  document.getElementById('priceViewDetail').classList.add('hidden');
  
  const tbody = document.getElementById('priceClientTableBody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center p-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-lg mb-2 block"></i>Memuat Database Harga...</td></tr>';

  try {
    const { data, error } = await supabaseClient.from('master_prices').select('*').order('id', { ascending: false });
    if (error) throw error;
    masterPrices = data || [];
    renderPriceClientList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center p-6 text-red-400">Eror: ${err.message}</td></tr>`;
  }
}

function renderPriceClientList() {
  const query = (document.getElementById('priceClientSearch').value || '').toLowerCase();
  const tbody = document.getElementById('priceClientTableBody');
  
  let clients = masterClients.map(c => c.clientName).filter(name => name && name !== '-');
  if (clients.length === 0 && rawData.length > 0) {
    clients = [...new Set(rawData.map(o => o.clientName).filter(n => n && n !== '-'))];
  }
  
  clients = [...new Set(clients)].sort();
  const filteredClients = clients.filter(c => c.toLowerCase().includes(query));

  if (filteredClients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-400">Tidak ada client ditemukan.</td></tr>';
    return;
  }

  tbody.innerHTML = filteredClients.map((clientName, i) => {
    const routeCount = masterPrices.filter(p => p.client_name === clientName).length;
    return `
      <tr class="hover:bg-indigo-50/50 transition">
        <td class="p-3.5 text-center font-medium text-slate-500">${i + 1}.</td>
        <td class="p-3.5 font-extrabold text-slate-800">${clientName}</td>
        <td class="p-3.5 text-center">
          <span class="${routeCount > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'} px-2.5 py-1 rounded-full text-xs font-bold">
            ${routeCount} Rute Terdaftar
          </span>
        </td>
        <td class="p-3.5 text-center">
          <button onclick="openPriceDetail('${clientName.replace(/'/g, "\\'")}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow transition">
            <i class="fa-solid fa-list-check mr-1"></i> Kelola Harga
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openPriceDetail(clientName) {
  currentPriceClient = clientName;
  document.getElementById('priceDetailTitle').innerText = `Tarif Harga - ${clientName}`;
  document.getElementById('priceViewClientList').classList.add('hidden');
  document.getElementById('priceViewDetail').classList.remove('hidden');
  renderPriceDetailTable();
}

function closePriceDetail() {
  currentPriceClient = "";
  document.getElementById('priceViewDetail').classList.add('hidden');
  document.getElementById('priceViewClientList').classList.remove('hidden');
  renderPriceClientList();
}

function renderPriceDetailTable() {
  const tbody = document.getElementById('priceDetailTableBody');
  const clientPrices = masterPrices.filter(p => p.client_name === currentPriceClient);

  if (clientPrices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400 font-medium">Belum ada rute harga yang didaftarkan untuk client ini. Klik tombol + untuk menambah.</td></tr>';
    return;
  }

  tbody.innerHTML = clientPrices.map((p, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 text-center font-medium text-slate-500">${i + 1}.</td>
      <td class="p-3 font-bold text-slate-800">${p.origin}</td>
      <td class="p-3 font-bold text-slate-800">${p.destination}</td>
      <td class="p-3 text-center text-slate-600"><span class="bg-slate-100 px-2 py-1 rounded text-[10px] uppercase">${p.service}</span></td>
      <td class="p-3 text-right font-extrabold text-emerald-700">Rp ${Number(p.price).toLocaleString('id-ID')}</td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openModalEditPrice(${p.id})" title="Edit" class="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deletePrice(${p.id}, '${p.origin}', '${p.destination}')" title="Hapus" class="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-md text-xs transition shadow-sm">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openModalAddPrice() {
  document.getElementById('formPrice').reset();
  document.getElementById('priceIdInput').value = "";
  document.getElementById('priceClientInput').value = currentPriceClient;
  document.getElementById('modalPriceTitle').innerHTML = '<i class="fa-solid fa-tag mr-2"></i>Tambah Harga Baru';
  openModal('modalPrice');
}

function openModalEditPrice(id) {
  const p = masterPrices.find(item => item.id === id);
  if (!p) return;

  document.getElementById('priceIdInput').value = p.id;
  document.getElementById('priceClientInput').value = p.client_name;
  document.getElementById('priceOriginInput').value = p.origin;
  document.getElementById('priceDestInput').value = p.destination;
  document.getElementById('priceServiceInput').value = p.service;
  document.getElementById('priceAmountInput').value = p.price;

  document.getElementById('modalPriceTitle').innerHTML = `<i class="fa-solid fa-pen-to-square mr-2"></i>Edit Harga Rute`;
  openModal('modalPrice');
}

async function submitPriceForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSavePrice');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  const id = document.getElementById('priceIdInput').value;
  const dataObj = {
    client_name: document.getElementById('priceClientInput').value,
    origin: document.getElementById('priceOriginInput').value.toUpperCase(),
    destination: document.getElementById('priceDestInput').value.toUpperCase(),
    service: document.getElementById('priceServiceInput').value.toUpperCase() || '-',
    price: Number(document.getElementById('priceAmountInput').value) || 0
  };

  try {
    if (id) {
      const { error } = await supabaseClient.from('master_prices').update(dataObj).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from('master_prices').insert([dataObj]);
      if (error) throw error;
    }

    const { data: newData } = await supabaseClient.from('master_prices').select('*').order('id', { ascending: false });
    masterPrices = newData || [];
    
    closeModal('modalPrice');
    renderPriceDetailTable();
  } catch (err) {
    alert("Gagal menyimpan harga: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Harga`;
  }
}

async function deletePrice(id, origin, dest) {
  if (!confirm(`Hapus tarif rute ${origin} ke ${dest}?`)) return;

  try {
    const { error } = await supabaseClient.from('master_prices').delete().eq('id', id);
    if (error) throw error;
    
    masterPrices = masterPrices.filter(p => p.id !== id);
    renderPriceDetailTable();
  } catch (err) {
    alert("Gagal menghapus: " + err.message);
  }
}

function exportPriceToExcel() {
  if (!currentPriceClient) return;
  
  const clientPrices = masterPrices.filter(p => p.client_name === currentPriceClient);
  
  const excelRows = clientPrices.length > 0 ? clientPrices.map((p, index) => ({
    "No": index + 1,
    "Origin": p.origin || '',
    "Destination": p.destination || '',
    "Service": p.service || 'REGULER',
    "Harga": Number(p.price) || 0
  })) : [{ "No": 1, "Origin": "JAKARTA", "Destination": "SURABAYA", "Service": "REGULER", "Harga": 15000 }]; 

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  worksheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Master_Price");

  const safeName = currentPriceClient.replace(/[^a-zA-Z0-9]/g, '_');
  const today = new Date().toISOString().split('T')[0];
  
  XLSX.writeFile(workbook, `Tarif_${safeName}_${today}.xlsx`);
}

async function handleImportPriceExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!currentPriceClient) {
    alert("Client tidak valid.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json_data = XLSX.utils.sheet_to_json(worksheet);

      if (json_data.length === 0) {
        alert("File Excel kosong atau format tidak dikenali.");
        return;
      }

      const tbody = document.getElementById('priceDetailTableBody');
      tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-lg mb-2 block"></i>Mengimpor Data Rute...</td></tr>';

      const payload = [];
      
      json_data.forEach(row => {
        const origin = row['Origin'] || row['ORIGIN'] || row['Asal'] || row['origin'];
        const dest = row['Destination'] || row['DESTINATION'] || row['Tujuan'] || row['destination'];
        const service = row['Service'] || row['SERVICE'] || row['Layanan'] || 'REGULER';
        const price = row['Harga'] || row['HARGA'] || row['Harga (Rp)'] || row['Price'] || 0;

        if (origin && dest) {
          payload.push({
            client_name: currentPriceClient,
            origin: String(origin).trim().toUpperCase(),
            destination: String(dest).trim().toUpperCase(),
            service: String(service).trim().toUpperCase(),
            price: Number(price) || 0
          });
        }
      });

      if (payload.length === 0) {
        alert("Gagal membaca Excel. Pastikan terdapat kolom: 'Origin', 'Destination', dan 'Harga'.");
        renderPriceDetailTable();
        return;
      }

      const { error } = await supabaseClient.from('master_prices').insert(payload);
      if (error) throw error;

      const { data: newData, error: errFetch } = await supabaseClient.from('master_prices').select('*').order('id', { ascending: false });
      if (errFetch) throw errFetch;
      
      masterPrices = newData || [];
      
      alert(`Sukses! ${payload.length} tarif rute baru berhasil ditambahkan untuk ${currentPriceClient}.`);
      renderPriceDetailTable();

    } catch (err) {
      alert("Gagal mengimpor data: " + err.message);
      renderPriceDetailTable();
    } finally {
      event.target.value = "";
    }
  };
  
  reader.readAsArrayBuffer(file);
}

// ==================== MASTER PRICE VENDOR ====================
let vendorPrices = [];
let currentPriceVendor = "";

async function initVendorPricePage() {
  document.getElementById('vpViewVendorList').classList.remove('hidden');
  document.getElementById('vpViewDetail').classList.add('hidden');
  
  const tbody = document.getElementById('vpVendorTableBody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center p-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-lg mb-2 block"></i>Memuat Database Harga Vendor...</td></tr>';

  try {
    const { data, error } = await supabaseClient.from('vendor_prices').select('*').order('id', { ascending: false });
    if (error) throw error;
    vendorPrices = data || [];
    renderVendorPriceList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center p-6 text-red-400">Eror: ${err.message}</td></tr>`;
  }
}

function renderVendorPriceList() {
  const query = (document.getElementById('vpSearchInput').value || '').toLowerCase();
  const tbody = document.getElementById('vpVendorTableBody');
  
  // Ambil list dari tabel Master Vendors
  let vendors = masterVendors.map(v => v.vendorName).filter(name => name && name !== '-');
  
  // Sort & Filter
  vendors = [...new Set(vendors)].sort();
  const filteredVendors = vendors.filter(v => v.toLowerCase().includes(query));

  if (filteredVendors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-400">Tidak ada vendor ditemukan. (Pastikan Anda sudah mengisi Master Vendor)</td></tr>';
    return;
  }

  tbody.innerHTML = filteredVendors.map((vendorName, i) => {
    const routeCount = vendorPrices.filter(p => p.vendor_name === vendorName).length;
    return `
      <tr class="hover:bg-teal-50/50 transition">
        <td class="p-3.5 text-center font-medium text-slate-500">${i + 1}.</td>
        <td class="p-3.5 font-extrabold text-slate-800">${vendorName}</td>
        <td class="p-3.5 text-center">
          <span class="${routeCount > 0 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'} px-2.5 py-1 rounded-full text-xs font-bold">
            ${routeCount} Rute Terdaftar
          </span>
        </td>
        <td class="p-3.5 text-center">
          <button onclick="openVendorPriceDetail('${vendorName.replace(/'/g, "\\'")}')" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow transition">
            <i class="fa-solid fa-list-check mr-1"></i> Kelola Harga Modal
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openVendorPriceDetail(vendorName) {
  currentPriceVendor = vendorName;
  document.getElementById('vpDetailTitle').innerText = `Harga Modal - ${vendorName}`;
  document.getElementById('vpViewVendorList').classList.add('hidden');
  document.getElementById('vpViewDetail').classList.remove('hidden');
  renderVendorPriceDetailTable();
}

function closeVendorPriceDetail() {
  currentPriceVendor = "";
  document.getElementById('vpViewDetail').classList.add('hidden');
  document.getElementById('vpViewVendorList').classList.remove('hidden');
  renderVendorPriceList();
}

function renderVendorPriceDetailTable() {
  const tbody = document.getElementById('vpDetailTableBody');
  const vPrices = vendorPrices.filter(p => p.vendor_name === currentPriceVendor);

  if (vPrices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400 font-medium">Belum ada rute harga modal untuk vendor ini. Klik tombol Import atau +</td></tr>';
    return;
  }

  tbody.innerHTML = vPrices.map((p, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 text-center font-medium text-slate-500">${i + 1}.</td>
      <td class="p-3 font-bold text-slate-800">${p.origin}</td>
      <td class="p-3 font-bold text-slate-800">${p.destination}</td>
      <td class="p-3 text-center text-slate-600"><span class="bg-slate-100 px-2 py-1 rounded text-[10px] uppercase">${p.service}</span></td>
      <td class="p-3 text-right font-extrabold text-rose-700">Rp ${Number(p.price).toLocaleString('id-ID')}</td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openModalEditVp(${p.id})" title="Edit" class="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded-md text-xs transition shadow-sm"><i class="fa-solid fa-pen-to-square"></i></button>
          <button onclick="deleteVp(${p.id}, '${p.origin}', '${p.destination}')" title="Hapus" class="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-md text-xs transition shadow-sm"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openModalAddVp() {
  document.getElementById('formVp').reset();
  document.getElementById('vpIdInput').value = "";
  document.getElementById('vpVendorInput').value = currentPriceVendor;
  document.getElementById('modalVpTitle').innerHTML = '<i class="fa-solid fa-tag mr-2"></i>Tambah Harga Modal';
  openModal('modalVp');
}

function openModalEditVp(id) {
  const p = vendorPrices.find(item => item.id === id);
  if (!p) return;
  document.getElementById('vpIdInput').value = p.id;
  document.getElementById('vpVendorInput').value = p.vendor_name;
  document.getElementById('vpOriginInput').value = p.origin;
  document.getElementById('vpDestInput').value = p.destination;
  document.getElementById('vpServiceInput').value = p.service;
  document.getElementById('vpAmountInput').value = p.price;
  document.getElementById('modalVpTitle').innerHTML = `<i class="fa-solid fa-pen-to-square mr-2"></i>Edit Harga Modal`;
  openModal('modalVp');
}

async function submitVpForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveVp');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  const id = document.getElementById('vpIdInput').value;
  const dataObj = {
    vendor_name: document.getElementById('vpVendorInput').value,
    origin: document.getElementById('vpOriginInput').value.toUpperCase(),
    destination: document.getElementById('vpDestInput').value.toUpperCase(),
    service: document.getElementById('vpServiceInput').value.toUpperCase() || '-',
    price: Number(document.getElementById('vpAmountInput').value) || 0
  };

  try {
    if (id) {
      const { error } = await supabaseClient.from('vendor_prices').update(dataObj).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from('vendor_prices').insert([dataObj]);
      if (error) throw error;
    }
    const { data: newData } = await supabaseClient.from('vendor_prices').select('*').order('id', { ascending: false });
    vendorPrices = newData || [];
    closeModal('modalVp');
    renderVendorPriceDetailTable();
  } catch (err) {
    alert("Gagal menyimpan harga: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Simpan Harga`;
  }
}

async function deleteVp(id, origin, dest) {
  if (!confirm(`Hapus harga modal rute ${origin} ke ${dest}?`)) return;
  try {
    const { error } = await supabaseClient.from('vendor_prices').delete().eq('id', id);
    if (error) throw error;
    vendorPrices = vendorPrices.filter(p => p.id !== id);
    renderVendorPriceDetailTable();
  } catch (err) {
    alert("Gagal menghapus: " + err.message);
  }
}

function exportVpToExcel() {
  if (!currentPriceVendor) return;
  const vPrices = vendorPrices.filter(p => p.vendor_name === currentPriceVendor);
  
  const excelRows = vPrices.length > 0 ? vPrices.map((p, index) => ({
    "No": index + 1,
    "Origin": p.origin || '',
    "Destination": p.destination || '',
    "Service": p.service || 'REGULER',
    "Harga_Modal": Number(p.price) || 0
  })) : [{ "No": 1, "Origin": "JAKARTA", "Destination": "SURABAYA", "Service": "REGULER", "Harga_Modal": 12000 }]; 

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  worksheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Harga_Modal_Vendor");

  const safeName = currentPriceVendor.replace(/[^a-zA-Z0-9]/g, '_');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `HargaModal_${safeName}_${today}.xlsx`);
}

async function handleImportVpExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!currentPriceVendor) {
    alert("Vendor tidak valid.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json_data = XLSX.utils.sheet_to_json(worksheet);

      if (json_data.length === 0) { alert("File Excel kosong."); return; }

      const tbody = document.getElementById('vpDetailTableBody');
      tbody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-lg mb-2 block"></i>Mengimpor Harga Modal...</td></tr>';

      const payload = [];
      json_data.forEach(row => {
        const origin = row['Origin'] || row['ORIGIN'] || row['Asal'];
        const dest = row['Destination'] || row['DESTINATION'] || row['Tujuan'];
        const service = row['Service'] || row['SERVICE'] || 'REGULER';
        const price = row['Harga_Modal'] || row['Harga Modal'] || row['Harga'] || row['Price'] || 0;

        if (origin && dest) {
          payload.push({
            vendor_name: currentPriceVendor,
            origin: String(origin).trim().toUpperCase(),
            destination: String(dest).trim().toUpperCase(),
            service: String(service).trim().toUpperCase(),
            price: Number(price) || 0
          });
        }
      });

      if (payload.length === 0) {
        alert("Gagal membaca Excel. Pastikan terdapat kolom: 'Origin', 'Destination', dan 'Harga_Modal'.");
        renderVendorPriceDetailTable();
        return;
      }

      const { error } = await supabaseClient.from('vendor_prices').insert(payload);
      if (error) throw error;

      const { data: newData } = await supabaseClient.from('vendor_prices').select('*').order('id', { ascending: false });
      vendorPrices = newData || [];
      
      alert(`Sukses! ${payload.length} harga modal ditambahkan untuk ${currentPriceVendor}.`);
      renderVendorPriceDetailTable();
    } catch (err) {
      alert("Gagal mengimpor: " + err.message);
      renderVendorPriceDetailTable();
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsArrayBuffer(file);
}
