import { useMemo, useRef } from "react";

const KEYWORDS = new Set([
  "abstract", "as", "async", "await", "break", "case", "catch", "class", "const", "continue", "def", "default", "do", "else", "enum", "export", "extends", "false", "final", "finally", "for", "from", "function", "if", "implements", "import", "in", "interface", "let", "new", "null", "of", "private", "protected", "public", "return", "static", "super", "switch", "this", "throw", "true", "try", "typedef", "var", "void", "while", "with", "yield",
]);

const extensionLanguage = (path = "") => {
  const extension = path.split(".").pop()?.toLowerCase();
  return ({ js: "JavaScript", jsx: "JSX", ts: "TypeScript", tsx: "TSX", json: "JSON", dart: "Dart", py: "Python", java: "Java", css: "CSS", html: "HTML", md: "Markdown" })[extension] || "Source";
};

function highlightLine(line) {
  const parts = [];
  // The editor is deliberately lightweight: it colors the useful everyday
  // syntax while the transparent textarea remains the single source of truth.
  const pattern = /(\/\/.*$|#.*$|\/\*.*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;
  let index = 0;
  let match;
  while ((match = pattern.exec(line))) {
    if (match.index > index) parts.push(<span key={`plain-${index}`}>{line.slice(index, match.index)}</span>);
    const token = match[0];
    let className = "text-[#334155]";
    if (token.startsWith("//") || token.startsWith("#") || token.startsWith("/*")) className = "text-[#6b7280] italic";
    else if (/^['"`]/.test(token)) className = "text-[#b45309]";
    else if (/^\d/.test(token)) className = "text-[#7c3aed]";
    else if (KEYWORDS.has(token)) className = "font-semibold text-[#0f766e]";
    else if (/^[A-Z]/.test(token)) className = "text-[#2563eb]";
    parts.push(<span key={`token-${match.index}`} className={className}>{token}</span>);
    index = match.index + token.length;
  }
  if (index < line.length) parts.push(<span key={`plain-${index}`}>{line.slice(index)}</span>);
  return parts;
}

export default function CodeEditor({ value, onChange, path, disabled = false }) {
  const overlayRef = useRef(null);
  const lineNumbers = useMemo(() => value.split("\n").map((_, index) => index + 1), [value]);
  const lines = useMemo(() => value.split("\n"), [value]);

  const syncScroll = (event) => {
    if (!overlayRef.current) return;
    overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(nextValue);
    requestAnimationFrame(() => target.setSelectionRange(start + 2, start + 2));
  };

  return (
    <div className="overflow-hidden rounded-md border border-line-strong bg-[#fbfcfe] shadow-inner">
      <div className="flex items-center justify-between border-b border-line bg-surface-alt/70 px-3 py-1.5">
        <span className="truncate font-mono text-[11px] text-ink-muted">{path}</span>
        <span className="ml-3 shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">{extensionLanguage(path)}</span>
      </div>
      <div className="relative h-[30rem] overflow-hidden font-mono text-[12px] leading-6">
        <div ref={overlayRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="flex min-w-max">
            <div className="sticky left-0 z-10 select-none border-r border-line bg-[#f3f4f6] px-2.5 py-3 text-right text-[#9ca3af]">
              {lineNumbers.map((number) => <div key={number} className="h-6">{number}</div>)}
            </div>
            <pre className="m-0 min-h-full whitespace-pre px-3 py-3 text-[#334155]">{lines.map((line, index) => <div key={index} className="h-6">{highlightLine(line) || " "}</div>)}</pre>
          </div>
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          spellCheck="false"
          aria-label={`Edit ${path}`}
          className="absolute inset-0 z-20 m-0 h-full w-full resize-none overflow-auto border-0 bg-transparent py-3 pl-[3.65rem] pr-3 font-mono text-[12px] leading-6 text-transparent caret-[#0f172a] outline-none selection:bg-accent-line/80 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
