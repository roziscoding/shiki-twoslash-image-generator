import { createTransformerFactory, rendererRich } from "@shikijs/twoslash";
import { createTwoslashFromCDN } from "twoslash-cdn";
import { createStorage } from "unstorage";
import indexDbDriver from "unstorage/drivers/indexedb";

export function useTwoslash() {
  const storage = createStorage({
    driver: indexDbDriver({ base: "twoslash-cdn" }),
  });

  const twoslash = createTwoslashFromCDN({
    storage,
    compilerOptions: { lib: ["esnext", "dom"] },
  });

  const transformerTwoslash = createTransformerFactory(twoslash.runSync)({
    renderer: rendererRich({
      queryRendering: "line",
      errorRendering: "line",
    }),
    throws: true,
  });

  return { twoslash, transformerTwoslash };
}
