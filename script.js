/* =========================================================
   SR FASHION NANDED — Stock Site Script
   -----------------------------------------------------------
   HOW THIS WORKS (read this once):
   1. This page reads product data from "items.json" sitting in
      the same folder. Your Python export script keeps updating
      that file with the latest Busy export.
   2. items.json is an array of objects like:
      { "alias":"ABC123", "group":"LACHA", "name":"Product Name", "print_name":"Product Display Name",
        "mrp":819.2, "sale_price":740, "purchase_price":640, "stock":-3 }
   3. Change ADMIN_PASSWORD to whatever password you want to use
      to unlock the Admin view (shows Purchase Price box).
      NOTE: this is a simple front-end lock, not real security —
      anyone who reads the file can find the password. Good enough
      to hide numbers from casual visitors, not for real secrets.
   ========================================================= */

const CONFIG = {
  ADMIN_PASSWORD: "7277",
  LOW_STOCK_MAX: 5,
  DATA_URL: "items.json",
  LAST_SYNC_URL: "last-sync.json",
};

let ALL_PRODUCTS = [];
let state = {
  search: "",
  sort: "default",
  stockFilter: "all",
  brand: "all",
  group: "all",
  minPrice: null,
  maxPrice: null,
  isAdmin: false,
};
let isLoading = false;

function buildProductFromItem(item) {
  const name = (item?.name || "").toString().trim();
  if (!name) {
    return null;
  }

  return {
    name,
    alias: (item?.aliasCode ?? item?.alias ?? "").toString().trim(),
    group: (item?.group ?? item?.category ?? "").toString().trim(),
    print_name: (item?.print_name ?? item?.PrintName ?? "").toString().trim(),
    brand: "",
    mrp: Number(item?.mrp ?? 0),
    sale: Number(item?.sale_price ?? 0),
    wholesale: null,
    purchase: Number(item?.purchase_price ?? 0),
    stock: Number(item?.stock ?? 0),
  };
}

function normalizeProductData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Expected items.json to contain an array of products.");
  }

  return data
    .map((item) => buildProductFromItem(item))
    .filter(Boolean);
}

function getCacheBustedUrl(url) {
  const requestUrl = new URL(url, window.location.href);
  requestUrl.searchParams.set("v", Date.now().toString());
  return requestUrl.toString();
}

