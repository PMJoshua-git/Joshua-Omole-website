import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Pre-deploy API module resolution check (prevents ERR_MODULE_NOT_FOUND)', async () => {
  const apiDir = path.resolve(process.cwd(), 'api');
  const findApiFiles = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findApiFiles(fullPath));
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
        !entry.name.endsWith('.d.ts')
      ) {
        results.push(fullPath);
      }
    }
    return results;
  };

  const apiFiles = findApiFiles(apiDir);
  assert.ok(apiFiles.length > 0, 'Should find API route files');

  for (const file of apiFiles) {
    const rel = path.relative(process.cwd(), file);
    try {
      // Dynamic import test to catch any missing relative imports or compile issues
      const mod = await import(`../${rel}`);
      assert.ok(mod, `API module ${rel} should import successfully`);
      if (typeof mod.default === 'function') {
        // Mock request & response to test handler execution without throwing module errors
        let statusCode = 200;
        let bodySent: any = null;
        const mockReq = { method: 'GET', url: '/', query: {} };
        const mockRes = {
          status(code: number) {
            statusCode = code;
            return mockRes;
          },
          json(data: any) {
            bodySent = data;
            return mockRes;
          },
          send(data: any) {
            bodySent = data;
            return mockRes;
          },
          setHeader() {},
          end() {},
        };

        // Invoke handler to verify no runtime module resolution crashes
        await mod.default(mockReq, mockRes);
      }
    } catch (err: any) {
      assert.fail(`API route ${rel} failed module import or execution: ${err?.message || err}`);
    }
  }
});
