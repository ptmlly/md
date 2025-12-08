import frontmatter from "@ptmlly/fm";
import { marked, type MarkedExtension, type MarkedOptions } from "marked";

namespace md {
  export interface PtmyllMarkedOptions {
    markedOptions?: MarkedOptions;
    markedExtensions?: MarkedExtension[];
  }
  export async function parse<
    T extends Record<string, any> = frontmatter.FrontMatterData
  >(str: string, options?: PtmyllMarkedOptions) {
    const opts: MarkedOptions = options?.markedOptions ?? {
      gfm: true,
      async: true,
    };
    const exts = options?.markedExtensions ?? [];
    const { data, content } = frontmatter.parse<T>(str);
    if (exts.length) {
      for (const ext of exts) {
        marked.use(ext);
      }
    }
    const html = await marked.parse(content, opts);
    return {
      metaData: data,
      htmlString: html,
    };
  }
}

export default md;
