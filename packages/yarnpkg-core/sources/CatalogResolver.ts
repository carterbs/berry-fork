import {MessageName}                                     from './MessageName';
import {ReportError}                                     from './Report';
import {Resolver, ResolveOptions, MinimalResolveOptions} from './Resolver';
import * as structUtils                                  from './structUtils';
import {Descriptor, Locator, Package}                    from './types';

export class CatalogResolver implements Resolver {
  static protocol = `catalog:`;

  supportsDescriptor(descriptor: Descriptor, opts: MinimalResolveOptions) {
    return descriptor.range.startsWith(CatalogResolver.protocol);
  }

  supportsLocator(locator: Locator, opts: MinimalResolveOptions) {
    return locator.reference.startsWith(CatalogResolver.protocol);
  }

  shouldPersistResolution(locator: Locator, opts: MinimalResolveOptions) {
    return true;
  }

  bindDescriptor(descriptor: Descriptor, fromLocator: Locator, opts: MinimalResolveOptions) {
    return descriptor;
  }

  getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions) {
    return {};
  }

  async getCandidates(descriptor: Descriptor, dependencies: Record<string, Package>, opts: ResolveOptions) {
    const remainder = descriptor.range.slice(CatalogResolver.protocol.length);
    const catalogName = remainder.length > 0 ? remainder : `default`;

    const catalogs = opts.project.configuration.get(`dependencyCatalogs`);
    const catalog = catalogs.get(catalogName);
    if (!catalog)
      throw new ReportError(MessageName.CATALOG_NOT_FOUND, `Catalog '${catalogName}' not found`);

    const entry = catalog.get(structUtils.stringifyIdent(descriptor));
    if (typeof entry === `undefined`)
      throw new ReportError(MessageName.CATALOG_ENTRY_NOT_FOUND, `Package '${structUtils.stringifyIdent(descriptor)}' not found in catalog '${catalogName}'`);

    const targetDescriptor = opts.project.configuration.normalizeDependency(structUtils.makeDescriptor(descriptor.ident, entry));

    return await opts.resolver.getCandidates(targetDescriptor, dependencies, opts);
  }

  async getSatisfying(descriptor: Descriptor, dependencies: Record<string, Package>, locators: Array<Locator>, opts: ResolveOptions) {
    const remainder = descriptor.range.slice(CatalogResolver.protocol.length);
    const catalogName = remainder.length > 0 ? remainder : `default`;

    const catalogs = opts.project.configuration.get(`dependencyCatalogs`);
    const catalog = catalogs.get(catalogName);
    if (!catalog)
      throw new ReportError(MessageName.CATALOG_NOT_FOUND, `Catalog '${catalogName}' not found`);

    const entry = catalog.get(structUtils.stringifyIdent(descriptor));
    if (typeof entry === `undefined`)
      throw new ReportError(MessageName.CATALOG_ENTRY_NOT_FOUND, `Package '${structUtils.stringifyIdent(descriptor)}' not found in catalog '${catalogName}'`);

    const targetDescriptor = opts.project.configuration.normalizeDependency(structUtils.makeDescriptor(descriptor.ident, entry));

    return await opts.resolver.getSatisfying(targetDescriptor, dependencies, locators, opts);
  }

  async resolve(locator: Locator, opts: ResolveOptions): Promise<Package> {
    throw new Error(`Expected catalog references to be resolved by underlying resolver`);
  }
}
