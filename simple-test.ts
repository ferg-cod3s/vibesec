#!/usr/bin/env bun

import { test, expect } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

test('simple verification test', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    await fs.writeFile(path.join(tempDir, 'test.js'), 'console.log("test");');
    
    const files = await fs.readdir(tempDir);
    expect(files).toContain('test.js');
    
    await fs.rm(tempDir, { recursive: true });
    console.log('✅ Simple test passed');
});

console.log('Test complete');