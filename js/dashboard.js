async function loadData() {
  try {
    let allOrders = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('id', { ascending: false })
        .range(from, from + step - 1);

      if (error) throw error;

      allOrders = allOrders.concat(data || []);

      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    rawData = allOrders.map(o => ({
      rowIndex: o.row_index || o.id,
      doCustomer: o.do_customer,
      awbNumber: o.awb_number,
      orderDate: o.order_date,
      clientName: o.client_name,
      consigneeName: o.consignee_name,
      consigneeAddress: o.consignee_address,
      origin: o.origin,
      destination: o.destination,
      service: o.service,
      weight: o.weight,
      coly: o.coly,
      charge: o.charge,
      trackTrace: o.track_trace,
      receiverName: o.receiver_name,
      vendorBy: o.vendor_by,
      invoiceNumber: o.invoice_number
    }));

    summaryData = buildSummaryFromRawData(rawData);

    onDataLoaded({ status: "success", data: rawData, summary: summaryData });
  } catch (err) {
    alert("Eror Load Supabase: " + err.message);
  }
}

function onDataLoaded(response) {
  rawData = response.data || [];
  groupedInvoices = response.groupedInvoices || [];
  summaryData = response.summary || { monthly: {}, yearly: {}, chartTrends: {} };

  updateKPIs(rawData);
  initDashboardDropdowns();
  filterTable();
  renderPublishInvoiceTable();
  renderProformaInvoiceTable();
  initCreateInvoicePage();
}

function buildSummaryFromRawData(dataList) {
  const monthly = {};
  const yearly = {};
  const chartTrends = {};

  dataList.forEach(item => {
    const dateStr = String(item.orderDate || '').trim();
    if (!dateStr || dateStr === '-' || dateStr.toLowerCase().includes('invalid')) return;

    let yearStr = "", monthIdx = -1, periodKey = "";

    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        if (parts[0].length === 4) { 
          yearStr = parts[0];
          monthIdx = parseInt(parts[1], 10) - 1;
          periodKey = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        } else { 
          let yr = parts[2] ? parts[2].trim() : "2026";
          if (yr.length === 2) yr = "20" + yr;
          yearStr = yr;
          monthIdx = parseInt(parts[1], 10) - 1;
          periodKey = `${yr}-${parts[1].padStart(2, '0')}`;
        }
      }
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        let p1 = parseInt(parts[0], 10);
        let p2 = parseInt(parts[1], 10);
        let p3 = parts[2].trim();
        if (p3.length === 2) p3 = "20" + p3;

        if (p1 > 12) {
          yearStr = p3;
          monthIdx = p2 - 1;
          periodKey = `${p3}-${String(p2).padStart(2, '0')}`;
        } else {
          yearStr = p3;
          monthIdx = p2 - 1;
          periodKey = `${p3}-${String(p2).padStart(2, '0')}`;
        }
      }
    }

    if (!yearStr || monthIdx < 0 || monthIdx > 11) return;

    const client = (item.clientName && item.clientName !== '-') ? item.clientName.trim() : "Unknown Client";
    const chargeVal = Number(item.charge) || 0;

    if (!monthly[periodKey]) {
      monthly[periodKey] = { totalCharge: 0, totalOrder: 0, clients: {} };
    }
    monthly[periodKey].totalCharge += chargeVal;
    monthly[periodKey].totalOrder += 1;

    if (!monthly[periodKey].clients[client]) {
      monthly[periodKey].clients[client] = { charge: 0, order: 0 };
    }
    monthly[periodKey].clients[client].charge += chargeVal;
    monthly[periodKey].clients[client].order += 1;

    if (!yearly[yearStr]) {
      yearly[yearStr] = { totalCharge: 0, totalOrder: 0, clients: {} };
    }
    yearly[yearStr].totalCharge += chargeVal;
    yearly[yearStr].totalOrder += 1;

    if (!yearly[yearStr].clients[client]) {
      yearly[yearStr].clients[client] = { charge: 0, order: 0 };
    }
    yearly[yearStr].clients[client].charge += chargeVal;
    yearly[yearStr].clients[client].order += 1;

    if (!chartTrends[yearStr]) {
      chartTrends[yearStr] = {
        totalCharge: Array(12).fill(0),
        totalOrder: Array(12).fill(0),
        clientsCharge: {},
        clientsOrder: {}
      };
    }

    chartTrends[yearStr].totalCharge[monthIdx] += chargeVal;
    chartTrends[yearStr].totalOrder[monthIdx] += 1;

    if (!chartTrends[yearStr].clientsCharge[client]) {
      chartTrends[yearStr].clientsCharge[client] = Array(12).fill(0);
      chartTrends[yearStr].clientsOrder[client] = Array(12).fill(0);
    }
    chartTrends[yearStr].clientsCharge[client][monthIdx] += chargeVal;
    chartTrends[yearStr].clientsOrder[client][monthIdx] += 1;
  });

  return { monthly: monthly, yearly: yearly, chartTrends: chartTrends };
}

