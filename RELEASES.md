# Release Notes

All notable changes to this project will be documented in this file.

## [Unreleased]

- Initial release notes file created.

## [1.0.0] - 2026-06-29

- Initial public release of playwright-test-framework-generator.
- Supports non-interactive and interactive CLI scaffolding.
- Presets: web, api, hybrid, soap.
- Built-in support for Allure, Monocart, and HTML reporters.
- CI templates for GitHub and GitLab.
- Notification hooks (Gmail & Slack) and Zephyr stub included.
- Husky pre-commit hooks and lint/type-check integration.
- Support for GraphQL and Apollo GraphQL client calls and tests.
- Generates both BDD and non-BDD based Framework.

## [1.0.1] - 2026-05-07

Minimised the number of sub-folders under src from 10 to 5 to minimise pain of context switching.
Moved the data folder out of src so it sits parallel to src, also renamed to test-data (industry standard).
Reorganised files and folders under templates/playwright.
Optimised src/scaffold.ts and added comments/JSDoc across files under src folder.
Added support for GraphQL and Apollo GraphQL client calls and tests.
Documentation updates, and miscellaneous bug fixes and test repairs.

## [1.0.2] - 2026-07-05

- Refactor dotenv/config, CLI flags, scripts and tests
  - Major refactor to environment/config handling, CLI flags, package scripts and tests.

- Rename init command to gen with init alias
  - Change the primary CLI command from `init` to `gen` for better semantic clarity, while maintaining backward compatibility via an alias. Updates all documentation, examples, and tests to use the new command name.

- Rename CLI binary to test-framework-generator
  - Switch the package CLI name from "playwright-test-framework-generator" to "test-framework-generator".
  - Update README examples and instructions (including an added `npm link` section) to use the new binary name.
  - Adjust source and test files to reflect the renamed CLI, and update package-lock.json to point the `bin` entry at the new name and include dependency/version bumps (esbuild, rollup, eslint-related packages, and others) produced by dependency refresh.

- Fixes template rendering conditionals for HTML reporter in notifications and playwright config, and corrects a test script reference from `test:headed` to `test:runner:dev`.
  - Change --notifications from channels list to boolean-like value and update prompts mapping.
  - Replace dotenv with dotenv-flow and return parsed dotEnv; update getConfig signature and env resolution (use NODE_ENV); make dotEnv available in config.
  - Rename staging->stage env, switch API/APP keys to apiBaseURL, make projects optional, add projectName and dotEnv types.
  - Make Playwright config conditional on preset (devices/projects only for web/hybrid) and adjust global-setup/test-runner to use NODE_ENV, wait-on, rimraf.
  - Update package.json templates: new scripts (test:dev, test:runner:dev, prettier-fix, reports:clean, logs:clean) and notification scripts conditional on flag.
  - Add dev/runtime deps: wait-on, @types/wait-on, dotenv-flow; ensure src/agents dir creation.
  - Add VSCode icon extension and numerous test updates/expansions to cover new behavior.

These changes align env handling across presets and enable deterministic test scripts and CI behavior.
