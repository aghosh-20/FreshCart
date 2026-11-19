module.exports = function (api) {
  api.cache(true);
  return {
    // Zustand v5 ships ESM that references import.meta; Metro needs it transformed.
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
