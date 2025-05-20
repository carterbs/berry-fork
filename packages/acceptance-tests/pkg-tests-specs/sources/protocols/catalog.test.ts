/* eslint @stylistic/quotes: 0 */
describe(`Protocols`, () => {
  describe(`catalog:`, () => {
    test(
      `it should resolve via default catalog`,
      makeTemporaryEnv(
        {
          dependencies: {[`no-deps`]: `catalog:`},
        },
        {dependencyCatalogs: {default: {"no-deps": "1.0.0"}}},
        async ({run, source}) => {
          await run(`install`);
          await expect(source(`require(\`no-deps/package.json\`)`)).resolves.toMatchObject({
            name: `no-deps`,
            version: `1.0.0`,
          });
        },
      ),
    );

    test(
      `it should resolve via named catalog`,
      makeTemporaryEnv(
        {
          dependencies: {[`no-deps`]: `catalog:foo`},
        },
        {dependencyCatalogs: {foo: {"no-deps": "1.0.0"}}},
        async ({run, source}) => {
          await run(`install`);
          await expect(source(`require(\`no-deps/package.json\`)`)).resolves.toMatchObject({
            name: `no-deps`,
            version: `1.0.0`,
          });
        },
      ),
    );

    test(
      `it should fail if the catalog doesn't exist`,
      makeTemporaryEnv(
        {
          dependencies: {[`no-deps`]: `catalog:missing`},
        },
        {},
        async ({run}) => {
          await expect(run(`install`)).rejects.toThrow(/YN0092/);
        },
      ),
    );

    test(
      `it should fail if the entry doesn't exist`,
      makeTemporaryEnv(
        {
          dependencies: {[`no-deps`]: `catalog:`},
        },
        {dependencyCatalogs: {default: {}}},
        async ({run}) => {
          await expect(run(`install`)).rejects.toThrow(/YN0093/);
        },
      ),
    );
  });
});
