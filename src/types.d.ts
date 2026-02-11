// Type declarations for markdown-it plugins without @types

declare module 'markdown-it-attrs' {
  import MarkdownIt from 'markdown-it';
  const attrs: (md: MarkdownIt) => void;
  export default attrs;
}

declare module 'markdown-it-task-lists' {
  import MarkdownIt from 'markdown-it';
  const taskLists: (md: MarkdownIt, options?: { enabled?: boolean; label?: boolean }) => void;
  export default taskLists;
}

declare module 'markdown-it-github-alerts' {
  import MarkdownIt from 'markdown-it';
  const githubAlerts: (md: MarkdownIt) => void;
  export default githubAlerts;
}

declare module 'markdown-it-anchor' {
  import MarkdownIt from 'markdown-it';
  const anchor: (md: MarkdownIt, options?: any) => void;
  export default anchor;
}

declare module 'markdown-it-emoji' {
  import MarkdownIt from 'markdown-it';
  const emoji: (md: MarkdownIt) => void;
  export default emoji;
}

// Highlight.js global from CDN
declare const hljs: {
  highlight: (code: string, options: { language: string }) => { value: string };
  highlightElement: (element: Element) => void;
  getLanguage: (language: string) => any;
};

// Mermaid global from CDN  
declare const mermaid: {
  initialize: (options: any) => void;
  run: () => void;
};
