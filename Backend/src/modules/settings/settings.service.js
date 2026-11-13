import Setting from '../../models/Setting.js';

export const getSettings = async (category) => {
  const filter = {};
  if (category) {
    filter.category = category;
  }
  const settings = await Setting.find(filter);
  // Convert list to key-value object
  const settingsMap = {};
  settings.forEach(s => {
    settingsMap[s.key] = s.value;
  });

  return settingsMap;
};

/**
 * Just the keys asked for, whichever category they were saved under. The admin
 * settings screen saves most of its fields without a category, so a read that
 * filtered by one would miss them.
 */
export const getSettingValues = async (keys = []) => {
  if (!keys.length) return {};
  const rows = await Setting.find({ key: { $in: keys } }).lean();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};

export const updateSettings = async (settingsData, adminId, category) => {
  const updatedSettings = {};

  for (const [key, value] of Object.entries(settingsData)) {
    const updatePayload = { key, value, updatedBy: adminId };
    if (category) {
      updatePayload.category = category;
    }
    const setting = await Setting.findOneAndUpdate(
      { key },
      { $set: updatePayload },
      { new: true, upsert: true }
    );
    updatedSettings[setting.key] = setting.value;
  }

  return updatedSettings;
};
