export type TokenType = 'plain' | 'comment' | 'string' | 'keyword' | 'number' | 'func';

export interface Token {
  text: string;
  type: TokenType;
}

const KEYWORDS = new Set([
  'def', 'return', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'in', 'is', 'not', 'and', 'or',
  'None', 'True', 'False', 'class', 'as', 'with', 'try', 'except', 'lambda', 'pass', 'break', 'continue',
]);

/**
 * A small hand-rolled Python tokenizer for coloring the generated launch files — not a general
 * Python parser. Every string literal we ever generate is single-line (including the one
 * triple-quoted docstring), so this only needs to tokenize one line at a time, no cross-line
 * string-continuation state.
 */
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const n = line.length;
  let i = 0;

  const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
  const isIdentChar = (c: string) => /[A-Za-z0-9_]/.test(c);
  const isDigit = (c: string) => /[0-9]/.test(c);

  while (i < n) {
    const ch = line[i];

    if (ch === '#') {
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    if (ch === "'" || ch === '"') {
      const quote = ch;
      const triple = line.slice(i, i + 3) === quote.repeat(3);
      const qlen = triple ? 3 : 1;
      let j = i + qlen;
      while (j < n) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line.slice(j, j + qlen) === quote.repeat(qlen)) {
          j += qlen;
          break;
        }
        j++;
      }
      if (j > n) j = n;
      tokens.push({ text: line.slice(i, j), type: 'string' });
      i = j;
      continue;
    }

    if (isDigit(ch)) {
      let j = i;
      while (j < n && /[0-9.]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    if (isIdentStart(ch)) {
      let j = i;
      while (j < n && isIdentChar(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) tokens.push({ text: word, type: 'keyword' });
      else if (line[j] === '(') tokens.push({ text: word, type: 'func' });
      else tokens.push({ text: word, type: 'plain' });
      i = j;
      continue;
    }

    let j = i + 1;
    while (j < n && !isIdentStart(line[j]) && !isDigit(line[j]) && line[j] !== '"' && line[j] !== "'" && line[j] !== '#') j++;
    tokens.push({ text: line.slice(i, j), type: 'plain' });
    i = j;
  }

  return tokens;
}

/** VS Code's default "Dark+" theme palette. */
export const TOKEN_COLORS: Record<TokenType, string> = {
  plain: '#d4d4d4',
  comment: '#6a9955',
  string: '#ce9178',
  keyword: '#569cd6',
  number: '#b5cea8',
  func: '#dcdcaa',
};