function renderTrendChart() {
  const yearSelect = document.getElementById('chartYearSelect');
  if (!yearSelect) return;
  
  const selectedYear = yearSelect.value;
  const metric = document.getElementById('chartMetricSelect').value;

  if (!summaryData.chartTrends || !summaryData.chartTrends[selectedYear]) return;

  const yearData = summaryData.chartTrends[selectedYear];
  const datasets = [];

  const totalData = metric === 'charge' ? yearData.totalCharge : yearData.totalOrder;
  datasets.push({
    label: 'TOTAL SELURUH CLIENT',
    data: totalData,
    borderColor: '#1e3a8a',
    backgroundColor: 'rgba(30, 58, 138, 0.05)',
    borderWidth: 3,
    borderDash: [5, 5],
    tension: 0.3,
    fill: true
  });

  const clientsMap = metric === 'charge' ? yearData.clientsCharge : yearData.clientsOrder;
  let colorIndex = 0;

  for (const [client, valArray] of Object.entries(clientsMap)) {
    const color = chartColors[colorIndex % chartColors.length];
    datasets.push({
      label: client,
      data: valArray,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      tension: 0.3,
      fill: false
    });
    colorIndex++;
  }

  const canvasEl = document.getElementById('trendChartCanvas');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  if (myTrendChart) myTrendChart.destroy();

  myTrendChart = new Chart(ctx, {
    type: 'line',
    data: { labels: monthNames, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function initDashboardDropdowns() {
  const monthlySelect = document.getElementById('monthlyPeriodSelect');
  const monthKeys = Object.keys(summaryData.monthly || {}).sort().reverse();
  monthlySelect.innerHTML = monthKeys.length > 0 ? monthKeys.map(k => `<option value="${k}">Periode Bulan: ${k}</option>`).join('') : '<option value="">- Tidak ada data -</option>';

  const yearlySelect = document.getElementById('yearlyPeriodSelect');
  const yearKeys = Object.keys(summaryData.yearly || {}).sort().reverse();
  yearlySelect.innerHTML = yearKeys.length > 0 ? yearKeys.map(k => `<option value="${k}">Tahun: ${k}</option>`).join('') : '<option value="">- Tidak ada data -</option>';

  const chartYearSelect = document.getElementById('chartYearSelect');
  const trendYears = Object.keys(summaryData.chartTrends || {}).sort().reverse();
  chartYearSelect.innerHTML = trendYears.length > 0 ? trendYears.map(k => `<option value="${k}">Tahun Grafik: ${k}</option>`).join('') : '<option value="2026">Tahun Grafik: 2026</option>';

  if (monthKeys.length > 0) renderMonthlySummary();
  if (yearKeys.length > 0) renderYearlySummary();
  renderTrendChart();
}

function renderMonthlySummary() {
  const period = document.getElementById('monthlyPeriodSelect').value;
  const tbody = document.getElementById('monthlyTableBody');
  const tfoot = document.getElementById('monthlyTableFoot');

  if (!period || !summaryData.monthly || !summaryData.monthly[period]) { 
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-slate-400">Tidak ada data.</td></tr>'; 
    tfoot.innerHTML = ''; 
    return; 
  }

  const data = summaryData.monthly[period];
  const totalCharge = data.totalCharge;
  const totalOrder = data.totalOrder;

  let rowsHtml = '';
  for (const [client, info] of Object.entries(data.clients)) {
    const pct = totalCharge > 0 ? ((info.charge / totalCharge) * 100).toFixed(1) : 0;
    rowsHtml += `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-semibold text-slate-800">${client}</td>
        <td class="p-3 text-center font-medium">${info.order.toLocaleString('id-ID')} order</td>
        <td class="p-3 text-right font-bold text-slate-700">Rp ${info.charge.toLocaleString('id-ID')}</td>
        <td class="p-3 text-center"><span class="bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-full text-xs">${pct}%</span></td>
      </tr>
    `;
  }
  tbody.innerHTML = rowsHtml;
  tfoot.innerHTML = `<tr><td class="p-3">TOTAL BULAN INI (${period})</td><td class="p-3 text-center">${totalOrder.toLocaleString('id-ID')} Order</td><td class="p-3 text-right text-blue-950 font-extrabold">Rp ${totalCharge.toLocaleString('id-ID')}</td><td class="p-3 text-center">100%</td></tr>`;
}

function renderYearlySummary() {
  const year = document.getElementById('yearlyPeriodSelect').value;
  const tbody = document.getElementById('yearlyTableBody');
  const tfoot = document.getElementById('yearlyTableFoot');

  if (!year || !summaryData.yearly || !summaryData.yearly[year]) { 
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-slate-400">Tidak ada data.</td></tr>'; 
    tfoot.innerHTML = ''; 
    return; 
  }

  const data = summaryData.yearly[year];
  const totalCharge = data.totalCharge;
  const totalOrder = data.totalOrder;

  let rowsHtml = '';
  for (const [client, info] of Object.entries(data.clients)) {
    const pct = totalCharge > 0 ? ((info.charge / totalCharge) * 100).toFixed(1) : 0;
    rowsHtml += `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-semibold text-slate-800">${client}</td>
        <td class="p-3 text-center font-medium">${info.order.toLocaleString('id-ID')} order</td>
        <td class="p-3 text-right font-bold text-slate-700">Rp ${info.charge.toLocaleString('id-ID')}</td>
        <td class="p-3 text-center"><span class="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full text-xs">${pct}%</span></td>
      </tr>
    `;
  }
  tbody.innerHTML = rowsHtml;
  tfoot.innerHTML = `<tr><td class="p-3">TOTAL TAHUNAN (${year})</td><td class="p-3 text-center">${totalOrder.toLocaleString('id-ID')} Order</td><td class="p-3 text-right text-blue-950 font-extrabold">Rp ${totalCharge.toLocaleString('id-ID')}</td><td class="p-3 text-center">100%</td></tr>`;
}

function filterTable() {
  const query = (document.getElementById('searchInput').value || '').toLowerCase();
  filteredData = rawData.filter(item => 
    (item.awbNumber || '').toLowerCase().includes(query) || 
    (item.clientName || '').toLowerCase().includes(query) || 
    (item.doCustomer || '').toLowerCase().includes(query)
  );
  currentPage = 1;
  renderPaginatedTable();
}

function renderPaginatedTable() {
  const pageSize = parseInt(document.getElementById('pageSizeSelect').value) || 10;
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pageData = filteredData.slice(startIndex, startIndex + pageSize);

  renderTable(pageData);
  
  // Update Teks Info
  document.getElementById('paginationInfo').innerText = `Menampilkan ${totalItems > 0 ? startIndex + 1 : 0} - ${Math.min(startIndex + pageSize, totalItems)} dari ${totalItems} order`;
  
  // Render Tombol Halaman 1, 2, 3 dst
  renderPaginationButtons(totalPages);
}

function changePage(page) {
  const pageSize = parseInt(document.getElementById('pageSizeSelect').value) || 10;
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderPaginatedTable();
}

function renderPaginationButtons(totalPages) {
  const container = document.getElementById('paginationButtons');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Tombol Previous
  html += `
    <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled class="opacity-40 cursor-not-allowed px-2.5 py-1 rounded bg-slate-200 text-slate-500 font-bold text-xs"' : 'class="px-2.5 py-1 rounded bg-slate-200 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-xs transition"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  // Logika Angka Halaman (Smart Windowing)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<button onclick="changePage(1)" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-xs transition">1</button>`;
    if (startPage > 2) html += `<span class="px-1 text-slate-400 font-bold">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<button class="px-2.5 py-1 rounded bg-blue-900 text-white font-extrabold text-xs shadow-sm">${i}</button>`;
    } else {
      html += `<button onclick="changePage(${i})" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-xs transition">${i}</button>`;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="px-1 text-slate-400 font-bold">...</span>`;
    html += `<button onclick="changePage(${totalPages})" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-xs transition">${totalPages}</button>`;
  }

  // Tombol Next
  html += `
    <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled class="opacity-40 cursor-not-allowed px-2.5 py-1 rounded bg-slate-200 text-slate-500 font-bold text-xs"' : 'class="px-2.5 py-1 rounded bg-slate-200 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-xs transition"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// ==================== RENDER TABEL ORDER MANAGEMENT ====================
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  if (!data || data.length === 0) { 
    tbody.innerHTML = '<tr><td colspan="8" class="text-center p-6 text-slate-400">Tidak ada data order.</td></tr>'; 
    return; 
  }

  tbody.innerHTML = data.map(item => `
    <tr class="hover:bg-blue-50/50 transition">
      <td class="p-3 font-bold text-blue-900">${item.awbNumber}<div class="text-xs text-slate-400 font-normal">DO: ${item.doCustomer}</div></td>
      <td class="p-3 text-slate-600">${item.orderDate}</td>
      <td class="p-3 font-semibold">${item.clientName}</td>
      <td class="p-3 text-slate-600">${item.origin} → ${item.destination}</td>
      <td class="p-3 font-medium">${item.consigneeName}</td>
      <td class="p-3 text-center"><span class="bg-slate-100 px-2 py-1 rounded text-xs">${item.service}</span> <div class="text-xs text-slate-500 mt-0.5">${item.weight} Kg</div></td>
      <td class="p-3 text-center"><span class="${getStatusBadgeClass(item.trackTrace)} px-2.5 py-1 rounded-full text-xs font-bold">${item.trackTrace}</span></td>
      <td class="p-3 text-center"><button onclick="openUpdateModal(${item.rowIndex})" class="bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded text-xs font-bold"><i class="fa-solid fa-pen-to-square"></i> Edit</button></td>
    </tr>
  `).join('');
}

function updateKPIs(data) {
  document.getElementById('dashTotalOrder').innerText = data.length.toLocaleString('id-ID');
  document.getElementById('dashTransit').innerText = data.filter(d => d.trackTrace === 'On Delivery' || d.trackTrace === 'To Hub').length.toLocaleString('id-ID');
  document.getElementById('dashDelivered').innerText = data.filter(d => d.trackTrace === 'Delivered').length.toLocaleString('id-ID');
  const totalCharge = data.reduce((sum, d) => sum + (Number(d.charge) || 0), 0);
  document.getElementById('dashTotalCharge').innerText = 'Rp ' + totalCharge.toLocaleString('id-ID');
}

function submitAddOrder(e) {
  e.preventDefault();
  const formData = {
    doCustomer: document.getElementById('addDoCustomer').value,
    awbNumber: document.getElementById('addAwbNumber').value,
    clientName: document.getElementById('addClientName').value,
    service: document.getElementById('addService').value,
    origin: document.getElementById('addOrigin').value,
    destination: document.getElementById('addDestination').value,
    consigneeName: document.getElementById('addConsigneeName').value,
    consigneeAddress: document.getElementById('addConsigneeAddress').value,
    weight: document.getElementById('addWeight').value,
    coly: document.getElementById('addColy').value,
    charge: document.getElementById('addCharge').value
  };

  const btn = document.getElementById('btnSaveAddOrder');
  btn.disabled = true;
  btn.innerText = 'Menyimpan...';

  apiPost('addOrder', { formData: formData })
    .then(res => {
      btn.disabled = false;
      btn.innerText = 'Simpan Order';
      if (res.status === 'success') {
        alert(res.message);
        closeModal('modalAddOrder');
        document.getElementById('formAddOrder').reset();
        loadData();
      } else {
        alert('Gagal: ' + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerText = 'Simpan Order';
      alert('Eror: ' + err.message);
    });
}

function openUpdateModal(rowIndex) {
  const item = rawData.find(d => Number(d.rowIndex) === Number(rowIndex));
  if (!item) return;

  document.getElementById('editRowIndex').value = item.rowIndex;
  document.getElementById('editDoCustomer').value = item.doCustomer || '';
  document.getElementById('editTrackTrace').value = item.trackTrace || 'New Order';
  document.getElementById('editClientName').value = item.clientName || '';
  document.getElementById('editConsigneeName').value = item.consigneeName || '';
  document.getElementById('editOrigin').value = item.origin || '';
  document.getElementById('editDestination').value = item.destination || '';
  document.getElementById('editWeight').value = item.weight || 0;
  document.getElementById('editCharge').value = item.charge || 0;
  document.getElementById('editReceiverName').value = item.receiverName || '';
  document.getElementById('editVendorBy').value = item.vendorBy || '';

  document.getElementById('editModalTitle').innerText = `Edit Order ${item.awbNumber}`;
  openModal('modalUpdateOrder');
}

function submitUpdateOrder(e) {
  e.preventDefault();
  const formData = {
    rowIndex: document.getElementById('editRowIndex').value,
    doCustomer: document.getElementById('editDoCustomer').value,
    trackTrace: document.getElementById('editTrackTrace').value,
    clientName: document.getElementById('editClientName').value,
    consigneeName: document.getElementById('editConsigneeName').value,
    origin: document.getElementById('editOrigin').value,
    destination: document.getElementById('editDestination').value,
    weight: document.getElementById('editWeight').value,
    charge: document.getElementById('editCharge').value,
    receiverName: document.getElementById('editReceiverName').value,
    vendorBy: document.getElementById('editVendorBy').value
  };

  const btn = document.getElementById('btnSaveUpdateOrder');
  btn.disabled = true;
  btn.innerText = 'Menyimpan...';

  apiPost('updateOrder', { formData: formData })
    .then(res => {
      btn.disabled = false;
      btn.innerText = 'Simpan Perubahan';
      if (res.status === 'success') {
        alert(res.message);
        closeModal('modalUpdateOrder');
        loadData();
      } else {
        alert('Gagal: ' + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerText = 'Simpan Perubahan';
      alert('Eror: ' + err.message);
    });
}

// ==================== HELPER WARNA STATUS BADGE ====================
function getStatusBadgeClass(status) {
  const st = String(status || '').trim().toLowerCase();
  
  if (st === 'new order') {
    return 'bg-orange-100 text-orange-800 border border-orange-300';
  } else if (st === 'to hub') {
    return 'bg-blue-100 text-blue-800 border border-blue-300';
  } else if (st === 'on delivery') {
    return 'bg-pink-100 text-pink-800 border border-pink-300';
  } else if (st === 'delivered') {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else if (st === 'canceled' || st === 'cancelled') {
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  } else if (st === 'returned' || st === 'returnend') {
    return 'bg-amber-900/10 text-amber-950 border border-amber-900/30'; // Warna Coklat
  }
  
  return 'bg-slate-100 text-slate-800 border border-slate-300';
}
