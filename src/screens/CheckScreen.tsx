import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getImageUrl } from '../utils/images';
import { getTechniquesByRank, startTechniques, staticTechniques, bounceTechniques } from '../data/techniques';
import { buildQrClearUrl, getQrCodeFromSkillId } from '../data/qrCodes';
import { Technique, Rank } from '../types/technique';
import type { PendingClear } from '../App';
import { TechniqueName } from '../components/TechniqueName';
import { verifyInstructorPin } from '../services/slackStepsApi';

const STORAGE_KEY_AUTH = 'slackStepsInstructorAuthorized';
const AUTH_DURATION_MS = 24 * 60 * 60 * 1000;

interface AuthRecord {
  authorized: boolean;
  expiresAt: number;
}

function readAuthRecord(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return false;
    const record: AuthRecord = JSON.parse(raw);
    if (record.authorized && record.expiresAt > Date.now()) return true;
    localStorage.removeItem(STORAGE_KEY_AUTH);
    return false;
  } catch {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    return false;
  }
}

function saveAuthRecord() {
  const record: AuthRecord = { authorized: true, expiresAt: Date.now() + AUTH_DURATION_MS };
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(record));
}

function clearAuthRecord() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

const ALL_BY_RANK: Record<Rank, Technique[]> = {
  Start: startTechniques,
  Static: staticTechniques,
  Bounce: bounceTechniques,
};

function isRankComplete(rank: Rank, clearedIds: string[]): boolean {
  return ALL_BY_RANK[rank].every((t) => clearedIds.includes(t.id));
}

interface CheckScreenProps {
  clearedIds: string[];
  debugEnabled: boolean;
  onClearSkills: (newIds: string[], pending: PendingClear) => void;
  onResetCleared: () => void;
}

// ---- shared header ----

function CheckHeader() {
  const thumbUrl = getImageUrl('instructor-thumb.webp');
  return (
    <div className="check-header-bar flex items-center px-4 py-4 bg-background border-b border-gray-200 gap-4">
      <div className="check-title flex items-center gap-2">
        <div className="check-header-icon w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {thumbUrl ? (
            <img src={thumbUrl} alt="instructor" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>
        <span className="check-header-title font-jost font-bold text-base text-text-primary tracking-widest">
          CHECK
        </span>
      </div>
    </div>
  );
}

// ---- approval QR modal ----

const RANK_BADGE_CLASS: Record<Rank, string> = {
  Start: 'approval-rank-badge-start bg-blue-400 text-primary',
  Static: 'approval-rank-badge-static bg-[#A9E8B1] text-primary',
  Bounce: 'approval-rank-badge-bounce bg-purple-400 text-primary',
};

const RANK_LABEL: Record<Rank, string> = {
  Start: 'START',
  Static: 'STATIC',
  Bounce: 'BOUNCE',
};

interface ApprovalQRModalProps {
  skill: Technique;
  clearedIds: string[];
  debugEnabled: boolean;
  onClose: () => void;
  onTestRead: (skill: Technique) => void;
}

function ApprovalQRModal({ skill, clearedIds, debugEnabled, onClose, onTestRead }: ApprovalQRModalProps) {
  const thumbUrl = getImageUrl(skill.thumbnail);
  const qrCode = getQrCodeFromSkillId(skill.id);
  const qrValue = qrCode
    ? buildQrClearUrl(`${window.location.origin}${import.meta.env.BASE_URL}`, qrCode)
    : '';
  const alreadyCleared = clearedIds.includes(skill.id);

  return (
    <div
      className="approval-qr-overlay fixed inset-0 z-[90] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="approval-qr-modal w-full max-w-md bg-white rounded-t-3xl animate-slide-up overflow-hidden"
        style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="approval-qr-modal-inner overflow-y-auto flex-1">
          <div className="approval-qr-modal-content flex flex-col items-center px-6 pt-8 pb-10 gap-4">

            <p className="approval-qr-title font-jp font-bold text-xl text-text-primary">承認QR</p>

            <span className={`approval-rank-badge font-jost font-bold text-xs tracking-wider px-4 py-1.5 rounded-full ${RANK_BADGE_CLASS[skill.rank]}`}>
              {RANK_LABEL[skill.rank]}
            </span>

            <div className="approval-skill-info flex items-center gap-3 w-full justify-center">
              <div className="approval-skill-thumb w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" className="approval-skill-thumb-image w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300" />
                )}
              </div>
              {skill.rank !== 'Start' && (
                <div className="approval-skill-grade flex items-end gap-1 flex-shrink-0">
                  <span className="approval-skill-grade-number font-jost font-bold text-sm text-text-primary leading-none whitespace-nowrap">
                    {skill.grade}
                  </span>
                </div>
              )}
              <TechniqueName
                name={skill.name}
                className="approval-skill-name font-jp text-base text-text-primary"
              />
            </div>

            <div className="approval-qr-image-wrap w-full flex justify-center py-2">
              {qrValue ? (
                <QRCodeSVG
                  value={qrValue}
                  size={224}
                  level="M"
                  marginSize={2}
                  className="approval-qr-image w-56 h-56"
                  title={`${skill.grade ? `${skill.grade} ` : ''}${skill.name} QR`}
                />
              ) : (
                <div className="approval-qr-placeholder w-56 h-56 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <span className="font-jp text-sm text-text-secondary">QR準備中</span>
                </div>
              )}
            </div>

            {/* Debug-only test read button */}
            {debugEnabled && (
              <button
                className="approval-qr-test-button font-jost font-bold text-sm tracking-widest px-8 py-2.5 rounded-full bg-accent text-white w-full"
                onClick={() => onTestRead(skill)}
                disabled={alreadyCleared}
              >
                {alreadyCleared ? 'クリア済み' : '読み取りテスト'}
              </button>
            )}

            <div className="approval-qr-actions w-full flex justify-center pt-1">
              <button
                className="approval-qr-close-button font-jost font-bold text-sm tracking-widest px-12 py-3 rounded-full border-2 border-black bg-white text-text-primary"
                onClick={onClose}
              >
                CLOSE
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ---- check list ----

