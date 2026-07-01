/* STREAMING_CHUNK:Initializing global variables... */
const SS = SpreadsheetApp.getActiveSpreadsheet();

var sheetValuesCache = {};
function getSheetValuesCached(sheetName) {
  if (sheetValuesCache[sheetName]) {
    return sheetValuesCache[sheetName].map(function(row) { return row.slice(); });
  }
  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) {
    sheetValuesCache[sheetName] = null;
    return null;
  }
  var values = sheet.getDataRange().getValues();
  sheetValuesCache[sheetName] = values;
  return values.map(function(row) { return row.slice(); });
}
function normalizePosition(pos) {
  if (!pos) return 'Business Solution';
  const clean = String(pos).toLowerCase().replace(/\s+/g, '');
  if (clean === 'businessanalyst' || clean === 'analyst') return 'Business Analyst';
  if (clean === 'salesmanager' || clean === 'sm') return 'Sales Manager';
  if (clean === 'areasalesmanager' || clean === 'asm') return 'Area Sales Manager';
  if (clean === 'salesagronomist' || clean === 'sa') return 'Sales Agronomist';
  if (clean === 'businesssolution' || clean === 'bs') return 'Business Solution';
  return String(pos).trim();
}
function formatMyDate(dateObj) {
  if (!dateObj || dateObj === '' || isNaN(new Date(dateObj).getTime())) return 'N/A';
  return Utilities.formatDate(new Date(dateObj), Session.getScriptTimeZone(), "dd/MMM/yy").toUpperCase();
}
function parseGasDate(val) {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  const str = String(val).trim();
  
  // Try default JS date parsing first
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  
  // Handle dd/MM/yyyy or dd/MMM/yyyy custom splits
  if (str.includes('/')) {
     const parts = str.split(/[\s/:]+/);
     if (parts.length >= 3) {
        const dPart = parseInt(parts[0], 10);
        let mPart = parts[1];
        const yPart = parseInt(parts[2], 10);
        
        let m = parseInt(mPart, 10) - 1;
        if (isNaN(m)) {
           // It might be a textual month like "Jan", "Feb", etc.
           const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
           const indMonths = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
           const lowerM = mPart.toLowerCase();
           m = months.findIndex(name => lowerM.startsWith(name));
           if (m === -1) {
              m = indMonths.findIndex(name => lowerM.startsWith(name));
           }
           if (m === -1) m = 0; // fallback to Jan
        }
        
        const hr = parts[3] ? parseInt(parts[3], 10) : 0;
        const min = parts[4] ? parseInt(parts[4], 10) : 0;
        const sec = parts[5] ? parseInt(parts[5], 10) : 0;
        return new Date(yPart, m, dPart, hr, min, sec);
     }
  }
  
  // Try matching Indonesian style d-M-y like 11-Jun-26
  if (str.includes('-')) {
     const parts = str.split(/[\s\-:]+/);
     if (parts.length >= 3) {
        const dPart = parseInt(parts[0], 10);
        let mPart = parts[1];
        let yPart = parseInt(parts[2], 10);
        if (yPart < 100) yPart += 2000; // 26 -> 2026
        
        let m = parseInt(mPart, 10) - 1;
        if (isNaN(m)) {
           const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
           const indMonths = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
           const lowerM = mPart.toLowerCase();
           m = months.findIndex(name => lowerM.startsWith(name));
           if (m === -1) {
              m = indMonths.findIndex(name => lowerM.startsWith(name));
           }
           if (m === -1) m = 0;
        }
        
        const hr = parts[3] ? parseInt(parts[3], 10) : 0;
        const min = parts[4] ? parseInt(parts[4], 10) : 0;
        const sec = parts[5] ? parseInt(parts[5], 10) : 0;
        return new Date(yPart, m, dPart, hr, min, sec);
     }
  }
  
  return new Date(0);
}

function getMonthIndices(headers) {
  const synonyms = [
    ["jan", "januari", "january"],
    ["feb", "februari", "february"],
    ["mar", "maret", "march"],
    ["apr", "april"],
    ["mei", "may"],
    ["jun", "juni", "june"],
    ["jul", "juli", "july"],
    ["ags", "agu", "agst", "agustus", "aug", "august"],
    ["sep", "sept", "september"],
    ["okt", "oct", "oktober", "october"],
    ["nov", "november"],
    ["des", "dec", "desember", "december"]
  ];
  const matchedIndices = Array(12).fill(-1);
  for (let m = 0; m < 12; m++) {
    const list = synonyms[m];
    const idx = headers.findIndex(h => {
      const hStr = String(h || '').trim().toLowerCase();
      return list.some(syn => hStr === syn);
    });
    matchedIndices[m] = idx;
  }
  return matchedIndices;
}

function getUpdMonthIndices(headers) {
  const synonyms = [
    ["jan", "januari", "january"],
    ["feb", "februari", "february"],
    ["mar", "maret", "march"],
    ["apr", "april"],
    ["mei", "may"],
    ["jun", "juni", "june"],
    ["jul", "juli", "july"],
    ["ags", "agu", "agst", "agustus", "aug", "august"],
    ["sep", "sept", "september"],
    ["okt", "oct", "oktober", "october"],
    ["nov", "november"],
    ["des", "dec", "desember", "december"]
  ];
  const matchedIndices = Array(12).fill(-1);
  if (!headers || !Array.isArray(headers)) return matchedIndices;
  for (let m = 0; m < 12; m++) {
    const list = synonyms[m];
    const idx = headers.findIndex(h => {
      if (h === undefined || h === null) return false;
      let hStr = String(h).trim().toLowerCase().replace(/[\s_\-\/]/g, '');
      if (!hStr.startsWith('upd')) return false;
      const remains = hStr.substring(3);
      return list.some(syn => remains === syn);
    });
    matchedIndices[m] = idx;
  }
  return matchedIndices;
}

function getMonthIndexFromDateString(dateStr) {
  if (!dateStr) return new Date().getMonth();
  if (dateStr instanceof Date) return dateStr.getMonth();
  
  const str = String(dateStr).trim();
  
  if (str.includes('/')) {
    const parts = str.split(/[\s/:]+/);
    if (parts.length >= 2) {
      let mVal = parseInt(parts[1], 10);
      if (!isNaN(mVal) && mVal >= 1 && mVal <= 12) {
        return mVal - 1;
      }
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const indMonths = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "ags", "sep", "okt", "nov", "des"];
      const lowerM = parts[1].toLowerCase();
      let m = months.findIndex(name => lowerM.startsWith(name));
      if (m === -1) {
        m = indMonths.findIndex(name => lowerM.startsWith(name));
      }
      if (m !== -1) return m;
    }
  }
  
  if (str.includes('-')) {
    const parts = str.split(/[\s\-:]+/);
    if (parts.length >= 2) {
      let mVal = parseInt(parts[1], 10);
      if (!isNaN(mVal) && mVal >= 1 && mVal <= 12) {
        return mVal - 1;
      }
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const indMonths = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "ags", "sep", "okt", "nov", "des"];
      const lowerM = parts[1].toLowerCase();
      let m = months.findIndex(name => lowerM.startsWith(name));
      if (m === -1) {
        m = indMonths.findIndex(name => lowerM.startsWith(name));
      }
      if (m !== -1) return m;
    }
  }
  
  const d = new Date(str);
  return !isNaN(d.getTime()) ? d.getMonth() : new Date().getMonth();
}

function cleanForMatch(val) {
  return String(val || '').replace(/[\s_\-\/]/g, '').toLowerCase();
}
/* STREAMING_CHUNK:Setting up doGet endpoint... */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const user = e.parameter.user;
    
    if (action === 'getWorkingData') return handleGetWorkingData(user);
    if (action === 'getDrSalesData') return handleGetDrSalesData(user);
    if (action === 'getChannels') return handleGetChannels(user);
    if (action === 'getLotInfo') return handleGetLotInfo(e.parameter.lot);
    if (action === 'getUserProfile') return handleGetUserProfile(user);
    if (action === 'getEmployees') return handleGetEmployees();
    if (action === 'getInitialData') return handleGetInitialData(user);
    
    return ContentService.createTextOutput("Endpoint RADAR ADVANTA App Aktif").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
/* STREAMING_CHUNK:Setting up doPost endpoint... */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    if (action === 'batchActivity') return handleBatchActivity(body);
    if (action === 'consolidateDatabase') return handleConsolidateDatabase(body);
    if (action === 'addPartner') return handleAddPartner(body);
    if (action === 'updatePartner') return handleUpdatePartner(body);
    if (action === 'deletePartner') return handleDeletePartner(body);
    if (action === 'updateEmployee') return handleUpdateEmployee(body);
    if (action === 'deleteEmployee') return handleDeleteEmployee(body);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
