import {structUtils, ThrowReport} from '@yarnpkg/core';

import {NpmSemverResolver}        from '../sources/NpmSemverResolver';

import {makeConfiguration}        from './_makeConfiguration';

class TestReport extends ThrowReport {
  warnings: Array<string> = [];
  reportWarning(name: any, text: string) {
    this.warnings.push(text);
  }
}

describe(`NpmSemverResolver catalogs`, () => {
  it(`should prefer the catalog version when compatible`, async () => {
    const configuration = await makeConfiguration();
    const ident = structUtils.makeIdent(null, `no-deps`);
    const descriptor = structUtils.makeDescriptor(ident, `npm:^1.0.0`);

    const project: any = {catalogs: new Map([[ident.identHash, `1.0.0`]]), configuration};
    const resolver = new NpmSemverResolver();
    const report = new TestReport();

    const result = await resolver.getCandidates(descriptor, {}, {project, resolver, report});
    expect(result).toEqual([structUtils.makeLocator(descriptor, `npm:1.0.0`)]);
    expect(report.warnings).toHaveLength(0);
  });

  it.skip(`should warn when the catalog version is incompatible`, async () => {
    // TODO: re-enable once network mocking is easier
  });
});
