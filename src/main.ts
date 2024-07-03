import { shikiToMonaco } from "@shikijs/monaco";
import { createTransformerFactory, rendererRich } from "@shikijs/twoslash";
import html2canvas from "html2canvas";
import * as monaco from "monaco-editor";
import { createHighlighter } from "shiki";
import { themes } from "tm-themes";
import { createTwoslashFromCDN } from "twoslash-cdn";
import { createStorage } from "unstorage";
import indexDbDriver from "unstorage/drivers/indexedb";
import "./style.css";
import themeColors from "./theme-colors.json";

const initMain = async () => {
  const storage = createStorage({
    driver: indexDbDriver({ base: "twoslash-cdn" }),
  });

  const prefStorage = createStorage<string>({
    driver: indexDbDriver({ base: "twoslash-cdn" }),
  });

  const twoslash = createTwoslashFromCDN({
    storage,
    compilerOptions: { lib: ["esnext", "dom"] },
  });

  const transformerTwoslash = createTransformerFactory(twoslash.runSync)({
    renderer: rendererRich({ queryRendering: "line" }),
    throws: true,
  });

  const disabledThemes = [
    "github-dark-default",
    "github-dark-dimmed",
    "vesper",
  ];
  const enabledThemes = themes.filter(
    ({ name }) => !disabledThemes.includes(name)
  );

  const defaultTheme = enabledThemes[0].name;

  const themeSelector = document.getElementById(
    "theme"
  ) as HTMLSelectElement | null;

  if (themeSelector) {
    const darkThemes = enabledThemes.filter((theme) => theme.type === "dark");
    const lightThemes = enabledThemes.filter((theme) => theme.type === "light");

    const darkOptGroup = document.createElement("optgroup");
    darkOptGroup.label = "Dark";
    themeSelector.appendChild(darkOptGroup);

    darkThemes.forEach((theme) => {
      const option = document.createElement("option");
      option.value = theme.name;
      option.text = theme.displayName;
      darkOptGroup.appendChild(option);
    });

    const lightOptGroup = document.createElement("optgroup");
    lightOptGroup.label = "Light";
    themeSelector.appendChild(lightOptGroup);

    lightThemes.forEach((theme) => {
      const option = document.createElement("option");
      option.value = theme.name;
      option.text = theme.displayName;
      lightOptGroup.appendChild(option);
    });

    themeSelector.addEventListener("change", async (event) => {
      const selectedTheme = (event.target as HTMLSelectElement).value;
      prefStorage.setItem("theme", selectedTheme);
      monaco.editor.setTheme(selectedTheme);
      renderFromEditor();
      const selectedThemeColor =
        themeColors[selectedTheme as keyof typeof themeColors];
      const selectedThemeMeta = enabledThemes.find(
        (theme) => theme.name === selectedTheme
      );

      if (selectedThemeColor) {
        const root = document.querySelector(":root") as HTMLElement;
        root?.style.setProperty("--theme-background", selectedThemeColor);
        const contrastingColor =
          selectedThemeMeta?.type === "dark" ? "#ffffff" : "#000000";
        if (selectedThemeMeta) {
          root?.style.setProperty("--text-color", contrastingColor);
        }

        const code = document.getElementsByClassName(
          "twoslash"
        )?.[0] as HTMLElement;
        if (code) {
          code.style.border = `1px solid ${contrastingColor}`;
        }
      }
    });
  }

  const saveButton = document.getElementById("save");

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const code = document.getElementsByClassName(
        "twoslash"
      )?.[0] as HTMLElement;
      if (code)
        html2canvas(code, {
          backgroundColor: "transparent",
          removeContainer: true,
          scrollY: 0,
          scale: 5,
        }).then((canvas) => {
          const url = canvas.toDataURL("image/png");
          const img = document.getElementById("imageResult")
          if (img) {
            img.setAttribute('src', url)
          }
          const canvasContainer = document.getElementById("canvasContainer");
          if (canvasContainer) {
            canvasContainer.style.display = 'block'
          }
        });
    });
  }

  const closeCanvasButton = document.getElementById("closeCanvas");

  if (closeCanvasButton) {
    closeCanvasButton.addEventListener("click", () => {
      const canvasContainer = document.getElementById("canvasContainer");
      if (canvasContainer) {
        canvasContainer.style.display = 'none'
      }
    });
  }

  const paddingInput = document.getElementById("padding") as HTMLInputElement;

  if (paddingInput) {
    paddingInput.addEventListener("change", (event) => {
      const padding = (event.target as HTMLInputElement).value;
      prefStorage.setItem("padding", padding);
      const root = document.querySelector(":root") as HTMLElement;
      root?.style.setProperty("--code-padding", `${padding}px`);
    });
  }

  const borderColorInput = document.getElementById(
    "borderColor"
  ) as HTMLInputElement;

  if (borderColorInput) {
    borderColorInput.addEventListener("input", (event) => {
      const borderColor = (event.target as HTMLInputElement).value;
      prefStorage.setItem("borderColor", borderColor);
      const code = document.getElementsByClassName(
        "twoslash"
      )?.[0] as HTMLElement;

      if (code) {
        code.style.border = `1px solid ${borderColor}`;
      }
    });
  }

  const borderSizeInput = document.getElementById(
    "borderSize"
  ) as HTMLInputElement;

  if (borderSizeInput) {
    borderSizeInput.addEventListener("change", (event) => {
      const borderSize = (event.target as HTMLInputElement).value;
      prefStorage.setItem("borderSize", borderSize);
      const root = document.querySelector(":root") as HTMLElement;
      root?.style.setProperty("--code-border-size", `${borderSize}px`);
    });
  }

  const setValueAndTriggerChange = (
    element: HTMLInputElement | HTMLSelectElement,
    value: string
  ) => {
    element.value = value;
    element.dispatchEvent(new Event("change"));
  };

  const highlighter = await createHighlighter({
    themes: enabledThemes.map((theme) => theme.name),
    langs: ["javascript", "typescript", "json"],
  });

  // Register the languageIds first. Only registered languages will be highlighted.
  monaco.languages.register({ id: "vue" });
  monaco.languages.register({ id: "typescript" });
  monaco.languages.register({ id: "javascript" });
  // monaco.editor.defineTheme("dracula", dracula);
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSuggestionDiagnostics: false,
    noSyntaxValidation: false,
  });

  // @ts-expect-error
  shikiToMonaco(highlighter, monaco);

  const editorContainer = document.getElementById("editor");

  if (!editorContainer) {
    alert("No container found!");
    throw new Error("No container found");
  }

  // Create the editor
  const editor = monaco.editor.create(editorContainer, {
    value: "",
    language: "typescript",
    theme: defaultTheme,
    bracketPairColorization: { enabled: true },
    autoClosingBrackets: "always",
    minimap: { enabled: false },
    autoClosingQuotes: "always",
    automaticLayout: true,
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    scrollBeyondLastLine: false,
  });

  const rendered = document.getElementById("rendered");

  const codeToHtml = (code: string) => {
    return highlighter.codeToHtml(code, {
      lang: "typescript",
      theme: themeSelector?.value || defaultTheme,
      transformers: [transformerTwoslash],
    });
  };

  const isKnownError = (
    obj: any
  ): obj is { description: string; title: string } => {
    return (
      obj != null &&
      typeof obj.description === "string" &&
      typeof obj.title === "string"
    );
  };

  const renderFromEditor = () => {
    if (!rendered) return;
    const source =
      editor.getValue() ||
      "// Enter code on the left to see it rendered here with shiki + twoslash";
    twoslash.prepareTypes(source);
    try {
      const result = codeToHtml(source.trim());
      rendered.innerHTML = result;
    } catch (error) {
      if (isKnownError(error)) {
        rendered.innerHTML = codeToHtml(
          [
            `// ${error.title}`,
            ...error.description
              .split("\n")
              .map((line: string) => `// ${line}`),
          ].join("\n")
        );
      }
    }
  };

  editor.getModel()?.onDidChangeContent(() => {
    renderFromEditor();
  });

  const prefTheme = await prefStorage.getItem("theme");
  const prefPadding = await prefStorage.getItem("padding");
  const prefBorderColor = await prefStorage.getItem("borderColor");
  const prefBorderSize = await prefStorage.getItem("borderSize");
  const resolveCssVariable = (variable: string) => getComputedStyle(document.body).getPropertyValue(variable).trim();

  if (themeSelector && prefTheme) {
    setValueAndTriggerChange(themeSelector, prefTheme);
  }

  if (paddingInput) {
    setValueAndTriggerChange(paddingInput, prefPadding ?? "10");
  }

  if (borderColorInput) {
    setValueAndTriggerChange(
      borderColorInput,
      prefBorderColor || resolveCssVariable("--text-color") || "#ffffff"
    );
  }

  if (borderSizeInput) {
    setValueAndTriggerChange(borderSizeInput, prefBorderSize || "1");
  }
  renderFromEditor();
};

initMain();
