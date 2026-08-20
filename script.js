/* =========================================================================
   WMS WAREHOUSE CORES RECEIVING — INTERACTIVE PROCESS VISUALIZATION
   Shipment 3137323 / 5 serialized phones

   Grounding used by this demo:
   - Actual operational flow supplied by the user:
     ASN -> Shipping Details -> Delivery Notes -> Packaging VI -> IMEI Registration
     -> Receiving Report -> Endorsement to Triage; failures escalate to Customer
     Focal Person -> Customer -> Disposition (Proceed / Ship Back).
   - Frozen ERD already contains RECEIVING_EXCEPTION, FAILURE_REPORT,
     DISPOSITION_REQUEST, DISPOSITION_DECISION, IDENTIFIER_CORRECTION_REQUEST,
     declared_qty / actual_qty / variance_qty on RECEIPT_LINE, and the 1:1
     INVENTORY_TRANSACTION -> INVENTORY_ENTRY ledger.
   ========================================================================= */

(function () {
  "use strict";

  var PHONES = [
    { n: 1, asnRow: 8101, rowNumber: 2, extItemId: "IID-01", extSku: "SKU-01", imei: "IMEI-01", serial: "SN-01", price: 446, extRefId: 501, itemId: 1001, itemCode: "IP15-128-BLK", itemName: "iPhone 15", itemDesc: "Apple iPhone 15 128GB Black Core Unit", shipLineId: 7101, shipAssetId: 7201, assetId: 9001, idImei: 9101, idSerial: 9102, receiptLineId: 5101, receiptAssetId: 5201, txnId: 50001, txnNo: "TXN-000501", entryId: 60001, balanceId: 40001, scanTime: "09:18" },
    { n: 2, asnRow: 8102, rowNumber: 3, extItemId: "IID-02", extSku: "SKU-02", imei: "IMEI-02", serial: "SN-02", price: 300, extRefId: 502, itemId: 1002, itemCode: "IP15-128-BLU", itemName: "iPhone 15", itemDesc: "Apple iPhone 15 128GB Blue Core Unit", shipLineId: 7102, shipAssetId: 7202, assetId: 9002, idImei: 9103, idSerial: 9104, receiptLineId: 5102, receiptAssetId: 5202, txnId: 50002, txnNo: "TXN-000502", entryId: 60002, balanceId: 40002, scanTime: "09:19" },
    { n: 3, asnRow: 8103, rowNumber: 4, extItemId: "IID-03", extSku: "SKU-03", imei: "IMEI-03", serial: "SN-03", price: 448, extRefId: 503, itemId: 1003, itemCode: "IP15-256-BLK", itemName: "iPhone 15", itemDesc: "Apple iPhone 15 256GB Black Core Unit", shipLineId: 7103, shipAssetId: 7203, assetId: 9003, idImei: 9105, idSerial: 9106, receiptLineId: 5103, receiptAssetId: 5203, txnId: 50003, txnNo: "TXN-000503", entryId: 60003, balanceId: 40003, scanTime: "09:20" },
    { n: 4, asnRow: 8104, rowNumber: 5, extItemId: "IID-04", extSku: "SKU-04", imei: "IMEI-04", serial: "SN-04", price: 250, extRefId: 504, itemId: 1004, itemCode: "IP15PRO-128-BLK", itemName: "iPhone 15 Pro", itemDesc: "Apple iPhone 15 Pro 128GB Black Core Unit", shipLineId: 7104, shipAssetId: 7204, assetId: 9004, idImei: 9107, idSerial: 9108, receiptLineId: 5104, receiptAssetId: 5204, txnId: 50004, txnNo: "TXN-000504", entryId: 60004, balanceId: 40004, scanTime: "09:21" },
    { n: 5, asnRow: 8105, rowNumber: 6, extItemId: "IID-05", extSku: "SKU-05", imei: "IMEI-05", serial: "SN-05", price: 350, extRefId: 505, itemId: 1005, itemCode: "IP15-128-WHT", itemName: "iPhone 15", itemDesc: "Apple iPhone 15 128GB White Core Unit", shipLineId: 7105, shipAssetId: 7205, assetId: 9005, idImei: 9109, idSerial: 9110, receiptLineId: 5105, receiptAssetId: 5205, txnId: 50005, txnNo: "TXN-000505", entryId: 60005, balanceId: 40005, scanTime: "09:22" }
  ];

  var LOCATION_LABEL = "Receiving Cage – Bay 1 (201)";
  var LOCATION_SHORT = "Receiving Cage – Bay 1";
  var STATE_LABEL = "QUARANTINED";
  var ACTUAL_MISMATCH_IMEI = "IMEI-99";

  var CHECKS = [
    { q: "Is this IMEI expected in Shipment 3137323?", ref: "INBOUND_SHIPMENT_ASSET.expected_imei" },
    { q: "Does the physical IMEI tally with the ASN asset?", ref: "ASSET_IDENTIFIER / ASN" },
    { q: "Does the asset resolve to the expected ITEM_MASTER?", ref: "ASSET_UNIT.item_id" },
    { q: "Has this phone already been received?", ref: "RECEIPT_ASSET duplicate check" },
    { q: "Is the IMEI / serial unique in the warehouse?", ref: "ASSET_IDENTIFIER.normalized_identifier" },
    { q: "Does it belong to this shipment?", ref: "inbound_shipment_id = 7001" }
  ];

  var SCENARIO_INFO = {
    normal: {
      label: "NORMAL RECEIVING",
      title: "All goods received — 5/5 phones tally with ASN",
      explanation: "Packaging passes, all five physical IMEIs match the ASN, the Receiving Report has zero variance, and the five accepted phones can be posted to quarantined inventory."
    },
    tampered: {
      label: "TAMPERED PACKAGING",
      title: "Packaging VI fails before normal IMEI enrollment",
      explanation: "Warehouse Receiving documents the broken/tampered seal, sends the report to the Customer Focal Person, and waits for customer disposition: PROCEED or SHIP BACK."
    },
    missing: {
      label: "MISSING PHONE",
      title: "ASN says 5, but only 4 phones are physically present",
      explanation: "The system preserves Declared = 5, Actual = 4, Variance = -1. Phone 5 is never invented as received and never receives a ledger entry."
    },
    imei: {
      label: "FAILED IMEI",
      title: "Phone 3 physical IMEI does not tally with the ASN",
      explanation: "Expected IMEI-03 remains unchanged. The physical scan IMEI-99 fails WMS validation and requires a Receiving Report plus customer disposition before the authorized Customer Focal Person can manually enroll the approved IMEI."
    }
  };

  var state = {
    scenario: "normal",
    disposition: "none",
    selectedPhone: 1
  };

  function techSpan(html, cls) {
    return '<span class="tech-only' + (cls ? " " + cls : "") + '">' + html + "</span>";
  }

  function badge(kind, label) {
    return '<span class="badge badge-' + kind + ' tech-only">' + label + "</span>";
  }

  function field(key, value, badgeHtml) {
    return '<div class="db-field"><div class="field-key">' + (badgeHtml || "") + key + '</div><div class="field-value">' + value + "</div></div>";
  }

  function emptyVal() {
    return '<span class="empty">null</span>';
  }

  function getPhone(n) {
    for (var i = 0; i < PHONES.length; i += 1) if (PHONES[i].n === n) return PHONES[i];
    return PHONES[0];
  }

  function isExceptionScenario() {
    return state.scenario !== "normal";
  }

  function scenarioState() {
    var d = state.disposition;
    if (state.scenario === "normal") {
      return { expected: 5, physical: 5, matched: 5, missing: 0, mismatch: 0, packaging: "PASS", report: "PASS", posted: 5, finalStatus: "POSTED", inventoryState: STATE_LABEL, location: LOCATION_SHORT };
    }
    if (state.scenario === "tampered") {
      if (d === "proceed") return { expected: 5, physical: 5, matched: 5, missing: 0, mismatch: 0, packaging: "FAIL — TAMPERED", report: "FAIL · APPROVED", posted: 5, finalStatus: "POSTED AFTER DISPOSITION", inventoryState: STATE_LABEL, location: LOCATION_SHORT };
      if (d === "shipback") return { expected: 5, physical: null, matched: 0, missing: 0, mismatch: 0, packaging: "FAIL — TAMPERED", report: "FAIL", posted: 0, finalStatus: "SHIP BACK", inventoryState: "NOT POSTED", location: "Receiving Hold / Return" };
      return { expected: 5, physical: null, matched: 0, missing: 0, mismatch: 0, packaging: "FAIL — TAMPERED", report: "FAIL", posted: 0, finalStatus: "AWAITING DISPOSITION", inventoryState: "NOT POSTED", location: "Receiving Hold" };
    }
    if (state.scenario === "missing") {
      if (d === "proceed") return { expected: 5, physical: 4, matched: 4, missing: 1, mismatch: 0, packaging: "PASS", report: "FAIL · APPROVED", posted: 4, finalStatus: "PARTIAL POSTED", inventoryState: STATE_LABEL, location: LOCATION_SHORT };
      if (d === "shipback") return { expected: 5, physical: 4, matched: 4, missing: 1, mismatch: 0, packaging: "PASS", report: "FAIL", posted: 0, finalStatus: "SHIP BACK", inventoryState: "NOT POSTED", location: "Receiving Hold / Return" };
      return { expected: 5, physical: 4, matched: 4, missing: 1, mismatch: 0, packaging: "PASS", report: "FAIL", posted: 0, finalStatus: "AWAITING DISPOSITION", inventoryState: "NOT POSTED", location: "Receiving Hold" };
    }
    if (d === "proceed") return { expected: 5, physical: 5, matched: 4, missing: 0, mismatch: 1, packaging: "PASS", report: "FAIL · APPROVED", posted: 5, finalStatus: "POSTED AFTER MANUAL ENROLLMENT", inventoryState: STATE_LABEL, location: LOCATION_SHORT };
    if (d === "shipback") return { expected: 5, physical: 5, matched: 4, missing: 0, mismatch: 1, packaging: "PASS", report: "FAIL", posted: 0, finalStatus: "SHIP BACK", inventoryState: "NOT POSTED", location: "Receiving Hold / Return" };
    return { expected: 5, physical: 5, matched: 4, missing: 0, mismatch: 1, packaging: "PASS", report: "FAIL", posted: 0, finalStatus: "AWAITING DISPOSITION", inventoryState: "NOT POSTED", location: "Receiving Hold" };
  }

  function displayActualImei(p) {
    return state.scenario === "imei" && p.n === 3 ? ACTUAL_MISMATCH_IMEI : p.imei;
  }

  function phonePhysicallyPresent(p) {
    if (state.scenario === "tampered" && state.disposition !== "proceed") return false;
    if (state.scenario === "missing" && p.n === 5) return false;
    return true;
  }

  function phoneMatchesNormally(p) {
    if (!phonePhysicallyPresent(p)) return false;
    if (state.scenario === "imei" && p.n === 3) return false;
    return true;
  }

  function hasReceiptAsset(p) {
    if (state.scenario === "normal") return true;
    if (state.scenario === "tampered") return state.disposition === "proceed";
    if (state.scenario === "missing") return p.n !== 5;
    if (state.scenario === "imei") return p.n !== 3 || state.disposition === "proceed";
    return false;
  }

  function isPhonePosted(p) {
    if (state.scenario === "normal") return true;
    if (state.disposition !== "proceed") return false;
    if (state.scenario === "missing") return p.n !== 5;
    return true;
  }

  function postedPhones() {
    return PHONES.filter(isPhonePosted);
  }

  function fmtCount(v) {
    return v === null ? "—" : String(v);
  }

  function toneClassFor(text) {
    var t = String(text).toUpperCase();
    if (t.indexOf("PASS") >= 0 || t.indexOf("POSTED") >= 0 || t.indexOf("PROCEED") >= 0 || t.indexOf("QUARANTINED") >= 0) return "tone-pass";
    if (t.indexOf("FAIL") >= 0 || t.indexOf("SHIP BACK") >= 0 || t.indexOf("MISSING") >= 0 || t.indexOf("MISMATCH") >= 0) return "tone-fail";
    if (t.indexOf("AWAIT") >= 0 || t.indexOf("PENDING") >= 0 || t.indexOf("NOT POSTED") >= 0) return "tone-warn";
    return "";
  }

  function setText(id, text, tone) {
    var e = document.getElementById(id);
    if (!e) return;
    e.textContent = text;
    e.classList.remove("tone-pass", "tone-fail", "tone-warn", "tone-muted", "status-posted", "status-quarantined");
    if (tone) e.classList.add(tone);
  }

  /* ---------------- Static expected-side renderers ---------------- */
  function renderFileRows() {
    var tbody = document.getElementById("asnFileRows");
    if (!tbody) return;
    tbody.innerHTML = PHONES.map(function (p) {
      return "<tr><td>" + p.extItemId + "</td><td>" + p.extSku + "</td><td>" + p.imei + "</td><td>" + p.serial + '</td><td class="price">€' + p.price + "</td></tr>";
    }).join("");
  }

  function renderAsnRowCards() {
    var host = document.getElementById("asnRowCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return '<div class="db-card theme-asn highlightable" data-phone="' + p.n + '"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> ASN_IMPORT_ROW</div><span class="status-chip chip-expected">' + p.asnRow + '</span></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "import_row_id", p.asnRow) +
        field(badge("source", "SRC") + "imei", p.imei) +
        field(badge("source", "SRC") + "serial_number", p.serial) +
        field(badge("source", "SRC") + "item_id / sku", p.extItemId + " / " + p.extSku) +
        field(badge("source", "SRC") + "price", "€" + p.price) +
        "</div></div>";
    }).join("");
  }

  function renderExpectedAssetCards() {
    var host = document.getElementById("expectedAssetCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return '<div class="phone-card phone-card--pending highlightable" data-phone="' + p.n + '"><div class="pc-head"><span class="pc-num">Phone ' + p.n + '</span><span class="status-chip chip-pending">EXPECTED</span></div><div class="pc-fields"><span>' + badge("fk", "FK") + 'Asset <b>' + p.assetId + '</b></span><span>Expected IMEI <b>' + p.imei + '</b></span><span>Expected Serial <b>' + p.serial + '</b></span><span class="tech-only">Shipment asset <b>' + p.shipAssetId + "</b></span></div></div>";
    }).join("");
  }

  function renderAssetIdentityCards() {
    var host = document.getElementById("assetIdentityCards");
    if (!host) return;
    host.innerHTML = PHONES.map(function (p) {
      return '<div class="db-card theme-item highlightable" data-phone="' + p.n + '"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> ASSET_UNIT ' + p.assetId + '</div></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "asset_id", p.assetId) +
        field(badge("fk", "FK") + "item_id", p.itemId + " (" + p.itemCode + ")") +
        field("expected id_type <b>IMEI</b>", p.imei + techSpan(" · #" + p.idImei)) +
        field("expected id_type <b>SERIAL_NUMBER</b>", p.serial + techSpan(" · #" + p.idSerial)) +
        "</div></div>";
    }).join("");
  }

  /* ---------------- Scenario / summary ---------------- */
  function renderScenarioHeader() {
    var info = SCENARIO_INFO[state.scenario];
    var e = document.getElementById("scenarioExplainer");
    if (e) e.innerHTML = '<strong>' + info.title + '</strong><span>' + info.explanation + "</span>";
    setText("summaryScenario", info.label);

    document.querySelectorAll(".scenario-btn").forEach(function (btn) {
      var selected = btn.dataset.scenario === state.scenario;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });
  }

  function renderSummary() {
    var s = scenarioState();
    setText("sumExpected", s.expected);
    setText("sumReceived", fmtCount(s.physical), s.physical === null ? "tone-muted" : "");
    setText("sumMatched", s.matched, s.matched === 5 ? "tone-pass" : (s.matched < 5 ? "tone-warn" : ""));
    setText("sumMissing", s.missing, s.missing ? "tone-fail" : "");
    setText("sumMismatch", s.mismatch, s.mismatch ? "tone-fail" : "");
    setText("sumPackaging", s.packaging, toneClassFor(s.packaging));
    setText("sumReport", s.report, toneClassFor(s.report));
    var disp = state.scenario === "normal" ? "NOT REQUIRED" : (state.disposition === "proceed" ? "PROCEED" : state.disposition === "shipback" ? "SHIP BACK" : "PENDING");
    setText("sumDisposition", disp, toneClassFor(disp));
    setText("sumPosted", s.posted, s.posted ? "tone-pass" : "tone-muted");
    setText("sumFinalStatus", s.finalStatus, toneClassFor(s.finalStatus));
    setText("sumInventoryState", s.inventoryState, toneClassFor(s.inventoryState));
  }

  /* ---------------- Real operational flow ---------------- */
  function flowNode(role, title, status, detail) {
    return '<div class="role-flow-node ' + (status === "PASS" ? "is-pass" : status === "FAIL" ? "is-fail" : status === "STOP" ? "is-stop" : status === "WAIT" ? "is-wait" : "") + '"><span class="rfn-role">' + role + '</span><strong>' + title + '</strong><span class="rfn-status">' + status + '</span>' + (detail ? '<small>' + detail + '</small>' : "") + "</div>";
  }

  function flowArrow(label) {
    return '<div class="role-flow-arrow">→' + (label ? '<small>' + label + "</small>" : "") + "</div>";
  }

  function renderOperationalFlow() {
    var host = document.getElementById("operationalFlow");
    if (!host) return;
    var parts = [];
    parts.push(flowNode("Customer Focal Person", "Advance Shipment Notice", "PASS", "ASN enrolled in WMS"));
    parts.push(flowArrow(""));
    parts.push(flowNode("IMPEX", "Shipping Details", "PASS", "Arrival, qty, courier"));
    parts.push(flowArrow(""));
    parts.push(flowNode("Warehouse Receiving", "Delivery Notes Verification", "PASS", "DR / invoice / packing list"));
    parts.push(flowArrow(""));

    if (state.scenario === "tampered") {
      parts.push(flowNode("Warehouse Receiving", "VI of Packaging", "FAIL", "Broken / tampered seal"));
      parts.push(flowArrow("A · FAIL"));
      parts.push(flowNode("Warehouse Receiving", "Receiving Failure Report", "FAIL", "Document evidence + remarks"));
      parts.push(flowArrow(""));
      parts.push(flowNode("Customer Focal Person", "Feedback to Customer", "WAIT", "Ask for disposition"));
      parts.push(flowArrow(""));
      if (state.disposition === "proceed") {
        parts.push(flowNode("Customer", "Disposition", "PASS", "PROCEED"));
        parts.push(flowArrow("resume"));
        parts.push(flowNode("Warehouse Receiving", "IMEI Registration", "PASS", "5/5 tally after controlled opening"));
        parts.push(flowArrow(""));
        parts.push(flowNode("Warehouse Receiving", "Internal Label + Report", "PASS", "Endorsement to Triage ready"));
      } else if (state.disposition === "shipback") {
        parts.push(flowNode("Customer", "Disposition", "STOP", "SHIP BACK"));
      } else {
        parts.push(flowNode("Customer", "Disposition", "WAIT", "PENDING"));
      }
    } else {
      parts.push(flowNode("Warehouse Receiving", "VI of Packaging", "PASS", "Open actual box"));
      parts.push(flowArrow("B · PASS"));
      if (state.scenario === "normal") {
        parts.push(flowNode("Warehouse Receiving", "IMEI Registration", "PASS", "5/5 IMEI vs ASN tally"));
        parts.push(flowArrow(""));
        parts.push(flowNode("Warehouse Receiving", "Internal Label + Receiving Report", "PASS", "Variance 0"));
        parts.push(flowArrow(""));
        parts.push(flowNode("Warehouse Receiving", "Endorsement to Triage", "PASS", "Next operational handoff"));
      } else {
        var failDetail = state.scenario === "missing" ? "Declared 5 / Actual 4" : "Phone 3: IMEI-03 ≠ IMEI-99";
        parts.push(flowNode("Warehouse Receiving", state.scenario === "missing" ? "Count / IMEI Enrollment" : "IMEI vs ASN Verification", "FAIL", failDetail));
        parts.push(flowArrow("FAIL"));
        parts.push(flowNode("Warehouse Receiving", "Receiving Failure Report", "FAIL", "Variance / discrepancy retained"));
        parts.push(flowArrow(""));
        parts.push(flowNode("Customer Focal Person", "Feedback to Customer", "WAIT", "Ask for disposition"));
        parts.push(flowArrow(""));
        if (state.disposition === "proceed") {
          parts.push(flowNode("Customer", "Disposition", "PASS", "PROCEED"));
          parts.push(flowArrow("authorized"));
          if (state.scenario === "imei") parts.push(flowNode("Customer Focal Person", "Manual IMEI Enrollment", "PASS", "Approved IMEI-99"));
          else parts.push(flowNode("Warehouse Receiving", "Accept 4 Physical Phones", "PASS", "Phone 5 remains missing"));
          parts.push(flowArrow(""));
          parts.push(flowNode("Warehouse Receiving", "Internal Label + Report", "PASS", "Endorsement to Triage ready"));
        } else if (state.disposition === "shipback") {
          parts.push(flowNode("Customer", "Disposition", "STOP", "SHIP BACK"));
        } else {
          parts.push(flowNode("Customer", "Disposition", "WAIT", "PENDING"));
        }
      }
    }
    host.innerHTML = parts.join("");

    var packageFail = state.scenario === "tampered";
    setText("packageGateValue", packageFail ? "FAIL" : "PASS", packageFail ? "tone-fail" : "tone-pass");
    setText("packageGateNote", packageFail ? "Security seal is broken / tampered. Branch to failure report before normal IMEI registration." : "Physical box and seal are acceptable. Open box and proceed to IMEI registration.");
    var card = document.getElementById("packageGateCard");
    if (card) card.classList.toggle("gate-failed", packageFail);

    var decision = document.getElementById("arrivalDecision");
    if (!decision) return;
    if (packageFail) {
      decision.className = "decision-banner is-fail";
      decision.innerHTML = '<strong>Packaging FAIL → A:</strong> Warehouse Receiving generates the failure report and waits for customer disposition. <b>No normal IMEI enrollment yet.</b>';
    } else {
      decision.className = "decision-banner is-pass";
      decision.innerHTML = '<strong>Packaging PASS → B:</strong> Continue to IMEI registration. The next possible failures are quantity shortage or IMEI vs ASN mismatch.';
    }
  }

  /* ---------------- Receipt declared / actual ---------------- */
  function receiptLineValues(p) {
    if (state.scenario === "tampered" && state.disposition !== "proceed") return { actual: "—", variance: "—", validation: "NOT COUNTED", remarks: "Packaging VI failed before normal enrollment", tone: "wait" };
    if (state.scenario === "missing" && p.n === 5) return { actual: "0", variance: "-1", validation: "MISSING", remarks: "Expected phone not physically found", tone: "fail" };
    if (state.scenario === "imei" && p.n === 3) return { actual: "1", variance: "0", validation: "IMEI FAIL", remarks: "Expected IMEI-03 / Scanned IMEI-99", tone: "fail" };
    return { actual: "1", variance: "0", validation: "TALLY", remarks: "Physical unit matches expected record", tone: "pass" };
  }

  function renderReceiptLines() {
    var tbody = document.getElementById("receiptLineRows");
    if (!tbody) return;
    tbody.innerHTML = PHONES.map(function (p) {
      var v = receiptLineValues(p);
      return '<tr class="highlightable row-' + v.tone + '" data-phone="' + p.n + '"><td>Phone ' + p.n + '</td><td>' + p.receiptLineId + '</td><td>' + p.imei + '</td><td>1</td><td>' + v.actual + '</td><td>' + v.variance + '</td><td><span class="status-chip chip-' + (v.tone === "pass" ? "posted" : v.tone === "fail" ? "failed" : "pending") + '">' + v.validation + '</span></td><td>' + v.remarks + "</td></tr>";
    }).join("");

    var s = scenarioState();
    var counters = document.getElementById("receiptCounters");
    if (counters) counters.innerHTML = counterHtml(s.expected, "Declared") + counterHtml(fmtCount(s.physical), "Actual") + counterHtml(s.physical === null ? "—" : s.physical - s.expected, "Variance", (s.physical !== null && s.physical !== s.expected)) + counterHtml(s.mismatch, "IMEI Mismatch", s.mismatch > 0);
  }

  function counterHtml(value, label, bad) {
    return '<div class="counter"><div class="c-val ' + (bad ? "no" : "") + '">' + value + '</div><div class="c-lbl">' + label + "</div></div>";
  }

  /* ---------------- Phone tabs + scan station ---------------- */
  function renderPhoneTabs(container) {
    container.innerHTML = PHONES.map(function (p) {
      var sub = p.imei;
      if (state.scenario === "imei" && p.n === 3) sub = p.imei + " → " + ACTUAL_MISMATCH_IMEI;
      if (state.scenario === "missing" && p.n === 5) sub = p.imei + " · MISSING";
      return '<button class="phone-tab" data-phone="' + p.n + '" type="button">Phone ' + p.n + '<span class="tab-imei">' + sub + "</span></button>";
    }).join("");
  }

  function refreshPhoneTabs() {
    document.querySelectorAll(".phone-selector").forEach(renderPhoneTabs);
  }

  function checkStepHtml(c, i, failed, note) {
    return '<div class="check-step ' + (failed ? "is-fail" : "") + '" style="animation-delay:' + (i * 70) + 'ms"><span class="ci">' + (failed ? "×" : "✓") + '</span><span class="cq">' + c.q + (note ? '<small class="check-note">' + note + "</small>" : "") + '</span><span class="cr tech-only">' + c.ref + "</span></div>";
  }

  function renderScanStation(n) {
    var p = getPhone(n);
    var readout = document.getElementById("scanReadout");
    var chain = document.getElementById("checkChain");
    var card = document.getElementById("scanReceiptAssetCard");
    if (!readout || !chain || !card) return;

    if (state.scenario === "tampered" && state.disposition !== "proceed") {
      readout.innerHTML = 'SCAN BLOCKED <span class="serial">Packaging VI failed</span>';
      chain.innerHTML = '<div class="check-chain result result-fail">NORMAL IMEI ENROLLMENT HAS NOT STARTED — WAIT FOR CUSTOMER DISPOSITION</div>';
      card.innerHTML = emptyState("No RECEIPT_ASSET yet", "The package failed visual inspection. Receiving evidence and disposition come first.");
    } else if (state.scenario === "missing" && p.n === 5) {
      readout.innerHTML = p.imei + '<span class="serial">NO PHYSICAL PHONE</span>';
      chain.innerHTML = checkStepHtml(CHECKS[0], 0, true, "Expected in ASN, but no physical unit can be scanned") + '<div class="check-chain result result-fail">MISSING — Phone 5 cannot create RECEIPT_ASSET</div>';
      card.innerHTML = emptyState("No RECEIPT_ASSET for Phone 5", "Expected record remains in ASN / INBOUND_SHIPMENT_ASSET, but nothing physical was received.");
    } else {
      var actualImei = displayActualImei(p);
      readout.innerHTML = actualImei + '<span class="serial">SN ' + p.serial + "</span>";
      var mismatch = state.scenario === "imei" && p.n === 3;
      chain.innerHTML = CHECKS.map(function (c, i) {
        var fail = mismatch && (i === 0 || i === 1);
        var note = fail && i === 0 ? "ASN expects " + p.imei + "; scanner read " + actualImei : "";
        return checkStepHtml(c, i, fail, note);
      }).join("");

      if (mismatch) {
        chain.innerHTML += '<div class="check-chain result result-fail">FAIL — IMEI vs ASN NOT TALLY</div>';
        if (state.disposition === "proceed") {
          chain.innerHTML += '<div class="manual-resolution"><b>Customer acknowledged.</b> Customer Focal Person manually enrolls <code>' + ACTUAL_MISMATCH_IMEI + '</code> after approved disposition. Original mismatch remains in history.</div>';
          card.innerHTML = renderReceiptAssetCard(p, "MANUAL / APPROVED", ACTUAL_MISMATCH_IMEI);
        } else {
          card.innerHTML = emptyState("Normal RECEIPT_ASSET blocked for Phone 3", "Do not overwrite expected IMEI-03. Generate the receiving failure report and wait for disposition.");
        }
      } else {
        chain.innerHTML += '<div class="check-chain result">MATCHED — Phone ' + p.n + " physically received</div>";
        card.innerHTML = renderReceiptAssetCard(p, "MATCHED", actualImei);
      }
    }

    var s = scenarioState();
    var progressBase = s.matched;
    if (state.scenario === "imei" && state.disposition === "proceed") progressBase = 5;
    var fill = document.getElementById("progressFill");
    if (fill) fill.style.width = ((progressBase / 5) * 100) + "%";
    setText("progressText", progressBase + " / 5");
    setText("progressLabel", state.scenario === "imei" && state.disposition === "proceed" ? "Accepted after 4 tally + 1 manual approval" : "Phones matched / accepted");

    var counters = document.getElementById("scanCounters");
    if (counters) counters.innerHTML = counterHtml(5, "Expected") + counterHtml(fmtCount(s.physical), "Physical") + counterHtml(s.matched, "Direct Match") + counterHtml(s.missing, "Missing", s.missing > 0) + counterHtml(s.mismatch, "Mismatch", s.mismatch > 0);

    var banner = document.getElementById("scanRuleBanner");
    if (banner) {
      banner.innerHTML = state.scenario === "normal"
        ? '<span>⚠️</span><span><b>5 physically received still does not mean 5 ledger rows yet.</b> RECEIPT remains a receiving document until the posting gate.</span>'
        : '<span>⚠️</span><span><b>Failure does not get hidden by QUARANTINED.</b> The discrepancy is documented first, escalated to the Customer Focal Person, and resolved through disposition.</span>';
    }
  }

  function renderReceiptAssetCard(p, status, actualImei) {
    return '<div class="db-card theme-receiving"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> RECEIPT_ASSET</div><span class="status-chip ' + (status.indexOf("MANUAL") >= 0 ? "chip-warning" : "chip-matched") + '">' + status + '</span></div><div class="db-card-body">' +
      field(badge("pk", "PK") + "receipt_asset_id", p.receiptAssetId) +
      field(badge("fk", "FK") + "receipt_line_id", p.receiptLineId) +
      field(badge("fk", "FK") + "asset_id", p.assetId) +
      field(badge("fk", "FK") + "inbound_shipment_asset_id", p.shipAssetId) +
      field("physical_imei", actualImei) +
      field("condition_code", "GOOD") +
      field("initial_location_id", LOCATION_LABEL) +
      field("initial_inventory_state_id", STATE_LABEL) +
      field(badge("scan", "SCAN") + "validated_at", "2026-08-20 " + p.scanTime) +
      "</div></div>";
  }

  function emptyState(title, text) {
    return '<div class="empty-state"><strong>' + title + '</strong><span>' + text + "</span></div>";
  }

  function setSelectedPhone(n) {
    state.selectedPhone = n;
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

  /* ---------------- Receiving Report / exception documentation ---------------- */
  function reportRow(label, expected, actual, variance, result, remarks) {
    return '<tr class="' + (result.indexOf("FAIL") >= 0 || result.indexOf("MISSING") >= 0 ? "row-fail" : "row-pass") + '"><td>' + label + '</td><td>' + expected + '</td><td>' + actual + '</td><td>' + variance + '</td><td><span class="status-chip ' + (result.indexOf("PASS") >= 0 ? "chip-posted" : "chip-failed") + '">' + result + '</span></td><td>' + remarks + "</td></tr>";
  }

  function renderReport() {
    var s = scenarioState();
    var result = document.getElementById("reportResult");
    if (result) {
      var txt = state.scenario === "normal" ? "PASS" : "WITH DISCREPANCY";
      result.textContent = txt;
      result.className = "report-result " + (state.scenario === "normal" ? "is-pass" : "is-fail");
    }

    var meta = document.getElementById("reportMeta");
    if (meta) meta.innerHTML = [
      ["Received Date", "2026-08-20"], ["Shipment", "3137323"], ["ASN", "ASN-3137323"], ["Package", "1"], ["Declared Phones", "5"], ["Actual Phones", fmtCount(s.physical)], ["Reported By", "USER-22 · Warehouse Receiving"], ["Customer Focal", "USER-31 · sample"]
    ].map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + "</b></div>"; }).join("");

    var rows = [];
    rows.push(reportRow("Packaging VI", "SEALED / ACCEPTABLE", state.scenario === "tampered" ? "TAMPERED / BROKEN SEAL" : "ACCEPTABLE", "—", state.scenario === "tampered" ? "FAIL" : "PASS", state.scenario === "tampered" ? "Packaging failed before normal enrollment" : "Physical box inspection passed"));
    PHONES.forEach(function (p) {
      if (state.scenario === "tampered" && state.disposition !== "proceed") return;
      var v = receiptLineValues(p);
      var actualIdentity = state.scenario === "imei" && p.n === 3 ? ACTUAL_MISMATCH_IMEI : (v.actual === "0" ? "NOT FOUND" : p.imei);
      var res = v.validation === "TALLY" ? "PASS" : v.validation;
      rows.push(reportRow("Phone " + p.n, p.imei + " / Qty 1", actualIdentity + " / Qty " + v.actual, v.variance, res, v.remarks));
    });
    var tbody = document.getElementById("reportRows");
    if (tbody) tbody.innerHTML = rows.join("");

    renderExceptionDatabaseCards();
    renderDispositionPanel();
  }

  function exceptionDetails() {
    if (state.scenario === "tampered") return { id: 54001, type: "TAMPERED_PACKAGE", expected: "SEALED / ACCEPTABLE", actual: "BROKEN / TAMPERED SEAL", line: "null · receipt-level", asset: "null", failureId: 57001, failureNo: "FR-2026-00021", reportType: "PACKAGING_FAILURE", inspectionId: 73001, file: "broken_seal_photo.jpg" };
    if (state.scenario === "missing") return { id: 54002, type: "SHORT_SHIPMENT", expected: "5 PHONES / PHONE 5 EXPECTED", actual: "4 PHONES / PHONE 5 MISSING", line: "5105", asset: "null", failureId: 57002, failureNo: "FR-2026-00022", reportType: "QUANTITY_VARIANCE", inspectionId: 73002, file: "packing_list_and_open_box.jpg" };
    return { id: 54003, type: "IMEI_MISMATCH", expected: "IMEI-03", actual: ACTUAL_MISMATCH_IMEI, line: "5103", asset: "null at detection", failureId: 57003, failureNo: "FR-2026-00023", reportType: "FAILED_IMEI", inspectionId: 73003, file: "phone3_imei_photo.jpg" };
  }

  function renderExceptionDatabaseCards() {
    var host = document.getElementById("exceptionDatabaseCards");
    if (!host) return;
    if (state.scenario === "normal") {
      host.innerHTML = '<div class="success-state"><span>✓</span><div><strong>No receiving discrepancy</strong><p><code>RECEIPT.receiving_report_no = GRN-2026-00081</code> documents the successful overall receiving report. No <code>RECEIVING_EXCEPTION</code> or disposition is needed.</p></div></div>';
      return;
    }

    var x = exceptionDetails();
    var cards = [];
    if (state.scenario === "tampered") {
      cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">INSPECTION ' + x.inspectionId + '</div><span class="status-chip chip-failed">FAIL</span></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "inspection_id", x.inspectionId) + field(badge("fk", "FK") + "receipt_id", "5001") + field("asset_id", emptyVal() + techSpan(" · receipt/package VI")) + field("quantity_inspected", "1 package") + field("result_code_id", "FAIL " + techSpan("· SAMPLE CODE")) + field("remarks", "Security seal broken before normal receiving") + "</div></div>");
    }
    cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">RECEIVING_EXCEPTION ' + x.id + '</div><span class="status-chip chip-failed">OPEN</span></div><div class="db-card-body">' +
      field(badge("pk", "PK") + "receiving_exception_id", x.id) + field(badge("fk", "FK") + "receipt_id", "5001") + field(badge("fk", "FK") + "receipt_line_id", x.line) + field(badge("fk", "FK") + "receipt_asset_id", x.asset) + field("exception_type", x.type) + field("expected_value", x.expected) + field("actual_value", x.actual) + field("status_id", state.disposition === "proceed" ? "RESOLVED / PROCEED" : state.disposition === "shipback" ? "RESOLVED / SHIP BACK" : "OPEN") + field("created_by / created_at", "USER-22 / 2026-08-20 09:24") + "</div></div>");

    cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">FAILURE_REPORT ' + x.failureId + '</div><span class="status-chip chip-failed">' + x.failureNo + '</span></div><div class="db-card-body">' +
      field(badge("pk", "PK") + "failure_report_id", x.failureId) + field("report_no", x.failureNo) + field(badge("fk", "FK") + "inspection_id", x.inspectionId) + field(badge("fk", "FK") + "receipt_line_id", x.line) + field("report_type", x.reportType) + field("status_id", state.disposition === "pending" ? "OPEN" : "CLOSED " + techSpan("· SAMPLE CODE")) + field("reported_by / reported_at", "USER-22 / 2026-08-20 09:25") + field("file_reference", x.file + techSpan(" · illustrative")) + "</div></div>");

    cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">DISPOSITION_REQUEST 5800' + (state.scenario === "tampered" ? "1" : state.scenario === "missing" ? "2" : "3") + '</div><span class="status-chip ' + (state.disposition === "pending" ? "chip-warning" : "chip-posted") + '">' + (state.disposition === "pending" ? "PENDING" : "DECIDED") + '</span></div><div class="db-card-body">' +
      field(badge("fk", "FK") + "receipt_line_id", x.line) + field("target_type", state.scenario === "tampered" ? "RECEIPT / PACKAGE " + techSpan("· SAMPLE TARGET") : "RECEIPT_LINE") + field("quantity", state.scenario === "missing" ? "1" : "1") + field(badge("fk", "FK") + "failure_report_id", x.failureId) + field("requested_from_party_id", "CUSTOMER-001") + field("request_type", "RECEIVING_DISPOSITION") + field("requested_by / requested_at", "USER-31 / 2026-08-20 09:28") + "</div></div>");

    if (state.disposition !== "pending") {
      var code = state.disposition === "proceed" ? "PROCEED" : "SHIP_BACK";
      cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">DISPOSITION_DECISION 5900' + (state.scenario === "tampered" ? "1" : state.scenario === "missing" ? "2" : "3") + '</div><span class="status-chip ' + (state.disposition === "proceed" ? "chip-posted" : "chip-failed") + '">' + code + '</span></div><div class="db-card-body">' +
        field(badge("fk", "FK") + "disposition_request_id", "5800" + (state.scenario === "tampered" ? "1" : state.scenario === "missing" ? "2" : "3")) + field("decision_code", code) + field("decided_by_person_id", "CFP-07 " + techSpan("· sample")) + field("decided_by_party_id", "CUSTOMER-001") + field("recorded_by_user_id", "USER-31") + field("decided_at", "2026-08-20 09:35") + field("notes", state.disposition === "proceed" ? "Customer acknowledged discrepancy and authorized receiving to proceed." : "Customer instructed warehouse to ship the receiving back.") + "</div></div>");
    }

    if (state.scenario === "imei" && state.disposition === "proceed") {
      cards.push('<div class="db-card theme-item"><div class="db-card-head"><div class="db-card-title">IDENTIFIER_CORRECTION_REQUEST 56001</div><span class="status-chip chip-posted">APPROVED</span></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "correction_request_id", "56001") + field(badge("fk", "FK") + "receipt_asset_id", "5203") + field(badge("fk", "FK") + "asset_identifier_id", "9105") + field("old_identifier", "IMEI-03") + field("proposed_identifier", ACTUAL_MISMATCH_IMEI) + field("reason_id", "FAILED_IMEI " + techSpan("· sample reason")) + field("status_id", "APPROVED") + field("requested_by", "USER-31 · Customer Focal Person") + field("approved_by / approved_at", "USER-31 / 2026-08-20 09:36") + field("revalidated_at", "2026-08-20 09:37") + "</div></div>");
    }

    host.innerHTML = cards.join("");
  }

  function renderDispositionPanel() {
    var panel = document.getElementById("dispositionPanel");
    var actions = document.getElementById("dispositionActions");
    if (!panel || !actions) return;

    if (state.scenario === "normal") {
      panel.classList.add("is-disabled");
      setText("dispositionTitle", "No disposition required");
      setText("dispositionText", "Packaging, quantity, and IMEI verification all passed. Warehouse Receiving can continue the normal report and posting process.");
      actions.style.display = "none";
      return;
    }

    panel.classList.remove("is-disabled");
    actions.style.display = "flex";
    var title = "Customer disposition is required";
    var text = "Warehouse Receiving has documented the failure. The Customer Focal Person escalates it to the customer. Choose the decision to continue the visualization.";
    if (state.disposition === "proceed") {
      title = "Disposition: PROCEED";
      text = state.scenario === "imei" ? "Customer acknowledged the failed IMEI. Manual enrollment is authorized to the Customer Focal Person before receiving can continue." : "Customer acknowledged the discrepancy and authorized Warehouse Receiving to proceed.";
    } else if (state.disposition === "shipback") {
      title = "Disposition: SHIP BACK";
      text = "Normal receiving stops. No warehouse-receipt ledger posting is created for this shipment in this scenario.";
    }
    setText("dispositionTitle", title);
    setText("dispositionText", text);

    actions.querySelectorAll(".disposition-btn").forEach(function (btn) {
      var selected = btn.dataset.disposition === state.disposition;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", String(selected));
      if (btn.dataset.disposition === "proceed") btn.textContent = state.scenario === "imei" ? "Proceed + Manual IMEI Enrollment" : "Proceed Receiving";
    });
  }

  /* ---------------- Posting / ledger / projections ---------------- */
  function renderPostingGate() {
    var s = scenarioState();
    var eligible = s.posted > 0;
    var title = "All five valid phones can be posted";
    var intro = "Normal receiving passed. Completing the receipt creates one inventory transaction and one inventory entry per accepted serialized phone.";
    if (state.scenario !== "normal" && state.disposition === "pending") {
      title = "Posting is blocked while disposition is pending";
      intro = "The receiving failure is documented, but the customer has not yet instructed the warehouse to PROCEED or SHIP BACK.";
    } else if (state.disposition === "shipback") {
      title = "Posting is stopped — customer chose SHIP BACK";
      intro = "No normal warehouse-receipt inventory movement is created. The failure report and disposition remain as the history of what happened.";
    } else if (state.scenario === "missing" && state.disposition === "proceed") {
      title = "Approved partial receiving: only 4 physical phones can be posted";
      intro = "Phone 5 never physically arrived, so it cannot receive a RECEIPT_ASSET ledger posting. Declared 5 / Actual 4 / Variance -1 remains documented.";
    } else if (state.scenario === "imei" && state.disposition === "proceed") {
      title = "Posting allowed after approved manual IMEI enrollment";
      intro = "Phone 3 first failed IMEI validation. After customer acknowledgment and Customer Focal Person enrollment, all five accepted physical phones can be posted. The original mismatch is retained in the receiving history.";
    } else if (state.scenario === "tampered" && state.disposition === "proceed") {
      title = "Posting allowed after tampered-package disposition to PROCEED";
      intro = "The package failure stays documented even though controlled receiving later confirms all five phones and the customer authorizes continuation.";
    }
    setText("postingTitle", title);
    setText("postingIntro", intro);

    var host = document.getElementById("postingGate");
    if (host) {
      var rightStatus = eligible ? (s.posted === 5 ? "POSTED" : "PARTIAL POSTED") : (state.disposition === "shipback" ? "NO POSTING" : "BLOCKED");
      host.innerHTML = '<div class="posting-card"><span>Before gate</span><strong>RECEIPT 5001</strong><b>OPEN</b></div><div class="posting-arrow ' + (eligible ? "is-pass" : "is-blocked") + '"><span>' + (eligible ? "→" : "×") + '</span><small>' + (eligible ? s.posted + " accepted unit(s)" : "no ledger movement") + '</small></div><div class="posting-card ' + (eligible ? "is-pass" : "is-blocked") + '"><span>After decision</span><strong>' + rightStatus + '</strong><b>' + s.posted + ' ledger posting(s)</b></div>';
    }

    var rule = document.getElementById("postingRule");
    if (rule) rule.innerHTML = '<span class="cb-icon">🔁</span><span><b>1:1 ledger remains unchanged:</b> each accepted phone creates one <code>INVENTORY_TRANSACTION</code> and exactly one <code>INVENTORY_ENTRY</code>. Exception documentation never replaces the ledger, and the ledger never replaces the Receiving Report.</span>';
  }

  function renderLedgerCards() {
    var host = document.getElementById("ledgerCards");
    if (!host) return;
    var phones = postedPhones();
    setText("ledgerTitle", phones.length ? phones.length + " transaction" + (phones.length === 1 ? "" : "s") + ", " + phones.length + " entr" + (phones.length === 1 ? "y" : "ies") + " — strictly 1:1" : "No receipt ledger posting in this outcome");
    setText("ledgerIntro", phones.length ? "Only the accepted physical phones appear here. The transaction records the receipt event; the entry records the inventory change." : "The scenario stopped before inventory acceptance. The Receiving Report / disposition exists, but there is no warehouse-receipt inventory movement to post.");
    if (!phones.length) {
      host.innerHTML = emptyState("Ledger intentionally empty", "This is correct: a failed/held/ship-back receiving outcome must not fabricate inventory movement.");
      return;
    }
    host.innerHTML = phones.map(function (p) {
      var physicalImei = displayActualImei(p);
      return '<div class="db-card-grid highlightable" data-phone="' + p.n + '" style="margin-bottom:18px"><div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> INVENTORY_TRANSACTION</div><span class="status-chip chip-posted">' + p.txnNo + '</span></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "transaction_id", p.txnId) + field(badge("gen", "SYS") + "idempotency_key", techSpan("RCPT-2026-00081-RA-" + p.receiptAssetId)) + field("source_document", "RECEIPT_ASSET / " + p.receiptAssetId) + field("status_id", "POSTED") + field("posted_by", "USER-22") + "</div></div>" +
        '<div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> INVENTORY_ENTRY</div><span class="status-chip chip-posted">#' + p.entryId + '</span></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "entry_id", p.entryId) + field(badge("fk", "FK/UQ") + "transaction_id", p.txnId) + field("asset_id / item_id", p.assetId + " / " + p.itemId) + field("physical IMEI", physicalImei) + field("from → to location", emptyVal() + " → " + LOCATION_LABEL) + field("to_state / qty / cost", STATE_LABEL + " · 1 EA · €" + p.price) + "</div></div></div>";
    }).join("");
  }

  function renderCurrentPositionCards() {
    var host = document.getElementById("currentPositionCards");
    if (!host) return;
    var phones = postedPhones();
    setText("currentTitle", phones.length ? phones.length + " accepted phone" + (phones.length === 1 ? "" : "s") + " now have a current warehouse position" : "No current inventory position was created");
    setText("currentIntro", phones.length ? "Every posted INVENTORY_ENTRY updates the rebuildable ASSET_CURRENT_POSITION projection. The Receiving Report remains separate historical documentation." : "Because nothing was posted to inventory, there is no new ASSET_CURRENT_POSITION row from this receipt outcome.");
    if (!phones.length) {
      host.innerHTML = emptyState("No current inventory created", "The shipment is still held for disposition or is being shipped back.");
      return;
    }
    host.innerHTML = phones.map(function (p) {
      return '<div class="db-card theme-current highlightable" data-phone="' + p.n + '"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> ASSET_CURRENT_POSITION</div><span class="status-chip chip-current">LIVE</span></div><div class="db-card-body">' +
        field(badge("pk", "PK/FK") + "asset_id", p.assetId) + field("IMEI / Serial", displayActualImei(p) + " / " + p.serial) + field("location_id", LOCATION_LABEL) + field("inventory_state_id", STATE_LABEL) + field(badge("ledger", "LEDGER") + "last_transaction_id", p.txnNo) + "</div></div>";
    }).join("");
  }

  function renderBalanceRows() {
    var tbody = document.getElementById("balanceRows");
    if (!tbody) return;
    var phones = postedPhones();
    setText("balanceExplanation", phones.length ? "This outcome posts " + phones.length + " accepted serialized phone(s). Because these sample phones resolve to different item records, each accepted unit creates its own quantity-1 balance row in QUARANTINED state. Available remains 0 because the quarantine state is not available." : "No accepted inventory was posted, so this receiving outcome adds no on-hand balance rows. The discrepancy exists in receiving documentation instead.");
    if (!phones.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-table-cell">No inventory balance rows from this receipt outcome.</td></tr>';
      return;
    }
    tbody.innerHTML = phones.map(function (p) {
      return '<tr class="highlightable" data-phone="' + p.n + '"><td>' + p.balanceId + '</td><td>' + p.itemId + ' · ' + p.itemCode + '</td><td>' + STATE_LABEL + '</td><td>1</td><td>0</td><td><b>0</b> ' + techSpan("(state not available)") + "</td></tr>";
    }).join("");
  }

  /* ---------------- Trace / final ---------------- */
  function traceNode(label, kind) {
    return '<div class="trace-node ' + (kind ? "trace-" + kind : "") + '"><div class="tn-table">' + label + "</div></div>";
  }

  function traceConnector(label) {
    return '<div class="trace-connector"><div class="tc-line"></div>' + (label ? '<div class="tc-label">' + label + '</div>' : "") + '<div class="tc-line"></div></div>';
  }

  function renderTrace(n) {
    var p = getPhone(n);
    var host = document.getElementById("traceFlow");
    if (!host) return;
    var nodes = [];
    function add(label, kind, link) {
      if (nodes.length) nodes.push(traceConnector(link || ""));
      nodes.push(traceNode(label, kind));
    }

    add("Shipment_3137323.xlsx", "expected");
    add("ASN_IMPORT_ROW " + p.asnRow + " · Expected " + p.imei, "expected", "import");
    add("INBOUND_SHIPMENT_ASSET " + p.shipAssetId, "expected", "expected asset");
    add("RECEIPT 5001 / RECEIPT_LINE " + p.receiptLineId, "received", "receiving document");

    if (state.scenario === "tampered") {
      add("VI OF PACKAGING — FAIL / TAMPERED", "fail", "physical package check");
      add("RECEIVING_EXCEPTION 54001", "fail", "document discrepancy");
      add("FAILURE_REPORT 57001 · FR-2026-00021", "fail", "evidence / report");
      add("DISPOSITION_REQUEST 58001", "decision", "Customer Focal → Customer");
      if (state.disposition === "pending") add("CUSTOMER DISPOSITION — PENDING", "wait", "wait");
      if (state.disposition === "shipback") add("DISPOSITION_DECISION — SHIP_BACK", "stop", "customer decision");
      if (state.disposition === "proceed") {
        add("DISPOSITION_DECISION — PROCEED", "decision", "customer decision");
        add("Physical scan " + p.imei + " — PASS", "received", "resume receiving");
        add("RECEIPT_ASSET " + p.receiptAssetId, "received", "accepted physical unit");
      }
    } else if (state.scenario === "missing" && p.n === 5) {
      add("NO PHYSICAL PHONE FOUND", "fail", "actual = 0 / variance = -1");
      add("RECEIVING_EXCEPTION 54002 · SHORT_SHIPMENT", "fail", "document discrepancy");
      add("FAILURE_REPORT 57002 · FR-2026-00022", "fail", "receiving report");
      add("DISPOSITION_REQUEST 58002", "decision", "Customer Focal → Customer");
      if (state.disposition === "pending") add("CUSTOMER DISPOSITION — PENDING", "wait", "wait");
      if (state.disposition === "proceed") add("DISPOSITION_DECISION — PROCEED WITH 4", "decision", "Phone 5 stays missing");
      if (state.disposition === "shipback") add("DISPOSITION_DECISION — SHIP_BACK", "stop", "customer decision");
    } else if (state.scenario === "imei" && p.n === 3) {
      add("Physical Scan " + ACTUAL_MISMATCH_IMEI, "fail", "scanner");
      add("IMEI vs ASN — FAIL (expected IMEI-03)", "fail", "validation");
      add("RECEIVING_EXCEPTION 54003 · IMEI_MISMATCH", "fail", "expected ≠ actual");
      add("FAILURE_REPORT 57003 · FR-2026-00023", "fail", "receiving report");
      add("DISPOSITION_REQUEST 58003", "decision", "Customer Focal → Customer");
      if (state.disposition === "pending") add("CUSTOMER DISPOSITION — PENDING", "wait", "wait");
      if (state.disposition === "shipback") add("DISPOSITION_DECISION — SHIP_BACK", "stop", "customer decision");
      if (state.disposition === "proceed") {
        add("DISPOSITION_DECISION — PROCEED", "decision", "customer acknowledgement");
        add("IDENTIFIER_CORRECTION_REQUEST 56001", "decision", "Customer Focal manual enrollment");
        add("RECEIPT_ASSET 5203 · IMEI-99 ACCEPTED", "received", "revalidated");
      }
    } else {
      if (phonePhysicallyPresent(p)) {
        add("Physical Scan " + displayActualImei(p) + " — TALLY", "received", "IMEI registration");
        if (hasReceiptAsset(p)) add("RECEIPT_ASSET " + p.receiptAssetId, "received", "matched / received");
      }
      if (state.scenario === "missing") {
        add("Shipment-level SHORT_SHIPMENT report", "fail", "Phone 5 missing");
        add("DISPOSITION_REQUEST 58002", "decision", "Customer Focal → Customer");
        if (state.disposition === "pending") add("CUSTOMER DISPOSITION — PENDING", "wait", "wait");
        if (state.disposition === "shipback") add("DISPOSITION_DECISION — SHIP_BACK", "stop", "customer decision");
        if (state.disposition === "proceed") add("DISPOSITION_DECISION — PROCEED WITH 4", "decision", "customer decision");
      } else if (state.scenario === "imei") {
        add("Shipment-level FAILED IMEI report", "fail", "Phone 3 mismatch");
        add("DISPOSITION_REQUEST 58003", "decision", "Customer Focal → Customer");
        if (state.disposition === "pending") add("CUSTOMER DISPOSITION — PENDING", "wait", "wait");
        if (state.disposition === "shipback") add("DISPOSITION_DECISION — SHIP_BACK", "stop", "customer decision");
        if (state.disposition === "proceed") add("DISPOSITION_DECISION — PROCEED", "decision", "customer decision");
      } else {
        add("Receiving Report GRN-2026-00081 — PASS", "decision", "overall report");
      }
    }

    if (isPhonePosted(p)) {
      add("INVENTORY_TRANSACTION " + p.txnId + " · " + p.txnNo, "posted", "post accepted inventory");
      add("INVENTORY_ENTRY " + p.entryId + " · FK/UQ 1:1", "posted", "inventory change");
      add("ASSET_CURRENT_POSITION · " + LOCATION_SHORT, "current", "projection");
      add(STATE_LABEL, "current", "inventory state");
      add("ENDORSEMENT TO TRIAGE — next handoff", "current", "operational next step");
    } else if (state.disposition === "shipback") {
      add("NO RECEIPT INVENTORY POSTING", "stop", "correct outcome");
    } else if (isExceptionScenario()) {
      add("NO LEDGER YET — HELD FOR DECISION", "wait", "correct outcome");
    }

    host.innerHTML = nodes.join("");
  }

  function finalResult(p) {
    var posted = isPhonePosted(p);
    if (state.scenario === "normal") return { result: "MATCHED / POSTED", tone: "pass" };
    if (state.scenario === "tampered") {
      if (state.disposition === "proceed") return { result: "MATCHED AFTER APPROVAL", tone: "pass" };
      if (state.disposition === "shipback") return { result: "PACKAGE FAIL / SHIP BACK", tone: "fail" };
      return { result: "BLOCKED AT PACKAGING", tone: "wait" };
    }
    if (state.scenario === "missing" && p.n === 5) return { result: "MISSING / NO INVENTORY", tone: "fail" };
    if (state.scenario === "missing") {
      if (posted) return { result: "MATCHED / PARTIAL POST", tone: "pass" };
      if (state.disposition === "shipback") return { result: "MATCHED / SHIP BACK", tone: "fail" };
      return { result: "MATCHED / HELD", tone: "wait" };
    }
    if (p.n === 3) {
      if (posted) return { result: "MANUAL IMEI / POSTED", tone: "pass" };
      if (state.disposition === "shipback") return { result: "IMEI FAIL / SHIP BACK", tone: "fail" };
      return { result: "IMEI MISMATCH / HELD", tone: "fail" };
    }
    if (posted) return { result: "MATCHED / POSTED", tone: "pass" };
    if (state.disposition === "shipback") return { result: "MATCHED / SHIP BACK", tone: "fail" };
    return { result: "MATCHED / HELD", tone: "wait" };
  }

  function renderFinalTable() {
    var tbody = document.getElementById("finalTableRows");
    if (!tbody) return;
    var s = scenarioState();
    setText("finalTableTitle", SCENARIO_INFO[state.scenario].label + " — " + s.finalStatus);
    tbody.innerHTML = PHONES.map(function (p) {
      var r = finalResult(p);
      var present = phonePhysicallyPresent(p);
      var ra = hasReceiptAsset(p) ? p.receiptAssetId : "—";
      var posted = isPhonePosted(p);
      var physical = present ? displayActualImei(p) : "NOT FOUND / NOT SCANNED";
      return '<tr class="highlightable row-' + r.tone + '" data-phone="' + p.n + '"><td>Phone ' + p.n + '</td><td>' + p.imei + '</td><td>' + physical + '</td><td><span class="status-chip chip-' + (r.tone === "pass" ? "posted" : r.tone === "fail" ? "failed" : "warning") + '">' + r.result + '</span></td><td>' + ra + '</td><td>' + (posted ? p.txnNo : "—") + '</td><td>' + (posted ? p.entryId : "—") + '</td><td>' + (posted ? LOCATION_SHORT : "—") + '</td><td>' + (posted ? STATE_LABEL : "—") + "</td></tr>";
    }).join("");
  }

  function checklistItem(icon, text, tone) {
    return '<div class="fc-item fc-' + tone + '"><span class="fc-check">' + icon + "</span>" + text + "</div>";
  }

  function renderFinalSummary() {
    var host = document.getElementById("finalSummary");
    if (!host) return;
    var s = scenarioState();
    var physical = fmtCount(s.physical);
    var checklist = [];
    checklist.push(checklistItem("✓", "ASN preserved as expected record", "pass"));
    checklist.push(checklistItem(state.scenario === "tampered" ? "!" : "✓", "Packaging VI " + (state.scenario === "tampered" ? "failed and documented" : "passed"), state.scenario === "tampered" ? "warn" : "pass"));
    checklist.push(checklistItem(state.scenario === "normal" ? "✓" : "!", state.scenario === "normal" ? "No receiving discrepancy" : "Receiving failure report generated", state.scenario === "normal" ? "pass" : "warn"));
    if (state.scenario !== "normal") checklist.push(checklistItem(state.disposition === "pending" ? "…" : state.disposition === "proceed" ? "✓" : "×", "Customer disposition: " + (state.disposition === "pending" ? "PENDING" : state.disposition === "proceed" ? "PROCEED" : "SHIP BACK"), state.disposition === "proceed" ? "pass" : state.disposition === "shipback" ? "fail" : "warn"));
    if (state.scenario === "imei" && state.disposition === "proceed") checklist.push(checklistItem("✓", "Customer Focal manual IMEI enrollment", "pass"));
    checklist.push(checklistItem(s.posted ? "✓" : "×", s.posted ? s.posted + " accepted phone(s) posted to ledger" : "No inventory ledger posting", s.posted ? "pass" : "warn"));
    checklist.push(checklistItem(s.posted ? "✓" : "—", s.posted ? "Current position = Receiving Cage / QUARANTINED" : "No new current inventory position", s.posted ? "pass" : "warn"));
    checklist.push(checklistItem("→", s.posted ? "Endorsement to Triage is the next handoff" : "Triage handoff not reached", s.posted ? "pass" : "warn"));

    host.innerHTML = '<h2>' + SCENARIO_INFO[state.scenario].label + ' — ' + s.finalStatus + '</h2><p class="final-summary-sub">The same ASN stays intact; the receiving outcome changes based on what the warehouse actually observes and the customer disposition.</p><div class="final-metrics"><div><div class="fm-value">5</div><div class="fm-label">Expected</div></div><div><div class="fm-value">' + physical + '</div><div class="fm-label">Physical</div></div><div><div class="fm-value">' + s.posted + '</div><div class="fm-label">Ledger Posted</div></div><div><div class="fm-value ' + (s.missing ? "bad" : "zero") + '">' + s.missing + '</div><div class="fm-label">Missing</div></div><div><div class="fm-value ' + (s.mismatch ? "bad" : "zero") + '">' + s.mismatch + '</div><div class="fm-label">IMEI Mismatch</div></div></div><div class="final-state"><span>📍 ' + s.location + '</span><span>🔒 ' + s.inventoryState + '</span></div><div class="final-checklist">' + checklist.join("") + "</div>";
  }

  /* ---------------- Master render ---------------- */
  function renderAll() {
    renderScenarioHeader();
    renderSummary();
    renderOperationalFlow();
    renderReceiptLines();
    refreshPhoneTabs();
    renderReport();
    renderPostingGate();
    renderLedgerCards();
    renderCurrentPositionCards();
    renderBalanceRows();
    renderFinalTable();
    renderFinalSummary();
    setSelectedPhone(state.selectedPhone);
  }

  /* ---------------- Nav / tech toggle ---------------- */
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
        navBtns.forEach(function (b) { b.classList.toggle("is-active", b.dataset.target === id); });
        railStages.forEach(function (r) { r.setAttribute("data-live", String(r.dataset.stage === stage)); });
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { observer.observe(s); });
  }

  function initNavClicks() {
    document.querySelectorAll(".nav-btn, .process-node").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.dataset.target);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initTechToggle() {
    var toggle = document.getElementById("techSwitch");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var on = document.body.classList.toggle("tech-mode");
      toggle.classList.toggle("is-on", on);
      toggle.setAttribute("aria-checked", String(on));
    });
  }

  function initInteractions() {
    document.addEventListener("click", function (e) {
      var scenarioBtn = e.target.closest(".scenario-btn");
      if (scenarioBtn) {
        state.scenario = scenarioBtn.dataset.scenario;
        state.disposition = state.scenario === "normal" ? "none" : "pending";
        state.selectedPhone = state.scenario === "missing" ? 5 : state.scenario === "imei" ? 3 : 1;
        renderAll();
        return;
      }
      var dispositionBtn = e.target.closest(".disposition-btn");
      if (dispositionBtn && state.scenario !== "normal") {
        state.disposition = dispositionBtn.dataset.disposition;
        renderAll();
        return;
      }
      var phoneTab = e.target.closest(".phone-tab");
      if (phoneTab) setSelectedPhone(Number(phoneTab.dataset.phone));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderFileRows();
    renderAsnRowCards();
    renderExpectedAssetCards();
    renderAssetIdentityCards();
    initInteractions();
    initScrollSpy();
    initNavClicks();
    initTechToggle();
    renderAll();
  });
})();
