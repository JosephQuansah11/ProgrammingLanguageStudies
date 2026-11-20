/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { CodeSandbox, SandboxMode } from './components/CodeSandbox';
import { DesignArchitecturePage } from './components/DesignArchitecturePage';
import { DlVisionPage } from './components/DlVisionPage';
import { EngineeringTracks } from './components/EngineeringTracks';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { RoadmapSection } from './components/RoadmapSection';
import { TestingPhasesPage } from './components/TestingPhasesPage';
import { AppPageId, DlSubTab, ROADMAP_STAGES, RoadmapStage } from './data/roadmapData';

const STORAGE_KEY = 'neural_vision_lab_milestones_v1';

const VALID_PAGES: AppPageId[] = ['studies', 'dl-vision', 'tracks', 'architecture', 'testing', 'sandbox'];

function getPageFromHash(): AppPageId {
  try {
    const raw = window.location.hash.replace(/^#\/?/, '') as AppPageId;
    return VALID_PAGES.includes(raw) ? raw : 'studies';
  } catch {
    return 'studies';
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<AppPageId>(() => getPageFromHash());
  const [dlSubTab, setDlSubTab] = useState<DlSubTab>('backprop');

  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  const [sandboxRequest, setSandboxRequest] = useState<{
    mode: SandboxMode;
    code: string;
    label: string;
    nonce: number;
  } | null>(null);

  const [trackRequest, setTrackRequest] = useState<{
    trackId: string;
    nonce: number;
  } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedMilestones));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedMilestones]);

  useEffect(() => {
    const handleHashChange = () => {
      setActivePage(getPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const totalMilestonesCount = useMemo(
    () => ROADMAP_STAGES.reduce((sum, stage) => sum + stage.milestones.length, 0),
    []
  );

  const completedMilestonesCount = useMemo(
    () => Object.values(completedMilestones).filter(Boolean).length,
    [completedMilestones]
  );

  const handleToggleMilestone = (id: string) => {
    setCompletedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleResetProgress = () => {
    setCompletedMilestones({});
  };

  const handleNavigatePage = (page: AppPageId, optionalDlTab?: DlSubTab) => {
    if (optionalDlTab) setDlSubTab(optionalDlTab);
    setActivePage(page);
    try {
      window.location.hash = `#/${page}`;
    } catch {
      // Ignore hash restrictions
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleOpenStageTarget = (stage: RoadmapStage) => {
    if (stage.engineeringTrackId) {
      setTrackRequest({ trackId: stage.engineeringTrackId, nonce: Date.now() });
    }
    handleNavigatePage(stage.targetPage, stage.dlSubTab);
  };

  const handleLoadInSandbox = (mode: SandboxMode, code: string, label: string) => {
    setSandboxRequest({ mode, code, label, nonce: Date.now() });
    handleNavigatePage('sandbox');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar activePage={activePage} onNavigatePage={(p) => handleNavigatePage(p)} />

      <main className="flex-1">
        {activePage === 'studies' && (
          <>
            <HeroSection
              onNavigatePage={handleNavigatePage}
              completedMilestonesCount={completedMilestonesCount}
              totalMilestonesCount={totalMilestonesCount}
            />
            <RoadmapSection
              completedMilestones={completedMilestones}
              onToggleMilestone={handleToggleMilestone}
              onOpenStageTarget={handleOpenStageTarget}
            />
          </>
        )}

        {activePage === 'dl-vision' && (
          <DlVisionPage
            activeSubTab={dlSubTab}
            onChangeSubTab={setDlSubTab}
            onLoadInSandbox={handleLoadInSandbox}
          />
        )}

        {activePage === 'tracks' && (
          <EngineeringTracks
            onLoadInSandbox={handleLoadInSandbox}
            externalTrackRequest={trackRequest}
          />
        )}

        {activePage === 'architecture' && (
          <DesignArchitecturePage onNavigate={(p) => handleNavigatePage(p)} />
        )}

        {activePage === 'testing' && (
          <TestingPhasesPage onLoadInSandbox={handleLoadInSandbox} />
        )}

        {activePage === 'sandbox' && <CodeSandbox externalRequest={sandboxRequest} />}
      </main>

      <Footer onNavigatePage={(p) => handleNavigatePage(p)} onResetProgress={handleResetProgress} />
    </div>
  );
}
