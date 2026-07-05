/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { exists, makeTmpDir, readJSON, runCLI } from './helpers';

const distEntry = path.resolve(process.cwd(), 'dist/index.js'); // your built CLI

function toArgs(name: string, c: any): string[] {
  const args = [
    'gen',
    name,
    '--pm',
    c.pm,
    '--reporter',
    c.reporter,
    '--ci',
    c.ci,
    '--preset',
    c.preset,
  ];
  if (c.lang === 'js') args.push('--js');
  if (c.husky === false) args.push('--no-husky');
  if (c.zephyr === true) args.push('--zephyr');
  if (c.framework && c.framework !== 'playwright') args.push('--framework', c.framework);
  if (c.notifications === false) args.push('--notifications', 'false');
  // non-interactive
  args.push('-y');
  return args;
}

describe('init (additional matrix)', () => {
  const cases = [
    {
      id: 'web-allure-npm-ts',
      pm: 'npm',
      reporter: 'allure',
      ci: 'github',
      lang: 'ts',
      preset: 'web',
      husky: true,
      zephyr: false,
    },
    {
      id: 'api-monocart-yarn-js-zephyr',
      pm: 'yarn',
      reporter: 'monocart',
      ci: 'gitlab',
      lang: 'js',
      preset: 'api',
      husky: true,
      zephyr: true,
    },
    {
      id: 'hybrid-html-npm-ts-nohusky',
      pm: 'npm',
      reporter: 'html',
      ci: 'none',
      lang: 'ts',
      preset: 'hybrid',
      husky: false,
      zephyr: false,
    },
    {
      id: 'api-allure-yarn-ts-zephyr-nohusky',
      pm: 'yarn',
      reporter: 'allure',
      ci: 'github',
      lang: 'ts',
      preset: 'api',
      husky: false,
      zephyr: true,
    },

    // Additional permutations to increase coverage
    {
      id: 'web-allure-yarn-gitlab-ts-zephyr',
      pm: 'yarn',
      reporter: 'allure',
      ci: 'gitlab',
      lang: 'ts',
      preset: 'web',
      husky: true,
      zephyr: true,
    },
    {
      id: 'api-monocart-npm-none-js-nohusky',
      pm: 'npm',
      reporter: 'monocart',
      ci: 'none',
      lang: 'js',
      preset: 'api',
      husky: false,
      zephyr: false,
    },
    {
      id: 'hybrid-html-yarn-github-js-husky',
      pm: 'yarn',
      reporter: 'html',
      ci: 'github',
      lang: 'js',
      preset: 'hybrid',
      husky: true,
      zephyr: false,
    },
    {
      id: 'api-allure-npm-gitlab-js-zephyr-nohusky',
      pm: 'npm',
      reporter: 'allure',
      ci: 'gitlab',
      lang: 'js',
      preset: 'api',
      husky: false,
      zephyr: true,
    },

    // SOAP preset coverage
    {
      id: 'soap-allure-npm-ts',
      pm: 'npm',
      reporter: 'allure',
      ci: 'github',
      lang: 'ts',
      preset: 'soap',
      husky: true,
      zephyr: false,
    },
    {
      id: 'web-monocart-yarn-github-ts-husky',
      pm: 'yarn',
      reporter: 'monocart',
      ci: 'github',
      lang: 'ts',
      preset: 'web',
      husky: true,
      zephyr: false,
    },
    {
      id: 'web-html-npm-none-ts-nohusky',
      pm: 'npm',
      reporter: 'html',
      ci: 'none',
      lang: 'ts',
      preset: 'web',
      husky: false,
      zephyr: false,
    },

    // BDD framework variations
    {
      id: 'web-bdd-allure-npm-ts',
      pm: 'npm',
      reporter: 'allure',
      ci: 'github',
      lang: 'ts',
      preset: 'web',
      husky: true,
      zephyr: false,
      framework: 'playwright-bdd',
    },
    {
      id: 'api-bdd-monocart-yarn-js',
      pm: 'yarn',
      reporter: 'monocart',
      ci: 'gitlab',
      lang: 'js',
      preset: 'api',
      husky: true,
      zephyr: false,
      framework: 'playwright-bdd',
    },
    {
      id: 'soap-bdd-allure-npm-ts',
      pm: 'npm',
      reporter: 'allure',
      ci: 'github',
      lang: 'ts',
      preset: 'soap',
      husky: true,
      zephyr: false,
      framework: 'playwright-bdd',
    },
    {
      id: 'hybrid-bdd-html-yarn-ts-nohusky',
      pm: 'yarn',
      reporter: 'html',
      ci: 'none',
      lang: 'ts',
      preset: 'hybrid',
      husky: false,
      zephyr: false,
      framework: 'playwright-bdd',
    },

    // TTA reporter variations
    {
      id: 'web-tta-npm-ts',
      pm: 'npm',
      reporter: 'tta',
      ci: 'github',
      lang: 'ts',
      preset: 'web',
      husky: true,
      zephyr: false,
    },
    {
      id: 'api-tta-yarn-js',
      pm: 'yarn',
      reporter: 'tta',
      ci: 'gitlab',
      lang: 'js',
      preset: 'api',
      husky: false,
      zephyr: true,
    },
    {
      id: 'hybrid-tta-npm-none-ts',
      pm: 'npm',
      reporter: 'tta',
      ci: 'none',
      lang: 'ts',
      preset: 'hybrid',
      husky: true,
      zephyr: false,
    },

    // Notifications false variations
    {
      id: 'web-allure-npm-no-notifications',
      pm: 'npm',
      reporter: 'allure',
      ci: 'github',
      lang: 'ts',
      preset: 'web',
      husky: true,
      zephyr: false,
      notifications: false,
    },
    {
      id: 'api-bdd-monocart-yarn-no-notifications',
      pm: 'yarn',
      reporter: 'monocart',
      ci: 'gitlab',
      lang: 'js',
      preset: 'api',
      husky: true,
      zephyr: false,
      framework: 'playwright-bdd',
      notifications: false,
    },
  ] as const;

  for (const c of cases) {
    it(`scaffolds and wires deps: ${c.id}`, async () => {
      const tmp = makeTmpDir();
      const name = `proj-${c.id}`;
      const { out, exitCode } = await runCLI(tmp, 'node', [distEntry, ...toArgs(name, c)]);

      expect(exitCode).toBe(0);
      expect(out).toMatch(/Create project folder/i);

      const root = path.join(tmp, name);
      const pkg = readJSON(path.join(root, 'package.json'));

      // package manager yarn should add yarn dep
      if (c.pm === 'yarn') {
        expect(pkg.dependencies?.yarn).toBeTruthy();
      }

      // preset-specific wiring
      if (c.preset === 'api' || c.preset === 'hybrid') {
        expect(pkg.devDependencies?.express || pkg.dependencies?.express).toBeTruthy();
      }

      // SOAP preset wiring
      if (c.preset === 'soap' || c.preset === 'hybrid') {
        expect(pkg.devDependencies?.['fast-xml-parser']).toBeTruthy();
      }

      // reporter dependencies
      if (c.reporter === 'allure') {
        expect(pkg.devDependencies?.['allure-playwright']).toBeTruthy();
        expect(pkg.devDependencies?.['allure-commandline']).toBeTruthy();
      } else if (c.reporter === 'monocart') {
        expect(pkg.devDependencies?.['monocart-reporter']).toBeTruthy();
      } else if (c.reporter === 'tta') {
        // TTA reporter uses http-server built-in
        expect(pkg.devDependencies?.['http-server']).toBeTruthy();
      }

      // BDD framework specific dependencies
      if (c.framework === 'playwright-bdd') {
        expect(pkg.devDependencies?.['playwright-bdd']).toBeTruthy();
        expect(pkg.devDependencies?.['gherkin-lint']).toBeTruthy();
        expect(pkg.devDependencies?.['eslint-plugin-cucumber']).toBeTruthy();
        expect(pkg.devDependencies?.['prettier-plugin-gherkin']).toBeTruthy();
      }

      // notifications (defaults to true unless explicitly false)
      const shouldHaveNotifications = c.notifications !== false;
      if (shouldHaveNotifications) {
        expect(exists(path.join(root, 'src', 'tools', 'notifications'))).toBe(true);
        expect(pkg.devDependencies?.nodemailer).toBeTruthy();
        expect(pkg.devDependencies?.['@slack/webhook']).toBeTruthy();
      } else {
        expect(exists(path.join(root, 'src', 'tools', 'notifications'))).toBe(false);
        expect(pkg.devDependencies?.nodemailer).toBeFalsy();
      }

      // zephyr toggles presence of publications
      if (c.zephyr) {
        expect(exists(path.join(root, 'src', 'tools', 'publications'))).toBe(true);
      }

      // husky wiring
      if (c.husky === false) {
        expect(pkg.scripts?.prepare).toBeUndefined();
        expect(exists(path.join(root, '.husky'))).toBe(false);
      } else {
        expect(pkg.scripts?.prepare).toBe('husky');
        expect(exists(path.join(root, '.husky', 'commit-msg'))).toBe(true);
      }

      // preset files
      if (c.preset === 'web') {
        expect(exists(path.join(root, 'src', 'pages'))).toBe(true);
        if (c.framework === 'playwright-bdd') {
          expect(exists(path.join(root, 'features', 'ui'))).toBe(true);
          expect(exists(path.join(root, 'features', 'steps', 'ui'))).toBe(true);
        } else {
          expect(exists(path.join(root, 'tests', 'ui'))).toBe(true);
        }
        expect(exists(path.join(root, 'test-data', 'ui'))).toBe(true);
      }
      if (c.preset === 'api') {
        expect(exists(path.join(root, 'src', 'utils', 'api'))).toBe(true);
        if (c.framework === 'playwright-bdd') {
          expect(exists(path.join(root, 'features', 'api'))).toBe(true);
          expect(exists(path.join(root, 'features', 'steps', 'api'))).toBe(true);
        } else {
          expect(exists(path.join(root, 'tests', 'api'))).toBe(true);
        }
        expect(exists(path.join(root, 'test-data', 'api'))).toBe(true);
      }
      if (c.preset === 'hybrid') {
        // UI artifacts
        expect(exists(path.join(root, 'src', 'pages'))).toBe(true);
        if (c.framework === 'playwright-bdd') {
          expect(exists(path.join(root, 'features', 'ui'))).toBe(true);
          expect(exists(path.join(root, 'features', 'steps', 'ui'))).toBe(true);
          expect(exists(path.join(root, 'features', 'api'))).toBe(true);
          expect(exists(path.join(root, 'features', 'steps', 'api'))).toBe(true);
          expect(exists(path.join(root, 'features', 'soap'))).toBe(true);
          expect(exists(path.join(root, 'features', 'steps', 'soap'))).toBe(true);
        } else {
          expect(exists(path.join(root, 'tests', 'ui'))).toBe(true);
          expect(exists(path.join(root, 'tests', 'api'))).toBe(true);
          expect(exists(path.join(root, 'tests', 'soap'))).toBe(true);
        }
        expect(exists(path.join(root, 'test-data', 'ui'))).toBe(true);
        expect(exists(path.join(root, 'test-data', 'api'))).toBe(true);
        expect(exists(path.join(root, 'test-data', 'soap'))).toBe(true);

        // API artifacts
        expect(exists(path.join(root, 'src', 'utils', 'api'))).toBe(true);

        // SOAP artifacts
        expect(exists(path.join(root, 'src', 'utils', 'soap'))).toBe(true);
      }
      if (c.preset === 'soap') {
        expect(exists(path.join(root, 'src', 'utils', 'soap'))).toBe(true);
        if (c.framework === 'playwright-bdd') {
          expect(exists(path.join(root, 'features', 'soap'))).toBe(true);
          expect(exists(path.join(root, 'features', 'steps', 'soap'))).toBe(true);
        } else {
          expect(exists(path.join(root, 'tests', 'soap'))).toBe(true);
        }
        expect(exists(path.join(root, 'test-data', 'soap'))).toBe(true);
      }

      // BDD-specific files
      if (c.framework === 'playwright-bdd') {
        expect(exists(path.join(root, '.gherkin-lintrc'))).toBe(true);
        expect(pkg.scripts?.['lint:gherkin']).toBeTruthy();
      } else {
        expect(exists(path.join(root, '.gherkin-lintrc'))).toBe(false);
        expect(pkg.scripts?.['lint:gherkin']).toBeFalsy();
      }

      // Reporter-specific scripts
      if (c.reporter === 'tta') {
        expect(pkg.scripts?.['tta:report:open']).toBeTruthy();
      }
    }, 120_000);
  }
});

