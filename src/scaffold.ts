/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * `scaffold.ts`
 *
 * Responsible for generating a Playwright test project from templates based on
 * the user's answers. The function drives a sequence of rendering/copying
 * operations and then mutates `package.json` for the generated project.
 *
 * Key responsibilities:
 * - create the project directory
 * - render base templates (editor config, package.json, tsconfig, README)
 * - scaffold Playwright-specific folders (configs, fixtures, pages, tests)
 * - include optional extras (reporters, CI workflows, notifications, husky)
 * - finalize `package.json` dependencies, devDependencies and scripts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import { copyDir, ensureDir, renderAndCopyDir, writeJSON } from './files.js';
import type { Answers } from './prompts.js';

// Determine __dirname in ESM (fileURLToPath is the portable approach)
const dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to build an absolute path into the `templates/` folder.
// Usage: TPL('playwright/src/pages') => <repo>/templates/playwright/src/pages
const TPL = (p: string) => path.join(dirname, '..', 'templates', p);

/**
 * Scaffold a new project based on the provided `Answers`.
 *
 * The function is intentionally imperative and sequential: template rendering
 * must happen in a predictable order (base files first, then Playwright
 * structure, presets, extras, and finally package.json updates).
 *
 * @param a - The answers object returned from prompts (see `src/prompts.ts`).
 */
