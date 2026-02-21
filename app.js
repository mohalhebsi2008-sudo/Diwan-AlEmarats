// app.js
(function () {
  const poetSearch = document.getElementById("poetSearch");
  const poetsList = document.getElementById("poetsList");

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

  const diwan = window.DIWAN || { poets: [] };

  let selectedPoetId = null;
  let selectedPoemId = null;

  function norm(s) {
    return (s || "").toString().trim().toLowerCase();
  }

  function buildPoetCard(poet, active) {
    const div = document.createElement("div");
    div.className = "item" + (active ? " active" : "");
    div.innerHTML = `
      <div class="title">${poet.name}</div>
      <div class="meta">${poet.era} • قصايد: ${poet.poems.length}</div>
    `;
    div.addEventListener("click", () => selectPoet(poet.id));
    return div;
  }

  function renderPoets() {
    const q = norm(poetSearch.value);
    poetsList.innerHTML = "";

    const list = diwan.poets
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
    poet.poems.forEach(po => (po.tags || []).forEach(t => tags.add(t)));

    tagFilter.innerHTML = `<option value="">كل التصنيفات</option>`;
    [...tags].sort((a,b) => a.localeCompare(b, "ar")).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tagFilter.appendChild(opt);
    });
  }

  function buildPoemCard(poem, active) {
    const div = document.createElement("div");
    div.className = "poem-card" + (active ? " active" : "");

    const tags = (poem.tags || []).map(t => `#${t}`).join(" ");
    const preview = (poem.text || "").split("\n").slice(0,2).join(" / ");

    div.innerHTML = `
      <div class="p-title">${poem.title}</div>
      <div class="p-sub">${tags || "—"} • ${preview || "—"}</div>
    `;
    div.addEventListener("click", () => selectPoem(poem.id));
    return div;
  }

  function renderPoems() {
    const poet = diwan.poets.find(p => p.id === selectedPoetId);
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

    const list = poet.poems.filter(po => {
      const okTag = !tag || (po.tags || []).includes(tag);
      const okQ =
        !q ||
        norm(po.title).includes(q) ||
        norm(po.text).includes(q) ||
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

    list.forEach(po => poemsList.appendChild(buildPoemCard(po, po.id === selectedPoemId)));
  }

  function selectPoet(id) {
    selectedPoetId = id;
    selectedPoemId = null;

    const poet = diwan.poets.find(p => p.id === id);

    poetName.textContent = poet ? poet.name : "اختر شاعر";
    poetMeta.textContent = poet ? `${poet.era} • ${poet.bioShort || ""}` : "—";

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

    const poet = diwan.poets.find(p => p.id === selectedPoetId);
    if (!poet) return;

    const poem = poet.poems.find(x => x.id === poemId);
    if (!poem) return;

    poemTitle.textContent = poem.title;
    poemInfo.textContent = `${poet.name} • ${(poem.tags || []).join("، ") || "—"}`;
    poemText.textContent = poem.text || "—";
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

  // Events
  poetSearch.addEventListener("input", renderPoets);
  poemSearch.addEventListener("input", renderPoems);
  tagFilter.addEventListener("change", renderPoems);
  clearBtn.addEventListener("click", clearSelection);
  copyBtn.addEventListener("click", copyCurrentPoem);

  // Init
  clearSelection();
})();
