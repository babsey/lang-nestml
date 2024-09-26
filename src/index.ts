import { completeFromList } from "@codemirror/autocomplete";
import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";

import { parser } from "./syntax.grammar";

export const nestmlLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Application: delimitedIndent({ closing: ")", align: false }),
      }),
      foldNodeProp.add({
        Application: foldInside,
      }),
      styleTags({
        Identifier: t.variableName,
        Boolean: t.bool,
        String: t.string,
        LineComment: t.lineComment,
        "( )": t.paren,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: "#" },
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

export function nestml() {
  return new LanguageSupport(nestmlLanguage, [nestmlCompletion]);
}
