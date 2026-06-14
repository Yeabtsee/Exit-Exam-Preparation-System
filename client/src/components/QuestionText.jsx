import { useMemo } from 'react';
import { parseQuestionText, parseChoiceText, detectLanguage } from '../utils/codeFormatter';
import { Code } from 'lucide-react';

/**
 * Renders question text with code blocks properly formatted.
 */
export function QuestionText({ text }) {
  const segments = useMemo(() => parseQuestionText(text), [text]);

  return (
    <div>
      {segments.map((seg, i) => {
        if (seg.type === 'code') {
          return <CodeBlock key={i} code={seg.content} />;
        }
        if (seg.type === 'rich') {
          return <RichText key={i} content={seg.content} />;
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </div>
  );
}

/**
 * Renders choice text, detecting if it contains code.
 */
export function ChoiceText({ text }) {
  const segments = useMemo(() => parseChoiceText(text), [text]);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'code') {
          return (
            <pre
              key={i}
              className="font-mono text-xs leading-relaxed whitespace-pre-wrap"
            >
              {seg.content}
            </pre>
          );
        }
        if (seg.type === 'rich') {
          return <RichText key={i} content={seg.content} />;
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </>
  );
}

/**
 * Styled code block component with language badge and editor-like appearance.
 */
function CodeBlock({ code }) {
  const language = useMemo(() => detectLanguage(code), [code]);

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#0d1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[#8b949e] text-xs">
          <Code className="w-3 h-3" />
          <span>{language}</span>
        </div>
      </div>
      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-[13px] leading-[1.6] font-mono text-[#e6edf3] whitespace-pre">
          {code.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-[#484f58] text-right pr-4 min-w-[2.5rem]">
                {i + 1}
              </span>
              <span>{highlightSyntax(line)}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/**
 * Simple syntax highlighting — colorizes keywords, strings, etc.
 */
function highlightSyntax(line) {
  // Split the line into tokens and apply coloring via spans
  const parts = [];
  let remaining = line;
  let key = 0;

  const rules = [
    // Strings (double and single quoted)
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/, className: 'text-[#a5d6ff]' },
    // Keywords
    { regex: /\b(public|private|protected|static|void|class|interface|extends|implements|new|return|if|else|for|while|switch|case|break|default|import|package|try|catch|throw|throws|final|abstract|int|float|double|char|boolean|String|long|byte|short|enum|const|let|var|function|def|print|println|printf|true|false|null|this|super)\b/, className: 'text-[#ff7b72]' },
    // Types and class names (capitalized words)
    { regex: /\b([A-Z]\w+)/, className: 'text-[#ffa657]' },
    // Numbers
    { regex: /\b(\d+\.?\d*)\b/, className: 'text-[#79c0ff]' },
    // Method calls
    { regex: /(\.\w+)\(/, className: 'text-[#d2a8ff]' },
    // Operators
    { regex: /(==|!=|<=|>=|&&|\|\||<<|>>|\+\+|--)/, className: 'text-[#ff7b72]' },
    // Comments
    { regex: /(\/\/.*)$/, className: 'text-[#8b949e] italic' },
  ];

  while (remaining.length > 0) {
    let earliestMatch = null;
    let earliestRule = null;
    let earliestIndex = remaining.length;

    for (const rule of rules) {
      const match = remaining.match(rule.regex);
      if (match && match.index < earliestIndex) {
        earliestMatch = match;
        earliestRule = rule;
        earliestIndex = match.index;
      }
    }

    if (earliestMatch && earliestRule) {
      // Add text before the match
      if (earliestIndex > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, earliestIndex)}</span>);
      }
      // Add the highlighted match
      parts.push(
        <span key={key++} className={earliestRule.className}>
          {earliestMatch[1] || earliestMatch[0]}
        </span>
      );
      // Move past the match (use group 1 length if available, else full match)
      const matchLen = earliestMatch.index + (earliestMatch[1] || earliestMatch[0]).length;
      remaining = remaining.substring(matchLen);
    } else {
      // No more matches, add remaining text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return parts;
}

/**
 * Renders text with inline code markers ({{code:...}}) as styled code spans.
 */
function RichText({ content }) {
  const parts = content.split(/(\{\{code:.*?\}\})/g);

  return (
    <span>
      {parts.map((part, i) => {
        const codeMatch = part.match(/^\{\{code:(.*)\}\}$/);
        if (codeMatch) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded-md bg-[#1e293b] text-[#e6edf3] text-[0.85em] font-mono border border-[#334155]"
            >
              {codeMatch[1]}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
