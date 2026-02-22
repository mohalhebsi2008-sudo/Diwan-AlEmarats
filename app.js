// app.js (نسخة تدعم textFull + بحث عام + قصيدة اليوم + عدادات)
(function () {
  const poetSearch = document.getElementById("poetSearch");
  const poetsList = document.getElementById("poetsList");

  const globalSearch = document.getElementById("globalSearch");
  const globalResults = document.getElementById("globalResults");

  const poetName = document.getElementById("poetName");
  const poetMeta = document.getElementById("poetMeta");
  const clearBtn = document.getElementById("clearBtn");

  const poemSearch = document.getElementById("poemSearch");
  const tagFilter = document.getElementById("tagFilter");
  const poemsList = document.getElementById("poemsList");

  const poemTitle = document.getElementById("poemTitle");
  const poemInfo = document.getElementById("poemInfo");
  const poemText = document.getElementById("poemText");
  const copyBtn = document.getElementById("copyBtn");

  const countPoets = document.getElementById("countPoets");
  const countPoems = document.getElementById("countPoems");

  const poemOfDay = document.getElementById("poemOfDay");
  const openPoD = document.getElementById("openPoD");

  const rightsNoteEl = document.getElementById("rightsNote");

  const diwan = window.DIWAN || { poets: [] };

  let selectedPoetId = null;
  let selectedPoemId = null;

  function norm(s) {
    return (s || "").toString().trim().toLowerCase();
  }

  // يرجّع نص القصيدة بشكل موحّد
  function getPoemText(poem) {
    // الأولوية: textFull ثم text ثم snippet
    const full = (poem.textFull || "").trim();
    if (full) return full;

    const t = (poem.text || "").trim();
    if (t) return t;

    const sn = (poem.snippet || "").trim();
    if (sn) return `المقتطف:\n${sn}\n`;

    return "";
  }

  function flattenAllPoems() {
    const all = [];
    (diwan.poets || []).forEach(p => {
      (p.poems || []).forEach(po => {
        all.push({
          poetId: p.id,
          poetName: p.name,
          poetEra: p.era,
          poemId: po.id,
          title: po.title,
          tags: po.tags || [],
          // مهم: البحث العام يعتمد على هذا
          searchableText: getPoemText(po),
          source: po.source || "",
          raw: po
        });
      });
    });
    return all;
  }

  let ALL_POEMS = flattenAllPoems();

  function updateCounters() {
    if (countPoets) countPoets.textContent = `👤 الشعراء: ${(diwan.poets || []).length}`;
    if (countPoems) countPoems.textContent = `📜 القصايد: ${ALL_POEMS.length}`;
  }

  function buildPoetCard(poet, active) {
    const div = document.createElement("div");
    div.className = "item" + (active ? " active" : "");
    div.innerHTML = `
      <div class="title">${poet.name}</div>
      <div class="meta">${poet.era || "—"} • قصايد: ${(poet.poems || []).length}</div>
    `;
    div.addEventListener("click", () => selectPoet(poet.id));
    return div;
  }

  function renderPoets() {
    const q = norm(poetSearch?.value);
    poetsList.innerHTML = "";

    const list = (diwan.poets || [])
      .filter(p => !q || norm(p.name).includes(q) || norm(p.era).includes(q))
      .sort((a,b) => a.name.localeCompare(b.name, "ar"));

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "item";
      empty.innerHTML = `<div class="title">ما في نتائج</div><div class="meta">جرّب كلمة ثانية</div>`;
      poetsList.appendChild(empty);
      return;
    }

    list.forEach(p => poetsList.appendChild(buildPoetCard(p, p.id === selectedPoetId)));
  }

  function fillTagOptions(poet) {
    const tags = new Set();
    (poet.poems || []).forEach(po => (po.tags || []).forEach(t => tags.add(t)));

    tagFilter.innerHTML = `<option value="">كل التصنيفات</option>`;
    [...tags].sort((a,b) => a.localeCompare(b, "ar")).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tagFilter.appendChild(opt);
    });
  }

  function buildPoemCard(poem, active, subtitleExtra = "") {
    const div = document.createElement("div");
    div.className = "poem-card" + (active ? " active" : "");

    const tags = (poem.tags || []).map(t => `#${t}`).join(" ");
    const preview = (getPoemText(poem.raw || poem) || "")
      .split("\n").slice(0,2).join(" / ")
      .slice(0, 140);

    div.innerHTML = `
      <div class="p-title">${poem.title}</div>
      <div class="p-sub">${subtitleExtra}${tags ? " • " + tags : ""} • ${preview || "—"}</div>
    `;

    div.addEventListener("click", () => {
      // إذا جاية من البحث العام
      if (poem.poetId && poem.poemId) {
        selectPoet(poem.poetId);
        selectPoem(poem.poemId);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        selectPoem(poem.id);
      }
    });

    return div;
  }

  function renderPoems() {
    const poet = (diwan.poets || []).find(p => p.id === selectedPoetId);
    poemsList.innerHTML = "";

    if (!poet) {
      poemSearch.disabled = true;
      tagFilter.disabled = true;
      return;
    }

    poemSearch.disabled = false;
    tagFilter.disabled = false;

    const q = norm(poemSearch.value);
    const tag = tagFilter.value;

    const list = (poet.poems || []).filter(po => {
      const okTag = !tag || (po.tags || []).includes(tag);
      const text = getPoemText(po);
      const okQ =
        !q ||
        norm(po.title).includes(q) ||
        norm(text).includes(q) ||
        (po.tags || []).some(t => norm(t).includes(q));
      return okTag && okQ;
    });

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "poem-card";
      empty.innerHTML = `<div class="p-title">ما في قصايد مطابقة</div><div class="p-sub">غيّر البحث أو التصنيف</div>`;
      poemsList.appendChild(empty);
      return;
    }

    list.forEach(po => poemsList.appendChild(buildPoemCard({ ...po, raw: po }, po.id === selectedPoemId)));
  }

  function selectPoet(id) {
    selectedPoetId = id;
    selectedPoemId = null;

    const poet = (diwan.poets || []).find(p => p.id === id);

    poetName.textContent = poet ? poet.name : "اختر شاعر";
    poetMeta.textContent = poet ? `${poet.era || "—"} • ${poet.bioShort || ""}` : "—";

    poemTitle.textContent = "—";
    poemInfo.textContent = "—";
    poemText.textContent = "اختر قصيدة.";
    copyBtn.disabled = true;

    poemSearch.value = "";
    tagFilter.value = "";
    fillTagOptions(poet);

    renderPoets();
    renderPoems();
  }

  function selectPoem(poemId) {
    selectedPoemId = poemId;

    const poet = (diwan.poets || []).find(p => p.id === selectedPoetId);
    if (!poet) return;

    const poem = (poet.poems || []).find(x => x.id === poemId);
    if (!poem) return;

    poemTitle.textContent = poem.title;
    poemInfo.textContent = `${poet.name} • ${(poem.tags || []).join("، ") || "—"}`;

    const text = getPoemText(poem);
    if (text) {
      poemText.textContent = text;
    } else {
      poemText.textContent = "ما فيه نص للقصيدة داخل البيانات.";
    }

    copyBtn.disabled = false;
    renderPoems();
  }

  async function copyCurrentPoem() {
    const txt = poemText.textContent || "";
    if (!txt.trim() || txt.includes("اختر")) return;

    try {
      await navigator.clipboard.writeText(`${poemTitle.textContent}\n\n${txt}`);
      copyBtn.textContent = "✅ تم النسخ";
      setTimeout(() => (copyBtn.textContent = "📋 نسخ القصيدة"), 1200);
    } catch {
      alert("ما قدرت أنسخ تلقائياً. انسخ يدوي.");
    }
  }

  function clearSelection() {
    selectedPoetId = null;
    selectedPoemId = null;

    poetName.textContent = "اختر شاعر";
    poetMeta.textContent = "—";

    poemSearch.value = "";
    tagFilter.value = "";

    poemSearch.disabled = true;
    tagFilter.disabled = true;

    poemsList.innerHTML = "";
    poemTitle.textContent = "—";
    poemInfo.textContent = "—";
    poemText.textContent = "اختر شاعر ثم قصيدة.";
    copyBtn.disabled = true;

    renderPoets();
  }

  // ⭐ بحث عام في كل الديوان
  function renderGlobalSearch() {
    const q = norm(globalSearch.value);
    globalResults.innerHTML = "";
    if (!q) return;

    const hits = ALL_POEMS
      .filter(p =>
        norm(p.title).includes(q) ||
        norm(p.searchableText).includes(q) ||
        p.tags.some(t => norm(t).includes(q)) ||
        norm(p.poetName).includes(q)
      )
      .slice(0, 30);

    if (!hits.length) {
      const empty = document.createElement("div");
      empty.className = "poem-card";
      empty.innerHTML = `<div class="p-title">ما في نتائج</div><div class="p-sub">جرّب كلمة ثانية</div>`;
      globalResults.appendChild(empty);
      return;
    }

    hits.forEach(h => {
      globalResults.appendChild(
        buildPoemCard(
          { title: h.title, tags: h.tags, poetId: h.poetId, poemId: h.poemId, raw: h.raw },
          false,
          `👤 ${h.poetName}`
        )
      );
    });
  }

  // ⭐ قصيدة اليوم
  function pickPoemOfDay() {
    if (!ALL_POEMS.length) return null;
    const d = new Date();
    const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return ALL_POEMS[hash % ALL_POEMS.length];
  }

  function renderPoD() {
    if (!poemOfDay) return;

    const pod = pickPoemOfDay();
    const titleEl = poemOfDay.querySelector(".pod-title");
    const metaEl = poemOfDay.querySelector(".pod-meta");

    if (!pod) {
      titleEl.textContent = "—";
      metaEl.textContent = "لا توجد قصائد حالياً.";
      openPoD.disabled = true;
      return;
    }

    titleEl.textContent = pod.title;
    metaEl.textContent = `👤 ${pod.poetName} • ${(pod.tags || []).join("، ") || "—"}`;
    openPoD.disabled = false;

    openPoD.onclick = () => {
      selectPoet(pod.poetId);
      selectPoem(pod.poemId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  // Events
  poetSearch?.addEventListener("input", renderPoets);
  globalSearch?.addEventListener("input", renderGlobalSearch);

  poemSearch?.addEventListener("input", renderPoems);
  tagFilter?.addEventListener("change", renderPoems);
  clearBtn?.addEventListener("click", clearSelection);
  copyBtn?.addEventListener("click", copyCurrentPoem);

  // Init
  if (rightsNoteEl && diwan.site?.rightsNote) rightsNoteEl.textContent = diwan.site.rightsNote;

  // إعادة بناء ALL_POEMS بعد تحميل البيانات
  ALL_POEMS = flattenAllPoems();
  updateCounters();
  renderPoD();
  clearSelection();
  renderGlobalSearch();
})();
