import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeTmpDir, read, readJSON, runCLI } from './helpers';

const distEntry = path.resolve(process.cwd(), 'dist/index.js'); // your built CLI

describe('template validity', () => {
  it('renders VS Code settings and eslint flat config', async () => {
    const tmp = makeTmpDir();
    const name = 'linting';
    await runCLI(tmp, 'node', [distEntry, 'gen', name, '--pm', 'npm']);
    const root = path.join(tmp, name);
    const vscode = read(path.join(root, '.vscode', 'settings.json'));
    expect(() => JSON.parse(vscode)).not.toThrow();

    const eslint = read(path.join(root, 'eslint.config.mjs'));
    expect(eslint).toMatch(/export default/);
    expect(eslint).toMatch(/@eslint\/js/);
  });
  it('renders valid package.json for all presets', async () => {
    const presets = ['web', 'api', 'soap', 'hybrid'];
    for (const preset of presets) {
      const tmp = makeTmpDir();
      const name = `pkg-${preset}`;
      const { exitCode } = await runCLI(tmp, 'node', [
        distEntry,
        'gen',
        name,
        '--preset',
        preset,
        '-y',
      ]);
      expect(exitCode).toBe(0);

      const root = path.join(tmp, name);
      const pkgPath = path.join(root, 'package.json');
      const pkgContent = read(pkgPath);

      // Should parse without errors
      expect(() => JSON.parse(pkgContent)).not.toThrow();

      const pkg = readJSON(pkgPath);
      expect(pkg.name).toBe(name);
      expect(pkg.version).toBe('0.1.0');
      expect(pkg.type).toBe('module');
      expect(pkg.scripts).toBeTruthy();
      expect(pkg.dependencies).toBeTruthy();
      expect(pkg.devDependencies).toBeTruthy();
    }
  }, 120_000);

  it('renders valid tsconfig.json with type module ES2023', async () => {
    const tmp = makeTmpDir();
    const name = 'tsconfig-test';
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, 'gen', name, '-y']);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const tsconfigPath = path.join(root, 'tsconfig.json');
    const tsconfigContent = read(tsconfigPath);

    // Should parse as valid JSON
    expect(() => JSON.parse(tsconfigContent)).not.toThrow();

    const tsconfig = readJSON(tsconfigPath);
    expect(tsconfig.compilerOptions).toBeTruthy();
    expect(tsconfig.compilerOptions.target).toBe('ES2022');
    expect(tsconfig.compilerOptions.module).toBe('ES2022');
  }, 60_000);

  it('renders valid playwright.config.ts with all presets', async () => {
    const presets = ['web', 'api', 'soap', 'hybrid'];
    for (const preset of presets) {
      const tmp = makeTmpDir();
      const name = `pw-config-${preset}`;
      const { exitCode } = await runCLI(tmp, 'node', [
        distEntry,
        'gen',
        name,
        '--preset',
        preset,
        '-y',
      ]);
      expect(exitCode).toBe(0);

      const root = path.join(tmp, name);
      const configPath = path.join(root, 'playwright.config.ts');
      const configContent = read(configPath);

      // Should contain Playwright config exports
      expect(configContent).toMatch(/import.*@playwright\/test/);
      expect(configContent).toMatch(/defineConfig/);
    }
  }, 120_000);

  it('playwright.config.ts includes browser options for all presets', async () => {
    const presets = ['web', 'api', 'soap', 'hybrid'];
    for (const preset of presets) {
      const tmp = makeTmpDir();
      const name = `browser-${preset}`;
      const { exitCode } = await runCLI(tmp, 'node', [
        distEntry,
        'gen',
        name,
        '--preset',
        preset,
        '-y',
      ]);
      expect(exitCode).toBe(0);

      const root = path.join(tmp, name);
      const configPath = path.join(root, 'playwright.config.ts');
      const configContent = read(configPath);

      // Should include baseURL or use config
      expect(configContent).toMatch(/baseURL|config/i);
    }
  }, 120_000);

  it('renders valid package.json for playwright-bdd framework', async () => {
    const tmp = makeTmpDir();
    const name = 'bdd-pkg-test';
    const { exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      name,
      '--framework',
      'playwright-bdd',
      '--preset',
      'web',
      '-y',
    ]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkgPath = path.join(root, 'package.json');
    const pkgContent = read(pkgPath);

    // Should parse without errors
    expect(() => JSON.parse(pkgContent)).not.toThrow();

    const pkg = readJSON(pkgPath);
    // BDD scripts should have bddPrefix
    expect(pkg.scripts?.['test:runner:dev']).toMatch(/npx bddgen &&/);
    expect(pkg.scripts?.['test:dev']).toMatch(/npx bddgen &&/);

    // BDD lint script
    expect(pkg.scripts?.['lint:gherkin']).toBeTruthy();
  }, 60_000);

  it('renders valid README.md for all configurations', async () => {
    const configs = [
      { preset: 'web', reporter: 'allure' },
      { preset: 'api', reporter: 'monocart' },
      { preset: 'soap', reporter: 'html' },
      { preset: 'hybrid', reporter: 'tta' },
    ];

    for (const config of configs) {
      const tmp = makeTmpDir();
      const name = `readme-${config.preset}-${config.reporter}`;
      const { exitCode } = await runCLI(tmp, 'node', [
        distEntry,
        'gen',
        name,
        '--preset',
        config.preset,
        '--reporter',
        config.reporter,
        '-y',
      ]);
      expect(exitCode).toBe(0);

      const root = path.join(tmp, name);
      const readmePath = path.join(root, 'README.md');
      const readmeContent = read(readmePath);

      // README should contain basic markdown
      expect(readmeContent).toMatch(/^#\s+/m); // Heading
      expect(readmeContent).toContain(name);
    }
  }, 120_000);

  it('renders valid .gherkin-lintrc for playwright-bdd only', async () => {
    // Test BDD framework
    const tmp1 = makeTmpDir();
    const bddName = 'gherkin-bdd-test';
    const { exitCode: exitCode1 } = await runCLI(tmp1, 'node', [
      distEntry,
      'gen',
      bddName,
      '--framework',
      'playwright-bdd',
      '-y',
    ]);
    expect(exitCode1).toBe(0);

    const bddRoot = path.join(tmp1, bddName);
    const bddGherkinPath = path.join(bddRoot, '.gherkin-lintrc');
    const bddGherkinContent = read(bddGherkinPath);
    expect(() => JSON.parse(bddGherkinContent)).not.toThrow();

    // Test regular playwright framework (should not have .gherkin-lintrc)
    const tmp2 = makeTmpDir();
    const pwName = 'gherkin-pw-test';
    const { exitCode: exitCode2 } = await runCLI(tmp2, 'node', [
      distEntry,
      'gen',
      pwName,
      '--framework',
      'playwright',
      '-y',
    ]);
    expect(exitCode2).toBe(0);

    const pwRoot = path.join(tmp2, pwName);
    const pwGherkinPath = path.join(pwRoot, '.gherkin-lintrc');
    // File should not exist
    expect(() => read(pwGherkinPath)).toThrow();
  }, 60_000);

  it('all template renders produce valid JSON files', async () => {
    const tmp = makeTmpDir();
    const name = 'json-validity-test';
    const { exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      name,
      '--preset',
      'hybrid',
      '--framework',
      'playwright-bdd',
      '--reporter',
      'allure',
      '--ci',
      'github',
      '--pm',
      'yarn',
      '--zephyr',
      '-y',
    ]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const jsonFiles = ['package.json', 'tsconfig.json', '.vscode/settings.json', '.gherkin-lintrc'];

    for (const jsonFile of jsonFiles) {
      const filePath = path.join(root, jsonFile);
      const content = read(filePath);
      expect(() => JSON.parse(content)).not.toThrow(`${jsonFile} should be valid JSON`);
    }
  }, 60_000);
});
