import { useEffect, useRef, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import type { DeviceProfile } from '../data/deviceProfiles';
import { getImageUrl } from '../utils/images';
import { skills } from '../data/skills';
import { RankShortBadge } from '../components/RankShortBadge';
import { compressProfileImage } from '../utils/profileImage';

const validSkillIds = new Set<string>(skills.map((skill) => skill.id));

function formatBackupTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
}

function createBackupFilename(nickname: string, date: Date): string {
  const safeNickname = nickname
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[. ]+$/g, '');
  const timestamp = formatBackupTimestamp(date);
  return `${safeNickname ? `${safeNickname}-` : ''}bkup-${timestamp}.json`;
}

interface Profile {
  nickname: string;
  avatarUrl: string;
}

interface ProfileScreenProps {
  profile: Profile;
  profiles: DeviceProfile[];
  activeProfileId: string;
  clearedIds: string[];
  debugEnabled: boolean;
  onSave: (profile: Profile) => void;
  onAddProfile: () => void;
  onSwitchProfile: (profileId: string) => void;
  onDeleteProfile: () => void;
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
  | { kind: 'deleteConfirm' }
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

export function ProfileScreen({
  profile,
  profiles,
  activeProfileId,
  clearedIds,
  debugEnabled,
  onSave,
  onAddProfile,
  onSwitchProfile,
  onDeleteProfile,
  onBack,
  onResetTutorial,
  onImport,
}: ProfileScreenProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const imageRequestIdRef = useRef(0);

  const defaultAvatar = getImageUrl('default-user.webp');
  const staCleared = clearedIds.filter((id) => id.startsWith('static-')).length;
  const bouCleared = clearedIds.filter((id) => id.startsWith('bounce-')).length;

  useEffect(() => {
    imageRequestIdRef.current += 1;
    setNickname(profile.nickname);
    setAvatarUrl(profile.avatarUrl);
    setIsProcessingImage(false);
    setImageError('');
  }, [activeProfileId, profile.avatarUrl, profile.nickname]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const requestId = imageRequestIdRef.current + 1;
    imageRequestIdRef.current = requestId;
    setIsProcessingImage(true);
    setImageError('');

    try {
      const compressedDataUrl = await compressProfileImage(file);
      if (imageRequestIdRef.current !== requestId) return;
      setAvatarUrl(compressedDataUrl);
    } catch {
      if (imageRequestIdRef.current !== requestId) return;
      setImageError('画像を読み込めませんでした。JPEG・PNGなど別の画像をお試しください。');
    } finally {
      if (imageRequestIdRef.current === requestId) setIsProcessingImage(false);
    }
  };

  const handleSave = () => {
    onSave({ nickname, avatarUrl });
    setDialog({ kind: 'profileSaved' });
  };

  // ---- BACKUP ----

  const handleBackup = () => {
    const savedNickname = profile.nickname;
    const savedImage = profile.avatarUrl;
    const exportedAt = new Date();

    const payload = {
      app: 'SLACK STEPS',
      version: '1.0.0',
      exportedAt: exportedAt.toISOString(),
      data: { nickname: savedNickname, profileImage: savedImage, clearedSkills: clearedIds },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createBackupFilename(savedNickname, exportedAt);
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
    const deduped = Array.from(new Set(
      data.clearedSkills
        .filter((skillId): skillId is string => typeof skillId === 'string' && validSkillIds.has(skillId))
    ));
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

        {/* Device profiles */}
        <section className="profile-switcher px-6 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-jp font-bold text-sm text-text-primary">プロフィール切り替え</h2>
            <span className="font-jost text-xs text-text-secondary">{profiles.length} PROFILES</span>
          </div>
          <div className="profile-switcher-list flex gap-3 overflow-x-auto pb-2">
            {profiles.map((deviceProfile, index) => {
              const isActive = deviceProfile.id === activeProfileId;
              return (
                <button
                  key={deviceProfile.id}
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => onSwitchProfile(deviceProfile.id)}
                  className={`profile-switcher-item flex-shrink-0 w-28 rounded-2xl px-3 py-3 border-2 transition-colors ${
                    isActive ? 'border-black bg-white' : 'border-transparent bg-card'
                  }`}
                >
                  <span className="block w-12 h-12 mx-auto rounded-full bg-gray-200 overflow-hidden mb-2">
                    <img
                      src={deviceProfile.avatarUrl || defaultAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </span>
                  <span className="block font-jp font-bold text-xs text-text-primary truncate">
                    {deviceProfile.nickname || `プロフィール ${index + 1}`}
                  </span>
                  {isActive && (
                    <span className="block font-jost font-bold text-[10px] text-accent mt-1">SELECTED</span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onAddProfile}
              className="profile-switcher-add flex-shrink-0 w-28 rounded-2xl px-3 py-3 border-2 border-dashed border-gray-300 bg-transparent flex flex-col items-center justify-center gap-2 text-text-secondary"
            >
              <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Plus size={22} />
              </span>
              <span className="font-jp font-bold text-xs">追加する</span>
            </button>
          </div>
        </section>

        {/* Avatar */}
        <div className="profile-avatar-section flex flex-col items-center justify-center pt-6 pb-6">
          <div className="relative">
            <div
              className="profile-avatar-large relative w-36 h-36 rounded-full bg-gray-200 overflow-hidden"
              aria-busy={isProcessingImage}
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" className="profile-avatar-image w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
              {isProcessingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="font-jp text-xs font-bold text-white">処理中...</span>
                </div>
              )}
            </div>
            <button
              className={`profile-camera-button absolute bottom-1 right-1 w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-md ${isProcessingImage ? 'opacity-50' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
              aria-label="プロフィール画像を選択"
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
          {imageError && (
            <p className="profile-image-error max-w-xs mt-3 px-4 font-jp text-xs leading-relaxed text-red-500 text-center">
              {imageError}
            </p>
          )}
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
              <RankShortBadge rank="STA" />
              <span className="profile-progress-text font-jost text-sm text-text-primary">{staCleared}/10</span>
            </div>
            <div className="profile-progress-badge profile-progress-badge-bou flex items-center gap-2">
              <RankShortBadge rank="BOU" />
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
            disabled={isProcessingImage}
            className={`profile-save-button w-56 mx-auto block py-4 rounded-full bg-black text-white font-jp font-bold text-base mt-2 ${isProcessingImage ? 'opacity-30 cursor-not-allowed' : ''}`}
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
            ※現在選択中のプロフィールとクリア記録をJSONで保存・復元できます。
          </p>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            className="import-file-input hidden"
            onChange={handleImportFile}
          />
          {profiles.length > 1 && (
            <button
              type="button"
              onClick={() => setDialog({ kind: 'deleteConfirm' })}
              className="profile-delete-button w-full mt-6 py-3 font-jp text-xs text-red-500"
            >
              このプロフィールを削除する
            </button>
          )}
        </div>

        {/* Debug: tutorial reset */}
        {debugEnabled && onResetTutorial && (
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

      {dialog?.kind === 'deleteConfirm' && (
        <AppDialog
          className="profile-delete-dialog"
          title="削除しますか？"
          message="このプロフィールの名前・写真・クリア記録を端末から削除します。"
          cancelText="キャンセル"
          confirmText="削除する"
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            setDialog(null);
            onDeleteProfile();
          }}
        />
      )}

      {dialog?.kind === 'importConfirm' && (
        <AppDialog
          className="import-confirm-dialog"
          title="復元しますか？"
          message="現在選択中のプロフィールの名前・写真・クリア記録を上書きします。ほかのプロフィールには影響しません。"
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
