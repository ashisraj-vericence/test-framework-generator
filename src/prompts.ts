/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * `prompts.ts`
 *
 * Presents interactive CLI questions (via `inquirer`) and returns a normalized
 * `Answers` object that drives the scaffolder. To support non-interactive
 * environments (CI or `--yes`/`--nonInteractive`) the function also accepts a
 * `flags` object and will short-circuit to sensible defaults when required.
 */
import inquirer from 'inquirer';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
// The canonical shape returned by `askQuestions` — used across the codebase
// (templates, scaffold logic, and tests). Keep this in sync with templates.
export type Answers = {
  projectName: string;
  language: 'ts' | 'js';
  packageManager: 'npm' | 'yarn';
  ci: 'github' | 'gitlab' | 'none';
  reporter: 'html' | 'allure' | 'monocart' | 'tta';
  notifications: boolean;
  husky: boolean;
  zephyr: boolean;
  framework: 'playwright' | 'playwright-bdd';
  preset: 'web' | 'api' | 'soap' | 'hybrid';
  mode: 'generate' | 'convert';
  sourceLanguage?: 'java' | 'kotlin' | 'js';
  sourceFramework?: 'selenium' | 'testng' | 'junit' | 'cucumber';
  sourceStyle?: 'bdd' | 'non-bdd';
  sourcePath?: string;
  conversionAgent?: 'default' | 'ai-assisted';
};

// ---------------------------------------------------------------------------
// Internal helper types for inquirer question shapes
// ---------------------------------------------------------------------------
type ListQ<K extends keyof Answers> = {
  type: 'list';
  name: K;
  message: string;
  // Choices are intentionally `any[]` because inquirer accepts mixed values
  choices: readonly any[];
  default?: Answers[K];
};

type InputQ<K extends keyof Answers> = {
  type: 'input';
  name: K;
  message: string;
  default?: string;
};

type ConfirmQ<K extends keyof Answers> = {
  type: 'confirm';
  name: K;
  message: string;
  default?: boolean;
};

// Union type used to satisfy the `questions` array typing below
type Q = ListQ<keyof Answers> | ConfirmQ<keyof Answers> | InputQ<keyof Answers>;

/**
 * Ask the user configuration questions and return a normalized `Answers`.
 *
 * Behavior summary:
 * - If running in non-interactive mode (CI or flags like `--yes`) the function
 *   returns defaults derived from `flags` without prompting.
 * - Otherwise it presents an interactive questionnaire and merges answers with
 *   the initial `base` defaults.
 *
 * @param projectName - the target folder/name for the new project
 * @param flags - parsed CLI flags (may contain defaults like --pm, --js, --ci)
 */
