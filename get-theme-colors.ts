import fs from "node:fs/promises";

(async () => {
  const themeFiles = await fs.readdir("node_modules/tm-themes/themes");
  const themes = Object.fromEntries(
    await Promise.all(
      themeFiles.map(async (themeFile) => {
        const theme = await fs.readFile(
          `node_modules/tm-themes/themes/${themeFile}`,
          "utf-8"
        );
        const themeObject = JSON.parse(theme);
        const themeName = themeObject.name;
        const themeBackground = themeObject.colors["editor.background"];
        return [themeName, themeBackground];
      })
    )
  );
  await fs.writeFile("src/theme-colors.json", JSON.stringify(themes, null, 2));
})();
