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
  const toast = document.getElementById("toast");

  const diwan = window.DIWAN || { poets: [] };

  let selectedPoetId = null;
  let selectedPoemId = null;

  function norm(s) { return (s || "").toString().trim().toLowerCase(); }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.textContent = ""), 1400);
  }

  function getPoemText(poem) {
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
          poemId: po.id,
          title: po.title,
          tags: po.tags || [],
          text: getPoemText(po),
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

  function buildPoemCardForList(title, tags, preview, active, onClick, extra = "") {
    const div = document.createElement("div");
    div.className = "poem-card" + (active ? " active" : "");
    const tagStr = (tags || []).map(t => `#${t}`).join(" ");
    div.innerHTML = `
      <div class="p-title">${title}</div>
      <div class="p-sub">${extra}${tagStr ? " • " + tagStr : ""} • ${preview || "—"}</div>
    `;
    div.addEventListener("click", onClick);
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
      poemsList.appendChild(
        buildPoemCardForList("ما في قصايد مطابقة", [], "غيّر البحث أو التصنيف", false, () => {})
      );
      return;
    }

    list.forEach(po => {
      const preview = (getPoemText(po) || "").split("\n").slice(0,2).join(" / ").slice(0, 140);
      poemsList.appendChild(
        buildPoemCardForList(
          po.title,
          po.tags || [],
          preview,
          po.id === selectedPoemId,
          () => selectPoem(po.id)
        )
      );
    });
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
    poemText.textContent = text || "ما فيه نص للقصيدة داخل البيانات.";

    copyBtn.disabled = false;
    renderPoems();
  }

  async function copyCurrentPoem() {
    const txt = poemText.textContent || "";
    if (!txt.trim() || txt.includes("اختر")) return;

    try {
      await navigator.clipboard.writeText(`${poemTitle.textContent}\n\n${txt}`);
      showToast("✅ تم النسخ");
      copyBtn.textContent = "✅ تم النسخ";
      setTimeout(() => (copyBtn.textContent = "📋 نسخ القصيدة"), 1200);
    } catch {
      showToast("ما قدرت أنسخ تلقائياً");
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

  // ⭐ بحث عام
  function renderGlobalSearch() {
    const q = norm(globalSearch.value);
    globalResults.innerHTML = "";
    if (!q) return;

    const hits = ALL_POEMS
      .filter(p =>
        norm(p.title).includes(q) ||
        norm(p.text).includes(q) ||
        p.tags.some(t => norm(t).includes(q)) ||
        norm(p.poetName).includes(q)
      )
      .slice(0, 30);

    if (!hits.length) {
      globalResults.appendChild(
        buildPoemCardForList("ما في نتائج", [], "جرّب كلمة ثانية", false, () => {})
      );
      return;
    }

    hits.forEach(h => {
      const preview = (h.text || "").split("\n").slice(0,2).join(" / ").slice(0, 140);
      globalResults.appendChild(
        buildPoemCardForList(
          h.title,
          h.tags,
          preview,
          false,
          () => {
            selectPoet(h.poetId);
            selectPoem(h.poemId);
            window.scrollTo({ top: 0, behavior: "smooth" });
          },
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

  ALL_POEMS = flattenAllPoems();
  updateCounters();
  renderPoD();
  clearSelection();
  renderPoets();
})();
