import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test, { after, before } from 'node:test';

import { ESLint } from 'eslint';
import { importX } from 'eslint-plugin-import-x';
import { parser } from 'typescript-eslint';

const boundaryRuleNames = new Set([
  'import-x/no-restricted-paths',
  'no-restricted-imports',
  'no-restricted-properties',
]);
const projectLinter = new ESLint();

async function lintBoundary(source, filePath) {
  const effective = await projectLinter.calculateConfigForFile(filePath);
  assert.ok(effective, `No configuration for ${filePath}`);
  const rules = Object.fromEntries(
    Object.entries(effective.rules).filter(([name]) => boundaryRuleNames.has(name)),
  );
  const fixtureLinter = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: { parser },
        plugins: { 'import-x': importX },
        settings: effective.settings,
        rules,
      },
    ],
  });
  const [result] = await fixtureLinter.lintText(source, { filePath });
  assert.ok(result);
  assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
  return result.messages;
}

const corePaths = [
  'src/domain/boundary-fixture.ts',
  'src/application/boundary-fixture.ts',
  'src/application/boundary-fixture.spec.ts',
];
const restrictedPackages = [
  '@nestjs/common',
  '@nestjs/swagger',
  '@nestjs/testing',
  'nestjs-pino',
  'nestjs-pino/Logger',
  'pino-http',
  'pino-http/subpath',
  'express',
  'express/subpath',
  'zod',
  'zod/v4',
];

for (const filePath of corePaths) {
  for (const dependency of restrictedPackages) {
    for (const source of [
      `import { Symbol } from '${dependency}';`,
      `import type { Symbol } from '${dependency}';`,
    ]) {
      test(`${filePath} rejects ${source}`, async () => {
        const messages = await lintBoundary(source, filePath);
        assert.ok(messages.some((message) => message.ruleId === 'no-restricted-imports'));
      });
    }
  }
}

for (const source of [
  "import { appConfig } from '@infrastructure/config/app.config';",
  "import { appConfig } from '../infrastructure/config/app.config';",
]) {
  test(`application rejects outward import: ${source}`, async () => {
    const messages = await lintBoundary(source, 'src/application/boundary-fixture.ts');
    assert.ok(messages.some((message) => message.ruleId === 'import-x/no-restricted-paths'));
  });
}

test('domain rejects application alias imports', async () => {
  const messages = await lintBoundary(
    "import { CommonError } from '@application/error/common.error';",
    'src/domain/boundary-fixture.ts',
  );
  assert.ok(messages.some((message) => message.ruleId === 'import-x/no-restricted-paths'));
});

const allowedImports = [
  ['src/domain/boundary-fixture.ts', "import { randomUUID } from 'node:crypto';"],
  ['src/application/error/boundary-fixture.ts', "import { CommonError } from './common.error';"],
  [
    'src/presentation/rest/boundary-fixture.ts',
    "import { CommonError } from '@application/error/common.error';",
  ],
  ['src/presentation/rest/boundary-fixture.ts', "import { Controller } from '@nestjs/common';"],
  ['src/infrastructure/boundary-fixture.ts', "import { z } from 'zod';"],
  ['src/app.module.ts', "import { appConfig } from '@infrastructure/config/app.config';"],
];
for (const [filePath, source] of allowedImports) {
  test(`${filePath} permits ${source}`, async () => {
    assert.deepEqual(await lintBoundary(source, filePath), []);
  });
}

