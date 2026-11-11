(function () {
  const stories = window.DN_STORIES || [];
  // Pick a story with ?story=id, otherwise the most recently added one.
  const wanted = new URLSearchParams(location.search).get("story");
  const story = stories.find(s => s.id === wanted) || stories[stories.length - 1];
  const $ = id => document.getElementById(id);

  // Parse paragraphs into parts: plain strings and {label, original, index} blanks.
  const blanks = [];
  const paragraphs = story.paragraphs.map(text => {
    const parts = [];
    let last = 0;
    text.replace(/\{([^|}]+)\|([^}]+)\}/g, (m, label, original, at) => {
      if (at > last) parts.push(text.slice(last, at));
      const b = { label: label.trim(), original: original.trim(), index: blanks.length };
      blanks.push(b);
      parts.push(b);
      last = at + m.length;
    });
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  });

  let answers = [];
  let turn = 0;

  const startsWithVowelSound = w => /^[aeiou]/i.test(w) && !/^(uni|use|eu|one)/i.test(w) || /^(hour|honest|honor)/i.test(w);
  const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Build a paragraph's HTML. `pick` returns the word for a blank.
  // Fixes "a"/"an" before a blank and capitalizes blanks that start a sentence.
  function render(parts, pick, cls) {
    let html = "";
    parts.forEach((p, i) => {
      if (typeof p === "string") { html += esc(p); return; }
      let word = pick(p);
      const before = i > 0 && typeof parts[i - 1] === "string" ? parts[i - 1] : "";
      if (i === 0 || /[.!?]["”’]?\s+$/.test(before)) word = word.charAt(0).toUpperCase() + word.slice(1);
      html = html.replace(/\b(a|an|A|An)(\s+)$/, (m, art, sp) => {
        const an = startsWithVowelSound(word);
        const fixed = art[0] === "A" ? (an ? "An" : "A") : (an ? "an" : "a");
        return fixed + sp;
      });
      html += `<mark class="${cls}" title="${esc(p.label)}">${esc(word)}</mark>`;
    });
    return html;
  }

  function show(id) {
    ["intro", "play", "reveal"].forEach(s => { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }

  function showTurn() {
    const b = blanks[turn];
    $("count").textContent = `Word ${turn + 1} of ${blanks.length}`;
    $("bar").style.width = `${(turn / blanks.length) * 100}%`;
    $("article").textContent = startsWithVowelSound(b.label) ? "n" : "";
    $("label").textContent = b.label;
    const hint = story.hints && story.hints[b.label];
    $("hint").textContent = hint || "";
    $("hint").hidden = !hint;
    $("word").value = answers[turn] || "";
    $("back").disabled = turn === 0;
    $("next").textContent = turn === blanks.length - 1 ? "See your story" : "Next";
    $("word").focus();
  }

  function reveal() {
    const yours = $("yours"), real = $("real");
    yours.querySelector(".headline").textContent = story.headline;
    real.querySelector(".headline").textContent = story.headline;
    real.querySelector(".byline").textContent = `By ${story.byline} · ${story.date}`;
    yours.querySelector(".body").innerHTML = paragraphs.map(p => `<p>${render(p, b => answers[b.index], "mine")}</p>`).join("");
    real.querySelector(".body").innerHTML = paragraphs.map(p => `<p>${render(p, b => b.original, "orig")}</p>`).join("");
    $("sourceLink").href = story.url;
    $("compareRows").innerHTML = blanks.map(b =>
      `<tr><td>${esc(b.label)}</td><td><mark class="mine">${esc(answers[b.index])}</mark></td><td><mark class="orig">${esc(b.original)}</mark></td></tr>`
    ).join("");
    selectTab("yours");
    show("reveal");
  }

  function selectTab(which) {
    const isYours = which === "yours";
    $("tabYours").setAttribute("aria-selected", isYours);
    $("tabReal").setAttribute("aria-selected", !isYours);
    $("yours").hidden = !isYours;
    $("real").hidden = isYours;
  }

  // Wire up
  $("introHeadline").textContent = story.headline;
  $("introCount").textContent = blanks.length;
  $("start").addEventListener("click", () => { answers = []; turn = 0; show("play"); showTurn(); });

  $("turn").addEventListener("submit", e => {
    e.preventDefault();
    const w = $("word").value.trim().replace(/\s+/g, " ");
    if (!w) { $("word").focus(); return; }
    answers[turn] = w;
    if (turn < blanks.length - 1) { turn++; showTurn(); } else reveal();
  });
  $("back").addEventListener("click", () => {
    answers[turn] = $("word").value.trim();
    if (turn > 0) { turn--; showTurn(); }
  });

  $("tabYours").addEventListener("click", () => selectTab("yours"));
  $("tabReal").addEventListener("click", () => selectTab("real"));
  document.querySelector(".tabs").addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const next = $("tabYours").getAttribute("aria-selected") === "true" ? "real" : "yours";
      selectTab(next);
      $(next === "yours" ? "tabYours" : "tabReal").focus();
    }
  });
  $("again").addEventListener("click", () => show("intro"));
})();
