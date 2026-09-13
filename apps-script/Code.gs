const SPREADSHEET_ID = '11l-WmtmjIuWxGlpcVJQyWXZrn3286S2RYQCbSiIDlgo';
const SHEET_NAME = 'BSAIS 3A';
const FIRST_DATA_ROW = 19;
const COURSE = 'Bachelor of Science in Accounting Information System';

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';

  if (action === 'getSubmittedNames') {
    return json_({
      success: true,
      names: getSubmittedNames_()
    });
  }

  return json_({
    success: true,
    message: 'BSAIS 3A Survey API is running.'
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    return json_(submitSurvey(data));
  } catch (err) {
    return json_({
      success: false,
      message: err.message || String(err)
    });
  }
}

function submitSurvey(data) {
  data = data || {};

  const lastName = clean_(data.lastName);
  const firstName = clean_(data.firstName);
  const middleInitial = clean_(data.middleInitial)
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 1)
    .toUpperCase();

  // Extension is stored without an automatically added period.
  const extensionName = normalizeExtension_(data.extensionName);

  const gender = clean_(data.gender);
  const position = clean_(data.position);
  const regionalCouncil = clean_(data.regionalCouncil);
  const yearLevel = clean_(data.yearLevel);
  const internshipDate = clean_(data.internshipDate);
  const graduationYear = clean_(data.graduationYear);
  const email = clean_(data.email);
  const contactNumber = clean_(data.contactNumber);
  const facebookLink = clean_(data.facebookLink);

  if (!lastName || !firstName || !/^[A-Za-z]$/.test(middleInitial)) {
    throw new Error(
      'Last Name, First Name, and a one-letter Middle Initial are required.'
    );
  }

  if (!gender || !position || !regionalCouncil || !yearLevel) {
    throw new Error('Please complete all required selection fields.');
  }

  if (!/^(1st|2nd|3rd|4th|5th|6th) Year$/.test(yearLevel)) {
    throw new Error('Invalid Year Level.');
  }

  if (!/^09\d{2}-\d{3}-\d{4}$/.test(contactNumber)) {
    throw new Error('Invalid Contact Number. Use 0999-999-9999.');
  }

  if (!/^\d{4}$/.test(graduationYear)) {
    throw new Error('Expected Year of Graduation must be a 4-digit year.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address.');
  }

  const sheet = getSheet_();
  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const row = Math.max(sheet.getLastRow() + 1, FIRST_DATA_ROW);

    // Preserve Google Sheets dropdown/data-validation rules.
    copyDataValidationToNewRow_(sheet, row);

    /*
      Required spreadsheet layout:
      D = Last Name
      E = First Name + Extension Name
      F = Middle Initial
      G = Full Name
    */
    const databaseLastName = lastName;
    const databaseFirstName =
      firstName + (extensionName ? ' ' + extensionName : '');
    const databaseMiddleInitial = middleInitial + '.';

    sheet.getRange(row, 4).setValue(databaseLastName);
    sheet.getRange(row, 5).setValue(databaseFirstName);
    sheet.getRange(row, 6).setValue(databaseMiddleInitial);
    sheet.getRange(row, 7)
      .setFormula('=E' + row + '&" "&F' + row + '&" "&D' + row);

    sheet.getRange(row, 8).setValue(gender);
    sheet.getRange(row, 9).setValue(position);
    sheet.getRange(row, 10).setValue(regionalCouncil);

    // Column K / Local Chapter is intentionally untouched.
    sheet.getRange(row, 12).setValue(COURSE);
    sheet.getRange(row, 13).setValue(yearLevel);
    sheet.getRange(row, 14).setValue(internshipDate);
    sheet.getRange(row, 15).setValue(graduationYear);
    sheet.getRange(row, 16).setValue(email);
    sheet.getRange(row, 17).setValue(contactNumber);
    sheet.getRange(row, 18).setValue(facebookLink);

    SpreadsheetApp.flush();

    sortBSAIS3A_();

    const fullName = sheet.getRange(row, 7).getDisplayValue();
    sendConfirmationEmail_(email, firstName, fullName);

    return {
      success: true,
      message:
        'Your survey was submitted successfully. A confirmation email has been sent to your email address.'
    };
  } finally {
    lock.releaseLock();
  }
}

function copyDataValidationToNewRow_(sheet, targetRow) {
  const width = 16;
  const lastExisting = Math.min(sheet.getLastRow(), targetRow - 1);

  if (lastExisting < FIRST_DATA_ROW) return;

  const candidates = [FIRST_DATA_ROW];

  for (let r = lastExisting; r >= FIRST_DATA_ROW; r--) {
    if (candidates.indexOf(r) === -1) {
      candidates.push(r);
    }
  }

  let source = null;

  for (const r of candidates) {
    const rules = sheet
      .getRange(r, 3, 1, width)
      .getDataValidations()[0];

    if (rules.some(rule => rule !== null)) {
      source = rules;
      break;
    }
  }

  if (source) {
    sheet
      .getRange(targetRow, 3, 1, width)
      .setDataValidations([source]);
  }
}

function getSubmittedNames_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < FIRST_DATA_ROW) {
    return [];
  }

  // Read D:G.
  const values = sheet
    .getRange(
      FIRST_DATA_ROW,
      4,
      lastRow - FIRST_DATA_ROW + 1,
      4
    )
    .getDisplayValues();

  const names = values
    .map(function(row) {
      // Prefer the Full Name formula in G.
      return clean_(row[3]) ||
        [row[1], row[2], row[0]]
          .map(clean_)
          .filter(Boolean)
          .join(' ');
    })
    .filter(Boolean);

  names.sort(function(a, b) {
    return a.localeCompare(b);
  });

  return names;
}

function sortBSAIS3A_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < FIRST_DATA_ROW) return;

  sheet
    .getRange(
      FIRST_DATA_ROW,
      3,
      lastRow - FIRST_DATA_ROW + 1,
      16
    )
    .sort([{ column: 4, ascending: true }]);
}

function sendConfirmationEmail_(email, firstName, fullName) {
  MailApp.sendEmail({
    to: email,
    subject: 'BSAIS 3A Survey Submission Confirmation',
    htmlBody:
      '<p>Hi ' + escapeHtml_(firstName) + ',</p>' +
      '<p>Your BSAIS 3A survey has been successfully submitted.</p>' +
      '<p><b>Name:</b> ' + escapeHtml_(fullName) + '</p>' +
      '<p>Thank you.</p>'
  });
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" was not found.');
  }

  return sheet;
}

function clean_(v) {
  return String(v == null ? '' : v)
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeExtension_(v) {
  // Normalize spaces only; do NOT automatically add a period.
  return clean_(v).replace(/[.]+$/g, '');
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
