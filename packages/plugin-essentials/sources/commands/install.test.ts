import {isVersionUpdate} from './install';

describe(`isVersionUpdate`, () => {
  it(`returns false for null candidate`, () => {
    expect(isVersionUpdate(null, `1.0.0`)).toBe(false);
  });

  it(`returns false for invalid semver`, () => {
    expect(isVersionUpdate(`not-a-version`, `1.0.0`)).toBe(false);
  });

  it(`returns false when candidate is not greater`, () => {
    expect(isVersionUpdate(`1.0.0`, `1.0.0`)).toBe(false);
  });

  it(`returns true when candidate is greater`, () => {
    expect(isVersionUpdate(`1.0.1`, `1.0.0`)).toBe(true);
  });
});
