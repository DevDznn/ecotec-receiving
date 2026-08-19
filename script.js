/* =========================================================================
   WMS SHIPMENT RECEIVING PROCESS — SCRIPT
   Shipment 3137323 / 5 serialized phones
   Source of truth: SHIPMENT_PROCESS_Continued_Shipment_3137323.md

   Structure:
     1. Phone data model (one row per phone, every ID from the walkthrough)
     2. Small render helpers (db-card fields, badges)
     3. Section renderers (one function per page section)
     4. Phone selection state + cross-page highlighting
     5. Scan station (interactive per-phone validation chain)
     6. Nav scroll-spy + lifecycle rail
     7. Tech-details toggle
     8. Progress bar entrance animation
     9. Init
   ========================================================================= */

(function () {
  "use strict";

  /* ---------------- 1. Phone data model ---------------- */
  var PHONES = [
    {
      n: 1, asnRow: 8101, rowNumber: 2,
      extItemId: "IID-01", extSku: "SKU-01", imei: "IMEI-01", serial: "SN-01", price: 446,
      extRefId: 501, itemId: 1001, itemCode: "IP15-128-BLK", itemName: "iPhone 15",
      itemDesc: "Apple iPhone 15 128GB Black Core Unit",
      shipLineId: 7101, shipAssetId: 7201, assetId: 9001,
      idImei: 9101, idSerial: 9102,
      receiptLineId: 5101, receiptAssetId: 5201,
      txnId: 50001, txnNo: "TXN-000501", entryId: 60001, balanceId: 40001,
      scanTime: "09:18"
    },
    {
      n: 2, asnRow: 8102, rowNumber: 3,
      extItemId: "IID-02", extSku: "SKU-02", imei: "IMEI-02", serial: "SN-02", price: 300,
      extRefId: 502, itemId: 1002, itemCode: "IP15-128-BLU", itemName: "iPhone 15",
      itemDesc: "Apple iPhone 15 128GB Blue Core Unit",
      shipLineId: 7102, shipAssetId: 7202, assetId: 9002,
      idImei: 9103, idSerial: 9104,
      receiptLineId: 5102, receiptAssetId: 5202,
      txnId: 50002, txnNo: "TXN-000502", entryId: 60002, balanceId: 40002,
      scanTime: "09:19"
    },
    {
      n: 3, asnRow: 8103, rowNumber: 4,
      extItemId: "IID-03", extSku: "SKU-03", imei: "IMEI-03", serial: "SN-03", price: 448,
      extRefId: 503, itemId: 1003, itemCode: "IP15-256-BLK", itemName: "iPhone 15",
      itemDesc: "Apple iPhone 15 256GB Black Core Unit",
      shipLineId: 7103, shipAssetId: 7203, assetId: 9003,
      idImei: 9105, idSerial: 9106,
      receiptLineId: 5103, receiptAssetId: 5203,
      txnId: 50003, txnNo: "TXN-000503", entryId: 60003, balanceId: 40003,
      scanTime: "09:20"
    },
    {
      n: 4, asnRow: 8104, rowNumber: 5,
      extItemId: "IID-04", extSku: "SKU-04", imei: "IMEI-04", serial: "SN-04", price: 250,
      extRefId: 504, itemId: 1004, itemCode: "IP15PRO-128-BLK", itemName: "iPhone 15 Pro",
      itemDesc: "Apple iPhone 15 Pro 128GB Black Core Unit",
      shipLineId: 7104, shipAssetId: 7204, assetId: 9004,
      idImei: 9107, idSerial: 9108,
      receiptLineId: 5104, receiptAssetId: 5204,
      txnId: 50004, txnNo: "TXN-000504", entryId: 60004, balanceId: 40004,
      scanTime: "09:21"
    },
    {
      n: 5, asnRow: 8105, rowNumber: 6,
      extItemId: "IID-05", extSku: "SKU-05", imei: "IMEI-05", serial: "SN-05", price: 350,
      extRefId: 505, itemId: 1005, itemCode: "IP15-128-WHT", itemName: "iPhone 15",
      itemDesc: "Apple iPhone 15 128GB White Core Unit",
      shipLineId: 7105, shipAssetId: 7205, assetId: 9005,
      idImei: 9109, idSerial: 9110,
      receiptLineId: 5105, receiptAssetId: 5205,
      txnId: 50005, txnNo: "TXN-000505", entryId: 60005, balanceId: 40005,
      scanTime: "09:22"
    }
  ];

  var LOCATION_LABEL = "Receiving Cage – Bay 1 (201)";
  var LOCATION_SHORT = "Receiving Cage – Bay 1";
  var STATE_LABEL = "QUARANTINED";

  var CHECKS = [
    { q: "Is this IMEI expected in Shipment 3137323?", ref: "INBOUND_SHIPMENT_ASSET" },
    { q: "Does the IMEI belong to the expected asset?", ref: "ASSET_IDENTIFIER" },
    { q: "Does the asset point to the expected ITEM_MASTER?", ref: "ASSET_UNIT.item_id" },
    { q: "Has this phone already been received?", ref: "RECEIPT_ASSET (none found)" },
    { q: "Is the serial / IMEI duplicated elsewhere?", ref: "ASSET_IDENTIFIER.normalized_identifier" },
    { q: "Does it match this shipment?", ref: "inbound_shipment_id = 7001" }
  ];

  /* ---------------- 2. Small render helpers ---------------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function techSpan(html, cls) {
    return '<span class="tech-only' + (cls ? " " + cls : "") + '">' + html + "</span>";
  }

  function badge(kind, label) {
    return '<span class="badge badge-' + kind + ' tech-only">' + label + "</span>";
  }

  function field(key, value, badgeHtml) {
    return (
      '<div class="db-field">' +
        '<div class="field-key">' + (badgeHtml || "") + key + "</div>" +
        '<div class="field-value">' + value + "</div>" +
      "</div>"
    );
  }

  function emptyVal() {
    return '<span class="empty">null</span>';
  }

  /* ---------------- 3. Section renderers ---------------- */

  // Section 1 — ASN file rows
  function renderFileRows() {
    var tbody = document.getElementById("asnFileRows");
    if (!tbody) return;
    tbody.innerHTML = PHONES.map(function (p) {
      return (
        "<tr>" +
          "<td>" + p.extItemId + "</td>" +
          "<td>" + p.extSku + "</td>" +
          "<td>" + p.imei + "</td>" +
          "<td>" + p.serial + "</td>" +
          '<td class="price">€' + p.price + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  // Section 1 — 5x ASN_IMPORT_ROW cards
  function renderAsnRowCards() {
    var host = document.getElementById("asnRowCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return (
        '<div class="db-card theme-asn highlightable" data-phone="' + p.n + '">' +
          '<div class="db-card-head">' +
            '<div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + "</span> ASN_IMPORT_ROW</div>" +
            '<span class="status-chip chip-expected">' + p.asnRow + "</span>" +
          "</div>" +
          '<div class="db-card-body">' +
            field(badge("pk", "PK") + "import_row_id", p.asnRow) +
            field(badge("source", "SRC") + "imei", p.imei) +
            field(badge("source", "SRC") + "serial_number", p.serial) +
            field(badge("source", "SRC") + "item_id / sku", p.extItemId + " / " + p.extSku) +
            field(badge("source", "SRC") + "price", "€" + p.price) +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  // Section 3 — 5x expected INBOUND_SHIPMENT_ASSET (dashed / pending)
  function renderExpectedAssetCards() {
    var host = document.getElementById("expectedAssetCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return (
        '<div class="phone-card phone-card--pending highlightable" data-phone="' + p.n + '">' +
          '<div class="pc-head"><span class="pc-num">Phone ' + p.n + '</span><span class="status-chip chip-pending">PENDING</span></div>' +
          '<div class="pc-fields">' +
            "<span>" + badge("fk", "FK") + "Asset <b>" + p.assetId + "</b></span>" +
            "<span>IMEI <b>" + p.imei + "</b></span>" +
            "<span>Serial <b>" + p.serial + "</b></span>" +
            '<span class="tech-only">Shipment asset <b>' + p.shipAssetId + "</b></span>" +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  // Section 4 — ASSET_UNIT + ASSET_IDENTIFIER cards
  function renderAssetIdentityCards() {
    var host = document.getElementById("assetIdentityCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return (
        '<div class="db-card theme-item highlightable" data-phone="' + p.n + '">' +
          '<div class="db-card-head">' +
            '<div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + "</span> ASSET_UNIT " + p.assetId + "</div>" +
          "</div>" +
          '<div class="db-card-body">' +
            field(badge("pk", "PK") + "asset_id", p.assetId) +
            field(badge("fk", "FK") + "item_id", p.itemId + " (" + p.itemCode + ")") +
            field("id_type <b>IMEI</b>" , p.imei + techSpan(" · #" + p.idImei, "")) +
            field("id_type <b>SERIAL_NUMBER</b>", p.serial + techSpan(" · #" + p.idSerial, "")) +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  // Section 6 — RECEIPT_LINE rows before scanning
  function renderReceiptLineRows() {
    var tbody = document.getElementById("receiptLineRows");
    if (!tbody) return;
    tbody.innerHTML = PHONES.map(function (p) {
      return (
        '<tr class="highlightable" data-phone="' + p.n + '">' +
          "<td>" + p.receiptLineId + "</td>" +
          "<td>" + p.itemId + " · " + p.itemCode + "</td>" +
          "<td>1</td>" +
          '<td class="rl-actual">0</td>' +
          '<td class="status-chip chip-pending" style="display:inline-block">OPEN</td>' +
        "</tr>"
      );
    }).join("");
  }

  // Section 9 — ledger transaction + entry cards
  function renderLedgerCards() {
    var host = document.getElementById("ledgerCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return (
        '<div class="db-card-grid highlightable" data-phone="' + p.n + '" style="margin-bottom:18px">' +
          '<div class="db-card theme-ledger">' +
            '<div class="db-card-head">' +
              '<div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + "</span> INVENTORY_TRANSACTION</div>" +
              '<span class="status-chip chip-posted">' + p.txnNo + "</span>" +
            "</div>" +
            '<div class="db-card-body">' +
              field(badge("pk", "PK") + "transaction_id", p.txnId) +
              field(badge("gen", "SYS") + "idempotency_key", techSpan("RCPT-2026-00081-RA-" + p.receiptAssetId)) +
              field("source_document", "RECEIPT_ASSET / " + p.receiptAssetId) +
              field("status_id", "POSTED") +
              field("posted_by", "USER-22") +
            "</div>" +
          "</div>" +
          '<div class="db-card theme-ledger">' +
            '<div class="db-card-head">' +
              '<div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + "</span> INVENTORY_ENTRY</div>" +
              '<span class="status-chip chip-posted">#' + p.entryId + "</span>" +
            "</div>" +
            '<div class="db-card-body">' +
              field(badge("pk", "PK") + "entry_id", p.entryId) +
              field(badge("fk", "FK/UQ") + "transaction_id", p.txnId) +
              field("asset_id / item_id", p.assetId + " / " + p.itemId) +
              field("from → to location", emptyVal() + " → " + LOCATION_LABEL) +
              field("to_state / qty / cost", STATE_LABEL + " · 1 EA · €" + p.price) +
            "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  // Section 10 — current position cards
  function renderCurrentPositionCards() {
    var host = document.getElementById("currentPositionCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return (
        '<div class="db-card theme-current highlightable" data-phone="' + p.n + '">' +
          '<div class="db-card-head">' +
            '<div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + "</span> ASSET_CURRENT_POSITION</div>" +
            '<span class="status-chip chip-current">LIVE</span>' +
          "</div>" +
          '<div class="db-card-body">' +
            field(badge("pk", "PK/FK") + "asset_id", p.assetId) +
            field("IMEI / Serial", p.imei + " / " + p.serial) +
            field("location_id", LOCATION_LABEL) +
            field("inventory_state_id", STATE_LABEL) +
            field(badge("ledger", "LEDGER") + "last_transaction_id", p.txnNo) +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  // Section 11 — inventory balance rows
  function renderBalanceRows() {
    var tbody = document.getElementById("balanceRows");
    if (!tbody) return;
    tbody.innerHTML = PHONES.map(function (p) {
      return (
        '<tr class="highlightable" data-phone="' + p.n + '">' +
          "<td>" + p.balanceId + "</td>" +
          "<td>" + p.itemId + " · " + p.itemCode + "</td>" +
          "<td>" + STATE_LABEL + "</td>" +
          "<td>1</td>" +
          "<td>0</td>" +
          "<td><b>0</b> " + techSpan("(state not available)") + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  // Section 13 — final table
  function renderFinalTable() {
    var tbody = document.getElementById("finalTableRows");
    if (!tbody) return;
    tbody.innerHTML = PHONES.map(function (p) {
      return (
        '<tr class="highlightable" data-phone="' + p.n + '">' +
          "<td>Phone " + p.n + "</td>" +
          "<td>" + p.asnRow + "</td>" +
          "<td>" + p.assetId + "</td>" +
          "<td>" + p.imei + "</td>" +
          "<td>" + p.serial + "</td>" +
          "<td>" + p.receiptAssetId + "</td>" +
          "<td>" + p.txnNo + "</td>" +
          "<td>" + p.entryId + "</td>" +
          "<td>" + LOCATION_SHORT + "</td>" +
          '<td><span class="status-chip chip-current" style="display:inline-block">' + STATE_LABEL + "</span></td>" +
        "</tr>"
      );
    }).join("");
  }

  // Phone tabs (used in multiple sections)
  function renderPhoneTabs(container) {
    container.innerHTML = PHONES.map(function (p) {
      return (
        '<button class="phone-tab" data-phone="' + p.n + '" type="button">' +
          "Phone " + p.n + '<span class="tab-imei">' + p.imei + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function initPhoneTabs() {
    var groups = document.querySelectorAll(".phone-selector");
    groups.forEach(function (g) { renderPhoneTabs(g); });
  }

  /* ---------------- 4 & 5. Selection state + scan station ---------------- */
  var selectedPhone = 1;

  function getPhone(n) {
    for (var i = 0; i < PHONES.length; i++) if (PHONES[i].n === n) return PHONES[i];
    return PHONES[0];
  }

  function renderScanStation(n) {
    var p = getPhone(n);
    var readout = document.getElementById("scanReadout");
    var chain = document.getElementById("checkChain");
    var card = document.getElementById("scanReceiptAssetCard");
    if (!readout || !chain || !card) return;

    readout.innerHTML =
      p.imei + '<span class="serial">SN ' + p.serial + "</span>";

    chain.innerHTML = CHECKS.map(function (c, i) {
      return (
        '<div class="check-step" style="animation-delay:' + (i * 90) + 'ms">' +
          '<span class="ci">✓</span>' +
          '<span class="cq">' + c.q + '</span>' +
          '<span class="cr tech-only">' + c.ref + '</span>' +
        "</div>"
      );
    }).join("") + '<div class="check-chain result">MATCHED — Phone ' + p.n + " physically received</div>";

    card.innerHTML =
      '<div class="db-card theme-receiving">' +
        '<div class="db-card-head">' +
          '<div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + "</span> RECEIPT_ASSET</div>" +
          '<span class="status-chip chip-matched">MATCHED</span>' +
        "</div>" +
        '<div class="db-card-body">' +
          field(badge("pk", "PK") + "receipt_asset_id", p.receiptAssetId) +
          field(badge("fk", "FK") + "receipt_line_id", p.receiptLineId) +
          field(badge("fk", "FK") + "asset_id", p.assetId) +
          field(badge("fk", "FK") + "inbound_shipment_asset_id", p.shipAssetId) +
          field("condition_code", "GOOD") +
          field("initial_location_id", LOCATION_LABEL) +
          field("initial_inventory_state_id", STATE_LABEL) +
          field(badge("scan", "SCAN") + "validated_at", "2026-08-20 " + p.scanTime) +
        "</div>" +
      "</div>";
    // Note: the Expected/Received/Missing/Unexpected counters below the scan
    // station always reflect the final, completed state of this receipt
    // (5/5) — they are not tied to which phone tab is currently open for
    // inspection. The progress bar's 0→5 fill (see initProgressAnimation)
    // is the one-time entrance animation that shows how that total was built.
  }

  function setSelectedPhone(n) {
    selectedPhone = n;

    document.querySelectorAll(".phone-tab").forEach(function (btn) {
      btn.classList.toggle("is-selected", Number(btn.dataset.phone) === n);
    });

    document.querySelectorAll(".highlightable[data-phone]").forEach(function (item) {
      var match = Number(item.dataset.phone) === n;
      item.classList.toggle("is-dimmed", !match);
      item.classList.toggle("is-focused", match);
    });

    renderScanStation(n);

    var traceLabel = document.getElementById("traceActivePhone");
    if (traceLabel) traceLabel.textContent = "Phone " + n;
    renderTrace(n);
  }

  function renderTrace(n) {
    var p = getPhone(n);
    var host = document.getElementById("traceFlow");
    if (!host) return;
    var nodes = [
      ["Shipment_3137323.xlsx", "source Excel file"],
      ["ASN_IMPORT_BATCH 8001", "import_batch_id"],
      ["ASN_IMPORT_ROW " + p.asnRow, "import_row_id"],
      [p.extItemId + " / " + p.extSku, "external item + sku"],
      ["ITEM_EXTERNAL_REFERENCE " + p.extRefId, "external_item_id match"],
      ["ITEM_MASTER " + p.itemId, "item_id"],
      ["INBOUND_SHIPMENT 7001", "import_batch_id"],
      ["INBOUND_SHIPMENT_LINE " + p.shipLineId, "inbound_shipment_id"],
      ["INBOUND_SHIPMENT_ASSET " + p.shipAssetId, "inbound_shipment_line_id"],
      ["ASSET_UNIT " + p.assetId, "asset_id"],
      [p.imei + " / " + p.serial, "asset_identifier"],
      ["RECEIPT 5001", "inbound_shipment_id"],
      ["RECEIPT_LINE " + p.receiptLineId, "receipt_id"],
      ["RECEIPT_ASSET " + p.receiptAssetId, "receipt_line_id"],
      ["INVENTORY_TRANSACTION " + p.txnId, "source_document_id"],
      ["INVENTORY_ENTRY " + p.entryId, "transaction_id (FK/UQ)"],
      ["ASSET_CURRENT_POSITION", "asset_id"],
      [LOCATION_SHORT, "location_id"],
      [STATE_LABEL, "inventory_state_id"]
    ];
    host.innerHTML = nodes.map(function (node, i) {
      var connector = i === 0 ? "" :
        '<div class="trace-connector"><div class="tc-line"></div>' +
        '<div class="tc-label tech-only">' + nodes[i][1] + '</div><div class="tc-line"></div></div>';
      return connector +
        '<div class="trace-node"><div class="tn-table">' + node[0] + '</div></div>';
    }).join("");
  }

  /* ---------------- 6. Nav scroll-spy + lifecycle rail ---------------- */
  function initScrollSpy() {
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-nav-id]"));
    var navBtns = document.querySelectorAll(".nav-btn");
    var railStages = document.querySelectorAll(".rail-stage");

    if (!("IntersectionObserver" in window) || !sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute("data-nav-id");
        var stage = entry.target.getAttribute("data-stage");

        navBtns.forEach(function (b) {
          b.classList.toggle("is-active", b.dataset.target === id);
        });
        railStages.forEach(function (r) {
          r.setAttribute("data-live", String(r.dataset.stage === stage));
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  function initNavClicks() {
    document.querySelectorAll(".nav-btn, .process-node").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.dataset.target;
        var target = document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ---------------- 7. Tech-details toggle ---------------- */
  function initTechToggle() {
    var toggle = document.getElementById("techSwitch");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var on = document.body.classList.toggle("tech-mode");
      toggle.classList.toggle("is-on", on);
      toggle.setAttribute("aria-checked", String(on));
    });
  }

  /* ---------------- 8. Progress bar entrance animation ---------------- */
  function initProgressAnimation() {
    var section = document.getElementById("sec-scanning");
    var fill = document.getElementById("progressFill");
    var progressText = document.getElementById("progressText");
    var receivedCounter = document.querySelector("#scanCounters [data-c='received']");
    if (!section || !fill) return;

    var played = false;
    var steps = [0, 1, 2, 3, 4, 5];

    function play() {
      if (played) return;
      played = true;
      var i = 0;
      var timer = setInterval(function () {
        i++;
        var pct = (steps[i] / 5) * 100;
        fill.style.width = pct + "%";
        if (progressText) progressText.textContent = steps[i] + " / 5";
        if (receivedCounter) receivedCounter.textContent = steps[i];
        if (i >= steps.length - 1) clearInterval(timer);
      }, 260);
    }

    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) play(); });
      }, { threshold: 0.35 });
      obs.observe(section);
    } else {
      play();
    }
  }

  /* ---------------- 9. Init ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderFileRows();
    renderAsnRowCards();
    renderExpectedAssetCards();
    renderAssetIdentityCards();
    renderReceiptLineRows();
    renderLedgerCards();
    renderCurrentPositionCards();
    renderBalanceRows();
    renderFinalTable();

    initPhoneTabs();

    document.addEventListener("click", function (e) {
      var tab = e.target.closest(".phone-tab");
      if (tab) setSelectedPhone(Number(tab.dataset.phone));
    });

    setSelectedPhone(1);
    initScrollSpy();
    initNavClicks();
    initTechToggle();
    initProgressAnimation();
  });
})();
