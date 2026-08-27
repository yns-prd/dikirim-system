function renderPublishInvoiceTable() {
  const query = (document.getElementById('pubSearchInput')?.value || '').toLowerCase();
  const publishedList = groupedInvoices.filter(inv => inv.invoiceStatus === 'PUBLISHED');
  const filtered = publishedList.filter(inv => (inv.invoiceNumber || '').toLowerCase().includes(query) || (inv.clientName || '').toLowerCase().includes(query));

  const tbody = document.getElementById('publishInvoiceTableBody');
  if (!filtered || filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-6 text-slate-400">Tidak ada data Publish Invoice.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((inv, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 font-medium text-slate-500">${i + 1}.</td>
      <td class="p-3 font-bold text-blue-900">${inv.invoiceNumber}</td>
      <td class="p-3 text-slate-600">${inv.invoiceDate || '-'}</td>
      <td class="p-3 font-semibold">${inv.clientName}</td>
      <td class="p-3 text-center"><span class="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full text-xs font-bold">${inv.totalOrder} Order</span></td>
      <td class="p-3 text-right font-extrabold text-blue-900">Rp ${Number(inv.totalCharge).toLocaleString('id-ID')}</td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openGroupedInvoiceDetail('${inv.invoiceNumber}')" title="Cetak / View PDF" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1">
            <i class="fa-solid fa-print"></i> Cetak / View
          </button>
          <button onclick="handleUnpublishAction('${inv.invoiceNumber}')" title="Kembalikan ke Proforma Draf" class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1">
            <i class="fa-solid fa-rotate-left"></i> Unpublish
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderProformaInvoiceTable() {
  const query = (document.getElementById('profSearchInput')?.value || '').toLowerCase();
  const proformaList = groupedInvoices.filter(inv => inv.invoiceStatus === 'PROFORMA');
  const filtered = proformaList.filter(inv => (inv.invoiceNumber || '').toLowerCase().includes(query) || (inv.clientName || '').toLowerCase().includes(query));

  const tbody = document.getElementById('proformaInvoiceTableBody');
  if (!filtered || filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-6 text-slate-400 font-medium">Tidak ada Draf Proforma Invoice.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((inv, i) => `
    <tr class="hover:bg-amber-50/50 transition">
      <td class="p-3 font-medium text-slate-500">${i + 1}.</td>
      <td class="p-3 font-bold text-amber-700">${inv.invoiceNumber} <span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]">DRAF</span></td>
      <td class="p-3 text-slate-600">${inv.invoiceDate || '-'}</td>
      <td class="p-3 font-semibold">${inv.clientName}</td>
      <td class="p-3 text-center"><span class="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs font-bold">${inv.totalOrder} Order</span></td>
      <td class="p-3 text-right font-extrabold text-slate-800">Rp ${Number(inv.totalCharge).toLocaleString('id-ID')}</td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openGroupedInvoiceDetail('${inv.invoiceNumber}')" title="Pratinjau" class="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg text-xs">
            <i class="fa-solid fa-print"></i>
          </button>
          <button onclick="openEditProformaModal('${inv.invoiceNumber}')" title="Edit Isi Proforma Invoice" class="bg-amber-500 hover:bg-amber-600 text-slate-900 p-1.5 rounded-lg text-xs font-bold">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="handlePublishAction('${inv.invoiceNumber}')" title="Publish Menjadi Invoice Resmi" class="bg-blue-900 hover:bg-slate-900 text-white p-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <i class="fa-solid fa-upload"></i> Publish
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function handlePublishAction(invNumber) {
  if (!confirm(`Apakah Anda yakin ingin mempublikasikan Proforma Invoice ${invNumber} menjadi Invoice Resmi?`)) return;

  apiPost('publishInvoice', { invNumber: invNumber })
    .then(res => {
      if (res.status === 'success') {
        alert(res.message);
        loadData();
        switchPage('publishInvoicePage');
      } else {
        alert('Gagal Publish: ' + res.message);
      }
    })
    .catch(err => alert('Eror: ' + err));
}

function handleUnpublishAction(invNumber) {
  if (!confirm(`Apakah Anda yakin ingin mengembalikan Invoice ${invNumber} menjadi Proforma Draf?\n\nInvoice ini akan dapat diedit kembali.`)) {
    return;
  }

  apiPost('unpublishInvoice', { invNumber: invNumber })
    .then(res => {
      if (res.status === 'success') {
        alert(res.message);
        loadData();
        switchPage('proformaInvoicePage');
      } else {
        alert('Gagal Unpublish: ' + res.message);
      }
    })
    .catch(err => alert('Eror: ' + err));
}

function openEditProformaModal(invNumber) {
  const invObj = groupedInvoices.find(i => i.invoiceNumber === invNumber);
  if (!invObj) return;

  document.getElementById('editProfInvNumber').value = invNumber;
  document.getElementById('editProfTitle').innerText = `Edit Proforma Invoice - ${invNumber}`;
  document.getElementById('editProfClientName').value = invObj.clientName;
  document.getElementById('editProfDate').value = invObj.invoiceDate || '';
  document.getElementById('editProfOrderType').value = invObj.orderType || 'JASA PENGURUSAN TRANSPORTASI - ETA TRUCKING';
  document.getElementById('editProfVat').value = invObj.vatRate !== undefined ? invObj.vatRate : '0';
  document.getElementById('editProfDiscount').value = invObj.discount || 0;

  renderEditProformaOrders(invObj);
  openModal('modalEditProforma');
}

function renderEditProformaOrders(invObj) {
  const tbody = document.getElementById('editProfOrdersTableBody');
  const clientName = invObj.clientName;

  const candidateOrders = rawData.filter(d => {
    const cName = String(d.clientName || '').trim().toLowerCase();
    const invNum = String(d.invoiceNumber || '').trim();
    const isInThisInv = (invNum === invObj.invoiceNumber);
    const isUninvoiced = (!invNum || invNum === '-' || invNum === '' || invNum === 'INVOICE NUMBER');
    return cName === clientName.toLowerCase() && (isInThisInv || isUninvoiced);
  });

  if (candidateOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-6 text-slate-400">Tidak ada order kiriman ditemukan untuk client ini.</td></tr>';
    updateEditProfSummary();
    return;
  }

  tbody.innerHTML = candidateOrders.map(ord => {
    const isChecked = (ord.invoiceNumber === invObj.invoiceNumber);
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-2.5 text-center">
          <input type="checkbox" value="${ord.rowIndex}" data-charge="${ord.charge}" ${isChecked ? 'checked' : ''} onchange="updateEditProfSummary()" class="chkEditProfRow w-4 h-4 rounded text-amber-600 cursor-pointer">
        </td>
        <td class="p-2.5 font-bold text-amber-700">${ord.awbNumber}<div class="text-xs text-slate-400 font-normal">DO: ${ord.doCustomer}</div></td>
        <td class="p-2.5 text-slate-600">${ord.orderDate}</td>
        <td class="p-2.5 font-medium">${ord.consigneeName}</td>
        <td class="p-2.5 text-slate-600">${ord.origin} → ${ord.destination}</td>
        <td class="p-2.5 text-right font-extrabold text-slate-800">Rp ${Number(ord.charge).toLocaleString('id-ID')}</td>
      </tr>
    `;
  }).join('');

  updateEditProfSummary();
}

function updateEditProfSummary() {
  const checkedRows = document.querySelectorAll('.chkEditProfRow:checked');
  let total = 0;
  checkedRows.forEach(chk => total += Number(chk.getAttribute('data-charge')) || 0);

  document.getElementById('editProfSummaryText').innerText = `${checkedRows.length} Order Dipilih (Total Tagihan: Rp ${total.toLocaleString('id-ID')})`;
}

function saveProformaEdit() {
  const checkedRows = document.querySelectorAll('.chkEditProfRow:checked');
  if (checkedRows.length === 0) {
    alert("Silakan pilih minimal 1 order yang tetap berada dalam Proforma Invoice ini!");
    return;
  }

  const rowIndices = Array.from(checkedRows).map(chk => chk.value);
  const invNumber = document.getElementById('editProfInvNumber').value;
  const invDate = document.getElementById('editProfDate').value;
  const orderType = document.getElementById('editProfOrderType').value;
  const vatRate = document.getElementById('editProfVat').value;
  const discountVal = document.getElementById('editProfDiscount').value;

  const btn = document.getElementById('btnSaveEditProf');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  apiPost('updateInvoice', {
    invNumber: invNumber,
    rowIndices: rowIndices,
    invDate: invDate,
    orderType: orderType,
    vatRate: vatRate,
    discount: discountVal
  })
  .then(res => {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Proforma`;

    if (res.status === 'success') {
      alert(res.message);
      closeModal('modalEditProforma');
      loadData();
    } else {
      alert("Gagal memperbarui: " + res.message);
    }
  })
  .catch(err => {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Proforma`;
    alert("Eror: " + err.message);
  });
}

function initCreateInvoicePage() {
  if (!rawData || rawData.length === 0) return;

  const clientSet = new Set();
  rawData.forEach(d => {
    if (d.clientName && String(d.clientName).trim() !== '' && d.clientName !== 'Unknown Client' && d.clientName !== '-') {
      clientSet.add(String(d.clientName).trim());
    }
  });

  const clientSelect = document.getElementById('newInvClientSelect');
  const clientArray = Array.from(clientSet).sort();
  
  if (clientArray.length > 0) {
    clientSelect.innerHTML = clientArray.map(c => `<option value="${c}">${c}</option>`).join('');
  } else {
    clientSelect.innerHTML = '<option value="">- Tidak ada client -</option>';
  }

  const today = new Date();
  const yr = String(today.getFullYear()).slice(-2);
  const mo = String(today.getMonth() + 1).padStart(2, '0');
  const randomNo = String(Math.floor(1000 + Math.random() * 9000));

  document.getElementById('newInvNumberInput').value = `INV-${randomNo}${yr}${mo}`;
  document.getElementById('newInvDateInput').value = today.toLocaleDateString('id-ID');
  document.getElementById('newInvDaysInput').value = "30";

  calculateDueDateFromDays();
  renderUninvoicedOrdersForClient();
}

function calculateDueDateFromDays() {
  const dateStr = document.getElementById('newInvDateInput').value;
  const days = parseInt(document.getElementById('newInvDaysInput').value) || 0;

  let baseDate = new Date();
  if (dateStr && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      baseDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }

  baseDate.setDate(baseDate.getDate() + days);

  const formattedDueDate = baseDate.toLocaleDateString('id-ID');
  const previewEl = document.getElementById('dueDatePreviewText');
  if (previewEl) previewEl.innerText = `Due Date: ${formattedDueDate}`;
  return formattedDueDate;
}

function renderUninvoicedOrdersForClient() {
  const clientSelect = document.getElementById('newInvClientSelect');
  if (!clientSelect || !clientSelect.value) return;

  const selectedClient = String(clientSelect.value).trim().toLowerCase();
  const tbody = document.getElementById('uninvoicedOrdersTableBody');

  const pendingOrders = rawData.filter(d => {
    const cName = String(d.clientName || '').trim().toLowerCase();
    const invNum = String(d.invoiceNumber || '').trim();
    const isUninvoiced = !invNum || invNum === '-' || invNum === '' || invNum === 'INVOICE NUMBER';
    return cName === selectedClient && isUninvoiced;
  });

  if (pendingOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-6 text-slate-400 font-medium">Semua order milik Client ini sudah terbit Invoice (0 Order Uninvoiced).</td></tr>';
    updateSelectedSummary();
    return;
  }

  tbody.innerHTML = pendingOrders.map(ord => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 text-center">
        <input type="checkbox" value="${ord.rowIndex}" data-charge="${ord.charge}" onchange="updateSelectedSummary()" class="chkOrderRow w-4 h-4 rounded text-blue-900 cursor-pointer">
      </td>
      <td class="p-3 font-bold text-blue-900">${ord.awbNumber}<div class="text-xs text-slate-400 font-normal">DO: ${ord.doCustomer}</div></td>
      <td class="p-3 text-slate-600">${ord.orderDate}</td>
      <td class="p-3 font-medium">${ord.consigneeName}</td>
      <td class="p-3 text-slate-600">${ord.origin} → ${ord.destination}</td>
      <td class="p-3 text-right font-extrabold text-blue-900">Rp ${Number(ord.charge).toLocaleString('id-ID')}</td>
    </tr>
  `).join('');

  document.getElementById('checkAllOrders').checked = false;
  updateSelectedSummary();
}

function toggleSelectAllUninvoiced(mainChk) {
  const checkboxes = document.querySelectorAll('.chkOrderRow');
  checkboxes.forEach(chk => chk.checked = mainChk.checked);
  updateSelectedSummary();
}

function updateSelectedSummary() {
  const checkedRows = document.querySelectorAll('.chkOrderRow:checked');
  let total = 0;
  checkedRows.forEach(chk => total += Number(chk.getAttribute('data-charge')) || 0);

  document.getElementById('selectedCountText').innerText = `${checkedRows.length} Order Dipilih (Total: Rp ${total.toLocaleString('id-ID')})`;
}

function submitNewInvoice() {
  const checkedRows = document.querySelectorAll('.chkOrderRow:checked');
  if (checkedRows.length === 0) {
    alert("Silakan pilih minimal 1 order yang akan dimasukkan ke Proforma Invoice!");
    return;
  }

  const rowIndices = Array.from(checkedRows).map(chk => chk.value);
  const invNumber = document.getElementById('newInvNumberInput').value;
  const invDate = document.getElementById('newInvDateInput').value;
  const orderType = document.getElementById('newInvOrderTypeSelect').value;
  const dueDateCalculated = calculateDueDateFromDays();
  const vatRate = document.getElementById('newInvVatSelect').value;
  const discountVal = document.getElementById('newInvDiscountInput').value;

  const btn = document.getElementById('btnSubmitInv');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;

  apiPost('createInvoice', {
    rowIndices: rowIndices,
    invNumber: invNumber,
    invDate: invDate,
    orderType: orderType,
    dueDate: dueDateCalculated,
    vatRate: vatRate,
    discount: discountVal
  })
  .then(res => {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Ke Proforma Invoice`;

    if (res.status === 'success') {
      alert(res.message);
      loadData();
      switchPage('proformaInvoicePage');
    } else {
      alert("Gagal: " + res.message);
    }
  })
  .catch(err => {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Ke Proforma Invoice`;
    alert("Eror: " + err.message);
  });
}

function openGroupedInvoiceDetail(invNumber) {
  const invObj = groupedInvoices.find(i => i.invoiceNumber === invNumber);

  const passOrderType = invObj ? invObj.orderType : "";
  const passDueDate = invObj ? invObj.dueDate : "";
  const passVatRate = invObj ? invObj.vatRate : 0;
  const passDiscount = invObj ? invObj.discount : 0;

  const newTab = window.open('', '_blank');
  if (newTab) {
    newTab.document.write(`
      <html lang="id">
      <head><title>Memuat Invoice ${invNumber}...</title></head>
      <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155;">
        <div style="text-align: center;">
          <div style="font-size: 32px; color: #1e3a8a; margin-bottom: 12px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
          <h2 style="margin-bottom: 6px; font-size: 18px; color: #0f172a;">Menyiapkan PDF Invoice ${invNumber}...</h2>
          <p style="color: #64748b; font-size: 13px;">Mengisi template & membuka dokumen PDF resmi...</p>
        </div>
      </body>
      </html>
    `);
  }

  apiPost('generateInvoicePdf', {
    invNumber: invNumber,
    orderType: passOrderType,
    dueDate: passDueDate,
    vatRate: passVatRate,
    discount: passDiscount
  })
  .then(res => {
    if (res.status === 'success' && res.pdfViewUrl) {
      if (newTab) {
        newTab.location.href = res.pdfViewUrl;
      } else {
        window.open(res.pdfViewUrl, '_blank');
      }
    } else {
      if (newTab) newTab.close();
      alert('Gagal memuat invoice: ' + (res ? res.message : 'Error'));
    }
  })
  .catch(err => {
    if (newTab) newTab.close();
    alert('Eror: ' + (err ? err.message : err));
  });
}
