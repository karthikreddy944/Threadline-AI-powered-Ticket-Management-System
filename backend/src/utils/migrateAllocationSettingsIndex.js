const AllocationSettings = require("../models/AllocationSettings");

/**
 * Older builds created a unique `key_1` index for the legacy `key` field.
 * Every organization uses the same default key, so that index prevents
 * tenant-specific allocation settings from being created. The real unique
 * identity is `organizationId`, which remains intact.
 */
async function migrateAllocationSettingsIndex() {
  try {
    await AllocationSettings.collection.dropIndex("key_1");
    console.log("Removed obsolete AllocationSettings key_1 index.");
  } catch (error) {
    // MongoDB throws IndexNotFound when this database was created by a newer
    // build. That is the expected no-op path.
    if (error.codeName !== "IndexNotFound" && error.code !== 27) throw error;
  }
}

module.exports = migrateAllocationSettingsIndex;