const RANK_TABS: { rank: Rank; label: string }[] = [
  { rank: 'Start', label: 'START' },
  { rank: 'Static', label: 'STATIC' },
  { rank: 'Bounce', label: 'BOUNCE' },
];

function SkillThumb({ filename }: { filename: string }) {
  const url = getImageUrl(filename);
  return (
    <div className="check-skill-thumb w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
      {url ? (
        <img src={url} alt="" className="check-skill-thumb-image w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-300" />
      )}
    </div>
  );
}

function SkillItem({ skill, onTap }: { skill: Technique; onTap: (s: Technique) => void }) {
  return (
    <button
      className="check-skill-item w-full bg-card rounded-2xl px-2 py-2 flex items-center gap-4 text-left active:opacity-70 transition-opacity"
      onClick={() => onTap(skill)}
    >
      <SkillThumb filename={skill.thumbnail} />
      {skill.rank !== 'Start' && (
        <div className="check-skill-grade flex items-end gap-1 flex-shrink-0">
          <span className="check-skill-grade-number font-jost font-bold text-sm text-text-primary leading-none whitespace-nowrap">
            {skill.grade}
          </span>
        </div>
      )}
      <TechniqueName
        name={skill.name}
        className="check-skill-name font-jp font-bold text-base text-text-primary"
      />
    </button>
  );
}

interface CheckListProps {
  clearedIds: string[];
  debugEnabled: boolean;
  onClearSkills: (newIds: string[], pending: PendingClear) => void;
  onResetAuth: () => void;
  onResetCleared: () => void;
}

