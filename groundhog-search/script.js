(function () {
  'use strict';
  var PAGE = 20;
  var $ = function (id) { return document.getElementById(id); };
  var animals = [];   // one entry per prognosticator
  var shown = PAGE;
  var MIN_YEAR = 1990, MAX_YEAR = 1990;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function pct(n, d) { return d ? Math.round(100 * n / d) + '%' : '–'; }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }

  function resolve(r) {
    if (r.shadow === '1') return 'shadow';
    if (r.shadow === '0') return 'noshadow';
    return 'na';
  }
  var LABEL = { shadow: 'Saw shadow', noshadow: 'No shadow', na: 'No prediction recorded' };

  function build(rows) {
    var byId = {};
    rows.forEach(function (r) {
      var y = parseInt(r.year, 10);
      if (!y) return;
      MIN_YEAR = Math.min(MIN_YEAR, y); MAX_YEAR = Math.max(MAX_YEAR, y);
      var a = byId[r.id];
      if (!a) {
        a = byId[r.id] = {
          id: r.id, name: r.name, city: r.city, region: r.region, country: r.country,
          type: r.type, active: r.active === '1', description: r.description,
          link: safeUrl(r.currentPrediction) || safeUrl(r.source),
          years: {}, shadow: 0, noshadow: 0, na: 0, total: 0
        };
      }
      var k = resolve(r);
      a.years[y] = { k: k, details: (r.details || '').trim() };
      a[k]++; a.total++;
    });
    animals = Object.keys(byId).map(function (k) {
      var a = byId[k];
      a.hay = norm([a.name, a.city, a.region].join(' '));
      a.firstYear = Math.min.apply(null, Object.keys(a.years));
      a.lastYear = Math.max.apply(null, Object.keys(a.years));
      a.called = a.shadow + a.noshadow;
      return a;
    });
  }

  function fillSelect(sel, values) {
    values.forEach(function (v) {
      var o = el('option', null, v); o.value = v; sel.appendChild(o);
    });
  }

  function filtered() {
    var q = norm($('q').value.trim()), reg = $('region').value, type = $('type').value;
    var terms = q ? q.split(/\s+/) : [];
    var out = animals.filter(function (a) {
      if (reg && a.region !== reg) return false;
      if (type && a.type !== type) return false;
      return terms.every(function (t) { return a.hay.indexOf(t) !== -1; });
    });
    var s = $('sort').value;
    out.sort(function (a, b) {
      if (s === 'name') return a.name.localeCompare(b.name);
      if (s === 'shadow') return b.shadow - a.shadow || a.name.localeCompare(b.name);
      if (s === 'noshadow') return b.noshadow - a.noshadow || a.name.localeCompare(b.name);
      return b.called - a.called || a.name.localeCompare(b.name);
    });
    return out;
  }

  function card(a) {
    var li = el('li', 'card');
    var h = el('h2', null, a.name);
    if (!a.active) h.appendChild(el('span', 'badge', 'Inactive'));
    li.appendChild(h);
    li.appendChild(el('p', 'meta', a.city + ', ' + a.region + ' · ' + a.type));

    var stats = el('p', 'stats');
    [[a.called + ' of ' + a.total, ' years with a call'],
     [a.shadow + ' (' + pct(a.shadow, a.called) + ')', ' saw shadow'],
     [a.noshadow + ' (' + pct(a.noshadow, a.called) + ')', ' early spring']
    ].forEach(function (p) {
      var s = el('span'); s.appendChild(el('b', null, p[0])); s.appendChild(document.createTextNode(p[1]));
      stats.appendChild(s);
    });
    li.appendChild(stats);

    var bar = el('div', 'bar'); bar.setAttribute('aria-hidden', 'true');
    var s1 = el('span', 's'), s2 = el('span', 'n');
    s1.style.width = (100 * a.shadow / a.total) + '%';
    s2.style.width = (100 * a.noshadow / a.total) + '%';
    bar.appendChild(s1); bar.appendChild(s2);
    li.appendChild(bar);

    var strip = el('div', 'strip');
    strip.setAttribute('role', 'img');
    strip.setAttribute('aria-label', a.name + ' year-by-year record, ' + MIN_YEAR + ' to ' + MAX_YEAR + ': ' +
      a.shadow + ' shadow, ' + a.noshadow + ' no shadow, ' + a.na + ' not recorded.');
    for (var y = MIN_YEAR; y <= MAX_YEAR; y++) {
      var rec = a.years[y];
      var d = el('div', 'y ' + (rec ? rec.k : 'out'));
      d.title = y + ': ' + (rec ? LABEL[rec.k] + (rec.details ? ' — ' + rec.details : '') : 'Not in the dataset');
      strip.appendChild(d);
    }
    li.appendChild(strip);
    var yrs = el('div', 'years'); yrs.setAttribute('aria-hidden', 'true');
    yrs.appendChild(el('span', null, MIN_YEAR)); yrs.appendChild(el('span', null, MAX_YEAR));
    li.appendChild(yrs);

    if (a.description) {
      var p = el('p', 'desc', a.description + ' ');
      if (a.link) {
        var l = el('a', null, 'Latest prediction'); l.href = a.link; l.target = '_blank'; l.rel = 'noopener';
        p.appendChild(l);
      }
      li.appendChild(p);
    }
    return li;
  }

  function render() {
    var list = filtered(), ul = $('results');
    ul.textContent = '';
    list.slice(0, shown).forEach(function (a) { ul.appendChild(card(a)); });
    $('status').textContent = list.length
      ? 'Showing ' + Math.min(shown, list.length) + ' of ' + list.length + ' prognosticator' + (list.length === 1 ? '' : 's')
      : 'No prognosticators match those filters.';
    $('more').hidden = list.length <= shown;
    sendHeight();
  }

  function sendHeight() {
    if (window.parent === window) return;
    var h = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'resize', height: h, source: 'groundhog-search' }, '*');
  }

  function onChange() { shown = PAGE; render(); }

  Papa.parse('predictions.csv', {
    download: true, header: true, skipEmptyLines: true,
    complete: function (res) {
      build(res.data);
      var uniq = function (k) {
        var s = {}; animals.forEach(function (a) { s[a[k]] = 1; });
        return Object.keys(s).sort();
      };
      fillSelect($('region'), uniq('region'));
      // types ordered by how many animals have them
      var tc = {}; animals.forEach(function (a) { tc[a.type] = (tc[a.type] || 0) + 1; });
      fillSelect($('type'), Object.keys(tc).sort(function (a, b) { return tc[b] - tc[a] || a.localeCompare(b); }));
      render();
    },
    error: function () { $('status').textContent = 'Sorry, the data failed to load.'; }
  });

  ['q', 'region', 'type', 'sort'].forEach(function (id) {
    $(id).addEventListener(id === 'q' ? 'input' : 'change', onChange);
  });
  $('more').addEventListener('click', function () { shown += PAGE; render(); });
  $('reset').addEventListener('click', function () {
    $('q').value = ''; $('region').value = ''; $('type').value = ''; $('sort').value = 'count'; onChange();
  });
  window.addEventListener('resize', sendHeight);
})();
