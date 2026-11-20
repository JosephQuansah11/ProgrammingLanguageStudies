import React from 'react';
import { AppPageId } from '../data/roadmapData';

interface NavbarProps {
  activePage: AppPageId;
  onNavigatePage: (page: AppPageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigatePage }) => {
  const navItems: { id: AppPageId; label: string }[] = [
    { id: 'studies', label: 'Studies Map' },
    { id: 'dl-vision', label: 'DL & Vision' },
    { id: 'tracks', label: 'Tech Tracks' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'testing', label: 'Testing' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-6 py-4">
        <a
          href="#/studies"
          onClick={(e) => {
            e.preventDefault();
            onNavigatePage('studies');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Neural &amp; Vision Lab
        </a>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigatePage(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 ${
                  isActive
                    ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-sky-700'
                    : 'hover:text-slate-900 hover:underline underline-offset-8 decoration-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigatePage('sandbox')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
              activePage === 'sandbox'
                ? 'bg-sky-700 text-white'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Open Sandbox
          </button>
        </div>
      </div>

      {/* Mobile compact page switcher */}
      <div className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-slate-100 px-6 py-2 text-xs font-medium text-slate-600">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigatePage(item.id)}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activePage === item.id ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
