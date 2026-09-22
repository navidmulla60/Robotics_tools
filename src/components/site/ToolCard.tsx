import Link from 'next/link';

interface Props {
  title: string;
  description: string;
  href?: string;
  status?: 'live' | 'soon';
}

export default function ToolCard({ title, description, href, status = 'soon' }: Props) {
  const content = (
    <div
      className={`h-full rounded-lg border p-4 transition-colors ${
        status === 'live'
          ? 'border-neutral-200 bg-white hover:border-blue-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-600'
          : 'border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {status === 'soon' && (
          <span className="shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );

  if (status === 'live' && href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
