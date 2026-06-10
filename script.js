// script.js - WILKES STAGING TOOL WITH GOOGLE SHEETS SAVING

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3mDwieZwFfwcvAwPs7yCBHJ6TXTSdeQpll7lOKc8pQT0K6SZQtWeFVv8H47dcwunTyw/exec';

function toggleOtherTimepoint(enable) {
  const otherTimepointText = document.getElementById('otherTimepointText');
  otherTimepointText.disabled = !enable;
  if (!enable) otherTimepointText.value = '';
}

function evaluateStages() {
  const form = document.forms['wilkesForm'];

  let clinicalStage = '';
  let radiologicStage = '';
  let surgicalStage = '';

  const reciprocalClick = form['reciprocalClick']?.checked;
  const painPresence = form['painPresence']?.value;
  const limitationMotion = form['limitationMotion']?.value;
  const crepitus = form['crepitus']?.checked;

  if (reciprocalClick && painPresence === 'few' && limitationMotion === 'none') {
    clinicalStage = 'Wilkes Stage I or II';
  } else if (crepitus || painPresence === 'multiple' || limitationMotion === 'restriction') {
    clinicalStage = 'Wilkes Stage III or IV';
  } else if (limitationMotion === 'chronic') {
    clinicalStage = 'Wilkes Stage V';
  }

  const displacement = form['diskDisplacement']?.value;
  const morphology = form['diskMorphology']?.value;
  const hardTissue = form['hardTissueChanges']?.value;

  if (displacement && morphology && hardTissue) {
    if (displacement === 'slightForward' && morphology === 'good' && hardTissue === 'early') {
      radiologicStage = 'Wilkes Stage I or II';
    } else if (morphology === 'significant' || morphology === 'moderate') {
      radiologicStage = 'Wilkes Stage III or IV';
    } else if (hardTissue === 'advanced' || morphology === 'gross') {
      radiologicStage = 'Wilkes Stage V';
    }
  }

  const surgicalForm = form['diskSurgicalForm']?.value;
  const adhesions = form['adhesions']?.value;
  const osteophytes = form['osteophytes']?.checked;
  const diskPerforation = form['diskPerforation']?.value;

  if (surgicalForm || adhesions || osteophytes || diskPerforation) {
    if (surgicalForm === 'normal' && !osteophytes && diskPerforation === 'none') {
      surgicalStage = 'Wilkes Stage I or II';
    } else if (surgicalForm === 'marked' || adhesions === 'multiple') {
      surgicalStage = 'Wilkes Stage III or IV';
    } else if (surgicalForm === 'gross' || diskPerforation === 'present' || osteophytes || adhesions === 'degenerative') {
      surgicalStage = 'Wilkes Stage V';
    }
  }

  document.getElementById('clinicalResult').innerText = 'Clinical Staging: ' + (clinicalStage || 'Insufficient data');
  document.getElementById('radiologicResult').innerText = 'Radiologic Staging: ' + (radiologicStage || 'Insufficient data');
  document.getElementById('surgicalResult').innerText = 'Surgical Staging: ' + (surgicalStage || 'Insufficient data');

  // Store results for saving
  window._wilkesResults = { clinicalStage, radiologicStage, surgicalStage };
}

