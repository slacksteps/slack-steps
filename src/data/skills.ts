export type SkillRank = 'START' | 'STATIC' | 'BOUNCE';

export type Skill = {
  id: string;
  rank: SkillRank;
  grade: string;
  name: string;
  description: string;
  point: string;
  youtubeId?: string;
  thumbnail: string;
  qrCode: string;
};

const BOUNCE_SKILL_NAMES = [
  'フィート→バット→フィート',
  'フィート→チェスト→フィート',
  'フィート→バット180→バット→フィート',
  'フィート→バット→レディ→スプレドル→バット→フィート',
  'フィート→バット180→バット逆スピン180→バット180→チェスト→バット→フィート',
  'フィート→バット→チェスト→モジョ→バット→フィート',
  'フィート→バット180→フィート',
  'フィート→バット180→クルック',
  'フィート→バックバウンス→フィート',
  'フィート→バット→ナスティチェスト→バット→フィート',
] as const;

const BOUNCE_YOUTUBE_IDS = [
  'hb-VRSV6kMg',
  'L7muyITglZ0',
  'VM2PWOyjZlk',
  'IDZ5jQdYY6Q',
  '8-UXp2Cptao',
  '-5ogs0BOP6U',
  'nNw7FaaGq7M',
  'xyTA9eL0Gnk',
  'BnJ4JsX1k60',
  'Kq9YVo4pFUA',
] as const;

