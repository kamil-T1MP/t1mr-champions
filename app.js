/* ============================================================
   ЛОГИКА САЙТА: заставка, таблица, модалка, поиск, карта
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 1. ЗАСТАВКА ---------------- */
  const splash  = document.getElementById('splash');
  const enterBtn = document.getElementById('enterBtn');
  const anthem  = document.getElementById('anthem');

  document.body.classList.add('locked');

  function enterSite() {
    if (anthem) { anthem.volume = 0.5; anthem.play().catch(function () {}); }
    splash.classList.add('hide');
    document.body.classList.remove('locked');
    setTimeout(function () { splash.style.display = 'none'; }, 950);
  }
  enterBtn.addEventListener('click', enterSite);
  splash.addEventListener('click', function (e) {
    if (e.target === splash) enterSite();
  });

  /* ---------------- 2. ИНДЕКС КЛУБОВ ---------------- */
  const byId = {};
  CLUBS.forEach(function (c) { byId[c.id] = c; });

  function gd(c) { return c.gf - c.ga; }

  const sorted = CLUBS.slice().sort(function (a, b) {
    return b.points - a.points || gd(b) - gd(a) || b.gf - a.gf ||
           a.name.localeCompare(b.name, 'ru');
  });

  /* ---------------- 3. ТАБЛИЦА ---------------- */
  const tbody = document.getElementById('tableBody');

  function renderTable() {
    let html = '';
    sorted.forEach(function (c, i) {
      const place = i + 1;
      const cls = place <= 8 ? 'r1' : (place <= 24 ? 'r2' : 'r3');
      html +=
        '<tr data-club="' + c.id + '">' +
          '<td><span class="rank ' + cls + '">' + place + '</span></td>' +
          '<td><div class="club-cell">' +
            '<i class="club-dot" style="background:' + c.colors[0] + ';color:' + c.colors[0] + '"></i>' +
            '<span class="club-name">' + c.name + '</span>' +
          '</div></td>' +
          '<td class="hide-sm">' + c.country + '</td>' +
          '<td>' + c.played + '</td>' +
          '<td>' + c.won + '</td>' +
          '<td>' + c.drawn + '</td>' +
          '<td>' + c.lost + '</td>' +
          '<td>' + c.gf + ':' + c.ga + '</td>' +
          '<td class="pts">' + c.points + '</td>' +
        '</tr>';
    });
    tbody.innerHTML = html;

    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.addEventListener('click', function () { openClub(tr.dataset.club); });
    });
  }
  renderTable();

  /* ---------------- 4. МОДАЛКА КЛУБА ---------------- */
  const modal     = document.getElementById('clubModal');
  const modalBox  = document.getElementById('clubModalBox');
  const modalBody = document.getElementById('clubModalContent');
  const modalClose = document.getElementById('modalClose');

  function openClub(id) {
    const c = byId[id];
    if (!c) return;

    const keySet = (c.keys || []).map(function (k) { return k.toLowerCase(); });

    function isKey(name) {
      const n = name.toLowerCase();
      return keySet.some(function (k) { return n.indexOf(k) !== -1 || k.indexOf(n) !== -1; });
    }

    let starsHtml = '';
    (c.keys || []).forEach(function (k) {
      const found = (c.squad || []).find(function (p) {
        return p[0].toLowerCase() === k.toLowerCase();
      });
      const pos = found ? found[1] : '★';
      starsHtml += '<div class="star">' + k + ' <span class="pos">' + pos + '</span></div>';
    });

    let squadHtml = '';
    (c.squad || []).forEach(function (p) {
      const key = isKey(p[0]) ? ' key' : '';
      squadHtml += '<div class="pl' + key + '">' + p[0] +
                   '<span class="pos">' + p[1] + '</span></div>';
    });

    modalBody.innerHTML =
      '<div class="cm-head">' +
        '<div class="cm-top">' +
          '<div class="cm-crest" style="background:linear-gradient(135deg,' +
            c.colors[0] + ',' + c.colors[1] + ')">' + c.short + '</div>' +
          '<div>' +
            '<div class="cm-name">' + c.name + '</div>' +
            '<div class="cm-country">' + c.country + ' · ' + c.city + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="cm-meta">' +
          '<div><span>Стадион</span><b>' + c.stadium + '</b></div>' +
          '<div><span>Тренер</span><b>' + c.coach + '</b></div>' +
          '<div><span>Место</span><b>' + (sorted.indexOf(c) + 1) + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="cm-stats">' +
        '<div class="cm-stat"><b>' + c.played + '</b><span>Игры</span></div>' +
        '<div class="cm-stat"><b>' + c.won + '</b><span>Победы</span></div>' +
        '<div class="cm-stat"><b>' + c.drawn + '</b><span>Ничьи</span></div>' +
        '<div class="cm-stat"><b>' + c.lost + '</b><span>Пораж.</span></div>' +
        '<div class="cm-stat"><b>' + c.gf + ':' + c.ga + '</b><span>Мячи</span></div>' +
        '<div class="cm-stat"><b>' + c.points + '</b><span>Очки</span></div>' +
      '</div>' +
      '<div class="cm-body">' +
        '<div class="cm-title">Ключевые игроки</div>' +
        '<div class="stars">' + starsHtml + '</div>' +
        '<div class="cm-title">Состав</div>' +
        '<div class="squad">' + squadHtml + '</div>' +
      '</div>';

    modal.classList.add('show');
    modalBox.scrollTop = 0;
    document.body.classList.add('locked');
  }

  function closeClub() {
    modal.classList.remove('show');
    document.body.classList.remove('locked');
  }

  modalClose.addEventListener('click', closeClub);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeClub();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeClub();
  });

  /* ---------------- 5. ПОИСК ---------------- */
  const input   = document.getElementById('clubSearch');
  const results = document.getElementById('searchResults');
  let activeIdx = -1;
  let currentList = [];

  function norm(s) {
    return String(s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ё/g, 'е');
  }

  function hay(c) {
    return norm([c.name, c.city, c.country, c.short]
      .concat(c.aliases || []).join(' '));
  }

  function highlight(text, q) {
    if (!q) return text;
    const i = norm(text).indexOf(norm(q));
    if (i < 0) return text;
    return text.slice(0, i) + '<b>' + text.slice(i, i + q.length) + '</b>' +
           text.slice(i + q.length);
  }

  function renderResults(q) {
    const query = norm(q.trim());
    if (!query) { results.classList.remove('show'); currentList = []; return; }

    currentList = CLUBS
      .filter(function (c) { return hay(c).indexOf(query) !== -1; })
      .slice(0, 8);

    if (!currentList.length) {
      results.innerHTML = '<li style="cursor:default;color:#8d8878">Ничего не найдено</li>';
      results.classList.add('show');
      return;
    }

    results.innerHTML = currentList.map(function (c, i) {
      return '<li data-id="' + c.id + '" data-i="' + i + '">' +
        '<i class="club-dot" style="background:' + c.colors[0] + ';color:' + c.colors[0] + '"></i>' +
        '<span class="sr-name">' + highlight(c.name, q.trim()) + '</span>' +
        '<span class="sr-country">' + c.country + '</span>' +
      '</li>';
    }).join('');

    results.classList.add('show');
    activeIdx = -1;

    results.querySelectorAll('li[data-id]').forEach(function (li) {
      li.addEventListener('click', function () {
        openClub(li.dataset.id);
        results.classList.remove('show');
        input.value = byId[li.dataset.id].name;
      });
    });
  }

  input.addEventListener('input', function () { renderResults(input.value); });

  input.addEventListener('keydown', function (e) {
    const items = results.querySelectorAll('li[data-id]');
    if (!items.length) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx += (e.key === 'ArrowDown' ? 1 : -1);
      if (activeIdx < 0) activeIdx = items.length - 1;
      if (activeIdx >= items.length) activeIdx = 0;
      items.forEach(function (li, i) {
        li.classList.toggle('active', i === activeIdx);
      });
    }
    if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      items[activeIdx].click();
    }
    if (e.key === 'Escape') results.classList.remove('show');
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrap')) results.classList.remove('show');
  });

  /* ---------------- 6. КАРТА ---------------- */
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;

  const map = L.map('map', {
    center: [50, 12],
    zoom: 4,
    minZoom: 3,
    maxZoom: 9,
    zoomControl: true,
    worldCopyJump: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  /* подсветка стран с клубами */
  const EUROPE = ['ESP','GBR','ITA','DEU','GER','FRA','PRT','POR',
                  'NLD','NED','BEL','TUR','GRC','GRE','AUT','UKR'];

  fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      L.geoJSON(geo, {
        filter: function (f) { return EUROPE.indexOf(f.id) !== -1; },
        style: {
          color: '#c9a227', weight: 1.2,
          fillColor: '#c9a227', fillOpacity: 0.12
        },
        onEachFeature: function (f, layer) {
          layer.on('mouseover', function () {
            layer.setStyle({ fillOpacity: 0.28, weight: 2 });
          });
          layer.on('mouseout', function () {
            layer.setStyle({ fillOpacity: 0.12, weight: 1.2 });
          });
        }
      }).addTo(map);
    })
    .catch(function () {});

  /* маркеры клубов */
  const clubLayer = L.layerGroup();
  const bubbleLayer = L.layerGroup().addTo(map);

  function pinIcon(c) {
    return L.divIcon({
      className: 'club-marker',
      html: '<div class="pin" style="background:' + c.colors[0] +
            ';color:' + c.colors[1] + '">' + c.short + '</div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  }

  CLUBS.forEach(function (c) {
    const m = L.marker([c.lat, c.lng], { icon: pinIcon(c), title: c.name });
    m.bindTooltip(c.name + ' · ' + c.country, { direction: 'top', offset: [0, -14] });
    m.on('click', function () { openClub(c.id); });
    clubLayer.addLayer(m);
  });

  /* «пузыри» стран при отдалении */
  const groups = {};
  CLUBS.forEach(function (c) {
    (groups[c.cc] = groups[c.cc] || []).push(c);
  });

  Object.keys(groups).forEach(function (cc) {
    const arr = groups[cc];
    const lat = arr.reduce(function (s, c) { return s + c.lat; }, 0) / arr.length;
    const lng = arr.reduce(function (s, c) { return s + c.lng; }, 0) / arr.length;

    const icon = L.divIcon({
      className: 'country-bubble',
      html: '<div class="cb">' + arr.length + '</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const b = L.marker([lat, lng], { icon: icon, title: arr[0].country });
    b.bindTooltip(arr[0].country + ' · ' + arr.length + ' клуб(ов)',
                  { direction: 'top', offset: [0, -18] });
    b.on('click', function () { map.setView([lat, lng], 6); });
    bubbleLayer.addLayer(b);
  });

  /* показ клубов при приближении */
  const hint = document.getElementById('mapHint');

  function updateLayers() {
    if (map.getZoom() >= 5) {
      map.addLayer(clubLayer);
      map.removeLayer(bubbleLayer);
      if (hint) hint.classList.add('hide');
    } else {
      map.removeLayer(clubLayer);
      map.addLayer(bubbleLayer);
      if (hint) hint.classList.remove('hide');
    }
  }
  map.on('zoomend', updateLayers);
  updateLayers();

  window.addEventListener('resize', function () {
    setTimeout(function () { map.invalidateSize(); }, 250);
  });

})();