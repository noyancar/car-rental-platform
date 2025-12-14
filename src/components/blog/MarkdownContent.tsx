import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-volcanic-900
      prose-p:text-volcanic-800 prose-p:leading-relaxed prose-a:text-primary-700 prose-a:no-underline
      hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-strong:text-volcanic-900
      prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-blockquote:border-l-primary-700
      prose-blockquote:bg-primary-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r
      prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      prose-pre:bg-gray-900 prose-pre:text-gray-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom image rendering for better styling
          img: ({ node, ...props }) => (
            <img
              {...props}
              className="rounded-lg shadow-md my-6 w-full object-cover"
              loading="lazy"
              alt={props.alt || 'Blog image'}
            />
          ),
          // Custom heading anchors
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-bold mt-8 mb-4 text-volcanic-900" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-bold mt-6 mb-3 text-volcanic-900" {...props} />
          ),
          // Custom link styling
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-primary-700 hover:text-primary-800 hover:underline"
              target={props.href?.startsWith('http') ? '_blank' : undefined}
              rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
