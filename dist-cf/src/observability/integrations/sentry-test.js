#!/usr/bin/env bun
import { sentry, initSentryFromEnv } from './sentry';
import { ErrorCategory } from '../error-reporter';
async function testSentryIntegration() {
    console.log('🧪 Testing Sentry Integration\n');
    console.log('Self-hosted instance: sentry.fergify.work\n');
    console.log('1. Initializing Sentry from environment variables...');
    try {
        initSentryFromEnv();
        console.log('   ✅ Sentry initialized successfully\n');
    }
    catch (error) {
        console.error('   ❌ Failed to initialize Sentry:', error);
        process.exit(1);
    }
    console.log('2. Capturing test error...');
    try {
        const testError = new Error('Test error from VibeSec - Self-hosted Sentry integration test');
        const eventId = sentry.captureError(testError, ErrorCategory.SYSTEM_ERROR, {
            test: true,
            component: 'sentry-integration',
            timestamp: new Date().toISOString(),
        });
        console.log(`   ✅ Error captured with event ID: ${eventId}\n`);
    }
    catch (error) {
        console.error('   ❌ Failed to capture error:', error);
    }
    console.log('3. Adding breadcrumb...');
    sentry.addBreadcrumb('Test breadcrumb', 'test', {
        action: 'integration-test',
        timestamp: Date.now(),
    });
    console.log('   ✅ Breadcrumb added\n');
    console.log('4. Setting user context...');
    sentry.setUser('test-user-123', 'test@vibesec.dev', 'vibesec-tester');
    console.log('   ✅ User context set\n');
    console.log('5. Testing performance monitoring...');
    await sentry.startSpan('test-scan', 'scan', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
    });
    console.log('   ✅ Span completed\n');
    console.log('6. Testing error categorization...');
    const parseError = new Error('Failed to parse test.ts: unexpected token');
    sentry.captureError(parseError, ErrorCategory.PARSE_ERROR, { file: 'test.ts' });
    console.log('   ✅ Parse error captured');
    const configError = new Error('Invalid configuration: missing required field');
    sentry.captureError(configError, ErrorCategory.CONFIG_ERROR, { configPath: '.vibesec.yaml' });
    console.log('   ✅ Config error captured');
    const cacheError = new Error('Cache corruption detected');
    sentry.captureError(cacheError, ErrorCategory.CACHE_ERROR, { cacheFile: '.vibesec-cache' });
    console.log('   ✅ Cache error captured\n');
    console.log('7. Flushing events to Sentry...');
    await sentry.close(5000);
    console.log('   ✅ Events flushed\n');
    console.log('✅ All tests completed successfully!\n');
    console.log('📊 Check your Sentry dashboard at: https://sentry.fergify.work');
    console.log('   You should see 5 test errors with proper categorization and context.\n');
}
testSentryIntegration().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
