import type { ReactNode } from "react";

type Props = {
  title: string;
  content?: string | null;
  children: ReactNode;
};

/** Renders admin CMS body when present; otherwise static fallback children. */
export function PolicyPageShell({ title, content, children }: Props) {
  const live = content?.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-12 uppercase tracking-widest text-center">
        {title}
      </h1>
      {live ? (
        <div 
          className="text-[var(--color-text-muted)] leading-relaxed policy-content"
          dangerouslySetInnerHTML={{ __html: live }}
        />
      ) : (
        children
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .policy-content h1 { font-size: 1.5rem; font-weight: 500; color: var(--color-text); margin-top: 2rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px; }
        .policy-content h2 { font-size: 1.25rem; font-weight: 500; color: var(--color-text); margin-top: 1.5rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
        .policy-content p { margin-bottom: 1rem; }
        .policy-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
        .policy-content strong { font-weight: 600; color: var(--color-text); }
        .policy-content a { text-decoration: underline; }
      `}} />
    </div>
  );
}
