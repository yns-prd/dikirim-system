let rawData = [];
let groupedInvoices = [];
let summaryData = { monthly: {}, yearly: {}, chartTrends: {} };
let filteredData = [];
let currentPage = 1;
let myTrendChart = null;
let currentUser = null; 

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
const chartColors = ['#1e3a8a', '#f59e0b', '#4f46e5', '#ec4899', '#06b6d4', '#f97316', '#64748b', '#84cc16'];

// 🟢 CONFIG SUPABASE
const SUPABASE_URL = "https://rxaqndsoltvmatrxizuc.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YXFuZHNvbHR2bWF0cnhpenVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMjk0OTUsImV4cCI6MjEwMjYwNTQ5NX0.agnMWLazNDo3kAU9DPRmWnSIWm1GtxUn97JvZtHWARE";

// 🔴 CONFIG GAS
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwYqy_VGjIxs7Aj-nhc743rnrZaMhSW_KF9gbMfjoceV8GxFEWrDsFsXMvLOdPRCFdP/exec"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNGSI HELPER API FETCH (GAS) ---
function apiGet(action) {
  return fetch(`${GAS_API_URL}?action=${action}`).then(res => res.json());
}

function apiPost(action, dataObj = {}) {
  const payload = Object.assign({ action: action }, dataObj);
  return fetch(GAS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(res => res.json());
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function onError(err) { alert('Terjadi kesalahan: ' + (err ? err.message : err)); }