export async function askQuestions(
  projectName: string,
  flags: any,
  mode: 'generate' | 'convert' = 'generate',
): Promise<Answers> {
  // Non-interactive detection: either explicit flags or CI environment vars
  const nonInteractive =
    !!flags.yes || !!flags.nonInteractive || process.env.CI === '1' || process.env.CI === 'true';

  // Build a `base` object from flags. The interactive prompts use these values
  // as defaults so users can accept or change them. Use `Partial<Answers>` so
  // missing flags are handled gracefully.
  const base: Partial<Answers> = {
    projectName,
    // NOTE: flags.js indicates the user passed `--js`; default language is
    // TypeScript unless `--js` is present.
    language: flags.js ? 'js' : 'ts',
    packageManager: flags.pm === 'yarn' ? 'yarn' : 'npm',
    ci: flags.ci,
    reporter: flags.reporter,
    notifications: flags.notifications === 'false' || flags.notifications === false ? false : true,
    // Accept `--no-husky` by checking !== false
    husky: flags.husky !== false,
    zephyr: !!flags.zephyr,
    framework: flags.framework ?? 'playwright',
    preset: flags.preset,
    mode,
    sourceLanguage: flags.sourceLanguage,
    sourceFramework: flags.sourceFramework,
    sourceStyle: flags.sourceStyle,
    sourcePath: flags.sourcePath,
    conversionAgent: flags.conversionAgent,
  };

  // If non-interactive, return base values (or sensible defaults) immediately.
  // This is important for CI usage where prompts would block execution.
  if (nonInteractive) {
    return {
      projectName,
      language: (base.language ?? 'ts') as 'ts' | 'js',
      packageManager: (base.packageManager ?? 'npm') as 'npm' | 'yarn',
      ci: (base.ci ?? 'github') as 'github' | 'gitlab' | 'none',
      reporter: (base.reporter ?? 'allure') as 'html' | 'allure' | 'monocart' | 'tta',
      notifications: base.notifications ?? true,
      husky: base.husky ?? true,
      zephyr: base.zephyr ?? false,
      framework: (base.framework ?? 'playwright') as 'playwright' | 'playwright-bdd',
      preset: (base.preset ?? 'web') as 'web' | 'api' | 'soap' | 'hybrid',
      mode,
      sourceLanguage: (base.sourceLanguage ?? 'java') as 'java' | 'kotlin' | 'js',
      sourceFramework: (base.sourceFramework ?? 'selenium') as
        'selenium' | 'testng' | 'junit' | 'cucumber',
      sourceStyle: (base.sourceStyle ?? 'non-bdd') as 'bdd' | 'non-bdd',
      sourcePath: base.sourcePath ?? './legacy',
      conversionAgent: (base.conversionAgent ?? 'default') as 'default' | 'ai-assisted',
    };
  }

  // Interactive questionnaire. The `as const satisfies readonly Q[]` typing
  // ensures a read-only tuple-like structure while still matching our union
  // `Q` type above.
  const questions: Q[] = [
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager?',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
      default: base.packageManager,
    },
    {
      type: 'list',
      name: 'language' as const,
      message: 'Language?',
      choices: [
        { name: 'TypeScript', value: 'ts' },
        { name: 'JavaScript', value: 'js' },
      ],
      default: base.language,
    },
    {
      type: 'list',
      name: 'framework' as const,
      message: 'Test framework?',
      choices: [
        { name: 'Playwright', value: 'playwright' },
        { name: 'Playwright BDD', value: 'playwright-bdd' },
      ],
      default: base.framework,
    },
    {
      type: 'list',
      name: 'preset' as const,
      message: 'Preset?',
      choices: [
        { name: 'Web (UI/POM + Fixtures)', value: 'web' },
        { name: 'API (APIClient + GraphQLClient + ApolloClient + Fixtures)', value: 'api' },
        { name: 'Hybrid (UI + API + SOAP + Fixtures)', value: 'hybrid' },
        { name: 'SOAP (SOAPClient + Fixtures)', value: 'soap' },
      ],
      default: base.preset,
    },
    {
      type: 'list',
      name: 'ci' as const,
      message: 'CI provider?',
      choices: ['github', 'gitlab', 'none'],
      default: base.ci,
    },
    {
      type: 'list',
      name: 'reporter' as const,
      message: 'Reporter?',
      choices: ['html', 'allure', 'monocart', 'tta'],
      default: base.reporter,
    },
    {
      type: 'confirm',
      name: 'notifications' as const,
      message: 'Include notification channels (email, slack, teams):',
      default: base.notifications,
    },
    {
      type: 'confirm',
      name: 'husky' as const,
      message: 'Include Husky pre-commit hooks?',
      default: base.husky,
    },
    {
      type: 'confirm',
      name: 'zephyr' as const,
      message: 'Include Zephyr publish stub?',
      default: base.zephyr,
    },
  ];

  if (mode === 'convert') {
    questions.push(
      {
        type: 'list',
        name: 'sourceLanguage' as const,
        message: 'Legacy source language?',
        choices: [
          { name: 'Java', value: 'java' },
          { name: 'Kotlin', value: 'kotlin' },
          { name: 'JavaScript', value: 'js' },
        ],
        default: base.sourceLanguage ?? 'java',
      },
      {
        type: 'list',
        name: 'sourceFramework' as const,
        message: 'Legacy source framework?',
        choices: [
          { name: 'Selenium', value: 'selenium' },
          { name: 'TestNG', value: 'testng' },
          { name: 'JUnit', value: 'junit' },
          { name: 'Cucumber', value: 'cucumber' },
        ],
        default: base.sourceFramework ?? 'selenium',
      },
      {
        type: 'list',
        name: 'sourceStyle' as const,
        message: 'Legacy test style?',
        choices: [
          { name: 'Non-BDD / classic tests', value: 'non-bdd' },
          { name: 'BDD / Gherkin style', value: 'bdd' },
        ],
        default: base.sourceStyle ?? 'non-bdd',
      },
      {
        type: 'input',
        name: 'sourcePath' as const,
        message: 'Path to legacy source code?',
        default: base.sourcePath ?? './legacy',
      },
      {
        type: 'list',
        name: 'conversionAgent' as const,
        message: 'Conversion agent?',
        choices: [
          { name: 'Default placeholder', value: 'default' },
          { name: 'AI-assisted conversion', value: 'ai-assisted' },
        ],
        default: base.conversionAgent ?? 'default',
      },
    );
  }

  const answers = await (inquirer as any).prompt(questions);

  // Merge flag-derived defaults (`base`) with interactive `answers`. Values in
  // answers take precedence. The final object conforms to `Answers`.
  return { ...(base as Answers), ...(answers as Answers), mode };
}