async function saveToSheets() {
  const form = document.forms['wilkesForm'];
  if (!form) { showCustomMessageBox('Form not found.'); return; }

  // Run evaluation first to ensure results are up to date
  evaluateStages();

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

  try {
    // Get evaluation timepoint
    let evalTime = '';
    const radios = form['evaluationTimepointRadio'];
    if (radios) {
      for (const r of radios) {
        if (r.checked) {
          evalTime = r.value;
          if (evalTime === 'Other') {
            evalTime = 'Other: ' + (form['otherTimepointText']?.value || '');
          }
          break;
        }
      }
    }

    const results = window._wilkesResults || {};

    const payload = {
      type: 'Wilkes',
      patientName: form['patientName']?.value || '',
      age: form['age']?.value || '',
      gender: form['gender']?.value || '',
      examDate: form['examDate']?.value || '',
      evalTime: evalTime,
      reciprocalClick: form['reciprocalClick']?.checked ? 'Yes' : 'No',
      clickingTiming: form['clickingTiming']?.value || '',
      clickingIntensity: form['clickingIntensity']?.value || '',
      painPresence: form['painPresence']?.value || '',
      limitationMotion: form['limitationMotion']?.value || '',
      crepitus: form['crepitus']?.checked ? 'Yes' : 'No',
      diskDisplacement: form['diskDisplacement']?.value || '',
      diskMorphology: form['diskMorphology']?.value || '',
      hardTissueChanges: form['hardTissueChanges']?.value || '',
      diskSurgicalForm: form['diskSurgicalForm']?.value || '',
      adhesions: form['adhesions']?.value || '',
      osteophytes: form['osteophytes']?.checked ? 'Yes' : 'No',
      diskPerforation: form['diskPerforation']?.value || '',
      clinicalStage: results.clinicalStage || '',
      radiologicStage: results.radiologicStage || '',
      surgicalStage: results.surgicalStage || ''
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status === 'success') {
      showCustomMessageBox('\u2705 Data saved to Google Sheets successfully!');
    } else {
      showCustomMessageBox('\u274c Error: ' + (result.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Save error:', err);
    showCustomMessageBox('\u274c Failed to save. Check your internet connection.');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save to Google Sheets'; }
  }
}

function showCustomMessageBox(message) {
  const existing = document.querySelector('.message-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'message-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;';
  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;padding:20px;border-radius:8px;max-width:90%;width:420px;box-shadow:0 8px 30px rgba(0,0,0,0.2);font-family:sans-serif;color:#111;';
  const p = document.createElement('p');
  p.textContent = message;
  p.style.cssText = 'margin-bottom:18px;font-size:1rem;line-height:1.4;';
  const btn = document.createElement('button');
  btn.textContent = 'OK';
  btn.style.cssText = 'padding:10px 18px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer;';
  btn.addEventListener('click', () => overlay.remove());
  box.appendChild(p); box.appendChild(btn);
  overlay.appendChild(box); document.body.appendChild(overlay);
}

function downloadPDF() {
  if (!(window.jspdf && window.jspdf.jsPDF)) {
    showCustomMessageBox('jsPDF not loaded. Please check your internet connection.');
    return;
  }
  const doc = new window.jspdf.jsPDF();
  const form = document.forms['wilkesForm'];
  let y = 20;

  const name = form['patientName']?.value || '';
  const age = form['age']?.value || '';
  const gender = form['gender']?.value || '';
  const date = form['examDate']?.value || '';

  let timepointValue = '';
  const selectedTimepointRadio = form['evaluationTimepointRadio'];
  if (selectedTimepointRadio) {
    for (const radio of selectedTimepointRadio) {
      if (radio.checked) {
        timepointValue = radio.value;
        if (timepointValue === 'Other') {
          timepointValue = `Other: ${form['otherTimepointText']?.value || '(not specified)'}`;
        }
        break;
      }
    }
  }

  doc.setFontSize(12);
  doc.text('Patient Information:', 10, y);
  doc.text(`Name: ${name}`, 10, y += 10);
  doc.text(`Age: ${age}`, 10, y += 10);
  doc.text(`Gender: ${gender}`, 10, y += 10);
  doc.text(`Date of Exam: ${date}`, 10, y += 10);
  doc.text(`Evaluation Time Point: ${timepointValue || 'Not Selected'}`, 10, y += 10);

  doc.text('', 10, y += 10);
  doc.text('Clinical Findings:', 10, y += 10);
  doc.text(`Reciprocal Click: ${form['reciprocalClick']?.checked ? 'Yes' : 'No'}`, 10, y += 10);
  doc.text(`Clicking Timing: ${form['clickingTiming']?.value || ''}`, 10, y += 10);
  doc.text(`Clicking Intensity: ${form['clickingIntensity']?.value || ''}`, 10, y += 10);
  doc.text(`Pain Presence: ${form['painPresence']?.value || ''}`, 10, y += 10);
  doc.text(`Limitation of Motion: ${form['limitationMotion']?.value || ''}`, 10, y += 10);
  doc.text(`Crepitus: ${form['crepitus']?.checked ? 'Yes' : 'No'}`, 10, y += 10);

  doc.text('', 10, y += 10);
  doc.text('Radiologic Findings:', 10, y += 10);
  doc.text(`Disk Displacement: ${form['diskDisplacement']?.value || ''}`, 10, y += 10);
  doc.text(`Disk Morphology: ${form['diskMorphology']?.value || ''}`, 10, y += 10);
  doc.text(`Hard-Tissue Changes: ${form['hardTissueChanges']?.value || ''}`, 10, y += 10);

  doc.text('', 10, y += 10);
  doc.text('Surgical Findings:', 10, y += 10);
  doc.text(`Disk Form: ${form['diskSurgicalForm']?.value || ''}`, 10, y += 10);
  doc.text(`Adhesions: ${form['adhesions']?.value || ''}`, 10, y += 10);
  doc.text(`Osteophytic Projections: ${form['osteophytes']?.checked ? 'Yes' : 'No'}`, 10, y += 10);
  doc.text(`Disk Perforation: ${form['diskPerforation']?.value || ''}`, 10, y += 10);

  doc.text('', 10, y += 10);
  doc.text(document.getElementById('clinicalResult').innerText, 10, y += 10);
  doc.text(document.getElementById('radiologicResult').innerText, 10, y += 10);
  doc.text(document.getElementById('surgicalResult').innerText, 10, y += 10);

  doc.save(`${name || 'Wilkes_Staging'}_Result.pdf`);
}
