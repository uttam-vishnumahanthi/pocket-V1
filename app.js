/**
 * PocketPilot — Core Application Logic (Full-Stack Connected)
 * Communicates with the Node.js + Express + SQLite backend.
 */

// --- 1. STATE MANAGEMENT ---
let state = {
  expenses: [],
  income: [],
  people: [],
  userName: "Uttam",
  summary: null,
  currentView: "dashboard",
  isLoading: false
};

// --- 2. API CLIENT SERVICE ---
const API = {
  async getDashboard() {
    const res = await fetch('/api/dashboard');
    const json = await res.json();
    return json.data;
  },

  async getExpenses(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/expenses${params ? '?' + params : ''}`);
    const json = await res.json();
    return json.data || [];
  },

  async createExpense(data) {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save expense');
    return json.data;
  },

  async updateExpense(id, data) {
    const res = await fetch(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update expense');
    return json.data;
  },

  async deleteExpense(id) {
    const res = await fetch(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete expense');
    return json;
  },

  async getIncome() {
    const res = await fetch('/api/income');
    const json = await res.json();
    return json.data || [];
  },

  async createIncome(data) {
    const res = await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add income');
    return json.data;
  },

  async deleteIncome(id) {
    const res = await fetch(`/api/income/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete income');
    return json;
  },

  async getPeople() {
    const res = await fetch('/api/people');
    const json = await res.json();
    return json.data || [];
  },

  async createPeople(data) {
    const res = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save debt entry');
    return json.data;
  },

  async updatePeople(id, data) {
    const res = await fetch(`/api/people/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update debt entry');
    return json.data;
  },

  async deletePeople(id) {
    const res = await fetch(`/api/people/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete debt entry');
    return json;
  },

  async updateProfile(username) {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update profile');
    return json.data;
  }
};

/**
 * Migration helper: If user had legacy localStorage data, sync to SQLite once and clean up.
 */
async function checkAndMigrateLegacyLocalStorage() {
  try {
    const localExpenses = localStorage.getItem("pocket_expenses_v2");
    const localIncome = localStorage.getItem("pocket_income_v2");
    const localPeople = localStorage.getItem("pocket_people_v1");
    const localUser = localStorage.getItem("pocket_username");

    let migrated = false;

    if (localUser && localUser.trim()) {
      await API.updateProfile(localUser.trim());
      localStorage.removeItem("pocket_username");
      migrated = true;
    }

    if (localIncome) {
      const incomes = JSON.parse(localIncome);
      if (Array.isArray(incomes) && incomes.length > 0) {
        for (const item of incomes) {
          await API.createIncome({
            id: item.id,
            amount: item.amount,
            note: item.note || 'Pocket money',
            datetime: item.datetime || new Date().toISOString()
          });
        }
        migrated = true;
      }
      localStorage.removeItem("pocket_income_v2");
    }

    if (localExpenses) {
      const expenses = JSON.parse(localExpenses);
      if (Array.isArray(expenses) && expenses.length > 0) {
        for (const item of expenses) {
          await API.createExpense({
            id: item.id,
            amount: item.amount,
            category: item.category || 'others',
            note: item.note || '',
            datetime: item.datetime || new Date().toISOString(),
            type: item.type || 'need'
          });
        }
        migrated = true;
      }
      localStorage.removeItem("pocket_expenses_v2");
    }

    if (localPeople) {
      const people = JSON.parse(localPeople);
      if (Array.isArray(people) && people.length > 0) {
        for (const item of people) {
          await API.createPeople({
            id: item.id,
            type: item.type || 'borrowed',
            person: item.person || 'Unknown',
            amount: item.amount,
            repaidAmount: item.repaidAmount || 0,
            date: item.date || new Date().toISOString(),
            note: item.note || ''
          });
        }
        migrated = true;
      }
      localStorage.removeItem("pocket_people_v1");
    }

    if (migrated) {
      console.log('Successfully migrated legacy localStorage data to SQLite database!');
    }
  } catch (err) {
    console.warn('LocalStorage migration skipped or failed:', err);
  }
}

/**
 * Loads all data from backend API and updates local state.
 */
async function loadStateFromBackend() {
  try {
    const [summary, expenses, income, people] = await Promise.all([
      API.getDashboard(),
      API.getExpenses(),
      API.getIncome(),
      API.getPeople()
    ]);

    state.summary = summary;
    state.expenses = expenses;
    state.income = income;
    state.people = people;
    if (summary && summary.user) {
      state.userName = summary.user.username;
      const userDisplay = document.getElementById("username-display");
      if (userDisplay) userDisplay.textContent = state.userName;
    }
  } catch (err) {
    console.error('Failed to load state from backend:', err);
  }
}

// --- 3. DATE & TEXT FORMATTING HELPERS ---
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2
});

