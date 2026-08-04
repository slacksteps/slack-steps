import { useState, useEffect } from 'react';
import { StaticPageHeader } from './GuideScreen';
import { RankShortBadge } from '../components/RankShortBadge';
import { GAS_WEB_APP_URL } from '../services/slackStepsApi';

const CLEARED_USERS_JSON_URL = `${GAS_WEB_APP_URL}?action=cleared-users`;
const CLEARED_USERS_CACHE_KEY = 'slackStepsClearedUsersCache';

interface ClearedUsersScreenProps {
  onBack: () => void;
}

type Rank = 'STATIC' | 'BOUNCE';
type FilterTab = 'ALL' | Rank;

interface ClearedUser {
  name: string;
  date: string;
  school: string;
  rank: Rank;
}

interface ClearedUsersCache {
  version: 1;
  fetchedAt: number;
  users: ClearedUser[];
}

const fallbackClearedUsers: ClearedUser[] = [
  { name: 'Ra1mu',    date: '2026.07', school: '西東京スラックライン', rank: 'STATIC' },
  { name: 'Kosayork', date: '2026.07', school: '西東京スラックライン', rank: 'BOUNCE' },
  { name: 'Soketou',  date: '2026.07', school: '横浜スラックライン',   rank: 'STATIC' },
  { name: 'Takayama', date: '2026.06', school: '横浜スラックライン',   rank: 'BOUNCE' },
  { name: 'Higashi',  date: '2026.06', school: '埼玉スラックライン',   rank: 'STATIC' },
  { name: 'Yamato',   date: '2026.06', school: '埼玉スラックライン',   rank: 'BOUNCE' },
  { name: 'TNT',      date: '2026.05', school: '東京スラックライン',   rank: 'STATIC' },
  { name: 'Sugi',     date: '2026.05', school: '東京スラックライン',   rank: 'BOUNCE' },
  { name: 'Shibuya',  date: '2026.04', school: '渋谷スラックライン',   rank: 'STATIC' },
  { name: 'Chiy',     date: '2026.04', school: '秋葉原スラックライン', rank: 'BOUNCE' },
  { name: 'Kichi',    date: '2026.03', school: '吉祥寺スラックライン', rank: 'STATIC' },
  { name: 'Mitaka',   date: '2026.03', school: '三鷹スラックライン',   rank: 'BOUNCE' },
  { name: 'Tachik',   date: '2026.02', school: '立川スラックライン',   rank: 'STATIC' },
  { name: 'Hachi',    date: '2026.02', school: '八王子スラックライン', rank: 'BOUNCE' },
  { name: 'Fussa',    date: '2026.01', school: '福生スラックライン',   rank: 'STATIC' },
  { name: 'Hamura',   date: '2026.01', school: '羽村スラックライン',   rank: 'BOUNCE' },
];

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'ALL',      label: 'ALL' },
  { key: 'STATIC', label: 'STATIC' },
  { key: 'BOUNCE', label: 'BOUNCE' },
];

function normalizeRank(raw: unknown): Rank | null {
  if (typeof raw !== 'string') return null;
  const upper = raw.trim().toUpperCase();
  if (upper === 'STATIC' || upper === 'BEGINNER') return 'STATIC';
  if (upper === 'BOUNCE' || upper === 'ADVANCED') return 'BOUNCE';
  return null;
}

function parseUsers(data: unknown): ClearedUser[] {
  if (!Array.isArray(data)) return [];
  const result: ClearedUser[] = [];
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue;
    const obj = item as Record<string, unknown>;
    const rank = normalizeRank(obj.rank);
    if (!rank) continue;
    result.push({
      name:   typeof obj.name   === 'string' ? obj.name   : '',
      date:   typeof obj.date   === 'string' ? obj.date   : '',
      school: typeof obj.school === 'string' ? obj.school : '',
      rank,
    });
  }
  return result;
}

function readCachedClearedUsers(): ClearedUser[] | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CLEARED_USERS_CACHE_KEY) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null) return null;
    const cache = parsed as Partial<ClearedUsersCache>;
    if (cache.version !== 1 || !Array.isArray(cache.users)) return null;
    return parseUsers(cache.users);
  } catch {
    return null;
  }
}

