export interface DeviceProfile {
  id: string;
  nickname: string;
  avatarUrl: string;
  clearedSkillIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceProfilesState {
  version: 1;
  activeProfileId: string;
  profiles: DeviceProfile[];
}

export const DEVICE_PROFILES_STORAGE_KEY = 'slackStepsProfiles';

const LEGACY_NICKNAME_KEY = 'slackStepsNickname';
const LEGACY_IMAGE_KEY = 'slackStepsProfileImage';
const LEGACY_CLEARED_KEY = 'slackStepsClearedSkills';
const CLEARED_SCHEMA_KEY = 'slackStepsClearedSkillsSchema';
const CURRENT_CLEARED_SCHEMA = 'static-bounce-v1';

function createProfileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readLegacyClearedIds(): string[] {
  if (localStorage.getItem(CLEARED_SCHEMA_KEY) !== CURRENT_CLEARED_SCHEMA) {
    localStorage.setItem(CLEARED_SCHEMA_KEY, CURRENT_CLEARED_SCHEMA);
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LEGACY_CLEARED_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function isDeviceProfile(value: unknown): value is DeviceProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<DeviceProfile>;
  return (
    typeof profile.id === 'string' &&
    typeof profile.nickname === 'string' &&
    typeof profile.avatarUrl === 'string' &&
    Array.isArray(profile.clearedSkillIds) &&
    profile.clearedSkillIds.every((id) => typeof id === 'string') &&
    typeof profile.createdAt === 'string' &&
    typeof profile.updatedAt === 'string'
  );
}

function createEmptyProfile(): DeviceProfile {
  const now = new Date().toISOString();
  return {
    id: createProfileId(),
    nickname: '',
    avatarUrl: '',
    clearedSkillIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createMigratedProfile(): DeviceProfile {
  return {
    ...createEmptyProfile(),
    nickname: localStorage.getItem(LEGACY_NICKNAME_KEY) ?? '',
    avatarUrl: localStorage.getItem(LEGACY_IMAGE_KEY) ?? '',
    clearedSkillIds: readLegacyClearedIds(),
  };
}

export function saveDeviceProfilesState(state: DeviceProfilesState): void {
  localStorage.setItem(DEVICE_PROFILES_STORAGE_KEY, JSON.stringify(state));
}

export function loadDeviceProfilesState(): DeviceProfilesState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DEVICE_PROFILES_STORAGE_KEY) ?? 'null');
    if (parsed && typeof parsed === 'object') {
      const candidate = parsed as Partial<DeviceProfilesState>;
      const profiles = Array.isArray(candidate.profiles)
        ? candidate.profiles.filter(isDeviceProfile)
        : [];
      if (profiles.length > 0) {
        const activeProfileId = profiles.some((profile) => profile.id === candidate.activeProfileId)
          ? candidate.activeProfileId as string
          : profiles[0].id;
        const state: DeviceProfilesState = { version: 1, activeProfileId, profiles };
        saveDeviceProfilesState(state);
        return state;
      }
    }
  } catch {
    // Invalid profile storage is replaced by a migrated profile below.
  }

  const profile = createMigratedProfile();
  const state: DeviceProfilesState = {
    version: 1,
    activeProfileId: profile.id,
    profiles: [profile],
  };
  saveDeviceProfilesState(state);
  return state;
}

export function getActiveDeviceProfile(state: DeviceProfilesState): DeviceProfile {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profiles[0];
}

export function updateDeviceProfile(
  state: DeviceProfilesState,
  profileId: string,
  updates: Partial<Pick<DeviceProfile, 'nickname' | 'avatarUrl' | 'clearedSkillIds'>>
): DeviceProfilesState {
  const now = new Date().toISOString();
  const nextState = {
    ...state,
    profiles: state.profiles.map((profile) =>
      profile.id === profileId ? { ...profile, ...updates, updatedAt: now } : profile
    ),
  };
  saveDeviceProfilesState(nextState);
  return nextState;
}

export function addDeviceProfile(state: DeviceProfilesState): DeviceProfilesState {
  const profile = createEmptyProfile();
  const nextState = {
    ...state,
    activeProfileId: profile.id,
    profiles: [...state.profiles, profile],
  };
  saveDeviceProfilesState(nextState);
  return nextState;
}

export function activateDeviceProfile(
  state: DeviceProfilesState,
  profileId: string
): DeviceProfilesState {
  if (!state.profiles.some((profile) => profile.id === profileId)) return state;
  const nextState = { ...state, activeProfileId: profileId };
  saveDeviceProfilesState(nextState);
  return nextState;
}

export function removeDeviceProfile(
  state: DeviceProfilesState,
  profileId: string
): DeviceProfilesState {
  if (state.profiles.length <= 1) return state;
  const profiles = state.profiles.filter((profile) => profile.id !== profileId);
  if (profiles.length === state.profiles.length) return state;

  const nextState = {
    ...state,
    activeProfileId: state.activeProfileId === profileId ? profiles[0].id : state.activeProfileId,
    profiles,
  };
  saveDeviceProfilesState(nextState);
  return nextState;
}
