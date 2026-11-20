/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { BackpropLab } from './components/BackpropLab';
import { CodeSandbox, SandboxMode } from './components/CodeSandbox';
import { EngineeringTracks } from './components/EngineeringTracks';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { ImplementationGuide } from './components/ImplementationGuide';
import { MathFoundations } from './components/MathFoundations';
import { Navbar } from './components/Navbar';
import { PythonEcosystem } from './components/PythonEcosystem';
import { RoadmapSection } from './components/RoadmapSection';
import { VisionStudio } from './components/VisionStudio';
import { ROADMAP_STAGES } from './data/roadmapData';

const STORAGE_KEY = 'neural_vision_lab_milestones_v1';

export default function App() {
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

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLoadInSandbox = (mode: SandboxMode, code: string, label: string) => {
    setSandboxRequest({ mode, code, label, nonce: Date.now() });
    handleNavigate('code-sandbox');
  };

  const handleOpenEngineeringTrack = (trackId: string) => {
    setTrackRequest({ trackId, nonce: Date.now() });
    handleNavigate('engineering-tracks');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar onNavigate={handleNavigate} />
      <main>
        <HeroSection
          onNavigate={handleNavigate}
          completedMilestonesCount={completedMilestonesCount}
          totalMilestonesCount={totalMilestonesCount}
        />
        <RoadmapSection
          completedMilestones={completedMilestones}
          onToggleMilestone={handleToggleMilestone}
          onNavigate={handleNavigate}
          onOpenEngineeringTrack={handleOpenEngineeringTrack}
        />
        <MathFoundations />
        <BackpropLab />
        <VisionStudio />
        <ImplementationGuide />
        <PythonEcosystem />
        <EngineeringTracks
          onLoadInSandbox={handleLoadInSandbox}
          externalTrackRequest={trackRequest}
        />
        <CodeSandbox externalRequest={sandboxRequest} />
      </main>
      <Footer onNavigate={handleNavigate} onResetProgress={handleResetProgress} />
    </div>
  );
}