/* STREAMING_CHUNK:Handling batch activity... */
function handleBatchActivity(body) {
  const sheet = SS.getSheetByName('working');
  if (!sheet) throw new Error("Sheet 'working' tidak ditemukan");
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const getIdx = (patterns) => headers.findIndex(h => patterns.test(String(h).trim()));
  
  let idxPog = headers.findIndex(h => /^pog$|^selisih$/i.test(String(h).trim()));
  if (idxPog === -1) {
    const nextCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, nextCol).setValue("POG");
    headers.push("POG");
    idxPog = headers.length - 1;
  }
      
  const idx = {
    time: getIdx(/^tgl$|^waktu$|^date$|^timestamp$/i),
    kiosk: getIdx(/^channel$|^kiosk$/i),
    user: getIdx(/^name checker$|^nama checker$|^user$|^pic$|^checker$/i),
    lot: getIdx(/^lot package$|^lot$/i),
    qty: getIdx(/^quantity \(kg\)|^qty$|^stock$|^kg$/i),
    area: getIdx(/^area$|^region$/i),
    desc: getIdx(/^hybrid$|^material$/i),
    exp: getIdx(/^exp date$|^expired$/i),
    agingMonth: getIdx(/^aging \(month\)|^aging/i),
    cond: getIdx(/^condition$|^kondisi$/i),
    crops: getIdx(/^crops$/i),
    dr: getIdx(/^shipping date$|^dr date$/i),
    agingExp: getIdx(/^aging to exp$/i),
    cluster: getIdx(/^cluster$/i),
    pog: idxPog
  };
