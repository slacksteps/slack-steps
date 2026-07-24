import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { staticTechniques, bounceTechniques } from '../data/techniques';
import { getImageUrl } from '../utils/images';
import { SHOW_DEBUG_CONTROLS } from '../config/debug';
import { skills } from '../data/skills';

const STORAGE_KEY_NICKNAME = 'slackStepsNickname';
const STORAGE_KEY_IMAGE = 'slackStepsProfileImage';
const STORAGE_KEY_CLEARED = 'slackStepsClearedSkills';
const validSkillIds = new Set<string>(skills.map((skill) => skill.id));

interface Profile {
  nickname: string;
  avatarUrl: string;
}

interface ProfileScreenProps {
  profile: Profile;
  onSave: (profile: Profile) => void;
  onBack: () => void;
  onResetTutorial?: () => void;
  onImport: (profile: Profile, clearedIds: string[]) => void;
}

// ---- dialog types ----

interface ParsedBackup {
  nickname: string;
  profileImage: string;
  clearedSkills: string[];
}

type DialogState =
  | { kind: 'profileSaved' }
  | { kind: 'backupComplete' }
  | { kind: 'importConfirm'; data: ParsedBackup }
  | { kind: 'importComplete' }
  | { kind: 'importError'; message: string };

// ---- AppDialog ----

interface AppDialogProps {
  className?: string;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

function AppDialog({ className = '', title, message, confirmText, cancelText, onConfirm, onCancel }: AppDialogProps) {
  return (
    <div
      className="app-dialog-overlay fixed inset-0 z-[80] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className={`app-dialog ${className} animate-dialog-in bg-white rounded-3xl px-8 py-10 flex flex-col items-center gap-4 shadow-xl mx-6 w-full max-w-xs`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="app-dialog-title font-jost font-bold text-xl text-text-primary tracking-wider text-center">
          {title}
        </p>
        <p className="app-dialog-message font-jp text-sm text-text-primary text-center leading-relaxed">
          {message}
        </p>
        <div className={`app-dialog-actions flex gap-3 mt-2 ${cancelText ? 'w-full' : ''}`}>
          {cancelText && onCancel && (
            <button
              className="app-dialog-button app-dialog-button-secondary flex-1 font-jost font-bold text-sm tracking-widest py-3.5 rounded-full border-2 border-black text-text-primary"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`app-dialog-button app-dialog-button-primary font-jost font-bold text-sm tracking-widest py-3.5 rounded-full bg-black text-white ${cancelText ? 'flex-1' : 'px-12'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- ProfileScreen ----

export function ProfileScreen({ profile, onSave, onBack, onResetTutorial, onImport }: ProfileScreenProps) {
  const [nickname, setNickname] = useState(
    () => localStorage.getItem(STORAGE_KEY_NICKNAME) ?? profile.nickname
  );
  const [avatarUrl, setAvatarUrl] = useState(
    () => localStorage.getItem(STORAGE_KEY_IMAGE) ?? profile.avatarUrl
  );
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const defaultAvatar = getImageUrl('default-user.webp');
  const staCleared = staticTechniques.filter((t) => t.cleared).length;
  const bouCleared = bounceTechniques.filter((t) => t.cleared).length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_NICKNAME, nickname);
    if (avatarUrl) localStorage.setItem(STORAGE_KEY_IMAGE, avatarUrl);
    onSave({ nickname, avatarUrl });
    setDialog({ kind: 'profileSaved' });
  };

  // ---- BACKUP ----

  const handleBackup = () => {
    const savedNickname = localStorage.getItem(STORAGE_KEY_NICKNAME) ?? '';
    const savedImage = localStorage.getItem(STORAGE_KEY_IMAGE) ?? '';
    let clearedSkills: string[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CLEARED);
      if (raw) clearedSkills = JSON.parse(raw) as string[];
    } catch { /* keep empty */ }

    const payload = {
      app: 'SLACK STEPS',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: { nickname: savedNickname, profileImage: savedImage, clearedSkills },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `slack-steps-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    setDialog({ kind: 'backupComplete' });
  };

  // ---- IMPORT ----

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => setDialog({ kind: 'importError', message: 'バックアップファイルの形式が正しくありません' });
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (
          json.app !== 'SLACK STEPS' ||
          !json.data ||
          !Array.isArray(json.data.clearedSkills)
        ) {
          setDialog({ kind: 'importError', message: 'バックアップファイルの形式が正しくありません' });
          return;
        }
        setDialog({
          kind: 'importConfirm',
          data: {
            nickname: typeof json.data.nickname === 'string' ? json.data.nickname : '',
            profileImage: typeof json.data.profileImage === 'string' ? json.data.profileImage : '',
            clearedSkills: json.data.clearedSkills as string[],
          },
        });
      } catch {
        setDialog({ kind: 'importError', message: 'バックアップファイルの形式が正しくありません' });
      }
    };
    reader.readAsText(file);
  };

  const executeImport = (data: ParsedBackup) => {
    localStorage.setItem(STORAGE_KEY_NICKNAME, data.nickname);
    if (data.profileImage) {
      localStorage.setItem(STORAGE_KEY_IMAGE, data.profileImage);
    } else {
      localStorage.removeItem(STORAGE_KEY_IMAGE);
    }
    const deduped = Array.from(new Set(
      data.clearedSkills
        .filter((skillId): skillId is string => typeof skillId === 'string' && validSkillIds.has(skillId))
    ));
    localStorage.setItem(STORAGE_KEY_CLEARED, JSON.stringify(deduped));

    setNickname(data.nickname);
    setAvatarUrl(data.profileImage);
    onImport({ nickname: data.nickname, avatarUrl: data.profileImage }, deduped);
    setDialog({ kind: 'importComplete' });
  };

