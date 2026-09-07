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

export const updateSettings = async (settingsData, adminId) => {
  const updatedSettings = {};

  for (const [key, value] of Object.entries(settingsData)) {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { key, value, updatedBy: adminId },
      { new: true, upsert: true }
    );
    updatedSettings[setting.key] = setting.value;
  }

  return updatedSettings;
};
