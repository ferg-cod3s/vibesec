import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Generate a test corpus of JavaScript files with varying sizes
 * Creates 1,000 files for benchmarking
 */
export async function generateTestCorpus(outputDir: string, count: number = 1000) {
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Generating ${count} test JavaScript files...`);

  const templates = [
    // Simple function
    `export function process${i}(data) {
  const result = data.map(item => ({ id: item.id, name: item.name }));
  return result;
}`,

    // Potential secrets (intentional for testing)
    `const config = {
  api_key: "sk_test_${randomHex(32)}",
  password: "secure123",
  token: "token_${randomHex(20)}"
};`,

    // SQL query with template string
    `async function getUser(id) {
  const query = \`SELECT * FROM users WHERE id = \${id}\`;
  return db.query(query);
}`,

    // Class definition
    `class UserService {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    return this.db.users.find(id);
  }

  async create(userData) {
    return this.db.users.insert(userData);
  }
}`,

    // Complex function with multiple detectable patterns
    `function authenticateUser(username, password) {
  const sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const result = executeQuery(sql);
  console.log("Auth attempt with username: " + username);
  return result;
}`,

    // async/await patterns
    `async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Request failed", error);
    return null;
  }
}`,
  ];

  for (let i = 0; i < count; i++) {
    const templateIndex = i % templates.length;
    const template = templates[templateIndex];
    const filename = `test-${String(i).padStart(4, '0')}.js`;
    const content = `// Generated test file ${i}
${template.replace(/\${i}/g, String(i))}

// Additional padding content
${generatePaddingCode(50)}
`;

    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, content);

    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${count} files`);
    }
  }

  console.log(`Corpus generation complete: ${count} files in ${outputDir}`);
}

function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePaddingCode(lines: number): string {
  const padding = [];
  for (let i = 0; i < lines; i++) {
    padding.push(`// Padding line ${i}: ${randomHex(30)}`);
  }
  return padding.join('\n');
}

// Run if executed directly
if (import.meta.main) {
  const outputDir = process.argv[2] || './poc/fixtures/corpus';
  const count = parseInt(process.argv[3] || '100', 10);
  await generateTestCorpus(outputDir, count);
}

export default generateTestCorpus;
