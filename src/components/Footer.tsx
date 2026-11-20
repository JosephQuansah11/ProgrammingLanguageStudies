import React from 'react';
import { AppPageId } from '../data/roadmapData';

interface FooterProps {
  onNavigatePage: (page: AppPageId) => void;
  onResetProgress: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigatePage, onResetProgress }) => {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto max-w-[1360px] px-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-sm font-bold text-slate-900">
            Neural &amp; Vision Lab
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Deep Learning, Computer Vision, Full-Stack Systems, Architecture &amp; Testing Workbench
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-600">
          <button type="button" onClick={() => onNavigatePage('studies')} className="hover:text-slate-900 cursor-pointer">
            Studies Map
          </button>
          <button type="button" onClick={() => onNavigatePage('dl-vision')} className="hover:text-slate-900 cursor-pointer">
            DL &amp; Vision
          </button>
          <button type="button" onClick={() => onNavigatePage('tracks')} className="hover:text-slate-900 cursor-pointer">
            Tech Tracks
          </button>
          <button type="button" onClick={() => onNavigatePage('architecture')} className="hover:text-slate-900 cursor-pointer">
            Architecture
          </button>
          <button type="button" onClick={() => onNavigatePage('testing')} className="hover:text-slate-900 cursor-pointer">
            Testing Phases
          </button>
          <button type="button" onClick={() => onNavigatePage('sandbox')} className="hover:text-slate-900 cursor-pointer">
            Code Sandbox
          </button>
          <button type="button" onClick={onResetProgress} className="text-slate-500 hover:text-rose-700 cursor-pointer">
            Reset Roadmap Progress
          </button>
        </div>
      </div>
    </footer>
  );
};
