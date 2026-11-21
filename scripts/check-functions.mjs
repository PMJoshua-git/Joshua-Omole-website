import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const execFileAsync = promisify(execFile);

function collectFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
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

async function main() {
  const cwd = process.cwd();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-functions-'));

  try {
    const sourceRoots = [
      path.join(cwd, 'api'),
      path.join(cwd, 'server'),
      path.join(cwd, 'services'),
      path.join(cwd, 'features', 'clarity-map'),
      path.join(cwd, 'utils'),
    ];

    const files = sourceRoots.flatMap((root) =>
      collectFiles(
        root,
        (p) => (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js')) && !p.endsWith('.d.ts')
      )
    );
    const rootTypesFile = path.join(cwd, 'types.ts');
    if (fs.existsSync(rootTypesFile)) {
      files.push(rootTypesFile);
    }

    const compilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
      types: ['node'],
      jsx: ts.JsxEmit.ReactJSX,
      allowJs: true,
      skipLibCheck: true,
      isolatedModules: true,
      moduleDetection: ts.ModuleDetectionKind.Force,
      resolveJsonModule: true,
      allowImportingTsExtensions: false,
      noEmit: false,
      rootDir: cwd,
      outDir: tmpDir,
    };

    const program = ts.createProgram(files, compilerOptions);
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
      throw new Error(`TypeScript compilation errors:\n${formatted}`);
    }

    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
    fs.symlinkSync(path.join(cwd, 'node_modules'), path.join(tmpDir, 'node_modules'), 'dir');

    for (const relCopy of [
      path.join('features', 'clarity-map', 'data'),
      'resources-private',
    ]) {
      const src = path.join(cwd, relCopy);
      const dst = path.join(tmpDir, relCopy);
      if (fs.existsSync(src)) {
        fs.cpSync(src, dst, { recursive: true });
      }
    }

    const compiledApiFiles = collectFiles(
      path.join(tmpDir, 'api'),
      (p) => p.endsWith('.js')
    ).sort();

    if (compiledApiFiles.length === 0) {
      throw new Error('No compiled API functions found under api/.');
    }

    const urls = [
      ...compiledApiFiles.map((f) => pathToFileURL(f).href),
      pathToFileURL(path.join(tmpDir, 'server', 'seo', 'pageMeta.js')).href,
    ];

    const runnerScript = `
      const urls = JSON.parse(process.argv[1]);
      for (const url of urls) {
        await import(url);
      }
      console.log('Verified native ESM import for ' + urls.length + ' modules.');
    `;

    const { stdout } = await execFileAsync(
      process.execPath,
      ['--input-type=module', '-e', runnerScript, JSON.stringify(urls)],
      { cwd: tmpDir, env: { ...process.env, NODE_ENV: 'production' } }
    );

    process.stdout.write(stdout);
    for (const f of compiledApiFiles) {
      console.log(' - ok:', path.relative(tmpDir, f));
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('[check:functions] FAILED:', err?.message || err);
  process.exit(1);
});
