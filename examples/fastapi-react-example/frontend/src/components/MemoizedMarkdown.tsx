import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';
import 'katex/dist/katex.min.css';

type MarkdownSize = 'default' | 'small';

interface MemoizedMarkdownProps {
  content: string;
  id: string;
  size?: MarkdownSize;
}

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const code = String(children).replace(/\n$/, '');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
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
          <span className="text-sm font-mono text-muted-foreground capitalize">
            {language}
          </span>
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
          <code className="font-mono text-foreground">{code}</code>
        </pre>
      </div>
    </div>
  );
}

function PureMemoizedMarkdown({ content, id, size = 'default' }: MemoizedMarkdownProps) {
  if (!content) return null;

  const proseClasses = size === 'small'
    ? 'prose prose-sm dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none'
    : 'prose prose-base dark:prose-invert break-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none';

  return (
    <div className={`${proseClasses} markdown-content`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-3 mb-2 text-foreground">
              {children}
            </h4>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 leading-7 text-foreground">
              {children}
            </p>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-foreground ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground ml-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground">
              {children}
            </li>
          ),
          
          // Code blocks
          pre: ({ children }) => children,
          code: ({ className, children, ...props }: any) => {
            const inline = !className?.includes('language-');
            if (!inline) {
              return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
            }
            return (
              <code className="mx-1 px-2 py-1 bg-muted/50 text-foreground font-mono text-sm rounded border">
                {children}
              </code>
            );
          },
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r">
              {children}
            </blockquote>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2 text-foreground">
              {children}
            </td>
          ),
          
          // Links
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-primary hover:text-primary/80 underline underline-offset-2"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">
              {children}
            </em>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(PureMemoizedMarkdown); 
