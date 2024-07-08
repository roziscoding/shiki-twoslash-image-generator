import { createHighlighter } from "shiki";
import { InjectionKey } from "vue";

export const shiki = Symbol() as InjectionKey<
  Awaited<ReturnType<typeof createHighlighter>>
>;
