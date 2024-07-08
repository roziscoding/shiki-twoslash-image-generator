import { loader } from "@guolao/vue-monaco-editor";
import { shikiToMonaco } from "@shikijs/monaco";
import "@shikijs/twoslash/style-rich.css";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { createHighlighter } from "shiki";
import { createApp } from "vue";
import App from "./App.vue";
import { enabledThemes } from "./composables/use-themes";
import { shiki } from "./injection-keys";
import "./style.css";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

(async () => {
  const highlighter = await createHighlighter({
    themes: enabledThemes.map((theme) => theme.name),
    langs: ["javascript", "typescript", "json", "markdown"],
  });

  monaco.languages.register({ id: "typescript" });
  monaco.languages.register({ id: "ts" });
  monaco.languages.register({ id: "js" });
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSuggestionDiagnostics: false,
    noSyntaxValidation: false,
  });

  // @ts-expect-error
  shikiToMonaco(highlighter, monaco);

  return highlighter;
})().then((highlighter) => {
  loader.config({ monaco });

  const app = createApp(App);

  app.provide(shiki, highlighter);
  app.mount("#app");
});