/* STREAMING_CHUNK:Processing existing data... */
  const monthIndices = getMonthIndices(headers);
  const updMonthIndices = getUpdMonthIndices(headers);
  const updatedData = sheet.getDataRange().getValues();
  
  const currentMonthRowsMap = {}; 
  for (let i = 1; i < updatedData.length; i++) {
      const k = idx.kiosk !== -1 ? cleanForMatch(updatedData[i][idx.kiosk]) : '';
      const l = idx.lot !== -1 ? cleanForMatch(updatedData[i][idx.lot]) : '';
      const h = idx.desc !== -1 ? cleanForMatch(updatedData[i][idx.desc]) : '';
      const u = idx.user !== -1 ? cleanForMatch(updatedData[i][idx.user]) : '';
      const key = `${k}_${l}_${h}_${u}`;
      if (k && l) {
          const rowDate = idx.time !== -1 && updatedData[i][idx.time] ? parseGasDate(updatedData[i][idx.time]) : new Date(0);
          if (!currentMonthRowsMap[key] || rowDate.getTime() > currentMonthRowsMap[key].date.getTime()) {
              currentMonthRowsMap[key] = { index: i + 1, date: rowDate };
          }
      }
  }
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
/* STREAMING_CHUNK:Updating or inserting items... */
  if (body.items && body.items.length > 0) {
      body.items.forEach(item => {
          const k = cleanForMatch(item.kiosk);
          const l = cleanForMatch(item.lot);
          const h = cleanForMatch(item.hybrid);
          const u = cleanForMatch(item.user || body.user);
          const key = `${k}_${l}_${h}_${u}`;
          const existingMatch = currentMonthRowsMap[key];
          const existingRow = existingMatch ? existingMatch.index : null;
          let agingExpVal = "";
          if (item.expired && item.expired !== 'N/A') {
              const expD = new Date(item.expired);
              if (!isNaN(expD.getTime())) {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  agingExpVal = Math.round(((expD.getTime() - today.getTime()) / (1000 * 3600 * 24)) / 30.416);
              }
          }
          let clusterVal = "";
          if (item.aging && item.aging !== "-" && !isNaN(Number(item.aging))) {
              const aVal = Number(item.aging);
              if (aVal <= 2) clusterVal = "0-2";
              else if (aVal <= 4) clusterVal = "2-4";
              else if (aVal <= 6) clusterVal = "4-6";
              else if (aVal <= 9) clusterVal = "6-9";
              else if (aVal <= 12) clusterVal = "9-12";
              else clusterVal = ">12";
          }
          const itemMonthIdx = getMonthIndexFromDateString(item.timestamp || timestamp);
          const monthColIdx = monthIndices[itemMonthIdx];

          let prevMonthStock = 0;
          if (existingRow) {
              const prevMonthIdx = (itemMonthIdx - 1 + 12) % 12;
              const prevMonthColIdx = monthIndices[prevMonthIdx];
              if (prevMonthColIdx !== -1) {
                  prevMonthStock = Number(sheet.getRange(existingRow, prevMonthColIdx + 1).getValue()) || 0;
              } else {
                  prevMonthStock = Number(item.originalStock) || 0;
              }
          } else {
              prevMonthStock = Number(item.originalStock) || 0;
          }

          if (item.condition === 'habis' || Number(item.stock) === 0) {
              item.stock = 0;
          }
          let pogVal = prevMonthStock - (Number(item.stock) || 0);

          if (existingRow) {
              if (monthColIdx !== -1) {
                  sheet.getRange(existingRow, monthColIdx + 1).setValue(item.stock);
              }
              const updMonthColIdx = updMonthIndices[itemMonthIdx];
              if (updMonthColIdx !== -1) {
                  sheet.getRange(existingRow, updMonthColIdx + 1).setValue('sales');
              }
              
              if (idx.qty !== -1) sheet.getRange(existingRow, idx.qty + 1).setValue(item.stock);
              if (idx.cond !== -1) sheet.getRange(existingRow, idx.cond + 1).setValue(item.condition);
              if (idx.time !== -1) sheet.getRange(existingRow, idx.time + 1).setValue(timestamp);
              if (idx.user !== -1) sheet.getRange(existingRow, idx.user + 1).setValue(item.user || body.user);
              const resolvedArea = getUserProvince(item.user || body.user) || body.area || '';
              if (idx.area !== -1 && resolvedArea) sheet.getRange(existingRow, idx.area + 1).setValue(resolvedArea);
              if (idx.agingExp !== -1 && agingExpVal !== "") sheet.getRange(existingRow, idx.agingExp + 1).setValue(agingExpVal);
              if (idx.cluster !== -1 && clusterVal !== "") sheet.getRange(existingRow, idx.cluster + 1).setValue(clusterVal);
              if (idx.pog !== -1) sheet.getRange(existingRow, idx.pog + 1).setValue(pogVal);
          } else {
              let newRow = new Array(headers.length).fill('');
              if (idx.time !== -1) newRow[idx.time] = timestamp;
              if (idx.kiosk !== -1) newRow[idx.kiosk] = item.kiosk;
              if (idx.user !== -1) newRow[idx.user] = item.user || body.user;
              if (idx.lot !== -1) newRow[idx.lot] = String(item.lot).toUpperCase();
              
              if (monthColIdx !== -1) {
                  newRow[monthColIdx] = item.stock;
              }
              const updMonthColIdx = updMonthIndices[itemMonthIdx];
              if (updMonthColIdx !== -1) {
                  newRow[updMonthColIdx] = 'sales';
              }
              
              if (idx.qty !== -1) newRow[idx.qty] = item.stock;
              const resolvedArea = getUserProvince(item.user || body.user) || body.area || '';
              if (idx.area !== -1) newRow[idx.area] = resolvedArea;
              if (idx.desc !== -1) newRow[idx.desc] = item.hybrid;
              if (idx.crops !== -1) newRow[idx.crops] = item.crops || '';
              if (idx.dr !== -1) newRow[idx.dr] = item.drDate || '';
              if (idx.exp !== -1) newRow[idx.exp] = item.expired;
              if (idx.agingMonth !== -1) newRow[idx.agingMonth] = item.aging;
              if (idx.cond !== -1) newRow[idx.cond] = item.condition;
              if (idx.agingExp !== -1) newRow[idx.agingExp] = agingExpVal;
              if (idx.cluster !== -1) newRow[idx.cluster] = clusterVal;
              if (idx.pog !== -1) newRow[idx.pog] = pogVal;
              
              // Seed month columns that are empty
              for (let m = 0; m < 12; m++) {
                  const colIdx = monthIndices[m];
                  if (colIdx !== -1 && colIdx !== monthColIdx) {
                      newRow[colIdx] = 0;
                  }
              }
              sheet.appendRow(newRow);
          }
      });
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function handleConsolidateDatabase(body) {
  const sheet = SS.getSheetByName('working');
  if (!sheet) throw new Error("Sheet 'working' tidak ditemukan");
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Tidak ada data untuk dikonsolidasi' })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = values[0];
  const getIdx = (patterns) => headers.findIndex(h => patterns.test(String(h).trim()));
  
  let idxPog = headers.findIndex(h => /^pog$|^selisih$/i.test(String(h).trim()));
  if (idxPog === -1) {
    const nextCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, nextCol).setValue("POG");
    headers.push("POG");
    idxPog = headers.length - 1;
  }
  
  const idx = {
    time: getIdx(/^tgl$|^waktu$|^date$|^timestamp$/i),
    kiosk: getIdx(/^channel$|^kiosk$/i),
    user: getIdx(/^name checker$|^nama checker$|^user$|^pic$|^checker$/i),
    lot: getIdx(/^lot package$|^lot$/i),
    qty: getIdx(/^quantity \(kg\)|^qty$|^stock$|^kg$/i),
    area: getIdx(/^area$|^region$/i),
    desc: getIdx(/^hybrid$|^material$/i),
    exp: getIdx(/^exp date$|^expired$/i),
    agingMonth: getIdx(/^aging \(month\)|^aging/i),
    cond: getIdx(/^condition$|^kondisi$/i),
    crops: getIdx(/^crops$/i),
    dr: getIdx(/^shipping date$|^dr date$/i),
    agingExp: getIdx(/^aging to exp$/i),
    cluster: getIdx(/^cluster$/i),
    pog: idxPog
  };
  
  const monthIndices = getMonthIndices(headers);
  const updMonthIndices = getUpdMonthIndices(headers);
  const indonesianMonthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  // Helper function to check if a value is valid/non-empty
  const isValidVal = function(v) {
    return v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim().toUpperCase() !== 'N/A' && String(v).trim() !== '-';
  };

  // Build a lookup map of lot info from the 'dr' sheet
  const lotLookup = {};
  const drSheet = SS.getSheetByName('dr');
  if (drSheet) {
    const drData = drSheet.getDataRange().getValues();
    if (drData.length > 1) {
      const drHeaders = drData[0];
      const drIdx = {
        lot: drHeaders.findIndex(h => /lot/i.test(String(h).trim())),
        dr: drHeaders.findIndex(h => /dr date|shipping date/i.test(String(h).trim())),
        exp: drHeaders.findIndex(h => /exp date|expired/i.test(String(h).trim()))
      };
      if (drIdx.lot !== -1) {
        for (let j = 1; j < drData.length; j++) {
          const drRow = drData[j];
          const lNo = String(drRow[drIdx.lot]).trim().toUpperCase();
          if (lNo && !lotLookup[lNo]) {
            lotLookup[lNo] = {
              drDate: drIdx.dr !== -1 && drRow[drIdx.dr] ? formatMyDate(drRow[drIdx.dr]) : '',
              expDate: drIdx.exp !== -1 && drRow[drIdx.exp] ? formatMyDate(drRow[drIdx.exp]) : ''
            };
          }
        }
      }
    }
  }
  
  // Group rows
  const grouped = {};
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && idx.kiosk !== -1 && !row[idx.kiosk]) continue; // skip completely empty rows
    
    const kioskVal = idx.kiosk !== -1 ? String(row[idx.kiosk]).trim() : '';
    const lotVal = idx.lot !== -1 ? String(row[idx.lot]).trim() : '';
    const descVal = idx.desc !== -1 ? String(row[idx.desc]).trim() : '';
    const userVal = idx.user !== -1 ? String(row[idx.user]).trim() : '';
    
    // Grouping key: make it robust by ignoring spacing/case
    const groupKey = `${cleanForMatch(kioskVal)}_${cleanForMatch(lotVal)}_${cleanForMatch(descVal)}_${cleanForMatch(userVal)}`;
    
    const timestampStr = idx.time !== -1 ? row[idx.time] : '';
    const rowDate = timestampStr ? parseGasDate(timestampStr) : new Date(0);
    const rowMonthIdx = getMonthIndexFromDateString(timestampStr);
    
    // Parse quantities in existing month columns
    const monthValsSrc = Array(12).fill(0);
    monthIndices.forEach((colIdx, mIdx) => {
      if (colIdx !== -1 && row[colIdx] !== '') {
        monthValsSrc[mIdx] = Number(row[colIdx]) || 0;
      }
    });

    // Parse update values in existing upd columns
    const updValsSrc = Array(12).fill('');
    updMonthIndices.forEach((colIdx, mIdx) => {
      if (colIdx !== -1 && colIdx < row.length && row[colIdx] !== undefined && row[colIdx] !== null && row[colIdx] !== '') {
        updValsSrc[mIdx] = String(row[colIdx]).trim();
      }
    });

    // If month columns are empty but Qty column has a value, attribute it to its timestamp month
    const totalMonthVals = monthValsSrc.reduce((a, b) => a + b, 0);
    const qtyVal = idx.qty !== -1 ? Number(row[idx.qty]) || 0 : 0;
    if (totalMonthVals === 0 && qtyVal > 0) {
      monthValsSrc[rowMonthIdx] = qtyVal;
    }

    // Resolve dates with lotLookup fallback
    const lotUpper = String(lotVal).trim().toUpperCase();
    let currentExp = idx.exp !== -1 ? row[idx.exp] : '';
    let currentDr = idx.dr !== -1 ? row[idx.dr] : '';

    if (!isValidVal(currentExp) && lotLookup[lotUpper]) {
      currentExp = lotLookup[lotUpper].expDate;
    }
    if (!isValidVal(currentDr) && lotLookup[lotUpper]) {
      currentDr = lotLookup[lotUpper].drDate;
    }
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        kiosk: kioskVal,
        lot: lotVal,
        desc: descVal,
        user: userVal,
        timestamp: rowDate,
        originalTimestampStr: timestampStr,
        area: getUserProvince(userVal) || (idx.area !== -1 ? row[idx.area] : ''),
        crops: idx.crops !== -1 ? row[idx.crops] : '',
        exp: currentExp,
        dr: currentDr,
        agingMonth: idx.agingMonth !== -1 ? row[idx.agingMonth] : '',
        cond: idx.cond !== -1 ? row[idx.cond] : 'tetap',
        agingExp: idx.agingExp !== -1 ? row[idx.agingExp] : '',
        cluster: idx.cluster !== -1 ? row[idx.cluster] : '',
        pog: idx.pog !== -1 ? (Number(row[idx.pog]) || 0) : 0,
        monthlyQty: monthValsSrc,
        updMonthVals: updValsSrc,
        rawIndex: i
      };
    } else {
      const g = grouped[groupKey];
      // Update month values (sum them up!)
      for (let m = 0; m < 12; m++) {
        g.monthlyQty[m] += monthValsSrc[m];
      }
      // Merge updMonthVals
      if (!g.updMonthVals) g.updMonthVals = Array(12).fill('');
      for (let m = 0; m < 12; m++) {
        const v1 = String(g.updMonthVals[m] || '').trim().toLowerCase();
        const v2 = String(updValsSrc[m] || '').trim().toLowerCase();
        if (v1 === 'sales' || v2 === 'sales') {
          g.updMonthVals[m] = 'sales';
        } else if (v1 === 'admin' || v2 === 'admin') {
          g.updMonthVals[m] = 'admin';
        } else {
          g.updMonthVals[m] = '';
        }
      }
      
      // Update details to the latest row based on timestamp, BUT keep non-blank values
      const isNewer = rowDate.getTime() > g.timestamp.getTime();
      
      if (isNewer) {
        g.timestamp = rowDate;
        g.originalTimestampStr = timestampStr;
      }
      
      const updateField = function(gKey, rowVal) {
        if (isNewer) {
          if (isValidVal(rowVal)) {
            g[gKey] = rowVal;
          }
        } else {
          if (isValidVal(rowVal) && !isValidVal(g[gKey])) {
            g[gKey] = rowVal;
          }
        }
      };
      
      if (idx.area !== -1) updateField('area', getUserProvince(userVal) || row[idx.area]);
      if (idx.crops !== -1) updateField('crops', row[idx.crops]);
      if (idx.exp !== -1) updateField('exp', currentExp);
      if (idx.dr !== -1) updateField('dr', currentDr);
      if (idx.agingMonth !== -1) updateField('agingMonth', row[idx.agingMonth]);
      if (idx.agingExp !== -1) updateField('agingExp', row[idx.agingExp]);
      if (idx.cluster !== -1) updateField('cluster', row[idx.cluster]);
      
      if (idx.cond !== -1) {
        const rowVal = row[idx.cond];
        if (isNewer && isValidVal(rowVal) && rowVal !== 'tetap') {
          g.cond = rowVal;
        } else if (!isNewer && isValidVal(rowVal) && rowVal !== 'tetap' && (!g.cond || g.cond === 'tetap')) {
          g.cond = rowVal;
        }
      }
      
      if (idx.pog !== -1) {
        g.pog += (Number(row[idx.pog]) || 0);
      }
    }
  }
  
  const todayDate = new Date(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd") + "T00:00:00");

  // Construct new rows to be written back to the sheet
  const newSheetValues = [headers];
  
  Object.values(grouped).forEach(g => {
    // Copy previous month's value to current month if current month is empty/0 and set companion column to 'admin'
    const curMonthIdx = todayDate.getMonth();
    const prevMonthIdx = (curMonthIdx - 1 + 12) % 12;
    if (!g.monthlyQty) g.monthlyQty = Array(12).fill(0);
    if (!g.updMonthVals) g.updMonthVals = Array(12).fill('');
    if (!g.monthlyQty[curMonthIdx] || g.monthlyQty[curMonthIdx] === 0) {
      g.monthlyQty[curMonthIdx] = g.monthlyQty[prevMonthIdx] || 0;
      g.updMonthVals[curMonthIdx] = 'admin';
    }

    // Recalculate POG dynamically (previous month stock minus current month stock)
    const curStock = Number(g.monthlyQty[curMonthIdx]) || 0;
    const prevStock = Number(g.monthlyQty[prevMonthIdx]) || 0;
    g.pog = prevStock - curStock;

    // Standardize and clean dr/exp values if valid
    if (isValidVal(g.dr) && g.dr !== 'N/A') {
      g.dr = formatMyDate(parseGasDate(g.dr));
    }
    if (isValidVal(g.exp) && g.exp !== 'N/A') {
      g.exp = formatMyDate(parseGasDate(g.exp));
    }

    // Recalculate Aging (Month) dynamically if we have a valid dr/shipping date
    if (isValidVal(g.dr) && g.dr !== 'N/A') {
      const drD = parseGasDate(g.dr);
      if (drD && !isNaN(drD.getTime()) && drD.getTime() !== 0) {
        let calcAge = Math.round(((todayDate.getTime() - drD.getTime()) / (1000 * 3600 * 24)) / 30.416);
        g.agingMonth = calcAge >= 0 ? calcAge : 0;
      }
    }

    // Recalculate Aging to Exp dynamically if we have a valid exp/expired date
    if (isValidVal(g.exp) && g.exp !== 'N/A') {
      const expD = parseGasDate(g.exp);
      if (expD && !isNaN(expD.getTime()) && expD.getTime() !== 0) {
        g.agingExp = Math.round(((expD.getTime() - todayDate.getTime()) / (1000 * 3600 * 24)) / 30.416);
      }
    }

    // Recalculate Cluster dynamically based on the updated agingMonth
    if (g.agingMonth !== "" && g.agingMonth !== undefined && g.agingMonth !== null && !isNaN(Number(g.agingMonth))) {
      const aVal = Number(g.agingMonth);
      if (aVal <= 2) g.cluster = "0-2";
      else if (aVal <= 4) g.cluster = "2-4";
      else if (aVal <= 6) g.cluster = "4-6";
      else if (aVal <= 9) g.cluster = "6-9";
      else if (aVal <= 12) g.cluster = "9-12";
      else g.cluster = ">12";
    }

    // Sum monthly qtys to fill Qty
    const totalQty = g.monthlyQty.reduce((a, b) => a + b, 0);

    // Recalculate condition dynamically based on current and previous month quantities
    const currentMonthQty = g.monthlyQty[curMonthIdx];
    const prevMonthQty = g.monthlyQty[prevMonthIdx];

    if (totalQty === 0) {
      g.cond = 'habis';
    } else {
      if (g.cond === 'habis') {
        g.cond = 'tetap';
      }
      if (g.cond !== 'new' && g.cond !== 'baru' && g.cond !== 'baru (new)') {
        if (currentMonthQty < prevMonthQty) {
          g.cond = 'berkurang';
        } else if (currentMonthQty > prevMonthQty) {
          g.cond = 'bertambah';
        } else {
          g.cond = 'tetap';
        }
      }
    }

    // Finalize update source column values based on condition rules
    if (!g.updMonthVals) g.updMonthVals = Array(12).fill('');
    for (let m = 0; m < 12; m++) {
      if (g.monthlyQty[m] > 0) {
        const uVal = String(g.updMonthVals[m] || '').trim().toLowerCase();
        if (uVal === 'sales') {
          g.updMonthVals[m] = 'sales';
        } else {
          // If empty, or 'admin', default to 'admin'
          g.updMonthVals[m] = 'admin';
        }
      } else {
        g.updMonthVals[m] = '';
      }
    }

    let newRow = new Array(headers.length).fill('');
    if (idx.time !== -1) newRow[idx.time] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    if (idx.kiosk !== -1) newRow[idx.kiosk] = g.kiosk;
    if (idx.user !== -1) newRow[idx.user] = g.user;
    if (idx.lot !== -1) newRow[idx.lot] = String(g.lot).toUpperCase();
    
    if (idx.qty !== -1) newRow[idx.qty] = g.monthlyQty[curMonthIdx];
    
    if (idx.area !== -1) newRow[idx.area] = g.area;
    if (idx.desc !== -1) newRow[idx.desc] = g.desc;
    if (idx.crops !== -1) newRow[idx.crops] = g.crops;
    if (idx.dr !== -1) newRow[idx.dr] = g.dr;
    if (idx.exp !== -1) newRow[idx.exp] = g.exp;
    if (idx.agingMonth !== -1) newRow[idx.agingMonth] = g.agingMonth;
    if (idx.cond !== -1) newRow[idx.cond] = g.cond;
    if (idx.agingExp !== -1) newRow[idx.agingExp] = g.agingExp;
    if (idx.cluster !== -1) newRow[idx.cluster] = g.cluster;
    if (idx.pog !== -1) newRow[idx.pog] = g.pog;
    
    // Set individual month columns
    monthIndices.forEach((colIdx, mIdx) => {
      if (colIdx !== -1) {
        newRow[colIdx] = g.monthlyQty[mIdx] > 0 ? g.monthlyQty[mIdx] : '';
      }
    });

    // Set individual month upd columns
    updMonthIndices.forEach((colIdx, mIdx) => {
      if (colIdx !== -1) {
        if (!g.updMonthVals) g.updMonthVals = Array(12).fill('');
        newRow[colIdx] = g.updMonthVals[mIdx] || '';
      }
    });
    
    newSheetValues.push(newRow);
  });
  
  // Overwrite the sheet
  sheet.clearContents();
  sheet.getRange(1, 1, newSheetValues.length, headers.length).setValues(newSheetValues);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Konsolidasi berhasil dilakukan' })).setMimeType(ContentService.MimeType.JSON);
}

