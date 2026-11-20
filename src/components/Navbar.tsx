import React from 'react';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const navItems = [
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'backprop-lab', label: 'Backprop Lab' },
    { id: 'vision-studio', label: 'Vision CNN' },
    { id: 'engineering-tracks', label: 'Tech Tracks' },
    { id: 'python-ecosystem', label: 'Python Stack' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-6 py-4">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Neural &amp; Vision Lab
        </a>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('code-sandbox')}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            Open Sandbox
          </button>
        </div>
      </div>
    </header>
  );
};