export const skills = [
  {
    id: 'start-4',
    rank: 'START',
    grade: '',
    name: '基本姿勢(両足)10秒',
    description: '片足で20秒間バランスを保つ',
    point: '目線をまっすぐ前に向け、両手を広げてリラックスしましょう',
    youtubeId: 'QLrjCAhxs1k',
    thumbnail: 'start-thumb_01.webp',
    qrCode: 'Q8mK4zV2nP7x',
  },
  {
    id: 'start-3',
    rank: 'START',
    grade: '',
    name: 'リカバリー(右足)10秒',
    description: '利き足ではない方の足で20秒間バランスを保つ',
    point: '苦手な足でも焦らず、体の中心を意識しましょう',
    youtubeId: 'G_3PFqnBOwc',
    thumbnail: 'start-thumb_02.webp',
    qrCode: 'W3rT9bL6sH2a',
  },
  {
    id: 'start-2',
    rank: 'START',
    grade: '',
    name: 'リカバリー(左足)10秒',
    description: 'スラックラインの上を歩く',
    point: '足元を見すぎず、進行方向を見るようにしましょう',
    youtubeId: 'qOxYjLTO_Hw',
    thumbnail: 'start-thumb_03.webp',
    qrCode: 'N6pX2cQ8vM5d',
  },
  {
    id: 'start-1',
    rank: 'START',
    grade: '',
    name: '逆スタンス(両足)10秒',
    description: '両足で20秒間バランスを保つ',
    point: '膝を軽く曲げて、体の軸を安定させましょう',
    youtubeId: 'a_4bGhtcIa4',
    thumbnail: 'start-thumb_04.webp',
    qrCode: 'A9sD4fG7hJ1k',
  },
  {
    id: 'static-10',
    rank: 'STATIC',
    grade: 'STEP01',
    name: 'ウォーク',
    description: 'スタティックランクの技10の説明文',
    point: 'スタティック技10のポイントとコツです',
    youtubeId: 'byZq1PmwXRc',
    thumbnail: 'static-thumb_01.webp',
    qrCode: 'B7xQ3mN9vL2p',
  },
  {
    id: 'static-9',
    rank: 'STATIC',
    grade: 'STEP02',
    name: 'ウォーク→スクワット→ウォーク',
    description: 'スタティックランクの技9の説明文',
    point: 'スタティック技9のポイントとコツです',
    youtubeId: 'wu-txyGgFYk',
    thumbnail: 'static-thumb_02.webp',
    qrCode: 'C4tY8rK1wZ6n',
  },
  {
    id: 'static-8',
    rank: 'STATIC',
    grade: 'STEP03',
    name: 'ドロップニー→フットプラント→クルック',
    description: 'スタティックランクの技8の説明文',
    point: 'スタティック技8のポイントとコツです',
    youtubeId: 'bBoIkVitpMI',
    thumbnail: 'static-thumb_03.webp',
    qrCode: 'D9vP2sM5qX8a',
  },
  {
    id: 'static-7',
    rank: 'STATIC',
    grade: 'STEP04',
    name: 'ドロップニー→フロントブッダ→ダブルフットプラント→フロントブッダ⇨ドロップニー',
    description: 'スタティックランクの技7の説明文',
    point: 'スタティック技7のポイントとコツです',
    youtubeId: 'gG-1VmKi4V8',
    thumbnail: 'static-thumb_04.webp',
    qrCode: 'E2nL7bR4cT9y',
  },
  {
    id: 'static-6',
    rank: 'STATIC',
    grade: 'STEP05',
    name: 'バックウォーク',
    description: 'スタティックランクの技6の説明文',
    point: 'スタティック技6のポイントとコツです',
    youtubeId: 'lz-JUszkgOg',
    thumbnail: 'static-thumb_05.webp',
    qrCode: 'F6qW1zH8pK3m',
  },
  {
    id: 'static-5',
    rank: 'STATIC',
    grade: 'STEP06',
    name: 'ドロップニー→クルック→ダブルドロップニー→クルック',
    description: 'スタティックランクの技5の説明文',
    point: 'スタティック技5のポイントとコツです',
    youtubeId: 'PzWDOf56Mns',
    thumbnail: 'static-thumb_06.webp',
    qrCode: 'G3aV9xC2nS7r',
  },
  {
    id: 'static-4',
    rank: 'STATIC',
    grade: 'STEP07',
    name: 'インワード→ターン→ドロップニー→ターン→ドロップニー',
    description: 'スタティックランクの技4の説明文',
    point: 'スタティック技4のポイントとコツです',
    youtubeId: 'BLoMDFNWxqk',
    thumbnail: 'static-thumb_07.webp',
    qrCode: 'H8mD4qT6wL1p',
  },
  {
    id: 'static-3',
    rank: 'STATIC',
    grade: 'STEP08',
    name: 'モンキー→ワンフットグラブ→Lシット→ワンフットレバー',
    description: 'しゃがんだ状態で前足は伸ばし、後ろの足はラインにかけよう',
    point: '胸を張って体重は後ろ足に乗せよう。目線は前を見て、腕でバランスを取ろう。',
    youtubeId: 'X3Xpz-uj0qI',
    thumbnail: 'static-thumb_08.webp',
    qrCode: 'J5rN2vX9cB6s',
  },
  {
    id: 'static-2',
    rank: 'STATIC',
    grade: 'STEP09',
    name: 'スタンド→サイドブッダ→サイドソール→サイドプランク→スクワット',
    description: 'スタティックランクの技2の説明文',
    point: 'スタティック技2のポイントとコツです',
    youtubeId: 'TgZI22oDLKQ',
    thumbnail: 'static-thumb_09.webp',
    qrCode: 'K1yP7mQ4zD8t',
  },
  {
    id: 'static-1',
    rank: 'STATIC',
    grade: 'STEP10',
    name: 'モンキー→ガンビットスワップ→クルック',
    description: 'スタティックランクの技1の説明文',
    point: 'スタティック技1のポイントとコツです',
    youtubeId: '_DVvAHn5GBQ',
    thumbnail: 'static-thumb_10.webp',
    qrCode: 'L9cS3wV6nH2x',
  },
  ...Array.from({ length: 10 }, (_, i) => {
    const stepNumber = String(i + 1).padStart(2, '0');
    return {
      id: `bounce-${i + 1}`,
      rank: 'BOUNCE' as const,
      grade: `STEP${stepNumber}`,
      name: BOUNCE_SKILL_NAMES[i],
      description: `バウンスランクのSTEP${stepNumber}の説明文`,
      point: `バウンスSTEP${stepNumber}のポイントです`,
      youtubeId: BOUNCE_YOUTUBE_IDS[i],
      thumbnail: `bounce-thumb_${stepNumber}.webp`,
      qrCode: [
        'M4pX8dR1qT7v',
        'P7nC2sL9wQ4a',
        'R2vK6mD8xN3y',
        'S8qH1pV5cL9z',
        'T3wN7xB2mQ6r',
        'V6aD9sK4pX1n',
        'X1mR5qT8vC3w',
        'Y9pL2nH6dS4x',
        'Z4cV8wQ1rM7t',
        'U2xS6bP9nK5q',
      ][i],
    };
  }),
] as const satisfies readonly Skill[];

export type SkillId = (typeof skills)[number]['id'];
export type SkillQrCode = (typeof skills)[number]['qrCode'];

export function getYouTubeEmbedUrl(youtubeId?: string): string {
  if (!youtubeId) return '';
  const params = new URLSearchParams({
    controls: '1',
    iv_load_policy: '3',
    rel: '0',
    loop: '1',
    playlist: youtubeId,
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}
