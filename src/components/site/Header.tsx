import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          <span className="rounded-md bg-blue-600 px-2 py-1 text-sm font-bold text-white">RT</span>
          RoboticsTools.in
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <Link href="/tools/urdf-visualizer" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            URDF Visualizer
          </Link>
          <Link href="/#tools" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            All tools
          </Link>
        </nav>
      </div>
    </header>
  );
}