function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return CURRENCY_FORMATTER.format(num);
}

function formatCurrencyCompact(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  if (num % 1 === 0) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  }
  return formatCurrency(num);
}

function getCategoryLabel(category) {
  const labels = {
    food: "Food & dining",
    transport: "Transport",
    shopping: "Shopping",
    entertainment: "Entertainment",
    utilities: "Utilities",
    groceries: "Groceries",
    others: "Others"
  };
  return labels[category] || category;
}

function formatTransactionDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayOnly = new Date(todayOnly);
  yesterdayOnly.setDate(yesterdayOnly.getDate() - 1);

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return `Today &bull; ${timeStr}`;
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return `Yesterday &bull; ${timeStr}`;
  } else {
    const options = { month: 'short', day: 'numeric' };
    const dateFormatted = date.toLocaleDateString('en-US', options);
    return `${dateFormatted} &bull; ${timeStr}`;
  }
}

function getLocalISODateTime(dt = new Date()) {
  const tzoffset = dt.getTimezoneOffset() * 60000;
  return (new Date(dt.getTime() - tzoffset)).toISOString().slice(0, 16);
}

function formatForDatetimeInput(dateStr) {
  if (!dateStr) return getLocalISODateTime();
  if (dateStr.length === 16 && dateStr.includes('T')) return dateStr;
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return getLocalISODateTime();
  return getLocalISODateTime(dt);
}

// --- 4. DOM CACHING ---
const DOM = {
  // Navigation
  navDashboard: document.getElementById("nav-dashboard-btn"),
  navHistory: document.getElementById("nav-history-btn"),
  navAnalytics: document.getElementById("nav-analytics-btn"),
  navPeople: document.getElementById("nav-people-btn"),
  viewAllHistory: document.getElementById("view-all-history-link"),
  viewAllPeople: document.getElementById("view-all-people-link"),
  viewDashboard: document.getElementById("view-dashboard"),
  viewHistory: document.getElementById("view-history"),
  viewAnalytics: document.getElementById("view-analytics"),
  viewPeople: document.getElementById("view-people"),
  scrollContainer: document.getElementById("main-content-scroll"),
  
  // Dashboard fields
  totalSpent: document.getElementById("total-spent-display"),
  currentBalance: document.getElementById("current-balance-display"),
  recentExpenses: document.getElementById("recent-expenses-list"),
  growthRateBadge: document.getElementById("growth-rate-badge"),
  cardIOwe: document.getElementById("card-i-owe"),
  cardOwedToMe: document.getElementById("card-owed-to-me"),
  dashboardIOweTotal: document.getElementById("dashboard-i-owe-total"),
  dashboardOwedTotal: document.getElementById("dashboard-owed-total"),
  dashboardIOweList: document.getElementById("dashboard-i-owe-list"),
  dashboardOwedList: document.getElementById("dashboard-owed-list"),
  
  // History Fields
  searchField: document.getElementById("search-transactions-input"),
  filterTagsContainer: document.getElementById("history-filter-tags"),
  fullHistoryList: document.getElementById("full-history-list"),
  
  // Analytics Fields
  statIncome: document.getElementById("stat-total-income"),
  statSpent: document.getElementById("stat-total-spent"),
  statSavings: document.getElementById("stat-net-savings"),
  statSavingsPct: document.getElementById("stat-savings-percentage"),
  needsRatioBar: document.getElementById("needs-ratio-bar"),
  wantsRatioBar: document.getElementById("wants-ratio-bar"),
  needsRatioLabel: document.getElementById("needs-ratio-label"),
  wantsRatioLabel: document.getElementById("wants-ratio-label"),
  categoryBars: document.getElementById("analytics-category-bars"),
  insightBox: document.getElementById("smart-insight-box"),
  
  // Modals
  expenseModal: document.getElementById("expense-modal-overlay"),
  incomeModal: document.getElementById("income-modal-overlay"),
  peopleModal: document.getElementById("people-modal-overlay"),
  
  // Triggers
  btnOpenExpense: document.getElementById("open-add-expense-btn"),
  btnCloseExpense: document.getElementById("close-expense-modal"),
  btnOpenIncome: document.getElementById("open-add-income-btn"),
  btnCloseIncome: document.getElementById("close-income-modal"),
  btnCancelIncome: document.getElementById("btn-cancel-income"),
  btnClosePeople: document.getElementById("close-people-modal"),
  profileTrigger: document.getElementById("profile-trigger"),
  
  // Forms
  expenseForm: document.getElementById("expense-form"),
  expenseId: document.getElementById("edit-expense-id"),
  expenseAmount: document.getElementById("expense-amount"),
  expenseCategory: document.getElementById("expense-category"),
  expenseType: document.getElementById("expense-type"),
  expenseDatetime: document.getElementById("expense-datetime"),
  expenseNote: document.getElementById("expense-note"),
  expenseActions: document.getElementById("expense-actions-container"),
  expenseTitle: document.getElementById("expense-modal-title"),
  
  btnTypeNeed: document.getElementById("btn-type-need"),
  btnTypeWant: document.getElementById("btn-type-want"),
  incomeForm: document.getElementById("income-form"),
  incomeAmount: document.getElementById("income-amount"),
  incomeDatetime: document.getElementById("income-datetime"),
  incomeNote: document.getElementById("income-note"),
  
  // People feature elements
  totalIOwe: document.getElementById("total-i-owe-display"),
  totalOwed: document.getElementById("total-owed-display"),
  peopleNet: document.getElementById("people-net-display"),
  peopleNetBanner: document.getElementById("people-net-banner"),
  peopleFilterTags: document.getElementById("people-filter-tags"),
  peopleTransactionsList: document.getElementById("people-transactions-list"),
  
  // People Modal
  peopleForm: document.getElementById("people-form"),
  peopleId: document.getElementById("edit-people-id"),
  peopleType: document.getElementById("people-type"),
  btnPeopleTypeBorrowed: document.getElementById("btn-people-type-borrowed"),
  btnPeopleTypeSpent: document.getElementById("btn-people-type-spent"),
  peoplePersonName: document.getElementById("people-person-name"),
  peopleAmount: document.getElementById("people-amount"),
  peopleRepaidAmount: document.getElementById("people-repaid-amount"),
  btnPeopleMarkFullyPaid: document.getElementById("btn-people-mark-fully-paid"),
  peopleDatetime: document.getElementById("people-datetime"),
  peopleNote: document.getElementById("people-note"),
  peopleActions: document.getElementById("people-actions-container"),
  peopleTitle: document.getElementById("people-modal-title")
};

