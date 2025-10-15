// Test fixture: Command injection
// Should trigger: command-injection

const { exec, execSync } = require('child_process');

function pingHost(host) {
  exec(`ping -c 1 ${host}`, (err, stdout) => {
    console.log(stdout);
  });
}

function processFile(filename) {
  const result = execSync(`cat ${filename}`);
  return result.toString();
}

module.exports = { pingHost, processFile };
