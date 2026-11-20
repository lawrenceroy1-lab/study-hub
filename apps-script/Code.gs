/**
 * Tutoring score collector.
 * Receives scores from the student pages and adds one row per result to the "Scores" tab.
 * Paste this whole file into Extensions > Apps Script in your Google Sheet.
 */
var SHEET_NAME = 'Scores';
var HEADERS = ['Date and time', 'Student', 'Week', 'Activity', 'Score', 'Total', 'Time taken (seconds)', 'Words or questions missed', 'ID'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var rows = Array.isArray(data) ? data : [data];
    var sheet = getSheet_();
    var seen = recentIds_(sheet);
    rows.forEach(function (r) {
      if (!r || !r.id || seen[r.id]) return;           // skip duplicates
      sheet.appendRow([
        clean_(r.time), clean_(r.student), clean_(r.week), clean_(r.activity),
        Number(r.score) || 0, Number(r.total) || 0, Number(r.seconds) || 0, clean_(r.missed), clean_(r.id)
      ]);
      seen[r.id] = true;
    });
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

/* Lets you check the web app is live by opening its URL in a browser. */
function doGet() {
  return ContentService.createTextOutput('Score collector is running.');
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function recentIds_(sheet) {
  var seen = {};
  var last = sheet.getLastRow();
  if (last < 2) return seen;
  var start = Math.max(2, last - 1000);
  sheet.getRange(start, 9, last - start + 1, 1).getValues().forEach(function (v) { seen[v[0]] = true; });
  return seen;
}

/* Stops a cell from being read as a formula. */
function clean_(v) {
  var s = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
