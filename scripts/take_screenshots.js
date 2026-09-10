const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const brainDirs = [
  'C:\\Users\\jivin\\.gemini\\antigravity\\brain\\f29da8f7-11aa-42b8-9021-0baa05030dba',
  'C:\\Users\\jivin\\.gemini\\antigravity\\brain\\80dafb8b-2950-454e-8384-1538565fd8da',
  'C:\\Users\\jivin\\.gemini\\antigravity\\brain\\9ea80b68-d690-4ac4-9939-187f3a8dcea0',
  path.join(__dirname, '..')
];

function capture(url, filename, width, height) {
  for (const bDir of brainDirs) {
    if (fs.existsSync(bDir)) {
      const outPath = path.join(bDir, filename);
      try {
        cp.execSync(`"${chromePath}" --headless --disable-gpu --window-size=${width},${height} --virtual-time-budget=7000 --screenshot="${outPath}" "${url}"`, { stdio: 'ignore' });
        console.log(`Saved: ${filename} -> ${outPath}`);
      } catch (err) {
        console.error(`Error saving ${filename}:`, err.message);
      }
    }
  }
}

if (fs.existsSync(chromePath)) {
  console.log('Using Chrome at:', chromePath);

  // 1. Pearl Health Landing Desktop (1440x1100)
  capture('http://localhost:3000', 'veracity_pearl_health_desktop.png', 1440, 1100);

  // 2. Pearl Health Landing Mobile (390x844)
  capture('http://localhost:3000', 'veracity_pearl_health_mobile.png', 390, 844);

  // 3. Tabler OT Dashboard (1440x1200)
  capture('http://localhost:3000/?view=dashboard', 'veracity_tabler_dashboard.png', 1440, 1200);

  // 4. Patient Pre-Op Medical Questionnaire (1200x1200)
  capture('http://localhost:3000/?view=questionnaire', 'veracity_patient_questionnaire.png', 1200, 1200);

  // 5. In-OT Mobile Blood View (420x900)
  capture('http://localhost:3000/?view=blood', 'veracity_mobile_blood_view.png', 420, 900);

  // 6. Standalone Terranova 5-File Suite (1440x900)
  capture('http://localhost:3000/?view=terranova', 'veracity_terranova_standalone.png', 1440, 900);

} else {
  console.error('Chrome executable not found at:', chromePath);
}
