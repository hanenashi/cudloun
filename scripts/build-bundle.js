const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifest = readJson("modules.json");
const containers = fs.existsSync(path.join(root, "containers.json")) ? readJson("containers.json") : { containers: [] };
const core = readText("modules/core.js");
const scriptFiles = [
  ...manifest.system.map((item) => item.file),
  ...manifest.modules.map((item) => item.file),
  ...(containers.containers || []).map((item) => item.file),
];

let out = "";

line("// Cudloun bundled runtime. Generated from source modules; edit source files, not this file.");
line("(function () {");
line('  "use strict";');
line("");
line(`  const VERSION = ${quote(manifest.version)};`);
line('  const RAW_MAIN_URL = "https://raw.githubusercontent.com/hanenashi/cudloun/main/";');
line("  const CACHE_BUST = String(Date.now());");
line("  const embeddedText = new Map();");
line("  const embeddedScripts = new Map();");
line("");
line(`  embeddedText.set("modules.json", ${quote(JSON.stringify(manifest, null, 2))});`);
line(`  embeddedText.set("containers.json", ${quote(JSON.stringify(containers, null, 2))});`);
line("");

scriptFiles.forEach((file) => {
  const source = readText(file);
  line(`  embeddedText.set(${quote(file)}, ${quote(source)});`);
  line(`  embeddedScripts.set(${quote(file)}, function () {`);
  out += source.split(/\r?\n/).map((item) => {
    const trimmed = item.replace(/[ \t]+$/g, "");
    return trimmed ? `    ${trimmed}` : "";
  }).join("\n");
  line("");
  line("  });");
  line("");
});

line("  function normalizeEmbeddedPath(url) {");
line('    const raw = String(url || "").split("#")[0].split("?")[0];');
line("    if (raw.startsWith(RAW_MAIN_URL)) return raw.slice(RAW_MAIN_URL.length);");
line("    try {");
line("      const parsed = new URL(raw, window.location.href);");
line('      const marker = "/hanenashi/cudloun/";');
line("      const index = parsed.pathname.indexOf(marker);");
line('      if (parsed.hostname === "raw.githubusercontent.com" && index >= 0) {');
line('        const parts = parsed.pathname.slice(index + marker.length).split("/");');
line('        return parts.slice(1).join("/");');
line("      }");
line("    } catch (_error) {");
line("      // Fall through to local relative handling.");
line("    }");
line('    return raw.replace(/^\\.\\//, "").replace(/^\\//, "");');
line("  }");
line("");
line("  function requestText(url) {");
line("    const path = normalizeEmbeddedPath(url);");
line("    if (embeddedText.has(path)) return Promise.resolve(embeddedText.get(path));");
line("");
line("    return new Promise((resolve, reject) => {");
line('      if (typeof GM_xmlhttpRequest === "function") {');
line("        GM_xmlhttpRequest({");
line('          method: "GET",');
line("          url,");
line("          onload(response) {");
line("            if (response.status >= 200 && response.status < 300) {");
line("              resolve(response.responseText);");
line("              return;");
line("            }");
line('            reject(new Error("HTTP " + response.status + " for " + url));');
line("          },");
line('          onerror() { reject(new Error("Request failed for " + url)); },');
line('          ontimeout() { reject(new Error("Request timed out for " + url)); },');
line("        });");
line("        return;");
line("      }");
line("");
line('      if (typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function") {');
line("        let settled = false;");
line("        const settleResolve = (response) => {");
line("          if (settled) return;");
line("          settled = true;");
line("          if (response.status >= 200 && response.status < 300) {");
line("            resolve(response.responseText);");
line("            return;");
line("          }");
line('          reject(new Error("HTTP " + response.status + " for " + url));');
line("        };");
line("        const settleReject = (error) => {");
line("          if (settled) return;");
line("          settled = true;");
line('          reject(error instanceof Error ? error : new Error("Request failed for " + url));');
line("        };");
line("");
line("        try {");
line("          const result = GM.xmlHttpRequest({");
line('            method: "GET",');
line("            url,");
line("            onload: settleResolve,");
line("            onerror: settleReject,");
line('            ontimeout: () => settleReject(new Error("Request timed out for " + url)),');
line("          });");
line('          if (result && typeof result.then === "function") result.then(settleResolve).catch(settleReject);');
line("        } catch (error) {");
line("          settleReject(error);");
line("        }");
line("        return;");
line("      }");
line("");
line('      fetch(url, { cache: "no-store" })');
line("        .then((response) => {");
line('          if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);');
line("          return response.text();");
line("        })");
line("        .then(resolve)");
line("        .catch(reject);");
line("    });");
line("  }");
line("");
line("  function execute(code, label) {");
line("    const path = normalizeEmbeddedPath(label);");
line("    if (embeddedScripts.has(path)) {");
line("      embeddedScripts.get(path)();");
line("      return;");
line("    }");
line('    throw new Error("Cudloun dynamic script execution is disabled by the bundled loader: " + (label || "unknown script"));');
line("  }");
line("");
line("  const seed = {");
line("    version: VERSION,");
line("    repoUrl: RAW_MAIN_URL,");
line("    cacheBust: CACHE_BUST,");
line("    requestText,");
line("    execute,");
line("  };");
line("");
line("  const CUDLOUN_SEED = seed;");
line("");
out += core.split(/\r?\n/).map((item) => {
  const trimmed = item.replace(/[ \t]+$/g, "");
  return trimmed ? `  ${trimmed}` : "";
}).join("\n");
line("");
line("})();");

fs.writeFileSync(path.join(root, "cudloun.bundle.js"), out, "utf8");

function readText(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function quote(value) {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

function line(value) {
  out += `${value}\n`;
}
