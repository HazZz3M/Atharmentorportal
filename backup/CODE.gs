// Dynamic Spreadsheet IDs via PropertiesService
function getSettings_() {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty('FORM_SS_ID') || "1kiCguoDP6ObPQMqUpZjnPnv4mlG-wexxbfuaaLfranQ";
  var diagnoseId = props.getProperty('DIAGNOSE_SS_ID') || "1lAYYClZQcoihxaZ8U3xpaT0n4DcacElKTdxkvnrcLiE";
  
  // Set defaults if missing
  if (!props.getProperty('FORM_SS_ID')) props.setProperty('FORM_SS_ID', formId);
  if (!props.getProperty('DIAGNOSE_SS_ID')) props.setProperty('DIAGNOSE_SS_ID', diagnoseId);
  
  return { formId: formId, diagnoseId: diagnoseId };
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('Mentor Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * API Gateway for GitHub deployment
 */
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var funcName = params.functionName;
    var args = params.args || [];
    
    // Authorization: Only allowed functions can be called
    var allowedFunctions = [
      "validateLogin", "getInitialAppLoad", "getAppData", "getFollowUpData", 
      "getRounds", "getMentors", "getDiagnoseData", "submitFeedback", 
      "updateFollowupSession", "getCompanyDetails", "submitDiagnose",
      "validateAdminLogin", "getAdminStats", "updateSettings", "updateMentorPin", "toggleRoundStatus"
    ];
    
    if (allowedFunctions.indexOf(funcName) === -1) {
      throw new Error("Forbidden: Function '" + funcName + "' is not accessible.");
    }
    
    // Call the function
    var result = this[funcName].apply(this, args);
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getRounds(isAdmin) {
  var ss = SpreadsheetApp.getActive();
  var props = PropertiesService.getScriptProperties();
  var disabled = JSON.parse(props.getProperty('DISABLED_ROUNDS') || '{}');
  var rounds = [];
  
  for (var i = 1; i <= 20; i++) {
    var id = 'R_' + (i < 10 ? '0' + i : i);
    var sh = ss.getSheetByName(id);
    if (sh) {
      if (!isAdmin && disabled[id]) continue;
      rounds.push({
        id: id,
        label: 'Round ' + i,
        active: !disabled[id]
      });
    }
  }
  return rounds.sort(function(a,b){return b.id.localeCompare(a.id)}); 
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Mentor Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getMentors(roundId) {
  var sh = getSheet_(roundId);
  var lastCol = sh.getLastColumn();
  if (lastCol < 3) return [];
  var row = sh.getRange(2, 3, 1, lastCol - 2).getValues()[0];
  var names = row.map(function(x){return x && x.toString().trim() ? x.toString().trim() : ''}).filter(function(x){return x});
  var uniq = [];
  var set = {};
  for (var i=0;i<names.length;i++){var k = names[i].toLowerCase();if(!set[k]){set[k]=true;uniq.push(names[i]);}}
  return uniq;
}

function validateLogin(mentorName, pin, roundId) {
  if (!mentorName || !mentorName.toString().trim()) throw new Error('Enter mentor name');
  
  var props = PropertiesService.getScriptProperties();
  var savedPin = props.getProperty('PIN_' + mentorName.toString().trim());

  if (savedPin && savedPin.trim() !== '') {
    if (pin !== savedPin.trim()) {
      throw new Error('Incorrect PIN');
    }
  }
  
  var sh = getSheet_(roundId);
  var colIndex = findMentorColumn_(sh, mentorName);
  return { ok: true };
}

function getCompaniesForMentor(mentorName, roundId) {
  var sh = getSheet_(roundId);
  var col = findMentorColumn_(sh, mentorName);
  var cell = sh.getRange(3, col);
  var rule = cell.getDataValidation();
  var list = [];
  if (rule) {
    var type = rule.getCriteriaType();
    var vals = rule.getCriteriaValues();
    if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
      list = (vals && vals[0]) ? vals[0] : [];
    } else if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
      var r = vals && vals[0] ? vals[0] : null;
      if (r) list = r.getValues().reduce(function(acc,row){for(var i=0;i<row.length;i++){if(row[i] && row[i].toString().trim()) acc.push(row[i].toString().trim());}return acc;},[]);
    }
  }
  list = list.map(function(x){return x && x.toString().trim() ? x.toString().trim() : ''}).filter(function(x){return x});
  var current = cell.getDisplayValue();
  var out = [];
  var seen = {};
  if (current && current.toString().trim()) {
    seen[current.toLowerCase()] = true;
    out.push(current.toString().trim());
  }
  for (var i=0;i<list.length;i++){var k=list[i].toLowerCase();if(!seen[k]){seen[k]=true;out.push(list[i]);}}
  return out;
}

function getCompanyDetails(mentorName, companyName, roundId) {
  var sh = getSheet_(roundId);
  var col = findMentorColumn_(sh, mentorName);
  if (companyName && companyName.toString().trim()) {
    sh.getRange(3, col).setValue(companyName.toString().trim());
    SpreadsheetApp.flush();
  }
  var desc = sh.getRange(4, col).getDisplayValue();
  var startDate = sh.getRange(5, col).getDisplayValue();
  var stage = sh.getRange(6, col).getDisplayValue();
  var traction = sh.getRange(7, col).getDisplayValue();
  var revenue = sh.getRange(8, col).getDisplayValue();
  var currentCompany = sh.getRange(3, col).getDisplayValue();
  return {
    company: currentCompany || '',
    description: desc || '',
    startDate: startDate || '',
    stage: stage || '',
    traction: traction || '',
    annualRevenue: revenue || ''
  };
}

function getFollowUpData(mentorName, roundId) {
  var ss = SpreadsheetApp.getActive();
  var followUpName = 'Follow up ' + roundId;
  var sh = ss.getSheetByName(followUpName);
  if (!sh) throw new Error('Sheet "' + followUpName + '" not found');
  
  // 1. Fetch external responses for text/score
  var settings = getSettings_();
  var externalSS = SpreadsheetApp.openById(settings.formId);
  var externalSh = externalSS.getSheetByName("Form Responses 1");
  var externalData = externalSh.getDataRange().getValues();
  
  var roundName = roundId.replace('R_', 'Round_');
  var logMap = {}; // {company: {day: {actions, score}}}
  
  // Process external log (skipping header)
  for (var i = 1; i < externalData.length; i++) {
    var rName = externalData[i][13]; // Col N (Round Name) - Updated index for 15-col structure
    if (rName !== roundName) continue;
    
    var cName = externalData[i][2] ? normalizeArabic_(externalData[i][2]) : ''; // Col C
    var dSession = externalData[i][3] ? externalData[i][3].toString().trim().replace(" ", "_") : ''; // Col D (Normalize "Day 01" to "Day_01")
    
    if (!cName || !dSession) continue;
    
    if (!logMap[cName]) logMap[cName] = {};
    logMap[cName][dSession] = {
      mentor: externalData[i][1] || '',       // Col B
      status: externalData[i][4] || '',       // Col E
      achievements: externalData[i][5] || '', // Col F
      actions: externalData[i][6] || '',      // Col G
      prodScore: externalData[i][7] || '',    // Col H
      opsScore: externalData[i][8] || '',     // Col I
      salesScore: externalData[i][9] || '',   // Col J
      mktScore: externalData[i][10] || '',    // Col K
      finScore: externalData[i][11] || '',    // Col L
      score: externalData[i][12] || ''        // Col M
    };
  }
  
  // 2. Fetch local follow-up data for file links
  var data = sh.getRange(4, 2, 300, 17).getValues(); 
  var assignedCompanies = getCompaniesForMentor(mentorName, roundId);
  var results = [];
  
  for (var i = 0; i < data.length; i++) {
    var companyName = data[i][0]; // Col B
    if (!companyName || !companyName.toString().trim()) continue;
    
    var companyStr = companyName.toString().trim();
    var sessions = [];
    var companyKey = normalizeArabic_(companyStr);
    
    // Sessions: 1 (D,E,F), 2 (G,H,I), 3 (J,K,L), 4 (M,N,O), 5 (P,Q,R)
    var sessionCols = [2, 5, 8, 11, 14];
    for (var s = 0; s < sessionCols.length; s++) {
      var dayKey = 'Day_0' + (s + 1);
      var logEntry = (logMap[companyKey] && logMap[companyKey][dayKey]) ? logMap[companyKey][dayKey] : null;
      
      var startIdx = sessionCols[s];
      sessions.push({
        num: s + 1,
        mentor: logEntry ? logEntry.mentor : '',
        status: logEntry ? logEntry.status : '',
        achievements: logEntry ? logEntry.achievements : '',
        actions: logEntry ? logEntry.actions : (data[i][startIdx] || ''),
        prodScore: logEntry ? logEntry.prodScore : '',
        opsScore: logEntry ? logEntry.opsScore : '',
        salesScore: logEntry ? logEntry.salesScore : '',
        mktScore: logEntry ? logEntry.mktScore : '',
        finScore: logEntry ? logEntry.finScore : '',
        score: logEntry ? logEntry.score : (data[i][startIdx + 1] || ''),
        file: data[i][startIdx + 2] || '' 
      });
    }
    
    results.push({
      company: companyStr,
      sessions: sessions,
      isAssigned: assignedCompanies.some(function(c) { return c.toLowerCase() === companyStr.toLowerCase(); })
    });
  }
  
  return results;
}

function getAllCompaniesForForm(mentorName, roundId) {
  var ss = SpreadsheetApp.getActive();
  var followUpName = 'Follow up ' + roundId;
  var sh = ss.getSheetByName(followUpName);
  if (!sh) throw new Error('Sheet "' + followUpName + '" not found');
  
  // Limit to 300 rows
  var data = sh.getRange(4, 2, 300, 1).getValues();
  var assigned = getCompaniesForMentor(mentorName, roundId);
  var assignedSet = new Set(assigned.map(function(c){return c.toLowerCase()}));
  
  var all = [];
  var seen = new Set();
  
  // Add assigned first
  for (var i=0; i<assigned.length; i++) {
    var c = assigned[i].toString().trim();
    if (c && !seen.has(c.toLowerCase())) {
      all.push({name: c, isAssigned: true});
      seen.add(c.toLowerCase());
    }
  }
  
  // Add others
  for (var i=0; i<data.length; i++) {
    var c = data[i][0].toString().trim();
    if (c && !seen.has(c.toLowerCase())) {
      all.push({name: c, isAssigned: false});
      seen.add(c.toLowerCase());
    }
  }
  
  return all;
}

function submitFeedback(formData) {
  var settings = getSettings_();
  var ss = SpreadsheetApp.openById(settings.formId);
  var sh = ss.getSheetByName("Form Responses 1");
  if (!sh) throw new Error("Target sheet 'Form Responses 1' not found in external spreadsheet");
  
  var data = sh.getDataRange().getValues();
  var rowIndex = -1;
  var targetCompany = formData.companyName.toLowerCase().trim();
  var targetDay = formData.dayOfSession.trim();
  var targetRound = formData.roundName.trim();

  // Search for existing entry (Round=I(8), Company=C(2), Day=D(3))
  for (var i = data.length - 1; i >= 1; i--) {
    var rName = data[i][8] ? data[i][8].toString().trim() : '';
    var cName = data[i][2] ? data[i][2].toString().trim().toLowerCase() : '';
    var dName = data[i][3] ? data[i][3].toString().trim() : '';

    if (rName === targetRound && cName === targetCompany && dName === targetDay) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    new Date(),               // A
    formData.mentorName,      // B
    formData.companyName,     // C
    formData.dayOfSession,    // D
    formData.currentStatus,   // E
    formData.achievements,    // F
    formData.actionSteps,     // G
    formData.prodScore,       // H
    formData.opsScore,        // I
    formData.salesScore,      // J
    formData.mktScore,        // K
    formData.finScore,        // L
    formData.mentorScore,     // M
    formData.roundName,       // N
    ""                        // O (Any Notes placeholder)
  ];
  
  if (rowIndex > -1) {
    sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  
  return {success: true};
}

function getDiagnoseData(companyName) {
  var settings = getSettings_();
  var ss = SpreadsheetApp.openById(settings.diagnoseId);
  var sh = ss.getSheetByName("Form Responses 1");
  if (!sh) throw new Error("Diagnose sheet 'Form Responses 1' not found");
  
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    var combined = data[i][2]; // Col C
    if (combined && combined.toString().toLowerCase().startsWith(companyName.toLowerCase() + " \\")) {
      return {
        mentorName: data[i][1], // B
        companyCombined: data[i][2], // C
        history: data[i][3], // D
        mainComplaint: data[i][4], // E
        symptoms: data[i][5], // F
        signs: data[i][6], // G
        expertNotes: data[i][7], // H
        possibleCauses: data[i][8], // I
        tests: data[i][9], // J
        actualCause: data[i][10], // K
        solutionPlan: data[i][11] // L
      };
    }
  }
  return null;
}

function submitDiagnose(formData) {
  var settings = getSettings_();
  var ss = SpreadsheetApp.openById(settings.diagnoseId);
  var sh = ss.getSheetByName("Form Responses 1");
  if (!sh) throw new Error("Diagnose sheet 'Form Responses 1' not found");
  
  var data = sh.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    var combined = data[i][2]; // Col C
    if (combined && combined.toString().toLowerCase().startsWith(formData.companyName.toLowerCase() + " \\")) {
      rowIndex = i + 1;
      break;
    }
  }
  
  var row = [
    new Date(),               // A
    formData.mentorName,      // B
    formData.companyCombined, // C
    formData.history,         // D
    formData.mainComplaint,   // E
     formData.symptoms,        // F
     formData.signs,           // G
     formData.expertNotes,     // H
     formData.possibleCauses,  // I
     formData.tests,           // J
     formData.actualCause,     // K
     formData.solutionPlan     // L
   ];
  
  if (rowIndex > -1) {
    sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  return {success: true};
}

function getInitialAppLoad(mentorName, companyName, roundId) {
  // Fix: Always call getCompanyDetails to get the currently selected startup in the sheet
  var details = getCompanyDetails(mentorName, companyName, roundId);
  var allCompanies = getAllCompaniesForForm(mentorName, roundId);
  
  return {
    details: details,
    allCompanies: allCompanies
  };
}

function getAppData(mentorName, companyName, roundId) {
  var mentors = getMentors(roundId);
  var details = companyName ? getCompanyDetails(mentorName, companyName, roundId) : null;
  var followUp = getFollowUpData(mentorName, roundId);
  var allCompanies = getAllCompaniesForForm(mentorName, roundId);
  
  return {
    mentors: mentors,
    details: details,
    followUp: followUp,
    allCompanies: allCompanies
  };
}

function updateFollowupSession(roundId, companyName, sessionNum, status, achievements, actions, prodScore, opsScore, salesScore, mktScore, finScore, score) {
  var settings = getSettings_();
  var externalSS = SpreadsheetApp.openById(settings.formId);
  var externalSh = externalSS.getSheetByName("Form Responses 1");
  var data = externalSh.getDataRange().getValues();
  
  var roundName = roundId.replace('R_', 'Round_');
  var dayName = 'Day_0' + sessionNum;
  var targetCompany = companyName.toLowerCase();
  
  var rowIndex = -1;
  // Search backwards to find the latest entry
  for (var i = data.length - 1; i >= 1; i--) {
     var rName = data[i][8]; // Col I
     var cName = data[i][2] ? data[i][2].toString().trim().toLowerCase() : '';
     var dName = data[i][3] ? data[i][3].toString().trim() : '';
     
     if (rName === roundName && cName === targetCompany && dName === dayName) {
       rowIndex = i + 1;
       break;
     }
  }
  
  if (rowIndex === -1) throw new Error('Existing report entry not found in "Form Responses 1"');
  
  // Update Column E(5), F(6), G(7), H(8), I(9), J(10), K(11), L(12), M(13)
  externalSh.getRange(rowIndex, 5).setValue(status);
  externalSh.getRange(rowIndex, 6).setValue(achievements);
  externalSh.getRange(rowIndex, 7).setValue(actions);
  externalSh.getRange(rowIndex, 8).setValue(prodScore);
  externalSh.getRange(rowIndex, 9).setValue(opsScore);
  externalSh.getRange(rowIndex, 10).setValue(salesScore);
  externalSh.getRange(rowIndex, 11).setValue(mktScore);
  externalSh.getRange(rowIndex, 12).setValue(finScore);
  externalSh.getRange(rowIndex, 13).setValue(score);
  
  return { success: true };
}

function getSheet_(sheetName) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet "'+sheetName+'" not found');
  return sh;
}

