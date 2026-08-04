import { useCallback, useEffect, useRef, useState } from 'react';
import { FooterNav } from './components/FooterNav';
import type { FooterScreen } from './components/FooterNav';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { CheckScreen } from './screens/CheckScreen';
import { ScanScreen } from './screens/ScanScreen';
import { GuideScreen } from './screens/GuideScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import { AboutScreen } from './screens/AboutScreen';
import { ClearedUsersScreen } from './screens/ClearedUsersScreen';
import { SplashScreen } from './screens/SplashScreen';
import { TutorialScreen, isTutorialCompleted, resetTutorial } from './screens/TutorialScreen';
import { Rank } from './types/technique';
import { allTechniques } from './data/techniques';
import { getSkillIdFromQrCode, QR_CLEAR_PARAM } from './data/qrCodes';
import {
  activateDeviceProfile,
  addDeviceProfile,
  getActiveDeviceProfile,
  loadDeviceProfilesState,
  removeDeviceProfile,
  updateDeviceProfile,
} from './data/deviceProfiles';
import { fetchAppConfig, readCachedAppConfig } from './services/slackStepsApi';

type AppPhase = 'splash' | 'tutorial' | 'main';
type MainScreen = FooterScreen | 'guide' | 'privacy' | 'about' | 'clearedUsers';

export type PendingClear =
  | { type: 'nice'; rank: Rank }
  | { type: 'complete'; rank: Rank }
  | { type: 'notice'; title: string; message: string };

function removeQrParamFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete(QR_CLEAR_PARAM);
  const nextSearch = url.searchParams.toString();
  window.history.replaceState(
    {},
    '',
    `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`
  );
}

function getTechniqueById(skillId: string) {
  return allTechniques.find((technique) => technique.id === skillId) ?? null;
}

function isRankComplete(rank: Rank, clearedSkillIds: string[]): boolean {
  const rankTechniques = allTechniques.filter((technique) => technique.rank === rank);
  return rankTechniques.length > 0 && rankTechniques.every((technique) => clearedSkillIds.includes(technique.id));
}

function getQrCodeFromDecodedText(decodedText: string): string | null {
  const trimmedText = decodedText.trim();
  if (!trimmedText) return null;

  if (trimmedText.startsWith('http://') || trimmedText.startsWith('https://')) {
    try {
      const url = new URL(trimmedText);
      return url.searchParams.get(QR_CLEAR_PARAM);
    } catch {
      return null;
    }
  }

  return trimmedText;
}

const FOOTER_SCREENS: FooterScreen[] = ['home', 'scan', 'check', 'profile'];

function isFooterScreen(screen: MainScreen): screen is FooterScreen {
  return FOOTER_SCREENS.includes(screen as FooterScreen);
}

