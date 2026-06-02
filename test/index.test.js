const test = require("node:test");
const assert = require("node:assert/strict");

const { get_package_string } = require("../src/index.js");

test("get_package_string: plain semver version is turned into name@version", () => {
  assert.equal(get_package_string("some-package", "1.2.3"), "some-package@1.2.3");
});

test("get_package_string: a semver range with a leading 'v' is cleaned", () => {
  assert.equal(get_package_string("semver", "v7.8.1"), "semver@7.8.1");
});

test("get_package_string: a git url is passed through untouched", () => {
  const url = "git+ssh://git@github.com:some-user/some-package.git#some-branch";
  assert.equal(get_package_string("some-package", url), url);
});

test("get_package_string: a tarball url is passed through untouched", () => {
  const url = "https://example.com/pkg.tgz";
  assert.equal(get_package_string("pkg", url), url);
});
