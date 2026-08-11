/* ==========================================================================
   DRIVEWELL DMS — app
   ========================================================================== */

const CFG = window.DRIVEWELL_CONFIG || {};
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ==========================================================================
   1. IDENTITY
   The persona is stored in localStorage and applied on load, so switching
   reloads the page. That guarantees Guides re-evaluate targeting cleanly
   instead of relying on a mid-session refresh.
   ========================================================================== */

const PERSONAS = CFG.PERSONAS || [];
const PERSONA_KEY = "drivewell_persona";

function currentPersona() {
  const saved = localStorage.getItem(PERSONA_KEY);
  return PERSONAS.find(p => p.id === saved) || PERSONAS[0];
}

function switchPersona(id) {
  localStorage.setItem(PERSONA_KEY, id);
  if (window.amplitude?.reset) window.amplitude.reset();
  location.reload();
}

const PERSONA = currentPersona();

/* ==========================================================================
   2. AMPLITUDE
   ========================================================================== */

/* Central tracking. Every event also renders in the feed panel so the
   analytics connection is visible on screen during a demo. */
function track(eventName, props = {}) {
  const payload = { ...props, store_id: PERSONA.properties.store_id };
  if (window.amplitude?.track) window.amplitude.track(eventName, payload);
  pushFeed(eventName, payload);
}

/* Central tracking. Every event also renders in the feed panel so the
   analytics connection is visible on screen during a demo. */
function track(eventName, props = {}) {
  const payload = { ...props, store_id: PERSONA.properties.store_id };
  if (window.amplitude?.track) window.amplitude.track(eventName, payload);
  pushFeed(eventName, payload);
}

/* ==========================================================================
   3. EVENT FEED
   ========================================================================== */

