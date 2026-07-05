import { Command } from 'commander';
import { bold, cyan } from 'kolorist';
import { askQuestions } from './prompts.js';
import { scaffold } from './scaffold.js';

/**
 * Entry point for the CLI.
 *
 * This module wires up `commander` to expose a `gen` command that accepts
 * flags and arguments. It validates enum-like options, delegates interactive
 * prompting to `askQuestions`, and calls `scaffold` to generate the project
 * files.
 *
 * Keep this file focused on CLI concerns (parsing, validation, user-facing
 * messages). Business logic (template rendering and file IO) lives in
 * `src/scaffold.ts` and prompt shapes are defined by `src/prompts.ts`.
 */

// Create a new Command instance
const program = new Command();

// Define the CLI top-level metadata
program
  .name('test-framework-generator')
  .description(
    'Scaffold a Playwright test framework baseline with best practices code quality checks implemented as boilerplate',
  )
  .version('1.0.0');

// ---------------------------------------------------------------------------
// `gen` command
// ---------------------------------------------------------------------------
// This command accepts a project name and a small set of flags. Flags are
// intentionally simple and mirrored in `askQuestions` so the scaffolder can
// operate in both interactive and non-interactive modes (CI / automation).
program
  .command('gen')
  .alias('init')
  .description('Generate a Playwright test framework project')
  .argument('<project-name>', 'folder to create')
  .option('-y, --yes', 'Use defaults and skip prompts', false)
  .option('--non-interactive', 'Alias of --yes', false)
  .option('--pm <name>', 'Package manager (npm|yarn)', 'npm')
  .option('--js', 'Use JavaScript instead of TypeScript', false)
  .option('--ci <provider>', 'CI provider (github|gitlab|none)', 'github')
  .option('--reporter <name>', 'Test reporter (html|allure|monocart|tta)', 'allure')
  .option('--notifications <value>', 'Include notifications (true/false)', 'true')
  .option('--zephyr', 'Include Zephyr results stub', false)
  .option('--no-husky', 'Skip Husky hooks', true)
  .option('--framework <name>', 'Test framework (playwright|playwright-bdd)', 'playwright')
  .option('--preset <name>', 'Quick preset (web|api|soap|hybrid)', 'web')
  .action(async (projectName, flags, cmd) => {
    const allowed = {
      pm: ['npm', 'yarn'],
      ci: ['github', 'gitlab', 'none'],
      reporter: ['html', 'allure', 'monocart', 'tta'],
      framework: ['playwright', 'playwright-bdd'],
      preset: ['web', 'api', 'soap', 'hybrid'],
    };

    const errors = [] as string[];
    if (flags.pm && !allowed.pm.includes(flags.pm)) {
      errors.push(`  --pm must be one of: ${allowed.pm.join(', ')}`);
    }
    if (flags.ci && !allowed.ci.includes(flags.ci)) {
      errors.push(`  --ci must be one of: ${allowed.ci.join(', ')}`);
    }
    if (flags.reporter && !allowed.reporter.includes(flags.reporter)) {
      errors.push(`  --reporter must be one of: ${allowed.reporter.join(', ')}`);
    }
    if (flags.framework && !allowed.framework.includes(flags.framework)) {
      errors.push(`  --framework must be one of: ${allowed.framework.join(', ')}`);
    }
    if (flags.preset && !allowed.preset.includes(flags.preset)) {
      errors.push(`  --preset must be one of: ${allowed.preset.join(', ')}`);
    }

    if (errors.length) {
      console.error(`\n${bold('✖ Invalid option(s):')}\n${errors.join('\n')}`);
      cmd.help({ error: true });
      process.exit(1);
    }

    const answers = await askQuestions(projectName, flags, 'generate');
    await scaffold(answers);
    console.log(`\n${bold('✔ Done!')} cd ${cyan(projectName)} && npm i && npm test`);
  });