// --- 5. VIEW ENGINE & TABS ---
async function switchView(viewName) {
  state.currentView = viewName;
  
  DOM.navDashboard.classList.toggle("active", viewName === "dashboard");
  DOM.navHistory.classList.toggle("active", viewName === "history");
  DOM.navAnalytics.classList.toggle("active", viewName === "analytics");
  DOM.navPeople.classList.toggle("active", viewName === "people");
  
  DOM.viewDashboard.classList.toggle("active", viewName === "dashboard");
  DOM.viewHistory.classList.toggle("active", viewName === "history");
  DOM.viewAnalytics.classList.toggle("active", viewName === "analytics");
  DOM.viewPeople.classList.toggle("active", viewName === "people");
  
  DOM.scrollContainer.scrollTop = 0;

  const fabLabel = document.querySelector(".fab-label");
  if (viewName === "people") {
    if (fabLabel) fabLabel.textContent = "Add Entry";
  } else {
    if (fabLabel) fabLabel.textContent = "Add expense";
  }

  if (viewName === "dashboard") {
    renderDashboard();
  } else if (viewName === "history") {
    renderHistory();
  } else if (viewName === "analytics") {
    renderAnalytics();
  } else if (viewName === "people") {
    renderPeople();
  }
}

// --- 6. RENDER FUNCTIONS ---