function CheckList({ clearedIds, debugEnabled, onClearSkills, onResetAuth, onResetCleared }: CheckListProps) {
  const [activeRank, setActiveRank] = useState<Rank>('Static');
  const [selectedApprovalSkill, setSelectedApprovalSkill] = useState<Technique | null>(null);
  const skills = getTechniquesByRank(activeRank);

  const handleSkillTap = (skill: Technique) => setSelectedApprovalSkill(skill);
  const handleModalClose = () => setSelectedApprovalSkill(null);

  const handleTestRead = (skill: Technique) => {
    const nextCleared = Array.from(new Set([...clearedIds, skill.id]));
    const isComplete = isRankComplete(skill.rank, nextCleared);
    const pending: PendingClear = isComplete
      ? { type: 'complete', rank: skill.rank }
      : { type: 'nice', rank: skill.rank };
    onClearSkills([skill.id], pending);
  };

  const handleDebugCompleteRank = () => {
    const allIds = ALL_BY_RANK[activeRank].map((t) => t.id);
    const pending: PendingClear = { type: 'complete', rank: activeRank };
    onClearSkills(allIds, pending);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Rank tabs */}
      <div className="check-rank-tabs flex border-b border-gray-200 bg-background">
        {RANK_TABS.map(({ rank, label }) => {
          const isActive = activeRank === rank;
          return (
            <button
              key={rank}
              className={`check-rank-tab relative text-base flex-1 py-3 font-jost font-bold tracking-wider transition-colors ${
                isActive ? 'check-rank-tab-active text-text-primary' : 'text-text-secondary'
              }`}
              onClick={() => setActiveRank(rank)}
            >
              {label}
              <span
                className={`check-rank-tab-line text-base absolute bottom-0 left-0 right-0 h-0.5 transition-opacity ${
                  isActive ? 'check-rank-tab-line-active bg-black opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Skill list */}
      <div className="check-skill-list flex-1 overflow-y-auto px-4 py-4 pb-32">
        {skills.length === 0 ? (
          <p className="check-empty-state font-jp text-text-secondary text-sm text-center py-10">
            このランクの承認リストは準備中です
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {skills.map((skill) => (
              <SkillItem key={skill.id} skill={skill} onTap={handleSkillTap} />
            ))}
          </div>
        )}

        {debugEnabled && (
          <div className="text-center mt-8 flex flex-col gap-3 items-center">
            <button
              className="debug-complete-rank-button font-jp text-xs text-blue-500 underline"
              onClick={handleDebugCompleteRank}
            >
              このランクを全クリアにする
            </button>
            <button
              className="clear-state-reset-button font-jp text-xs text-text-secondary underline"
              onClick={onResetCleared}
            >
              クリア状態をリセット
            </button>
          </div>
        )}
        <div className="text-center mt-6">
          <button
            className="check-auth-reset-button font-jp text-xs text-text-secondary underline"
            onClick={onResetAuth}
          >
            認証をリセット
          </button>
        </div>
      </div>

      {/* Approval QR modal */}
      {selectedApprovalSkill && (
        <ApprovalQRModal
          skill={selectedApprovalSkill}
          clearedIds={clearedIds}
          debugEnabled={debugEnabled}
          onClose={handleModalClose}
          onTestRead={handleTestRead}
        />
      )}
    </div>
  );
}

// ---- main export ----

export function CheckScreen({ clearedIds, debugEnabled, onClearSkills, onResetCleared }: CheckScreenProps) {
  const [isAuthorized, setIsAuthorized] = useState(() => readAuthRecord());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mainUrl = getImageUrl('instructor-main.webp');
  const focusInput = () => inputRef.current?.focus();

  const handleResetAuth = () => {
    clearAuthRecord();
    setIsAuthorized(false);
  };

  if (isAuthorized) {
    return (
      <div className="check-page flex flex-col min-h-screen bg-background">
        <CheckHeader />
        <CheckList
          clearedIds={clearedIds}
          debugEnabled={debugEnabled}
          onClearSkills={onClearSkills}
          onResetAuth={handleResetAuth}
          onResetCleared={onResetCleared}
        />
      </div>
    );
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    setError('');
  };

  const handleEnter = async () => {
    if (pin.length !== 4 || isAuthenticating) return;
    setIsAuthenticating(true);
    setError('');

    try {
      const authorized = await verifyInstructorPin(pin);
      if (authorized) {
        saveAuthRecord();
        setIsAuthorized(true);
        setError('');
      } else {
        setError('パスワードが違います');
        setPin('');
      }
    } catch {
      setError('通信できませんでした。時間をおいて再度お試しください');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="check-page flex flex-col min-h-screen bg-background">
      <CheckHeader />

      <div className="flex-1 overflow-y-auto pb-12">
        <div className="check-hero flex justify-center pt-10 pb-4">
          {mainUrl ? (
            <img src={mainUrl} alt="Instructor Mode" className="check-hero-image w-full max-w-xs object-contain" />
          ) : (
            <div className="w-full max-w-xs aspect-square bg-gray-100 rounded-2xl" />
          )}
        </div>

        <div className="check-auth-section px-6">
          <p className="check-auth-title font-jp font-bold text-sm text-text-primary mb-2">PASS CODE</p>

          <div className="check-pin-boxes flex gap-3 mb-2 cursor-text" onClick={focusInput}>
            {[0, 1, 2, 3].map((i) => {
              const isFilled = Boolean(pin[i]);
              const isActive = isFocused && (pin.length === i || (pin.length === 4 && i === 3));
              return (
                <div
                  key={i}
                  className={[
                    'check-pin-box flex-1 adj-password-input bg-card rounded-2xl flex items-center justify-center transition-all',
                    isFilled ? 'check-pin-box-filled shadow-md' : 'shadow-sm',
                    isActive ? 'check-pin-box-active ring-2 ring-accent bg-white' : '',
                  ].join(' ')}
                  onClick={focusInput}
                >
                  <span className="font-jost font-bold text-3xl text-text-primary">{pin[i] ?? ''}</span>
                </div>
              );
            })}
          </div>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={handlePinChange}
            disabled={isAuthenticating}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="check-pin-input-hidden sr-only"
            aria-label="4桁のPIN"
          />

          {error && (
            <p className="check-pin-error font-jp text-sm text-red-500 text-center mb-4">{error}</p>
          )}

          <button
            onClick={handleEnter}
            disabled={pin.length !== 4 || isAuthenticating}
            className={`check-enter-button w-56 mx-auto block py-4 rounded-full font-jost font-bold text-sm tracking-widest mt-8 transition-opacity ${
              pin.length === 4 && !isAuthenticating
                ? 'bg-black text-white'
                : 'check-enter-button-disabled bg-black text-white opacity-30 cursor-not-allowed'
            }`}
          >
            {isAuthenticating ? 'CHECKING...' : 'ENTER'}
          </button>
        </div>
      </div>
    </div>
  );
}
