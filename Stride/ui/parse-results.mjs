import fs from 'fs';
const data = JSON.parse(fs.readFileSync('e2e-results2.json', 'utf8'));

function extractSpecs(suite) {
  let results = [];
  if (suite.specs) {
    for (const spec of suite.specs) {
      const tests = spec.tests ? spec.tests : [];
      for (const test of tests) {
        const testResults = test.results ? test.results : [];
        for (const result of testResults) {
          if (result.status !== 'passed') {
            results.push({
              title: spec.title,
              file: spec.file,
              line: spec.line,
              status: result.status,
              error: result.error ? result.error.message.substring(0, 400) : 'No error msg'
            });
          }
        }
      }
    }
  }
  const subSuites = suite.suites ? suite.suites : [];
  for (const s of subSuites) {
    results = results.concat(extractSpecs(s));
  }
  return results;
}

let allFailed = [];
for (const suite of data.suites) {
  allFailed = allFailed.concat(extractSpecs(suite));
}

console.log('Total failed:', allFailed.length);
console.log('Total passed (from stats):', data.stats.expected);

const errorGroups = {};
for (const f of allFailed) {
  const key = f.error.replace(/locator\.[a-zA-Z]+\(/g, 'locator.X(').substring(0, 120);
  if (!errorGroups[key]) errorGroups[key] = [];
  errorGroups[key].push(f);
}
for (const [pattern, tests] of Object.entries(errorGroups)) {
  console.log('\n=== ERROR PATTERN (' + tests.length + ' tests) ===');
  console.log('Error: ' + tests[0].error.substring(0, 350));
  console.log('Affected tests:');
  for (const t of tests.slice(0, 10)) {
    console.log('  - [' + t.status + '] ' + t.file + ':' + t.line + ' | ' + t.title);
  }
  if (tests.length > 10) console.log('  ... and ' + (tests.length - 10) + ' more');
}