function pushFeed(name, props) {
  const list = $("#feedList");
  if (!list) return;
  const empty = $(".feed-empty", list);
  if (empty) empty.remove();

  const keys = Object.keys(props).filter(k => k !== "store_id");
  const item = document.createElement("div");
  item.className = "feed-item";
  item.innerHTML =
    `<div class="feed-name">${escapeHTML(name)}</div>` +
    (keys.length
      ? `<div class="feed-props">${keys.slice(0, 3)
          .map(k => `${escapeHTML(k)}: ${escapeHTML(String(props[k]))}`)
          .join(" · ")}</div>`
      : "");
  list.prepend(item);

  while (list.children.length > 26) list.lastElementChild.remove();
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ==========================================================================
   4. DATA
   ========================================================================== */

const DEALS = [
  { id: "D-4417", name: "J. Okafor",      vehicle: "Pre-owned Vante",     terms: "financing",        status: "Desking",       amount: "$31.4k" },
  { id: "D-4421", name: "R. Castellanos", vehicle: "New Crest",           terms: "trade-in pending", status: "New",           amount: "$44.9k" },
  { id: "D-4409", name: "D. Whitfield",   vehicle: "New Solo EV",         terms: "approved",         status: "Ready to sign", amount: "$52.2k" },
  { id: "D-4402", name: "P. Nakamura",    vehicle: "2022 Meridian Crest", terms: "lease",            status: "Desking",       amount: "$38.7k" },
  { id: "D-4396", name: "A. Boateng",     vehicle: "Pre-owned Solo EV",   terms: "cash",             status: "On hold",       amount: "$27.1k" }
];

const APPTS = [
  { time: "9:30",  what: "Oil & tire rotation", who: "2021 Meridian Vante · M. Alvarez" },
  { time: "10:15", what: "Test drive",          who: "Pre-owned · J. Okafor" },
  { time: "11:00", what: "Brake inspection",    who: "2019 Meridian Crest · T. Boone" },
  { time: "13:45", what: "Delivery",            who: "New Solo EV · D. Whitfield" },
  { time: "15:20", what: "Multi-point",         who: "2020 Crest · L. Ferreira" }
];

const ROS = [
  { ro: "RO-8841", vehicle: "2021 Meridian Vante", advisor: "T. Boone",   status: "In progress", hours: "1.8" },
  { ro: "RO-8838", vehicle: "2019 Meridian Crest", advisor: "T. Boone",   status: "Waiting parts", hours: "0.4" },
  { ro: "RO-8830", vehicle: "2022 Solo EV",        advisor: "K. Iyer",    status: "Ready",       hours: "3.2" },
  { ro: "RO-8827", vehicle: "2018 Vante",          advisor: "K. Iyer",    status: "In progress", hours: "2.1" }
];

const PARTS = [
  { sku: "MRD-4410-B", desc: "Brake pad set · front", onhand: 14, committed: 6,  status: "OK" },
  { sku: "MRD-2213-A", desc: "Cabin air filter",      onhand: 3,  committed: 3,  status: "Reorder" },
  { sku: "SOL-9902-E", desc: "EV charge port cover",  onhand: 0,  committed: 2,  status: "Backorder" },
  { sku: "MRD-7781-C", desc: "Wiper blade · 24in",    onhand: 46, committed: 4,  status: "OK" }
];

const CUSTOMERS = [
  { name: "J. Okafor",      last: "Test drive · 2 days ago",  vehicles: 1, value: "$31.4k" },
  { name: "M. Alvarez",     last: "Service · today",          vehicles: 2, value: "$68.0k" },
  { name: "D. Whitfield",   last: "Deal open · today",        vehicles: 1, value: "$52.2k" },
  { name: "R. Castellanos", last: "Quote sent · 1 day ago",   vehicles: 3, value: "$112.6k" },
  { name: "L. Ferreira",    last: "Service · 6 days ago",     vehicles: 1, value: "$24.8k" }
];

const pillClass = s => ({
  "New": "pill-new", "Desking": "pill-desk",
  "Ready to sign": "pill-ready", "On hold": "pill-hold"
}[s] || "pill-hold");

/* ==========================================================================
   5. VIEWS
   ========================================================================== */

const VIEWS = {

  dashboard: () => `
    <div class="view-head">
      <div>
        <h1 class="view-title">Today at ${PERSONA.properties.store_name}</h1>
        <p class="view-sub">Tuesday · live store activity</p>
      </div>
      <button class="btn btn-primary" data-action="new-deal" data-guide="start-new-deal">
        Start new deal
      </button>
    </div>

    <div class="kpis">
      <div class="kpi" data-guide="kpi-appointments">
        <div class="kpi-label">Appointments today</div>
        <div class="kpi-value">38</div>
        <div class="kpi-delta up">▲ 6 vs. yesterday</div>
      </div>
      <div class="kpi" data-guide="kpi-repair-orders">
        <div class="kpi-label">Open repair orders</div>
        <div class="kpi-value">21</div>
        <div class="kpi-delta down">▼ 3 vs. yesterday</div>
      </div>
      <div class="kpi" data-guide="kpi-gross">
        <div class="kpi-label">MTD front gross</div>
        <div class="kpi-value">$284.6k</div>
        <div class="kpi-delta up">▲ 11% vs. last mo.</div>
      </div>
      <div class="kpi" data-guide="kpi-active-deals">
        <div class="kpi-label">Active deals</div>
        <div class="kpi-value">12</div>
        <div class="kpi-delta up">▲ 2 vs. yesterday</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card" data-guide="working-deals">
        <div class="card-head">
          <span class="card-title">Sales desk · working deals</span>
          <a class="card-link" href="#" data-action="goto-salesdesk">View all</a>
        </div>
        <div class="card-body">
          ${DEALS.slice(0, 4).map(d => `
            <div class="row" data-action="open-deal" data-deal="${d.id}">
              <div class="row-tag">DEAL</div>
              <div class="row-main">
                <div class="row-name">${d.name}</div>
                <div class="row-meta">${d.vehicle} · ${d.terms}</div>
              </div>
              <span class="pill ${pillClass(d.status)}">${d.status}</span>
              <span class="row-amt">${d.amount}</span>
            </div>`).join("")}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card" data-guide="next-up">
          <div class="card-head"><span class="card-title">Next up</span></div>
          <div class="card-body">
            ${APPTS.slice(0, 4).map(a => `
              <div class="row">
                <span class="row-time">${a.time}</span>
                <div class="row-main">
                  <div class="row-name">${a.what}</div>
                  <div class="row-meta">${a.who}</div>
                </div>
              </div>`).join("")}
          </div>
        </div>

        <div class="card" data-guide="quick-actions">
          <div class="card-head"><span class="card-title">Quick actions</span></div>
          <div class="qa-list">
            <button class="qa" data-action="schedule-appt" data-guide="qa-appointment">
              <span class="qa-ico">＋</span> Schedule appointment
            </button>
            <button class="qa" data-action="lookup-customer" data-guide="qa-lookup">
              <span class="qa-ico">⌕</span> Look up customer
            </button>
            <button class="qa" data-action="order-part" data-guide="qa-part">
              <span class="qa-ico">▤</span> Order a part
            </button>
          </div>
        </div>
      </div>
    </div>`,

  salesdesk: () => `
    <div class="view-head">
      <div>
        <h1 class="view-title">Sales desk</h1>
        <p class="view-sub">${DEALS.length} working deals · ${PERSONA.properties.store_name}</p>
      </div>
      <button class="btn btn-primary" data-action="new-deal" data-guide="start-new-deal">
        Start new deal
      </button>
    </div>

    <div class="card" data-guide="deals-table">
      <table class="tbl">
        <thead><tr>
          <th>Deal</th><th>Customer</th><th>Vehicle</th><th>Terms</th><th>Status</th><th>Amount</th>
        </tr></thead>
        <tbody>
          ${DEALS.map(d => `
            <tr data-action="open-deal" data-deal="${d.id}" style="cursor:pointer">
              <td class="num">${d.id}</td>
              <td style="font-weight:600">${d.name}</td>
              <td>${d.vehicle}</td>
              <td style="color:var(--ink-2)">${d.terms}</td>
              <td><span class="pill ${pillClass(d.status)}">${d.status}</span></td>
              <td class="num">${d.amount}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`,

  service: () => `
    <div class="view-head">
      <div>
        <h1 class="view-title">Service</h1>
        <p class="view-sub">${ROS.length} open repair orders · 38 appointments today</p>
      </div>
      <button class="btn btn-primary" data-action="schedule-appt" data-guide="service-schedule">
        Schedule appointment
      </button>
    </div>

    <div class="grid-2">
      <div class="card" data-guide="ro-table">
        <div class="card-head"><span class="card-title">Open repair orders</span></div>
        <table class="tbl">
          <thead><tr><th>RO</th><th>Vehicle</th><th>Advisor</th><th>Status</th><th>Hrs</th></tr></thead>
          <tbody>
            ${ROS.map(r => `
              <tr>
                <td class="num">${r.ro}</td>
                <td>${r.vehicle}</td>
                <td style="color:var(--ink-2)">${r.advisor}</td>
                <td><span class="pill ${r.status === "Ready" ? "pill-ready" : r.status === "Waiting parts" ? "pill-desk" : "pill-new"}">${r.status}</span></td>
                <td class="num">${r.hours}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="card" data-guide="service-schedule-card">
        <div class="card-head"><span class="card-title">Today's schedule</span></div>
        <div class="card-body">
          ${APPTS.map(a => `
            <div class="row">
              <span class="row-time">${a.time}</span>
              <div class="row-main">
                <div class="row-name">${a.what}</div>
                <div class="row-meta">${a.who}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>`,

  parts: () => `
    <div class="view-head">
      <div>
        <h1 class="view-title">Parts</h1>
        <p class="view-sub">2 lines need attention</p>
      </div>
      <button class="btn btn-primary" data-action="order-part" data-guide="parts-order">
        Order a part
      </button>
    </div>

    <div class="card" data-guide="parts-table">
      <table class="tbl">
        <thead><tr><th>SKU</th><th>Description</th><th>On hand</th><th>Committed</th><th>Status</th></tr></thead>
        <tbody>
          ${PARTS.map(p => `
            <tr>
              <td class="num">${p.sku}</td>
              <td>${p.desc}</td>
              <td class="num">${p.onhand}</td>
              <td class="num">${p.committed}</td>
              <td><span class="pill ${p.status === "OK" ? "pill-ready" : p.status === "Reorder" ? "pill-desk" : "pill-hold"}">${p.status}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`,

  customers: () => `
    <div class="view-head">
      <div>
        <h1 class="view-title">Customers</h1>
        <p class="view-sub">${CUSTOMERS.length} recent · ${PERSONA.properties.store_name}</p>
      </div>
      <button class="btn btn-primary" data-action="lookup-customer" data-guide="customers-lookup">
        Look up customer
      </button>
    </div>

    <div class="card" data-guide="customers-table">
      <table class="tbl">
        <thead><tr><th>Customer</th><th>Last activity</th><th>Vehicles</th><th>Lifetime value</th></tr></thead>
        <tbody>
          ${CUSTOMERS.map(c => `
            <tr>
              <td style="font-weight:600">${c.name}</td>
              <td style="color:var(--ink-2)">${c.last}</td>
              <td class="num">${c.vehicles}</td>
              <td class="num">${c.value}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`,

  reports: () => `
    <div class="view-head">
      <div>
        <h1 class="view-title">Reports</h1>
        <p class="view-sub">Deal workflow completion · last 30 days</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card" data-guide="funnel-card">
        <div class="card-head"><span class="card-title">Deal workflow · completion by step</span></div>
        <div class="bars">
          <div class="bar-row">
            <span class="bar-label">Dashboard opened</span>
            <div class="bar-track"><div class="bar-fill" style="width:100%"></div></div>
            <span class="bar-val">1,903</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Deal started</span>
            <div class="bar-track"><div class="bar-fill" style="width:47%"></div></div>
            <span class="bar-val">891</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Deal created</span>
            <div class="bar-track"><div class="bar-fill" style="width:34%"></div></div>
            <span class="bar-val">655</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Ready to sign</span>
            <div class="bar-track"><div class="bar-fill" style="width:25%"></div></div>
            <span class="bar-val">483</span>
          </div>
        </div>
      </div>

      <div class="card" data-guide="tenure-card">
        <div class="card-head"><span class="card-title">Completion by tenure</span></div>
        <div class="bars">
          <div class="bar-row">
            <span class="bar-label">Under 90 days</span>
            <div class="bar-track"><div class="bar-fill warn" style="width:44%"></div></div>
            <span class="bar-val">44%</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">90–240 days</span>
            <div class="bar-track"><div class="bar-fill" style="width:63%"></div></div>
            <span class="bar-val">63%</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Over 240 days</span>
            <div class="bar-track"><div class="bar-fill" style="width:79%"></div></div>
            <span class="bar-val">79%</span>
          </div>
        </div>
        <div class="card-pad" style="padding-top:0">
          <div class="note">
            <b>New hires fall out of the deal workflow at nearly double the rate.</b>
            Same software, same store — the gap is knowing where to go next.
          </div>
        </div>
      </div>
    </div>`
};

const TITLES = {
  dashboard: "Dashboard", salesdesk: "Sales Desk", service: "Service",
  parts: "Parts", customers: "Customers", reports: "Reports"
};

let activeView = "dashboard";

function render(view) {
  activeView = view;
  $("#canvas").innerHTML = VIEWS[view]();
  $("#crumbCurrent").textContent = TITLES[view];
  $$(".nav-item").forEach(b => b.classList.toggle("is-active", b.dataset.view === view));
  window.scrollTo({ top: 0 });

  track("Page Viewed", { page_name: TITLES[view] });
  if (view === "dashboard") track("Dashboard Viewed", { surface: "dashboard" });
}

/* ==========================================================================
   6. DEAL WIZARD
   ========================================================================== */

const wiz = { step: 1, data: {} };

const VEHICLES = [
  { name: "New Crest",           meta: "Stock #4471 · $44,900" },
  { name: "New Solo EV",         meta: "Stock #4489 · $52,200" },
  { name: "Pre-owned Vante",     meta: "Stock #3312 · $31,400" },
  { name: "2022 Meridian Crest", meta: "Stock #3298 · $38,700" }
];

const WIZ_STEPS = {
  1: {
    title: "Customer",
    hint: "Step 1 of 4",
    html: () => `
      <div class="field">
        <label class="field-label" for="custName">Customer name</label>
        <input class="field-input" id="custName" data-guide="wiz-customer-name"
               placeholder="Start typing to search existing customers" value="${wiz.data.customer || ""}">
        <div class="field-help">Searches your CRM before creating a new record.</div>
      </div>
      <div class="field-2">
        <div class="field">
          <label class="field-label" for="custPhone">Phone</label>
          <input class="field-input" id="custPhone" placeholder="(555) 000-0000">
        </div>
        <div class="field">
          <label class="field-label" for="custSource">Lead source</label>
          <select class="field-select" id="custSource" data-guide="wiz-lead-source">
            <option>Walk-in</option><option>OEM referral</option>
            <option>Website</option><option>Repeat customer</option>
          </select>
        </div>
      </div>`
  },
  2: {
    title: "Vehicle",
    hint: "Step 2 of 4",
    html: () => `
      <div class="field">
        <label class="field-label">Select from inventory</label>
        <div class="opt-grid" data-guide="wiz-vehicle-grid">
          ${VEHICLES.map(v => `
            <button class="opt ${wiz.data.vehicle === v.name ? "is-sel" : ""}" data-vehicle="${v.name}">
              <div class="opt-name">${v.name}</div>
              <div class="opt-meta">${v.meta}</div>
            </button>`).join("")}
        </div>
      </div>`
  },
  3: {
    title: "Trade & terms",
    hint: "Step 3 of 4",
    html: () => `
      <div class="field-2">
        <div class="field">
          <label class="field-label" for="dealType">Deal type</label>
          <select class="field-select" id="dealType" data-guide="wiz-deal-type">
            <option>New</option><option>Pre-owned</option><option>Certified Pre-owned</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="finType">Finance type</label>
          <select class="field-select" id="finType" data-guide="wiz-finance-type">
            <option>Financing</option><option>Lease</option><option>Cash</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="tradeIn">Trade-in</label>
        <select class="field-select" id="tradeIn" data-guide="wiz-trade">
          <option>No trade-in</option><option>Trade-in pending appraisal</option>
          <option>Trade-in appraised</option>
        </select>
        <div class="field-help">Pending appraisals hold the deal at desking until valued.</div>
      </div>`
  },
  4: {
    title: "Review",
    hint: "Last step",
    html: () => `
      <div class="review-list" data-guide="wiz-review">
        <div class="review-row"><span class="review-k">Customer</span><span class="review-v">${wiz.data.customer || "New customer"}</span></div>
        <div class="review-row"><span class="review-k">Vehicle</span><span class="review-v">${wiz.data.vehicle || "—"}</span></div>
        <div class="review-row"><span class="review-k">Deal type</span><span class="review-v">${wiz.data.dealType || "New"}</span></div>
        <div class="review-row"><span class="review-k">Finance</span><span class="review-v">${wiz.data.finType || "Financing"}</span></div>
        <div class="review-row"><span class="review-k">Trade-in</span><span class="review-v">${wiz.data.tradeIn || "No trade-in"}</span></div>
        <div class="review-row total"><span class="review-k">Estimated amount</span><span class="review-v">${wiz.data.amount || "$44,900"}</span></div>
      </div>
      <div class="note" style="margin-top:14px">
        Creating the deal sends it to the sales desk and notifies the desk manager.
      </div>`
  }
};

function openWizard() {
  wiz.step = 1;
  wiz.data = {};
  $("#dealVeil").hidden = false;
  paintWizard();
  track("Start New Deal Clicked", { entry_point: activeView });
}

function closeWizard(completed = false) {
  $("#dealVeil").hidden = true;
  if (!completed && wiz.step < 4) {
    track("Deal Abandoned", { last_step: wiz.step, step_name: WIZ_STEPS[wiz.step].title });
  }
}

function paintWizard() {
  const s = WIZ_STEPS[wiz.step];
  $("#wizTitle").textContent = s.title;
  $("#wizHint").textContent = s.hint;
  $("#wizBody").innerHTML = s.html();
  $("#wizBack").disabled = wiz.step === 1;
  $("#wizNext").textContent = wiz.step === 4 ? "Create deal" : "Continue";

  $$(".wstep").forEach(el => {
    const n = Number(el.dataset.step);
    el.classList.toggle("is-current", n === wiz.step);
    el.classList.toggle("is-done", n < wiz.step);
  });

  $$("[data-vehicle]").forEach(btn => {
    btn.addEventListener("click", () => {
      wiz.data.vehicle = btn.dataset.vehicle;
      const v = VEHICLES.find(x => x.name === btn.dataset.vehicle);
      wiz.data.amount = v ? "$" + v.meta.split("$")[1] : "$44,900";
      $$("[data-vehicle]").forEach(b => b.classList.toggle("is-sel", b === btn));
      track("Vehicle Selected", { vehicle: btn.dataset.vehicle });
    });
  });
}

function captureStep() {
  if (wiz.step === 1) wiz.data.customer = $("#custName")?.value.trim() || "";
  if (wiz.step === 3) {
    wiz.data.dealType = $("#dealType")?.value;
    wiz.data.finType  = $("#finType")?.value;
    wiz.data.tradeIn  = $("#tradeIn")?.value;
  }
}

function wizardNext() {
  captureStep();

  track("Deal Step Completed", {
    step_number: wiz.step,
    step_name: WIZ_STEPS[wiz.step].title
  });

  if (wiz.step < 4) {
    wiz.step++;
    paintWizard();
    return;
  }

  track("Deal Created", {
    vehicle: wiz.data.vehicle || "New Crest",
    deal_type: wiz.data.dealType || "New",
    finance_type: wiz.data.finType || "Financing",
    trade_in: wiz.data.tradeIn || "No trade-in",
    deal_amount: Number((wiz.data.amount || "$44,900").replace(/[^0-9.]/g, ""))
  });

  closeWizard(true);
  toast("Deal created and sent to the sales desk");

  const badge = $("#navDealCount");
  badge.textContent = Number(badge.textContent) + 1;
}

/* ==========================================================================
   7. TOASTS
   ========================================================================== */

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="toast-check">✓</span> ${escapeHTML(msg)}`;
  $("#toastStack").appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 220);
  }, 3000);
}

/* ==========================================================================
   8. WIRING
   ========================================================================== */

function wire() {
  // Nav
  $("#nav").addEventListener("click", e => {
    const btn = e.target.closest(".nav-item");
    if (btn) render(btn.dataset.view);
  });

  // Delegated actions across all views
  $("#canvas").addEventListener("click", e => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    e.preventDefault();

    switch (el.dataset.action) {
      case "new-deal":        openWizard(); break;
      case "goto-salesdesk":  render("salesdesk"); break;
      case "open-deal": {
        const deal = DEALS.find(d => d.id === el.dataset.deal);
        track("Deal Opened", { deal_id: el.dataset.deal, deal_status: deal?.status });
        // Completes the last funnel step live, so the full funnel is
        // reachable by clicking rather than only from seeded data.
        if (deal?.status === "Ready to sign") {
          track("Deal Ready To Sign", { deal_id: deal.id, vehicle: deal.vehicle });
        }
        toast(`Opened deal ${el.dataset.deal}`);
        break;
      }
      case "schedule-appt":
        track("Appointment Scheduled", { appointment_type: "Test drive" });
        toast("Appointment scheduled");
        break;
      case "lookup-customer":
        track("Customer Looked Up", { source: activeView });
        toast("Customer lookup opened");
        break;
      case "order-part":
        track("Part Ordered", { sku: "MRD-2213-A" });
        toast("Part added to the next order");
        break;
    }
  });

  // Wizard
  $("#wizNext").addEventListener("click", wizardNext);
  $("#wizBack").addEventListener("click", () => {
    captureStep();
    if (wiz.step > 1) { wiz.step--; paintWizard(); }
  });
  $("#wizClose").addEventListener("click", () => closeWizard(false));
  $("#dealVeil").addEventListener("click", e => {
    if (e.target === $("#dealVeil")) closeWizard(false);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !$("#dealVeil").hidden) closeWizard(false);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
      e.preventDefault();
      toggleFeed($("#feed").hidden);
    }
  });

  // Event feed
  $("#feedClear").addEventListener("click", () => {
    $("#feedList").innerHTML = '<div class="feed-empty">Cleared.</div>';
  });
  $("#feedHide").addEventListener("click", () => toggleFeed(false));
  $("#feedReopen").addEventListener("click", () => toggleFeed(true));

  // Persona switcher
  const sel = $("#personaSelect");
  PERSONAS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} · ${p.label}`;
    opt.selected = p.id === PERSONA.id;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", e => switchPersona(e.target.value));
}

function toggleFeed(show) {
  $("#feed").hidden = !show;
  $("#feedReopen").hidden = show;
}

/* ==========================================================================
   9. BOOT
   ========================================================================== */

function paintIdentity() {
  const p = PERSONA.properties;
  $("#statusRole").textContent   = p.role;
  $("#statusStore").textContent  = p.store_id;
  $("#statusTenure").textContent = `${p.tenure_days}d (${p.tenure_band})`;
  $("#chipStore").textContent    = `${p.store_name} #${p.store_id.split("-")[1]}`;
  $("#avatarInitials").textContent = PERSONA.name.replace(/[^A-Z]/g, "").slice(0, 2);
  $("#projectLabel").textContent = CFG.PROJECT_LABEL || "";
}

function boot() {
  if (!PERSONAS.length) {
    document.body.innerHTML =
      '<p style="padding:40px;font-family:sans-serif">No personas configured. Check config.js.</p>';
    return;
  }
  paintIdentity();
  wire();
  toggleFeed(CFG.SHOW_EVENT_FEED !== false);
  render("dashboard");
  initAmplitude();
}

document.addEventListener("DOMContentLoaded", boot);