describe('BDD framework specific tests', () => {
  it('playwright-bdd generates features folder structure and gherkin-lint script', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-bdd-features';
    const args = [
      'gen',
      name,
      '--pm',
      'npm',
      '--reporter',
      'allure',
      '--preset',
      'web',
      '--framework',
      'playwright-bdd',
      '-y',
    ];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkg = readJSON(path.join(root, 'package.json'));

    // Verify BDD dependencies
    expect(pkg.devDependencies?.['playwright-bdd']).toBeTruthy();
    expect(pkg.devDependencies?.['gherkin-lint']).toBeTruthy();
    expect(pkg.devDependencies?.['prettier-plugin-gherkin']).toBeTruthy();

    // Verify gherkin-lint script exists
    expect(pkg.scripts?.['lint:gherkin']).toMatch(/gherkin-lint/);

    // Verify features folder structure (not tests)
    expect(exists(path.join(root, 'features'))).toBe(true);
    expect(exists(path.join(root, 'features', 'ui'))).toBe(true);
    expect(exists(path.join(root, 'features', 'steps'))).toBe(true);
    expect(exists(path.join(root, 'features', 'steps', 'ui'))).toBe(true);

    // Verify .gherkin-lintrc exists
    expect(exists(path.join(root, '.gherkin-lintrc'))).toBe(true);
  }, 60_000);

  it('playwright framework does NOT generate features folder or gherkin-lint', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-normal-playwright';
    const args = [
      'gen',
      name,
      '--pm',
      'npm',
      '--reporter',
      'allure',
      '--preset',
      'web',
      '--framework',
      'playwright',
      '-y',
    ];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkg = readJSON(path.join(root, 'package.json'));

    // Verify BDD dependencies are NOT present
    expect(pkg.devDependencies?.['playwright-bdd']).toBeFalsy();
    expect(pkg.devDependencies?.['gherkin-lint']).toBeFalsy();

    // Verify gherkin-lint script does not exist
    expect(pkg.scripts?.['lint:gherkin']).toBeFalsy();

    // Verify tests folder structure (not features)
    expect(exists(path.join(root, 'tests'))).toBe(true);
    expect(exists(path.join(root, 'tests', 'ui'))).toBe(true);
    expect(exists(path.join(root, 'features'))).toBe(false);

    // Verify .gherkin-lintrc does not exist
    expect(exists(path.join(root, '.gherkin-lintrc'))).toBe(false);
  }, 60_000);

  it('bdd scripts include bddPrefix (npx bddgen &&)', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-bdd-scripts';
    const args = [
      'gen',
      name,
      '--pm',
      'npm',
      '--preset',
      'api',
      '--framework',
      'playwright-bdd',
      '-y',
    ];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkg = readJSON(path.join(root, 'package.json'));

    // Verify bddPrefix is in test:runner:dev script
    expect(pkg.scripts?.['test:runner:dev']).toMatch(/npx bddgen &&/);
    expect(pkg.scripts?.['test:runner:ui:dev']).toMatch(/npx bddgen &&/);
    expect(pkg.scripts?.['test:dev']).toMatch(/npx bddgen &&/);
  }, 60_000);
});

