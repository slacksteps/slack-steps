import { useEffect, useRef, useState } from 'react';
import { TabBar } from '../components/TabBar';
import menuIcon from '../assets/icons/icn-menu.svg';
import clearIcon from '../assets/icons/icn-clear.svg';
import { TechniqueCard } from '../components/TechniqueCard';
import { TechniqueDetailModal } from '../components/TechniqueDetailModal';
import { HamburgerMenuModal } from '../components/HamburgerMenuModal';
import { getTechniquesByRank, staticTechniques, bounceTechniques, startTechniques } from '../data/techniques';
import { Technique, Rank } from '../types/technique';
import { getImageUrl } from '../utils/images';
import { getYouTubeEmbedUrl } from '../data/skills';
import trendIcon from '../assets/icons/icn-trend.svg';
import profIcon from '../assets/icons/icn-prof.svg';
import type { PendingClear } from '../App';

type Tab = 'Start' | 'Static' | 'Bounce';

const SPEC_DISPLAY_BY_TAB: Record<Tab, { label: string; name: string }> = {
  Start: { label: 'SPEC', name: 'ラック' },
  Static: { label: 'SPEC', name: '低いライン' },
  Bounce: { label: 'SPEC', name: '高いライン' },
};

const COMMENT_DISPLAY_BY_TAB: Record<Tab, { filename: string; alt: string; width: number }> = {
  Start: { filename: 'start-comment.svg', alt: 'まずはここから', width: 146 },
  Static: { filename: 'staticocomment.svg', alt: '基本を身につけよう', width: 160 },
  Bounce: { filename: 'bounce-comment.svg', alt: '技に挑戦しよう', width: 160 },
};

const START_INTRO_VIDEO_ID = 'fpVE_qwd4sQ';
const START_INTRO_COMMENT = 'まずはここから。お手本動画を参考にして基本姿勢を習得しよう。体の力を抜いてリラックス！';

interface Profile {
  nickname: string;
  avatarUrl: string;
}

interface HomeScreenProps {
  profile: Profile;
  clearedIds: string[];
  pendingClear: PendingClear | null;
  onClearPending: () => void;
  initialTab?: Rank;
  onGuide?: () => void;
  onPrivacy?: () => void;
  onAbout?: () => void;
  onClearedUsers?: () => void;
}

// ---- helpers ----

function withCleared(techniques: Technique[], clearedIds: string[]): Technique[] {
  return techniques.map((t) => ({ ...t, cleared: clearedIds.includes(t.id) }));
}

function isRankComplete(rank: Rank, clearedSkillIds: string[]): boolean {
  const techniques = rank === 'Start' ? startTechniques : rank === 'Static' ? staticTechniques : bounceTechniques;
  return techniques.length > 0 && techniques.every((t) => clearedSkillIds.includes(t.id));
}

function isRankUnlocked(rank: Rank, clearedSkillIds: string[]): boolean {
  if (rank === 'Start') return true;
  // STATIC and BOUNCE both unlock when START is complete
  return isRankComplete('Start', clearedSkillIds);
}

function getSafeHomeRank(requested: Rank, clearedSkillIds: string[]): Tab {
  return isRankUnlocked(requested, clearedSkillIds) ? requested : 'Start';
}

// ---- ProgressBar ----

function ProgressBar({ cleared, total }: { cleared: number; total: number }) {
  const pct = total > 0 ? Math.min((cleared / total) * 100, 100) : 0;
  return (
    <div className="progress-area flex items-center gap-2 pt-7">
      <img src={trendIcon} alt="trend" className="progress-trend-icon w-5 h-5 flex-shrink-0" />
      <span className="progress-number font-jost text-sm text-text-primary leading-none">0</span>
      <div className="relative flex-1 mx-1">
        <div
          className="progress-marker absolute bottom-full -translate-x-1/2 flex flex-col items-center mb-1"
          style={{ left: `${pct}%` }}
        >
          <div className="adj-progress-point bg-black text-white font-jost font-bold text-xs rounded-full flex items-center justify-center">
            {cleared}
          </div>
          <div className="adj-progress-point-arrow w-2 h-1.5 bg-black" style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }} />
        </div>
        <div className="progress-track h-1.5 bg-gray-200 rounded-full">
          <div className="progress-fill h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="progress-number font-jost text-sm text-text-primary leading-none">{total}</span>
    </div>
  );
}

// ---- NiceDialog ----

function NiceDialog({ onClose }: { onClose: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 2500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onClose]);

  return (
    <div
      className="clear-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="clear-dialog bg-white rounded-3xl px-12 py-10 flex flex-col items-center gap-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clear-dialog-icon-wrap w-20 h-20 flex items-center justify-center">
          <img src={clearIcon} alt="clear" className="clear-dialog-icon w-20 h-20" />
        </div>
        <p className="clear-dialog-text font-jost font-bold text-xl text-text-primary tracking-wider">
          NICE!!
        </p>
      </div>
    </div>
  );
}

