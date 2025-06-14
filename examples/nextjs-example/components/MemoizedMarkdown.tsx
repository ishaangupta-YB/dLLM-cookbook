import React, { memo, useMemo, useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';
import 'katex/dist/katex.min.css';
// @ts-ignore
import katex from 'katex';

type MarkdownSize = 'default' | 'small';

interface MemoizedMarkdownProps {
  content: string;
  id: string;
  size?: MarkdownSize;
}

interface CodeBlockProps {
  language: string;
  children: string;
  id: string;
}

function CodeBlock({ language, children, id }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code to clipboard:', error);
    }
  };

  return (
    <div className="relative group my-6">
      <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-muted/50 border-b border-border">
          <span className="text-sm font-mono text-muted-foreground">{language}</span>
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm bg-transparent">
          <code className="font-mono text-foreground">{children}</code>
        </pre>
      </div>
    </div>
  );
}

function PureMemoizedMarkdown({ content, id, size = 'default' }: MemoizedMarkdownProps) {
  const [renderedContent, setRenderedContent] = useState('');

  const processedContent = useMemo(() => {
    if (!content) return '';

    // Process math expressions using KaTeX first
    let processedText = content;
    
    // Display math ($$...$$) - must be on separate lines
    processedText = processedText.replace(/^\$\$([\s\S]*?)\$\$$/gm, (match, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
          trust: false,
          output: 'html'
        });
        return `<div class="katex-display my-4">${rendered}</div>`;
      } catch (error) {
        console.warn('KaTeX display math error:', error);
        return `<div class="katex-error my-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 font-mono text-sm">${match}</div>`;
      }
    });

    // Inline math ($...$)
    processedText = processedText.replace(/\$([^$\n]+?)\$/g, (match, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false,
          trust: false,
          output: 'html'
        });
        return `<span class="katex-inline">${rendered}</span>`;
      } catch (error) {
        console.warn('KaTeX inline math error:', error);
        return `<span class="katex-error text-red-500 font-mono text-sm">${match}</span>`;
      }
    });

    const parseMarkdown = (text: string) => {
      const lines = text.split('\n');
      const elements: string[] = [];
      let inCodeBlock = false;
      let codeLanguage = '';
      let codeContent: string[] = [];
      let codeBlockIndex = 0;

      lines.forEach((line, index) => {
        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeLanguage = line.slice(3).trim() || 'text';
            codeContent = [];
          } else {
            inCodeBlock = false;
            const blockId = `${id}-code-${codeBlockIndex++}`;
            elements.push(`
              <div class="code-block-container" data-block-id="${blockId}">
                <div class="relative group my-6">
                  <div class="rounded-lg border border-border bg-muted/30 overflow-hidden">
                    <div class="flex justify-between items-center px-4 py-2 bg-muted/50 border-b border-border">
                      <span class="text-sm font-mono text-muted-foreground">${codeLanguage}</span>
                      <button 
                        onclick="copyCodeBlock('${blockId}', '${codeContent.join('\\n').replace(/'/g, "\\'")}');"
                        class="copy-button opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border border-border rounded px-2 py-1 text-xs hover:bg-muted"
                      >
                        <span class="copy-text">Copy</span>
                      </button>
                    </div>
                    <pre class="p-4 overflow-x-auto text-sm bg-transparent"><code class="font-mono text-foreground">${codeContent.join('\n')}</code></pre>
                  </div>
                </div>
              </div>
            `);
          }
          return;
        }

        if (inCodeBlock) {
          codeContent.push(line);
          return;
        }

        let processedLine = line;

        // Bold text
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        
        // Italic text
        processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        
        // Inline code
        processedLine = processedLine.replace(/`(.*?)`/g, '<code class="mx-1 px-2 py-1 bg-muted/50 text-foreground font-mono text-sm rounded border">$1</code>');

        // Headers
        if (line.startsWith('### ')) {
          elements.push(`<h3 class="text-lg font-semibold mt-8 mb-4 text-foreground">${processedLine.slice(4)}</h3>`);
        } else if (line.startsWith('## ')) {
          elements.push(`<h2 class="text-xl font-semibold mt-10 mb-5 text-foreground">${processedLine.slice(3)}</h2>`);
        } else if (line.startsWith('# ')) {
          elements.push(`<h1 class="text-2xl font-bold mt-12 mb-6 text-foreground">${processedLine.slice(2)}</h1>`);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          elements.push(`<li class="ml-6 mb-2 list-disc">${processedLine.slice(2)}</li>`);
        } else if (line.trim() === '') {
          elements.push('<div class="mb-4"></div>');
        } else {
          elements.push(`<p class="mb-4 leading-7 text-foreground">${processedLine}</p>`);
        }
      });

      return elements.join('');
    };

    return parseMarkdown(processedText);
  }, [content, id]);

  useEffect(() => {
    setRenderedContent(processedContent);
    
    // Add global copy function
    if (typeof window !== 'undefined') {
      (window as any).copyCodeBlock = async (blockId: string, code: string) => {
        try {
          await navigator.clipboard.writeText(code);
          const button = document.querySelector(`[data-block-id="${blockId}"] .copy-button .copy-text`);
          if (button) {
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = 'Copy';
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to copy code:', error);
        }
      };
    }
  }, [processedContent]);

  const proseClasses = size === 'small'
    ? 'prose prose-sm dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none'
    : 'prose prose-base dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none';

  return (
    <div 
      className={`${proseClasses} markdown-content`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

export default memo(PureMemoizedMarkdown); 