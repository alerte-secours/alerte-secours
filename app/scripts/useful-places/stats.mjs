/**
 * Statistics collector for the useful-places pipeline.
 */

export class PipelineStats {
  constructor() {
    this.sources = {};
    this.startTime = Date.now();
  }

  addSource(name, stats) {
    this.sources[name] = stats;
  }

  summarize() {
    const summary = {
      totalRead: 0,
      totalRejected: 0,
      totalKept: 0,
      byType: {},
      bySource: {},
      angelaBySource: {},
      details: {},
      durationMs: Date.now() - this.startTime,
    };

    for (const [name, stats] of Object.entries(this.sources)) {
      const read = stats.read || 0;
      const rejected = stats.rejected || 0;
      const kept = stats.rowCount ?? (read - rejected);

      summary.totalRead += read;
      summary.totalRejected += rejected;
      summary.totalKept += kept;

      summary.bySource[name] = { read, rejected, kept };

      // Accumulate by place type
      const type = stats.type || name;
      if (!summary.byType[type]) {
        summary.byType[type] = { read: 0, rejected: 0, kept: 0 };
      }
      summary.byType[type].read += read;
      summary.byType[type].rejected += rejected;
      summary.byType[type].kept += kept;

      // Source-specific details
      summary.details[name] = {};

      if (stats.reasons) {
        summary.details[name].rejectionReasons = stats.reasons;
      }
      if (stats.finessFiltered != null) {
        summary.details[name].finessFiltered = stats.finessFiltered;
      }
      if (stats.noNameFiltered != null) {
        summary.details[name].noNameFiltered = stats.noNameFiltered;
      }
      if (stats.urgences != null) {
        summary.details[name].urgences = stats.urgences;
      }
      if (stats.hopital != null) {
        summary.details[name].hopital = stats.hopital;
      }
      if (stats.withHoraires != null) {
        summary.details[name].withHoraires = stats.withHoraires;
      }
      if (stats.withoutHoraires != null) {
        summary.details[name].withoutHoraires = stats.withoutHoraires;
      }
      if (stats.outreMer != null) {
        summary.details[name].outreMer = stats.outreMer;
      }
      if (stats.metropole != null) {
        summary.details[name].metropole = stats.metropole;
      }
      if (stats.idZeroCount != null) {
        summary.details[name].idZeroCount = stats.idZeroCount;
      }
    }

    return summary;
  }

  print() {
    const s = this.summarize();

    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║         USEFUL PLACES PIPELINE STATS         ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    console.log(`Duration: ${(s.durationMs / 1000).toFixed(1)}s`);
    console.log(`Total read: ${s.totalRead}`);
    console.log(`Total rejected: ${s.totalRejected}`);
    console.log(`Total kept: ${s.totalKept}\n`);

    console.log("── By Type ───────────────────────────────────");
    for (const [type, data] of Object.entries(s.byType)) {
      console.log(`  ${type}: ${data.kept} kept / ${data.read} read (${data.rejected} rejected)`);
    }

    console.log("\n── By Source ──────────────────────────────────");
    for (const [name, data] of Object.entries(s.bySource)) {
      console.log(`  ${name}: ${data.kept} kept / ${data.read} read (${data.rejected} rejected)`);
    }

    console.log("\n── Details ────────────────────────────────────");
    for (const [name, details] of Object.entries(s.details)) {
      const entries = Object.entries(details);
      if (entries.length > 0) {
        console.log(`  ${name}:`);
        for (const [key, value] of entries) {
          if (typeof value === "object") {
            console.log(`    ${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`    ${key}: ${value}`);
          }
        }
      }
    }

    console.log();
  }
}
