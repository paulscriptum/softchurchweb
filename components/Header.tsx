import Link from 'next/link';
import { BlurDot } from './BlurDot';
import { ThemeToggle } from './ThemeToggle';

const nav = [
  { id: 'about', label: 'about' },
  { id: 'objects', label: 'objects' },
  { id: 'manifesto', label: 'manifesto' },
  { id: 'witness', label: 'witness' },
];

/** Off the home page the anchors lead back to its sections. */
export function Header({ home = true }: { home?: boolean }) {
  const logo = (
    <>
      <span>soft</span>
      {/* at 6px the brand ratio blurs to nothing, so the logo dot keeps the reference 1px */}
      <BlurDot size={6} blurRatio={1 / 6} className="mx-[3px] mt-1" />
      <span>church</span>
    </>
  );
  const logoClass = 'flex items-center py-3 text-base tracking-[-0.01em]';

  return (
    <header
      id="top"
      className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-5 text-nav"
    >
      {home ? (
        <a href="#top" className={logoClass}>
          {logo}
        </a>
      ) : (
        <Link href="/" className={logoClass}>
          {logo}
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-x-6">
        <nav aria-label="Main" className="flex flex-wrap gap-x-6">
          {nav.map((item) => (
            home ? (
              <a key={item.id} href={`#${item.id}`} className="py-3">
                {item.label}
              </a>
            ) : (
              <Link key={item.id} href={`/#${item.id}`} className="py-3">
                {item.label}
              </Link>
            )
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
