import { themes } from "tm-themes";
import { watch } from "vue";
import colors from "../theme-colors.json";
import { userPersistedRef } from "./user-persisted-ref";

export const disabledThemes = [
  "github-dark-default",
  "github-dark-dimmed",
  "vesper",
];
export const enabledThemes = themes.filter(
  ({ name }) => !disabledThemes.includes(name)
);
const theme = userPersistedRef("theme", enabledThemes[0]);
const lightThemes = enabledThemes.filter((t) => t.type === "light");
const darkThemes = enabledThemes.filter((t) => t.type === "dark");

export function useThemes() {
  watch(
    theme,
    (theme) => {
      const root = document.querySelector(":root") as HTMLElement;
      if (!root) return;

      const themeColors = colors[theme.name as keyof typeof colors];
      if (!themeColors) return;
      root.style.setProperty("--theme-bg", themeColors.bg);
      root.style.setProperty("--theme-fg", themeColors.fg);
      root.style.setProperty("--theme-alternate", themeColors.alternate);
      root.style.setProperty("--twoslash-popup-bg", themeColors.alternate);
    },
    { immediate: true }
  );

  return { theme, lightThemes, darkThemes };
}
