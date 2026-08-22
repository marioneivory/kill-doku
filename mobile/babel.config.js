module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./src" },
        },
      ],
      // react-native-reanimated/plugin DEVE essere l'ultimo plugin dell'elenco
      "react-native-reanimated/plugin",
    ],
  };
};