function App() {
  const qrHandledRef = useRef(false);
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [homeFadeIn, setHomeFadeIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<MainScreen>('home');
  const [profilesState, setProfilesState] = useState(() => loadDeviceProfilesState());
  const [pendingClear, setPendingClear] = useState<PendingClear | null>(null);
  const [homeInitialTab, setHomeInitialTab] = useState<Rank>('Start');
  const [debugEnabled, setDebugEnabled] = useState(
    () => readCachedAppConfig().debugEnabled
  );
  const activeProfile = getActiveDeviceProfile(profilesState);
  const profile = { nickname: activeProfile.nickname, avatarUrl: activeProfile.avatarUrl };
  const clearedIds = activeProfile.clearedSkillIds;

  const updateActiveProfile = (
    updates: Partial<Pick<typeof activeProfile, 'nickname' | 'avatarUrl' | 'clearedSkillIds'>>
  ) => {
    setProfilesState((state) => updateDeviceProfile(state, state.activeProfileId, updates));
  };

  const goToMain = () => {
    setPhase('main');
    // brief delay so React renders main before we add the fade-in class
    setTimeout(() => setHomeFadeIn(true), 16);
  };

  const goHome = () => setCurrentScreen('home');

  const showMainHome = useCallback(() => {
    setCurrentScreen('home');
    setPhase('main');
    setHomeFadeIn(false);
    setTimeout(() => setHomeFadeIn(true), 16);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshConfig = () => {
      void fetchAppConfig()
        .then((config) => {
          if (!cancelled) setDebugEnabled(config.debugEnabled);
        })
        .catch(() => {
          // Keep the recent cached value when the remote settings are unavailable.
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshConfig();
    };

    refreshConfig();
    window.addEventListener('focus', refreshConfig);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshConfig);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleClearSkills = (newIds: string[], pending: PendingClear) => {
    const merged = Array.from(new Set([...clearedIds, ...newIds]));
    updateActiveProfile({ clearedSkillIds: merged });
    setPendingClear(pending);
    if (pending.type !== 'notice') {
      setHomeInitialTab(pending.rank);
    }
    setCurrentScreen('home');
  };

  const showNoticeOnHome = useCallback((title: string, message: string, initialTab: Rank = 'Start') => {
    setHomeInitialTab(initialTab);
    setPendingClear({ type: 'notice', title, message });
    showMainHome();
  }, [showMainHome]);

  const handleSkillClear = useCallback((skillId: string) => {
    const technique = getTechniqueById(skillId);

    if (!technique) {
      showNoticeOnHome('QRコードを読み取れませんでした', 'このQRコードは無効です');
      return;
    }

    const storedState = loadDeviceProfilesState();
    const currentClearedIds = getActiveDeviceProfile(storedState).clearedSkillIds;
    setHomeInitialTab(technique.rank);

    if (currentClearedIds.includes(skillId)) {
      showNoticeOnHome('すでにクリア済みです', 'この技はすでに記録されています', technique.rank);
      return;
    }

    const nextClearedIds = Array.from(new Set([...currentClearedIds, skillId]));
    setProfilesState(updateDeviceProfile(storedState, storedState.activeProfileId, {
      clearedSkillIds: nextClearedIds,
    }));
    setPendingClear(
      isRankComplete(technique.rank, nextClearedIds)
        ? { type: 'complete', rank: technique.rank }
        : { type: 'nice', rank: technique.rank }
    );
    showMainHome();
  }, [showMainHome, showNoticeOnHome]);

  const handleQrCodeClear = useCallback((qrCode: string | null) => {
    if (!qrCode) {
      showNoticeOnHome('QRコードを読み取れませんでした', 'このQRコードは無効です');
      return;
    }

    const skillId = getSkillIdFromQrCode(qrCode);
    if (!skillId) {
      showNoticeOnHome('QRコードを読み取れませんでした', 'このQRコードは無効です');
      return;
    }

    handleSkillClear(skillId);
  }, [handleSkillClear, showNoticeOnHome]);

  const handleScanDecodedText = (decodedText: string) => {
    handleQrCodeClear(getQrCodeFromDecodedText(decodedText));
  };

  useEffect(() => {
    if (qrHandledRef.current) return;
    qrHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const qrCode = params.get(QR_CLEAR_PARAM);
    if (!qrCode) return;

    removeQrParamFromUrl();
    handleQrCodeClear(qrCode);
  }, [handleQrCodeClear]);

  const handleResetCleared = () => {
    updateActiveProfile({ clearedSkillIds: [] });
  };

  const handleResetTutorial = () => {
    resetTutorial();
    setCurrentScreen('home');
    setHomeFadeIn(false);
    setPhase('splash');
  };

  if (phase === 'splash') {
    return (
      <div className="app-shell min-h-screen bg-background">
        <div className="app-container max-w-md mx-auto min-h-screen relative">
          <SplashScreen onDone={() => isTutorialCompleted() ? goToMain() : setPhase('tutorial')} />
        </div>
      </div>
    );
  }

  if (phase === 'tutorial') {
    return (
      <div className="app-shell min-h-screen bg-background">
        <div className="app-container max-w-md mx-auto min-h-screen relative">
          <TutorialScreen onComplete={goToMain} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            profile={profile}
            clearedIds={clearedIds}
            pendingClear={pendingClear}
            onClearPending={() => setPendingClear(null)}
            initialTab={homeInitialTab}
            onGuide={() => setCurrentScreen('guide')}
            onPrivacy={() => setCurrentScreen('privacy')}
            onAbout={() => setCurrentScreen('about')}
            onClearedUsers={() => setCurrentScreen('clearedUsers')}
          />
        );
      case 'check':
        return (
          <CheckScreen
            clearedIds={clearedIds}
            debugEnabled={debugEnabled}
            onClearSkills={handleClearSkills}
            onResetCleared={handleResetCleared}
          />
        );
      case 'scan':
        return (
          <ScanScreen
            onScan={handleScanDecodedText}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            profiles={profilesState.profiles}
            activeProfileId={profilesState.activeProfileId}
            clearedIds={clearedIds}
            debugEnabled={debugEnabled}
            onSave={(savedProfile) => updateActiveProfile(savedProfile)}
            onAddProfile={() => {
              setPendingClear(null);
              setHomeInitialTab('Start');
              setProfilesState((state) => addDeviceProfile(state));
            }}
            onSwitchProfile={(profileId) => {
              setPendingClear(null);
              setHomeInitialTab('Start');
              setProfilesState((state) => activateDeviceProfile(state, profileId));
            }}
            onDeleteProfile={() => {
              setPendingClear(null);
              setHomeInitialTab('Start');
              setProfilesState((state) => removeDeviceProfile(state, state.activeProfileId));
            }}
            onBack={goHome}
            onResetTutorial={handleResetTutorial}
            onImport={(restoredProfile, restoredIds) => {
              updateActiveProfile({ ...restoredProfile, clearedSkillIds: restoredIds });
            }}
          />
        );
      case 'guide':
        return <GuideScreen onBack={goHome} />;
      case 'privacy':
        return <PrivacyScreen onBack={goHome} />;
      case 'about':
        return <AboutScreen onBack={goHome} />;
      case 'clearedUsers':
        return <ClearedUsersScreen onBack={goHome} />;
      default:
        return (
          <HomeScreen
            profile={profile}
            clearedIds={clearedIds}
            pendingClear={pendingClear}
            onClearPending={() => setPendingClear(null)}
            initialTab={homeInitialTab}
            onGuide={() => setCurrentScreen('guide')}
            onPrivacy={() => setCurrentScreen('privacy')}
            onAbout={() => setCurrentScreen('about')}
            onClearedUsers={() => setCurrentScreen('clearedUsers')}
          />
        );
    }
  };

  const showFooter = isFooterScreen(currentScreen);

  return (
    <div className="app-shell min-h-screen bg-background">
      <div className={`app-container max-w-md mx-auto min-h-screen flex flex-col relative page-fade ${homeFadeIn ? 'page-fade-in' : ''}`}>
        <main key={currentScreen} className="app-main-transition flex-1 relative">{renderContent()}</main>
        {showFooter && (
          <FooterNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  );
}

export default App;
