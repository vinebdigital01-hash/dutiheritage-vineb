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
        <div className="text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap">
          {live}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
