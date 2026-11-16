import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const execFileAsync = promisify(execFile);

function collectFiles(dir: string, predicate: (entryPath: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
    send(data: any) {
      res.body = data;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    end() {
      return res;
    },
  };
  return res;
}

test('Pre-deploy API check: TypeScript sources import cleanly and ssr-meta is fail-safe', async () => {
  const apiDir = path.resolve(process.cwd(), 'api');
  const apiFiles = collectFiles(
    apiDir,
    (p) => (p.endsWith('.ts') || p.endsWith('.js')) && !p.endsWith('.d.ts')
  );
  assert.ok(apiFiles.length > 0, 'Should find API route files');

  for (const file of apiFiles) {
    const rel = path.relative(process.cwd(), file);
    const mod = await import(`../${rel}`);
    assert.ok(mod, `API module ${rel} should import successfully`);
    if (typeof mod.default === 'function') {
      const mockReq = { method: 'GET', url: '/', query: {} };
      const mockRes = createMockRes();
      await mod.default(mockReq, mockRes);
      if (rel === path.join('api', 'ssr-meta.ts')) {
        assert.equal(mockRes.statusCode, 200, 'ssr-meta must always return 200');
        assert.match(String(mockRes.body), /<div id="root">/);
      }
    }
  }
});

test('Pre-deploy API check: compiled Node native ESM loads every api/** function without ERR_MODULE_NOT_FOUND', async () => {
  const cwd = process.cwd();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-esm-check-'));

  try {
    const sourceRoots = [
      path.join(cwd, 'api'),
      path.join(cwd, 'server'),
      path.join(cwd, 'features', 'clarity-map'),
      path.join(cwd, 'utils'),
    ];

    const tsFiles = sourceRoots.flatMap((root) =>
      collectFiles(root, (p) => (p.endsWith('.ts') || p.endsWith('.tsx')) && !p.endsWith('.d.ts'))
    );
    assert.ok(tsFiles.length > 0, 'Should collect TypeScript files to compile');

    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
      types: ['node'],
      jsx: ts.JsxEmit.ReactJSX,
      skipLibCheck: true,
      isolatedModules: true,
      moduleDetection: ts.ModuleDetectionKind.Force,
      resolveJsonModule: true,
      allowImportingTsExtensions: false,
      noEmit: false,
      rootDir: cwd,
      outDir: tmpDir,
    };

    const program = ts.createProgram(tsFiles, compilerOptions);
    const emitResult = program.emit();
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics)
      .filter((d) => d.category === ts.DiagnosticCategory.Error);

    if (diagnostics.length > 0) {
      const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: () => cwd,
        getCanonicalFileName: (f) => f,
        getNewLine: () => '\n',
      });
      assert.fail(`TypeScript compilation errors in API/server tree:\n${formatted}`);
    }

    // Mirror package.json ("type": "module"), node_modules, and static JSON data files
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
    fs.symlinkSync(path.join(cwd, 'node_modules'), path.join(tmpDir, 'node_modules'), 'dir');

    const dataSrcDir = path.join(cwd, 'features', 'clarity-map', 'data');
    const dataDestDir = path.join(tmpDir, 'features', 'clarity-map', 'data');
    fs.cpSync(dataSrcDir, dataDestDir, { recursive: true });

    const compiledApiFiles = collectFiles(
      path.join(tmpDir, 'api'),
      (p) => p.endsWith('.js')
    );
    assert.ok(compiledApiFiles.length >= 4, 'Should emit compiled JS files for all api routes');

    const moduleUrls = compiledApiFiles.map((f) => pathToFileURL(f).href);
    // Also verify dynamic import target of ssr-meta.js resolves in plain Node ESM
    moduleUrls.push(pathToFileURL(path.join(tmpDir, 'server', 'seo', 'pageMeta.js')).href);

    // Run in a clean plain Node process (no tsx loader) so native ESM rules are enforced strictly
    const checkScript = `
      const urls = JSON.parse(process.argv[1]);
      for (const url of urls) {
        await import(url);
      }
      // Verify compiled ssr-meta.js stays fail-safe even if pageMeta.js cannot be loaded
      const ssrMod = await import(urls.find((u) => u.endsWith('/api/ssr-meta.js')));
      let status = 0;
      let body = '';
      const res = {
        setHeader() { return this; },
        status(code) { status = code; return this; },
        send(html) { body = String(html); return this; },
      };
      await ssrMod.default({ method: 'GET', url: '/about', query: { path: '/about' }, headers: {} }, res);
      if (status !== 200 || !body.includes('<div id="root">')) {
        throw new Error('Compiled ssr-meta.js did not return 200 fallback HTML');
      }
    `;

    await execFileAsync(process.execPath, ['--input-type=module', '-e', checkScript, JSON.stringify(moduleUrls)], {
      cwd: tmpDir,
      env: { ...process.env, NODE_ENV: 'production' },
    });

    // Also prove compiled ssr-meta.js survives if server/seo/pageMeta.js is missing at runtime
    fs.unlinkSync(path.join(tmpDir, 'server', 'seo', 'pageMeta.js'));
    const ssrUrl = pathToFileURL(path.join(tmpDir, 'api', 'ssr-meta.js')).href;
    const fallbackScript = `
      const ssrMod = await import(process.argv[1]);
      let status = 0;
      let body = '';
      const res = {
        setHeader() { return this; },
        status(code) { status = code; return this; },
        send(html) { body = String(html); return this; },
      };
      await ssrMod.default({ method: 'GET', url: '/about', query: { path: '/about' }, headers: {} }, res);
      if (status !== 200 || !body.includes('<div id="root">')) {
        throw new Error('Compiled ssr-meta.js crashed when pageMeta.js was missing');
      }
    `;
    await execFileAsync(process.execPath, ['--input-type=module', '-e', fallbackScript, ssrUrl], {
      cwd: tmpDir,
      env: { ...process.env, NODE_ENV: 'production' },
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