async function fetchJson(url) {
  const response = await fetch(getCacheBustedUrl(url), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${url} could not be loaded.`);
  }

  return response.json();
}

function setGridMessage(message, isError = false) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const color = isError ? "#ff5c6c" : "#8a8a90";
  grid.innerHTML = `<p style="color:${color};padding:20px;">${escapeHtml(message)}</p>`;
}

function setRefreshButtonState(loading) {
  const button = document.getElementById("refreshBtn");
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle("is-loading", loading);
  button.setAttribute("aria-busy", loading ? "true" : "false");
  button.title = loading ? "Refreshing stock..." : "Refresh stock";
}

function updateSyncStatus(text) {
  const syncStatus = document.getElementById("syncStatus");
  if (!syncStatus) return;
  syncStatus.textContent = text || "Sync unavailable";
  syncStatus.title = text || "Sync unavailable";
}

async function loadStock({ showLoading = false } = {}) {
  if (isLoading) {
    return;
  }

  isLoading = true;
  setRefreshButtonState(true);

  if (showLoading) {
    setGridMessage("Refreshing stock...");
  }

  try {
    const [stockResult, syncResult] = await Promise.allSettled([
      fetchJson(CONFIG.DATA_URL),
      fetchJson(CONFIG.LAST_SYNC_URL).catch(() => null),
    ]);

    if (stockResult.status !== "fulfilled") {
      throw stockResult.reason || new Error("Unable to load stock data.");
    }

    ALL_PRODUCTS = normalizeProductData(stockResult.value);

    if (syncResult.status === "fulfilled" && syncResult.value?.last_updated) {
      updateSyncStatus(`Updated ${syncResult.value.last_updated}`);
    } else {
      updateSyncStatus("Sync unavailable");
    }

    populateDropdowns();
    renderAll();
    console.info(`[stock] Loaded ${ALL_PRODUCTS.length} products from ${CONFIG.DATA_URL}`);
  } catch (err) {
    console.error("[stock] Failed to load latest stock", err);
    updateSyncStatus("Load failed");

    if (!ALL_PRODUCTS.length) {
      setGridMessage("Failed to load latest stock. Please refresh again in a moment.", true);
    } else {
      setGridMessage("Failed to load latest stock. Showing previously loaded values.", true);
      renderAll();
    }
  } finally {
    isLoading = false;
    setRefreshButtonState(false);
  }
}

/* ---------------- DROPDOWNS ---------------- */

function populateDropdowns() {
  const brands = [...new Set(ALL_PRODUCTS.map((p) => p.brand).filter(Boolean))].sort();
  const groups = [...new Set(ALL_PRODUCTS.map((p) => p.group).filter(Boolean))].sort();

  document.getElementById("brandDropdown").style.display = brands.length ? "" : "none";
  document.getElementById("groupDropdown").style.display = groups.length ? "" : "none";
  document.querySelector(".dropdown-row").style.display = (brands.length || groups.length) ? "" : "none";
  document.querySelector('#sortPills [data-sort="group"]').style.display = groups.length ? "" : "none";

  const brandMenu = document.getElementById("brandMenu");
  brandMenu.innerHTML = `<div class="dropdown-item selected" data-value="all">All Brands</div>` +
    brands.map((b) => `<div class="dropdown-item" data-value="${escapeHtml(b)}">${escapeHtml(b)}</div>`).join("");

  const groupMenu = document.getElementById("groupMenu");
  groupMenu.innerHTML = `<div class="dropdown-item selected" data-value="all">All Groups</div>` +
    groups.map((g) => `<div class="dropdown-item" data-value="${escapeHtml(g)}">${escapeHtml(g)}</div>`).join("");

  brandMenu.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.brand = item.dataset.value;
      document.getElementById("brandLabel").textContent = item.dataset.value === "all" ? "All Brands" : item.dataset.value;
      brandMenu.classList.remove("open");
      renderAll();
    });
  });
  groupMenu.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.group = item.dataset.value;
      document.getElementById("groupLabel").textContent = item.dataset.value === "all" ? "All Groups" : item.dataset.value;
      groupMenu.classList.remove("open");
      renderAll();
    });
  });
}

document.querySelectorAll(".dropdown-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const menu = document.getElementById(btn.dataset.target);
    const wasOpen = menu.classList.contains("open");
    document.querySelectorAll(".dropdown-menu").forEach((m) => m.classList.remove("open"));
    if (!wasOpen) menu.classList.add("open");
  });
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-menu").forEach((m) => m.classList.remove("open"));
  }
});

/* ---------------- FILTER + SORT + RENDER ---------------- */

function getStockStatus(stock) {
  if (stock <= 0) return "out";
  if (stock <= CONFIG.LOW_STOCK_MAX) return "low";
  return "in";
}

function applyFilters() {
  let list = ALL_PRODUCTS.slice();

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    list = list.filter((p) => {
      const name = (p.name || "").toString().toLowerCase();
      const alias = (p.alias || "").toString().toLowerCase();
      const printName = (p.print_name || "").toString().toLowerCase();
      const group = (p.group || "").toString().toLowerCase();
      return name.includes(q) || alias.includes(q) || printName.includes(q) || group.includes(q);
    });
  }

  if (state.stockFilter !== "all") {
    list = list.filter((p) => getStockStatus(p.stock) === state.stockFilter);
  }

  if (state.brand !== "all") {
    list = list.filter((p) => p.brand === state.brand);
  }
  if (state.group !== "all") {
    list = list.filter((p) => p.group === state.group);
  }

  if (state.minPrice !== null) {
    list = list.filter((p) => p.sale !== null && p.sale >= state.minPrice);
  }
  if (state.maxPrice !== null) {
    list = list.filter((p) => p.sale !== null && p.sale <= state.maxPrice);
  }

  switch (state.sort) {
    case "group":
      list.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
      break;
    case "az":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "priceAsc":
      list.sort((a, b) => (a.sale ?? Infinity) - (b.sale ?? Infinity));
      break;
    case "priceDesc":
      list.sort((a, b) => (b.sale ?? -Infinity) - (a.sale ?? -Infinity));
      break;
    default:
      break;
  }

  return list;
}

function highlight(text, query) {
  if (!query.trim()) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const q = escapeHtml(query.trim());
  const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
  return escaped.replace(re, "<mark>$1</mark>");
}

function escapeHtml(str) {
  return (str || "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtPrice(n) {
  if (n === null || n === undefined) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function renderAll() {
  const filtered = applyFilters();
  renderGrid(filtered);
  renderCounts(filtered);
  document.getElementById("emptyState").style.display =
    (!state.search.trim() && filtered.length === ALL_PRODUCTS.length && state.stockFilter === "all" && state.brand === "all" && state.group === "all")
      ? "block" : "none";
}

function renderCounts(filtered) {
  document.getElementById("totalCountPill").textContent = `${ALL_PRODUCTS.length.toLocaleString("en-IN")} items`;
  if (state.search.trim() || filtered.length !== ALL_PRODUCTS.length) {
    document.getElementById("resultCount").textContent = `${filtered.length.toLocaleString("en-IN")} of ${ALL_PRODUCTS.length.toLocaleString("en-IN")} items`;
  } else {
    document.getElementById("resultCount").textContent = "";
  }
}

function renderGrid(list) {
  const grid = document.getElementById("productGrid");

  if (!state.search.trim() && state.stockFilter === "all" && state.brand === "all" && state.group === "all") {
    grid.innerHTML = "";
    return;
  }

  if (!list.length) {
    grid.innerHTML = `<p style="color:#8a8a90;padding:20px;">No items match your search/filters.</p>`;
    return;
  }

  const adminTable = state.isAdmin ? `
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Alias Code</th>
              <th>Product Name</th>
              <th>Print Name</th>
              <th>MRP</th>
              <th>Sale Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((p) => `
              <tr>
                <td>${escapeHtml(p.alias || "")}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.print_name)}</td>
                <td>${fmtPrice(p.mrp)}</td>
                <td>${fmtPrice(p.sale)}</td>
                <td>${escapeHtml(p.stock.toString())}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : "";

  grid.innerHTML = adminTable + list.map((p) => {
    const status = getStockStatus(p.stock);
    const stockClass = status === "in" ? "ok" : status === "low" ? "low" : "";
    const stockValue = p.stock;
    return `
      <div class="product-card">
        <div class="product-name">${highlight(p.name, state.search)}</div>
        ${p.alias ? `<div class="product-meta">Alias Code: ${escapeHtml(p.alias)}</div>` : ""}
        ${p.group ? `<div class="product-category">📁 ${escapeHtml(p.group)}</div>` : ""}
        <div class="product-boxes">
          <div class="box mrp"><span class="label">MRP</span><span class="value">${fmtPrice(p.mrp)}</span><span class="lock">🔒</span></div>
          <div class="box sale"><span class="label">Sale Price</span><span class="value">${fmtPrice(p.sale)}</span><span class="lock">🔒</span></div>
          ${p.wholesale !== null ? `
          <div class="box wholesale"><span class="label">Wholesale</span><span class="value">${fmtPrice(p.wholesale)}</span><span class="lock">🔒</span></div>` : ""}
          <div class="box stock ${stockClass}"><span class="label">Stock</span><span class="value">${stockValue}</span></div>
          ${state.isAdmin && p.purchase !== null ? `
          <div class="box purchase"><span class="label">Purchase</span><span class="value">${fmtPrice(p.purchase)}</span></div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

/* ---------------- EVENT WIRING ---------------- */

function updateSearchClearButton() {
  const searchInput = document.getElementById("searchInput");
  const clearButton = document.getElementById("searchClearBtn");
  if (!searchInput || !clearButton) return;
  const hasText = searchInput.value.trim().length > 0;
  clearButton.classList.toggle("visible", hasText);
}

let clearSearchLocked = false;

function clearSearch(event) {
  if (clearSearchLocked) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    return;
  }

  clearSearchLocked = true;

  try {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    if (!searchInput.value.trim()) {
      updateSearchClearButton();
      searchInput.focus();
      return;
    }

    searchInput.value = "";
    state.search = "";
    renderAll();
    updateSearchClearButton();
    searchInput.focus();
  } finally {
    window.requestAnimationFrame(() => {
      clearSearchLocked = false;
    });
  }
}

const searchInput = document.getElementById("searchInput");
const searchClearBtn = document.getElementById("searchClearBtn");
searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  updateSearchClearButton();
  renderAll();
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    clearSearch(e);
  }
});
searchClearBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  clearSearch(e);
});
searchClearBtn.addEventListener("click", (e) => {
  clearSearch(e);
});
searchClearBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    clearSearch(e);
  }
});
updateSearchClearButton();

document.querySelectorAll("#sortPills .pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#sortPills .pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.sort = btn.dataset.sort;
    renderAll();
  });
});

document.querySelectorAll("#stockPills .pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#stockPills .pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.stockFilter = btn.dataset.stock;
    renderAll();
  });
});

document.getElementById("goBtn").addEventListener("click", () => {
  const min = document.getElementById("minPrice").value;
  const max = document.getElementById("maxPrice").value;
  state.minPrice = min === "" ? null : parseFloat(min);
  state.maxPrice = max === "" ? null : parseFloat(max);
  renderAll();
});

document.getElementById("clearPriceBtn").addEventListener("click", () => {
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  state.minPrice = null;
  state.maxPrice = null;
  renderAll();
});

document.getElementById("refreshBtn").addEventListener("click", () => {
  loadStock({ showLoading: true });
});

/* ---------------- ADMIN LOGIN ---------------- */

const adminBtn = document.getElementById("adminBtn");
const loginOverlay = document.getElementById("loginOverlay");
const loginClose = document.getElementById("loginClose");
const adminSubmit = document.getElementById("adminSubmit");
const adminPassInput = document.getElementById("adminPassInput");
const loginError = document.getElementById("loginError");

function setAdminUI() {
  if (state.isAdmin) {
    adminBtn.textContent = "Logout";
    adminBtn.classList.add("logged-in");
  } else {
    adminBtn.textContent = "⚡ Admin";
    adminBtn.classList.remove("logged-in");
  }
}

if (sessionStorage.getItem("sr_admin") === "true") {
  state.isAdmin = true;
}
setAdminUI();

adminBtn.addEventListener("click", () => {
  if (state.isAdmin) {
    state.isAdmin = false;
    sessionStorage.removeItem("sr_admin");
    setAdminUI();
    renderAll();
  } else {
    loginOverlay.classList.add("open");
    adminPassInput.value = "";
    loginError.textContent = "";
    adminPassInput.focus();
  }
});

loginClose.addEventListener("click", () => loginOverlay.classList.remove("open"));

adminSubmit.addEventListener("click", attemptLogin);
adminPassInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin();
});

function attemptLogin() {
  if (adminPassInput.value === CONFIG.ADMIN_PASSWORD) {
    state.isAdmin = true;
    sessionStorage.setItem("sr_admin", "true");
    setAdminUI();
    loginOverlay.classList.remove("open");
    renderAll();
  } else {
    loginError.textContent = "Wrong password, try again.";
  }
}

/* ---------------- BARCODE SCAN ---------------- */

const scanBtn = document.getElementById("scanBtn");
const scanOverlay = document.getElementById("scanOverlay");
const scanClose = document.getElementById("scanClose");
const scanVideo = document.getElementById("scanVideo");
const scanHint = document.getElementById("scanHint");
let scanStream = null;
let scanTimer = null;

scanBtn.addEventListener("click", startScan);
scanClose.addEventListener("click", stopScan);

async function startScan() {
  if (!("BarcodeDetector" in window)) {
    alert("Barcode scanning isn't supported on this browser. Try Chrome on Android, or just type the code in search.");
    return;
  }
  scanOverlay.classList.add("open");
  scanHint.textContent = "Point camera at a barcode";
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    scanVideo.srcObject = scanStream;
    await scanVideo.play();
    const detector = new BarcodeDetector();
    scanTimer = setInterval(async () => {
      try {
        const codes = await detector.detect(scanVideo);
        if (codes.length) {
          document.getElementById("searchInput").value = codes[0].rawValue;
          state.search = codes[0].rawValue;
          updateSearchClearButton();
          renderAll();
          stopScan();
        }
      } catch (err) { /* ignore frame errors */ }
    }, 400);
  } catch (err) {
    scanHint.textContent = "Camera access denied or unavailable.";
  }
}

function stopScan() {
  scanOverlay.classList.remove("open");
  if (scanTimer) clearInterval(scanTimer);
  if (scanStream) scanStream.getTracks().forEach((t) => t.stop());
  scanStream = null;
}

/* ---------------- INIT ---------------- */

loadStock({ showLoading: true });

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !isLoading) {
    loadStock();
  }
});