export async function scaffold(a: Answers) {
  // Destination folder for the generated project (resolved from current cwd)
  const dest = path.resolve(process.cwd(), a.projectName);

  // Spinner gives the CLI friendly progress feedback while scaffolding
  const spinner = ora(`Scaffolding project: ${a.projectName}...`).start();

  // Small visual tweak: move to yellow after start so long-running steps feel active
  setTimeout(() => {
    spinner.color = 'yellow';
  }, 1000);

  /**
   * Simple step runner used throughout this file. Each step displays a label
   * in the spinner, executes the async work and reports success/failure.
   *
   * Keeping this as a local helper reduces duplication and provides
   * consistent UX for long scaffolding operations.
   */
  const step = async (label: string, fn: () => Promise<void>) => {
    spinner.start(`\n${label}`);
    try {
      await fn();
      spinner.succeed(label);
    } catch (err) {
      spinner.fail(label);
      throw err;
    }
  };

  // --- Create project directory ---
  // `recursive: true` is a safe no-op if the folder already exists.
  await step(`Create project folder: ${a.projectName}`, async () => {
    await fs.mkdir(dest, { recursive: true });
  });

  // --- Base templates ---
  // These include editor settings, package.json.ejs, README, tsconfig etc.
  await step(
    'Scaffold base files and folders (.vscode/, .editorconfig, .gitignore, .prettierignore, .prettierrc, eslint.config.js, package.json, README.md, tsconfig.json, .gherkin-lintrc)',
    async () => {
      const baseRenders: Array<[string, string]> = [
        ['base/.vscode', path.join(dest, '.vscode')],
        ['base/.editorconfig', dest],
        ['base/.gitignore', dest],
        ['base/.prettierignore', dest],
        ['base/.prettierrc', dest],
        ['base/eslint.config.mjs.ejs', dest],
        ['base/package.json.ejs', dest],
        ['base/README.md.ejs', dest],
        ['base/tsconfig.json.ejs', dest],
        a.reporter === 'allure'
          ? [
              'playwright/src/configs/executor.json.ejs',
              path.join(dest, 'artifacts', 'reports', 'allure-results'),
            ]
          : null,
        a.framework === 'playwright-bdd' ? ['base/.gherkin-lintrc', dest] : null,
      ].filter(Boolean) as [string, string][];

      for (const [tpl, to] of baseRenders) {
        await renderAndCopyDir(TPL(tpl), to, a);
      }
    },
  );

  // --- Playwright common structure ---
  // Render configs and environments first, then selective utils files.
  await step('Add Playwright structure (src => configs, environments)', async () => {
    // Render common folders sequentially to ensure order and proper awaits
    for (const folder of ['configs', 'environments']) {
      await renderAndCopyDir(TPL(`playwright/src/${folder}`), path.join(dest, 'src', folder), a);
    }

    // Utility files to include depend on chosen preset(s). We build an array
    // with conditional entries and filter `null`s out before rendering.
    const utilsFiles = [
      ['web', 'hybrid'].includes(a.preset) ? 'cookies.ts.ejs' : null,
      ['api', 'hybrid'].includes(a.preset) ? 'server.ts.ejs' : null,
      a.framework === 'playwright-bdd' ? 'customTTAReporter.ts.ejs' : 'custom-reporter.ts.ejs',
      'global-setup.ts.ejs',
      'global-teardown.ts.ejs',
      'index.ts.ejs',
      'logger.ts.ejs',
      'metadata-builder.ts.ejs',
      'paths.ts.ejs',
      'test-runner.ts.ejs',
      'general.ts.ejs',
    ].filter(Boolean) as string[];

    for (const fileOrFolder of utilsFiles) {
      await renderAndCopyDir(
        TPL(`playwright/src/utils/${fileOrFolder}`),
        path.join(dest, 'src', 'utils'),
        a,
      );
    }
  });

  // --- Playwright config ---
  await step('Add Playwright config (playwright.config.ts)', async () => {
    await renderAndCopyDir(TPL('playwright/playwright.config.ts.ejs'), dest, a);
  });

  // --- Preset scaffolding ---
  // Each preset (web, api, soap, hybrid) maps to specific template folders.
  // We keep the rendering logic explicit and readable so future presets are
  // straightforward to add.
  // Helper to resolve tests vs features paths depending on the chosen framework
  const testsRender = (sub: string): Array<[string, string]> =>
    a.framework === 'playwright-bdd'
      ? [
          [`playwright-bdd/features/${sub}`, path.join(dest, 'features', sub)],
          [`playwright-bdd/features/steps/${sub}`, path.join(dest, 'features', 'steps', sub)],
        ]
      : [[`playwright/tests/${sub}`, path.join(dest, 'tests', sub)]];

  if (a.preset === 'web') {
    await step('Add Web as preset (UI/POM + fixtures)', async () => {
      const webRenders: Array<[string, string]> = [
        ['playwright/src/pages', path.join(dest, 'src', 'pages')],
        ['playwright/src/fixtures/web', path.join(dest, 'src', 'fixtures')],
        ['playwright/src/fixtures/index.ts.ejs', path.join(dest, 'src', 'fixtures')],
        ['playwright/test-data/ui', path.join(dest, 'test-data', 'ui')],
        ['playwright/test-data/index.ts.ejs', path.join(dest, 'test-data')],
        ...testsRender('ui'),
      ];

      for (const [tpl, to] of webRenders) {
        await renderAndCopyDir(TPL(tpl), to, a);
      }
    });
  }

  if (a.preset === 'api') {
    await step('Add API as preset (API Server, services, tests and fixtures)', async () => {
      const apiRenders: Array<[string, string]> = [
        ['playwright/src/fixtures/api', path.join(dest, 'src', 'fixtures')],
        ['playwright/src/fixtures/index.ts.ejs', path.join(dest, 'src', 'fixtures')],
        ['playwright/src/utils/api/', path.join(dest, 'src', 'utils', 'api')],
        ['playwright/test-data/api/', path.join(dest, 'test-data', 'api')],
        ['playwright/test-data/index.ts.ejs', path.join(dest, 'test-data')],
        ...testsRender('api'),
      ];

      for (const [tpl, to] of apiRenders) {
        await renderAndCopyDir(TPL(tpl), to, a);
      }
    });
  }

  if (a.preset === 'soap') {
    await step('Add SOAP preset (WSDL client, services, tests and fixtures)', async () => {
      const soapRenders: Array<[string, string]> = [
        ['playwright/src/fixtures/soap', path.join(dest, 'src', 'fixtures')],
        ['playwright/src/fixtures/index.ts.ejs', path.join(dest, 'src', 'fixtures')],
        ['playwright/src/utils/soap/', path.join(dest, 'src', 'utils', 'soap')],
        ['playwright/test-data/soap', path.join(dest, 'test-data', 'soap')],
        ['playwright/test-data/index.ts.ejs', path.join(dest, 'test-data')],
        ...testsRender('soap'),
      ];

      for (const [tpl, to] of soapRenders) {
        await renderAndCopyDir(TPL(tpl), to, a);
      }
    });
  }

  if (a.preset === 'hybrid') {
    await step('Add Hybrid (UI + API + SOAP + Fixtures) as preset', async () => {
      const hybridRenders: Array<[string, string]> = [
        ['playwright/src/pages', path.join(dest, 'src', 'pages')],
        ['playwright/src/fixtures/hybrid', path.join(dest, 'src', 'fixtures')],
        ['playwright/src/fixtures/index.ts.ejs', path.join(dest, 'src', 'fixtures')],
        ['playwright/src/utils/soap/', path.join(dest, 'src', 'utils', 'soap')],
        ['playwright/src/utils/api/', path.join(dest, 'src', 'utils', 'api')],

        ...testsRender('ui'),
        ...testsRender('api'),
        ...testsRender('soap'),
      ];

      for (const [tpl, to] of hybridRenders) {
        await renderAndCopyDir(TPL(tpl), to, a);
      }

      // Also include test-data (api/soap/ui/index) used by hybrid setups
      for (const [tpl, to] of [
        ['playwright/test-data/api', path.join(dest, 'test-data', 'api')],
        ['playwright/test-data/soap', path.join(dest, 'test-data', 'soap')],
        ['playwright/test-data/ui', path.join(dest, 'test-data', 'ui')],
        ['playwright/test-data/index.ts.ejs', path.join(dest, 'test-data')],
      ]) {
        await renderAndCopyDir(TPL(tpl), to, a);
      }
    });
  }

  // --- Optional extras: reporters, notifications, CI, husky, zephyr ---
  // Helper: run a step only when `cond` is truthy. Supports both copy and render flows.
  const maybe = async (
    cond: boolean,
    label: string,
    tplPath: string,
    toPath: string,
    render = false,
  ) => {
    if (!cond) return;
    await step(label, async () => {
      if (render) {
        await renderAndCopyDir(TPL(tplPath), toPath, a);
      } else {
        await copyDir(TPL(tplPath), toPath);
      }
    });
  };

  // Reporter docs (only a couple of options to include)
  const reporterDocs: Record<string, string> = {
    allure: 'docs/reporters/allure',
    monocart: 'docs/reporters/monocart',
  };

  if (reporterDocs[a.reporter]) {
    const rpt = reporterDocs[a.reporter];
    await maybe(true, `Include ${a.reporter} docs (${rpt})`, rpt, path.join(dest, rpt));
  }

  await maybe(
    a.notifications,
    'Add Notifications stub (email, slack, teams)',
    'extras/notifications',
    path.join(dest, 'src', 'tools', 'notifications'),
    true,
  );

  // CI workflows: GitHub (to .github/workflows) or GitLab (root)
  if (a.ci === 'github') {
    await maybe(
      true,
      'Add GitHub Actions workflow',
      'ci/github',
      path.join(dest, '.github', 'workflows'),
      true,
    );
  } else if (a.ci === 'gitlab') {
    await maybe(true, 'Add GitLab CI config', 'ci/gitlab', dest, true);
  }

  await maybe(a.husky, 'Setup Husky hooks (.husky/)', 'husky', path.join(dest, '.husky'));

  await maybe(
    a.zephyr,
    'Add Zephyr publish stub',
    'extras/publications',
    path.join(dest, 'src', 'tools', 'publications'),
    true,
  );

  // --- Finalize package.json ---
  // Read the rendered `package.json` produced by templates and merge in
  // dependencies/devDependencies based on the user's choices.
  const pkgPath = path.join(dest, 'package.json');
  const pkg = JSON.parse((await fs.readFile(pkgPath)).toString());
  let deps: Record<string, string>;
  let devDeps: Record<string, string>;

  // Compute package manager settings early (used in both steps)
  const pmBin = a.packageManager === 'yarn' ? 'yarn' : 'npx';
  const xenv = `${pmBin} cross-env`;

  // Build dependency lists in a single step so we can present it in the spinner
  await step('Prepare package.json dependencies and scripts', async () => {
    const hasPreset = (...presets: string[]) => presets.includes(a.preset);

    // Helper: filter out undefined entries from conditional spreads
    const merge = (obj: Record<string, any>) =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

    deps = merge({
      '@playwright/test': '^1.58.1',
      axios: '^1.9.0',
      dotenv: '^16.5.0',
      yarn: a.packageManager === 'yarn' ? '^1.22.22' : undefined,
    });

    // Build devDeps with conditional entries using merge helper
    const coreDevDeps = {
      '@eslint/json': '^0.12.0',
      '@eslint/markdown': '^6.4.0',
      'eslint-plugin-jsonc': '^2.20.0',
      'adm-zip': '^0.5.16',
      '@types/adm-zip': '^0.5.7',
      '@types/wait-on': '^5.3.4',
      '@types/lodash': '^4.17.24',
      eslint: '^9.36.0',
      '@eslint/js': '^9.36.0',
      globals: '^15.12.0',
      'eslint-config-prettier': '^9.1.0',
      'eslint-plugin-playwright': '^2.0.0',
      prettier: '^3.3.3',
      husky: '^9.1.7',
      'lint-staged': '^15.5.1',
      '@faker-js/faker': '^9.7.0',
      chance: '^1.1.12',
      moment: '^2.30.1',
      'cross-env': '^7.0.3',
      lodash: '^4.17.21',
      rimraf: '^6.0.1',
      winston: '^3.17.0',
      'winston-daily-rotate-file': '^5.0.0',
      kolorist: '^1.8.0',
      'http-server': '14.1.1',
      'wait-on': '^9.0.10',
      'dotenv-flow': '^4.1.0',
    };

    const conditionalDevDeps = merge({
      // API-related runtime deps and types (api/hybrid presets)
      ...(hasPreset('api', 'hybrid')
        ? {
            express: '^5.2.1',
            '@types/express': '^5.0.6',
            '@apollo/client': '^3.8.0',
            graphql: '^16.7.1',
            'cross-fetch': '^3.1.5',
          }
        : {}),
      // Reporter: Allure (only when specifically chosen)
      ...(a.reporter === 'allure'
        ? {
            'allure-playwright': '^3.2.1',
            'allure-commandline': '^2.34.1',
          }
        : {}),
      // Reporter: Monocart (only when specifically chosen)
      ...(a.reporter === 'monocart'
        ? {
            'monocart-reporter': '^2.9.18',
          }
        : {}),
      // TypeScript toolchain (present for both `ts` and `js` selections)
      ...(a.language === 'ts' || a.language === 'js'
        ? {
            typescript: '^5.8.3',
            'ts-node': '^10.9.2',
            tsx: '^4.20.6',
            '@types/node': '^20.14.15',
            '@types/argparse': '^2.0.17',
            'typescript-eslint': '^8.8.1',
          }
        : {}),
      // Notification-related packages (when enabled)
      ...(a.notifications
        ? {
            nodemailer: '^7.0.11',
            '@slack/webhook': '^7.0.6',
            '@types/nodemailer': '^7.0.4',
          }
        : {}),
      // JSON schema validation (api/soap/hybrid presets)
      ...(hasPreset('api', 'soap', 'hybrid')
        ? {
            ajv: '^8.12.0',
            'ajv-formats': '^2.1.1',
          }
        : {}),
      // SOAP parsing/serialization (soap/hybrid presets)
      ...(hasPreset('soap', 'hybrid')
        ? {
            'fast-xml-parser': '^5.3.3',
          }
        : {}),
      // Cucumber and related tools for BDD-style testing
      ...(a.framework === 'playwright-bdd'
        ? {
            'playwright-bdd': '^9.0.0',
            'prettier-plugin-gherkin': '^4.0.0',
            'eslint-plugin-cucumber': '^2.0.0',
            'gherkin-lint': '^4.2.4',
          }
        : {}),
    });

    devDeps = { ...coreDevDeps, ...conditionalDevDeps };
  });

  // Apply the dependency changes and write back `package.json`.
  await step('Finalize package.json', async () => {
    pkg.dependencies = { ...(pkg.dependencies ?? {}), ...deps };
    pkg.devDependencies = {
      ...(pkg.devDependencies ?? {}),
      ...Object.fromEntries(Object.entries(devDeps).filter(([, v]) => v)),
    };

    // If husky is requested, add lint-staged and a prepare script
    if (a.husky) {
      pkg['lint-staged'] = {
        '*.{ts,js}': [
          'eslint . --fix --max-warnings 0 --no-cache',
          'prettier -w . --ignore-pattern .prettierignore',
        ],
      };
      pkg.scripts = { ...(pkg.scripts ?? {}), prepare: 'husky' };
    }

    // Build reporter scripts (npm/yarn aware via pmBin)
    pkg.scripts = pkg.scripts ?? {};
    const reporterScripts: Record<string, Record<string, string>> = {
      allure: {
        'allure:report:generate': `${xenv} ALLURE_NO_ANALYTICS=1 allure generate --single-file artifacts/reports/allure-results -o artifacts/reports/allure-report --clean`,
        'allure:report:show': `${xenv} ALLURE_NO_ANALYTICS=1 allure open artifacts/reports/allure-report`,
        'allure:report:open': `npm run allure:report:generate && npm run allure:report:show`,
      },
      monocart: {
        'monocart:report:open': `${pmBin} monocart show-report ${path.join('artifacts', 'reports', 'monocart-report')}/`,
      },
      html: {
        'html:report:open': `${pmBin} playwright show-report ${path.join('artifacts', 'reports', 'html-reports')}`,
      },
      tta: {
        'tta:report:open': `${pmBin} http-server ${path.join('artifacts', 'reports', 'tta-report')} -c-1 -a localhost -o index.html`,
      },
    };

    if (reporterScripts[a.reporter]) {
      pkg.scripts = { ...pkg.scripts, ...reporterScripts[a.reporter] };
    }

    await writeJSON(pkgPath, pkg);
  });

  // --- Include best-practices docs ---
  await step('Include docs', async () => {
    await copyDir(TPL('docs/best-practices'), path.join(dest, 'docs/best-practices'));
  });
  if (a.mode === 'convert') {
    await step('Add legacy conversion placeholder', async () => {
      const placeholder = `# Legacy conversion placeholder

This project was created with the Playwright conversion workflow.

Legacy source:
- language: ${a.sourceLanguage ?? 'java'}
- framework: ${a.sourceFramework ?? 'selenium'}
- style: ${a.sourceStyle ?? 'non-bdd'}
- path: ${a.sourcePath ?? './legacy'}
- conversion agent: ${a.conversionAgent ?? 'default'}

Next steps:
1. Review legacy code under the source path.
2. Map Selenium/TestNG/Cucumber patterns to Playwright/Playwright BDD.
3. Replace this note with actual converted files or generated test skeletons.
`;
      await fs.writeFile(path.join(dest, 'LEGACY_CONVERSION.md'), placeholder, 'utf8');
      await fs.writeFile(
        path.join(dest, 'src', 'legacy-conversion.ts'),
        `/**
 * Placeholder for legacy conversion helpers.
 *
 * Replace this file with generated migration helpers or translated test code.
 */
export const legacyConversionPlaceholder = {
  sourceLanguage: '${a.sourceLanguage ?? 'java'}',
  sourceFramework: '${a.sourceFramework ?? 'selenium'}',
  sourceStyle: '${a.sourceStyle ?? 'non-bdd'}',
  sourcePath: '${a.sourcePath ?? './legacy'}',
  conversionAgent: '${a.conversionAgent ?? 'default'}',
};
`,
        'utf8',
      );

      await ensureDir(path.join(dest, 'src', 'agents'));
      await fs.writeFile(
        path.join(dest, 'src', 'agents', 'conversion-agent.ts'),
        `/**
 * Conversion agent implementation stub.
 *
 * This file reflects the selected conversion agent and can be replaced with
 * real migration logic or AI-assisted translation support.
 */

export const conversionAgent = {
  type: '${a.conversionAgent ?? 'default'}',
  describe() {
    return '${
      a.conversionAgent === 'ai-assisted'
        ? 'AI-assisted conversion: generate smarter migration guidance and skeletons.'
        : 'Default conversion placeholder: scaffold a target project and add manual migration notes.'
    }';
  },
};
`,
        'utf8',
      );
    });
  }
}