describe('TTA reporter specific tests', () => {
  it('tta reporter generates tta:report:open script with http-server', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-tta-reporter';
    const args = ['gen', name, '--pm', 'npm', '--reporter', 'tta', '--preset', 'web', '-y'];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkg = readJSON(path.join(root, 'package.json'));

    // Verify TTA script
    expect(pkg.scripts?.['tta:report:open']).toBeTruthy();
    expect(pkg.scripts?.['tta:report:open']).toMatch(/http-server/);
    expect(pkg.scripts?.['tta:report:open']).toMatch(/tta-report/);

    // Verify http-server is in devDependencies
    expect(pkg.devDependencies?.['http-server']).toBeTruthy();

    // Verify allure is NOT present
    expect(pkg.devDependencies?.['allure-playwright']).toBeFalsy();
    expect(pkg.devDependencies?.['monocart-reporter']).toBeFalsy();
  }, 60_000);

  it('tta reporter with yarn uses yarn prefix in script', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-tta-yarn';
    const args = ['gen', name, '--pm', 'yarn', '--reporter', 'tta', '--preset', 'api', '-y'];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkg = readJSON(path.join(root, 'package.json'));

    // TTA script should use yarn prefix
    expect(pkg.scripts?.['tta:report:open']).toMatch(/yarn http-server/);
  }, 60_000);
});

