<script setup lang="ts">
import { EditorProps, VueMonacoEditor } from "@guolao/vue-monaco-editor";
import html2canvas from "html2canvas";
import { inject, ref, watch } from "vue";
import { useThemes } from "./composables/use-themes";
import { useTwoslash } from "./composables/use-twoslash";
import { userPersistedRef } from "./composables/user-persisted-ref";
import { shiki } from "./injection-keys";

// #region Loading and setting themes
const { theme, lightThemes, darkThemes } = useThemes();
// #endregion

// #region Configuring Monaco Editor
const showEditor = ref(true);
const DEFAULT_CODE =
  "// Enter code to see it rendered here with shiki + twoslash";
const code = userPersistedRef("code", DEFAULT_CODE);
const MONACO_OPTIONS = {
  language: "typescript",
  theme: theme.value.name,
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: "always",
  minimap: { enabled: false },
  autoClosingQuotes: "always",
  automaticLayout: true,
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  scrollBeyondLastLine: false,
} satisfies EditorProps["options"];
// #endregion

// #region Rendering with Twoslash

const shikiRenderer = inject(shiki);
const { twoslash, transformerTwoslash } = useTwoslash();
const updateCode = (newCode: string) => {
  code.value = newCode || DEFAULT_CODE;
};

const isKnownError = (
  obj: any
): obj is { description: string; title: string; message: string } => {
  return (
    obj != null &&
    typeof obj.description === "string" &&
    typeof obj.title === "string"
  );
};

const twoslashHtml = ref("");

const render = async () => {
  try {
    await twoslash.prepareTypes(code.value);
    return shikiRenderer?.codeToHtml(code.value.trim() || DEFAULT_CODE, {
      lang: "typescript",
      theme: theme.value.name,
      transformers: [transformerTwoslash],
    });
  } catch (error) {
    if (!isKnownError(error)) return `An unknown error occurred: ${error}`;
    // return error.message;
    return shikiRenderer?.codeToHtml(error.message.trim(), {
      lang: "markdown",
      theme: theme.value.name,
    });
  }
};

watch(
  [code, theme],
  async () => {
    twoslashHtml.value = (await render()) ?? "";
  },
  { immediate: true }
);
// #endregion

// #region Exporting image
const padding = userPersistedRef("padding", 10);
const borderSize = userPersistedRef("borderSize", 1);
const showCanvas = ref(false);
const imgElement = ref<HTMLImageElement>();
const imageBlob = ref<Blob>();

const closeCanvas = () => {
  showCanvas.value = false;
  imageBlob.value = undefined;
  imgElement.value?.removeAttribute("src");
};

const generateImage = () => {
  if (!imgElement.value) return;

  const twoslashHtml = document.getElementById("twoslash-html");
  if (!twoslashHtml) return;

  html2canvas(twoslashHtml, {
    allowTaint: true,
    scale: 3,
    logging: false,
    windowHeight: twoslashHtml.scrollHeight,
    windowWidth: twoslashHtml.scrollWidth,
    backgroundColor: getComputedStyle(document.body).getPropertyValue(
      "--theme-bg"
    ),
  }).then((canvas) => {
    const image = canvas.toDataURL("image/png");
    canvas.toBlob((blob) => {
      if (!blob) return;
      imageBlob.value = blob;
    }, "image/png");

    imgElement.value!.src = image;
    showCanvas.value = true;
  });
};

const copySuccess = ref(false);

const copyImage = async () => {
  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": imageBlob.value!,
    }),
  ]);

  copySuccess.value = true;

  setTimeout(() => {
    copySuccess.value = false;
  }, 1000);
};

const downloadImage = () => {
  const url = imgElement.value?.src;

  if (!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.download = "twoslash.png";
  a.click();
};
// #endregion
</script>
<template>
  <div class="h-full bg-theme-bg overflow-hidden">
    <nav class="bg-theme-bg text-theme-fg">
      <div class="flex justify-between items-center p-4">
        <div class="flex items-center space-x-4">
          <span>Theme:</span>
          <select v-model="theme" class="p-2 bg-theme-bg" name="theme">
            <optgroup label="Dark">
              <option v-for="t in darkThemes" :key="t.name" :value="t">
                {{ t.displayName }}
              </option>
            </optgroup>
            <optgroup label="Light">
              <option v-for="t in lightThemes" :key="t.name" :value="t">
                {{ t.displayName }}
              </option>
            </optgroup>
          </select>
          <button
            class="p-2 bg-theme-fg text-theme-bg"
            @click="showEditor = !showEditor"
          >
            {{ showEditor ? "Hide" : "Show" }} Editor
          </button>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-4">
            <span>Padding:</span>
            <input
              v-model="padding"
              class="p-2 bg-theme-bg w-16"
              type="number"
              name="padding"
            />
          </div>
          <div class="flex items-center">
            <span>Border:</span>
            <input
              v-model="borderSize"
              class="p-2 bg-theme-bg w-12"
              type="number"
              name="borderSize"
            />
          </div>
          <button class="p-2 bg-theme-fg text-theme-bg" @click="generateImage">
            Generate Image
          </button>
        </div>
      </div>
    </nav>
    <main class="h-full flex flex-row items-center justify-start">
      <section
        class="border-r border-r-theme-fg h-full"
        :class="{ 'w-1/2': showEditor, 'w-0': !showEditor }"
      >
        <VueMonacoEditor
          :theme="theme.name"
          language="typescript"
          :options="MONACO_OPTIONS"
          class="h-full"
          @change="updateCode"
          :value="code"
        />
      </section>
      <section
        class="h-full bg-theme-bg flex items-center justify-center"
        :class="{ 'w-1/2': showEditor, 'w-full': !showEditor }"
      >
        <div
          class="bg-theme-bg"
          id="twoslash-html"
          :style="{
            padding: `${padding}px`,
            border: `${borderSize}px solid var(--theme-fg)`,
          }"
          v-html="twoslashHtml"
        ></div>
      </section>
    </main>
    <aside
      v-show="showCanvas"
      class="fixed w-screen h-screen bg-theme-alternate top-0 left-0 flex items-center justify-center z-50 flex-col"
    >
      <img style="max-height: 75%" ref="imgElement" />
      <div class="flex gap-2 mt-2 w-full justify-center">
        <button class="p-2 bg-theme-fg text-theme-bg" @click="downloadImage">
          Download
        </button>
        <button
          class="p-2 bg-theme-fg text-theme-bg data-[success='true']:bg-green-400 transition-all duration-300 ease-in-out"
          @click="copyImage"
          :data-success="copySuccess"
        >
          Copy
        </button>
        <button class="p-2 bg-theme-fg text-theme-bg" @click="closeCanvas">
          Close
        </button>
      </div>
    </aside>
  </div>
</template>
