// this is a temporary fix for a bug from on prebuild from the react-native-map-link lib that create duplicates indent entries

const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const appName = "AlerteSecours";

// Helper function to create a unique hash from an object (for deduplication)
function hashObject(obj) {
  return JSON.stringify(obj);
}

// AndroidManifest.xml post-processing
const androidManifestPath = path.join(
  __dirname,
  "../android/app/src/main/AndroidManifest.xml",
);

fs.readFile(androidManifestPath, "utf8", (err, data) => {
  if (err) throw err;

  xml2js.parseString(data, (err, result) => {
    if (err) throw err;

    // Deduplicate <queries> section
    if (result.manifest.queries && result.manifest.queries[0].intent) {
      const intentFilters = result.manifest.queries[0].intent;
      const uniqueIntentFilters = [];

      const seen = new Set();

      for (const filter of intentFilters) {
        const hash = hashObject(filter);
        if (!seen.has(hash)) {
          seen.add(hash);
          uniqueIntentFilters.push(filter);
        }
      }

      result.manifest.queries[0].intent = uniqueIntentFilters;
    }

    // Deduplicate <intent-filter> inside <activity>
    if (result.manifest.application[0].activity) {
      for (const activity of result.manifest.application[0].activity) {
        if (activity["intent-filter"]) {
          const intentFilters = activity["intent-filter"];
          const uniqueIntentFilters = [];

          const seen = new Set();

          for (const filter of intentFilters) {
            const hash = hashObject(filter);
            if (!seen.has(hash)) {
              seen.add(hash);
              uniqueIntentFilters.push(filter);
            }
          }

          activity["intent-filter"] = uniqueIntentFilters;
        }
      }
    }

    // Convert the modified object back to XML
    const builder = new xml2js.Builder();
    let xml = builder.buildObject(result);

    // Remove the XML header
    xml = xml.replace(/<\?xml.*?\?>\s*/g, "");

    // Write the deduplicated XML back to the file
    fs.writeFile(androidManifestPath, xml, (err) => {
      if (err) throw err;
      console.log("AndroidManifest.xml duplicates removed");
    });
  });
});

// Info.plist post-processing
const plist = require("plist");
const infoPlistPath = path.join(__dirname, `../ios/${appName}/Info.plist`);
const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, "utf8"));

const uniqueSchemes = Array.from(
  new Set(infoPlist.LSApplicationQueriesSchemes || []),
);
infoPlist.LSApplicationQueriesSchemes = uniqueSchemes;

fs.writeFileSync(infoPlistPath, plist.build(infoPlist));
console.log("Info.plist duplicates removed");

// project.pbxproj post-processing
const projectPath = path.join(
  __dirname,
  `../ios/${appName}.xcodeproj/project.pbxproj`,
);
let projectContent = fs.readFileSync(projectPath, "utf8");

// Find all build phase blocks for signature removal
const buildPhaseRegex =
  /\s*([A-F0-9]{24}) \/\* Remove signature files \(Xcode.*?\) \*\/ = \{\s*isa = PBXShellScriptBuildPhase;\s*buildActionMask = \d+;\s*files = \(\s*\);\s*inputPaths = \(\s*\);\s*name = "Remove signature files \(Xcode.*?\)";\s*outputPaths = \(\s*\);\s*runOnlyForDeploymentPostprocessing = \d+;\s*shellPath = \/bin\/sh;\s*shellScript = "[^"]*";\s*\};/g;

const matches = projectContent.match(buildPhaseRegex) || [];
const seenPhases = new Set();
const phaseIdsToKeep = new Set();

matches.forEach((phase) => {
  const [, phaseId] = phase.match(/([A-F0-9]{24}) \/\* Remove signature files/);
  const phaseName = phase.match(
    /\/\* (Remove signature files \(Xcode.*?\)) \*\//,
  )[1];

  if (!seenPhases.has(phaseName)) {
    seenPhases.add(phaseName);
    phaseIdsToKeep.add(phaseId);
  }
});

// Remove duplicate build phases from buildPhases arrays
const buildPhasesRegex =
  /(buildPhases = \(\s*(?:[A-F0-9]{24} \/\* (?!Remove signature).*? \*\/,\s*)*)((?:[A-F0-9]{24} \/\* Remove signature.*? \*\/,\s*)*)/g;

projectContent = projectContent.replace(
  buildPhasesRegex,
  (match, prefix, signaturePhases) => {
    const uniqueSignaturePhases = signaturePhases
      .split(",")
      .filter((phase) => phase.trim())
      .filter((phase) => {
        const phaseId = phase.match(/([A-F0-9]{24})/)?.[1];
        return phaseId && phaseIdsToKeep.has(phaseId);
      })
      .join(",");

    return prefix + uniqueSignaturePhases;
  },
);

// Remove the actual duplicate phase definitions
matches.forEach((phase) => {
  const [, phaseId] = phase.match(/([A-F0-9]{24}) \/\* Remove signature files/);
  if (!phaseIdsToKeep.has(phaseId)) {
    projectContent = projectContent.replace(phase, "");
  }
});

// Write the cleaned content back to the file
fs.writeFileSync(projectPath, projectContent);
console.log("project.pbxproj duplicates removed");
