/* =========================================================================
   WMS WAREHOUSE CORES RECEIVING — INTERACTIVE PROCESS VISUALIZATION
   Shipment 3137323 / 2 packages / 10 serialized phones + parts

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
    {n:1, asnRow:8101, rowNumber:2, extItemId:"APPLE-IP11-64-BLK", extSku:"IP11-64-BLK", imei:"IMEI-1101", serial:"SN-IP11-001", price:18000, extRefId:501, itemId:1001, itemCode:"IP11-64-BLK", itemName:"iPhone 11", itemDesc:"Apple iPhone 11 64GB Black US", brand:"Apple", series:"iPhone 11", modelNumber:"A2111", storage:"64GB", color:"Black", modelYear:2019, region:"US", category:"Smartphone", shipLineId:7101, shipAssetId:7201, assetId:9001, idImei:9101, idSerial:9102, receiptLineId:5101, receiptAssetId:5201, txnId:50001, txnNo:"TXN-000501", entryId:60001, balanceId:40001, scanTime:"09:18"},
    {n:2, asnRow:8102, rowNumber:3, extItemId:"APPLE-IP12-64-WHT", extSku:"IP12-64-WHT", imei:"IMEI-1202", serial:"SN-IP12-002", price:20000, extRefId:502, itemId:1002, itemCode:"IP12-64-WHT", itemName:"iPhone 12", itemDesc:"Apple iPhone 12 64GB White EU", brand:"Apple", series:"iPhone 12", modelNumber:"A2403", storage:"64GB", color:"White", modelYear:2020, region:"EU", category:"Smartphone", shipLineId:7102, shipAssetId:7202, assetId:9002, idImei:9103, idSerial:9104, receiptLineId:5102, receiptAssetId:5202, txnId:50002, txnNo:"TXN-000502", entryId:60002, balanceId:40002, scanTime:"09:19"},
    {n:3, asnRow:8103, rowNumber:4, extItemId:"APPLE-IP13-128-BLU", extSku:"IP13-128-BLU", imei:"IMEI-1303", serial:"SN-IP13-003", price:23000, extRefId:503, itemId:1003, itemCode:"IP13-128-BLU", itemName:"iPhone 13", itemDesc:"Apple iPhone 13 128GB Blue JP", brand:"Apple", series:"iPhone 13", modelNumber:"A2631", storage:"128GB", color:"Blue", modelYear:2021, region:"JP", category:"Smartphone", shipLineId:7103, shipAssetId:7203, assetId:9003, idImei:9105, idSerial:9106, receiptLineId:5103, receiptAssetId:5203, txnId:50003, txnNo:"TXN-000503", entryId:60003, balanceId:40003, scanTime:"09:20"},
    {n:4, asnRow:8104, rowNumber:5, extItemId:"APPLE-IP14-128-BLK", extSku:"IP14-128-BLK", imei:"IMEI-1404", serial:"SN-IP14-004", price:26000, extRefId:504, itemId:1004, itemCode:"IP14-128-BLK", itemName:"iPhone 14", itemDesc:"Apple iPhone 14 128GB Black US", brand:"Apple", series:"iPhone 14", modelNumber:"A2649", storage:"128GB", color:"Black", modelYear:2022, region:"US", category:"Smartphone", shipLineId:7104, shipAssetId:7204, assetId:9004, idImei:9107, idSerial:9108, receiptLineId:5104, receiptAssetId:5204, txnId:50004, txnNo:"TXN-000504", entryId:60004, balanceId:40004, scanTime:"09:21"},
    {n:5, asnRow:8105, rowNumber:6, extItemId:"APPLE-IP15-128-PNK", extSku:"IP15-128-PNK", imei:"IMEI-1505", serial:"SN-IP15-005", price:30000, extRefId:505, itemId:1005, itemCode:"IP15-128-PNK", itemName:"iPhone 15", itemDesc:"Apple iPhone 15 128GB Pink EU", brand:"Apple", series:"iPhone 15", modelNumber:"A3090", storage:"128GB", color:"Pink", modelYear:2023, region:"EU", category:"Smartphone", shipLineId:7105, shipAssetId:7205, assetId:9005, idImei:9109, idSerial:9110, receiptLineId:5105, receiptAssetId:5205, txnId:50005, txnNo:"TXN-000505", entryId:60005, balanceId:40005, scanTime:"09:22"},
    {n:6, asnRow:8106, rowNumber:7, extItemId:"APPLE-15PRO-128-NAT", extSku:"IP15PRO-128-NAT", imei:"IMEI-1506", serial:"SN-IP15PRO-006", price:38000, extRefId:506, itemId:1006, itemCode:"IP15PRO-128-NAT", itemName:"iPhone 15 Pro", itemDesc:"Apple iPhone 15 Pro 128GB Natural Titanium EU", brand:"Apple", series:"iPhone 15 Pro", modelNumber:"A3102", storage:"128GB", color:"Natural Titanium", modelYear:2023, region:"EU", category:"Smartphone", shipLineId:7106, shipAssetId:7206, assetId:9006, idImei:9111, idSerial:9112, receiptLineId:5106, receiptAssetId:5206, txnId:50006, txnNo:"TXN-000506", entryId:60006, balanceId:40006, scanTime:"09:23"},
    {n:7, asnRow:8107, rowNumber:8, extItemId:"APPLE-IP16-128-WHT", extSku:"IP16-128-WHT", imei:"IMEI-1607", serial:"SN-IP16-007", price:42000, extRefId:507, itemId:1007, itemCode:"IP16-128-WHT", itemName:"iPhone 16", itemDesc:"Apple iPhone 16 128GB White EU", brand:"Apple", series:"iPhone 16", modelNumber:"A3287", storage:"128GB", color:"White", modelYear:2024, region:"EU", category:"Smartphone", shipLineId:7107, shipAssetId:7207, assetId:9007, idImei:9113, idSerial:9114, receiptLineId:5107, receiptAssetId:5207, txnId:50007, txnNo:"TXN-000507", entryId:60007, balanceId:40007, scanTime:"09:24"},
    {n:8, asnRow:8108, rowNumber:9, extItemId:"APPLE-16PRO-256-NAT", extSku:"IP16PRO-256-NAT", imei:"IMEI-1608", serial:"SN-IP16PRO-008", price:52000, extRefId:508, itemId:1008, itemCode:"IP16PRO-256-NAT", itemName:"iPhone 16 Pro", itemDesc:"Apple iPhone 16 Pro 256GB Natural Titanium US", brand:"Apple", series:"iPhone 16 Pro", modelNumber:"A3083", storage:"256GB", color:"Natural Titanium", modelYear:2024, region:"US", category:"Smartphone", shipLineId:7108, shipAssetId:7208, assetId:9008, idImei:9115, idSerial:9116, receiptLineId:5108, receiptAssetId:5208, txnId:50008, txnNo:"TXN-000508", entryId:60008, balanceId:40008, scanTime:"09:25"},
    {n:9, asnRow:8109, rowNumber:10, extItemId:"APPLE-16PM-512-BLK", extSku:"IP16PM-512-BLK", imei:"IMEI-1609", serial:"SN-IP16PM-009", price:65000, extRefId:509, itemId:1009, itemCode:"IP16PM-512-BLK", itemName:"iPhone 16 Pro Max", itemDesc:"Apple iPhone 16 Pro Max 512GB Black US", brand:"Apple", series:"iPhone 16 Pro Max", modelNumber:"A3084", storage:"512GB", color:"Black", modelYear:2024, region:"US", category:"Smartphone", shipLineId:7109, shipAssetId:7209, assetId:9009, idImei:9117, idSerial:9118, receiptLineId:5109, receiptAssetId:5209, txnId:50009, txnNo:"TXN-000509", entryId:60009, balanceId:40009, scanTime:"09:26"},
    {n:10, asnRow:8110, rowNumber:11, extItemId:"APPLE-IP17-256-BLU", extSku:"IP17-256-BLU", imei:"IMEI-1710", serial:"SN-IP17-010", price:70000, extRefId:510, itemId:1010, itemCode:"IP17-256-BLU", itemName:"iPhone 17", itemDesc:"Apple iPhone 17 256GB Blue EU", brand:"Apple", series:"iPhone 17", modelNumber:"A3520", storage:"256GB", color:"Blue", modelYear:2025, region:"EU", category:"Smartphone", shipLineId:7110, shipAssetId:7210, assetId:9010, idImei:9119, idSerial:9120, receiptLineId:5110, receiptAssetId:5210, txnId:50010, txnNo:"TXN-000510", entryId:60010, balanceId:40010, scanTime:"09:27"}
  ];

  var PARTS = [
    {n:1, asnRow:8201, extItemId:"PART-SCREW-M3-10", extSku:"SCR-M3-10", itemId:2001, itemCode:"SCR-M3-10", itemName:"M3 × 10mm Screw", description:"Steel machine screw, M3 × 10mm", expectedQty:500, actualQty:500, goodQty:500, rejectQty:0, varianceQty:0, uom:"EA", tracking:"NONE", partId:3001, locationId:201, packageId:"PKG-PARTS-01", compatibleModels:"All iPhone assembly work"},
    {n:2, asnRow:8202, extItemId:"PART-BATT-IP12", extSku:"BAT-IP12", itemId:2002, itemCode:"BAT-IP12", itemName:"iPhone 12 Battery", description:"Replacement battery for iPhone 12", expectedQty:10, actualQty:10, goodQty:10, rejectQty:0, varianceQty:0, uom:"EA", tracking:"NONE", partId:3002, locationId:201, packageId:"PKG-PARTS-01", compatibleModels:"iPhone 12"},
    {n:3, asnRow:8203, extItemId:"PART-BATT-IP15", extSku:"BAT-IP15", itemId:2003, itemCode:"BAT-IP15", itemName:"iPhone 15 Battery", description:"Replacement battery for iPhone 15", expectedQty:10, actualQty:10, goodQty:10, rejectQty:0, varianceQty:0, uom:"EA", tracking:"NONE", partId:3003, locationId:201, packageId:"PKG-PARTS-01", compatibleModels:"iPhone 15"},
    {n:4, asnRow:8204, extItemId:"PART-BATT-IP16", extSku:"BAT-IP16", itemId:2004, itemCode:"BAT-IP16", itemName:"iPhone 16 Battery", description:"Replacement battery for iPhone 16", expectedQty:10, actualQty:10, goodQty:10, rejectQty:0, varianceQty:0, uom:"EA", tracking:"NONE", partId:3004, locationId:201, packageId:"PKG-PARTS-01", compatibleModels:"iPhone 16"}
  ];

  var MASTER_DATA = {
    products: PHONES.map(function (p, i) {
      return { item_id:p.itemId, item_code:p.itemCode, item_name:p.itemDesc, description:p.itemDesc, item_type:"PRODUCT", base_uom_id:1, tracking_method_id:1, status:"ACTIVE", created_by:"USER-15", updated_by:"USER-15", created_at:"2026-08-19 08:00", updated_at:"2026-08-19 08:00", product_id:101+i, brand:p.brand, series:p.series, model_number:p.modelNumber, storage:p.storage, color:p.color, model_year:p.modelYear, region:p.region, product_category:p.category };
    }),
    parts: [
      { item_id:2001, item_code:"SCR-M3-10", item_name:"M3 × 10mm Screw", description:"Steel machine screw, M3 × 10mm", item_type:"PART", base_uom_id:1, tracking_method_id:3, status:"ACTIVE", created_by:"USER-15", updated_by:"USER-15", part_id:3001, part_category:"Fastener", part_type:"Machine Screw", material:"Steel", specification:"M3 × 10mm", manufacturer_part_no:"M3-10-SS", manufacturer:"ECOTEC Approved Supplier", default_location_id:201, compatible_models:"All iPhone assembly work", reorder_point:1000, reorder_quantity:5000, shelf_life_days:null, created_at:"2026-08-19 08:00", updated_at:"2026-08-19 08:00" },
      { item_id:2002, item_code:"BAT-IP12", item_name:"iPhone 12 Battery", description:"Replacement battery for iPhone 12", item_type:"PART", base_uom_id:1, tracking_method_id:3, status:"ACTIVE", created_by:"USER-15", updated_by:"USER-15", part_id:3002, part_category:"Battery", part_type:"Replacement Battery", material:"Lithium-ion", specification:"2815 mAh", manufacturer_part_no:"BAT-IP12-01", manufacturer:"ECOTEC Approved Supplier", default_location_id:201, compatible_models:"iPhone 12", reorder_point:20, reorder_quantity:100, shelf_life_days:730, created_at:"2026-08-19 08:05", updated_at:"2026-08-19 08:05" },
      { item_id:2003, item_code:"BAT-IP15", item_name:"iPhone 15 Battery", description:"Replacement battery for iPhone 15", item_type:"PART", base_uom_id:1, tracking_method_id:3, status:"ACTIVE", created_by:"USER-15", updated_by:"USER-15", part_id:3003, part_category:"Battery", part_type:"Replacement Battery", material:"Lithium-ion", specification:"3349 mAh", manufacturer_part_no:"BAT-IP15-01", manufacturer:"ECOTEC Approved Supplier", default_location_id:201, compatible_models:"iPhone 15", reorder_point:20, reorder_quantity:100, shelf_life_days:730, created_at:"2026-08-19 08:06", updated_at:"2026-08-19 08:06" },
      { item_id:2004, item_code:"BAT-IP16", item_name:"iPhone 16 Battery", description:"Replacement battery for iPhone 16", item_type:"PART", base_uom_id:1, tracking_method_id:3, status:"ACTIVE", created_by:"USER-15", updated_by:"USER-15", part_id:3004, part_category:"Battery", part_type:"Replacement Battery", material:"Lithium-ion", specification:"3561 mAh", manufacturer_part_no:"BAT-IP16-01", manufacturer:"ECOTEC Approved Supplier", default_location_id:201, compatible_models:"iPhone 16", reorder_point:20, reorder_quantity:100, shelf_life_days:730, created_at:"2026-08-19 08:07", updated_at:"2026-08-19 08:07" }
    ],
    uom:{uom_id:1,name:"Each",symbol:"EA",uom_type:"COUNT",is_active:true},
    trackingSerial:{tracking_method_id:1,code:"SERIAL",name:"Serialized",description:"One physical identifier per unit"},
    trackingNone:{tracking_method_id:3,code:"NONE",name:"No individual tracking",description:"Quantity-based stock"},
    location:{location_id:201,location_code:"RCV-BAY-1",location_name:"Receiving Cage – Bay 1",location_type_id:2,parent_location_id:null,is_active:true}
  };

  var LOCATION_LABEL = "Receiving Cage – Bay 1 (201)";
  var LOCATION_SHORT = "Receiving Cage – Bay 1";
  var STATE_LABEL = "QUARANTINED";
  var ACTUAL_MISMATCH_IMEI = "IMEI-MISMATCH-9303";

  var CHECKS = [
    { q: "Is this IMEI expected in Shipment 3137323?", ref: "INBOUND_SHIPMENT_ASSET.expected_imei" },
    { q: "Does the physical IMEI tally with the ASN asset?", ref: "ASSET_IDENTIFIER / ASN" },
    { q: "Does the asset resolve to the expected ITEM_MASTER?", ref: "ASSET_UNIT.item_id" },
    { q: "Has this phone already been received?", ref: "RECEIPT_ASSET duplicate check" },
    { q: "Is the IMEI / serial unique in the warehouse?", ref: "ASSET_IDENTIFIER.normalized_identifier" },
    { q: "Does it belong to this shipment?", ref: "inbound_shipment_id = 7001" }
  ];

  var SCENARIO_INFO = {
    normal:{label:"NORMAL RECEIVING",title:"Both Excel files and both packages received normally",explanation:"Package 1 contains 10 different iPhone models and Package 2 contains 500 screws plus 30 batteries for different iPhone models. All product identifiers and part quantities tally, so all accepted goods can be posted."},
    tampered:{label:"TAMPERED PRODUCT PACKAGE",title:"Product package fails visual inspection; parts package is independent",explanation:"Only Package 1 is tampered. The product package is reported and held for customer disposition. Package 2 has its own Excel file, physical package, receiving line, and can still be received and posted normally."},
    missing:{label:"MISSING PHONE",title:"10 different phone models expected, 9 physically found",explanation:"Package 1 is short by exactly one phone. Only the missing product unit is reported. The other 9 models continue to receiving, while Package 2 parts remain independently receivable."},
    imei:{label:"IMEI MISMATCH",title:"10 iPhone models received, only 1 IMEI mismatch is reported",explanation:"All 10 different models are physically present. Nine IMEIs match the ASN and continue normally. Only the mismatched phone is placed in RECEIVING_EXCEPTION / FAILURE_REPORT. Customer disposition then decides whether to approve an IMEI correction and post that phone, or ship back only that unit; the other 9 phones and all parts continue independently."}
  };

  var BUSINESS_RULES = {
    pendingInbound: {
      status: "PENDING_RECEIPT",
      inventoryEffect: "NONE",
      balanceEffect: "NONE",
      assetEffect: "NONE UNTIL PHYSICAL RECEIPT"
    },
    postedReceipt: {
      status: "POSTED",
      inventoryEffect: "ACCEPTED QUANTITY ONLY",
      balanceEffect: "INCREASES ON HAND",
      assetEffect: "SERIALIZED ACCEPTED UNITS LINKED TO ASSET_UNIT"
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

  function scenarioState(){
    var d=state.disposition;
    var productExpected=PHONES.length;
    var partsExpected=partsTotal("expectedQty");
    var screws=PARTS[0];
    var batteryExpected=PARTS.slice(1).reduce(function(sum,p){return sum+p.expectedQty;},0);
    var productPhysical=productExpected;
    var matched=productExpected;
    var missing=0;
    var mismatch=0;
    var productPosted=productExpected;
    var partsPostedTotal=partsExpected;
    var packaging="PASS";
    var report="PASS";
    var finalStatus="POSTED";

    if(state.scenario==="tampered"){
      packaging="FAIL — PRODUCT PACKAGE TAMPERED";
      report="FAIL — PRODUCT PACKAGE";
      var proceed=d==="proceed";
      productPhysical=proceed?productExpected:null;
      matched=proceed?productExpected:0;
      productPosted=proceed?productExpected:0;
      finalStatus=proceed?"POSTED AFTER DISPOSITION":(d==="shipback"?"PRODUCT PACKAGE SHIP BACK":"AWAITING DISPOSITION");
    } else if(state.scenario==="missing"){
      productPhysical=productExpected-1;
      matched=productExpected-1;
      missing=1;
      productPosted=d==="proceed"?productExpected-1:0;
      finalStatus=d==="proceed"?"PARTIAL POSTED — 1 MISSING":"MISSING UNIT — AWAITING CUSTOMER DECISION";
      report="FAIL — 1 MISSING PHONE";
    } else if(state.scenario==="imei"){
      productPhysical=productExpected;
      matched=productExpected-1;
      mismatch=1;
      productPosted=d==="proceed"?productExpected:productExpected-1;
      report="FAIL — 1 IMEI MISMATCH";
      finalStatus=d==="proceed"?"POSTED AFTER IMEI CORRECTION":(d==="shipback"?"PARTIAL POSTED — MISMATCHED UNIT SHIPPED BACK":"MISMATCHED UNIT — AWAITING CUSTOMER DECISION");
    }

    // Parts package is independent from product exceptions.
    if(state.scenario==="normal") partsPostedTotal=partsExpected;
    if(state.scenario==="tampered") partsPostedTotal=partsExpected;
    if(state.scenario==="missing") partsPostedTotal=partsExpected;
    if(state.scenario==="imei") partsPostedTotal=partsExpected;

    return {
      expected:productExpected,
      physical:productPhysical,
      matched:matched,
      missing:missing,
      mismatch:mismatch,
      partsExpected:partsExpected,
      partsActual:partsExpected,
      partsPosted:partsPostedTotal,
      screwsExpected:screws.expectedQty,
      screwsActual:screws.expectedQty,
      screwsPosted:d==="shipback"?0:screws.expectedQty,
      batteriesExpected:batteryExpected,
      batteriesActual:batteryExpected,
      batteriesPosted:d==="shipback"?0:batteryExpected,
      packaging:packaging,
      report:report,
      posted:productPosted,
      finalStatus:finalStatus,
      inventoryState:(productPosted>0 || partsPostedTotal>0)?STATE_LABEL:"NOT POSTED",
      location:(productPosted>0 || partsPostedTotal>0)?LOCATION_SHORT:(d==="shipback"?"Receiving Hold / Return":"Receiving Hold")
    };
  }

  function displayActualImei(p) {
    return state.scenario === "imei" && p.n === 3 ? ACTUAL_MISMATCH_IMEI : p.imei;
  }

  function phonePhysicallyPresent(p) {
    if (state.scenario === "tampered" && state.disposition !== "proceed") return false;
    if (state.scenario === "missing" && p.n === 10) return false;
    return true;
  }

  function phoneMatchesNormally(p) {
    if (!phonePhysicallyPresent(p)) return false;
    if (state.scenario === "imei" && p.n === 3) return false;
    return true;
  }

  function hasReceiptAsset(p) {
    if (!phonePhysicallyPresent(p)) return false;
    if (state.scenario === "imei" && p.n === 3) return false;
    return true;
  }

  function isPhonePosted(p) {
    if (state.scenario === "tampered") return state.disposition === "proceed";
    if (state.scenario === "missing") return state.disposition === "proceed" && p.n !== 10;
    if (state.scenario === "imei") {
      if (state.disposition === "proceed") return true;
      if (state.disposition === "shipback") return p.n !== 3;
      return false;
    }
    return true;
  }

  function postedPhones() {
    return PHONES.filter(isPhonePosted);
  }

  function postedParts() {
    var s = scenarioState();
    if (!s.partsPosted) return [];
    return PARTS.map(function (p) {
      var copy = Object.assign({}, p);
      copy.goodQty = p.n === 1 ? s.screwsPosted : s.batteriesPosted;
      return copy;
    }).filter(function (p) { return p.goodQty > 0; });
  }

  function partsTotal(field) {
    return PARTS.reduce(function (sum, p) { return sum + (Number(p[field]) || 0); }, 0);
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
  function renderFileRows(){
    var productTbody=document.getElementById("asnProductFileRows");
    var partsTbody=document.getElementById("asnPartsFileRows");
    if(productTbody){productTbody.innerHTML=PHONES.map(function(p){return '<tr><td>'+p.itemCode+'</td><td>'+p.itemName+' '+p.storage+'</td><td>'+p.color+'</td><td>'+p.imei+' / '+p.serial+'</td><td>1 EA</td></tr>';}).join("");}
    if(partsTbody){partsTbody.innerHTML=PARTS.map(function(p){return '<tr><td>'+p.itemCode+'</td><td>'+p.itemName+'</td><td>'+p.compatibleModels+'</td><td>'+p.expectedQty+'</td><td>'+p.uom+'</td></tr>';}).join("");}
  }

  function renderAsnRowCards(){
    var host=document.getElementById("asnRowCards");
    if(!host) return;
    var productCards=PHONES.map(function(p){return '<div class="db-card theme-asn highlightable" data-phone="'+p.n+'"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">PRODUCT FILE · Phone '+p.n+'</span> ASN_IMPORT_ROW</div><span class="status-chip chip-expected">'+p.asnRow+'</span></div><div class="db-card-body">'+
      field(badge("pk","PK")+"import_row_id",p.asnRow)+field(badge("source","SRC")+"sku",p.extSku)+field(badge("fk","FK")+"item_id",p.itemId+" ("+p.itemCode+")")+field(badge("source","SRC")+"imei / serial_number",p.imei+" / "+p.serial)+field("qty / uom","1 / EA")+field("model_number / storage",p.modelNumber+" / "+p.storage)+field("color / region",p.color+" / "+p.region)+
      '</div></div>';}).join("");
    var partCards=PARTS.map(function(p){return '<div class="db-card theme-asn highlightable part-card"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">PARTS FILE</span> ASN_IMPORT_ROW</div><span class="status-chip chip-expected">'+p.asnRow+'</span></div><div class="db-card-body">'+
      field(badge("pk","PK")+"import_row_id",p.asnRow)+field(badge("source","SRC")+"sku",p.extSku)+field(badge("fk","FK")+"item_id",p.itemId+" ("+p.itemCode+")")+field("declared_qty / uom",p.expectedQty+" / "+p.uom)+field("compatible_models",p.compatibleModels)+field("package_id",p.packageId)+
      '</div></div>';}).join("");
    host.innerHTML=productCards+partCards;
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
        field(badge("fk", "FK") + "item_id", p.itemId + " (" + p.itemCode + ")") + field("model / storage", p.itemName + " / " + p.storage) + field("color / region", p.color + " / " + p.region) +
        field("model / color", p.itemName + " / " + p.color) + field("expected id_type <b>IMEI</b>", p.imei + techSpan(" · #" + p.idImei)) +
        field("expected id_type <b>SERIAL_NUMBER</b>", p.serial + techSpan(" · #" + p.idSerial)) +
        "</div></div>";
    }).join("");
  }

  function renderMasterDataDashboard(){
    var host=document.getElementById("masterDataDashboard");
    if(!host) return;
    var m=MASTER_DATA;
    function esc(v){return String(v==null?"—":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
    function tCard(title,cols,rows,cls){
      return '<div class="master-table-card '+(cls||'')+'"><div class="master-table-head"><strong>'+title+'</strong><span>'+rows.length+' row(s)</span></div><div class="master-table-scroll"><table class="master-data-table"><thead><tr>'+cols.map(function(c){return '<th>'+c+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(row){return '<tr>'+row.map(function(v){return '<td>'+esc(v)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div></div>';
    }
    var itemRows=m.products.map(function(p){return [p.item_id,p.item_code,p.item_name,p.item_type,p.base_uom_id,p.tracking_method_id,p.status];}).concat(m.parts.map(function(p){return [p.item_id,p.item_code,p.item_name,p.item_type,p.base_uom_id,p.tracking_method_id,p.status];}));
    var productRows=m.products.map(function(p){return [p.product_id,p.item_id,p.brand,p.series,p.model_number,p.storage,p.color,p.model_year,p.region,p.product_category];});
    var partRows=m.parts.map(function(p){return [p.part_id,p.item_id,p.part_category,p.part_type,p.material,p.specification,p.manufacturer_part_no,p.manufacturer,p.default_location_id,p.compatible_models,p.reorder_point,p.reorder_quantity,p.shelf_life_days];});
    host.innerHTML='<div class="master-db-intro"><b>Master Data used by this ASN</b><span>Every product and part has its own ITEM_MASTER record. Product-specific attributes identify the exact phone model, while PART attributes define reusable quantity-based stock.</span></div>'+
      tCard('ITEM_MASTER — all inbound items',['item_id','item_code','item_name','item_type','base_uom_id','tracking_method_id','status'],itemRows,'master-table-card--primary')+
      tCard('PRODUCT — 10 distinct iPhone definitions',['product_id','item_id','brand','series','model_number','storage','color','model_year','region','product_category'],productRows,'master-table-card--product')+
      tCard('PART — screws and batteries',['part_id','item_id','part_category','part_type','material','specification','manufacturer_part_no','manufacturer','default_location_id','compatible_models','reorder_point','reorder_quantity','shelf_life_days'],partRows,'master-table-card--part')+
      '<div class="master-ref-strip"><span><b>UOM</b> '+m.uom.name+' ('+m.uom.symbol+')</span><span><b>SERIAL TRACKING</b> '+m.trackingSerial.name+'</span><span><b>PART TRACKING</b> '+m.trackingNone.name+'</span><span><b>LOCATION</b> '+m.location.location_code+' · '+m.location.location_name+'</span></div>';
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
    setText("sumMatched", s.matched, s.matched === 10 ? "tone-pass" : "tone-warn");
    setText("sumMissing", s.missing, s.missing ? "tone-fail" : "");
    setText("sumMismatch", s.mismatch, s.mismatch ? "tone-fail" : "");
    setText("sumPackaging", s.packaging, toneClassFor(s.packaging));
    setText("sumReport", s.report, toneClassFor(s.report));
    var disp = state.scenario === "normal" ? "NOT REQUIRED" : (state.disposition === "proceed" ? "PROCEED" : state.disposition === "shipback" ? "SHIP BACK" : "PENDING");
    setText("sumDisposition", disp, toneClassFor(disp));
    setText("sumPosted", s.posted + " phones + " + s.screwsPosted + " screws + " + s.batteriesPosted + " batteries", (s.posted || s.partsPosted) ? "tone-pass" : "tone-muted");
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
    parts.push(flowNode("Customer Focal Person", "Advance Shipment Notice", "PASS", "ASN: 2 packages · 2 Excel files · 10 iPhone models + 500 screws + 30 batteries"));
    parts.push(flowArrow(""));
    parts.push(flowNode("IMPEX", "Shipping Details", "PASS", "Arrival, qty, courier"));
    parts.push(flowArrow(""));
    parts.push(flowNode("Warehouse Receiving", "Delivery Notes Verification", "PASS", "DR / invoice / packing list"));
    parts.push(flowArrow(""));

    if (state.scenario === "tampered") {
      parts.push(flowNode("Warehouse Receiving", "VI of Packaging", "FAIL", "Broken / tampered seal"));
      parts.push(flowArrow("PACKAGE FAIL"));
      parts.push(flowNode("Warehouse Receiving", "Receiving Failure Report", "FAIL", "Package-level exception"));
      parts.push(flowArrow(""));
      parts.push(flowNode("Customer Focal Person", "Feedback to Customer", "WAIT", "Disposition required"));
      parts.push(flowArrow(""));
      if (state.disposition === "proceed") {
        parts.push(flowNode("Customer", "Disposition", "PASS", "PROCEED"));
        parts.push(flowArrow("resume"));
        parts.push(flowNode("Warehouse Receiving", "Controlled Receiving", "PASS", "Product pkg: 10 iPhone models · Parts pkg: 500 screws + 30 batteries"));
        parts.push(flowArrow(""));
        parts.push(flowNode("Warehouse Receiving", "Receipt Posting", "PASS", "Product pkg: 10 iPhone models · Parts pkg: 500 screws + 30 batteries"));
      } else if (state.disposition === "shipback") {
        parts.push(flowNode("Customer", "Disposition", "STOP", "SHIP BACK PRODUCT PACKAGE"));
        parts.push(flowArrow("independent package"));
        parts.push(flowNode("Warehouse Receiving", "Parts Package 2", "PASS", "500 screws + 30 batteries received separately"));
        parts.push(flowArrow("post"));
        parts.push(flowNode("Warehouse Receiving", "Parts Receipt Posting", "PASS", "500 screws + 30 batteries"));
      } else {
        parts.push(flowNode("Customer", "Disposition", "WAIT", "PENDING"));
        parts.push(flowArrow("independent package"));
        parts.push(flowNode("Warehouse Receiving", "Parts Package 2", "PASS", "500 screws + 30 batteries can be received separately"));
        parts.push(flowArrow("post"));
        parts.push(flowNode("Warehouse Receiving", "Parts Receipt Posting", "PASS", "500 screws + 30 batteries"));
      }
    } else if (state.scenario === "missing") {
      parts.push(flowNode("Warehouse Receiving", "VI of Packaging", "PASS", "Open actual product package"));
      parts.push(flowArrow("PASS"));
      parts.push(flowNode("Warehouse Receiving", "Count + IMEI Registration", "FAIL", "9 of 10 iPhone models found; one expected unit missing"));
      parts.push(flowArrow("REPORT ONLY"));
      parts.push(flowNode("Warehouse Receiving", "Receiving Exception + Failure Report", "FAIL", "Only the missing phone is documented"));
      parts.push(flowArrow("REQUEST DISPOSITION"));
      if (state.disposition === "pending") {
        parts.push(flowNode("Customer Focal Person", "Disposition Request", "WAIT", "Sent to Customer for decision"));
        parts.push(flowArrow("decision required"));
        parts.push(flowNode("Customer", "Decision", "WAIT", "PROCEED PARTIAL or HOLD / INVESTIGATE"));
      } else if (state.disposition === "proceed") {
        parts.push(flowNode("Customer", "Disposition Decision", "PASS", "PROCEED_PARTIAL"));
        parts.push(flowArrow("authorized"));
        parts.push(flowNode("Warehouse Receiving", "Receive Valid Goods", "PASS", "9 phones + 500 screws + 30 batteries"));
        parts.push(flowArrow("post accepted"));
        parts.push(flowNode("Warehouse Receiving", "Receipt Posting", "PASS", "9 phones + all valid parts"));
      } else {
        parts.push(flowNode("Customer", "Disposition Decision", "STOP", "HOLD_INVESTIGATE"));
        parts.push(flowArrow("product held"));
        parts.push(flowNode("Warehouse Receiving", "Hold Product Exception", "WAIT", "Missing phone remains outstanding"));
        parts.push(flowArrow("parts independent"));
        parts.push(flowNode("Warehouse Receiving", "Parts Package 2", "PASS", "500 screws + 30 batteries"));
        parts.push(flowArrow("post"));
        parts.push(flowNode("Warehouse Receiving", "Parts Receipt Posting", "PASS", "530 part units"));
      }
    } else if (state.scenario === "imei") {
      parts.push(flowNode("Warehouse Receiving", "VI of Packaging", "PASS", "Open actual product package"));
      parts.push(flowArrow("PASS"));
      parts.push(flowNode("Warehouse Receiving", "IMEI Registration", "FAIL", "9 IMEIs match; Phone 3 has a mismatch"));
      parts.push(flowArrow("REPORT ONLY"));
      parts.push(flowNode("Warehouse Receiving", "Receiving Exception + Failure Report", "FAIL", "Only Phone 3 is documented"));
      parts.push(flowArrow("REQUEST DISPOSITION"));
      if (state.disposition === "pending") {
        parts.push(flowNode("Customer Focal Person", "Disposition Request", "WAIT", "Sent to Customer for decision"));
        parts.push(flowArrow("decision required"));
        parts.push(flowNode("Customer", "Decision", "WAIT", "APPROVE IMEI CORRECTION or SHIP BACK UNIT"));
      } else if (state.disposition === "proceed") {
        parts.push(flowNode("Customer", "Disposition Decision", "PASS", "APPROVE_IMEI_CORRECTION"));
        parts.push(flowArrow("authorized"));
        parts.push(flowNode("Customer Focal Person", "Identifier Correction Request", "PASS", "Record corrected IMEI before enrollment"));
        parts.push(flowArrow("resume receiving"));
        parts.push(flowNode("Warehouse Receiving", "Receive All 10 Products + Parts", "PASS", "9 matched + 1 corrected · 500 screws + 30 batteries"));
        parts.push(flowArrow("post accepted"));
        parts.push(flowNode("Warehouse Receiving", "Receipt Posting", "PASS", "10 phones + 530 part units"));
      } else {
        parts.push(flowNode("Customer", "Disposition Decision", "STOP", "SHIP_BACK_UNIT"));
        parts.push(flowArrow("exclude mismatch"));
        parts.push(flowNode("Warehouse Receiving", "Receive Valid Goods", "PASS", "9 matched phones + 500 screws + 30 batteries"));
        parts.push(flowArrow("post accepted"));
        parts.push(flowNode("Warehouse Receiving", "Receipt Posting", "PASS", "9 phones + 530 part units"));
      }
    } else {
      parts.push(flowNode("Warehouse Receiving", "VI of Packaging", "PASS", "Open actual box"));
      parts.push(flowArrow("PASS"));
      parts.push(flowNode("Warehouse Receiving", "IMEI + Quantity Registration", "PASS", "10/10 iPhone models + 500 screws + 30 batteries"));
      parts.push(flowArrow(""));
      parts.push(flowNode("Warehouse Receiving", "Receiving Report", "PASS", "No discrepancy"));
      parts.push(flowArrow(""));
      parts.push(flowNode("Warehouse Receiving", "Receipt Posting", "PASS", "Product pkg: 10 iPhone models · Parts pkg: 500 screws + 30 batteries"));
    }

    host.innerHTML = parts.join("");

    var packageFail = state.scenario === "tampered";
    setText("packageGateValue", packageFail ? "FAIL" : "PASS", packageFail ? "tone-fail" : "tone-pass");
    setText("packageGateNote", packageFail
      ? "Security seal is broken / tampered. Package-level reporting and customer disposition come before controlled receiving."
      : "Physical box and seal are acceptable. Open box and continue with receiving validation.");
    var card = document.getElementById("packageGateCard");
    if (card) card.classList.toggle("gate-failed", packageFail);

    var productStatus = packageFail ? "FAIL — TAMPERED" : "PASS";
    var productNote = packageFail ? (state.disposition === "proceed" ? "Customer approved controlled receiving" : "Waiting for customer disposition") : (state.scenario === "missing" ? "9 of 10 iPhone models found" : state.scenario === "imei" ? "10 found · 1 IMEI mismatch" : "10 of 10 iPhone models ready");
    setText("productPackageStatus", productStatus, packageFail ? "tone-fail" : "tone-pass");
    setText("productPackageNote", productNote, packageFail ? "tone-fail" : "");
    setText("partsPackageStatus", "PASS", "tone-pass");
    setText("partsPackageNote", "500 screws + 30 batteries ready", "tone-pass");

    var decision = document.getElementById("arrivalDecision");
    if (!decision) return;
    if (packageFail) {
      decision.className = "decision-banner is-fail";
      decision.innerHTML = '<strong>Packaging FAIL:</strong> report the package failure first. Receiving is blocked until customer disposition.';
    } else if (state.scenario === "imei") {
      decision.className = "decision-banner is-fail";
      decision.innerHTML = '<strong>IMEI exception:</strong> report only the mismatched phone. The other 9 iPhone models plus 500 screws and 30 batteries continue receiving and can be posted.';
    } else if (state.scenario === "missing") {
      decision.className = "decision-banner is-fail";
      decision.innerHTML = '<strong>Quantity exception:</strong> report only the missing phone. The 9 physical phones plus 500 screws and 30 batteries continue receiving and can be posted.';
    } else {
      decision.className = "decision-banner is-pass";
      decision.innerHTML = '<strong>Receiving PASS:</strong> 10 iPhone models + 500 screws + 30 batteries can proceed to receipt posting.';
    }
  }

  /* ---------------- Receipt declared / actual ---------------- */
  function receiptLineValues(p) {
    if (state.scenario === "tampered" && state.disposition !== "proceed") {
      return { actual: "—", variance: "—", validation: "NOT COUNTED", remarks: "Packaging VI failed before opening", tone: "wait" };
    }
    if (state.scenario === "missing" && p.n === 10) {
      return { actual: "0", variance: "-1", validation: "MISSING", remarks: "Only this expected phone is missing", tone: "fail" };
    }
    if (state.scenario === "imei" && p.n === 3) {
      return { actual: "1", variance: "0", validation: "IMEI MISMATCH", remarks: "Only this unit is reported; other 9 iPhone models continue", tone: "fail" };
    }
    return { actual: "1", variance: "0", validation: "TALLY", remarks: "Physical unit accepted for receiving", tone: "pass" };
  }

  function renderReceiptLines() {
    var tbody = document.getElementById("receiptLineRows");
    if (!tbody) return;

    var phoneRows = PHONES.map(function (p) {
      var v = receiptLineValues(p);
      return '<tr class="highlightable row-' + v.tone + '" data-phone="' + p.n + '"><td>Phone ' + p.n + ' · ' + p.itemName + '</td><td>' + p.receiptLineId + '</td><td>' + p.imei + ' / ' + p.color + '</td><td>1</td><td>' + v.actual + '</td><td>' + v.variance + '</td><td><span class="status-chip chip-' + (v.tone === "pass" ? "posted" : v.tone === "fail" ? "failed" : "pending") + '">' + v.validation + '</span></td><td>' + v.remarks + "</td></tr>";
    }).join("");

    var s = scenarioState();
    var partRows = PARTS.map(function (part) {
      var actual = (state.disposition === "shipback") ? 0 : part.expectedQty;
      var posted = (state.disposition === "shipback") ? 0 : part.expectedQty;
      return '<tr class="row-pass"><td>' + part.itemCode + '</td><td>' + (5200 + part.n) + '</td><td>' + part.compatibleModels + '</td><td>' + part.expectedQty + '</td><td>' + actual + '</td><td>0</td><td><span class="status-chip chip-posted">' + (posted ? "TALLY" : "HELD") + '</span></td><td>PARTS PACKAGE · quantity-based part</td></tr>';
    }).join("");

    tbody.innerHTML = phoneRows + partRows;

    var counters = document.getElementById("receiptCounters");
    if (counters) counters.innerHTML =
      counterHtml("10 iPhone models", "Product Expected") +
      counterHtml("500 screws + 30 batteries", "Parts Expected") +
      counterHtml((s.physical === null ? "—" : s.physical) + " phones", "Product Actual") +
      counterHtml("500 screws + 30 batteries", "Parts Actual") +
      counterHtml(s.missing ? "-1 phone" : "0", "Variance", s.missing > 0) +
      counterHtml(s.mismatch, "IMEI Mismatch", s.mismatch > 0);
  }

  function counterHtml(value, label, bad) {
    return '<div class="counter"><div class="c-val ' + (bad ? "no" : "") + '">' + value + '</div><div class="c-lbl">' + label + "</div></div>";
  }

  /* ---------------- Phone tabs + scan station ---------------- */
  function renderPhoneTabs(container) {
    container.innerHTML = PHONES.map(function (p) {
      var sub = p.imei;
      if (state.scenario === "imei" && p.n === 3) sub = p.imei + " → " + ACTUAL_MISMATCH_IMEI;
      if (state.scenario === "missing" && p.n === 10) sub = p.imei + " · MISSING";
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
    } else if (state.scenario === "missing" && p.n === 10) {
      readout.innerHTML = p.imei + '<span class="serial">NO PHYSICAL PHONE</span>';
      chain.innerHTML = checkStepHtml(CHECKS[0], 0, true, "Expected in ASN, but no physical unit can be scanned") + '<div class="check-chain result result-fail">MISSING — Phone 10 cannot create RECEIPT_ASSET</div>';
      card.innerHTML = emptyState("No RECEIPT_ASSET for Phone 10", "Expected record remains in ASN / INBOUND_SHIPMENT_ASSET, but nothing physical was received.");
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
        chain.innerHTML += '<div class="check-chain result result-fail">FAIL — ONLY THIS PHONE IS REPORTED</div>';
        card.innerHTML = emptyState("Phone 3 held from posting", "The mismatch is preserved in the receiving exception / failure report. The other 9 iPhone models and the 500 screws + 30 batteries continue normally.");
      } else {
        chain.innerHTML += '<div class="check-chain result">MATCHED — Phone ' + p.n + " physically received</div>";
        card.innerHTML = renderReceiptAssetCard(p, "MATCHED", actualImei);
      }
    }

    var s = scenarioState();
    var progressBase = s.matched;
    if (state.scenario === "imei" && state.disposition === "proceed") progressBase = 5;
    var fill = document.getElementById("progressFill");
    if (fill) fill.style.width = ((progressBase / 10) * 100) + "%";
    setText("progressText", progressBase + " / 10");
    setText("progressLabel", state.scenario === "imei" ? "9 iPhone models accepted; 1 mismatched phone reported" : "Phones matched / accepted");

    var counters = document.getElementById("scanCounters");
    if (counters) counters.innerHTML = counterHtml(10, "Expected") + counterHtml(fmtCount(s.physical), "Physical") + counterHtml(s.matched, "Direct Match") + counterHtml(s.missing, "Missing", s.missing > 0) + counterHtml(s.mismatch, "Mismatch", s.mismatch > 0);

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
      ["Received Date", "2026-08-20"],
      ["Shipment", "3137323"],
      ["ASN", "ASN-3137323"],
      ["Packages", "2 · Product + Parts"],
      ["Product Package", "10 iPhones · SERIAL"],
      ["Parts Package", "500 screws + 30 batteries · QTY"],
      ["Reported By", "USER-22 · Warehouse Receiving"],
      ["Customer Focal", "USER-31 · sample"]
    ].map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + "</b></div>"; }).join("");

    var rows = [];
    if (state.scenario === "tampered") {
      rows.push(reportRow("Packaging VI", "SEALED / ACCEPTABLE", "TAMPERED / BROKEN SEAL", "—", "FAIL", "Only the package-level failure is reported."));
    } else if (state.scenario === "missing") {
      rows.push(reportRow("Phone 10", "IMEI-1010 / Qty 1", "NOT FOUND / Qty 0", "-1", "MISSING", "Only the missing phone is reported. Phones 1–9 and the complete parts package continue to receiving."));
    } else if (state.scenario === "imei") {
      rows.push(reportRow("Phone 3", "IMEI-1303 / Qty 1", ACTUAL_MISMATCH_IMEI + " / Qty 1", "0", "IMEI MISMATCH", "Only the mismatched IMEI is reported. The other 9 iPhone models and the complete parts package continue to receiving and posting."));
    }

    var tbody = document.getElementById("reportRows");
    if (tbody) tbody.innerHTML = rows.length ? rows.join("") : '<tr><td colspan="6" class="empty-table-cell">No exception report rows. All expected goods passed receiving.</td></tr>';

    renderExceptionDatabaseCards();
    renderDispositionPanel();
  }

  function exceptionDetails() {
    if (state.scenario === "tampered") return { id: 54001, type: "TAMPERED_PACKAGE", expected: "SEALED / ACCEPTABLE", actual: "BROKEN / TAMPERED SEAL", line: "null · receipt-level", asset: "null", failureId: 57001, failureNo: "FR-2026-00021", reportType: "PACKAGING_FAILURE", inspectionId: 73001, file: "broken_seal_photo.jpg" };
    if (state.scenario === "missing") return { id: 54002, type: "SHORT_SHIPMENT", expected: "10 PRODUCT MODELS / IPHONE 17 EXPECTED", actual: "9 PRODUCT MODELS / IPHONE 17 MISSING", line: "5105", asset: "null", failureId: 57002, failureNo: "FR-2026-00022", reportType: "QUANTITY_VARIANCE", inspectionId: 73002, file: "packing_list_and_open_box.jpg" };
    return { id: 54003, type: "IMEI_MISMATCH", expected: "IMEI-1303", actual: ACTUAL_MISMATCH_IMEI, line: "5103", asset: "null at detection", failureId: 57003, failureNo: "FR-2026-00023", reportType: "FAILED_IMEI", inspectionId: 73003, file: "phone3_imei_photo.jpg" };
  }

  function renderExceptionDatabaseCards() {
    var host = document.getElementById("exceptionDatabaseCards");
    if (!host) return;
    if (state.scenario === "normal") {
      host.innerHTML = '<div class="success-state"><span>✓</span><div><strong>No receiving discrepancy</strong><p><code>RECEIPT.receiving_report_no = GRN-2026-00081</code> documents the successful overall receiving report. No <code>RECEIVING_EXCEPTION</code>, <code>FAILURE_REPORT</code>, or disposition is needed.</p></div></div>';
      return;
    }

    var x = exceptionDetails();
    var cards = [];

    if (state.scenario === "tampered") {
      cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">INSPECTION ' + x.inspectionId + '</div><span class="status-chip chip-failed">FAIL</span></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "inspection_id", x.inspectionId) + field(badge("fk", "FK") + "receipt_id", "5001") + field("asset_id", emptyVal() + techSpan(" · package VI")) + field("quantity_inspected", "1 package") + field("result_code_id", "FAIL") + field("remarks", "Product package security seal failed before normal receiving") + "</div></div>");
    }

    cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">RECEIVING_EXCEPTION ' + x.id + '</div><span class="status-chip chip-failed">' + (state.disposition === "pending" ? "OPEN" : "RESOLVED") + '</span></div><div class="db-card-body">' +
      field(badge("pk", "PK") + "receiving_exception_id", x.id) + field(badge("fk", "FK") + "receipt_id", "5001") + field(badge("fk", "FK") + "receipt_line_id", x.line) + field(badge("fk", "FK") + "receipt_asset_id", x.asset) + field("exception_type", x.type) + field("expected_value", x.expected) + field("actual_value", x.actual) + field("status_id", state.disposition === "pending" ? "OPEN" : "RESOLVED") + field("created_by / created_at", "USER-22 / 2026-08-20 09:24") + "</div></div>");

    cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">FAILURE_REPORT ' + x.failureId + '</div><span class="status-chip chip-failed">' + x.failureNo + '</span></div><div class="db-card-body">' +
      field(badge("pk", "PK") + "failure_report_id", x.failureId) + field("report_no", x.failureNo) + field(badge("fk", "FK") + "inspection_id", x.inspectionId) + field(badge("fk", "FK") + "receipt_line_id", x.line) + field("report_type", x.reportType) + field("status_id", state.disposition === "pending" ? "OPEN" : "CLOSED") + field("reported_by / reported_at", "USER-22 / 2026-08-20 09:25") + field("file_reference", x.file + techSpan(" · illustrative")) + "</div></div>");

    var dispositionRequestId = state.scenario === "tampered" ? 58001 : state.scenario === "missing" ? 58002 : 58003;
    var dispositionDecisionId = state.scenario === "tampered" ? 59001 : state.scenario === "missing" ? 59002 : 59003;
    var targetType = state.scenario === "tampered" ? "RECEIPT / PRODUCT PACKAGE" : "RECEIPT_LINE / AFFECTED PRODUCT UNIT";

    cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">DISPOSITION_REQUEST ' + dispositionRequestId + '</div><span class="status-chip ' + (state.disposition === "pending" ? "chip-warning" : "chip-posted") + '">' + (state.disposition === "pending" ? "PENDING" : "DECIDED") + '</span></div><div class="db-card-body">' +
      field("target_type", targetType) + field("quantity", state.scenario === "tampered" ? "1 package" : "1 affected unit") + field(badge("fk", "FK") + "failure_report_id", x.failureId) + field("requested_from_party_id", "CUSTOMER-001") + field("request_type", "RECEIVING_DISPOSITION") + field("requested_by / requested_at", "USER-31 / 2026-08-20 09:28") + "</div></div>");

    if (state.disposition !== "pending") {
      var decisionCode = state.scenario === "tampered"
        ? (state.disposition === "proceed" ? "PROCEED" : "SHIP_BACK")
        : state.scenario === "missing"
          ? (state.disposition === "proceed" ? "PROCEED_PARTIAL" : "HOLD_INVESTIGATE")
          : (state.disposition === "proceed" ? "APPROVE_IMEI_CORRECTION" : "SHIP_BACK_UNIT");
      var notes = state.scenario === "tampered"
        ? (state.disposition === "proceed" ? "Customer authorized controlled receiving of the product package." : "Customer instructed warehouse to ship the product package back.")
        : state.scenario === "missing"
          ? (state.disposition === "proceed" ? "Customer approved partial receipt. The missing phone remains an outstanding shortage." : "Customer instructed warehouse to hold the product discrepancy for investigation and reconciliation.")
          : (state.disposition === "proceed" ? "Customer approved the physical unit and authorized correction of the IMEI before that unit is posted." : "Customer instructed warehouse to ship back only the mismatched phone unit.");

      cards.push('<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title">DISPOSITION_DECISION ' + dispositionDecisionId + '</div><span class="status-chip ' + (state.disposition === "proceed" ? "chip-posted" : "chip-failed") + '">' + decisionCode + '</span></div><div class="db-card-body">' +
        field(badge("fk", "FK") + "disposition_request_id", dispositionRequestId) + field("decision_code", decisionCode) + field("decided_by_person_id", "CFP-07") + field("decided_by_party_id", "CUSTOMER-001") + field("recorded_by_user_id", "USER-31") + field("decided_at", "2026-08-20 09:35") + field("notes", notes) + "</div></div>");
    }

    if (state.scenario === "imei") {
      cards.push('<div class="db-card theme-item"><div class="db-card-head"><div class="db-card-title">IDENTIFIER_CORRECTION_REQUEST 60003</div><span class="status-chip ' + (state.disposition === "proceed" ? "chip-posted" : "chip-warning") + '">' + (state.disposition === "proceed" ? "APPROVED" : "NOT APPROVED") + '</span></div><div class="db-card-body">' +
        field(badge("fk", "FK") + "asset_id", "9003") + field("old_identifier", "IMEI-1303") + field("new_identifier", state.disposition === "proceed" ? ACTUAL_MISMATCH_IMEI : "PENDING") + field("reason_id", "IMEI_MISMATCH") + field("status", state.disposition === "proceed" ? "APPROVED" : "PENDING / CANCELLED") + field("authorized_by", "CUSTOMER-001") + "</div></div>");
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
      setText("dispositionText", "All product and parts checks passed, so there is no exception requiring customer disposition.");
      actions.style.display = "none";
      return;
    }

    panel.classList.remove("is-disabled");
    actions.style.display = "flex";

    var title = "Customer disposition is required";
    var text = "";
    var proceedLabel = "Proceed Receiving";
    var secondLabel = "Ship Back";

    if (state.scenario === "tampered") {
      title = state.disposition === "pending" ? "Product package awaiting disposition" : (state.disposition === "proceed" ? "Disposition: PROCEED" : "Disposition: SHIP BACK PACKAGE");
      text = state.disposition === "pending" ? "The product package failed visual inspection. The failure is reported first, then the Customer Focal Person sends a disposition request to the customer." : state.disposition === "proceed" ? "Customer authorized controlled receiving of the product package. The failure remains documented." : "Customer ordered the product package back. Package 2 remains independent.";
      proceedLabel = "Proceed Receiving";
      secondLabel = "Ship Back Package";
    } else if (state.scenario === "missing") {
      title = state.disposition === "pending" ? "Missing phone awaiting disposition" : (state.disposition === "proceed" ? "Disposition: PROCEED PARTIAL" : "Disposition: HOLD / INVESTIGATE");
      text = state.disposition === "pending" ? "The system reports only the missing phone. Customer disposition decides whether the nine received phones may be accepted while the shortage stays documented." : state.disposition === "proceed" ? "Customer approved partial receipt. The nine physical phones and independent parts package may post; the missing phone remains an outstanding shortage." : "Customer chose to hold the product exception for investigation/reconciliation. The missing phone is never treated as received.";
      proceedLabel = "Proceed Partial Receipt";
      secondLabel = "Hold / Investigate";
    } else {
      title = state.disposition === "pending" ? "IMEI mismatch awaiting disposition" : (state.disposition === "proceed" ? "Disposition: APPROVE IMEI CORRECTION" : "Disposition: SHIP BACK UNIT");
      text = state.disposition === "pending" ? "Only the mismatched phone is reported. Customer decides whether the physical unit may be corrected and enrolled or must be shipped back." : state.disposition === "proceed" ? "Customer approved the unit and authorized an IMEI correction. The correction is documented, then the unit can be enrolled and posted." : "Customer ordered only the mismatched phone back. The other nine matched phones and the parts package continue normally.";
      proceedLabel = "Approve IMEI Correction";
      secondLabel = "Ship Back Unit";
    }

    setText("dispositionTitle", title);
    setText("dispositionText", text);

    actions.querySelectorAll(".disposition-btn").forEach(function (btn) {
      var selected = btn.dataset.disposition === state.disposition;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", String(selected));
      btn.textContent = btn.dataset.disposition === "proceed" ? proceedLabel : secondLabel;
    });
  }

  /* ---------------- Posting / ledger / projections ---------------- */
  function renderPostingGate() {
    var s = scenarioState();
    var eligiblePhones = postedPhones().length;
    var eligibleParts = postedParts().reduce(function (sum, p) { return sum + p.goodQty; }, 0);
    var eligible = eligiblePhones > 0 || eligibleParts > 0;

    var title = "10 iPhone models + 500 screws + 30 batteries can be posted";
    var intro = "Both packages passed receiving. Serialized phones are posted individually; the two quantity-based part lines are posted by quantity.";
    if (state.scenario === "tampered" && state.disposition !== "proceed") {
      title = "Product package blocked — parts package can still be posted";
      intro = "Package 1 failed packaging inspection. Package 2 is separate and remains eligible for receiving and posting."
    } else if (state.scenario === "missing") {
      title = "Partial product receiving — 9 iPhone models + complete parts package";
      intro = "iPhone 17 is missing (Phone 10) and remains only in the exception report. The nine physical phones, 500 screws, and 30 batteries can still be posted.";
    } else if (state.scenario === "imei") {
      title = state.disposition === "proceed" ? "All 10 iPhone models posted after IMEI correction + complete parts package" : "9 iPhone models proceed; 1 mismatched phone awaits disposition";
      intro = state.disposition === "proceed" ? "Customer approved the mismatched unit, the IMEI correction was documented, and all 10 product units can now be posted. The 500 screws and 30 batteries post independently." : "Only Phone 3 is held because of its IMEI mismatch. The other nine phones, 500 screws, and 30 batteries proceed independently; Phone 3 remains pending until customer disposition.";
    } else if (state.scenario === "tampered" && state.disposition === "proceed") {
      title = "Both packages can be posted after product disposition";
      intro = "The product package failure remains documented, but controlled receiving confirms the 10 iPhone models. The parts package is received separately.";
    }

    setText("postingTitle", title);
    setText("postingIntro", intro);

    var host = document.getElementById("postingGate");
    if (host) {
      var rightStatus = eligible
        ? (eligiblePhones === 10 && eligibleParts === 530 ? "POSTED" : "PARTIAL POSTED")
        : (state.disposition === "shipback" ? "NO PRODUCT POSTING" : "BLOCKED");
      host.innerHTML =
        '<div class="posting-card"><span>Before gate</span><strong>RECEIPT 5001</strong><b>OPEN</b></div>' +
        '<div class="posting-arrow ' + (eligible ? "is-pass" : "is-blocked") + '"><span>' + (eligible ? "→" : "×") + '</span><small>' +
        (eligible ? eligiblePhones + " phones + " + eligibleParts + " part units accepted" : "no eligible ledger movement") +
        '</small></div>' +
        '<div class="posting-card ' + (eligible ? "is-pass" : "is-blocked") + '"><span>After decision</span><strong>' + rightStatus + '</strong><b>' +
        eligiblePhones + ' phone posting(s) + ' + eligibleParts + ' part unit(s)</b></div>';
    }

    var rule = document.getElementById("postingRule");
    if (rule) rule.innerHTML = '<span class="cb-icon">🔁</span><span><b>Posting rule:</b> only accepted physical quantities create inventory. A mismatch or missing phone remains documented in receiving, while valid product units and independent parts-package quantities can still post. The 1:1 INVENTORY_TRANSACTION → INVENTORY_ENTRY rule remains unchanged.</span>';
  }


  /* ---------------- Pending-ledger lifecycle ----------------
     ASN upload creates one INVENTORY_TRANSACTION per expected item.
     PENDING = traceable expectation; no INVENTORY_ENTRY / balance effect.
     POSTED = accepted receipt; creates INVENTORY_ENTRY / balance effect.
  */
  function phoneLedgerStatus(p) {
    if (state.scenario === "normal") return "POSTED";
    if (state.scenario === "tampered") {
      if (state.disposition === "proceed") return "POSTED";
      if (state.disposition === "shipback") return "CANCELLED";
      return "PENDING";
    }
    if (state.scenario === "missing") {
      return p.n === 10 ? (state.disposition === "proceed" ? "CLOSED" : "PENDING") : "POSTED";
    }
    if (state.scenario === "imei") {
      if (p.n !== 3) return "POSTED";
      if (state.disposition === "proceed") return "POSTED";
      if (state.disposition === "shipback") return "CANCELLED";
      return "PENDING";
    }
    return "PENDING";
  }

  function partLedgerStatus() {
    return "POSTED"; // Parts package is independent from product exceptions.
  }

  function ledgerStatusChip(status) {
    var cls = status === "POSTED" ? "chip-posted" : status === "PENDING" ? "chip-pending" : "chip-matched";
    return '<span class="status-chip ' + cls + '">' + status + '</span>';
  }

  function ledgerStatusMeaning(status) {
    if (status === "PENDING") return "Expected from ASN; no stock effect yet";
    if (status === "POSTED") return "Accepted receipt; inventory entry created";
    if (status === "CANCELLED") return "Resolved without inventory posting";
    if (status === "CLOSED") return "Shortage closed by disposition; no inventory posting";
    return status;
  }

  function renderLedgerCards() {
    var host = document.getElementById("ledgerCards");
    var preview = document.getElementById("asnPendingLedgerPreview");
    if (!host) return;

    var pendingCount = 0;
    var postedCount = 0;
    var cancelledCount = 0;
    var closedCount = 0;

    function countStatus(status){
      if(status === "PENDING") pendingCount++;
      else if(status === "POSTED") postedCount++;
      else if(status === "CANCELLED") cancelledCount++;
      else if(status === "CLOSED") closedCount++;
    }

    var phoneCards = PHONES.map(function (p) {
      var status = phoneLedgerStatus(p);
      countStatus(status);

      var entryHtml = status === "POSTED"
        ? '<div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> INVENTORY_ENTRY</div><span class="status-chip chip-posted">#' + p.entryId + '</span></div><div class="db-card-body">' +
          field(badge("pk", "PK") + "entry_id", p.entryId) +
          field(badge("fk", "FK/UQ") + "transaction_id", p.txnId) +
          field("asset_id / item_id", p.assetId + " / " + p.itemId) +
          field("physical IMEI", displayActualImei(p)) +
          field("to location / state / qty", LOCATION_LABEL + " / " + STATE_LABEL + " / 1 EA") +
          '</div></div>'
        : '<div class="db-card theme-ref"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> INVENTORY_ENTRY</div><span class="status-chip chip-pending">NOT CREATED</span></div><div class="db-card-body">' +
          field("reason", ledgerStatusMeaning(status)) +
          field("item_id", p.itemId) +
          '</div></div>';

      return '<div class="db-card-grid highlightable" data-phone="' + p.n + '" style="margin-bottom:18px">' +
        '<div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">Phone ' + p.n + '</span> INVENTORY_TRANSACTION</div>' + ledgerStatusChip(status) + '</div><div class="db-card-body">' +
        field(badge("pk", "PK") + "transaction_id", p.txnId) +
        field("transaction_no", p.txnNo) +
        field(badge("gen", "UQ") + "idempotency_key", "ASN-3137323-PRODUCT-" + p.n) +
        field(badge("source", "ASN") + "source_document", "ASN-2026-001 / " + p.asnRow) +
        field("transaction_type", "RECEIPT") +
        field("status_id", status) +
        field("expected_qty / uom", "1 / EA") +
        field("ledger meaning", ledgerStatusMeaning(status)) +
        '</div></div>' + entryHtml +
        '</div>';
    }).join("");

    var partCards = PARTS.map(function (part, idx) {
      var status = partLedgerStatus();
      countStatus(status);
      var txnId = 50100 + part.n;
      var entryId = 60100 + part.n;
      var txnNo = "TXN-000" + String(600 + part.n).padStart(3, "0");
      return '<div class="db-card-grid" style="margin-bottom:18px">' +
        '<div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">PART PACKAGE</span> ' + part.itemCode + ' · INVENTORY_TRANSACTION</div>' + ledgerStatusChip(status) + '</div><div class="db-card-body">' +
        field(badge("pk", "PK") + "transaction_id", txnId) +
        field("transaction_no", txnNo) +
        field(badge("gen", "UQ") + "idempotency_key", "ASN-3137323-PART-" + part.n) +
        field(badge("source", "ASN") + "source_document", "ASN-2026-001 / " + part.asnRow) +
        field("transaction_type", "RECEIPT") +
        field("status_id", status) +
        field("expected_qty / uom", part.expectedQty + " / " + part.uom) +
        field("ledger meaning", ledgerStatusMeaning(status)) +
        '</div></div>' +
        '<div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">PART PACKAGE</span> ' + part.itemCode + ' · INVENTORY_ENTRY</div><span class="status-chip chip-posted">#' + entryId + '</span></div><div class="db-card-body">' +
        field(badge("pk", "PK") + "entry_id", entryId) +
        field(badge("fk", "FK/UQ") + "transaction_id", txnId) +
        field("item_id / quantity / uom", part.itemId + " / " + part.goodQty + " / " + part.uom) +
        field("location / state", LOCATION_LABEL + " / " + STATE_LABEL) +
        '</div></div></div>';
    }).join("");

    /* The ASN upload view: show the transactions at creation time.
       These are always PENDING at the moment the file is uploaded. */
    if (preview) {
      var previewRows = PHONES.slice(0, 4).map(function(p){
        return '<div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">ASN UPLOAD</span> ' + p.itemCode + '</div><span class="status-chip chip-pending">PENDING</span></div><div class="db-card-body">' +
          field("transaction_no", p.txnNo) +
          field("item_id / qty / uom", p.itemId + " / 1 / EA") +
          field("source_document", "ASN-2026-001") +
          field("inventory effect", "NONE") +
          '</div></div>';
      }).join("") +
      '<div class="db-card theme-ledger"><div class="db-card-head"><div class="db-card-title"><span class="tbl-tag">ASN UPLOAD</span> PARTS EXPECTATION</div><span class="status-chip chip-pending">PENDING</span></div><div class="db-card-body">' +
        field("part transactions", String(PARTS.length)) +
        field("expected part units", String(partsTotal("expectedQty"))) +
        field("inventory effect", "NONE") +
      '</div></div>';
      preview.innerHTML = previewRows;
    }

    var total = PHONES.length + PARTS.length;
    setText("ledgerTitle", pendingCount
      ? "ASN ledger: " + total + " transaction(s) · " + pendingCount + " pending · " + postedCount + " posted"
      : "ASN ledger: " + total + " transaction(s) resolved");
    setText("ledgerIntro",
      "Every expected item entered the inventory transaction ledger when the ASN was uploaded. " +
      "PENDING is traceable but does not create an inventory entry or increase on-hand balance. " +
      "Receiving and disposition resolve each transaction individually.");

    var allCards = phoneCards + partCards;
    host.innerHTML = allCards;

    setText("sumPendingLedger", pendingCount, pendingCount ? "tone-warn" : "tone-pass");

    /* Add a compact ledger lifecycle banner under the cards when useful. */
    var note = document.getElementById("ledgerLifecycleNote");
    if (!note) {
      note = document.createElement("div");
      note.id = "ledgerLifecycleNote";
      note.className = "concept-banner ledger-lifecycle-note";
      host.parentNode.appendChild(note);
    }
    note.innerHTML =
      '<span class="cb-icon">↔</span><span><b>Ledger lifecycle:</b> ASN upload → <strong>PENDING</strong> → receiving/disposition → ' +
      '<strong>POSTED</strong> for accepted stock, or <strong>CLOSED/CANCELLED</strong> when the expected movement will not enter inventory. ' +
      '<b>PENDING never contributes to on-hand.</b></span>';
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

  function renderBalanceRows(){
    var tbody=document.getElementById("balanceRows");
    var mix=document.getElementById("inventoryMixSummary");
    if(!tbody) return;
    var phones=postedPhones();
    var parts=postedParts();
    setText("balanceExplanation", phones.length||parts.length ? "Only POSTED inventory transactions create entries and update the inventory projection. PENDING ASN transactions are visible for traceability but have no on-hand effect. Each distinct phone model remains separately identifiable by ITEM_MASTER / PRODUCT, while screws and batteries are aggregated by part SKU." : "No inventory balance was created.");
    if(!phones.length&&!parts.length){tbody.innerHTML='<tr><td colspan="6" class="empty-table-cell">No inventory balance rows from this receipt outcome.</td></tr>'; if(mix)mix.innerHTML=""; return;}

    var rows=phones.map(function(p){return '<tr class="highlightable" data-phone="'+p.n+'"><td>'+p.balanceId+'</td><td>'+p.itemCode+' · '+p.itemName+'</td><td>'+p.color+' · '+p.storage+'</td><td>'+STATE_LABEL+'</td><td>1</td><td><b>0</b> '+techSpan("(not available while quarantined)")+"</td></tr>";}).join("");
    rows+=parts.map(function(part,idx){return '<tr><td>'+(41001+idx)+'</td><td>'+part.itemCode+' · '+part.itemName+'</td><td>'+part.compatibleModels+'</td><td>'+STATE_LABEL+'</td><td>'+part.goodQty+'</td><td><b>0</b> '+techSpan("(not available while quarantined)")+"</td></tr>";}).join("");
    tbody.innerHTML=rows;

    if(mix){
      var byColor={}; var bySeries={};
      phones.forEach(function(p){byColor[p.color]=(byColor[p.color]||0)+1; bySeries[p.series]=(bySeries[p.series]||0)+1;});
      function chips(obj){return Object.keys(obj).sort().map(function(k){return '<div class="mix-chip"><b>'+obj[k]+'</b><span>'+k+'</span></div>';}).join("");}
      mix.innerHTML='<div class="mix-card"><div class="mix-head"><strong>PRODUCT INVENTORY MIX</strong><span>'+phones.length+' accepted product unit(s)</span></div><div class="mix-label">BY MODEL / SERIES</div><div class="mix-grid">'+chips(bySeries)+'</div></div>'+
        '<div class="mix-card"><div class="mix-head"><strong>BY COLOR</strong><span>counts come from posted PRODUCT units</span></div><div class="mix-grid">'+chips(byColor)+'</div></div>'+
        '<div class="mix-card"><div class="mix-head"><strong>PART INVENTORY</strong><span>quantity-based</span></div><div class="mix-grid"><div class="mix-chip"><b>'+parts.filter(function(p){return p.itemCode==="SCR-M3-10";}).reduce(function(s,p){return s+p.goodQty;},0)+'</b><span>Screws EA</span></div><div class="mix-chip"><b>'+parts.filter(function(p){return p.itemCode.indexOf("BAT-")===0;}).reduce(function(s,p){return s+p.goodQty;},0)+'</b><span>Batteries EA</span></div></div></div>';
    }
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

    add("Product_ASN_3137323.xlsx · PKG-PRODUCT-01", "expected");
    add("ASN_IMPORT_ROW " + p.asnRow + " · " + p.itemName + " · Expected " + p.imei, "expected", "import");
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
    } else if (state.scenario === "missing" && p.n === 10) {
      add("NO PHYSICAL PHONE FOUND", "fail", "actual = 0 / variance = -1");
      add("RECEIVING_EXCEPTION 54002 · SHORT_SHIPMENT", "fail", "only missing unit");
      add("FAILURE_REPORT 57002 · FR-2026-00022", "fail", "report only Phone 10");
      add("DISPOSITION_REQUEST 58002", "decision", "Customer Focal → Customer");
      if (state.disposition === "pending") add("CUSTOMER DECISION — PENDING", "wait", "wait for decision");
      if (state.disposition === "proceed") {
        add("DISPOSITION_DECISION — PROCEED_PARTIAL", "decision", "customer decision");
        add("9 MATCHED PHONES + PARTS → RECEIVING / POSTING", "received", "valid goods continue");
        add("PHONE 10 — OUTSTANDING SHORTAGE", "fail", "not received");
      } else if (state.disposition === "shipback") {
        add("DISPOSITION_DECISION — HOLD_INVESTIGATE", "stop", "customer decision");
        add("9 PHONES + PARTS — HELD", "wait", "investigation / reconciliation");
      }
    } else if (state.scenario === "imei" && p.n === 3) {
      add("Physical Scan " + ACTUAL_MISMATCH_IMEI, "fail", "scanner");
      add("IMEI vs ASN — FAIL (expected IMEI-1303)", "fail", "validation");
      add("RECEIVING_EXCEPTION 54003 · IMEI_MISMATCH", "fail", "expected ≠ actual");
      add("FAILURE_REPORT 57003 · FR-2026-00023", "fail", "only Phone 3 reported");
      add("DISPOSITION_REQUEST 58003", "decision", "Customer Focal → Customer");
      if (state.disposition === "pending") add("CUSTOMER DECISION — PENDING", "wait", "wait for decision");
      if (state.disposition === "proceed") {
        add("DISPOSITION_DECISION — APPROVE_IMEI_CORRECTION", "decision", "customer decision");
        add("IDENTIFIER_CORRECTION_REQUEST · IMEI-99", "decision", "authorized correction");
        add("9 MATCHED + 1 CORRECTED → RECEIVING / POSTING", "received", "all valid units continue");
      } else if (state.disposition === "shipback") {
        add("DISPOSITION_DECISION — SHIP_BACK_UNIT", "stop", "customer decision");
        add("9 MATCHED PHONES + PARTS → RECEIVING / POSTING", "received", "only mismatch excluded");
      }
    } else {
      if (phonePhysicallyPresent(p)) {
        add("Physical Scan " + displayActualImei(p) + " — TALLY", "received", "IMEI registration");
        if (hasReceiptAsset(p)) add("RECEIPT_ASSET " + p.receiptAssetId, "received", "matched / received");
      }
      if (state.scenario !== "missing" && state.scenario !== "imei") {
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
    if (state.scenario === "missing" && p.n === 10) return { result: "MISSING / NO INVENTORY", tone: "fail" };
    if (state.scenario === "missing") {
      if (posted) return { result: "MATCHED / PARTIAL POST", tone: "pass" };
      if (state.disposition === "shipback") return { result: "MATCHED / SHIP BACK", tone: "fail" };
      return { result: "MATCHED / HELD", tone: "wait" };
    }
    if (p.n === 3) {
      if (state.disposition === "proceed") return { result: "IMEI CORRECTED / POSTED", tone: "pass" };
      if (state.disposition === "shipback") return { result: "IMEI MISMATCH / SHIP BACK", tone: "fail" };
      return { result: "IMEI MISMATCH / AWAITING DISPOSITION", tone: "wait" };
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

    var phoneRows = PHONES.map(function (p) {
      var r = finalResult(p);
      var present = phonePhysicallyPresent(p);
      var ra = hasReceiptAsset(p) ? p.receiptAssetId : "—";
      var posted = isPhonePosted(p);
      var physical = present ? displayActualImei(p) : "NOT FOUND / NOT SCANNED";
      return '<tr class="highlightable row-' + r.tone + '" data-phone="' + p.n + '"><td>Phone ' + p.n + ' · ' + p.itemName + '</td><td>' + p.itemCode + '</td><td>' + p.color + '</td><td>' + p.imei + '</td><td>' + physical + '</td><td><span class="status-chip chip-' + (r.tone === "pass" ? "posted" : r.tone === "fail" ? "failed" : "warning") + '">' + r.result + '</span></td><td>' + ra + '</td><td>' + (posted ? p.txnNo : "—") + '</td><td>' + (posted ? p.entryId : "—") + '</td><td>' + (posted ? LOCATION_SHORT : "Receiving Exception") + '</td><td>' + (posted ? STATE_LABEL : "—") + "</td></tr>";
    }).join("");

    var partRows = postedParts().map(function (part) {
      var txnNo = 'TXN-' + String(600 + part.n).padStart(6, "0");
      return '<tr class="row-pass"><td>PART · ' + part.itemName + '</td><td>' + part.itemCode + '</td><td>' + part.compatibleModels + '</td><td>—</td><td>' + part.goodQty + ' ' + part.uom + '</td><td><span class="status-chip chip-posted">POSTED</span></td><td>—</td><td>' + txnNo + '</td><td>' + (60100 + part.n) + '</td><td>' + LOCATION_SHORT + '</td><td>' + STATE_LABEL + '</td></tr>';
    }).join("");

    tbody.innerHTML = phoneRows + partRows;
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
    if (state.scenario === "tampered") checklist.push(checklistItem(state.disposition === "pending" ? "…" : state.disposition === "proceed" ? "✓" : "×", "Customer disposition: " + (state.disposition === "pending" ? "PENDING" : state.disposition === "proceed" ? "PROCEED" : "SHIP BACK"), state.disposition === "proceed" ? "pass" : state.disposition === "shipback" ? "fail" : "warn"));
    checklist.push(checklistItem(s.posted || s.screwsPosted ? "✓" : "×", s.posted || s.partsPosted ? s.posted + " phones + " + s.screwsPosted + " screws + " + s.batteriesPosted + " batteries posted to ledger" : "No inventory ledger posting", s.posted || s.partsPosted ? "pass" : "warn"));
    checklist.push(checklistItem(s.posted ? "✓" : "—", s.posted ? "Current position = Receiving Cage / QUARANTINED" : "No new current inventory position", s.posted ? "pass" : "warn"));
    checklist.push(checklistItem("→", s.posted ? "Endorsement to Triage is the next handoff" : "Triage handoff not reached", s.posted ? "pass" : "warn"));

    host.innerHTML = '<h2>' + SCENARIO_INFO[state.scenario].label + ' — ' + s.finalStatus + '</h2><p class="final-summary-sub">The same ASN stays intact; the receiving outcome changes based on what the warehouse actually observes and the customer disposition.</p><div class="final-metrics"><div><div class="fm-value">10 + 500 + 10</div><div class="fm-label">Expected Product Units + Screws + Batteries</div></div><div><div class="fm-value">' + physical + '</div><div class="fm-label">Physical</div></div><div><div class="fm-value">' + s.posted + ' + ' + s.partsPosted + '</div><div class="fm-label">Posted Phones + Part Units</div></div><div><div class="fm-value ' + (s.missing ? "bad" : "zero") + '">' + s.missing + '</div><div class="fm-label">Missing</div></div><div><div class="fm-value ' + (s.mismatch ? "bad" : "zero") + '">' + s.mismatch + '</div><div class="fm-label">IMEI Mismatch</div></div></div><div class="final-state"><span>📍 ' + s.location + '</span><span>🔒 ' + s.inventoryState + '</span></div><div class="final-checklist">' + checklist.join("") + "</div>";
  }

  /* ---------------- Master render ---------------- */
  function renderAll() {
    renderMasterDataDashboard();
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
        state.selectedPhone = state.scenario === "missing" ? 10 : state.scenario === "imei" ? 3 : 1;
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
