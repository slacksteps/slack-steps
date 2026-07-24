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

type AppPhase = 'splash' | 'tutorial' | 'main';
type MainScreen = FooterScreen | 'guide' | 'privacy' | 'about' | 'clearedUsers';

interface Profile {
  nickname: string;
  avatarUrl: string;
}

const STORAGE_KEY_CLEARED = 'slackStepsClearedSkills';
const STORAGE_KEY_CLEARED_SCHEMA = 'slackStepsClearedSkillsSchema';
const CURRENT_CLEARED_SCHEMA = 'static-bounce-v1';

function readClearedIds(): string[] {
  if (localStorage.getItem(STORAGE_KEY_CLEARED_SCHEMA) !== CURRENT_CLEARED_SCHEMA) {
    localStorage.removeItem(STORAGE_KEY_CLEARED);
    localStorage.setItem(STORAGE_KEY_CLEARED_SCHEMA, CURRENT_CLEARED_SCHEMA);
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLEARED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveClearedIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY_CLEARED, JSON.stringify(ids));
}

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
  const [profile, setProfile] = useState<Profile>(() => ({
    nickname: localStorage.getItem('slackStepsNickname') ?? '',
    avatarUrl: localStorage.getItem('slackStepsProfileImage') ?? '',
  }));
  const [clearedIds, setClearedIds] = useState<string[]>(() => readClearedIds());
  const [pendingClear, setPendingClear] = useState<PendingClear | null>(null);
  const [homeInitialTab, setHomeInitialTab] = useState<Rank>('Start');

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

  const handleClearSkills = (newIds: string[], pending: PendingClear) => {
    const merged = Array.from(new Set([...clearedIds, ...newIds]));
    saveClearedIds(merged);
    setClearedIds(merged);
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

    const currentClearedIds = readClearedIds();
    setHomeInitialTab(technique.rank);

    if (currentClearedIds.includes(skillId)) {
      setClearedIds(currentClearedIds);
      showNoticeOnHome('すでにクリア済みです', 'この技はすでに記録されています', technique.rank);
      return;
    }

    const nextClearedIds = Array.from(new Set([...currentClearedIds, skillId]));
    saveClearedIds(nextClearedIds);
    setClearedIds(nextClearedIds);
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
    localStorage.removeItem(STORAGE_KEY_CLEARED);
    setClearedIds([]);
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
            onSave={setProfile}
            onBack={goHome}
            onResetTutorial={handleResetTutorial}
            onImport={(restoredProfile, restoredIds) => {
              setProfile(restoredProfile);
              setClearedIds(restoredIds);
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