program
  .command('convert')
  .description('Scaffold a Playwright project and prepare a legacy migration placeholder')
  .argument('<project-name>', 'folder to create')
  .option('-y, --yes', 'Use defaults and skip prompts', false)
  .option('--non-interactive', 'Alias of --yes', false)
  .option('--pm <name>', 'Package manager (npm|yarn)', 'npm')
  .option('--js', 'Use JavaScript instead of TypeScript', false)
  .option('--ci <provider>', 'CI provider (github|gitlab|none)', 'github')
  .option('--reporter <name>', 'Test reporter (html|allure|monocart|tta)', 'allure')
  .option('--notifications <value>', 'Include notifications (true/false)', 'true')
  .option('--zephyr', 'Include Zephyr results stub', false)
  .option('--no-husky', 'Skip Husky hooks', true)
  .option('--framework <name>', 'Test framework (playwright|playwright-bdd)', 'playwright')
  .option('--preset <name>', 'Quick preset (web|api|soap|hybrid)', 'web')
  .option('--source-language <name>', 'Legacy source language (java|kotlin|js)', 'java')
  .option(
    '--source-framework <name>',
    'Legacy source framework (selenium|testng|junit|cucumber)',
    'selenium',
  )
  .option('--source-style <name>', 'Legacy test style (bdd|non-bdd)', 'non-bdd')
  .option('--source-path <path>', 'Path to legacy source code', './legacy')
  .option('--conversion-agent <name>', 'Conversion agent (default|ai-assisted)', 'default')
  .action(async (projectName, flags, cmd) => {
    const allowed = {
      pm: ['npm', 'yarn'],
      ci: ['github', 'gitlab', 'none'],
      reporter: ['html', 'allure', 'monocart', 'tta'],
      framework: ['playwright', 'playwright-bdd'],
      preset: ['web', 'api', 'soap', 'hybrid'],
      sourceLanguage: ['java', 'kotlin', 'js'],
      sourceFramework: ['selenium', 'testng', 'junit', 'cucumber'],
      sourceStyle: ['bdd', 'non-bdd'],
      conversionAgent: ['default', 'ai-assisted'],
    };

    const errors = [] as string[];
    if (flags.pm && !allowed.pm.includes(flags.pm)) {
      errors.push(`  --pm must be one of: ${allowed.pm.join(', ')}`);
    }
    if (flags.ci && !allowed.ci.includes(flags.ci)) {
      errors.push(`  --ci must be one of: ${allowed.ci.join(', ')}`);
    }
    if (flags.reporter && !allowed.reporter.includes(flags.reporter)) {
      errors.push(`  --reporter must be one of: ${allowed.reporter.join(', ')}`);
    }
    if (flags.framework && !allowed.framework.includes(flags.framework)) {
      errors.push(`  --framework must be one of: ${allowed.framework.join(', ')}`);
    }
    if (flags.preset && !allowed.preset.includes(flags.preset)) {
      errors.push(`  --preset must be one of: ${allowed.preset.join(', ')}`);
    }
    if (flags.sourceLanguage && !allowed.sourceLanguage.includes(flags.sourceLanguage)) {
      errors.push(`  --source-language must be one of: ${allowed.sourceLanguage.join(', ')}`);
    }
    if (flags.sourceFramework && !allowed.sourceFramework.includes(flags.sourceFramework)) {
      errors.push(`  --source-framework must be one of: ${allowed.sourceFramework.join(', ')}`);
    }
    if (flags.sourceStyle && !allowed.sourceStyle.includes(flags.sourceStyle)) {
      errors.push(`  --source-style must be one of: ${allowed.sourceStyle.join(', ')}`);
    }
    if (flags.conversionAgent && !allowed.conversionAgent.includes(flags.conversionAgent)) {
      errors.push(`  --conversion-agent must be one of: ${allowed.conversionAgent.join(', ')}`);
    }

    if (errors.length) {
      console.error(`\n${bold('✖ Invalid option(s):')}\n${errors.join('\n')}`);
      cmd.help({ error: true });
      process.exit(1);
    }

    const answers = await askQuestions(projectName, flags, 'convert');
    await scaffold(answers);
    console.log(`\n${bold('✔ Done!')} cd ${cyan(projectName)} && npm i && npm test`);
  });

program.parse(process.argv);