for (const filePath of [
  'src/domain/boundary-fixture.ts',
  'src/application/boundary-fixture.ts',
  'src/infrastructure/boundary-fixture.ts',
  'src/presentation/rest/boundary-fixture.ts',
  'src/main.ts',
  'src/app.module.ts',
]) {
  test(`${filePath} rejects direct env access`, async () => {
    const messages = await lintBoundary("const port = process.env['PORT'];", filePath);
    assert.ok(messages.some((message) => message.ruleId === 'no-restricted-properties'));
  });
}
for (const filePath of [
  'src/infrastructure/config/app.config.ts',
  'src/infrastructure/config/app.config.spec.ts',
  'src/infrastructure/config/product.config.ts',
  'src/infrastructure/config/product.config.spec.ts',
]) {
  test(`${filePath} permits the centralized env reader/test`, async () => {
    assert.deepEqual(await lintBoundary("const port = process.env['PORT'];", filePath), []);
  });
}
for (const filePath of [
  'src/infrastructure/config/log-level.ts',
  'src/composition/boundary-fixture.module.ts',
]) {
  test(`${filePath} rejects direct env access`, async () => {
    const messages = await lintBoundary("const port = process.env['PORT'];", filePath);
    assert.ok(messages.some((message) => message.ruleId === 'no-restricted-properties'));
  });
}

/* eslint-disable security/detect-non-literal-fs-filename -- Test fixtures use paths created in this file. */
// no-restricted-paths skips imports it cannot resolve, so the composition
// target must exist on disk while these fixtures run.
const compositionDir = 'src/composition';
const compositionFixtureName = `boundary-fixture-${process.pid}.module`;
const compositionFixture = `${compositionDir}/${compositionFixtureName}.ts`;
const compositionDirExisted = existsSync(compositionDir);
async function cleanupFixture(fixture, directory, directoryExisted) {
  await rm(fixture, { force: true });
  if (directoryExisted) return;
  try {
    await rmdir(directory);
  } catch (error) {
    if (error?.code !== 'ENOTEMPTY' && error?.code !== 'ENOENT' && error?.code !== 'EEXIST') {
      throw error;
    }
  }
}
test('fixture cleanup preserves another run fixture and removes the directory when empty', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'boundary-fixtures-'));
  const firstFixture = path.join(directory, 'first.module.ts');
  const secondFixture = path.join(directory, 'second.module.ts');
  try {
    await writeFile(firstFixture, 'export const first = 1;\n');
    await writeFile(secondFixture, 'export const second = 2;\n');

    await cleanupFixture(firstFixture, directory, false);
    assert.equal(existsSync(secondFixture), true);

    await cleanupFixture(secondFixture, directory, false);
    assert.equal(existsSync(directory), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
before(async () => {
  await mkdir(compositionDir, { recursive: true });
  await writeFile(compositionFixture, 'export const fixture = 1;\n');
});
after(async () => {
  await cleanupFixture(compositionFixture, compositionDir, compositionDirExisted);
});

for (const [filePath, source] of [
  [
    'src/domain/boundary-fixture.ts',
    `import { fixture } from '../composition/${compositionFixtureName}';`,
  ],
  [
    'src/application/boundary-fixture.ts',
    `import { fixture } from '../composition/${compositionFixtureName}';`,
  ],
  [
    'src/infrastructure/boundary-fixture.ts',
    `import { fixture } from '../composition/${compositionFixtureName}';`,
  ],
  [
    'src/presentation/rest/boundary-fixture.ts',
    `import { fixture } from '../../composition/${compositionFixtureName}';`,
  ],
]) {
  test(`${filePath} rejects composition import`, async () => {
    const messages = await lintBoundary(source, filePath);
    assert.ok(messages.some((message) => message.ruleId === 'import-x/no-restricted-paths'));
  });
}

for (const source of [
  "import { appConfig } from '@infrastructure/config/app.config';",
  "import { HealthModule } from '@presentation/rest/api/health/health.module';",
  "import { CommonError } from '@application/error/common.error';",
  "import { Module } from '@nestjs/common';",
]) {
  test(`src/composition permits ${source}`, async () => {
    assert.deepEqual(await lintBoundary(source, compositionFixture), []);
  });
}
/* eslint-enable security/detect-non-literal-fs-filename -- Restore path checks outside test fixtures. */
