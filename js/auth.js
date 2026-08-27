window.onload = function() {
  checkUserSession();
};

function togglePasswordVisibility() {
  const passInput = document.getElementById('loginPassword');
  const eyeIcon = document.getElementById('toggleEyeIcon');
  if (!passInput || !eyeIcon) return;

  if (passInput.type === 'password') {
    passInput.type = 'text';
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash');
  } else {
    passInput.type = 'password';
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye');
  }
}

function checkUserSession() {
  let savedUser = null;
  try {
    savedUser = localStorage.getItem('dkm_logged_user');
  } catch(e) {}

  if (savedUser || currentUser) {
    try {
      const userObj = currentUser || JSON.parse(savedUser);
      document.getElementById('loggedUserName').innerText = userObj.fullName;
      document.getElementById('loggedUserRole').innerText = userObj.role;
      document.getElementById('loginOverlay').classList.add('hidden');
      loadData();
    } catch(e) {
      showLoginOverlay();
    }
  } else {
    showLoginOverlay();
  }
}

function showLoginOverlay() {
  document.getElementById('formLogin').reset();
  document.getElementById('loginAlert').classList.add('hidden');
  document.getElementById('loginOverlay').classList.remove('hidden');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const u = document.getElementById('loginUsername').value;
  const p = document.getElementById('loginPassword').value;

  const btn = document.getElementById('btnLoginSubmit');
  const alertEl = document.getElementById('loginAlert');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa...`;
  alertEl.classList.add('hidden');

  apiPost('login', { username: u, password: p })
    .then(res => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Masuk ke Sistem`;

      if (res.status === 'success') {
        currentUser = res.user;
        try {
          localStorage.setItem('dkm_logged_user', JSON.stringify(res.user));
        } catch(err) {}

        document.getElementById('loggedUserName').innerText = res.user.fullName;
        document.getElementById('loggedUserRole').innerText = res.user.role;
        document.getElementById('loginOverlay').classList.add('hidden');
        loadData();
      } else {
        alertEl.innerText = res.message;
        alertEl.classList.remove('hidden');
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Masuk ke Sistem`;
      alertEl.innerText = 'Terjadi kesalahan sistem: ' + (err ? err.message : err);
      alertEl.classList.remove('hidden');
    });
}

function handleLogout() {
  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
    currentUser = null;
    try {
      localStorage.removeItem('dkm_logged_user');
    } catch(e) {}
    
    document.getElementById('loggedUserName').innerText = 'User DKM';
    document.getElementById('loggedUserRole').innerText = 'Administrator';
    showLoginOverlay();
  }
}

function loadUsersTable() {
  apiGet('getUsers')
    .then(res => {
      const tbody = document.getElementById('userTableBody');
      if (res.status === 'success' && res.users) {
        if (res.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6 text-slate-400">Belum ada data user.</td></tr>';
          return;
        }

        tbody.innerHTML = res.users.map((u, i) => `
          <tr class="hover:bg-slate-50 transition">
            <td class="p-3 font-medium text-slate-500">${i + 1}.</td>
            <td class="p-3 font-bold text-blue-900">${u.username}</td>
            <td class="p-3 font-semibold text-slate-800">${u.fullName}</td>
            <td class="p-3"><span class="bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-full text-xs">${u.role}</span></td>
            <td class="p-3 text-center">
              <button onclick="handleDeleteUser(${u.rowIndex}, '${u.username}')" title="Hapus User" class="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-1.5 rounded-lg text-xs font-bold transition">
                <i class="fa-solid fa-trash-can"></i> Hapus
              </button>
            </td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6 text-red-400">Gagal memuat daftar user.</td></tr>';
      }
    })
    .catch(err => alert('Eror memuat user: ' + err));
}

function submitAddUser(e) {
  e.preventDefault();
  const userData = {
    username: document.getElementById('addUserUsername').value,
    password: document.getElementById('addUserPassword').value,
    fullName: document.getElementById('addUserFullName').value,
    role: document.getElementById('addUserRole').value
  };

  const btn = document.getElementById('btnSaveAddUser');
  btn.disabled = true;
  btn.innerText = 'Menyimpan...';

  apiPost('addUser', { userData: userData })
    .then(res => {
      btn.disabled = false;
      btn.innerText = 'Simpan User';
      if (res.status === 'success') {
        alert(res.message);
        closeModal('modalAddUser');
        document.getElementById('formAddUser').reset();
        loadUsersTable();
      } else {
        alert('Gagal: ' + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerText = 'Simpan User';
      alert('Eror: ' + err.message);
    });
}

function handleDeleteUser(rowIndex, username) {
  if (!confirm(`Apakah Anda yakin ingin menghapus user '${username}'?`)) return;

  apiPost('deleteUser', { rowIndex: rowIndex })
    .then(res => {
      if (res.status === 'success') {
        alert(res.message);
        loadUsersTable();
      } else {
        alert('Gagal menghapus: ' + res.message);
      }
    })
    .catch(err => alert('Eror: ' + err));
}
