const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "modules.json"), "utf8"));

test("the hub keeps only current modules outside Dusty Room", () => {
  const current = manifest.modules.filter((module) => module.category === "current").map((module) => module.id);
  const dusty = manifest.modules.filter((module) => module.category === "dusty-room").map((module) => module.id);

  assert.deepEqual(current, ["settoun", "post-fonts", "opu-originals", "media-cards"]);
  assert.deepEqual(dusty, [
    "first-unread", "kapybara-theme", "thread-lane", "classic-look", "post-tweaks", "opuc",
  ]);
  assert.equal(current.length + dusty.length, manifest.modules.length);
  dusty.forEach((id) => assert.equal(manifest.modules.find((module) => module.id === id).defaultEnabled, false));
});