describe('Notifications and optional features conditional rendering', () => {
  it('notifications=false removes notification files and dependencies', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-no-notifications';
    const args = ['gen', name, '--pm', 'npm', '--preset', 'web', '--notifications', 'false', '-y'];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkg = readJSON(path.join(root, 'package.json'));

    // Notifications folder should NOT exist
    expect(exists(path.join(root, 'src', 'tools', 'notifications'))).toBe(false);

    // Notification dependencies should NOT be present
    expect(pkg.devDependencies?.nodemailer).toBeFalsy();
    expect(pkg.devDependencies?.['@slack/webhook']).toBeFalsy();
    expect(pkg.devDependencies?.['@types/nodemailer']).toBeFalsy();

    // run-and-notify script should not exist
    expect(pkg.scripts?.['run-and-notify']).toBeFalsy();
    expect(pkg.scripts?.['notify-report']).toBeFalsy();
  }, 60_000);

  it('notifications=true (default) includes notification files and dependencies', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-with-notifications';
    const args = ['gen', name, '--pm', 'npm', '--preset', 'web', '-y'];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);
    const pkg = readJSON(path.join(root, 'package.json'));

    // Notifications folder SHOULD exist
    expect(exists(path.join(root, 'src', 'tools', 'notifications'))).toBe(true);

    // Notification dependencies SHOULD be present
    expect(pkg.devDependencies?.nodemailer).toBeTruthy();
    expect(pkg.devDependencies?.['@slack/webhook']).toBeTruthy();

    // run-and-notify script should exist
    expect(pkg.scripts?.['run-and-notify']).toBeTruthy();
    expect(pkg.scripts?.['notify-report']).toBeTruthy();
  }, 60_000);

  it('zephyr=true includes publications folder', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-zephyr-true';
    const args = ['gen', name, '--pm', 'npm', '--preset', 'web', '--zephyr', '-y'];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);

    // Publications folder SHOULD exist
    expect(exists(path.join(root, 'src', 'tools', 'publications'))).toBe(true);
  }, 60_000);

  it('zephyr=false (default) excludes publications folder', async () => {
    const tmp = makeTmpDir();
    const name = 'proj-zephyr-false';
    const args = ['gen', name, '--pm', 'npm', '--preset', 'web', '-y'];
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, ...args]);
    expect(exitCode).toBe(0);

    const root = path.join(tmp, name);

    // Publications folder should NOT exist by default
    expect(exists(path.join(root, 'src', 'tools', 'publications'))).toBe(false);
  }, 60_000);
});