/* STREAMING_CHUNK:Handling partner updates and deletions... */
function getUserGroup(userName) {
  if (!userName) return '';
  const empSheet = SS.getSheetByName('employee');
  if (!empSheet) return '';
  const data = empSheet.getDataRange().getValues();
  if (data.length <= 1) return '';
  const headers = data[0];
  const idx = {
    name: headers.findIndex(h => /nama|name|pic/i.test(String(h).trim())),
    group: headers.findIndex(h => /group|tim|divisi|division/i.test(String(h).trim()))
  };
  if (idx.name === -1 || idx.group === -1) return '';
  const cleanUser = cleanForMatch(userName);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const empName = String(row[idx.name] || '').trim();
    if (cleanForMatch(empName) === cleanUser) {
      return String(row[idx.group] || '').trim();
    }
  }
  return '';
}

function getUserProvince(userName) {
  if (!userName) return '';
  const empSheet = SS.getSheetByName('employee');
  if (!empSheet) return '';
  const data = empSheet.getDataRange().getValues();
  if (data.length <= 1) return '';
  const headers = data[0];
  const idx = {
    name: headers.findIndex(h => /nama|name|pic/i.test(String(h).trim())),
    email: headers.findIndex(h => /email|user/i.test(String(h).trim())),
    prov: headers.findIndex(h => /province|provinsi/i.test(String(h).trim())),
    area: headers.findIndex(h => /area/i.test(String(h).trim()))
  };
  if (idx.name === -1) return '';
  const cleanUser = cleanForMatch(userName);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const empName = String(row[idx.name] || '').trim();
    const empEmail = idx.email !== -1 ? String(row[idx.email] || '').trim() : '';
    if (cleanForMatch(empName) === cleanUser || cleanForMatch(empEmail) === cleanUser) {
      if (idx.prov !== -1 && row[idx.prov] !== '') {
        return String(row[idx.prov]).trim();
      }
      if (idx.area !== -1 && row[idx.area] !== '') {
        return String(row[idx.area]).trim();
      }
    }
  }
  return '';
}

