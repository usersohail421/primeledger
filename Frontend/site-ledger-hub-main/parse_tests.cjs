const fs = require('fs');
const data = JSON.parse(fs.readFileSync('vitest_report.json', 'utf8'));
data.testResults.forEach(r => {
  r.assertionResults.filter(a => a.status === 'failed').forEach(f => {
    console.log("File:", r.name);
    console.log("Test:", f.title);
    console.log("Error:", f.failureMessages[0]);
    console.log("---");
  });
});
