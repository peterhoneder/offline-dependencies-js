const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CLI = path.resolve(__dirname, "../src/index.js");

// End-to-end smoke test: drive the tool exactly as the README prescribes and
// verify it actually does what it claims -- pack a remote dependency into a
// local folder (npm pack) and install it back into the source tree (npm i)
//
// The README example uses a git+ssh url, but originalDependencies "follows the
// same syntax as the regular dependencies property", and npm pack accepts a
// local folder just like a git url -- so a folder on disk gives us the same
// code path with zero network access
test("smoke: packs a dependency into localPath and installs it (README flow)", { timeout: 120000 }, () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "offline-deps-smoke-"));
  try {
    // A tiny package that stands in for the "remote" dependency to be fetched
    const source = path.join(workspace, "source-pkg");
    fs.mkdirSync(source);
    fs.writeFileSync(
      path.join(source, "package.json"),
      JSON.stringify({ name: "dummy-dep", version: "1.0.0", main: "index.js" }),
    );
    fs.writeFileSync(path.join(source, "index.js"), "module.exports = 42;\n");

    // A consumer project wired up the way the README documents
    const consumer = path.join(workspace, "consumer");
    fs.mkdirSync(consumer);
    fs.writeFileSync(
      path.join(consumer, "package.json"),
      JSON.stringify({
        name: "consumer-fixture",
        version: "1.0.0",
        localDependencies: {
          localPath: "./npm-deps",
          originalDependencies: {
            "dummy-dep": source,
          },
        },
      }),
    );

    // Run the tool the same way `npm run update-local-deps` would
    execFileSync("node", [CLI, "install"], {
      cwd: consumer,
      env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" },
      stdio: "pipe",
    });

    // The packed tarball should have been vendored into localPath
    const vendored = path.join(consumer, "npm-deps", "dummy-dep-1.0.0.tgz");
    assert.ok(fs.existsSync(vendored), "expected npm-deps/dummy-dep-1.0.0.tgz to be created");

    // and installed back into the consumer's node_modules
    const installed = path.join(consumer, "node_modules", "dummy-dep", "package.json");
    assert.ok(fs.existsSync(installed), "expected dummy-dep to be installed into node_modules");
    assert.equal(JSON.parse(fs.readFileSync(installed, "utf8")).version, "1.0.0");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
