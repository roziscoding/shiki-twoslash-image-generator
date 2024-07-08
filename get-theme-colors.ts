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
        const bg = themeObject.colors["editor.background"];
        const fg =
          themeObject.colors["editor.foreground"] ??
          (themeObject.type === "dark" ? "#ffffff" : "#000000");
        const alternate = themeObject.colors["activityBar.background"] ?? bg;
        return [themeName, { bg, fg, alternate }];
      })
    )
  );
  await fs.writeFile(
    "./src/theme-colors.json",
    JSON.stringify(themes, null, 2)
  );
})();
