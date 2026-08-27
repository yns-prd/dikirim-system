function toggleSubmenu(submenuId) {
  const submenu = document.getElementById(submenuId);
  const icon = document.getElementById('icon-' + submenuId);

  if (!submenu || !icon) return;

  if (submenu.classList.contains('hidden')) {
    submenu.classList.remove('hidden');
    icon.classList.add('rotate-180');
  } else {
    submenu.classList.add('hidden');
    icon.classList.remove('rotate-180');
  }
}

function autoOpenParentSubmenu(pageId) {
  const allSubmenus = ['submenuMaster', 'submenuInvoice', 'submenuSystem'];
  
  const childParentMap = {
    'vendorPage': 'submenuMaster',
    'clientPage': 'submenuMaster',
    'driverPage': 'submenuMaster',
    'pricePage': 'submenuMaster',
    'publishInvoicePage': 'submenuInvoice',
    'proformaInvoicePage': 'submenuInvoice',
    'createInvoicePage': 'submenuInvoice',
    'userSettingPage': 'submenuSystem'
  };

  const parentIdToOpen = childParentMap[pageId];

  allSubmenus.forEach(submenuId => {
    const submenu = document.getElementById(submenuId);
    const icon = document.getElementById('icon-' + submenuId);
    
    if (!submenu || !icon) return;
    
    if (submenuId === parentIdToOpen) {
      submenu.classList.remove('hidden');
      icon.classList.add('rotate-180');
    } else {
      submenu.classList.add('hidden');
      icon.classList.remove('rotate-180');
    }
  });
}

function switchPage(pageId) {
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
  const activePage = document.getElementById(pageId);
  if (activePage) activePage.classList.remove('hidden');

  autoOpenParentSubmenu(pageId);

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-blue-900', 'text-white', 'shadow-sm');
    el.classList.add('text-slate-300');
  });

  const activeNav = document.getElementById('nav-' + pageId);
  if (activeNav) {
    activeNav.classList.add('bg-blue-900', 'text-white', 'shadow-sm');
    activeNav.classList.remove('text-slate-300');
  }

  if (pageId === 'dashboardPage') {
    document.getElementById('pageTitle').innerText = 'Dashboard Analytics';
    setTimeout(renderTrendChart, 100);
  } else if (pageId === 'orderPage') {
    document.getElementById('pageTitle').innerText = 'Order Management';
  } else if (pageId === 'publishInvoicePage') {
    document.getElementById('pageTitle').innerText = 'Publish Invoice (Resmi)';
    renderPublishInvoiceTable();
  } else if (pageId === 'proformaInvoicePage') {
    document.getElementById('pageTitle').innerText = 'Proforma Invoice (Draf)';
    renderProformaInvoiceTable();
  } else if (pageId === 'createInvoicePage') {
    document.getElementById('pageTitle').innerText = 'Buat Proforma Invoice';
    initCreateInvoicePage();
  } else if (pageId === 'userSettingPage') {
    document.getElementById('pageTitle').innerText = 'User Management';
    loadUsersTable();
  } else if (pageId === 'vendorPage') {
    document.getElementById('pageTitle').innerText = 'Master Vendor';
    loadVendorsTable();
  } else if (pageId === 'clientPage') {
    document.getElementById('pageTitle').innerText = 'Master Client';
    loadClientsTable();
  } else if (pageId === 'driverPage') {
    document.getElementById('pageTitle').innerText = 'Master Driver';
    loadDriversTable();
  } else if (pageId === 'pricePage') {
    document.getElementById('pageTitle').innerText = 'Master Price';
    initPricePage(); 
  }
}
