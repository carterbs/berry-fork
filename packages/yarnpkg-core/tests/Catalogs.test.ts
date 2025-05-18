import {Configuration, structUtils}         from '@yarnpkg/core';
import {Filename, PortablePath, ppath, xfs} from '@yarnpkg/fslib';
import http                                 from 'http';

describe(`Catalog configuration`, () => {
  it(`should load catalog from JSON file`, async () => {
    await xfs.mktempPromise(async dir => {
      await xfs.writeFilePromise(ppath.join(dir, `catalog.json` as PortablePath), JSON.stringify({
        'no-deps': `1.0.0`,
      }));
      await xfs.writeJsonPromise(ppath.join(dir, Filename.manifest), {name: `test`});
      await Configuration.updateConfiguration(dir, {
        catalogs: [`./catalog.json`],
      });

      const configuration = await Configuration.find(dir, null);
      const map = await configuration.getCatalogMap();
      const ident = structUtils.parseIdent(`no-deps`);
      expect(map.get(ident.identHash)).toBe(`1.0.0`);
    });
  });

  it(`should load catalog from YAML file`, async () => {
    await xfs.mktempPromise(async dir => {
      await xfs.writeFilePromise(ppath.join(dir, `catalog.yml` as PortablePath), `no-deps-bins: "2.0.0"`);
      await xfs.writeJsonPromise(ppath.join(dir, Filename.manifest), {name: `test`});
      await Configuration.updateConfiguration(dir, {
        catalogs: [`./catalog.yml`],
      });

      const configuration = await Configuration.find(dir, null);
      const map = await configuration.getCatalogMap();
      const ident = structUtils.parseIdent(`no-deps-bins`);
      expect(map.get(ident.identHash)).toBe(`2.0.0`);
    });
  });

  it(`should merge catalogs with later entries overriding`, async () => {
    await xfs.mktempPromise(async dir => {
      await xfs.writeFilePromise(ppath.join(dir, `a.json` as PortablePath), JSON.stringify({'no-deps': `1.0.0`}));
      await xfs.writeFilePromise(ppath.join(dir, `b.json` as PortablePath), JSON.stringify({'no-deps': `2.0.0`}));
      await xfs.writeJsonPromise(ppath.join(dir, Filename.manifest), {name: `test`});
      await Configuration.updateConfiguration(dir, {
        catalogs: [`./a.json`, `./b.json`],
      });

      const configuration = await Configuration.find(dir, null);
      const map = await configuration.getCatalogMap();
      const ident = structUtils.parseIdent(`no-deps`);
      expect(map.get(ident.identHash)).toBe(`2.0.0`);
    });
  });

  it(`should ignore invalid entries`, async () => {
    await xfs.mktempPromise(async dir => {
      await xfs.writeFilePromise(ppath.join(dir, `bad.json` as PortablePath), JSON.stringify({'no-deps': 42}));
      await xfs.writeJsonPromise(ppath.join(dir, Filename.manifest), {name: `test`});
      await Configuration.updateConfiguration(dir, {
        catalogs: [`./bad.json`],
      });

      const configuration = await Configuration.find(dir, null);
      const map = await configuration.getCatalogMap();
      const ident = structUtils.parseIdent(`no-deps`);
      expect(map.has(ident.identHash)).toBe(false);
    });
  });

  it.skip(`should load catalogs from remote urls`, async () => {
    await xfs.mktempPromise(async dir => {
      let server: http.Server | null = null;
      const data = JSON.stringify({'remote-dep': `3.0.0`});
      await xfs.writeJsonPromise(ppath.join(dir, Filename.manifest), {name: `test`});
      const envBackup = {
        http_proxy: process.env.http_proxy,
        https_proxy: process.env.https_proxy,
        HTTP_PROXY: process.env.HTTP_PROXY,
        HTTPS_PROXY: process.env.HTTPS_PROXY,
      };
      delete process.env.http_proxy;
      delete process.env.https_proxy;
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      const url = await new Promise<string>(resolve => {
        server = http.createServer((_, res) => {
          res.writeHead(200, {'Content-Type': `application/json`});
          res.end(data);
        }).unref();
        server.listen(0, () => {
          const {port} = (server!.address() as any);
          resolve(`http://localhost:${port}/catalog.json`);
        });
      });

      await Configuration.updateConfiguration(dir, {catalogs: [url], httpProxy: null, httpsProxy: null});
      const configuration = await Configuration.find(dir, null);
      const map = await configuration.getCatalogMap();
      Object.assign(process.env, envBackup);
      server!.close();

      const ident = structUtils.parseIdent(`remote-dep`);
      expect(map.get(ident.identHash)).toBe(`3.0.0`);
    });
  });
});
