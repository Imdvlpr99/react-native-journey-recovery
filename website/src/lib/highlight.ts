/**
 * Tiny, dependency-free highlighter for the handful of languages the docs use.
 * It is intentionally approximate: good enough to make code scannable, cheap to run.
 */
export type Lang = 'tsx' | 'ts' | 'bash' | 'json' | 'text';

export interface Token {
  text: string;
  kind?: 'comment' | 'string' | 'keyword' | 'number' | 'type' | 'fn' | 'tag' | 'attr' | 'punct' | 'prompt';
}

const TS_KEYWORDS = [
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return', 'if', 'else',
  'async', 'await', 'new', 'interface', 'type', 'extends', 'implements', 'class', 'true', 'false',
  'null', 'undefined', 'typeof', 'in', 'of', 'as', 'throw', 'try', 'catch', 'switch', 'case',
  'break', 'void', 'keyof', 'readonly', 'private', 'public', 'is', 'for', 'while', 'it', 'expect',
  'describe',
];

const TS_PATTERN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    String.raw`(?<string>'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|\x60(?:\\.|[^\x60\\])*\x60)`,
    String.raw`(?<tag>(?<![\w$])<\/?[A-Za-z][\w.]*)`,
    String.raw`(?<attr>\b[a-zA-Z][\w-]*(?==[{"']))`,
    String.raw`(?<number>\b\d[\d_]*(?:\.\d+)?\b)`,
    String.raw`(?<keyword>\b(?:${TS_KEYWORDS.join('|')})\b)`,
    String.raw`(?<type>\b[A-Z][A-Za-z0-9_]*\b)`,
    String.raw`(?<fn>\b[a-z_$][\w$]*(?=\s*(?:<[^>()]*>)?\())`,
    String.raw`(?<punct>=>|[{}()[\];,.:?|&]+)`,
  ].join('|'),
  'g'
);

const BASH_PATTERN = new RegExp(
  [
    String.raw`(?<comment>#[^\n]*)`,
    String.raw`(?<string>'[^'\n]*'|"[^"\n]*")`,
    String.raw`(?<fn>^(?:npm|npx|yarn|pnpm|bun|git|cd)\b)`,
    String.raw`(?<attr>\s--?[a-zA-Z][\w-]*)`,
  ].join('|'),
  'gm'
);

const JSON_PATTERN = new RegExp(
  [
    String.raw`(?<attr>"(?:\\.|[^"\\])*"(?=\s*:))`,
    String.raw`(?<string>"(?:\\.|[^"\\])*")`,
    String.raw`(?<number>-?\b\d+(?:\.\d+)?\b)`,
    String.raw`(?<keyword>\b(?:true|false|null)\b)`,
  ].join('|'),
  'g'
);

function tokenize(code: string, pattern: RegExp): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  pattern.lastIndex = 0;

  for (let m = pattern.exec(code); m; m = pattern.exec(code)) {
    if (m[0].length === 0) {
      pattern.lastIndex++;
      continue;
    }
    if (m.index > last) tokens.push({ text: code.slice(last, m.index) });

    const groups = m.groups ?? {};
    const kind = (Object.keys(groups) as Token['kind'][]).find((k) => k && groups[k] !== undefined);

    if (kind === 'tag') {
      // Split "<Foo" / "</Foo" into punctuation + tag name.
      const bracket = m[0].startsWith('</') ? '</' : '<';
      tokens.push({ text: bracket, kind: 'punct' });
      tokens.push({ text: m[0].slice(bracket.length), kind: 'tag' });
    } else {
      tokens.push({ text: m[0], kind });
    }
    last = m.index + m[0].length;
  }

  if (last < code.length) tokens.push({ text: code.slice(last) });
  return tokens;
}

export function highlight(code: string, lang: Lang): Token[] {
  switch (lang) {
    case 'tsx':
    case 'ts':
      return tokenize(code, TS_PATTERN);
    case 'bash':
      return tokenize(code, BASH_PATTERN);
    case 'json':
      return tokenize(code, JSON_PATTERN);
    default:
      return [{ text: code }];
  }
}