function findEmployeeDetails(picName) {
  const result = { upline: '', area: '' };
  if (!picName) return result;
  
  const empSheet = SS.getSheetByName('employee');
  if (!empSheet) return result;
  
  const data = empSheet.getDataRange().getValues();
  if (data.length <= 1) return result;
  
  const headers = data[0];
  const idx = {
    name: headers.findIndex(h => /nama|name|pic/i.test(String(h).trim())),
    upline: headers.findIndex(h => /upline|spv|supervisor|atasan|manager/i.test(String(h).trim())),
    area: headers.findIndex(h => /area/i.test(String(h).trim())),
    prov: headers.findIndex(h => /province|provinsi/i.test(String(h).trim()))
  };
  
  const picClean = cleanForMatch(picName);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const empName = idx.name !== -1 ? String(row[idx.name] || '').trim() : '';
    if (cleanForMatch(empName) === picClean) {
      if (idx.upline !== -1) result.upline = String(row[idx.upline] || '').trim();
      if (idx.area !== -1 && row[idx.area] !== '') {
        result.area = String(row[idx.area]).trim();
      } else if (idx.prov !== -1 && row[idx.prov] !== '') {
        result.area = String(row[idx.prov]).trim();
      }
      break;
    }
  }
  return result;
}

function handleAddPartner(body) {
  const sheet = SS.getSheetByName('channel');
  if (!sheet) throw new Error("Sheet 'channel' tidak ditemukan");
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = {
    pic: headers.findIndex(h => /pic|user|nama|analyst|solution/i.test(String(h).trim())),
    channel: headers.findIndex(h => /channel|kiosk|nama toko|toko/i.test(String(h).trim())),
    cat: headers.findIndex(h => /kategori|category|klasifikasi|^cat$/i.test(String(h).trim())),
    upline: headers.findIndex(h => /upline|spv|supervisor/i.test(String(h).trim())),
    area: headers.findIndex(h => /area|provinsi|province|wilayah/i.test(String(h).trim())),
    group: headers.findIndex(h => /group|tim|divisi|division/i.test(String(h).trim()))
  };
  
  if (idx.channel === -1) throw new Error("Kolom nama partner tidak ditemukan");
  
  const empDetails = findEmployeeDetails(body.pic);
  let userGroup = body.group || '';
  if (!userGroup) {
    userGroup = getUserGroup(body.user);
  }
  let userProvince = body.province || '';
  if (!userProvince) {
    userProvince = getUserProvince(body.user);
  }
  
  const newRow = new Array(headers.length).fill('');
  if (idx.channel !== -1) newRow[idx.channel] = body.name || '';
  if (idx.cat !== -1) newRow[idx.cat] = body.category || '';
  if (idx.pic !== -1) newRow[idx.pic] = body.pic || '';
  if (idx.upline !== -1) newRow[idx.upline] = empDetails.upline || '';
  if (idx.area !== -1) newRow[idx.area] = userProvince || empDetails.area || '';
  if (idx.group !== -1) newRow[idx.group] = userGroup;
  
  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdatePartner(body) {
  const sheet = SS.getSheetByName('channel');
  if (!sheet) throw new Error("Sheet 'channel' tidak ditemukan");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = {
    pic: headers.findIndex(h => /pic|user|nama|analyst|solution/i.test(String(h).trim())),
    channel: headers.findIndex(h => /channel|kiosk|nama toko|toko/i.test(String(h).trim())),
    cat: headers.findIndex(h => /kategori|category|klasifikasi|^cat$/i.test(String(h).trim())),
    upline: headers.findIndex(h => /upline|spv|supervisor/i.test(String(h).trim())),
    area: headers.findIndex(h => /area|provinsi|province|wilayah/i.test(String(h).trim())),
    group: headers.findIndex(h => /group|tim|divisi|division/i.test(String(h).trim()))
  };
  
  const rowNum = Number(body.id);
  if (!isNaN(rowNum) && rowNum > 1) {
    const empDetails = findEmployeeDetails(body.pic);
    let userGroup = body.group || '';
    if (!userGroup) {
      userGroup = getUserGroup(body.user);
    }
    let userProvince = body.province || '';
    if (!userProvince) {
      userProvince = getUserProvince(body.user);
    }
    
    if (idx.pic !== -1 && body.pic !== undefined) {
      sheet.getRange(rowNum, idx.pic + 1).setValue(body.pic);
    }
    if (idx.upline !== -1) {
      sheet.getRange(rowNum, idx.upline + 1).setValue(empDetails.upline || '');
    }
    const resolvedProv = userProvince || empDetails.area;
    if (idx.area !== -1 && resolvedProv) {
      sheet.getRange(rowNum, idx.area + 1).setValue(resolvedProv);
    }
    if (idx.channel !== -1 && body.name !== undefined && body.name !== '') {
      sheet.getRange(rowNum, idx.channel + 1).setValue(body.name);
    }
    if (idx.cat !== -1 && body.category !== undefined && body.category !== '') {
      sheet.getRange(rowNum, idx.cat + 1).setValue(body.category);
    }
    if (idx.group !== -1 && userGroup) {
      sheet.getRange(rowNum, idx.group + 1).setValue(userGroup);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}
function handleDeletePartner(body) {
  const sheet = SS.getSheetByName('channel');
  if (!sheet) throw new Error("Sheet 'channel' tidak ditemukan");
  if (body.id > 1) sheet.deleteRow(body.id);
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}
// Optimization: Using Shift, Map, and Filter to significantly speed up JS compilation execution time
/* STREAMING_CHUNK:Fetching working data... */
function handleGetWorkingData(user) {
  const data = getSheetValuesCached('working');
  if (!data || data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  const headers = data.shift();
  const getIdx = (patterns) => headers.findIndex(h => patterns.test(String(h).trim()));
  const idx = {
    lot: getIdx(/^lot package$|^lot$/i),
    hybrid: getIdx(/^hybrid$|^material$/i),
    stock: getIdx(/^quantity \(kg\)|^qty$|^stock$|^kg$/i),
    aging: getIdx(/^aging \(month\)/i),
    exp: getIdx(/^exp date$|^expired$/i),
    kiosk: getIdx(/^channel$|^kiosk$/i),
    crops: getIdx(/^crops$/i),
    time: getIdx(/^tgl$|^waktu$|^date$|^timestamp$/i),
    cond: getIdx(/^condition$|^kondisi$/i),
    dr: getIdx(/^shipping date$|^dr date$/i),
    user: getIdx(/^name checker$|^nama checker$|^user$|^pic$|^checker$/i),
    pog: getIdx(/^pog$|^selisih$/i)
  };
  const monthIndices = getMonthIndices(headers);
  const updMonthIndices = getUpdMonthIndices(headers);
  const result = data.filter(row => row[0] !== '').map(row => {
      const rowItem = {
          lot: idx.lot !== -1 ? row[idx.lot] : '',
          hybrid: idx.hybrid !== -1 ? row[idx.hybrid] : '',
          crops: idx.crops !== -1 && row[idx.crops] !== '' ? row[idx.crops] : 'Uncategorized Crops',
          stock: idx.stock !== -1 && row[idx.stock] !== '' ? row[idx.stock] : 0,
          aging: idx.aging !== -1 && row[idx.aging] !== '' ? row[idx.aging] : '-',
          expired: idx.exp !== -1 && row[idx.exp] ? formatMyDate(row[idx.exp]) : 'N/A',
          drDate: idx.dr !== -1 && row[idx.dr] ? formatMyDate(row[idx.dr]) : 'N/A',
          kiosk: idx.kiosk !== -1 ? row[idx.kiosk] : '',
          timestamp: idx.time !== -1 && row[idx.time] ? row[idx.time] : '',
          condition: idx.cond !== -1 && row[idx.cond] ? row[idx.cond] : 'tetap',
          user: idx.user !== -1 && row[idx.user] ? String(row[idx.user]).trim() : '',
          pog: idx.pog !== -1 && row[idx.pog] !== '' ? Number(row[idx.pog]) : 0
      };
      
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      months.forEach((m, mIdx) => {
          const colIdx = monthIndices[mIdx];
          if (colIdx !== -1) {
              rowItem[m.toLowerCase()] = row[colIdx] !== '' ? Number(row[colIdx]) : 0;
          } else {
              rowItem[m.toLowerCase()] = 0;
          }

          const updColIdx = updMonthIndices[mIdx];
          if (updColIdx !== -1) {
              rowItem['upd_' + m.toLowerCase()] = row[updColIdx] !== '' ? String(row[updColIdx]).trim() : '';
          } else {
              rowItem['upd_' + m.toLowerCase()] = '';
          }
      });
      return rowItem;
  });
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result })).setMimeType(ContentService.MimeType.JSON);
}
/* STREAMING_CHUNK:Fetching channels data... */
function handleGetChannels(user) {
  const data = getSheetValuesCached('channel');
  if (!data || data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  const lowerUser = String(user).trim().toLowerCase();
  
  const empData = getSheetValuesCached('employee');
  let authorizedPICs = [lowerUser]; 
  
  if (empData && empData.length > 0) {
      const empHeaders = empData.shift();
      const idxE = { 
          name: empHeaders.findIndex(h => /nama|name|pic/i.test(String(h).trim())),
          email: empHeaders.findIndex(h => /email|user/i.test(String(h).trim())),
          upline: empHeaders.findIndex(h => /upline|spv|supervisor|atasan|manager/i.test(String(h).trim())),
          pos: empHeaders.findIndex(h => /position|jabatan/i.test(String(h).trim()))
      };
      
      let isBusinessAnalyst = lowerUser === 'adityawiratama' || lowerUser.includes('adityawiratama') || lowerUser.includes('analyst');
      let userAliases = new Set([lowerUser]);
      empData.forEach(row => {
          const rowName = idxE.name !== -1 ? String(row[idxE.name] || '').trim().toLowerCase() : '';
          const rowEmail = idxE.email !== -1 ? String(row[idxE.email] || '').trim().toLowerCase() : '';
          const rowPos = idxE.pos !== -1 ? String(row[idxE.pos] || '').trim().toLowerCase() : '';
          const isUser = rowName === lowerUser || rowEmail === lowerUser;
          if (isUser) {
              if (rowName !== '') userAliases.add(rowName);
              if (rowEmail !== '') userAliases.add(rowEmail);
              if (rowPos.includes('analyst') || rowPos.includes('business analyst') || rowPos.includes('businessanalyst')) {
                  isBusinessAnalyst = true;
              }
          }
      });

      if (isBusinessAnalyst) {
          empData.forEach(row => {
              const rowName = idxE.name !== -1 ? String(row[idxE.name] || '').trim().toLowerCase() : '';
              const rowEmail = idxE.email !== -1 ? String(row[idxE.email] || '').trim().toLowerCase() : '';
              if (rowName !== '') userAliases.add(rowName);
              if (rowEmail !== '') userAliases.add(rowEmail);
          });
      }

      const queue = Array.from(userAliases);
      let visited = new Set(queue);
      userAliases.forEach(alias => {
          if (!authorizedPICs.includes(alias)) authorizedPICs.push(alias);
      });
      
      while (queue.length > 0) {
          const currentUpline = queue.shift();
          empData.forEach(row => {
              const empNameRaw = idxE.name !== -1 ? String(row[idxE.name] || '').trim() : '';
              const empNameLower = empNameRaw.toLowerCase();
              const empEmailRaw = idxE.email !== -1 ? String(row[idxE.email] || '').trim() : '';
              const empEmailLower = empEmailRaw.toLowerCase();
              
              const empUplineRaw = idxE.upline !== -1 ? String(row[idxE.upline] || '').trim() : '';
              const empUplineLower = empUplineRaw.toLowerCase();
              
              if (empUplineLower !== '') {
                  const isMatch = (empUplineLower === currentUpline || 
                                   empUplineLower.includes(currentUpline) || 
                                   currentUpline.includes(empUplineLower));
                  if (isMatch) {
                      let addedAny = false;
                      if (empNameLower !== '' && !visited.has(empNameLower)) {
                          visited.add(empNameLower);
                          queue.push(empNameLower);
                          if (!authorizedPICs.includes(empNameLower)) authorizedPICs.push(empNameLower);
                          addedAny = true;
                      }
                      if (empEmailLower !== '' && !visited.has(empEmailLower)) {
                          visited.add(empEmailLower);
                          queue.push(empEmailLower);
                          if (!authorizedPICs.includes(empEmailLower)) authorizedPICs.push(empEmailLower);
                          addedAny = true;
                      }
                  }
              }
          });
      }
  }
  const headers = data.shift();
  const idx = {
      pic: headers.findIndex(h => /pic|user|nama|analyst|solution/i.test(String(h).trim())),
      channel: headers.findIndex(h => /channel|kiosk|nama toko|toko/i.test(String(h).trim())),
      cat: headers.findIndex(h => /kategori|category|klasifikasi|^cat$/i.test(String(h).trim())),
      upline: headers.findIndex(h => /upline|spv|supervisor/i.test(String(h).trim())),
      area: headers.findIndex(h => /area|provinsi|province|wilayah/i.test(String(h).trim())),
      group: headers.findIndex(h => /group|tim|divisi|division/i.test(String(h).trim()))
  };

  // Build pics/emails to areas mapping from employee sheet
  let picToAreaMap = {};
  const empDataVal = getSheetValuesCached('employee');
  if (empDataVal && empDataVal.length > 1) {
      const empHeadersVal = empDataVal.shift();
      const nameCol = empHeadersVal.findIndex(h => /nama|name|pic/i.test(String(h).trim()));
      const emailCol = empHeadersVal.findIndex(h => /email|user/i.test(String(h).trim()));
      const areaCol = empHeadersVal.findIndex(h => /area/i.test(String(h).trim()));
      const provCol = empHeadersVal.findIndex(h => /province|provinsi/i.test(String(h).trim()));
      
      empDataVal.forEach(empRow => {
          const empName = nameCol !== -1 ? String(empRow[nameCol] || '').trim().toLowerCase() : '';
          const empEmail = emailCol !== -1 ? String(empRow[emailCol] || '').trim().toLowerCase() : '';
          const empArea = areaCol !== -1 && empRow[areaCol] !== '' ? String(empRow[areaCol]).trim() : (provCol !== -1 ? String(empRow[provCol]).trim() : '');
          if (empArea) {
              if (empName) picToAreaMap[empName] = empArea;
              if (empEmail) picToAreaMap[empEmail] = empArea;
          }
      });
  }

  const channels = data.map((row, i) => {
      if (row[0] === '') return null;
      const catValue = idx.cat !== -1 && row[idx.cat] !== '' ? String(row[idx.cat]).trim() : 'Uncategorized';
      const rowGroup = idx.group !== -1 && row[idx.group] !== '' ? String(row[idx.group]).trim() : '';
      if (idx.pic !== -1 && idx.channel !== -1) {
          const picLower = String(row[idx.pic]).trim().toLowerCase();
          const uplineLower = idx.upline !== -1 ? String(row[idx.upline]).trim().toLowerCase() : '';
          
          const isAuth = picLower === lowerUser || (lowerUser !== '' && picLower.includes(lowerUser)) || 
                         uplineLower === lowerUser || (lowerUser !== '' && uplineLower.includes(lowerUser)) || 
                         authorizedPICs.some(auth => picLower === auth || (auth !== '' && picLower.includes(auth)));
          if (isAuth) {
              const sheetArea = idx.area !== -1 && row[idx.area] !== '' ? String(row[idx.area]).trim() : '';
              const resolvedArea = sheetArea || picToAreaMap[picLower] || '-';
              return { 
                  id: i + 2, 
                  name: row[idx.channel], 
                  category: catValue, 
                  pic: String(row[idx.pic]).trim(), 
                  upline: idx.upline !== -1 ? String(row[idx.upline]).trim() : '',
                  area: resolvedArea,
                  group: rowGroup
              };
          }
      } else if (idx.channel !== -1) {
          const sheetArea = idx.area !== -1 && row[idx.area] !== '' ? String(row[idx.area]).trim() : '';
          return { id: i + 2, name: row[idx.channel], category: catValue, pic: '', upline: '', area: sheetArea || '-', group: rowGroup };
      }
      return null;
  }).filter(Boolean);
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: channels })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetDrSalesData(user) {
  let hybridMap = {};
  const hData = getSheetValuesCached('hybrid');
  if (hData && hData.length > 1) {
      const hHeaders = hData.shift();
      const idxH = { desc: hHeaders.findIndex(h => /material.*desc|description/i.test(String(h).trim())), hybrid: hHeaders.findIndex(h => /^hybrid$/i.test(String(h).trim())), crops: hHeaders.findIndex(h => /^crops$/i.test(String(h).trim())) };
      if (idxH.desc !== -1 && idxH.hybrid !== -1) {
          hData.forEach(row => {
              const mDesc = String(row[idxH.desc]).trim().toLowerCase();
              if (mDesc) hybridMap[mDesc] = { hybrid: String(row[idxH.hybrid]).trim(), crops: idxH.crops !== -1 ? String(row[idxH.crops]).trim() : '' };
          });
      }
  }

  const data = getSheetValuesCached('dr');
  if (!data || data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  const headers = data.shift();
  
  const hIdx = {
      qty: headers.findIndex(h => /qty|quantity/i.test(String(h).trim())),
      type: headers.findIndex(h => /order type/i.test(String(h).trim())),
      channel: headers.findIndex(h => /channel|kiosk/i.test(String(h).trim())),
      lot: headers.findIndex(h => /lot/i.test(String(h).trim())),
      desc: headers.findIndex(h => /material.*desc|description/i.test(String(h).trim())),
      dr: headers.findIndex(h => /dr date|shipping date/i.test(String(h).trim())),
      exp: headers.findIndex(h => /exp date|expired/i.test(String(h).trim()))
  };
  
  const result = data.filter(row => {
      return hIdx.type !== -1 && String(row[hIdx.type]).trim().toLowerCase() === 'sales';
  }).map(row => {
      const rawDesc = hIdx.desc !== -1 ? String(row[hIdx.desc]).trim() : '';
      const mapInfo = hybridMap[rawDesc.toLowerCase()] || { hybrid: rawDesc, crops: '' };
      const drValue = hIdx.dr !== -1 && row[hIdx.dr] ? formatMyDate(row[hIdx.dr]) : 'N/A';
      const expValue = hIdx.exp !== -1 && row[hIdx.exp] ? formatMyDate(row[hIdx.exp]) : 'N/A';
      return {
          lot: hIdx.lot !== -1 ? String(row[hIdx.lot]).trim().toUpperCase() : '',
          hybrid: mapInfo.hybrid,
          crops: mapInfo.crops,
          channel: hIdx.channel !== -1 ? String(row[hIdx.channel]).trim() : '',
          qty: hIdx.qty !== -1 ? Number(row[hIdx.qty]) || 0 : 0,
          drDate: drValue,
          expired: expValue
      };
  });
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result })).setMimeType(ContentService.MimeType.JSON);
}