function findMentorColumn_(sh, mentorName) {
  var lastCol = sh.getLastColumn();
  if (lastCol < 3) throw new Error('No mentor columns found');
  var row = sh.getRange(2, 3, 1, lastCol - 2).getValues()[0];
  var target = mentorName.toString().trim().toLowerCase();
  for (var i=0;i<row.length;i++){
    var val = row[i] && row[i].toString().trim() ? row[i].toString().trim() : '';
    if (val && val.toLowerCase() === target) return 3 + i;
  }
  throw new Error('Mentor column not found');
}

/**
 * ADMIN FUNCTIONS
 */

function validateAdminLogin(user, pass) {
  if (user === 'athar' && pass === 'athar2026') return { ok: true };
  throw new Error('Invalid Admin Credentials');
}

function updateSettings(formId, diagnoseId, devPass) {
  if (devPass !== 'hzzz3m') throw new Error('Invalid Developer Password');
  var props = PropertiesService.getScriptProperties();
  props.setProperty('FORM_SS_ID', formId);
  props.setProperty('DIAGNOSE_SS_ID', diagnoseId);
  return { success: true };
}

function getAdminStats() {
  var settings = getSettings_();
  var rounds = getRounds(true);
  var mentorStats = {}; // {name: {reports:0, diagnoses:0, rounds:[], companies: {}}}
  
  // 1. Get Mentors per Round
  rounds.forEach(function(r) {
    try {
      var sh = getSheet_(r.id);
      var lastCol = sh.getLastColumn();
      if (lastCol < 3) return;
      var row = sh.getRange(2, 3, 1, lastCol - 2).getValues()[0];
      row.forEach(function(m) {
        var name = m && m.toString().trim();
        if (name) {
          if (!mentorStats[name]) mentorStats[name] = { reports: 0, diagnoses: 0, rounds: [], companies: {} };
          if (mentorStats[name].rounds.indexOf(r.label) === -1) mentorStats[name].rounds.push(r.label);
        }
      });
    } catch(e) {}
  });

  // 2. Count Reports & Map Companies
  try {
    var ssForm = SpreadsheetApp.openById(settings.formId);
    var shForm = ssForm.getSheetByName("Form Responses 1");
    var dataForm = shForm.getDataRange().getValues();
    for (var i = 1; i < dataForm.length; i++) {
      var mName = dataForm[i][1] ? dataForm[i][1].toString().trim() : '';
      var cName = dataForm[i][2] ? dataForm[i][2].toString().trim() : '';
      
      if (mName) {
        if (!mentorStats[mName]) mentorStats[mName] = { reports: 0, diagnoses: 0, rounds: ['Historical'], companies: {} };
        mentorStats[mName].reports++;
        
        if (cName) {
          if (!mentorStats[mName].companies[cName]) mentorStats[mName].companies[cName] = { reports: 0, lastDiagnose: null };
          mentorStats[mName].companies[cName].reports++;
        }
      }
    }
  } catch(e) {}

  // 3. Count Diagnoses & Track Last Date
  try {
    var ssDiag = SpreadsheetApp.openById(settings.diagnoseId);
    var shDiag = ssDiag.getSheetByName("Form Responses 1");
    var dataDiag = shDiag.getDataRange().getValues();
    for (var i = 1; i < dataDiag.length; i++) {
        var timestamp = dataDiag[i][0];
        var mName = dataDiag[i][1] ? dataDiag[i][1].toString().trim() : '';
        var rawCompany = dataDiag[i][2] ? dataDiag[i][2].toString().trim() : '';
        var cName = rawCompany.split(' \\ ')[0].trim();
        
        if (mName) {
            if (!mentorStats[mName]) mentorStats[mName] = { reports: 0, diagnoses: 0, rounds: ['Historical'], companies: {} };
            mentorStats[mName].diagnoses++;
            
            if (cName) {
                if (!mentorStats[mName].companies[cName]) mentorStats[mName].companies[cName] = { reports: 0, lastDiagnose: null };
                
                var currentLast = mentorStats[mName].companies[cName].lastDiagnose;
                if (!currentLast || new Date(timestamp) > new Date(currentLast)) {
                    mentorStats[mName].companies[cName].lastDiagnose = timestamp;
                }
            }
        }
    }
  } catch(e) {}

  var props = PropertiesService.getScriptProperties();
  var disabled = JSON.parse(props.getProperty('DISABLED_ROUNDS') || '{}');
  var pins = {};
  Object.keys(mentorStats).forEach(function(m) {
    pins[m] = props.getProperty('PIN_' + m) || '';
  });

  return {
    settings: settings,
    totalMentors: Object.keys(mentorStats).length,
    mentors: mentorStats,
    mentorPins: pins,
    disabledRounds: disabled,
    rounds: rounds, // Include all rounds for management
    reportUrl: 'https://docs.google.com/spreadsheets/d/' + settings.formId,
    diagnoseUrl: 'https://docs.google.com/spreadsheets/d/' + settings.diagnoseId
  };
}

function updateMentorPin(name, pin) {
  if (!name) return;
  var props = PropertiesService.getScriptProperties();
  if (pin && pin.trim() !== '') {
    props.setProperty('PIN_' + name.trim(), pin.trim());
  } else {
    props.deleteProperty('PIN_' + name.trim());
  }
  return { success: true };
}

function toggleRoundStatus(roundId, isActive) {
  var props = PropertiesService.getScriptProperties();
  var disabled = JSON.parse(props.getProperty('DISABLED_ROUNDS') || '{}');
  if (isActive) {
    delete disabled[roundId];
  } else {
    disabled[roundId] = true;
  }
  props.setProperty('DISABLED_ROUNDS', JSON.stringify(disabled));
  return { success: true };
}

function normalizeArabic_(str) {
  if (!str) return "";
  return str.toString()
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
}