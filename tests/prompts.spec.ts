/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { askQuestions } from '../src/prompts.js';

describe('askQuestions (non-interactive flags mapping)', () => {
  it('maps flags to Answers correctly (js, yarn, gitlab, monocart, no-husky, zephyr)', async () => {
    const flags = {
      yes: true,
      js: true,
      pm: 'yarn',
      ci: 'gitlab',
      reporter: 'monocart',
      husky: false,
      zephyr: true,
      preset: 'api',
      notifications: false,
    } as any;

    const ans = await askQuestions('myproj', flags);

    expect(ans.projectName).toBe('myproj');
    expect(ans.language).toBe('js');
    expect(ans.packageManager).toBe('yarn');
    expect(ans.ci).toBe('gitlab');
    expect(ans.reporter).toBe('monocart');
    expect(ans.husky).toBe(false);
    expect(ans.zephyr).toBe(true);
    expect(ans.preset).toBe('api');
    expect(ans.notifications).toBe(false);
  });

  it('applies defaults when flags are sparse', async () => {
    const flags = { yes: true } as any;
    const ans = await askQuestions('p2', flags);

    // defaults as declared in prompts.ts
    expect(ans.projectName).toBe('p2');
    expect(ans.language).toBe('ts');
    expect(ans.packageManager).toBe('npm');
    expect(ans.ci).toBe('github');
    expect(ans.reporter).toBe('allure');
    expect(ans.husky).toBe(true);
    expect(ans.zephyr).toBe(false);
    expect(ans.preset).toBe('web');
    expect(ans.notifications).toBe(true);
  });

  it('maps flags to Answers correctly for soap preset (js, npm, github, allure, husky)', async () => {
    const flags = {
      yes: true,
      js: true,
      pm: 'npm',
      ci: 'github',
      reporter: 'allure',
      husky: true,
      preset: 'soap',
      notifications: true,
    } as any;

    const ans = await askQuestions('soapproj', flags);

    expect(ans.projectName).toBe('soapproj');
    expect(ans.language).toBe('js');
    expect(ans.packageManager).toBe('npm');
    expect(ans.ci).toBe('github');
    expect(ans.reporter).toBe('allure');
    expect(ans.husky).toBe(true);
    expect(ans.preset).toBe('soap');
    expect(ans.notifications).toBe(true);
  });

  it('maps convert flags to Answers correctly (java selenium bdd)', async () => {
    const flags = {
      yes: true,
      js: false,
      pm: 'npm',
      ci: 'github',
      reporter: 'allure',
      husky: true,
      preset: 'web',
      notifications: true,
      sourceLanguage: 'java',
      sourceFramework: 'selenium',
      sourceStyle: 'bdd',
      sourcePath: './legacy-tests',
    } as any;

    const ans = await askQuestions('convertproj', flags, 'convert');

    expect(ans.projectName).toBe('convertproj');
    expect(ans.language).toBe('ts');
    expect(ans.packageManager).toBe('npm');
    expect(ans.ci).toBe('github');
    expect(ans.reporter).toBe('allure');
    expect(ans.husky).toBe(true);
    expect(ans.preset).toBe('web');
    expect(ans.notifications).toBe(true);
    expect(ans.mode).toBe('convert');
    expect(ans.sourceLanguage).toBe('java');
    expect(ans.sourceFramework).toBe('selenium');
    expect(ans.sourceStyle).toBe('bdd');
    expect(ans.sourcePath).toBe('./legacy-tests');
    expect(ans.conversionAgent).toBe('default');
  });

  it('maps playwright-bdd framework flag correctly', async () => {
    const flags = {
      yes: true,
      framework: 'playwright-bdd',
      preset: 'web',
    } as any;

    const ans = await askQuestions('bddproj', flags);

    expect(ans.projectName).toBe('bddproj');
    expect(ans.framework).toBe('playwright-bdd');
    expect(ans.preset).toBe('web');
    expect(ans.language).toBe('ts');
    expect(ans.packageManager).toBe('npm');
  });

  it('defaults to playwright framework when not specified', async () => {
    const flags = { yes: true } as any;
    const ans = await askQuestions('playwrightproj', flags);

    expect(ans.framework).toBe('playwright');
    expect(ans.preset).toBe('web');
  });

  it('maps tta reporter flag correctly', async () => {
    const flags = {
      yes: true,
      reporter: 'tta',
      preset: 'hybrid',
    } as any;

    const ans = await askQuestions('ttaproj', flags);

    expect(ans.reporter).toBe('tta');
    expect(ans.preset).toBe('hybrid');
  });

  it('maps html reporter flag correctly', async () => {
    const flags = {
      yes: true,
      reporter: 'html',
      preset: 'api',
      ci: 'none',
    } as any;

    const ans = await askQuestions('htmlproj', flags);

    expect(ans.reporter).toBe('html');
    expect(ans.preset).toBe('api');
    expect(ans.ci).toBe('none');
  });

  it('maps playwright-bdd with soap preset and notifications disabled', async () => {
    const flags = {
      yes: true,
      framework: 'playwright-bdd',
      preset: 'soap',
      notifications: false,
      pm: 'yarn',
      reporter: 'monocart',
    } as any;

    const ans = await askQuestions('soap-bdd', flags);

    expect(ans.framework).toBe('playwright-bdd');
    expect(ans.preset).toBe('soap');
    expect(ans.notifications).toBe(false);
    expect(ans.packageManager).toBe('yarn');
    expect(ans.reporter).toBe('monocart');
  });

  it('maps hybrid preset with all options', async () => {
    const flags = {
      yes: true,
      framework: 'playwright-bdd',
      preset: 'hybrid',
      reporter: 'allure',
      ci: 'gitlab',
      pm: 'yarn',
      js: true,
      husky: true,
      zephyr: true,
      notifications: true,
    } as any;

    const ans = await askQuestions('hybrid-full', flags);

    expect(ans.framework).toBe('playwright-bdd');
    expect(ans.preset).toBe('hybrid');
    expect(ans.reporter).toBe('allure');
    expect(ans.ci).toBe('gitlab');
    expect(ans.packageManager).toBe('yarn');
    expect(ans.language).toBe('js');
    expect(ans.husky).toBe(true);
    expect(ans.zephyr).toBe(true);
    expect(ans.notifications).toBe(true);
  });

  it('convert mode with kotlin testng non-bdd and ai-assisted agent', async () => {
    const flags = {
      yes: true,
      pm: 'yarn',
      reporter: 'tta',
      sourceLanguage: 'kotlin',
      sourceFramework: 'testng',
      sourceStyle: 'non-bdd',
      sourcePath: './old-tests',
      conversionAgent: 'ai-assisted',
    } as any;

    const ans = await askQuestions('convert-kotlin', flags, 'convert');

    expect(ans.mode).toBe('convert');
    expect(ans.sourceLanguage).toBe('kotlin');
    expect(ans.sourceFramework).toBe('testng');
    expect(ans.sourceStyle).toBe('non-bdd');
    expect(ans.sourcePath).toBe('./old-tests');
    expect(ans.conversionAgent).toBe('ai-assisted');
    expect(ans.packageManager).toBe('yarn');
    expect(ans.reporter).toBe('tta');
  });

  it('playground-bdd with html reporter and no ci', async () => {
    const flags = {
      yes: true,
      framework: 'playwright-bdd',
      reporter: 'html',
      ci: 'none',
      preset: 'web',
      husky: false,
    } as any;

    const ans = await askQuestions('local-bdd-tests', flags);

    expect(ans.framework).toBe('playwright-bdd');
    expect(ans.reporter).toBe('html');
    expect(ans.ci).toBe('none');
    expect(ans.preset).toBe('web');
    expect(ans.husky).toBe(false);
  });

  it('notifications default to true when not specified', async () => {
    const flags = {
      yes: true,
      framework: 'playwright',
      preset: 'api',
    } as any;

    const ans = await askQuestions('no-notify-flags', flags);

    expect(ans.notifications).toBe(true);
  });

  it('zephyr default to false when not specified', async () => {
    const flags = {
      yes: true,
      framework: 'playwright',
    } as any;

    const ans = await askQuestions('no-zephyr', flags);

    expect(ans.zephyr).toBe(false);
  });
});