  const displayAvatar = avatarUrl || defaultAvatar;

  return (
    <div className="profile-page flex flex-col min-h-screen bg-background">

      {/* Header bar */}
      <div className="profile-header-bar flex items-center justify-between px-4 py-4 bg-background border-b border-gray-200">
        <div className="w-10" aria-hidden="true" />
        <span className="profile-title font-jost font-bold text-base text-text-primary tracking-widest">
          PROFILE
        </span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-28">

        {/* Avatar */}
        <div className="profile-avatar-section flex justify-center pt-8 pb-6">
          <div className="relative">
            <div className="profile-avatar-large w-36 h-36 rounded-full bg-gray-200 overflow-hidden">
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" className="profile-avatar-image w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
            <button
              className="profile-camera-button absolute bottom-1 right-1 w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={20} className="profile-camera-icon text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-file-input hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Form */}
        <div className="profile-form px-6">

          {/* Nickname */}
          <div className="profile-field mb-4">
            <label className="profile-label block font-jp text-sm text-text-primary mb-2">
              ニックネーム
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="SLACKER"
              className="profile-input w-full bg-card rounded-2xl px-4 py-3.5 text-text-primary placeholder:text-text-secondary/40 border border-gray-100 focus:border-accent focus:outline-none font-jp"
            />
          </div>

          {/* Progress row */}
          <div className="profile-progress-row flex items-center justify-center gap-5 py-3">
            <div className="profile-progress-badge profile-progress-badge-sta flex items-center gap-2">
              <span className="bg-green-400 text-black font-jost font-bold text-xs px-2.5 py-1 rounded-full">STA</span>
              <span className="profile-progress-text font-jost text-sm text-text-primary">{staCleared}/10</span>
            </div>
            <div className="profile-progress-badge profile-progress-badge-bou flex items-center gap-2">
              <span className="bg-purple-400 text-black font-jost font-bold text-xs px-2.5 py-1 rounded-full">BOU</span>
              <span className="profile-progress-text font-jost text-sm text-text-primary">{bouCleared}/10</span>
            </div>
          </div>

          {/* Local note */}
          <p className="profile-local-note font-jp text-xs text-text-secondary leading-relaxed py-3">
            ※入力された名前や写真は、あなたのスマホ内（ローカル）にのみ安全に保存され、外部に送信されることはありません
          </p>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="profile-save-button w-56 mx-auto block py-4 rounded-full bg-black text-white font-jp font-bold text-base mt-2"
          >
            保存する
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8" />

        {/* Backup / Import */}
        <div className="profile-backup-section px-6">
          <div className="profile-backup-card bg-card rounded-2xl overflow-hidden flex card-shadow">
            <button
              className="profile-backup-button flex-1 py-4 font-jost font-bold text-sm text-text-primary"
              onClick={handleBackup}
            >
              BACKUP
            </button>
            <div className="profile-backup-divider w-px bg-gray-200 self-stretch" />
            <button
              className="profile-import-button flex-1 py-4 font-jost font-bold text-sm text-text-primary"
              onClick={handleImportClick}
            >
              IMPORT
            </button>
          </div>
          <p className="profile-backup-note font-jp text-xs text-text-secondary mt-3">
            ※記録と設定をJSONで保存・復元できます。
          </p>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            className="import-file-input hidden"
            onChange={handleImportFile}
          />
        </div>

        {/* Debug: tutorial reset */}
        {SHOW_DEBUG_CONTROLS && onResetTutorial && (
          <div className="px-6 mt-6">
            <button
              onClick={onResetTutorial}
              className="tutorial-reset-button w-full py-3 rounded-full border border-gray-300 font-jp text-sm text-text-secondary bg-card"
            >
              チュートリアルを再表示
            </button>
          </div>
        )}

      </div>

      {/* ---- Dialogs ---- */}

      {dialog?.kind === 'profileSaved' && (
        <AppDialog
          className="profile-save-dialog"
          title="保存しました"
          message="プロフィールを保存しました"
          confirmText="OK"
          onConfirm={() => { setDialog(null); onBack(); }}
        />
      )}

      {dialog?.kind === 'backupComplete' && (
        <AppDialog
          className="backup-complete-dialog"
          title="バックアップしました"
          message="記録をJSONファイルで保存しました"
          confirmText="OK"
          onConfirm={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'importConfirm' && (
        <AppDialog
          className="import-confirm-dialog"
          title="復元しますか？"
          message="現在の記録を上書きして復元します。"
          cancelText="キャンセル"
          confirmText="復元する"
          onCancel={() => setDialog(null)}
          onConfirm={() => executeImport((dialog as { kind: 'importConfirm'; data: ParsedBackup }).data)}
        />
      )}

      {dialog?.kind === 'importComplete' && (
        <AppDialog
          className="import-complete-dialog"
          title="復元しました"
          message="バックアップデータを復元しました"
          confirmText="OK"
          onConfirm={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'importError' && (
        <AppDialog
          className="import-error-dialog"
          title="復元できませんでした"
          message={(dialog as { kind: 'importError'; message: string }).message}
          confirmText="OK"
          onConfirm={() => setDialog(null)}
        />
      )}

    </div>
  );
}