// Render Dashboard View
function renderDashboard() {
  const summary = state.summary;
  const currentBalance = summary ? summary.currentBalance : 0;
  const monthlySpent = summary ? summary.monthlySpent : 0;
  const growthBadgeText = summary ? summary.growthRateFormatted : 'No spending yet';

  DOM.totalSpent.textContent = formatCurrency(monthlySpent);
  DOM.currentBalance.textContent = formatCurrency(currentBalance);
  
  if (DOM.growthRateBadge) {
    DOM.growthRateBadge.textContent = growthBadgeText;
    DOM.growthRateBadge.style.color = (summary && summary.monthlySpent > 0) ? "var(--income-green)" : "var(--text-light-muted)";
  }
  
  // Render recent 4 expenses
  DOM.recentExpenses.innerHTML = "";
  const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  const recentItems = sortedExpenses.slice(0, 4);

  if (recentItems.length === 0) {
    DOM.recentExpenses.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 14px;">
        No expenses recorded yet. Tap + to add one!
      </div>
    `;
  } else {
    recentItems.forEach(item => {
      const el = document.createElement("div");
      el.className = "expense-item";
      el.addEventListener("click", () => openEditExpenseModal(item));
      
      const initial = item.category.charAt(0).toUpperCase();
      
      el.innerHTML = `
        <div class="expense-item-left">
          <div class="category-avatar ${item.category}">${initial}</div>
          <div class="expense-item-info">
            <span class="expense-item-category">${getCategoryLabel(item.category)}</span>
            <span class="expense-item-meta">
              <span class="expense-item-date">${formatTransactionDate(item.datetime)}</span>
              <span class="meta-divider">&bull;</span>
              <span class="expense-item-note">${item.note || 'No note'}</span>
            </span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span class="expense-item-amount expense">&minus; ${formatCurrency(item.amount)}</span>
          <span class="expense-item-badge badge-${item.type}">${item.type}</span>
        </div>
      `;
      DOM.recentExpenses.appendChild(el);
    });
  }

  // Render People Cards on Dashboard
  const debts = summary ? summary.debts : { totalIOwe: 0, totalOwed: 0, activeIOweList: [], activeOwedList: [] };
  
  DOM.dashboardIOweTotal.textContent = formatCurrencyCompact(debts.totalIOwe || 0);
  DOM.dashboardOwedTotal.textContent = formatCurrencyCompact(debts.totalOwed || 0);

  DOM.dashboardIOweList.innerHTML = "";
  DOM.dashboardOwedList.innerHTML = "";

  const activeOwe = debts.activeIOweList || [];
  const activeOwed = debts.activeOwedList || [];

  if (activeOwe.length === 0) {
    DOM.dashboardIOweList.innerHTML = `<div class="people-card-empty">No active debts 🎉</div>`;
  } else {
    activeOwe.forEach(entry => {
      const el = document.createElement("div");
      el.className = "people-card-item";
      el.innerHTML = `
        <span class="people-card-item-name">${entry.person}</span>
        <span class="people-card-item-amount">${formatCurrencyCompact(entry.remaining)}</span>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditPeopleModal(entry);
      });
      DOM.dashboardIOweList.appendChild(el);
    });
  }

  if (activeOwed.length === 0) {
    DOM.dashboardOwedList.innerHTML = `<div class="people-card-empty">All settled up! 👍</div>`;
  } else {
    activeOwed.forEach(entry => {
      const el = document.createElement("div");
      el.className = "people-card-item";
      el.innerHTML = `
        <span class="people-card-item-name">${entry.person}</span>
        <span class="people-card-item-amount">${formatCurrencyCompact(entry.remaining)}</span>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditPeopleModal(entry);
      });
      DOM.dashboardOwedList.appendChild(el);
    });
  }
}

// History Filters and Search state
let historyFilter = "all";

function renderHistory() {
  const searchVal = DOM.searchField.value.toLowerCase().trim();
  DOM.fullHistoryList.innerHTML = "";

  let items = [];
  state.expenses.forEach(e => {
    items.push({ ...e, isExpense: true });
  });
  state.income.forEach(i => {
    items.push({ ...i, isExpense: false, category: "income", type: "income" });
  });

  items.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  if (historyFilter === "need") {
    items = items.filter(i => i.isExpense && i.type === "need");
  } else if (historyFilter === "want") {
    items = items.filter(i => i.isExpense && i.type === "want");
  } else if (historyFilter === "income") {
    items = items.filter(i => !i.isExpense);
  } else if (historyFilter !== "all") {
    items = items.filter(i => i.category === historyFilter);
  }

  if (searchVal) {
    items = items.filter(i => {
      const noteMatch = (i.note || "").toLowerCase().includes(searchVal);
      const catMatch = getCategoryLabel(i.category).toLowerCase().includes(searchVal);
      return noteMatch || catMatch;
    });
  }

  if (items.length === 0) {
    DOM.fullHistoryList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 15px; font-weight: 500;">No transactions found</p>
        <p style="font-size: 13px; margin-top: 4px; opacity: 0.8;">Try clearing your search or filters.</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "expense-item";
    
    if (item.isExpense) {
      el.addEventListener("click", () => openEditExpenseModal(item));
    } else {
      el.addEventListener("click", () => {
        if (confirm(`Do you want to delete this income transaction: "${item.note}" of ${formatCurrency(item.amount)}?`)) {
          handleDeleteIncome(item.id);
        }
      });
    }

    const initial = item.isExpense ? item.category.charAt(0).toUpperCase() : "I";
    const amountClass = item.isExpense ? "expense" : "income";
    const amountPrefix = item.isExpense ? "&minus; " : "&plus; ";

    el.innerHTML = `
      <div class="expense-item-left">
        <div class="category-avatar ${item.category}">${initial}</div>
        <div class="expense-item-info">
          <span class="expense-item-category">${item.isExpense ? getCategoryLabel(item.category) : "Income / Money In"}</span>
          <span class="expense-item-meta">
            <span class="expense-item-date">${formatTransactionDate(item.datetime)}</span>
            <span class="meta-divider">&bull;</span>
            <span class="expense-item-note">${item.note || 'No note'}</span>
          </span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <span class="expense-item-amount ${amountClass}">${amountPrefix}${formatCurrency(item.amount)}</span>
        <span class="expense-item-badge badge-${item.type}">${item.type}</span>
      </div>
    `;
    DOM.fullHistoryList.appendChild(el);
  });
}

// Render Analytics View
function renderAnalytics() {
  const summary = state.summary;
  const totalIncome = summary ? summary.totalIncome : 0;
  const totalExpenses = summary ? summary.totalExpenses : 0;
  const netSavings = summary ? summary.netSavings : 0;
  const savingsPct = summary ? summary.savingsPercentage : 0;

  DOM.statIncome.textContent = formatCurrency(totalIncome);
  DOM.statSpent.textContent = formatCurrency(totalExpenses);
  DOM.statSavings.textContent = formatCurrency(netSavings);
  
  if (totalIncome === 0) {
    DOM.statSavingsPct.textContent = "Add income to compute your savings rate";
  } else if (netSavings >= 0) {
    DOM.statSavingsPct.textContent = `${savingsPct}% of income saved`;
  } else {
    DOM.statSavingsPct.textContent = `Negative savings: spent ${Math.abs(savingsPct)}% more than earned`;
  }

  const needsPct = summary ? summary.needsPercentage : 50;
  const wantsPct = summary ? summary.wantsPercentage : 50;

  DOM.needsRatioBar.style.width = `${needsPct}%`;
  DOM.wantsRatioBar.style.width = `${wantsPct}%`;
  DOM.needsRatioLabel.textContent = `Needs: ${needsPct}%`;
  DOM.wantsRatioLabel.textContent = `Wants: ${wantsPct}%`;

  DOM.categoryBars.innerHTML = "";
  const categories = summary ? summary.categories : [];

  if (categories.length === 0) {
    DOM.categoryBars.innerHTML = `
      <div style="text-align: center; padding: 10px 0; color: var(--text-muted); font-size: 13px;">
        No data available. Add expenses to see category metrics.
      </div>
    `;
  } else {
    categories.forEach(cat => {
      const el = document.createElement("div");
      el.className = "category-bar-row";
      el.innerHTML = `
        <div class="category-bar-info">
          <span class="category-bar-name">${cat.label} <span class="category-bar-percent">${cat.percentage}%</span></span>
          <span class="category-bar-amount">${formatCurrency(cat.amount)}</span>
        </div>
        <div class="category-progress-track">
          <div class="category-progress-fill" style="width: ${cat.percentage}%;"></div>
        </div>
      `;
      DOM.categoryBars.appendChild(el);
    });
  }

  let insightText = "";
  if (totalExpenses === 0) {
    insightText = "✨ Start tracking expenses to get custom pocket insights on where your money goes!";
  } else if (netSavings < 0) {
    insightText = "🚨 Warning! Your spending exceeds your income this month. Review your 'Wants' and see if you can scale back to balance your budget.";
  } else if (wantsPct > 55) {
    insightText = "⚠️ You are spending over half of your budget on Wants. Try prioritizing Needs or boosting your savings buffer next month.";
  } else if (savingsPct >= 30) {
    insightText = "🎯 Awesome! You have saved more than 30% of your income. You are building wealth quickly. Keep it up!";
  } else {
    insightText = "💡 Balanced budget! Try to save a little extra next week by reviewing smaller miscellaneous items.";
  }
  DOM.insightBox.textContent = insightText;
}

// Render People View
let peopleFilter = "all";

function renderPeople() {
  const debts = state.summary ? state.summary.debts : { totalIOwe: 0, totalOwed: 0, netBalance: 0, isOwedToMe: true };
  
  DOM.totalIOwe.textContent = formatCurrency(debts.totalIOwe || 0);
  DOM.totalOwed.textContent = formatCurrency(debts.totalOwed || 0);
  DOM.peopleNet.textContent = formatCurrency(debts.netBalance || 0);

  DOM.peopleNetBanner.classList.remove("net-positive", "net-negative");
  const netLabelNode = DOM.peopleNetBanner.querySelector(".net-label");
  if (debts.isOwedToMe) {
    DOM.peopleNetBanner.classList.add("net-positive");
    if (netLabelNode) netLabelNode.textContent = "Net Balance (Owed to Me)";
  } else {
    DOM.peopleNetBanner.classList.add("net-negative");
    if (netLabelNode) netLabelNode.textContent = "Net Balance (I Owe)";
  }

  DOM.peopleTransactionsList.innerHTML = "";

  let filteredEntries = [...state.people];
  if (peopleFilter === "borrowed") {
    filteredEntries = filteredEntries.filter(e => e.type === "borrowed");
  } else if (peopleFilter === "spent") {
    filteredEntries = filteredEntries.filter(e => e.type === "spent");
  }

  filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filteredEntries.length === 0) {
    DOM.peopleTransactionsList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 15px; font-weight: 500;">No transactions found</p>
        <p style="font-size: 13px; margin-top: 4px; opacity: 0.8;">Tap + to add a people entry!</p>
      </div>
    `;
    return;
  }

  filteredEntries.forEach(item => {
    const el = document.createElement("div");
    el.className = "expense-item";
    el.addEventListener("click", () => openEditPeopleModal(item));

    const initial = item.person ? item.person.charAt(0).toUpperCase() : "?";
    const repaid = item.repaidAmount || 0;
    const remaining = item.remaining !== undefined ? item.remaining : Math.max(0, item.amount - repaid);
    const status = item.status || (repaid >= item.amount ? 'paid' : (repaid > 0 ? 'partial' : 'pending'));
    
    let statusLabel = "Pending";
    if (status === "paid") statusLabel = "Paid";
    else if (status === "partial") statusLabel = "Partially Paid";

    const typeLabel = item.type === "borrowed" ? "Borrowed" : "Spent for Others";
    const amountPrefix = item.type === "borrowed" ? "&minus; " : "&plus; ";
    const amountClass = item.type === "borrowed" ? "expense" : "income";

    el.innerHTML = `
      <div class="expense-item-left">
        <div class="category-avatar ${item.type}">${initial}</div>
        <div class="expense-item-info">
          <span class="expense-item-category">${item.person}</span>
          <span class="expense-item-meta">
            <span class="expense-item-date">${formatTransactionDate(item.date)}</span>
            <span class="meta-divider">&bull;</span>
            <span class="expense-item-note">${typeLabel} &bull; ${item.note || 'No note'}</span>
          </span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <span class="expense-item-amount ${amountClass}">${amountPrefix}${formatCurrency(item.amount)}</span>
        <span class="expense-item-meta" style="font-size: 11px; margin-top: 2px;">
          ${status === 'paid' ? 'Fully Repaid' : 'Pending: ' + formatCurrency(remaining)}
        </span>
        <span class="expense-item-badge badge-${status}">${statusLabel}</span>
      </div>
    `;

    DOM.peopleTransactionsList.appendChild(el);
  });
}

// --- 7. MODALS TRANSITIONS ---
function openModal(modalEl) {
  modalEl.style.display = "block";
  modalEl.offsetHeight;
  modalEl.classList.add("active");
}

function closeModal(modalEl) {
  modalEl.classList.remove("active");
  setTimeout(() => {
    modalEl.style.display = "none";
  }, 300);
}

function openAddExpenseModal() {
  DOM.expenseForm.reset();
  DOM.expenseId.value = "";
  DOM.expenseTitle.textContent = "Add Expense";
  DOM.expenseDatetime.value = getLocalISODateTime();
  
  DOM.expenseType.value = "need";
  DOM.btnTypeNeed.classList.add("active");
  DOM.btnTypeWant.classList.remove("active");

  DOM.expenseActions.innerHTML = `
    <button type="submit" class="btn btn-primary">Save Expense</button>
  `;

  openModal(DOM.expenseModal);
}

function openEditExpenseModal(expense) {
  DOM.expenseId.value = expense.id;
  DOM.expenseTitle.textContent = "Edit Expense";
  DOM.expenseAmount.value = expense.amount;
  DOM.expenseCategory.value = expense.category;
  DOM.expenseNote.value = expense.note || "";
  DOM.expenseDatetime.value = formatForDatetimeInput(expense.datetime);

  DOM.expenseType.value = expense.type;
  if (expense.type === "need") {
    DOM.btnTypeNeed.classList.add("active");
    DOM.btnTypeWant.classList.remove("active");
  } else {
    DOM.btnTypeNeed.classList.remove("active");
    DOM.btnTypeWant.classList.add("active");
  }

  DOM.expenseActions.innerHTML = `
    <button type="button" class="btn btn-danger" id="btn-delete-expense">Delete</button>
    <button type="submit" class="btn btn-primary">Save Changes</button>
  `;

  document.getElementById("btn-delete-expense").addEventListener("click", () => {
    handleDeleteExpense(expense.id);
  });

  openModal(DOM.expenseModal);
}

function openAddIncomeModal() {
  DOM.incomeForm.reset();
  DOM.incomeDatetime.value = getLocalISODateTime();
  openModal(DOM.incomeModal);
}

function openAddPeopleModal(defaultType = "borrowed") {
  DOM.peopleForm.reset();
  DOM.peopleId.value = "";
  DOM.peopleTitle.textContent = defaultType === "borrowed" ? "Add I Owe Entry" : "Add Owed to Me Entry";
  
  DOM.peopleDatetime.value = getLocalISODateTime();
  DOM.peopleType.value = defaultType;
  if (defaultType === "borrowed") {
    DOM.btnPeopleTypeBorrowed.classList.add("active");
    DOM.btnPeopleTypeSpent.classList.remove("active");
  } else {
    DOM.btnPeopleTypeBorrowed.classList.remove("active");
    DOM.btnPeopleTypeSpent.classList.add("active");
  }
  DOM.peopleRepaidAmount.value = "0.00";

  DOM.peopleActions.innerHTML = `
    <button type="submit" class="btn btn-primary">Save Entry</button>
  `;

  openModal(DOM.peopleModal);
}

function openEditPeopleModal(entry) {
  DOM.peopleId.value = entry.id;
  DOM.peopleTitle.textContent = "Edit People Entry";
  DOM.peoplePersonName.value = entry.person;
  DOM.peopleAmount.value = entry.amount;
  DOM.peopleRepaidAmount.value = entry.repaidAmount || 0;
  DOM.peopleNote.value = entry.note || "";
  DOM.peopleDatetime.value = formatForDatetimeInput(entry.date);

  DOM.peopleType.value = entry.type;
  if (entry.type === "borrowed") {
    DOM.btnPeopleTypeBorrowed.classList.add("active");
    DOM.btnPeopleTypeSpent.classList.remove("active");
  } else {
    DOM.btnPeopleTypeBorrowed.classList.remove("active");
    DOM.btnPeopleTypeSpent.classList.add("active");
  }

  DOM.peopleActions.innerHTML = `
    <button type="button" class="btn btn-danger" id="btn-delete-people">Delete</button>
    <button type="submit" class="btn btn-primary">Save Changes</button>
  `;

  document.getElementById("btn-delete-people").addEventListener("click", () => {
    handleDeletePeople(entry.id);
  });

  openModal(DOM.peopleModal);
}

// --- 8. ASYNC FORM HANDLERS & BACKEND CALLS ---

// Expense Submit
DOM.expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = DOM.expenseId.value;
  const amount = parseFloat(DOM.expenseAmount.value);
  const category = DOM.expenseCategory.value;
  const note = DOM.expenseNote.value.trim();
  const datetime = DOM.expenseDatetime.value;
  const type = DOM.expenseType.value;

  if (isNaN(amount) || amount <= 0) return;

  try {
    if (id) {
      await API.updateExpense(id, { amount, category, note, datetime, type });
    } else {
      await API.createExpense({ amount, category, note, datetime, type });
    }

    closeModal(DOM.expenseModal);
    await loadStateFromBackend();
    switchView(state.currentView);
  } catch (err) {
    alert(`Error saving expense: ${err.message}`);
  }
});

