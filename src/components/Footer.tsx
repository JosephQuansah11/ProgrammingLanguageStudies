import React from 'react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onResetProgress: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onResetProgress }) => {
  return (
    <footer className="bg-slate-50 py-10">
      <div className="mx-auto max-w-[1360px] px-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-sm font-bold text-slate-900">
            Neural &amp; Vision Lab
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Interactive Deep Learning Mathematics, Backpropagation &amp; Computer Vision Engineering Reference
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onNavigate('roadmap')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Roadmap
          </button>
          <button
            type="button"
            onClick={() => onNavigate('backprop-lab')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Backprop Lab
          </button>
          <button
            type="button"
            onClick={() => onNavigate('vision-studio')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Vision Studio
          </button>
          <button
            type="button"
            onClick={() => onNavigate('engineering-tracks')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Tech Tracks
          </button>
          <button
            type="button"
            onClick={() => onNavigate('code-sandbox')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Code Sandbox
          </button>
          <button
            type="button"
            onClick={onResetProgress}
            className="text-slate-500 hover:text-rose-700 cursor-pointer"
          >
            Reset Roadmap Progress
          </button>
        </div>
      </div>
    </footer>
  );
};
