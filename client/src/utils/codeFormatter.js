/**
 * Detects and formats code segments within question/choice text.
 * Returns an array of { type: 'text' | 'code', content } segments.
 */

// Patterns that indicate a code block is starting within question text
const CODE_BLOCK_STARTERS = [
  // "Given the following code, what is the result? class A { ... }"
  // We want to split at the boundary between the prose and the code
  /(?:what (?:is|will be) (?:the )?(?:result|output).*?\?\s*)/i,
  /(?:following (?:code|program|snippet).*?\?\s*)/i,
  /(?:given (?:the )?(?:following )?code.*?\?\s*)/i,
  /(?:output of (?:the )?(?:below |following )?.*?code.*?\?\s*)/i,
  /(?:output (?:produced|generated) by (?:the )?following.*?\?\s*)/i,
];

// Heuristic: does this string chunk look like code?
const CODE_INDICATORS = [
  /\b(class|interface|enum)\s+\w+\s*(\{|extends|implements)/,
  /\b(public|private|protected)\s+(static\s+)?(void|int|String|boolean|float|double|char)\s+\w+/,
  /\b(System\.out\.print|System\.out\.println|printf|cout\s*<<|cin\s*>>)/,
  /\b(int|float|double|char|String|boolean|void)\s+\w+\s*[=;(]/,
  /\bfor\s*\(\s*(int\s+)?\w+\s*=/,
  /\bwhile\s*\(.+\)\s*\{/,
  /\bswitch\s*\(.+\)\s*\{/,
  /\bif\s*\(.+\)\s*\{/,
  /\breturn\s+.+;/,
  /\bnew\s+\w+\s*\(/,
  /\w+\.\w+\s*\(/,     // method calls like obj.method()
  /#include\s*<\w+>/,
  /\bdef\s+\w+\s*\(/,   // Python
  /\bSELECT\s+\w+.*FROM/i,
  /\bCREATE\s+TABLE/i,
  /\bINSERT\s+INTO/i,
];

function looksLikeCode(text) {
  let score = 0;
  for (const pat of CODE_INDICATORS) {
    if (pat.test(text)) score++;
  }
  // Also check for typical code syntax density
  const braceCount = (text.match(/[{}();]/g) || []).length;
  if (braceCount >= 4) score++;
  if (braceCount >= 8) score++;
  return score >= 2;
}

/**
 * Try to split question text into prose + code segments.
 */
export function parseQuestionText(text) {
  if (!text) return [{ type: 'text', content: text }];

  // Check if there's a code block embedded in the question
  for (const pattern of CODE_BLOCK_STARTERS) {
    const match = text.match(pattern);
    if (match) {
      const splitIndex = match.index + match[0].length;
      const prose = text.substring(0, splitIndex).trim();
      const codeCandidate = text.substring(splitIndex).trim();

      if (codeCandidate && looksLikeCode(codeCandidate)) {
        return [
          { type: 'text', content: prose },
          { type: 'code', content: formatCode(codeCandidate) },
        ];
      }
    }
  }

  // Fallback: check if the ENTIRE text or a large tail portion is code-like
  // Look for pattern: "Some question text? code_here"
  const questionMarkIdx = text.lastIndexOf('?');
  if (questionMarkIdx > 10 && questionMarkIdx < text.length - 20) {
    const afterQuestion = text.substring(questionMarkIdx + 1).trim();
    if (afterQuestion && looksLikeCode(afterQuestion)) {
      return [
        { type: 'text', content: text.substring(0, questionMarkIdx + 1).trim() },
        { type: 'code', content: formatCode(afterQuestion) },
      ];
    }
  }

  // Also handle inline code fragments within text (e.g. method names, keywords)
  // Use backtick-style detection for things like `System.out.println()` etc.
  const inlineFormatted = formatInlineCode(text);
  if (inlineFormatted !== text) {
    return [{ type: 'rich', content: inlineFormatted }];
  }

  return [{ type: 'text', content: text }];
}

/**
 * Format extracted code with proper indentation and line breaks.
 */
function formatCode(code) {
  // Remove surrounding quotes if present
  let formatted = code.replace(/^['"]|['"]$/g, '').trim();

  // Add line breaks after { and before }
  formatted = formatted
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*(?![\s}])/g, ';\n  ')  // break after semicolons (not before })
    .replace(/;\s*\}/g, ';\n}');         // break after last statement before }

  // Clean up excessive whitespace and empty lines
  const lines = formatted.split('\n').map(l => l.trimEnd());
  
  // Re-indent properly
  const indented = [];
  let indent = 0;
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue; // skip empty lines
    
    // Decrease indent for closing braces
    if (trimmed.startsWith('}')) {
      indent = Math.max(0, indent - 1);
    }

    indented.push('  '.repeat(indent) + trimmed);

    // Increase indent after opening braces
    if (trimmed.endsWith('{')) {
      indent++;
    }
  }

  return indented.join('\n');
}

/**
 * Detect inline code tokens in text (like method names, keywords) 
 * and wrap them in <code> markers.
 * Returns HTML-like string with <code> tags for rendering.
 */
function formatInlineCode(text) {
  // Match patterns like System.out.println(...), methodName(), ClassName.method(),
  // operators like ==, !=, <=, and common code tokens
  const inlinePatterns = [
    /(\w+\.\w+\.\w+\([^)]*\))/g,         // System.out.println(...)
    /(\w+\.\w+\([^)]*\))/g,               // obj.method(...)
    /(\w+\(\))/g,                           // method()
    /((?:int|float|double|char|String|boolean|void)\s+\w+(?:\s*=\s*[^,;]+)?)/g,  // type declarations
    /(\w+\[\])/g,                           // arrays like String[]
  ];

  let result = text;
  for (const pattern of inlinePatterns) {
    // Only apply if the match looks code-like and is not plain English
    result = result.replace(pattern, (match) => {
      // Skip if it's just a regular word
      if (/^[a-z]+$/i.test(match)) return match;
      if (match.length < 4) return match;
      return `{{code:${match}}}`;
    });
  }

  return result;
}

/**
 * Parse choice text for inline code formatting.
 * More sensitive than question parsing since choices are shorter.
 */
export function parseChoiceText(text) {
  if (!text) return [{ type: 'text', content: text }];

  // Check if the entire choice is essentially code (lower threshold for choices)
  if (looksLikeCode(text) && text.length > 20) {
    return [{ type: 'code', content: formatCode(text) }];
  }

  // Even lighter check — if it has just ONE strong code indicator, treat as code
  const strongCodePatterns = [
    /\b(class|interface)\s+\w+\s*\{/,
    /\b(public|private|protected)\s+(static\s+)?(void|int|String)\s+\w+/,
    /(System\.out\.print|cout\s*<<|cin\s*>>|printf\s*\()/,
    /\bfor\s*\(\s*(int\s+)?\w+\s*=/,
    /\bwhile\s*\(.+\)\s*\{/,
    /\bif\s*\(.+\)\s*\{/,
    /\bswitch\s*\(.+\)/,
    /#include\s*</,
    /\bdef\s+\w+\s*\(/,
    /\bSELECT\s+.*\bFROM\b/i,
    /\bCREATE\s+TABLE/i,
    /\bINSERT\s+INTO/i,
  ];

  for (const pat of strongCodePatterns) {
    if (pat.test(text)) {
      return [{ type: 'code', content: formatCode(text) }];
    }
  }

  // Check for inline code tokens (method calls, type declarations)
  const inlineFormatted = formatInlineCode(text);
  if (inlineFormatted !== text) {
    return [{ type: 'rich', content: inlineFormatted }];
  }

  return [{ type: 'text', content: text }];
}

/**
 * Detect the probable language from code content
 */
export function detectLanguage(code) {
  if (/System\.out|public\s+static\s+void|class\s+\w+.*\{|extends|implements|String\s+\w+/i.test(code)) return 'java';
  if (/cout\s*<<|cin\s*>>|#include|printf|int\s+main/i.test(code)) return 'cpp';
  if (/def\s+\w+|print\(|import\s+\w+|self\./i.test(code)) return 'python';
  if (/console\.log|function\s+\w+|const\s+\w+|let\s+\w+|=>/i.test(code)) return 'javascript';
  if (/SELECT|INSERT|CREATE\s+TABLE|FROM|WHERE/i.test(code)) return 'sql';
  if (/<\w+>|<\/\w+>/i.test(code)) return 'html';
  if (/@media|margin:|padding:|display:/i.test(code)) return 'css';
  return 'code';
}