// Expense Delete
async function handleDeleteExpense(id) {
  try {
    await API.deleteExpense(id);
    closeModal(DOM.expenseModal);
    await loadStateFromBackend();
    switchView(state.currentView);
  } catch (err) {
    alert(`Error deleting expense: ${err.message}`);
  }
}

// Income Submit
DOM.incomeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const amount = parseFloat(DOM.incomeAmount.value);
  const note = DOM.incomeNote.value.trim();
  const datetime = DOM.incomeDatetime.value;

  if (isNaN(amount) || amount <= 0) return;

  try {
    await API.createIncome({ amount, note, datetime });
    closeModal(DOM.incomeModal);
    await loadStateFromBackend();
    switchView(state.currentView);
  } catch (err) {
    alert(`Error adding income: ${err.message}`);
  }
});

// Income Delete
async function handleDeleteIncome(id) {
  try {
    await API.deleteIncome(id);
    await loadStateFromBackend();
    switchView(state.currentView);
  } catch (err) {
    alert(`Error deleting income: ${err.message}`);
  }
}

// People Submit
DOM.peopleForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = DOM.peopleId.value;
  const type = DOM.peopleType.value;
  const person = DOM.peoplePersonName.value.trim();
  const amount = parseFloat(DOM.peopleAmount.value);
  const repaidAmount = parseFloat(DOM.peopleRepaidAmount.value) || 0;
  const date = DOM.peopleDatetime.value;
  const note = DOM.peopleNote.value.trim();

  if (isNaN(amount) || amount <= 0) return;
  if (repaidAmount < 0) return;
  if (repaidAmount > amount) {
    alert("Repaid amount cannot be greater than the total amount.");
    return;
  }

  try {
    if (id) {
      await API.updatePeople(id, { type, person, amount, repaidAmount, date, note });
    } else {
      await API.createPeople({ type, person, amount, repaidAmount, date, note });
    }

    closeModal(DOM.peopleModal);
    await loadStateFromBackend();
    switchView(state.currentView);
  } catch (err) {
    alert(`Error saving entry: ${err.message}`);
  }
});

