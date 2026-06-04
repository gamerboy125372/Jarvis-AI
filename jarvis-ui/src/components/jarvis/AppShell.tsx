import React from 'react';
import { BackgroundFX } from './BackgroundFX';
import { CoreOrb } from './CoreOrb';
import { LeftSystemPanel } from './LeftSystemPanel';
import { RightTaskPanel } from './RightTaskPanel';
import { VoiceHUD } from './VoiceHUD';
import { HudOverlay } from './HudOverlay';
import { StartupGreeting } from './StartupGreeting';
import { ConfirmationModal } from './ConfirmationModal';
import { FileDiffModal } from './FileDiffModal';
import { useJarvisStore } from '../../store/jarvisStore';

export function AppShell() {
  const { sendConfirmation } = useJarvisStore();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-cyan-500/30">
      <BackgroundFX />
      <HudOverlay />
      <StartupGreeting />
      <CoreOrb />
      <LeftSystemPanel />
      <RightTaskPanel />
      <VoiceHUD />

      <ConfirmationModal onConfirm={sendConfirmation} />
      <FileDiffModal onConfirm={sendConfirmation} />
    </div>
  );
}