function saveCachedClearedUsers(users: ClearedUser[]): void {
  const cache: ClearedUsersCache = {
    version: 1,
    fetchedAt: Date.now(),
    users,
  };
  try {
    localStorage.setItem(CLEARED_USERS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // The latest data can still be displayed if local storage is unavailable.
  }
}

export function ClearedUsersScreen({ onBack }: ClearedUsersScreenProps) {
  const [initialCachedUsers] = useState(readCachedClearedUsers);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [clearedUsersData, setClearedUsersData] = useState<ClearedUser[]>(
    () => initialCachedUsers ?? fallbackClearedUsers
  );
  const [clearedUsersLoading, setClearedUsersLoading] = useState(initialCachedUsers === null);
  const [clearedUsersError, setClearedUsersError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setClearedUsersLoading(initialCachedUsers === null);
    setClearedUsersError(false);

    const url = new URL(CLEARED_USERS_JSON_URL);
    url.searchParams.set('_', String(Date.now()));

    fetch(url, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        if (cancelled) return;
        if (!Array.isArray(json)) throw new Error('Invalid cleared users response');
        const parsed = parseUsers(json);
        saveCachedClearedUsers(parsed);
        setClearedUsersData(parsed);
        setClearedUsersLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        if (initialCachedUsers === null) setClearedUsersData(fallbackClearedUsers);
        setClearedUsersError(true);
        setClearedUsersLoading(false);
      });

    return () => { cancelled = true; };
  }, [initialCachedUsers]);

  const filtered = activeFilter === 'ALL'
    ? clearedUsersData
    : clearedUsersData.filter((u) => u.rank === activeFilter);

  return (
    <div className="static-page cleared-users-page flex flex-col min-h-screen bg-background">
      <StaticPageHeader title="クリア者一覧" onBack={onBack} />

      <div className="cleared-users-content flex-1 overflow-y-auto px-6 py-6 pb-16">
        {/* Filter tabs */}
        <div className="cleared-filter-tabs flex items-center gap-4 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`cleared-filter-button font-jost font-bold text-sm tracking-wider px-4 py-1.5 rounded-full transition-colors ${
                activeFilter === tab.key
                  ? 'cleared-filter-button-active bg-text-primary text-white'
                  : 'text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {clearedUsersLoading ? (
          <p className="py-10 text-center font-jp text-sm text-text-secondary">読み込み中...</p>
        ) : (
          <>
            {/* Table */}
            <div className="cleared-users-table w-full">
              {/* Header */}
              <div className="cleared-users-header grid grid-cols-[2fr_1.5fr_2.5fr_auto] gap-x-2 pb-2 border-b-2 border-text-primary">
                <span className="cleared-users-header-cell font-jost font-bold text-xs text-text-primary tracking-wider">NAME</span>
                <span className="cleared-users-header-cell font-jost font-bold text-xs text-text-primary tracking-wider">DATE</span>
                <span className="cleared-users-header-cell font-jost font-bold text-xs text-text-primary tracking-wider">SCHOOL</span>
                <span className="cleared-users-header-cell sr-only">RANK</span>
              </div>

              {/* Rows */}
              <ul className="cleared-users-list">
                {filtered.length === 0 ? (
                  <li className="cleared-users-empty py-10 text-center font-jp text-sm text-text-secondary">
                    該当するクリア者はまだいません
                  </li>
                ) : (
                  filtered.map((user, i) => (
                    <li
                      key={i}
                      className="cleared-user-row grid grid-cols-[2fr_1.5fr_2.5fr_auto] gap-x-2 items-center py-3.5 border-b border-gray-200"
                    >
                      <span className="cleared-user-name font-jost text-sm text-text-primary">{user.name}</span>
                      <span className="cleared-user-date font-jost text-sm text-text-primary">{user.date}</span>
                      <span className="cleared-user-school font-jp text-sm text-text-primary">{user.school}</span>
                      <RankShortBadge
                        rank={user.rank === 'STATIC' ? 'STA' : 'BOU'}
                        className={user.rank === 'STATIC' ? 'cleared-user-rank-sta' : 'cleared-user-rank-bou'}
                      />
                    </li>
                  ))
                )}
              </ul>
            </div>

            {clearedUsersError && (
              <p className="mt-6 text-center font-jp text-xs text-text-secondary">
                {initialCachedUsers === null
                  ? '公開データを取得できなかったため、サンプルデータを表示しています'
                  : '最新データを取得できなかったため、前回のデータを表示しています'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