// ---- CompleteModal ----

const RANK_COMPLETE_CONFIG: Record<Rank, { label: string; bg: string; image: string; modalClass: string }> = {
  Start:    { label: 'START',    bg: '#9dd6ff', image: 'start-complete.webp',    modalClass: 'complete-modal-start' },
  Static: { label: 'STATIC', bg: '#a8e6c8', image: 'static-complete.webp', modalClass: 'complete-modal-static' },
  Bounce: { label: 'BOUNCE', bg: '#c4b5fd', image: 'bounce-complete.webp', modalClass: 'complete-modal-bounce' },
};

function CompleteModal({ rank, onClose }: { rank: Rank; onClose: () => void }) {
  const config = RANK_COMPLETE_CONFIG[rank];
  const imgUrl = getImageUrl(config.image);

  return (
    <div
      className="complete-modal-overlay fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className={`complete-modal ${config.modalClass} w-full max-w-md rounded-t-3xl animate-slide-up overflow-hidden`}
        style={{ backgroundColor: config.bg, maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-4 pt-10 pb-10 gap-6">
          <div className="complete-modal-image-wrap w-full flex justify-center">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={`${config.label} complete`}
                className="complete-modal-image object-contain"
                style={{ height: '440px', width: 'auto', maxWidth: '100%' }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16">
                <p className="complete-modal-rank font-jost font-bold text-text-primary" style={{ fontSize: '3rem' }}>{config.label}</p>
                <p className="complete-modal-complete font-jost font-bold text-text-primary text-lg tracking-widest">COMPLETE</p>
              </div>
            )}
          </div>

          <button
            className="complete-modal-close-button font-jost font-bold text-sm tracking-widest px-16 py-3.5 rounded-full border-2 border-black bg-white text-text-primary"
            onClick={onClose}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- UnlockDialog ----

function UnlockDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="unlock-dialog-overlay fixed inset-0 z-[75] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="unlock-dialog bg-white rounded-3xl px-8 py-10 flex flex-col items-center gap-4 shadow-xl mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="unlock-dialog-title font-jost font-bold text-xl text-text-primary tracking-wider text-center">
          RANK UNLOCK!
        </p>
        <p className="unlock-dialog-text font-jp text-sm text-text-primary text-center leading-relaxed">
          STATIC / BOUNCE の<br />ロックを解除しました
        </p>
        <p className="font-jp text-xs text-text-secondary text-center">
          次のステップにチャレンジできます
        </p>
        <button
          className="unlock-dialog-button font-jost font-bold text-sm tracking-widest px-12 py-3.5 rounded-full bg-black text-white mt-2"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}

// ---- NoticeDialog ----

function NoticeDialog({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <div
      className="notice-dialog-overlay fixed inset-0 z-[80] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="notice-dialog bg-white rounded-3xl px-8 py-10 flex flex-col items-center gap-4 shadow-xl mx-6 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="notice-dialog-title font-jost font-bold text-xl text-text-primary tracking-wider text-center">
          {title}
        </p>
        <p className="notice-dialog-message font-jp text-sm text-text-primary text-center leading-relaxed">
          {message}
        </p>
        <button
          className="notice-dialog-button font-jost font-bold text-sm tracking-widest px-12 py-3.5 rounded-full bg-black text-white mt-2"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}

// ---- HomeScreen ----

export function HomeScreen({ profile, clearedIds, pendingClear, onClearPending, initialTab, onGuide, onPrivacy, onAbout, onClearedUsers }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>(() => getSafeHomeRank(initialTab ?? 'Start', clearedIds));
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingUnlockDialog, setPendingUnlockDialog] = useState(false);

  const rawTechniques = getTechniquesByRank(activeTab);
  const currentTechniques = withCleared(rawTechniques, clearedIds);
  const clearedCount = currentTechniques.filter((t) => t.cleared).length;
  const totalCount = currentTechniques.length;

  const staCleared = withCleared(staticTechniques, clearedIds).filter((t) => t.cleared).length;
  const bouCleared = withCleared(bounceTechniques, clearedIds).filter((t) => t.cleared).length;

  const checkUnlocked = (tab: Tab) => isRankUnlocked(tab, clearedIds);

  const avatarUrl = getImageUrl('default-user.webp');
  const specDisplay = SPEC_DISPLAY_BY_TAB[activeTab];
  const isStartTab = activeTab === 'Start';
  const rankComment = COMMENT_DISPLAY_BY_TAB[activeTab];
  const rankCommentUrl = getImageUrl(rankComment.filename);
  const startIntroVideoUrl = getYouTubeEmbedUrl(START_INTRO_VIDEO_ID);

  const handleDetailOpen = (technique: Technique) => {
    const enriched = { ...technique, cleared: clearedIds.includes(technique.id) };
    setSelectedTechnique(enriched);
  };

  const handleCompleteClose = () => {
    if (pendingClear?.type === 'complete' && pendingClear.rank === 'Start') {
      setPendingUnlockDialog(true);
    }
    onClearPending();
  };

  return (
    <div className="page-home flex flex-col min-h-screen bg-background pb-28">
      {/* Profile Header */}
      <div className="home-header px-6 pt-6 pb-4">
        <div className="profile-header flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="profile-avatar w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="avatar" className="profile-avatar-icon w-full h-full object-cover" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="profile-avatar-icon w-full h-full object-cover" />
              ) : (
                <img src={profIcon} alt="profile" className="profile-avatar-icon w-10 h-10 opacity-40" />
              )}
            </div>
            <div className="profile-info">
              <p className="profile-name font-jost font-normal text-xl text-text-primary mb-2">
                {profile.nickname || 'SLACKER'}
              </p>
              <div className="profile-progress flex items-center gap-3">
                <div className="progress-badge progress-badge-sta flex items-center gap-1.5">
                  <span className="inline-flex h-5 items-center justify-center rounded-full bg-green-400 px-2">
                    <span className="translate-y-px font-jost text-xs font-bold leading-none text-black">STA</span>
                  </span>
                  <span className="font-jost text-sm text-text-primary">{staCleared}/10</span>
                </div>
                <div className="progress-badge progress-badge-bou flex items-center gap-1.5">
                  <span className="inline-flex h-5 items-center justify-center rounded-full bg-purple-400 px-2">
                    <span className="translate-y-px font-jost text-xs font-bold leading-none text-black">BOU</span>
                  </span>
                  <span className="font-jost text-sm text-text-primary">{bouCleared}/10</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setMenuOpen(true)} className="hamburger-button w-10 h-10 flex items-center justify-center">
            <img src={menuIcon} alt="menu" className="hamburger-line w-10 h-10" />
          </button>
        </div>
      </div>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} isUnlocked={checkUnlocked} />

      <div className="spec-progress-row flex items-center justify-between px-6 py-4">
        {rankCommentUrl ? (
          <img
            src={rankCommentUrl}
            alt={rankComment.alt}
            className="rank-comment-image h-auto flex-shrink-0"
            style={{ width: `${rankComment.width}px` }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="spec-label font-jost font-bold text-base text-text-primary">{specDisplay.label}</span>
            <span className="spec-name font-jp text-sm text-text-primary">{specDisplay.name}</span>
          </div>
        )}
        <div className="ml-6 adj-progress-bar">
          <ProgressBar cleared={clearedCount} total={totalCount} />
        </div>
      </div>

      {isStartTab && (
        <div className="start-intro px-6 pb-5">
          <div className="start-intro-video w-full aspect-video overflow-hidden rounded-2xl bg-gray-200">
            <iframe
              src={startIntroVideoUrl}
              title="START お手本動画"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p className="start-intro-comment font-jp text-base text-text-primary leading-normal mt-5">
            {START_INTRO_COMMENT}
          </p>
        </div>
      )}

      <div className="skill-grid px-6">
        <div className={`grid gap-3 ${isStartTab ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {currentTechniques.map((technique) => (
            <TechniqueCard
              key={technique.id}
              technique={technique}
              onTap={() => handleDetailOpen(technique)}
              showGrade={!isStartTab}
            />
          ))}
        </div>
      </div>

      <p className="challenge-note font-jp text-sm text-text-secondary px-6 mt-5">
        ※チャレンジは3回まで
      </p>

      {selectedTechnique && (
        <TechniqueDetailModal technique={selectedTechnique} onClose={() => setSelectedTechnique(null)} />
      )}

      {menuOpen && (
        <HamburgerMenuModal
          onClose={() => setMenuOpen(false)}
          onSelectItem={(item) => {
            setMenuOpen(false);
            if (item === 'guide') onGuide?.();
            if (item === 'privacy') onPrivacy?.();
            if (item === 'about') onAbout?.();
            if (item === 'cleared') onClearedUsers?.();
          }}
        />
      )}

      {/* NiceDialog */}
      {pendingClear?.type === 'nice' && (
        <NiceDialog onClose={onClearPending} />
      )}

      {/* CompleteModal */}
      {pendingClear?.type === 'complete' && (
        <CompleteModal rank={pendingClear.rank} onClose={handleCompleteClose} />
      )}

      {/* NoticeDialog */}
      {pendingClear?.type === 'notice' && (
        <NoticeDialog title={pendingClear.title} message={pendingClear.message} onClose={onClearPending} />
      )}

      {/* UnlockDialog — shown after START COMPLETE is closed */}
      {pendingUnlockDialog && (
        <UnlockDialog onClose={() => setPendingUnlockDialog(false)} />
      )}
    </div>
  );
}
