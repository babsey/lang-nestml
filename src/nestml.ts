import { completeFromList } from "@codemirror/autocomplete";
import {
  LRLanguage,
  Language,
  LanguageSupport,
  delimitedIndent,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from "@codemirror/language";
import { SyntaxNode, parseMixed } from "@lezer/common";
import { styleTags, tags } from "@lezer/highlight";
import { parser } from "@lezer/yaml";

import { parser as frontmatterParser } from "./frontmatter.grammar";

/// A language provider based on the [Lezer YAML
/// parser](https://github.com/lezer-parser/yaml), extended with
/// highlighting and indentation information.
export const nestmlLanguage = LRLanguage.define({
  name: "nestml",
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Stream: (cx) => {
          for (
            let before = cx.node.resolve(cx.pos, -1) as SyntaxNode | null;
            before && before.to >= cx.pos;
            before = before.parent
          ) {
            if (before.name == "BlockLiteralContent" && before.from < before.to) return cx.baseIndentFor(before);
            if (before.name == "BlockLiteral") return cx.baseIndentFor(before) + cx.unit;
            if (before.name == "BlockSequence" || before.name == "BlockMapping") return cx.column(before.from, 1);
            if (before.name == "QuotedLiteral") return null;
            if (before.name == "Literal") {
              let col = cx.column(before.from, 1);
              if (col == cx.lineIndent(before.from, 1)) return col; // Start on own line
              if (before.to > cx.pos) return null;
            }
          }
          return null;
        },
        FlowMapping: delimitedIndent({ closing: "}" }),
        FlowSequence: delimitedIndent({ closing: "]" }),
      }),
      foldNodeProp.add({
        "FlowMapping FlowSequence": foldInside,
        "BlockSequence Pair BlockLiteral": (node, state) => ({ from: state.doc.lineAt(node.from).to, to: node.to }),
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: "#" },
    indentOnInput: /^\s*[\]\}]$/,
  },
});

export const nestmlCompletion = nestmlLanguage.data.of({
  autocomplete: completeFromList([
    { label: "model", type: "keyword" },
    { label: "state", type: "keyword" },
    { label: "parameters", type: "keyword" },
    { label: "equations", type: "keyword" },
    { label: "input", type: "keyword" },
    { label: "output", type: "keyword" },
    { label: "update", type: "keyword" },
    { label: "onCondition", type: "function" },
  ]),
});

/// Language support for NESTML.
export function nestml() {
  return new LanguageSupport(nestmlLanguage, [nestmlCompletion]);
}

const frontmatterLanguage = LRLanguage.define({
  name: "nestml-frontmatter",
  parser: frontmatterParser.configure({
    props: [styleTags({ DashLine: tags.meta })],
  }),
});

/// Returns language support for a document parsed as `config.content`
/// with an optional NESTML "frontmatter" delimited by lines that
/// contain three dashes.
export function nestmlFrontmatter(config: { content: Language | LanguageSupport }) {
  let { language, support } =
    config.content instanceof LanguageSupport ? config.content : { language: config.content, support: [] };
  return new LanguageSupport(
    frontmatterLanguage.configure({
      wrap: parseMixed((node) => {
        return node.name == "FrontmatterContent"
          ? { parser: nestmlLanguage.parser }
          : node.name == "Body"
          ? { parser: language.parser }
          : null;
      }),
    }),
    support
  );
}
