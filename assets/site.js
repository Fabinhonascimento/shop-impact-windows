/* Shop Impact Windows – shared site script */
const CONFIG = {
  // Fill these in when ready. Empty values are hidden on the site.
  phone: "",            // e.g. "(305) 555-0123"
  whatsapp: "",         // digits only with country code, e.g. "13055550123"
  email: "",            // e.g. "sales@shopimpactwindows.com"
  // Endpoint that receives quote requests (Formspree, Web3Forms, FormSubmit…).
  // While empty, the quote form shows a notice instead of sending.
  formEndpoint: ""
};

const LANGS = ["en", "es", "pt"];
const ICON = {
  menu: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};

function renderChrome() {
  const page = document.body.dataset.page || "";
  const cur = p => (p === page ? ' aria-current="page"' : "");
  const header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="wrap bar">
        <a class="logo" href="index.html" aria-label="Shop Impact Windows – home"><img src="brand/svg/logo-horizontal-white.svg" alt="Shop Impact Windows"></a>
        <button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false">${ICON.menu}</button>
        <nav aria-label="Main">
          <a href="windows.html"${cur("windows")} data-i18n="nav.windows">Windows</a>
          <a href="doors.html"${cur("doors")} data-i18n="nav.doors">Doors</a>
          <a href="incentives.html"${cur("incentives")} data-i18n="nav.incentives">Savings &amp; Incentives</a>
          <a href="index.html#how"${cur("how")} data-i18n="nav.how">How it works</a>
          <div class="lang" role="group" aria-label="Language">
            <button type="button" data-lang="en">EN</button>
            <button type="button" data-lang="es">ES</button>
            <button type="button" data-lang="pt">PT</button>
          </div>
          <a class="btn btn-sm" href="quote.html" data-i18n="nav.quote">Free Quote</a>
        </nav>
      </div>`;
    const t = header.querySelector(".menu-toggle");
    t.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      t.setAttribute("aria-expanded", open);
    });
  }
  const footer = document.getElementById("site-footer");
  if (footer) {
    const contact = [
      CONFIG.phone ? `<a href="tel:${CONFIG.phone.replace(/[^\d+]/g, "")}">${CONFIG.phone}</a>` : "",
      CONFIG.whatsapp ? `<a href="https://wa.me/${CONFIG.whatsapp}">WhatsApp</a>` : "",
      CONFIG.email ? `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>` : ""
    ].join("");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="cols">
          <div>
            <img src="brand/svg/logo-horizontal-white.svg" alt="Shop Impact Windows">
            <p data-i18n="foot.about">Hurricane impact windows and doors for homes and businesses. Installation in Miami-Dade, Broward and Palm Beach. Material delivered across Florida and nationwide.</p>
          </div>
          <div>
            <h4 data-i18n="foot.products">Products</h4>
            <a href="windows.html" data-i18n="nav.windows">Windows</a>
            <a href="doors.html" data-i18n="nav.doors">Doors</a>
            <a href="incentives.html" data-i18n="nav.incentives">Savings &amp; Incentives</a>
          </div>
          <div>
            <h4 data-i18n="foot.contact">Contact</h4>
            <a href="quote.html" data-i18n="nav.quote">Free Quote</a>
            ${contact}
          </div>
        </div>
        <div class="legal">
          © <span class="yr"></span> Shop Impact Windows ·
          <span data-i18n="foot.legal">Installation is performed by a Florida-licensed contractor, identified in your proposal, contract and permit. Product availability and approvals are verified before ordering.</span>
        </div>
      </div>`;
    footer.querySelector(".yr").textContent = new Date().getFullYear();
  }
}

/* ---------- i18n ---------- */
const ORIGINAL = new WeakMap();
function applyLang(lang) {
  const dict = (window.I18N && window.I18N[lang]) || {};
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    if (!ORIGINAL.has(el)) ORIGINAL.set(el, el.innerHTML);
    const v = dict[el.dataset.i18n];
    el.innerHTML = lang === "en" || v === undefined ? ORIGINAL.get(el) : v;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    if (!el.dataset.phEn) el.dataset.phEn = el.getAttribute("placeholder") || "";
    const v = dict[el.dataset.i18nPh];
    el.setAttribute("placeholder", lang === "en" || v === undefined ? el.dataset.phEn : v);
  });
  const t = dict["meta.title." + (document.body.dataset.page || "home")];
  if (!document.documentElement.dataset.titleEn) document.documentElement.dataset.titleEn = document.title;
  document.title = lang === "en" || !t ? document.documentElement.dataset.titleEn : t;
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  const langField = document.querySelector('[name="language"]');
  if (langField) langField.value = lang;
  try { localStorage.setItem("lang", lang); } catch (e) {}
}
function initLang() {
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  const nav = (navigator.language || "en").slice(0, 2);
  applyLang(LANGS.includes(saved) ? saved : LANGS.includes(nav) ? nav : "en");
  document.addEventListener("click", e => {
    const b = e.target.closest(".lang button");
    if (b) applyLang(b.dataset.lang);
  });
}
function tr(key, fallback) {
  const lang = document.documentElement.lang;
  return (window.I18N && window.I18N[lang] && window.I18N[lang][key]) || fallback;
}

/* ---------- Quote form ---------- */
function initQuote() {
  const form = document.getElementById("quote-form");
  if (!form) return;
  const list = document.getElementById("openings");
  const tpl = document.getElementById("opening-tpl");
  const add = () => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    list.appendChild(node);
    node.querySelector(".rm").addEventListener("click", () => {
      if (list.children.length > 1) node.remove();
    });
    applyLang(document.documentElement.lang);
    return node;
  };
  const params = new URLSearchParams(location.search);
  const first = add();
  if (params.get("type")) {
    const sel = first.querySelector("select");
    if ([...sel.options].some(o => o.value === params.get("type"))) sel.value = params.get("type");
  }
  if (params.get("service") === "material") {
    const r = form.querySelector('input[name="service"][value="material"]');
    if (r) r.checked = true;
  }
  document.getElementById("add-opening").addEventListener("click", add);

  const status = document.getElementById("form-status");
  if (!CONFIG.formEndpoint) document.getElementById("form-offline").hidden = false;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.className = "form-status";
    if (!form.reportValidity()) return;
    // Build a readable summary of the openings
    const rows = [...list.querySelectorAll(".opening")].map((r, i) => {
      const q = n => r.querySelector(`[data-f="${n}"]`).value.trim();
      return `${i + 1}. ${q("type")} – ${q("width")}" W x ${q("height")}" H – qty ${q("qty")}`;
    });
    const data = new FormData(form);
    data.append("openings", rows.join("\n"));
    data.append("_subject", "New quote request – Shop Impact Windows");
    if (!CONFIG.formEndpoint) {
      status.className = "form-status err";
      status.innerHTML = tr("q.offline", "Online quote requests are opening very soon. Please check back shortly.");
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch(CONFIG.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      list.innerHTML = ""; add();
      status.className = "form-status ok";
      status.innerHTML = tr("q.ok", "<b>Thank you!</b> We received your request and will send your quote within 24 hours.");
      status.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      status.className = "form-status err";
      status.innerHTML = tr("q.err", "Sorry, something went wrong sending your request. Please try again in a few minutes.");
    } finally {
      btn.disabled = false;
    }
  });
}

renderChrome();
initLang();
initQuote();
