/*
 * Gestión de Rentas · Demo estática
 * Reproduce las pantallas principales de Rentas Aurora (Laravel) con datos de ejemplo
 * guardados en localStorage. No se conecta a ningún servidor.
 */
(function () {
    "use strict";

    const STORAGE_KEY = "rentas-demo:v1";
    const SESSION_KEY = "rentas-demo:session";
    const DEMO_USER = { login: "demo", password: "demo", name: "Administrador Demo" };
    const app = document.getElementById("app");

    /* ------------------------------------------------------------------ */
    /* Utilidades                                                          */
    /* ------------------------------------------------------------------ */

    const pad = (n) => String(n).padStart(2, "0");
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
    const todayISO = () => toISO(new Date());
    const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
    const dueISO = (y, m, day) => `${y}-${pad(m)}-${pad(Math.min(day, daysInMonth(y, m)))}`;
    const addMonths = (y, m, n) => { const t = y * 12 + (m - 1) + n; return [Math.floor(t / 12), (t % 12) + 1]; };
    const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
    const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
    const fmtDate = (iso) => { if (!iso) return "—"; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
    const money = (n) => "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const monthLabel = (y, m) => { const s = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" }); const t = s.replace(" de ", " "); return t.charAt(0).toUpperCase() + t.slice(1); };
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const initial = (name) => esc(String(name || "?").trim().charAt(0).toUpperCase());

    const METHODS = { cash: "Efectivo", transfer: "Transferencia", deposit: "Depósito", other: "Otro" };
    const UNIT_TYPES = { room: "Cuarto", apartment: "Departamento", commercial: "Local", office: "Oficina", house: "Casa completa" };
    const STATUS = {
        current: "Al corriente",
        upcoming: "Próximo a vencer",
        late: "Atrasado",
        available: "Disponible"
    };

    const ICONS = {
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></svg>',
        building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 21V3h16v18M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M2 21h20"/></svg>',
        payments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
        bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.37.37.72.6 1 .3.34.68.55 1.1.6h.09v4h-.09a1.7 1.7 0 0 0-1.7.4Z"/></svg>',
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3v18h18M7 16l4-4 3 3 5-7"/></svg>',
        refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>',
        search: '<svg class="header-search-trigger__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
    };

    /* ------------------------------------------------------------------ */
    /* Datos de ejemplo                                                    */
    /* ------------------------------------------------------------------ */

    function buildSeed() {
        const now = new Date();
        const ty = now.getFullYear();
        const tm = now.getMonth() + 1;
        const today = todayISO();
        let seq = 1;
        const id = () => seq++;
        const startOn = (monthsAgo, day) => { const [y, m] = addMonths(ty, tm, -monthsAgo); return dueISO(y, m, day); };

        const properties = [];
        const units = [];
        const tenants = [];
        const contracts = [];
        const payments = [];
        const expenses = [];

        const addProperty = (data) => { const p = { id: id(), archived: false, ...data }; properties.push(p); return p; };
        const addUnit = (property, data) => { const u = { id: id(), propertyId: property.id, notes: "", ...data }; units.push(u); return u; };
        const addTenant = (data) => { const t = { id: id(), email: "", ine: "", emergencyName: "", emergencyPhone: "", notes: "", ...data }; tenants.push(t); return t; };

        function addContract(unit, tenant, { rent, day, deposit, monthsAgo, unpaid = 0, partial = 0, advancePartial = 0, pendingApproval = false, lateDays = 0 }) {
            const c = { id: id(), unitId: unit.id, tenantId: tenant.id, rent, paymentDay: day, deposit, startsOn: startOn(monthsAgo, day), status: "active", endedOn: null, notes: "" };
            contracts.push(c);

            const due = periodsFor(c, ty, tm).filter((p) => p.due <= today);
            due.forEach((p, i) => {
                const fromEnd = due.length - 1 - i;
                if (fromEnd < unpaid) return;
                const methods = ["transfer", "cash", "transfer", "deposit"];
                const base = { id: id(), contractId: c.id, year: p.year, month: p.month, method: methods[i % methods.length], notes: "", status: "approved", recordedBy: DEMO_USER.name, voided: null };
                const late = lateDays && i % 4 === 1 ? lateDays : 0;
                const received = late ? addDays(p.due, late) : addDays(p.due, -(i % 3));
                if (fromEnd === unpaid && partial) {
                    payments.push({ ...base, amount: partial, receivedOn: p.due <= today ? p.due : today, notes: "Abono de quincena, el resto queda pendiente." });
                } else if (fromEnd === unpaid && pendingApproval) {
                    payments.push({ ...base, amount: rent, receivedOn: p.due, method: "cash", status: "pending", recordedBy: "Pedro Salas", notes: "Cobrado en efectivo en la unidad." });
                } else {
                    payments.push({ ...base, amount: rent, receivedOn: received > today ? today : received });
                }
            });
            if (advancePartial) {
                const next = periodsFor(c, ty, tm).find((p) => p.due > today);
                if (next) payments.push({ id: id(), contractId: c.id, year: next.year, month: next.month, amount: advancePartial, receivedOn: addDays(today, -1), method: "transfer", notes: "Adelanto de quincena; el resto lo paga en la fecha límite.", status: "approved", recordedBy: DEMO_USER.name, voided: null });
            }
            return c;
        }

        const jardines = addProperty({ name: "Casa Jardines", type: "house", street: "Av. Jardines 214", city: "Zapopan, Jalisco", notes: "Casa de dos plantas con cochera para dos autos." });
        const jardinesUnit = addUnit(jardines, { name: "Casa completa", type: "house" });

        const aurora = addProperty({ name: "Edificio Aurora", type: "building", street: "Calle Hidalgo 88, Centro", city: "Guadalajara, Jalisco", notes: "" });
        const d101 = addUnit(aurora, { name: "Departamento 101", type: "apartment" });
        const d102 = addUnit(aurora, { name: "Departamento 102", type: "apartment" });
        const d201 = addUnit(aurora, { name: "Departamento 201", type: "apartment" });
        addUnit(aurora, { name: "Departamento 202", type: "apartment", notes: "Recién pintado. Listo para rentarse." });
        const localA = addUnit(aurora, { name: "Local A", type: "commercial" });
        const azotea = addUnit(aurora, { name: "Cuarto de azotea", type: "room" });

        const palmas = addProperty({ name: "Casa Las Palmas", type: "house", street: "Privada Las Palmas 12", city: "Tlaquepaque, Jalisco", notes: "" });
        const palmasUnit = addUnit(palmas, { name: "Casa completa", type: "house" });

        const mariana = addTenant({ name: "Mariana López Ruiz", phone: "33 1234 5678", email: "mariana.lopez@ejemplo.com", ine: "LORM900512", emergencyName: "Jorge López", emergencyPhone: "33 8765 4321" });
        const juan = addTenant({ name: "Juan Pérez Gómez", phone: "33 2345 6789", email: "juan.perez@ejemplo.com" });
        const sofia = addTenant({ name: "Sofía Hernández Vega", phone: "33 3456 7890" });
        const carlos = addTenant({ name: "Carlos Ramírez Ortiz", phone: "33 4567 8901", email: "carlos.ramirez@ejemplo.com" });
        const lupe = addTenant({ name: "Guadalupe Torres (Abarrotes Doña Lupe)", phone: "33 5678 9012", notes: "Negocio de abarrotes. Prefiere pagar en efectivo." });
        const diego = addTenant({ name: "Diego Martínez Luna", phone: "33 6789 0123" });
        const ana = addTenant({ name: "Ana Castillo Núñez", phone: "33 7890 1234", email: "ana.castillo@ejemplo.com" });
        addTenant({ name: "Laura Méndez Soto", phone: "33 8901 2345", notes: "Interesada en el Departamento 202." });

        addContract(jardinesUnit, mariana, { rent: 8500, day: 5, deposit: 8500, monthsAgo: 14 });
        addContract(d101, juan, { rent: 6200, day: 1, deposit: 6200, monthsAgo: 11, lateDays: 3 });
        addContract(d102, sofia, { rent: 6200, day: 10, deposit: 6200, monthsAgo: 8, unpaid: 1 });
        addContract(d201, carlos, { rent: 6800, day: 15, deposit: 6800, monthsAgo: 6, advancePartial: 3000 });
        addContract(localA, lupe, { rent: 9500, day: 3, deposit: 19000, monthsAgo: 18, unpaid: 2 });
        addContract(azotea, diego, { rent: 3200, day: 28, deposit: 3200, monthsAgo: 5, pendingApproval: true });
        addContract(palmasUnit, ana, { rent: 7200, day: Math.min(28, now.getDate() + 3), deposit: 7200, monthsAgo: 9 });

        const [py, pm] = addMonths(ty, tm, -1);
        const [qy, qm] = addMonths(ty, tm, -2);
        const addExpense = (property, y, m, day, concept, category, amount) => expenses.push({ id: id(), propertyId: property.id, date: dueISO(y, m, day), concept, category, amount });
        addExpense(aurora, ty, tm, Math.min(now.getDate(), 4), "Reparación de bomba de agua", "Mantenimiento", 1850);
        addExpense(aurora, ty, tm, Math.min(now.getDate(), 2), "Limpieza de áreas comunes", "Servicios", 1200);
        addExpense(aurora, py, pm, 12, "Pago de predial", "Impuestos", 4300);
        addExpense(jardines, qy, qm, 20, "Impermeabilización de azotea", "Mantenimiento", 6400);
        addExpense(palmas, py, pm, 8, "Cambio de chapa principal", "Mantenimiento", 650);

        const activity = [
            { at: addDays(today, -6) + "T10:12", user: DEMO_USER.name, text: "Registró el pago de Departamento 101 (Juan Pérez Gómez)." },
            { at: addDays(today, -3) + "T18:40", user: "Pedro Salas", text: "Declaró un cobro de Cuarto de azotea para aprobación." },
            { at: addDays(today, -1) + "T09:05", user: DEMO_USER.name, text: "Agregó el gasto «Reparación de bomba de agua» en Edificio Aurora." }
        ];

        return { version: 1, seededOn: today, seq, properties, units, tenants, contracts, payments, expenses, activity, readReminders: [] };
    }

    /* ------------------------------------------------------------------ */
    /* Estado                                                              */
    /* ------------------------------------------------------------------ */

    let db = load();
    let flash = null;

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) { const data = JSON.parse(raw); if (data && data.version === 1) return data; }
        } catch (e) { /* almacenamiento no disponible: se usa memoria */ }
        const seed = buildSeed();
        persist(seed);
        return seed;
    }
    function persist(data = db) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ } }
    function nextId() { return db.seq++; }
    function log(text) { const d = new Date(); db.activity.unshift({ at: `${toISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`, user: DEMO_USER.name, text }); }
    function save(message) { persist(); if (message) flash = message; }

    const isLoggedIn = () => { try { return sessionStorage.getItem(SESSION_KEY) === "1" || localStorage.getItem(SESSION_KEY) === "1"; } catch (e) { return memorySession; } };
    let memorySession = false;

    /* ------------------------------------------------------------------ */
    /* Consultas y reglas de negocio                                       */
    /* ------------------------------------------------------------------ */

    const byId = (list, id) => list.find((x) => x.id === Number(id));
    const property = (id) => byId(db.properties, id);
    const unit = (id) => byId(db.units, id);
    const tenant = (id) => byId(db.tenants, id);
    const contract = (id) => byId(db.contracts, id);
    const payment = (id) => byId(db.payments, id);
    const activeProperties = () => db.properties.filter((p) => !p.archived);
    const unitsOf = (p) => db.units.filter((u) => u.propertyId === p.id);
    const activeContractOf = (u) => db.contracts.find((c) => c.unitId === u.id && c.status === "active");
    const activeContractOfTenant = (t) => db.contracts.find((c) => c.tenantId === t.id && c.status === "active");

    function periodsFor(c, refY, refM) {
        const now = new Date();
        const ty = refY ?? now.getFullYear();
        const tm = refM ?? now.getMonth() + 1;
        const [sy, sm] = c.startsOn.split("-").map(Number);
        let [ey, em] = addMonths(ty, tm, 1);
        if (c.status === "ended" && c.endedOn) { [ey, em] = c.endedOn.split("-").map(Number); }
        const list = [];
        let [y, m] = [sy, sm];
        while (y * 12 + m <= ey * 12 + em) {
            list.push({ key: `${c.id}-${y}-${pad(m)}`, contractId: c.id, year: y, month: m, due: dueISO(y, m, c.paymentDay), expected: c.rent });
            [y, m] = addMonths(y, m, 1);
        }
        return list;
    }

    const paymentsOfPeriod = (p) => db.payments.filter((x) => x.contractId === p.contractId && x.year === p.year && x.month === p.month);
    const paidOf = (p) => paymentsOfPeriod(p).filter((x) => !x.voided && x.status === "approved").reduce((s, x) => s + x.amount, 0);
    const reservedOf = (p) => paymentsOfPeriod(p).filter((x) => !x.voided && x.status === "pending").reduce((s, x) => s + x.amount, 0);
    const pendingOf = (p) => Math.max(0, p.expected - paidOf(p));

    function periodByKey(key) {
        const [cid, y, m] = key.split("-").map(Number);
        const c = contract(cid);
        if (!c) return null;
        return periodsFor(c).find((p) => p.year === y && p.month === m) || null;
    }

    function rentStatus(u) {
        const c = activeContractOf(u);
        if (!c) return { code: "available", label: STATUS.available, overdueMonths: 0, pendingAmount: 0, nextPeriod: null, daysLate: 0 };
        const today = todayISO();
        const unpaid = periodsFor(c).filter((p) => pendingOf(p) > 0);
        const overdue = unpaid.filter((p) => p.due < today);
        const nextPeriod = unpaid[0] || null;
        const pendingAmount = unpaid.filter((p) => p.due <= addDays(today, 7) || p.due < today).reduce((s, p) => s + pendingOf(p), 0);
        let code = "current";
        if (overdue.length) code = "late";
        else if (nextPeriod && diffDays(today, nextPeriod.due) <= 7) code = "upcoming";
        return { code, label: STATUS[code], overdueMonths: overdue.length, pendingAmount, nextPeriod, daysLate: overdue.length ? diffDays(overdue[0].due, today) : 0 };
    }

    function lastPaymentOf(c) {
        return db.payments.filter((x) => x.contractId === c.id && !x.voided && x.status === "approved").sort((a, b) => (a.receivedOn < b.receivedOn ? 1 : -1))[0] || null;
    }

    const unitName = (c) => unit(c.unitId)?.name ?? "Unidad eliminada";
    const propertyName = (c) => property(unit(c.unitId)?.propertyId)?.name ?? "Propiedad";
    const tenantName = (c) => tenant(c.tenantId)?.name ?? "Inquilino";
    const pendingApprovals = () => db.payments.filter((x) => x.status === "pending" && !x.voided);

    function overview(y, m) {
        const today = todayISO();
        let expected = 0;
        let collected = 0;
        const upcoming = [];
        db.contracts.forEach((c) => {
            periodsFor(c).forEach((p) => {
                if (p.year === y && p.month === m) { expected += p.expected; collected += paidOf(p); }
                if (c.status === "active" && pendingOf(p) > 0 && p.due >= today && p.due <= addDays(today, 7)) upcoming.push(p);
            });
        });
        const expenses = db.expenses.filter((e) => e.date.startsWith(`${y}-${pad(m)}`)).reduce((s, e) => s + e.amount, 0);
        const units = activeProperties().flatMap(unitsOf);
        const statuses = units.map(rentStatus);
        return {
            expected, collected, pending: Math.max(0, expected - collected), expenses, net: collected - expenses,
            rate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
            late: statuses.filter((s) => s.code === "late").length,
            propertyCount: activeProperties().length, unitCount: units.length,
            available: statuses.filter((s) => s.code === "available").length,
            upcoming: upcoming.sort((a, b) => (a.due < b.due ? -1 : 1))
        };
    }

    function reminders() {
        const today = todayISO();
        const list = [];
        db.contracts.filter((c) => c.status === "active").forEach((c) => {
            const unpaid = periodsFor(c).filter((p) => pendingOf(p) > 0);
            const overdue = unpaid.filter((p) => p.due < today);
            if (overdue.length) {
                const amount = overdue.reduce((s, p) => s + pendingOf(p), 0);
                list.push({ id: `late-${overdue[0].key}-${overdue.length}`, tone: "late", title: `Renta atrasada · ${unitName(c)}`, text: `${tenantName(c)} debe ${plural(overdue.length, "mes", "meses")} (${money(amount)}). El periodo más antiguo venció el ${fmtDate(overdue[0].due)}.`, href: `#/unidades/${c.unitId}`, date: overdue[0].due });
            }
            const soon = unpaid.find((p) => p.due >= today && p.due <= addDays(today, 7));
            if (soon) list.push({ id: `soon-${soon.key}`, tone: "upcoming", title: `Próximo vencimiento · ${unitName(c)}`, text: `${tenantName(c)} paga ${money(pendingOf(soon))} el ${fmtDate(soon.due)}.`, href: `#/unidades/${c.unitId}`, date: soon.due });
        });
        pendingApprovals().forEach((x) => {
            const c = contract(x.contractId);
            list.push({ id: `approval-${x.id}`, tone: "upcoming", title: `Cobro por aprobar · ${unitName(c)}`, text: `${x.recordedBy} declaró ${money(x.amount)} de ${monthLabel(x.year, x.month)}.`, href: `#/pagos/${x.id}`, date: x.receivedOn });
        });
        return list.map((r) => ({ ...r, read: db.readReminders.includes(r.id) }));
    }

    /* ------------------------------------------------------------------ */
    /* Componentes                                                         */
    /* ------------------------------------------------------------------ */

    const badge = (code, label) => `<span class="status-badge status-badge--${code}">${esc(label)}</span>`;
    const notice = () => { if (!flash) return ""; const html = `<p class="notice notice--success" role="status">${esc(flash)}</p>`; flash = null; return html; };
    const card = (inner, cls = "") => `<section class="card ${cls}"><div class="card__body">${inner}</div></section>`;
    const empty = (title, text) => card(`<h2>${esc(title)}</h2><p>${esc(text)}</p>`, "empty-state");
    const heading = (eyebrow, title, text, actions = "") => `<header class="page-heading ${actions ? "page-heading--actions" : ""}"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1>${text ? `<p>${esc(text)}</p>` : ""}</div>${actions ? `<div class="header-actions">${actions}</div>` : ""}</header>`;
    const field = (name, label, attrs = "", hint = "") => `<div class="field"><label class="field__label" for="f-${name}">${esc(label)}</label><input id="f-${name}" class="input" name="${name}" ${attrs}>${hint ? `<p class="field__hint">${esc(hint)}</p>` : ""}</div>`;

    function propertyCard(p) {
        const units = unitsOf(p);
        const isHouse = p.type === "house";
        const statuses = units.map(rentStatus);
        let body;
        let top;
        if (isHouse) {
            const u = units[0];
            const s = statuses[0];
            const c = activeContractOf(u);
            top = badge(s.code, s.label);
            body = `${c ? `<p class="property-card__rent">${money(c.rent)} al mes</p>` : ""}<p>${esc(c ? tenantName(c) : "Sin inquilino")}</p>${s.nextPeriod ? `<p>Próximo pago: ${fmtDate(s.nextPeriod.due)}</p>` : ""}${s.overdueMonths ? `<p>${plural(s.overdueMonths, "mes atrasado", "meses atrasados")}</p>` : ""}`;
        } else {
            const count = (code) => statuses.filter((s) => s.code === code).length;
            top = badge("available", "Edificio");
            body = `<p class="property-card__rent">${plural(units.length, "unidad", "unidades")}</p><div class="property-card__summary" aria-label="Resumen de estados"><span>${count("current")} al corriente</span>${count("upcoming") ? `<span>${count("upcoming")} ${count("upcoming") === 1 ? "próxima" : "próximas"}</span>` : ""}<span>${count("late")} ${count("late") === 1 ? "atrasada" : "atrasadas"}</span><span>${count("available")} ${count("available") === 1 ? "disponible" : "disponibles"}</span></div>`;
        }
        return `<a class="property-card" href="#/propiedades/${p.id}"><div class="property-card__top"><span class="property-card__icon" aria-hidden="true">${isHouse ? ICONS.home : ICONS.building}</span>${top}</div><div><p class="property-card__type">${isHouse ? "Casa" : "Edificio"}</p><h2>${esc(p.name)}</h2>${body}</div><span class="property-card__action">Ver detalles <span aria-hidden="true">→</span></span></a>`;
    }

    function unitCard(u) {
        const c = activeContractOf(u);
        const s = rentStatus(u);
        const pay = s.overdueMonths ? plural(s.overdueMonths, "mes atrasado", "meses atrasados") : s.nextPeriod ? `Próximo pago: ${fmtDate(s.nextPeriod.due)}` : s.code === "available" ? "Unidad disponible" : "Sin pago pendiente";
        const search = `${u.name} ${c ? tenantName(c) : ""}`.toLowerCase();
        return `<a class="unit-card" href="#/unidades/${u.id}" data-search-text="${esc(search)}"><div class="unit-card__heading"><div><span class="unit-card__type">${UNIT_TYPES[u.type] || "Unidad"}</span><h3>${esc(u.name)}</h3></div>${badge(s.code, s.label)}</div><p class="unit-card__tenant">${esc(c ? tenantName(c) : "Sin inquilino")}</p><div class="unit-card__payment"><span>${pay}</span></div><div class="unit-card__footer">${c ? `<strong>${money(c.rent)}</strong><span>Pago el día ${c.paymentDay}</span>` : '<span class="muted">Disponible para asignar</span>'}</div></a>`;
    }

    function financeSummary(u, title) {
        const c = activeContractOf(u);
        const s = rentStatus(u);
        if (!c) return card(`<div class="card__header"><div><h2>${esc(title)}</h2><p>Información calculada según el inquilino asignado y sus pagos.</p></div>${badge(s.code, s.label)}</div><p class="muted">Esta unidad se encuentra desocupada. Los términos de renta (precio y día de cobro) se definirán al asignar a un inquilino.</p>`);
        const last = lastPaymentOf(c);
        return card(`<div class="card__header"><div><h2>${esc(title)}</h2><p>Información calculada según el inquilino asignado y sus pagos.</p></div>${badge(s.code, s.label)}</div>
            <dl class="detail-list">
                <div><dt>Inquilino</dt><dd><a href="#/inquilinos/${c.tenantId}">${esc(tenantName(c))}</a></dd></div>
                <div><dt>Teléfono</dt><dd>${esc(tenant(c.tenantId)?.phone || "No disponible")}</dd></div>
                <div><dt>Renta mensual</dt><dd>${money(c.rent)}</dd></div>
                <div><dt>Día de pago</dt><dd>Día ${c.paymentDay} de cada mes</dd></div>
                <div><dt>Último periodo pagado</dt><dd>${last ? monthLabel(last.year, last.month) : "Sin pagos registrados"}</dd></div>
                <div><dt>Último pago recibido</dt><dd>${last ? fmtDate(last.receivedOn) : "—"}</dd></div>
                <div><dt>Próximo pago</dt><dd>${s.nextPeriod ? fmtDate(s.nextPeriod.due) : "Sin periodo pendiente"}</dd></div>
                <div><dt>Cantidad pendiente</dt><dd>${money(s.pendingAmount)}</dd></div>
                <div><dt>Meses atrasados</dt><dd>${s.overdueMonths}</dd></div>
                ${s.daysLate ? `<div><dt>Días de atraso</dt><dd>${s.daysLate}</dd></div>` : ""}
                <div><dt>Depósito entregado</dt><dd>${money(c.deposit)}</dd></div>
                <div><dt>Fecha de entrada</dt><dd>${fmtDate(c.startsOn)}</dd></div>
            </dl>`);
    }

    function paymentRow(x) {
        const c = contract(x.contractId);
        const p = periodsFor(c).find((pp) => pp.year === x.year && pp.month === x.month) || { due: dueISO(x.year, x.month, c.paymentDay), expected: c.rent };
        const late = !x.voided && x.receivedOn > p.due;
        const days = late ? diffDays(p.due, x.receivedOn) : 0;
        let state;
        if (x.voided) state = badge("available", "Anulado");
        else if (x.status === "pending") state = badge("upcoming", "Pendiente de aprobación");
        else if (late) state = badge("upcoming", `Pagado ${plural(days, "día", "días")} tarde`);
        else state = badge("current", "Pagado a tiempo");
        if (x.amount < p.expected) state += badge("upcoming", "Abono");
        return `<article class="payment-row ${x.voided ? "payment-row--voided" : ""}"><div class="payment-row__main"><div><p class="eyebrow">${esc(propertyName(c))} · ${esc(unitName(c))}</p><h2>${monthLabel(x.year, x.month)}</h2><p>${esc(tenantName(c))}</p></div><strong class="payment-row__amount">${money(x.amount)}</strong></div><div class="payment-row__meta"><span>Recibido: ${fmtDate(x.receivedOn)}</span><span>${METHODS[x.method] || x.method}</span>${state}</div><div class="payment-row__actions">${x.status === "pending" && !x.voided ? `<button class="button button--primary" type="button" data-approve="${x.id}">Aprobar cobro</button>` : ""}<a class="button button--secondary" href="#/pagos/${x.id}">Ver detalle</a></div></article>`;
    }

    function periodRow(p) {
        const c = contract(p.contractId);
        const paid = paidOf(p);
        let state;
        if (paid > 0) state = `${badge("upcoming", `Abonado: ${money(paid)}`)}<span class="muted">Resta: ${money(pendingOf(p))}</span>`;
        else if (p.due < todayISO()) state = badge("late", "Atrasado");
        else state = badge("upcoming", "Pendiente");
        return `<article class="payment-row"><div class="payment-row__main"><div><p class="eyebrow">${esc(propertyName(c))} · ${esc(unitName(c))}</p><h2>${monthLabel(p.year, p.month)}</h2><p>${esc(tenantName(c))}</p></div><strong class="payment-row__amount">${money(p.expected)}</strong></div><div class="payment-row__meta"><span>Vence: ${fmtDate(p.due)}</span>${state}</div><div class="payment-row__actions"><a class="button button--primary" href="#/cobrar/${p.key}">${paid > 0 ? "Abonar restante" : "Registrar pago"}</a></div></article>`;
    }

    function historyOf(c) {
        const rows = [];
        periodsFor(c).slice().reverse().forEach((p) => {
            const list = paymentsOfPeriod(p).sort((a, b) => (a.receivedOn < b.receivedOn ? 1 : -1));
            const pend = pendingOf(p);
            if (pend > 0 && p.due <= addDays(todayISO(), 31)) rows.push(periodRow(p));
            list.forEach((x) => rows.push(paymentRow(x)));
        });
        return `<section id="payment-history" class="history-section" aria-labelledby="payment-history-title"><div class="section-heading"><div><h2 id="payment-history-title">Historial de pagos</h2><p>Los pagos anulados permanecen visibles.</p></div></div>${rows.length ? `<div class="payment-list">${rows.join("")}</div>` : empty("Aún no hay pagos", "El primer pago registrado aparecerá en este historial.")}</section>`;
    }

    function primaryActions(u) {
        const c = activeContractOf(u);
        if (!c) return `<div class="primary-actions"><a class="button button--primary" href="#/unidades/${u.id}/asignar">Asignar inquilino</a></div>`;
        const s = rentStatus(u);
        return `<div class="primary-actions">${s.nextPeriod ? `<a class="button button--primary" href="#/cobrar/${s.nextPeriod.key}">Registrar pago</a>` : ""}<a class="button button--secondary" href="#/contratos/${c.id}">Ver contrato e historial</a><a class="button button--secondary" href="#/inquilinos/${c.tenantId}">Ver inquilino</a></div>`;
    }

    /* ------------------------------------------------------------------ */
    /* Vistas                                                              */
    /* ------------------------------------------------------------------ */

    function viewLogin(error = "") {
        return `<div class="guest-shell"><div class="guest-shell__frame">
            <section class="guest-shell__message" aria-label="Bienvenida">
                <a class="guest-brand" href="#/login"><span class="brand__mark" aria-hidden="true">${ICONS.home}</span>Gestión de Rentas</a>
                <h2>Tu patrimonio, claro y bajo control.</h2>
                <p>Administra propiedades, rentas y movimientos desde cualquier dispositivo.</p>
            </section>
            <main id="main-content" class="guest-card">
                <div class="guest-card__intro"><p class="eyebrow">Bienvenido</p><h1>Iniciar sesión</h1><p>Ingresa con la cuenta creada por un usuario del sistema.</p></div>
                <p class="demo-hint">Cuenta de demostración: usuario <code>demo</code> y contraseña <code>demo</code>. Ya están escritos, solo presiona Entrar.</p>
                ${error ? `<p class="notice notice--error" role="alert">${esc(error)}</p>` : ""}
                <form class="form-stack" data-action="login">
                    ${field("login", "Usuario o correo electrónico", `autocomplete="username" required value="demo"`)}
                    ${field("password", "Contraseña", `type="password" autocomplete="current-password" required value="demo"`)}
                    <label class="checkbox"><input name="remember" type="checkbox"> Mantener mi sesión abierta</label>
                    <button class="button button--primary button--full" type="submit">Entrar</button>
                </form>
                <div class="guest-card__footer"><button class="text-link" type="button" style="border:0;background:none;cursor:pointer" data-toast="En la demo no se envían correos de recuperación.">Olvidé mi contraseña</button></div>
            </main>
        </div></div>`;
    }

    function viewDashboard(query) {
        const now = new Date();
        let [y, m] = [now.getFullYear(), now.getMonth() + 1];
        if (/^\d{4}-\d{2}$/.test(query.get("mes") || "")) [y, m] = query.get("mes").split("-").map(Number);
        const o = overview(y, m);
        const approvals = pendingApprovals().length;
        const upcoming = o.upcoming.length
            ? `<div class="upcoming-payments__list">${o.upcoming.map((p) => { const c = contract(p.contractId); return `<a href="#/unidades/${c.unitId}"><span><strong>${esc(unitName(c))}</strong><small>${esc(propertyName(c))} · ${esc(tenantName(c))}</small></span><span><strong>${money(pendingOf(p))}</strong><small>${fmtDate(p.due)}</small></span></a>`; }).join("")}</div>`
            : `<p class="muted">No hay vencimientos en los próximos siete días.</p>`;
        return `${heading("Resumen", "Hola, Administrador", "Consulta cobranza, vencimientos y el estado de todas tus propiedades.")}
            ${notice()}
            ${approvals ? `<p class="notice" style="background:var(--color-warning-soft);color:var(--color-warning)" role="status">Hay ${plural(approvals, "cobro", "cobros")} de trabajadores por aprobar. <a href="#/pagos?f=approval">Revisar ahora</a></p>` : ""}
            <div class="content-stack">
                <section class="financial-overview" aria-labelledby="financial-overview-title">
                    <div class="financial-overview__heading">
                        <div><p class="eyebrow">Corte mensual</p><h2 id="financial-overview-title">Resumen financiero</h2><p>${monthLabel(y, m)}</p></div>
                        <form class="month-selector" data-action="month"><label for="month">Consultar mes</label><div><input id="month" class="input" type="month" name="month" value="${y}-${pad(m)}"><button class="button button--secondary" type="submit">Ver</button></div></form>
                    </div>
                    <div class="finance-hero">
                        <div><span>Rentas esperadas</span><strong>${money(o.expected)}</strong></div>
                        <div><span>Cobrado</span><strong>${money(o.collected)}</strong></div>
                        <div><span>Pendiente</span><strong>${money(o.pending)}</strong></div>
                        <div><span>Gastos del mes</span><strong class="text-danger">-${money(o.expenses)}</strong></div>
                        <div><span>Utilidad neta</span><strong class="${o.net >= 0 ? "text-success" : "text-danger"}">${money(o.net)}</strong></div>
                    </div>
                    ${o.expected > 0 ? `<div class="collection-progress"><div class="collection-progress__header"><span>Cobranza del mes</span><strong>${o.rate}% (${money(o.collected)} de ${money(o.expected)})</strong></div><div class="collection-progress__bar" role="progressbar" aria-valuenow="${o.rate}" aria-valuemin="0" aria-valuemax="100"><div class="collection-progress__fill" style="width:${Math.min(100, o.rate)}%"></div></div></div>` : ""}
                    <div class="finance-metrics" aria-label="Indicadores del portafolio">
                        <article><strong>${o.late}</strong><span>Rentas atrasadas</span></article>
                        <article><strong>${o.propertyCount}</strong><span>${o.propertyCount === 1 ? "propiedad" : "propiedades"}</span></article>
                        <article><strong>${o.unitCount}</strong><span>${o.unitCount === 1 ? "unidad" : "unidades"}</span></article>
                        <article><strong>${o.available}</strong><span>${o.available === 1 ? "disponible" : "disponibles"}</span></article>
                    </div>
                    <div class="upcoming-payments"><div class="upcoming-payments__heading"><h3>Próximos pagos</h3><span>7 días</span></div>${upcoming}</div>
                </section>
                <section aria-labelledby="properties-title">
                    <div class="section-heading"><div><h2 id="properties-title">Tus propiedades</h2><p>Casas y edificios activos.</p></div><a class="button button--primary" href="#/propiedades/nueva">Agregar propiedad</a></div>
                    ${activeProperties().length ? `<div class="property-grid">${activeProperties().map(propertyCard).join("")}</div>` : empty("Aún no hay propiedades", "Agrega tu primera casa o edificio para comenzar a administrar sus rentas.")}
                </section>
                <section aria-labelledby="quick-title">
                    <div class="card__header"><div><h2 id="quick-title">Accesos rápidos</h2><p>Administra el equipo y revisa lo que sucede en el sistema.</p></div></div>
                    <div class="quick-grid">
                        <a class="quick-link" href="#/inquilinos"><span class="quick-link__icon">${ICONS.user}</span><span><span>Inquilinos</span><small>Directorio y datos de contacto</small></span></a>
                        <a class="quick-link" href="#/ajustes/usuarios"><span class="quick-link__icon">${ICONS.users}</span><span><span>Usuarios</span><small>Altas y acceso del equipo</small></span></a>
                        <a class="quick-link" href="#/ajustes/actividad"><span class="quick-link__icon">${ICONS.chart}</span><span><span>Actividad</span><small>Consulta accesos y cambios</small></span></a>
                    </div>
                </section>
            </div>`;
    }

    function viewProperties() {
        return `${heading("Patrimonio", "Propiedades", "Consulta y administra todas las casas y edificios.", `<a class="button button--primary" href="#/propiedades/nueva">Agregar propiedad</a>`)}${notice()}<div class="property-grid">${activeProperties().map(propertyCard).join("")}</div>`;
    }

    function viewPropertyForm() {
        return `${heading("Patrimonio", "Agregar propiedad", "Una casa se administra como una sola unidad; un edificio puede tener cuartos, departamentos, locales u oficinas.")}
            ${card(`<form class="form-stack" data-action="property-create">
                ${field("name", "Nombre de la propiedad", `required maxlength="80" placeholder="Ej. Casa Centro o Edificio Juárez"`)}
                <div class="field"><span class="field__label">Tipo</span><div class="choice-tabs"><label><input type="radio" name="type" value="house" checked> Casa</label><label><input type="radio" name="type" value="building"> Edificio</label></div></div>
                ${field("street", "Calle y número", `maxlength="120"`)}
                ${field("city", "Ciudad y estado", `maxlength="80"`)}
                <div class="field"><label class="field__label" for="f-notes">Notas</label><textarea id="f-notes" class="input textarea" name="notes" maxlength="2000"></textarea></div>
                <div class="form-actions"><a class="button button--secondary" href="#/propiedades">Cancelar</a><button class="button button--primary" type="submit">Guardar propiedad</button></div>
            </form>`)}`;
    }

    function viewProperty(id) {
        const p = property(id);
        if (!p) return viewNotFound();
        const address = [p.street, p.city].filter(Boolean).join(", ");
        const actions = `<a class="button button--secondary" href="#/propiedades/${p.id}/gastos">Gastos y mantenimiento</a>`;
        let body;
        if (p.type === "house") {
            const u = unitsOf(p)[0];
            const c = activeContractOf(u);
            body = `${primaryActions(u)}<div class="detail-grid">${financeSummary(u, "Estado de la casa")}${p.notes ? card(`<h2>Notas</h2><p class="muted pre-line">${esc(p.notes)}</p>`) : ""}</div>${c ? historyOf(c) : ""}`;
        } else {
            const units = unitsOf(p);
            body = `<section aria-labelledby="units-title">
                <div class="section-heading"><div><h2 id="units-title">Unidades</h2><p>${plural(units.length, "unidad registrada", "unidades registradas")}</p></div><a class="button button--primary" href="#/propiedades/${p.id}/unidades/nueva">Agregar unidad</a></div>
                <div class="search-form" role="search"><div class="field" style="width:100%"><label class="field__label" for="unit-filter">Buscar unidad o inquilino</label><input id="unit-filter" class="input" type="search" placeholder="Ej. Departamento 102 o Sofía" data-filter=".unit-card"></div></div>
                ${units.length ? `<div class="unit-grid">${units.map(unitCard).join("")}</div>` : empty("Este edificio aún no tiene unidades", "Agrega su primer cuarto, departamento, local u oficina.")}
            </section>`;
        }
        return `${heading(p.type === "house" ? "Casa" : "Edificio", p.name, address, actions)}${notice()}${body}`;
    }

    function viewUnitForm(propertyId) {
        const p = property(propertyId);
        if (!p) return viewNotFound();
        return `${heading(p.name, "Agregar unidad", "Registra un cuarto, departamento, local u oficina dentro del edificio.")}
            ${card(`<form class="form-stack" data-action="unit-create" data-property="${p.id}">
                ${field("name", "Nombre de la unidad", `required maxlength="60" placeholder="Ej. Departamento 301"`)}
                <div class="field"><label class="field__label" for="f-type">Tipo</label><select id="f-type" class="select" name="type">${["apartment", "room", "commercial", "office"].map((t) => `<option value="${t}">${UNIT_TYPES[t]}</option>`).join("")}</select></div>
                <div class="field"><label class="field__label" for="f-notes">Notas</label><textarea id="f-notes" class="input textarea" name="notes" maxlength="2000"></textarea></div>
                <div class="form-actions"><a class="button button--secondary" href="#/propiedades/${p.id}">Cancelar</a><button class="button button--primary" type="submit">Guardar unidad</button></div>
            </form>`)}`;
    }

    function viewUnit(id) {
        const u = unit(id);
        if (!u) return viewNotFound();
        const p = property(u.propertyId);
        if (p.type === "house") { location.hash = `#/propiedades/${p.id}`; return ""; }
        const c = activeContractOf(u);
        return `${heading(p.name, u.name, UNIT_TYPES[u.type] || "Unidad")}${notice()}${primaryActions(u)}<div class="detail-grid">${financeSummary(u, "Estado de la unidad")}${u.notes ? card(`<h2>Notas</h2><p class="muted pre-line">${esc(u.notes)}</p>`) : ""}</div>${c ? historyOf(c) : ""}<p><a class="text-link" href="#/propiedades/${p.id}">← Volver a ${esc(p.name)}</a></p>`;
    }

    function viewAssign(unitId) {
        const u = unit(unitId);
        if (!u || activeContractOf(u)) return viewNotFound();
        const p = property(u.propertyId);
        const free = db.tenants.filter((t) => !activeContractOfTenant(t));
        const today = todayISO();
        return `${heading(`${p.name} · ${u.name}`, "Asignar inquilino", "El contrato genera un periodo de renta por mes a partir de la fecha de entrada.")}
            ${card(`<form class="form-stack" data-action="contract-create" data-unit="${u.id}">
                <div class="field"><span class="field__label">Inquilino</span><div class="choice-tabs"><label><input type="radio" name="mode" value="existing" ${free.length ? "checked" : "disabled"}> Elegir registrado</label><label><input type="radio" name="mode" value="new" ${free.length ? "" : "checked"}> Registrar nuevo</label></div></div>
                <div class="field" data-mode="existing" ${free.length ? "" : "hidden"}><label class="field__label" for="f-tenant">Inquilino registrado sin unidad</label><select id="f-tenant" class="select" name="tenantId">${free.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("") || "<option value=''>No hay inquilinos libres</option>"}</select></div>
                <div class="form-stack" data-mode="new" ${free.length ? "hidden" : ""}>
                    ${field("tName", "Nombre completo", `maxlength="80"`)}
                    ${field("tPhone", "Teléfono", `maxlength="20" inputmode="tel"`)}
                </div>
                <div class="form-grid">
                    ${field("rent", "Renta mensual", `type="number" min="1" step="0.01" required value="6000"`)}
                    ${field("day", "Día de pago", `type="number" min="1" max="28" required value="5"`)}
                    ${field("deposit", "Depósito de garantía", `type="number" min="0" step="0.01" value="6000"`)}
                    ${field("startsOn", "Fecha de entrada", `type="date" required value="${today}" min="${addDays(today, -730)}" max="${addDays(today, 31)}"`, "Si eliges una fecha pasada se generan los meses desde entonces.")}
                </div>
                <div class="form-actions"><a class="button button--secondary" href="#/unidades/${u.id}">Cancelar</a><button class="button button--primary" type="submit">Asignar inquilino</button></div>
            </form>`)}`;
    }

    function viewContract(id) {
        const c = contract(id);
        if (!c) return viewNotFound();
        const t = tenant(c.tenantId);
        const active = c.status === "active";
        return `${heading(`${propertyName(c)} · ${unitName(c)}`, "Contrato de renta", `${t?.name ?? ""} · desde el ${fmtDate(c.startsOn)}`, active ? `<button class="button button--danger" type="button" data-end-contract="${c.id}">Finalizar contrato</button>` : "")}
            ${notice()}
            <div class="detail-grid">${card(`<div class="card__header"><div><h2>Términos</h2><p>Condiciones registradas al asignar la unidad.</p></div>${active ? badge("current", "Activo") : badge("available", "Finalizado")}</div>
                <dl class="detail-list"><div><dt>Inquilino</dt><dd><a href="#/inquilinos/${c.tenantId}">${esc(t?.name)}</a></dd></div><div><dt>Unidad</dt><dd>${esc(propertyName(c))} · ${esc(unitName(c))}</dd></div><div><dt>Renta mensual</dt><dd>${money(c.rent)}</dd></div><div><dt>Día de pago</dt><dd>Día ${c.paymentDay} de cada mes</dd></div><div><dt>Depósito</dt><dd>${money(c.deposit)}</dd></div><div><dt>Fecha de entrada</dt><dd>${fmtDate(c.startsOn)}</dd></div>${c.endedOn ? `<div><dt>Fecha de salida</dt><dd>${fmtDate(c.endedOn)}</dd></div>` : ""}</dl>`)}</div>
            ${historyOf(c)}`;
    }

    function viewTenants() {
        const list = db.tenants.slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
        return `${heading("Directorio", "Inquilinos", "Consulta los datos de contacto de las personas registradas.", `<a class="button button--primary" href="#/inquilinos/nuevo">Agregar inquilino</a>`)}${notice()}
            <div class="search-form" role="search"><div class="field" style="width:100%"><label class="sr-only" for="tenant-filter">Buscar inquilino</label><input id="tenant-filter" class="input" type="search" placeholder="Buscar por nombre o teléfono…" data-filter=".tenant-card"></div></div>
            <div class="tenant-grid">${list.map((t) => { const c = activeContractOfTenant(t); return `<a class="tenant-card" href="#/inquilinos/${t.id}" data-search-text="${esc((t.name + " " + t.phone).toLowerCase())}"><span class="tenant-card__avatar" aria-hidden="true">${initial(t.name)}</span><span style="flex:1;min-width:0"><strong style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.name)}</strong><small style="display:block">${esc(t.phone)}${c ? ` · ${money(c.rent)}/mes (Día ${c.paymentDay})` : ""}</small><div style="margin-top:0.25rem">${c ? badge("current", `${propertyName(c)} · ${unitName(c)}`) : badge("available", "Sin unidad asignada")}</div></span><span class="tenant-card__arrow" aria-hidden="true">→</span></a>`; }).join("")}</div>`;
    }

    function tenantFormFields(t = {}) {
        return `${field("name", "Nombre completo", `required maxlength="80" value="${esc(t.name || "")}"`)}
            <div class="form-grid">
                ${field("phone", "Teléfono", `required maxlength="20" inputmode="tel" value="${esc(t.phone || "")}"`)}
                ${field("email", "Correo electrónico", `type="email" maxlength="120" value="${esc(t.email || "")}"`)}
                ${field("ine", "Número de INE", `maxlength="20" value="${esc(t.ine || "")}"`)}
                ${field("emergencyName", "Contacto de emergencia", `maxlength="80" value="${esc(t.emergencyName || "")}"`)}
                ${field("emergencyPhone", "Teléfono de emergencia", `maxlength="20" value="${esc(t.emergencyPhone || "")}"`)}
            </div>
            <div class="field"><label class="field__label" for="f-notes">Notas</label><textarea id="f-notes" class="input textarea" name="notes" maxlength="2000">${esc(t.notes || "")}</textarea></div>`;
    }

    function viewTenantForm(id) {
        const t = id ? tenant(id) : null;
        if (id && !t) return viewNotFound();
        return `${heading("Directorio", t ? "Editar inquilino" : "Agregar inquilino", t ? t.name : "Registra a la persona para después asignarla a una casa o unidad.")}
            ${card(`<form class="form-stack" data-action="${t ? "tenant-update" : "tenant-create"}" ${t ? `data-tenant="${t.id}"` : ""}>${tenantFormFields(t || {})}<div class="form-actions"><a class="button button--secondary" href="${t ? `#/inquilinos/${t.id}` : "#/inquilinos"}">Cancelar</a><button class="button button--primary" type="submit">Guardar inquilino</button></div></form>`)}`;
    }

    function viewTenant(id) {
        const t = tenant(id);
        if (!t) return viewNotFound();
        const c = activeContractOfTenant(t);
        const u = c ? unit(c.unitId) : null;
        const s = u ? rentStatus(u) : null;
        const contracts = db.contracts.filter((x) => x.tenantId === t.id);
        const digits = t.phone.replace(/\D+/g, "");
        const stat = (label, value, danger = false) => `<div style="padding:0.75rem;border-radius:8px;background:${danger ? "#fef2f2" : "#f8faf9"}"><dt style="font-size:0.8rem;text-transform:uppercase;color:${danger ? "#dc2626" : "var(--color-muted)"}">${label}</dt><dd style="font-size:1.15rem;font-weight:700;margin:0.25rem 0 0;color:${danger ? "#dc2626" : "var(--color-ink)"}">${value}</dd></div>`;
        return `<header class="page-heading page-heading--actions"><div style="display:flex;gap:1.25rem;align-items:center;flex-wrap:wrap"><span class="tenant-card__avatar" style="width:72px;height:72px;font-size:1.8rem;display:grid;place-items:center" aria-hidden="true">${initial(t.name)}</span><div><p class="eyebrow">Inquilino</p><h1>${esc(t.name)}</h1><p class="muted" style="margin:0.25rem 0 0">${esc(t.phone)} · ${c ? `Unidad: ${esc(propertyName(c))} - ${esc(unitName(c))}` : "Sin unidad asignada"}</p></div></div><div class="header-actions">${s && s.nextPeriod ? `<a class="button button--primary" href="#/cobrar/${s.nextPeriod.key}">Registrar pago</a>` : ""}<a class="button button--secondary" href="#/inquilinos/${t.id}/editar">Editar datos</a></div></header>
            ${notice()}
            <div class="contact-actions" style="margin-bottom:1.5rem"><a class="button button--primary" href="tel:${digits}">Llamar</a><a class="button button--whatsapp" href="https://wa.me/52${digits}" target="_blank" rel="noopener">Abrir WhatsApp</a></div>
            ${c ? card(`<div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap"><h2>Términos de renta y estado de pagos</h2>${badge(s.code, s.label)}</div><dl class="detail-grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem;margin:0">${stat("Renta mensual", money(c.rent))}${stat("Día de pago", `Día ${c.paymentDay}`)}${stat("Depósito de garantía", money(c.deposit))}${stat("Próximo pago", s.nextPeriod ? fmtDate(s.nextPeriod.due) : "Al corriente")}${stat("Meses atrasados", plural(s.overdueMonths, "mes", "meses"), s.overdueMonths > 0)}${stat("Cantidad pendiente", money(s.pendingAmount), s.overdueMonths > 0)}</dl>`, "") : ""}
            <div class="detail-grid" style="margin-top:1rem">${card(`<h2>Datos generales</h2><dl class="detail-list"><div><dt>Teléfono</dt><dd>${esc(t.phone)}</dd></div><div><dt>INE</dt><dd>${esc(t.ine || "No registrado")}</dd></div><div><dt>Correo</dt><dd>${esc(t.email || "No registrado")}</dd></div><div><dt>Contacto de emergencia</dt><dd>${esc(t.emergencyName || "No registrado")}</dd></div><div><dt>Teléfono de emergencia</dt><dd>${esc(t.emergencyPhone || "No registrado")}</dd></div></dl>`)}${t.notes ? card(`<h2>Notas</h2><p class="muted pre-line">${esc(t.notes)}</p>`) : ""}</div>
            <section class="history-section" aria-labelledby="contract-history-title"><div class="section-heading"><div><h2 id="contract-history-title">Historial de contratos</h2><p>Unidades que ha ocupado esta persona.</p></div></div>
            ${contracts.length ? `<div class="contract-list">${contracts.map((x) => `<a class="tenant-card" href="#/contratos/${x.id}"><span><strong>${esc(unitName(x))}</strong><small>${esc(propertyName(x))} · Desde ${fmtDate(x.startsOn)}</small></span>${x.status === "active" ? badge("current", "Activo") : badge("available", "Finalizado")}</a>`).join("")}</div>` : empty("Sin contratos registrados", "Cuando se asigne a una unidad, el contrato aparecerá aquí.")}</section>`;
    }

    function viewPayments(query) {
        const filter = query.get("f") || "recent";
        const today = todayISO();
        const approvals = pendingApprovals();
        const labels = { recent: "Pagos recientes", pending: "Pendientes", late: "Atrasados", voided: "Anulados", approval: `Por aprobar (${approvals.length})` };
        const activePeriods = db.contracts.filter((c) => c.status === "active").flatMap((c) => periodsFor(c)).filter((p) => pendingOf(p) > 0);
        let rows;
        if (filter === "pending") rows = activePeriods.filter((p) => p.due >= today && p.due <= addDays(today, 31)).sort((a, b) => (a.due < b.due ? -1 : 1)).map(periodRow);
        else if (filter === "late") rows = activePeriods.filter((p) => p.due < today).sort((a, b) => (a.due < b.due ? -1 : 1)).map(periodRow);
        else if (filter === "voided") rows = db.payments.filter((x) => x.voided).map(paymentRow);
        else if (filter === "approval") rows = approvals.map(paymentRow);
        else rows = db.payments.filter((x) => !x.voided && x.status === "approved").sort((a, b) => (a.receivedOn < b.receivedOn ? 1 : a.receivedOn > b.receivedOn ? -1 : b.id - a.id)).slice(0, 25).map(paymentRow);
        return `${heading("Control de rentas", "Pagos", "Consulta cobros registrados y periodos que requieren atención.")}${notice()}
            <nav class="filter-tabs" aria-label="Filtros de pagos">${Object.entries(labels).map(([k, l]) => `<a href="#/pagos?f=${k}" ${k === filter ? 'aria-current="page"' : ""}>${esc(l)}</a>`).join("")}</nav>
            <section aria-labelledby="payment-list-title"><div class="section-heading"><div><h2 id="payment-list-title">${esc(labels[filter] || labels.recent)}</h2><p>${plural(rows.length, "resultado", "resultados")}</p></div></div>
            ${rows.length ? `<div class="payment-list">${rows.join("")}</div>` : empty("No hay registros en esta sección", "Los movimientos aparecerán aquí conforme se generen periodos y se registren pagos.")}</section>`;
    }

    function viewPaymentCreate(key) {
        const p = periodByKey(key);
        if (!p) return viewNotFound();
        const c = contract(p.contractId);
        const paid = paidOf(p);
        const available = Math.max(0, p.expected - paid - reservedOf(p));
        return `<header class="page-heading"><p class="eyebrow">${esc(propertyName(c))} · ${esc(unitName(c))}</p><h1>Registrar pago</h1><p>${esc(tenantName(c))} · ${monthLabel(p.year, p.month)} · vence el ${fmtDate(p.due)}</p></header>
            <section class="card payment-form-card"><div class="card__body">
                <div class="rent-summary"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:0.5rem"><div><small>Renta del periodo: ${money(p.expected)}</small>${paid > 0 ? `<div style="color:var(--color-brand-800);font-size:0.88rem;margin-top:0.2rem">✓ Abonado previamente: <strong>${money(paid)}</strong></div>` : ""}</div><div style="text-align:right"><small style="display:block;color:var(--color-muted)">Saldo pendiente</small><strong style="font-size:1.4rem;color:var(--color-brand-900)">${money(pendingOf(p))}</strong></div></div></div>
                <p>Disponible por declarar: <strong>${money(available)}</strong></p>
                ${available <= 0 ? `<p class="notice" role="status">Todo el saldo está reservado en cobros por aprobar o ya fue liquidado.</p>` : ""}
                <form class="form-stack payment-form" data-action="payment-create" data-period="${p.key}">
                    <div class="field"><div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap"><label class="field__label" for="f-amount">Monto a recibir</label><button type="button" class="button button--secondary" style="min-height:1.8rem;padding:0.15rem 0.55rem;font-size:0.78rem" data-fill="${available.toFixed(2)}">Usar disponible (${money(available)})</button></div>
                    <input id="f-amount" class="input" type="number" name="amount" min="0.01" max="${available.toFixed(2)}" step="0.01" value="${available.toFixed(2)}" required ${available <= 0 ? "disabled" : ""}><p class="field__hint">Puedes registrar un abono menor al saldo; el resto queda pendiente.</p></div>
                    ${field("receivedOn", "Fecha en que se recibió", `type="date" required value="${todayISO()}" max="${todayISO()}"`)}
                    <div class="field"><label class="field__label" for="f-method">Método de pago</label><select class="select" id="f-method" name="method">${Object.entries(METHODS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
                    <div class="field"><label class="field__label" for="f-notes">Notas o referencia del abono</label><textarea class="input textarea" id="f-notes" name="notes" maxlength="2000" placeholder="Ej. Transferencia con referencia 4521…"></textarea></div>
                    <div class="form-actions"><a class="button button--secondary" href="#/contratos/${c.id}">Cancelar</a><button class="button button--primary" type="submit" ${available <= 0 ? "disabled" : ""}>Guardar pago</button></div>
                </form>
            </div></section>`;
    }

    function viewPayment(id) {
        const x = payment(id);
        if (!x) return viewNotFound();
        const c = contract(x.contractId);
        const p = periodsFor(c).find((pp) => pp.year === x.year && pp.month === x.month) || { due: dueISO(x.year, x.month, c.paymentDay), expected: c.rent, contractId: c.id, year: x.year, month: x.month };
        const late = x.receivedOn > p.due;
        let state = x.voided ? badge("available", "Anulado") : x.status === "pending" ? badge("upcoming", "Pendiente de aprobación") : late ? badge("upcoming", `Pagado ${plural(diffDays(p.due, x.receivedOn), "día", "días")} tarde`) : badge("current", "A tiempo");
        if (x.amount < p.expected) state += " " + badge("upcoming", "Abono");
        const actions = `${x.status === "pending" && !x.voided ? `<button class="button button--primary" type="button" data-approve="${x.id}">Aprobar cobro</button>` : ""}<a class="button button--secondary" href="#/pagos/${x.id}/recibo">Ver recibo</a>${!x.voided ? `<a class="button button--danger" href="#/pagos/${x.id}/anular">Anular pago</a>` : ""}`;
        return `${heading(`${propertyName(c)} · ${unitName(c)}`, monthLabel(x.year, x.month), "Detalle inmutable del pago registrado.", actions)}${notice()}
            <div class="detail-grid">${card(`<div class="card__header"><div><h2>${x.amount < p.expected ? "Abono parcial" : "Pago completo"}</h2><p>Registrado por ${esc(x.recordedBy)}</p></div><div>${state}</div></div><dl class="detail-list"><div><dt>Monto de este pago</dt><dd><strong>${money(x.amount)}</strong></dd></div><div><dt>Renta del periodo</dt><dd>${money(p.expected)}</dd></div><div><dt>Saldo restante del mes</dt><dd><strong>${money(pendingOf(p))}</strong></dd></div><div><dt>Fecha límite</dt><dd>${fmtDate(p.due)}</dd></div><div><dt>Fecha recibida</dt><dd>${fmtDate(x.receivedOn)}</dd></div><div><dt>Método</dt><dd>${METHODS[x.method] || x.method}</dd></div></dl>`)}
            ${card(`<h2>Inquilino y unidad</h2><p><strong>${esc(tenantName(c))}</strong></p><p class="muted">${esc(propertyName(c))} · ${esc(unitName(c))}</p><a class="text-link" href="#/contratos/${c.id}">Historial de pagos</a>`)}</div>
            ${x.notes ? card(`<h2>Notas</h2><p class="muted pre-line">${esc(x.notes)}</p>`, "payment-notes") : ""}
            ${x.voided ? card(`<h2>Anulación</h2><dl class="detail-list"><div><dt>Fecha</dt><dd>${fmtDate(x.voided.date)}</dd></div><div><dt>Usuario</dt><dd>${esc(DEMO_USER.name)}</dd></div><div><dt>Motivo</dt><dd>${esc(x.voided.reason)}</dd></div></dl>`, "void-summary") : ""}`;
    }

    function viewVoid(id) {
        const x = payment(id);
        if (!x || x.voided) return viewNotFound();
        const c = contract(x.contractId);
        return `${heading(`${propertyName(c)} · ${unitName(c)}`, "Anular pago", `${money(x.amount)} de ${monthLabel(x.year, x.month)}. El pago seguirá visible como anulado y el periodo volverá a quedar pendiente.`)}
            ${card(`<form class="form-stack" data-action="payment-void" data-payment="${x.id}"><div class="field"><label class="field__label" for="f-reason">Motivo de la anulación</label><textarea id="f-reason" class="input textarea" name="reason" required minlength="5" maxlength="500" placeholder="Ej. Se registró en el mes equivocado."></textarea></div><div class="form-actions"><a class="button button--secondary" href="#/pagos/${x.id}">Cancelar</a><button class="button button--danger" type="submit">Anular pago</button></div></form>`)}`;
    }

    function viewReceipt(id) {
        const x = payment(id);
        if (!x) return viewNotFound();
        const c = contract(x.contractId);
        return `<div class="receipt-actions no-print"><a class="text-link" href="#/pagos/${x.id}">← Volver al pago</a><div class="receipt-actions__buttons"><button class="button button--primary" type="button" onclick="window.print()">Imprimir recibo</button></div></div>
            <article class="receipt-document"><header class="receipt-document__header"><div><p class="receipt-document__badge">Recibo de pago</p><h1 class="receipt-document__title">Gestión de Rentas</h1></div><div class="receipt-document__meta"><p>Folio <span class="receipt-document__folio">R-${String(x.id).padStart(5, "0")}</span></p><p>Fecha: ${fmtDate(x.receivedOn)}</p></div></header>
            <div class="receipt-document__amount-box"><span class="receipt-document__amount-label">Cantidad recibida</span><strong class="receipt-document__amount-number">${money(x.amount)} MXN</strong></div>
            <dl class="receipt-document__details"><div><dt>Recibí de</dt><dd>${esc(tenantName(c))}</dd></div><div><dt>Concepto</dt><dd>Renta de ${esc(unitName(c))} (${esc(propertyName(c))}) correspondiente a ${monthLabel(x.year, x.month)}</dd></div><div><dt>Método de pago</dt><dd>${METHODS[x.method]}</dd></div>${x.voided ? `<div><dt>Estado</dt><dd><strong class="text-danger">Pago anulado</strong></dd></div>` : ""}</dl>
            <footer class="receipt-document__footer"><div class="receipt-document__signature"><div class="receipt-document__signature-line"></div><p>Firma de quien recibe</p></div></footer></article>`;
    }

    function viewReminders() {
        const list = reminders();
        const unread = list.filter((r) => !r.read);
        const read = list.filter((r) => r.read);
        const item = (r) => `<article class="reminder-card ${r.read ? "reminder-card--read" : ""}"><div class="reminder-card__heading"><div><h2>${esc(r.title)}</h2><p class="muted">${esc(r.text)}</p></div>${badge(r.tone, r.tone === "late" ? "Atrasado" : "Atención")}</div><div class="reminder-card__actions"><a class="button button--secondary" href="${r.href}">Ver detalle</a>${r.read ? "" : `<button class="button button--secondary" type="button" data-read="${esc(r.id)}">Marcar como leído</button>`}</div></article>`;
        return `${heading("Seguimiento diario", "Avisos", "Próximos vencimientos y rentas que requieren atención.", unread.length ? `<button class="button button--secondary" type="button" data-read-all>Marcar todos como leídos</button>` : "")}${notice()}
            <div class="reminder-sections"><section><div class="section-heading"><div><h2>Sin leer</h2><p>${plural(unread.length, "aviso", "avisos")}</p></div></div>${unread.length ? `<div class="reminder-list">${unread.map(item).join("")}</div>` : empty("Todo al día", "No hay avisos pendientes por revisar.")}</section>
            ${read.length ? `<section><div class="section-heading"><div><h2>Leídos</h2></div></div><div class="reminder-list">${read.map(item).join("")}</div></section>` : ""}</div>`;
    }

    function viewExpenses(id) {
        const p = property(id);
        if (!p) return viewNotFound();
        const list = db.expenses.filter((e) => e.propertyId === p.id).sort((a, b) => (a.date < b.date ? 1 : -1));
        const total = list.reduce((s, e) => s + e.amount, 0);
        return `${heading(p.name, "Gastos y mantenimiento", "Los gastos se descuentan de la utilidad neta del mes en el resumen financiero.")}${notice()}
            <div class="detail-grid">${card(`<h2>Registrar gasto</h2><form class="form-stack" data-action="expense-create" data-property="${p.id}" style="margin-top:1rem">${field("concept", "Concepto", `required maxlength="80" placeholder="Ej. Pintura de fachada"`)}<div class="form-grid">${field("amount", "Monto", `type="number" min="1" step="0.01" required`)}${field("date", "Fecha", `type="date" required value="${todayISO()}"`)}</div><div class="field"><label class="field__label" for="f-category">Categoría</label><select id="f-category" class="select" name="category"><option>Mantenimiento</option><option>Servicios</option><option>Impuestos</option><option>Otro</option></select></div><button class="button button--primary" type="submit">Guardar gasto</button></form>`)}
            ${card(`<div class="card__header"><div><h2>Historial</h2><p>Total registrado: ${money(total)}</p></div></div>${list.length ? list.map((e) => `<div class="expense-row"><div><strong>${esc(e.concept)}</strong><small>${esc(e.category)} · ${fmtDate(e.date)}</small></div><div style="display:flex;align-items:center;gap:0.6rem"><strong class="text-danger">-${money(e.amount)}</strong><button class="button button--secondary" style="min-height:2rem;padding:0.2rem 0.6rem" type="button" data-delete-expense="${e.id}" aria-label="Eliminar gasto ${esc(e.concept)}">Eliminar</button></div></div>`).join("") : `<p class="muted">Aún no hay gastos registrados.</p>`}`)}</div>
            <p><a class="text-link" href="#/propiedades/${p.id}">← Volver a ${esc(p.name)}</a></p>`;
    }

    function viewSettings() {
        return `${heading("Administración", "Ajustes", "Configura el acceso del equipo y consulta la actividad registrada.")}${notice()}
            <div class="settings-grid">
                <a class="quick-link" href="#/ajustes/usuarios"><span class="quick-link__icon">${ICONS.users}</span><span><span>Usuarios</span><small>Administrador y trabajadores con permisos</small></span></a>
                <a class="quick-link" href="#/ajustes/actividad"><span class="quick-link__icon">${ICONS.chart}</span><span><span>Registro de actividad</span><small>Revisar accesos y cambios</small></span></a>
                <a class="quick-link" href="#/inquilinos"><span class="quick-link__icon">${ICONS.user}</span><span><span>Inquilinos</span><small>Directorio completo</small></span></a>
                <button class="quick-link" type="button" data-reset-demo style="text-align:left;font:inherit;cursor:pointer;width:100%"><span class="quick-link__icon">${ICONS.refresh}</span><span><span>Restablecer demo</span><small>Volver a los datos de ejemplo originales</small></span></button>
            </div>`;
    }

    function viewUsers() {
        const users = [
            { name: DEMO_USER.name, role: "Administrador", detail: "Acceso completo a propiedades, cobros, gastos y usuarios.", active: true },
            { name: "Pedro Salas", role: "Trabajador", detail: "Puede ver Edificio Aurora y declarar cobros, que requieren aprobación.", active: true },
            { name: "Rosa Jiménez", role: "Trabajadora", detail: "Consulta inquilinos y pagos. Cuenta desactivada.", active: false }
        ];
        return `${heading("Administración", "Usuarios", "En la versión real se crean cuentas con contraseña temporal y permisos por propiedad.")}
            <div class="user-list">${users.map((u) => `<article class="card user-row"><div class="card__body user-row__main" style="display:flex;gap:0.9rem;align-items:center;justify-content:space-between;flex-wrap:wrap"><div style="display:flex;gap:0.9rem;align-items:center"><span class="user-menu__avatar" aria-hidden="true">${initial(u.name)}</span><div><strong>${esc(u.name)}</strong><p class="muted" style="margin:0.1rem 0 0">${esc(u.role)} · ${esc(u.detail)}</p></div></div>${u.active ? badge("current", "Activo") : badge("available", "Inactivo")}</div></article>`).join("")}</div>
            <p><a class="text-link" href="#/ajustes">← Volver a Ajustes</a></p>`;
    }

    function viewActivity() {
        return `${heading("Administración", "Registro de actividad", "Cada cambio queda vinculado al usuario que lo hizo.")}
            ${card(db.activity.length ? db.activity.slice(0, 60).map((a) => `<div class="expense-row"><div><strong>${esc(a.text)}</strong><small>${esc(a.user)} · ${fmtDate(a.at.slice(0, 10))} ${a.at.slice(11)}</small></div></div>`).join("") : `<p class="muted">Sin actividad registrada.</p>`)}
            <p><a class="text-link" href="#/ajustes">← Volver a Ajustes</a></p>`;
    }

    function viewNotFound() {
        return empty("No encontramos esta página", "Es posible que el registro se haya eliminado al restablecer la demo.") + `<p><a class="text-link" href="#/">← Ir al inicio</a></p>`;
    }

    /* ------------------------------------------------------------------ */
    /* Estructura y enrutamiento                                           */
    /* ------------------------------------------------------------------ */

    function shell(content, section) {
        const unread = reminders().filter((r) => !r.read).length;
        const nav = [
            ["#/", "home", "Inicio", ICONS.home],
            ["#/pagos", "payments", "Pagos", ICONS.payments],
            ["#/avisos", "reminders", "Avisos", ICONS.bell],
            ["#/ajustes", "settings", "Ajustes", ICONS.settings]
        ];
        return `<a class="skip-link" href="#main-content">Saltar al contenido</a>
            <div class="app-body"><header class="app-header"><div class="app-header__inner">
                <a class="brand" href="#/"><span class="brand__mark" aria-hidden="true">${ICONS.home}</span><span>Mis Rentas</span></a>
                <nav class="bottom-navigation" aria-label="Navegación principal"><div class="bottom-navigation__inner">${nav.map(([href, key, label, icon]) => `<a href="${href}" ${section === key ? 'aria-current="page"' : ""}><span class="bottom-nav__icon-wrap">${icon}${key === "reminders" && unread ? `<span class="nav-badge" aria-label="${unread} avisos no leídos">${unread}</span>` : ""}</span><span>${label}</span></a>`).join("")}</div></nav>
                <div class="app-header__actions">
                    <button class="header-search-trigger" type="button" aria-label="Buscar en el sistema" data-search-open>${ICONS.search}<span class="header-search-trigger__text">Buscar...</span><kbd class="header-search-trigger__kbd">Ctrl K</kbd></button>
                    <div class="user-menu"><button class="user-menu__trigger" type="button" aria-expanded="false" data-menu-toggle><span class="user-menu__avatar" aria-hidden="true">A</span><span class="user-menu__name">${esc(DEMO_USER.name)}</span><span aria-hidden="true">⌄</span></button>
                    <div class="user-menu__panel" data-menu-panel hidden><a class="menu-action" href="#/ajustes">Ajustes</a><button class="menu-action" type="button" data-logout>Cerrar sesión</button></div></div>
                </div>
            </div></header>
            <main id="main-content" class="page-shell">${content}</main></div>
            <dialog id="search-dialog" class="search-modal" aria-labelledby="search-title"><div class="search-modal__box"><div class="search-modal__header">${ICONS.search.replace("header-search-trigger__icon", "search-modal__icon")}<label class="sr-only" id="search-title" for="search-input">Buscar</label><input id="search-input" class="search-modal__input" type="search" placeholder="Buscar casa, unidad o inquilino…" autocomplete="off"><button class="search-modal__close" type="button" data-search-close>Esc</button></div><div class="search-modal__body" id="search-results"><p class="search-modal__hint">Escribe al menos 2 letras para buscar...</p></div></div></dialog>`;
    }

    const routes = [
        [/^\/$/, () => ["home", viewDashboard]],
        [/^\/propiedades$/, () => ["home", viewProperties]],
        [/^\/propiedades\/nueva$/, () => ["home", viewPropertyForm]],
        [/^\/propiedades\/(\d+)$/, (m) => ["home", () => viewProperty(m[1])]],
        [/^\/propiedades\/(\d+)\/gastos$/, (m) => ["home", () => viewExpenses(m[1])]],
        [/^\/propiedades\/(\d+)\/unidades\/nueva$/, (m) => ["home", () => viewUnitForm(m[1])]],
        [/^\/unidades\/(\d+)$/, (m) => ["home", () => viewUnit(m[1])]],
        [/^\/unidades\/(\d+)\/asignar$/, (m) => ["home", () => viewAssign(m[1])]],
        [/^\/contratos\/(\d+)$/, (m) => ["home", () => viewContract(m[1])]],
        [/^\/inquilinos$/, () => ["home", viewTenants]],
        [/^\/inquilinos\/nuevo$/, () => ["home", () => viewTenantForm()]],
        [/^\/inquilinos\/(\d+)$/, (m) => ["home", () => viewTenant(m[1])]],
        [/^\/inquilinos\/(\d+)\/editar$/, (m) => ["home", () => viewTenantForm(m[1])]],
        [/^\/pagos$/, () => ["payments", viewPayments]],
        [/^\/cobrar\/([\d-]+)$/, (m) => ["payments", () => viewPaymentCreate(m[1])]],
        [/^\/pagos\/(\d+)$/, (m) => ["payments", () => viewPayment(m[1])]],
        [/^\/pagos\/(\d+)\/anular$/, (m) => ["payments", () => viewVoid(m[1])]],
        [/^\/pagos\/(\d+)\/recibo$/, (m) => ["payments", () => viewReceipt(m[1])]],
        [/^\/avisos$/, () => ["reminders", viewReminders]],
        [/^\/ajustes$/, () => ["settings", viewSettings]],
        [/^\/ajustes\/usuarios$/, () => ["settings", viewUsers]],
        [/^\/ajustes\/actividad$/, () => ["settings", viewActivity]]
    ];

    function render() {
        const raw = location.hash.replace(/^#/, "") || "/";
        const [path, qs] = raw.split("?");
        const query = new URLSearchParams(qs || "");
        if (!isLoggedIn()) {
            document.title = "Iniciar sesión · Gestión de Rentas";
            app.innerHTML = viewLogin();
            return;
        }
        if (path === "/login") { location.replace("#/"); return; }
        let section = "home";
        let view = viewNotFound;
        for (const [re, make] of routes) {
            const m = path.match(re);
            if (m) { [section, view] = make(m); break; }
        }
        const html = view(query);
        if (location.hash.replace(/^#/, "").split("?")[0] !== path && location.hash) return; // la vista redirigió
        app.innerHTML = shell(html, section);
        const h1 = app.querySelector("h1");
        document.title = `${h1 ? h1.textContent : "Inicio"} · Gestión de Rentas`;
        window.scrollTo(0, 0);
    }

    /* ------------------------------------------------------------------ */
    /* Acciones                                                            */
    /* ------------------------------------------------------------------ */

    function toast(message) {
        document.querySelectorAll(".toast").forEach((t) => t.remove());
        const el = document.createElement("div");
        el.className = "toast";
        el.setAttribute("role", "status");
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2800);
    }

    function confirmDialog(message, confirmLabel = "Confirmar") {
        const dialog = document.getElementById("app-confirm-dialog");
        document.getElementById("confirm-dialog-message").textContent = message;
        const ok = dialog.querySelector("[data-dialog-confirm]");
        ok.textContent = confirmLabel;
        return new Promise((resolve) => {
            const done = (value) => { dialog.close(); ok.onclick = null; dialog.querySelector("[data-dialog-cancel]").onclick = null; resolve(value); };
            ok.onclick = () => done(true);
            dialog.querySelector("[data-dialog-cancel]").onclick = () => done(false);
            dialog.oncancel = () => done(false);
            if (dialog.showModal) dialog.showModal(); else resolve(window.confirm(message));
        });
    }

    const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };
    const num = (v) => Math.round(parseFloat(v) * 100) / 100;

    const actions = {
        login(data) {
            if (String(data.login).trim().toLowerCase() !== DEMO_USER.login || data.password !== DEMO_USER.password) {
                app.innerHTML = viewLogin("Las credenciales no son correctas. En la demo usa demo / demo.");
                return;
            }
            try { (data.remember ? localStorage : sessionStorage).setItem(SESSION_KEY, "1"); } catch (e) { memorySession = true; }
            memorySession = true;
            go("#/");
        },
        month(data) { go(`#/?mes=${data.month}`); },
        "property-create"(data) {
            const p = { id: nextId(), name: data.name.trim(), type: data.type, street: data.street.trim(), city: data.city.trim(), notes: data.notes.trim(), archived: false };
            db.properties.push(p);
            if (p.type === "house") db.units.push({ id: nextId(), propertyId: p.id, name: "Casa completa", type: "house", notes: "" });
            log(`Agregó la propiedad «${p.name}».`);
            save("Propiedad guardada.");
            go(`#/propiedades/${p.id}`);
        },
        "unit-create"(data, form) {
            const u = { id: nextId(), propertyId: Number(form.dataset.property), name: data.name.trim(), type: data.type, notes: data.notes.trim() };
            db.units.push(u);
            log(`Agregó la unidad «${u.name}» en ${property(u.propertyId).name}.`);
            save("Unidad guardada.");
            go(`#/propiedades/${u.propertyId}`);
        },
        "tenant-create"(data) {
            const t = { id: nextId(), name: data.name.trim(), phone: data.phone.trim(), email: data.email.trim(), ine: data.ine.trim(), emergencyName: data.emergencyName.trim(), emergencyPhone: data.emergencyPhone.trim(), notes: data.notes.trim() };
            db.tenants.push(t);
            log(`Registró al inquilino ${t.name}.`);
            save("Inquilino guardado.");
            go(`#/inquilinos/${t.id}`);
        },
        "tenant-update"(data, form) {
            const t = tenant(form.dataset.tenant);
            Object.assign(t, { name: data.name.trim(), phone: data.phone.trim(), email: data.email.trim(), ine: data.ine.trim(), emergencyName: data.emergencyName.trim(), emergencyPhone: data.emergencyPhone.trim(), notes: data.notes.trim() });
            log(`Actualizó los datos de ${t.name}.`);
            save("Datos actualizados.");
            go(`#/inquilinos/${t.id}`);
        },
        "contract-create"(data, form) {
            const u = unit(form.dataset.unit);
            let tenantId = Number(data.tenantId);
            if (data.mode === "new") {
                if (!data.tName.trim() || !data.tPhone.trim()) { toast("Escribe el nombre y el teléfono del nuevo inquilino."); return; }
                const t = { id: nextId(), name: data.tName.trim(), phone: data.tPhone.trim(), email: "", ine: "", emergencyName: "", emergencyPhone: "", notes: "" };
                db.tenants.push(t);
                tenantId = t.id;
            }
            if (!tenant(tenantId)) { toast("Elige un inquilino."); return; }
            const c = { id: nextId(), unitId: u.id, tenantId, rent: num(data.rent), paymentDay: Math.min(28, Math.max(1, parseInt(data.day, 10))), deposit: num(data.deposit || 0), startsOn: data.startsOn, status: "active", endedOn: null, notes: "" };
            db.contracts.push(c);
            log(`Asignó ${tenant(tenantId).name} a ${u.name}.`);
            save("Inquilino asignado. Se generaron sus periodos de renta.");
            go(`#/contratos/${c.id}`);
        },
        "payment-create"(data, form) {
            const p = periodByKey(form.dataset.period);
            const amount = num(data.amount);
            const available = p.expected - paidOf(p) - reservedOf(p);
            if (!(amount > 0) || amount > available + 0.001) { toast(`El monto debe estar entre $0.01 y ${money(available)}.`); return; }
            const x = { id: nextId(), contractId: p.contractId, year: p.year, month: p.month, amount, receivedOn: data.receivedOn, method: data.method, notes: data.notes.trim(), status: "approved", recordedBy: DEMO_USER.name, voided: null };
            db.payments.push(x);
            const c = contract(p.contractId);
            log(`Registró ${money(amount)} de ${unitName(c)} (${tenantName(c)}).`);
            save(pendingOf(p) > 0 ? "Abono registrado. El resto del mes sigue pendiente." : "Pago registrado. El periodo quedó liquidado.");
            go(`#/pagos/${x.id}`);
        },
        "payment-void"(data, form) {
            const x = payment(form.dataset.payment);
            x.voided = { reason: data.reason.trim(), date: todayISO() };
            log(`Anuló un pago de ${unitName(contract(x.contractId))}: ${x.voided.reason}`);
            save("Pago anulado. El periodo volvió a quedar pendiente.");
            go(`#/pagos/${x.id}`);
        },
        "expense-create"(data, form) {
            const e = { id: nextId(), propertyId: Number(form.dataset.property), date: data.date, concept: data.concept.trim(), category: data.category, amount: num(data.amount) };
            db.expenses.push(e);
            log(`Agregó el gasto «${e.concept}» en ${property(e.propertyId).name}.`);
            save("Gasto registrado.");
            render();
        }
    };

    document.addEventListener("submit", (event) => {
        const form = event.target.closest("form[data-action]");
        if (!form) return;
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        data.remember = form.querySelector("[name=remember]")?.checked;
        actions[form.dataset.action]?.(data, form);
    });

    document.addEventListener("click", async (event) => {
        const t = event.target.closest("button, a");
        if (!t) return;

        if (t.matches("[data-menu-toggle]")) {
            const panel = document.querySelector("[data-menu-panel]");
            panel.hidden = !panel.hidden;
            t.setAttribute("aria-expanded", String(!panel.hidden));
            return;
        }
        if (t.matches("[data-toast]")) { toast(t.dataset.toast); return; }
        if (t.matches("[data-fill]")) { document.getElementById("f-amount").value = t.dataset.fill; return; }
        if (t.matches("[data-logout]")) {
            try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) { /* sin almacenamiento */ }
            memorySession = false;
            location.hash = "#/login";
            render();
            return;
        }
        if (t.matches("[data-reset-demo]")) {
            if (await confirmDialog("Se borrarán los cambios que hiciste y se cargarán de nuevo los datos de ejemplo.", "Restablecer")) {
                db = buildSeed();
                persist();
                flash = "La demo se restableció con los datos de ejemplo.";
                go("#/");
            }
            return;
        }
        if (t.matches("[data-approve]")) {
            const x = payment(t.dataset.approve);
            x.status = "approved";
            log(`Aprobó el cobro de ${money(x.amount)} declarado por ${x.recordedBy}.`);
            save("Cobro aprobado. Ya cuenta en el saldo del periodo.");
            render();
            return;
        }
        if (t.matches("[data-end-contract]")) {
            const c = contract(t.dataset.endContract);
            if (await confirmDialog(`¿Finalizar el contrato de ${tenantName(c)}? La unidad quedará disponible y el historial se conserva.`, "Finalizar")) {
                c.status = "ended";
                c.endedOn = todayISO();
                log(`Finalizó el contrato de ${tenantName(c)} en ${unitName(c)}.`);
                save("Contrato finalizado. La unidad está disponible.");
                render();
            }
            return;
        }
        if (t.matches("[data-delete-expense]")) {
            const e = byId(db.expenses, t.dataset.deleteExpense);
            if (await confirmDialog(`¿Eliminar el gasto «${e.concept}»?`, "Eliminar")) {
                db.expenses = db.expenses.filter((x) => x.id !== e.id);
                log(`Eliminó el gasto «${e.concept}».`);
                save("Gasto eliminado.");
                render();
            }
            return;
        }
        if (t.matches("[data-read]")) { db.readReminders.push(t.dataset.read); save(); render(); return; }
        if (t.matches("[data-read-all]")) { reminders().forEach((r) => { if (!r.read) db.readReminders.push(r.id); }); save("Todos los avisos se marcaron como leídos."); render(); return; }
        if (t.matches("[data-search-open]")) { openSearch(); return; }
        if (t.matches("[data-search-close]")) { document.getElementById("search-dialog")?.close(); }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".user-menu")) { const p = document.querySelector("[data-menu-panel]"); if (p) p.hidden = true; }
    });

    document.addEventListener("input", (event) => {
        const input = event.target;
        if (input.matches("[data-filter]")) {
            const q = input.value.trim().toLowerCase();
            document.querySelectorAll(input.dataset.filter).forEach((el) => { el.hidden = q && !el.dataset.searchText.includes(q); });
        }
        if (input.id === "search-input") renderSearch(input.value);
    });

    document.addEventListener("change", (event) => {
        if (event.target.name === "mode") {
            document.querySelectorAll("[data-mode]").forEach((el) => { el.hidden = el.dataset.mode !== event.target.value; });
        }
    });

    function openSearch() {
        const dialog = document.getElementById("search-dialog");
        if (!dialog) return;
        dialog.showModal();
        const input = document.getElementById("search-input");
        input.value = "";
        renderSearch("");
        input.focus();
    }

    function renderSearch(q) {
        const box = document.getElementById("search-results");
        q = q.trim().toLowerCase();
        if (q.length < 2) { box.innerHTML = '<p class="search-modal__hint">Escribe al menos 2 letras para buscar...</p>'; return; }
        const props = activeProperties().filter((p) => p.name.toLowerCase().includes(q)).map((p) => [`#/propiedades/${p.id}`, p.name, p.type === "house" ? "Casa" : "Edificio"]);
        const units = db.units.filter((u) => property(u.propertyId).type === "building" && u.name.toLowerCase().includes(q)).map((u) => [`#/unidades/${u.id}`, u.name, property(u.propertyId).name]);
        const people = db.tenants.filter((t) => (t.name + " " + t.phone).toLowerCase().includes(q)).map((t) => [`#/inquilinos/${t.id}`, t.name, t.phone]);
        const group = (title, items) => items.length ? `<div class="search-group"><p class="search-group__title">${title}</p>${items.map(([href, name, meta]) => `<a class="search-result-item" href="${href}" data-search-close><span class="search-result-item__info"><strong>${esc(name)}</strong><small>${esc(meta)}</small></span></a>`).join("")}</div>` : "";
        const html = group("Propiedades", props) + group("Unidades", units) + group("Inquilinos", people);
        box.innerHTML = html || '<p class="search-modal__hint">Sin resultados.</p>';
    }

    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && isLoggedIn()) { event.preventDefault(); openSearch(); }
    });

    window.addEventListener("hashchange", render);
    render();
})();
