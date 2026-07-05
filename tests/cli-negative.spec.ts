import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { exists, makeTmpDir, runCLI } from './helpers';

const distEntry = path.resolve(process.cwd(), 'dist/index.js'); // your built CLI

describe('CLI negative cases', () => {
  it('fails when project-name is missing', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [distEntry, 'gen']); // no project-name

    // Commander exits with non-zero on argument error; our helper doesn't throw
    expect(exitCode).toBe(1);

    // Commander may format differently across versions, match the meaningful part
    expect(out).toMatch(/error:\s*missing required argument ['"]project-name['"]/i);

    // Ensure nothing got created accidentally
    const shouldNotExist = path.join(tmp, 'missing'); // sentinel; not used by CLI
    expect(exists(shouldNotExist)).toBe(false);
  });

  it('fails on unknown option', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-unknown',
      '--not-a-real-flag',
    ]);

    expect(exitCode).toBe(1);
    expect(out).toMatch(/error:\s*unknown option/i);
  });

  it('fails on invalid preset value', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-bad-preset',
      '--preset',
      'invalid-preset',
      '-y',
    ]);

    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('fails on invalid reporter value', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-bad-reporter',
      '--reporter',
      'invalid-reporter',
      '-y',
    ]);

    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('fails on invalid framework value', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-bad-framework',
      '--framework',
      'invalid-framework',
      '-y',
    ]);

    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('fails on invalid ci value', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-bad-ci',
      '--ci',
      'invalid-ci',
      '-y',
    ]);

    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('fails on invalid package manager', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-bad-pm',
      '--pm',
      'pnpm',
      '-y',
    ]);

    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('--js flag is boolean and ignores extra arguments', async () => {
    const tmp = makeTmpDir();
    const { exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-js-flag-test',
      '--js',
      'kotlin', // Extra argument is ignored by Commander
      '-y',
    ]);

    // Should succeed - extra arguments are simply ignored
    expect(exitCode).toBe(0);
  });

  it('convert command succeeds with defaults when no source options provided', async () => {
    const tmp = makeTmpDir();
    const { exitCode } = await runCLI(tmp, 'node', [distEntry, 'convert', 'proj-convert', '-y']);

    // Convert mode succeeds with defaults when no source options are provided
    expect(exitCode).toBe(0);
  });

  it('fails on invalid source language for convert', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'convert',
      'proj-bad-source-lang',
      '--source-language',
      'python',
      '-y',
    ]);

    // Should fail with invalid source language
    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('fails on invalid source framework for convert', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'convert',
      'proj-bad-source-fw',
      '--source-framework',
      'webdriver',
      '-y',
    ]);

    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('fails on invalid conversion agent', async () => {
    const tmp = makeTmpDir();
    const { out, exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'convert',
      'proj-bad-agent',
      '--conversion-agent',
      'bad-agent',
      '-y',
    ]);

    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/invalid|error/i);
  });

  it('gen command accepts --yes flag synonym', async () => {
    const tmp = makeTmpDir();
    const { exitCode } = await runCLI(tmp, 'node', [
      distEntry,
      'gen',
      'proj-yes-alias',
      '--non-interactive', // Alias for --yes
    ]);

    expect(exitCode).toBe(0);
  });

  it('gen command with valid flags succeeds with all reporters', async () => {
    const reporters = ['allure', 'html', 'monocart', 'tta'];
    for (const reporter of reporters) {
      const tmp = makeTmpDir();
      const { exitCode } = await runCLI(tmp, 'node', [
        distEntry,
        'gen',
        `proj-${reporter}`,
        '--reporter',
        reporter,
        '-y',
      ]);

      expect(exitCode).toBe(0);
    }
  });

  it('gen command with valid flags succeeds with all presets', async () => {
    const presets = ['web', 'api', 'soap', 'hybrid'];
    for (const preset of presets) {
      const tmp = makeTmpDir();
      const { exitCode } = await runCLI(tmp, 'node', [
        distEntry,
        'gen',
        `proj-${preset}`,
        '--preset',
        preset,
        '-y',
      ]);

      expect(exitCode).toBe(0);
    }
  });

  it('gen command with valid flags succeeds with all frameworks', async () => {
    const frameworks = ['playwright', 'playwright-bdd'];
    for (const framework of frameworks) {
      const tmp = makeTmpDir();
      const { exitCode } = await runCLI(tmp, 'node', [
        distEntry,
        'gen',
        `proj-${framework}`,
        '--framework',
        framework,
        '-y',
      ]);

      expect(exitCode).toBe(0);
    }
  });
});