/* STREAMING_CHUNK:Fetching lot info... */
function handleGetLotInfo(lotNo) {
  if (!lotNo) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Lot number is required' })).setMimeType(ContentService.MimeType.JSON);
  let hybridMap = {};
  const hData = getSheetValuesCached('hybrid');
  if (hData && hData.length > 1) {
      const hHeaders = hData.shift();
      const idxH = { desc: hHeaders.findIndex(h => /material.*desc|description/i.test(String(h).trim())), hybrid: hHeaders.findIndex(h => /^hybrid$/i.test(String(h).trim())), crops: hHeaders.findIndex(h => /^crops$/i.test(String(h).trim())) };
      if (idxH.desc !== -1 && idxH.hybrid !== -1) {
          hData.forEach(row => {
              const mDesc = String(row[idxH.desc]).trim().toLowerCase();
              if (mDesc) hybridMap[mDesc] = { hybrid: String(row[idxH.hybrid]).trim(), crops: idxH.crops !== -1 ? String(row[idxH.crops]).trim() : '' };
          });
      }
  }
  const data = getSheetValuesCached('dr');
  if (!data || data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No data' })).setMimeType(ContentService.MimeType.JSON);
  const headers = data.shift();
  const idx = {
      lot: headers.findIndex(h => /lot/i.test(String(h).trim())),
      desc: headers.findIndex(h => /material.*desc|description/i.test(String(h).trim())),
      dr: headers.findIndex(h => /dr date|shipping date/i.test(String(h).trim())),
      exp: headers.findIndex(h => /exp date|expired/i.test(String(h).trim()))
  };
  if (idx.lot === -1) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Lot column missing' })).setMimeType(ContentService.MimeType.JSON);
  const calcMonths = (start, end) => {
     try {
        if (!start || !end || start === '' || end === '') return "";
        const d1 = new Date(start); const d2 = new Date(end);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";
        return Math.round(((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) / 30.416);
     } catch(e) { return ""; }
  };
  
  const todayDate = new Date(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd") + "T00:00:00");
  const targetLot = String(lotNo).trim().toUpperCase();
  const foundRow = data.find(row => String(row[idx.lot]).trim().toUpperCase() === targetLot);
  if (foundRow) {
      const rawDesc = idx.desc !== -1 ? String(foundRow[idx.desc]).trim() : 'Unknown Material';
      const mapInfo = hybridMap[rawDesc.toLowerCase()] || { hybrid: rawDesc, crops: '' };
      const drDateVal = idx.dr !== -1 ? foundRow[idx.dr] : '';
      
      return ContentService.createTextOutput(JSON.stringify({ 
          status: 'success', 
          data: {
             desc: mapInfo.hybrid, crops: mapInfo.crops,
             drDate: idx.dr !== -1 ? formatMyDate(drDateVal) : 'N/A',
             expDate: idx.exp !== -1 ? formatMyDate(foundRow[idx.exp]) : 'N/A',
             aging: calcMonths(drDateVal, todayDate)
          } 
      })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Lot not found' })).setMimeType(ContentService.MimeType.JSON);
}
/* STREAMING_CHUNK:Fetching user profile... */
function handleGetUserProfile(user) {
  const data = getSheetValuesCached('employee');
  if (!data || data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Data employee kosong atau tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);
  const headers = data.shift();
  const idx = {
      name: headers.findIndex(h => /nama|name|pic/i.test(String(h).trim())),
      email: headers.findIndex(h => /email|user/i.test(String(h).trim())),
      pos: headers.findIndex(h => /position|jabatan/i.test(String(h).trim())),
      prov: headers.findIndex(h => /province|provinsi/i.test(String(h).trim())),
      area: headers.findIndex(h => /area/i.test(String(h).trim())),
      upline: headers.findIndex(h => /upline|spv|supervisor|atasan|manager/i.test(String(h).trim())),
      password: headers.findIndex(h => /password|pass/i.test(String(h).trim())),
      level: headers.findIndex(h => /level|grade/i.test(String(h).trim())),
      group: headers.findIndex(h => /group|tim|divisi|division/i.test(String(h).trim()))
  };
  if (idx.name === -1) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Kolom nama tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);
  
  const lowerUser = String(user).trim().toLowerCase();
  let userAliases = new Set([lowerUser]);
  
  let foundUserRow = null;
  data.forEach(row => {
      const rowName = idx.name !== -1 ? String(row[idx.name] || '').trim().toLowerCase() : '';
      const rowEmail = idx.email !== -1 ? String(row[idx.email] || '').trim().toLowerCase() : '';
      if (rowName === lowerUser || rowEmail === lowerUser) {
          foundUserRow = row;
          if (rowName !== '') userAliases.add(rowName);
          if (rowEmail !== '') userAliases.add(rowEmail);
      }
  });

  if (!foundUserRow) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Username tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);
  }

  const passwordVal = (idx.password !== -1 && foundUserRow[idx.password] !== undefined) ? String(foundUserRow[idx.password]).trim() : '';
  let profile = { 
    name: idx.name !== -1 ? String(foundUserRow[idx.name] || '').trim() : user, 
    position: normalizePosition(idx.pos !== -1 ? foundUserRow[idx.pos] : 'Business Solution'), 
    province: idx.prov !== -1 ? foundUserRow[idx.prov] : '-', 
    area: idx.area !== -1 ? foundUserRow[idx.area] : '-', 
    password: passwordVal,
    upline: idx.upline !== -1 ? String(foundUserRow[idx.upline] || '').trim() : '',
    level: idx.level !== -1 && foundUserRow[idx.level] !== '' ? foundUserRow[idx.level] : null,
    group: idx.group !== -1 ? String(foundUserRow[idx.group] || '').trim() : '',
    subordinates: [] 
  };

  const isBusinessAnalyst = lowerUser === 'adityawiratama' || lowerUser.includes('adityawiratama') || (profile.position && (profile.position.toLowerCase().includes('analyst') || profile.position.toLowerCase().includes('business analyst') || profile.position.toLowerCase().includes('businessanalyst')));
  if (isBusinessAnalyst) {
      profile.position = 'Business Analyst';
      const asmSubordinates = [];
      data.forEach(row => {
          const empNameRaw = idx.name !== -1 ? String(row[idx.name] || '').trim() : '';
          const empPosRaw = idx.pos !== -1 ? String(row[idx.pos] || '').trim() : '';
          const empPosNorm = normalizePosition(empPosRaw);
          if (empNameRaw !== '' && empPosNorm === 'Area Sales Manager') {
              if (!asmSubordinates.includes(empNameRaw)) {
                  asmSubordinates.push(empNameRaw);
              }
          }
      });
      profile.subordinates = asmSubordinates;
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: profile })).setMimeType(ContentService.MimeType.JSON);
  }

  const subs = [];
  const queue = Array.from(userAliases);
  let visited = new Set(queue);

  while (queue.length > 0) {
      const currentUpline = queue.shift();
      data.forEach(row => {
          const empNameRaw = idx.name !== -1 ? String(row[idx.name] || '').trim() : '';
          const empNameLower = empNameRaw.toLowerCase();
          const empEmailRaw = idx.email !== -1 ? String(row[idx.email] || '').trim() : '';
          const empEmailLower = empEmailRaw.toLowerCase();
          
          const empUplineRaw = idx.upline !== -1 ? String(row[idx.upline] || '').trim() : '';
          const empUplineLower = empUplineRaw.toLowerCase();
          
          if (empUplineLower !== '') {
              const isMatch = (empUplineLower === currentUpline || 
                               empUplineLower.includes(currentUpline) || 
                               currentUpline.includes(empUplineLower));
              if (isMatch) {
                  let addedAny = false;
                  if (empNameLower !== '' && !visited.has(empNameLower)) {
                      visited.add(empNameLower);
                      queue.push(empNameLower);
                      addedAny = true;
                  }
                  if (empEmailLower !== '' && !visited.has(empEmailLower)) {
                      visited.add(empEmailLower);
                      queue.push(empEmailLower);
                      addedAny = true;
                  }
                  if (addedAny) {
                      const displayName = empNameRaw !== '' ? empNameRaw : empEmailRaw;
                      if (displayName !== '' && !subs.includes(displayName)) {
                          subs.push(displayName);
                      }
                  }
              }
          }
      });
  }

  profile.subordinates = subs;
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: profile })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetEmployees() {
  const data = getSheetValuesCached('employee');
  if (!data || data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  const headers = data.shift();
  const idx = {
      name: headers.findIndex(h => /nama|name|pic/i.test(String(h).trim())),
      email: headers.findIndex(h => /email|user/i.test(String(h).trim())),
      pos: headers.findIndex(h => /position|jabatan/i.test(String(h).trim())),
      prov: headers.findIndex(h => /province|provinsi/i.test(String(h).trim())),
      area: headers.findIndex(h => /area/i.test(String(h).trim())),
      upline: headers.findIndex(h => /upline|spv|supervisor|atasan|manager/i.test(String(h).trim())),
      password: headers.findIndex(h => /password|pass/i.test(String(h).trim())),
      level: headers.findIndex(h => /level|grade/i.test(String(h).trim())),
      group: headers.findIndex(h => /group|tim|divisi|division/i.test(String(h).trim()))
  };
  
  const result = data.filter(row => row[idx.name] !== '').map(row => {
      const p = idx.pos !== -1 ? row[idx.pos] : 'Business Solution';
      return {
          name: idx.name !== -1 ? String(row[idx.name] || '').trim() : '',
          email: idx.email !== -1 ? String(row[idx.email] || '').trim() : '',
          position: normalizePosition(p),
          province: idx.prov !== -1 ? String(row[idx.prov] || '').trim() : '-',
          area: idx.area !== -1 ? String(row[idx.area] || '').trim() : '-',
          upline: idx.upline !== -1 ? String(row[idx.upline] || '').trim() : '',
          password: idx.password !== -1 ? String(row[idx.password] || '').trim() : '',
          level: idx.level !== -1 && row[idx.level] !== '' ? row[idx.level] : null,
          group: idx.group !== -1 ? String(row[idx.group] || '').trim() : ''
      };
  });
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateEmployee(body) {
  const sheet = SS.getSheetByName('employee');
  if (!sheet) throw new Error("Sheet 'employee' tidak ditemukan");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const getIdx = (patterns) => headers.findIndex(h => patterns.test(String(h).trim()));
  const idx = {
    name: getIdx(/nama|name|pic/i),
    email: getIdx(/email|user/i),
    pos: getIdx(/position|jabatan/i),
    prov: getIdx(/province|provinsi/i),
    area: getIdx(/area/i),
    upline: getIdx(/upline|spv|supervisor|atasan|manager/i),
    password: getIdx(/password|pass/i),
    level: getIdx(/level|grade/i),
    group: getIdx(/group|tim|divisi|division/i)
  };
  
  if (idx.name === -1) throw new Error("Name column not found");
  
  const targetClean = cleanForMatch(body.originalName);
  let targetRow = -1;
  if (body.originalName) {
    for (let i = 1; i < data.length; i++) {
      if (cleanForMatch(data[i][idx.name]) === targetClean) {
        targetRow = i + 1;
        break;
      }
    }
  }
  
  if (targetRow !== -1) {
    if (body.name !== undefined) sheet.getRange(targetRow, idx.name + 1).setValue(body.name);
    if (idx.email !== -1 && body.email !== undefined) sheet.getRange(targetRow, idx.email + 1).setValue(body.email);
    if (idx.pos !== -1 && body.position !== undefined) sheet.getRange(targetRow, idx.pos + 1).setValue(body.position);
    if (idx.prov !== -1 && body.province !== undefined) sheet.getRange(targetRow, idx.prov + 1).setValue(body.province);
    if (idx.area !== -1 && body.area !== undefined) sheet.getRange(targetRow, idx.area + 1).setValue(body.area);
    if (idx.upline !== -1 && body.upline !== undefined) sheet.getRange(targetRow, idx.upline + 1).setValue(body.upline);
    if (idx.password !== -1 && body.password !== undefined) sheet.getRange(targetRow, idx.password + 1).setValue(body.password);
    if (idx.level !== -1 && body.level !== undefined) sheet.getRange(targetRow, idx.level + 1).setValue(body.level);
    if (idx.group !== -1 && body.group !== undefined) sheet.getRange(targetRow, idx.group + 1).setValue(body.group);
  } else {
    const newRow = new Array(headers.length).fill('');
    if (idx.name !== -1 && body.name !== undefined) newRow[idx.name] = body.name;
    if (idx.email !== -1 && body.email !== undefined) newRow[idx.email] = body.email;
    if (idx.pos !== -1 && body.position !== undefined) newRow[idx.pos] = body.position;
    if (idx.prov !== -1 && body.province !== undefined) newRow[idx.prov] = body.province;
    if (idx.area !== -1 && body.area !== undefined) newRow[idx.area] = body.area;
    if (idx.upline !== -1 && body.upline !== undefined) newRow[idx.upline] = body.upline;
    if (idx.password !== -1 && body.password !== undefined) newRow[idx.password] = body.password;
    if (idx.level !== -1 && body.level !== undefined) newRow[idx.level] = body.level;
    if (idx.group !== -1 && body.group !== undefined) newRow[idx.group] = body.group;
    sheet.appendRow(newRow);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteEmployee(body) {
  const sheet = SS.getSheetByName('employee');
  if (!sheet) throw new Error("Sheet 'employee' tidak ditemukan");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nameIdx = headers.findIndex(h => /nama|name|pic/i.test(String(h).trim()));
  if (nameIdx === -1) throw new Error("Name column not found");
  
  const targetClean = cleanForMatch(body.name);
  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (cleanForMatch(data[i][nameIdx]) === targetClean) {
      targetRow = i + 1;
      break;
    }
  }
  
  if (targetRow !== -1) {
    sheet.deleteRow(targetRow);
  } else {
    throw new Error("Employee not found with name: " + body.name);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetInitialData(user) {
  try {
    var profileJson = JSON.parse(handleGetUserProfile(user).getContent());
    var employeesJson = JSON.parse(handleGetEmployees().getContent());
    var channelsJson = JSON.parse(handleGetChannels(user).getContent());
    var workingDataJson = JSON.parse(handleGetWorkingData(user).getContent());
    var drSalesDataJson = JSON.parse(handleGetDrSalesData(user).getContent());
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: {
        profile: profileJson.status === 'success' ? profileJson.data : null,
        employees: employeesJson.status === 'success' ? employeesJson.data : [],
        channels: channelsJson.status === 'success' ? channelsJson.data : [],
        workingData: workingDataJson.status === 'success' ? workingDataJson.data : [],
        drSalesData: drSalesDataJson.status === 'success' ? drSalesDataJson.data : []
      }
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