// People Delete
async function handleDeletePeople(id) {
  try {
    await API.deletePeople(id);
    closeModal(DOM.peopleModal);
    await loadStateFromBackend();
    switchView(state.currentView);
  } catch (err) {
    alert(`Error deleting entry: ${err.message}`);
  }
}

// --- 9. EVENT LISTENERS SETUP ---
function setupListeners() {
  DOM.navDashboard.addEventListener("click", () => switchView("dashboard"));
  DOM.navHistory.addEventListener("click", () => switchView("history"));
  DOM.navAnalytics.addEventListener("click", () => switchView("analytics"));
  DOM.navPeople.addEventListener("click", () => switchView("people"));
  DOM.viewAllHistory.addEventListener("click", () => switchView("history"));
  DOM.viewAllPeople.addEventListener("click", () => switchView("people"));
  DOM.cardIOwe.addEventListener("click", () => openAddPeopleModal("borrowed"));
  DOM.cardOwedToMe.addEventListener("click", () => openAddPeopleModal("spent"));

  DOM.btnOpenExpense.addEventListener("click", () => {
    if (state.currentView === "people") {
      openAddPeopleModal();
    } else {
      openAddExpenseModal();
    }
  });
  DOM.btnCloseExpense.addEventListener("click", () => closeModal(DOM.expenseModal));
  
  DOM.btnOpenIncome.addEventListener("click", openAddIncomeModal);
  DOM.btnCloseIncome.addEventListener("click", () => closeModal(DOM.incomeModal));
  DOM.btnCancelIncome.addEventListener("click", () => closeModal(DOM.incomeModal));

  DOM.btnClosePeople.addEventListener("click", () => closeModal(DOM.peopleModal));

  DOM.expenseModal.addEventListener("click", (e) => {
    if (e.target === DOM.expenseModal) closeModal(DOM.expenseModal);
  });
  DOM.incomeModal.addEventListener("click", (e) => {
    if (e.target === DOM.incomeModal) closeModal(DOM.incomeModal);
  });
  DOM.peopleModal.addEventListener("click", (e) => {
    if (e.target === DOM.peopleModal) closeModal(DOM.peopleModal);
  });

  DOM.btnTypeNeed.addEventListener("click", () => {
    DOM.expenseType.value = "need";
    DOM.btnTypeNeed.classList.add("active");
    DOM.btnTypeWant.classList.remove("active");
  });
  DOM.btnTypeWant.addEventListener("click", () => {
    DOM.expenseType.value = "want";
    DOM.btnTypeNeed.classList.remove("active");
    DOM.btnTypeWant.classList.add("active");
  });

  DOM.btnPeopleTypeBorrowed.addEventListener("click", () => {
    DOM.peopleType.value = "borrowed";
    DOM.btnPeopleTypeBorrowed.classList.add("active");
    DOM.btnPeopleTypeSpent.classList.remove("active");
  });
  DOM.btnPeopleTypeSpent.addEventListener("click", () => {
    DOM.peopleType.value = "spent";
    DOM.btnPeopleTypeBorrowed.classList.remove("active");
    DOM.btnPeopleTypeSpent.classList.add("active");
  });

  DOM.btnPeopleMarkFullyPaid.addEventListener("click", () => {
    const totalAmount = parseFloat(DOM.peopleAmount.value) || 0;
    DOM.peopleRepaidAmount.value = totalAmount > 0 ? totalAmount.toFixed(2) : "0.00";
  });

  DOM.searchField.addEventListener("input", renderHistory);

  DOM.filterTagsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-tag");
    if (!btn) return;
    DOM.filterTagsContainer.querySelectorAll(".filter-tag").forEach(tag => tag.classList.remove("active"));
    btn.classList.add("active");
    historyFilter = btn.dataset.filter;
    renderHistory();
  });

  DOM.peopleFilterTags.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-tag");
    if (!btn) return;
    DOM.peopleFilterTags.querySelectorAll(".filter-tag").forEach(tag => tag.classList.remove("active"));
    btn.classList.add("active");
    peopleFilter = btn.dataset.peopleFilter;
    renderPeople();
  });

  DOM.profileTrigger.addEventListener("click", async () => {
    const newName = prompt("Rename your pocket account profile name:", state.userName);
    if (newName && newName.trim()) {
      try {
        const updated = await API.updateProfile(newName.trim());
        state.userName = updated.username;
        document.getElementById("username-display").textContent = state.userName;
      } catch (err) {
        alert(`Failed to update profile: ${err.message}`);
      }
    }
  });
}

// --- 10. APP INITIALIZATION ---
async function initApp() {
  setupListeners();
  
  document.getElementById("greeting-time").textContent = "Hey";
  
  // 1. One-time migration if old localStorage records exist
  await checkAndMigrateLegacyLocalStorage();
  
  // 2. Load latest state from SQLite backend
  await loadStateFromBackend();
  
  // 3. Render initial view
  switchView("dashboard");
}

document.addEventListener("DOMContentLoaded", initApp);
if (document.readyState === "interactive" || document.readyState === "complete") {
  initApp();
}
