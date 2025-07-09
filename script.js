// script.js

// Function to enable/disable the "Other" text input based on radio button selection
function toggleOtherTimepoint(enable) {
  const otherTimepointText = document.getElementById('otherTimepointText');
  otherTimepointText.disabled = !enable;
  if (!enable) {
    otherTimepointText.value = ''; // Clear text if "Other" is deselected
  }
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
    } else if (
      surgicalForm === 'gross' ||
      diskPerforation === 'present' ||
      osteophytes ||
      adhesions === 'degenerative'
    ) {
      surgicalStage = 'Wilkes Stage V';
    }
  }

  document.getElementById('clinicalResult').innerText = 'Clinical Staging: ' + (clinicalStage || 'Insufficient data');
  document.getElementById('radiologicResult').innerText = 'Radiologic Staging: ' + (radiologicStage || 'Insufficient data');
  document.getElementById('surgicalResult').innerText = 'Surgical Staging: ' + (surgicalStage || 'Insufficient data');
}

function downloadPDF() {
  if (!(window.jspdf && window.jspdf.jsPDF)) {
    // Use a custom message box instead of alert()
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background-color: white; padding: 20px; border: 1px solid #ccc;
      box-shadow: 0 0 10px rgba(0,0,0,0.1); z-index: 1000; border-radius: 8px;
      text-align: center;
    `;
    messageBox.innerHTML = `
      <p>jsPDF not loaded. Please check your internet connection.</p>
      <button onclick="this.parentNode.remove()">OK</button>
    `;
    document.body.appendChild(messageBox);
    return;
  }
  const doc = new window.jspdf.jsPDF();
  const form = document.forms['wilkesForm'];
  let y = 20;

  // Patient Information
  const name = form['patientName']?.value || '';
  const age = form['age']?.value || '';
  const gender = form['gender']?.value || '';
  const date = form['examDate']?.value || '';

  // Get selected timepoint for radio buttons
  const selectedTimepointRadio = form['evaluationTimepointRadio'];
  let timepointValue = '';
  if (selectedTimepointRadio) {
    for (const radio of selectedTimepointRadio) {
      if (radio.checked) {
        timepointValue = radio.value;
        if (timepointValue === 'Other') {
          const otherText = form['otherTimepointText']?.value;
          timepointValue = `Other: ${otherText || '(not specified)'}`;
        }
        break;
      }
    }
  }

  doc.setFontSize(12);
  doc.text(`Patient Information:`, 10, y);
  doc.text(`Name: ${name}`, 10, y += 10);
  doc.text(`Age: ${age}`, 10, y += 10);
  doc.text(`Gender: ${gender}`, 10, y += 10);
  doc.text(`Date of Exam: ${date}`, 10, y += 10);
  doc.text(`Evaluation Time Point: ${timepointValue || 'Not Selected'}`, 10, y += 10);

  // Clinical Findings
  const reciprocalClick = form['reciprocalClick']?.checked ? 'Yes' : 'No';
  const clickingTiming = form['clickingTiming']?.value || '';
  const clickingIntensity = form['clickingIntensity']?.value || '';
  const painPresence = form['painPresence']?.value || '';
  const limitationMotion = form['limitationMotion']?.value || '';
  const crepitus = form['crepitus']?.checked ? 'Yes' : 'No';
  doc.text(``, 10, y += 10);
  doc.text(`Clinical Findings:`, 10, y += 10);
  doc.text(`Reciprocal Click: ${reciprocalClick}`, 10, y += 10);
  doc.text(`Clicking Timing: ${clickingTiming}`, 10, y += 10);
  doc.text(`Clicking Intensity: ${clickingIntensity}`, 10, y += 10);
  doc.text(`Pain Presence: ${painPresence}`, 10, y += 10);
  doc.text(`Limitation of Motion: ${limitationMotion}`, 10, y += 10);
  doc.text(`Crepitus: ${crepitus}`, 10, y += 10);

  // Radiologic Findings
  const diskDisplacement = form['diskDisplacement']?.value || '';
  const diskMorphology = form['diskMorphology']?.value || '';
  const hardTissueChanges = form['hardTissueChanges']?.value || '';
  doc.text(``, 10, y += 10);
  doc.text(`Radiologic Findings:`, 10, y += 10);
  doc.text(`Disk Displacement: ${diskDisplacement}`, 10, y += 10);
  doc.text(`Disk Morphology: ${diskMorphology}`, 10, y += 10);
  doc.text(`Hard-Tissue Changes: ${hardTissueChanges}`, 10, y += 10);

  // Surgical Findings
  const diskSurgicalForm = form['diskSurgicalForm']?.value || '';
  const adhesions = form['adhesions']?.value || '';
  const osteophytes = form['osteophytes']?.checked ? 'Yes' : 'No';
  const diskPerforation = form['diskPerforation']?.value || '';
  doc.text(``, 10, y += 10);
  doc.text(`Surgical Findings:`, 10, y += 10);
  doc.text(`Disk Form (Surgical): ${diskSurgicalForm}`, 10, y += 10);
  doc.text(`Adhesions: ${adhesions}`, 10, y += 10);
  doc.text(`Osteophytic Projections: ${osteophytes}`, 10, y += 10);
  doc.text(`Disk Perforation: ${diskPerforation}`, 10, y += 10);

  // Results
  const clinicalResult = document.getElementById('clinicalResult').innerText;
  const radiologicResult = document.getElementById('radiologicResult').innerText;
  const surgicalResult = document.getElementById('surgicalResult').innerText;
  doc.text(``, 10, y += 10);
  doc.text(clinicalResult, 10, y += 10);
  doc.text(radiologicResult, 10, y += 10);
  doc.text(surgicalResult, 10, y += 10);

  doc.save(`${name || 'Wilkes_Staging'}_Result.pdf`);
}
