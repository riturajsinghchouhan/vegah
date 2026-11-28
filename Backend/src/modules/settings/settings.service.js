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
  const payload = { ...settingsData };

  // Turning COD off stamps when it happened, because a booking taken while it
  // was still on may still be paid in cash (see settings/cod.js). Every
  // settings write funnels through here, so the stamp cannot be missed.
  if (Object.prototype.hasOwnProperty.call(payload, 'codEnabled')) {
    const enabled = !(payload.codEnabled === false || payload.codEnabled === 'false');
    const previous = await Setting.findOne({ key: 'codEnabled' }).lean();
    const wasEnabled = !(previous?.value === false || previous?.value === 'false');
    if (wasEnabled && !enabled) {
      payload.codDisabledAt = new Date().toISOString();
    }
  }

  for (const [key, value] of Object.entries(payload)) {
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
