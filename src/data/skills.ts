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
  'フィート→バット180→バット逆スピン180→バット180チェスト→バット→フィート',
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
    description: 'ライン上に両足で10秒間立つ',
    point: '・両手は横から上へあげる。\n・ラインに対して、足をまっすぐ乗せる。',
    youtubeId: 'QLrjCAhxs1k',
    thumbnail: 'start-thumb_01.webp',
    qrCode: 'Q8mK4zV2nP7x',
  },
  {
    id: 'start-3',
    rank: 'START',
    grade: '',
    name: 'リカバリー(右足)10秒',
    description: 'ライン上に右足を軸足にして片足で10秒間立つ',
    point: '・両手と膝を使いバランスを取る。',
    youtubeId: 'G_3PFqnBOwc',
    thumbnail: 'start-thumb_02.webp',
    qrCode: 'W3rT9bL6sH2a',
  },
  {
    id: 'start-2',
    rank: 'START',
    grade: '',
    name: 'リカバリー(左足)10秒',
    description: 'ライン上に左足を軸足にして片足で10秒間立つ',
    point: '・両手と膝を使いバランスを取る。',
    youtubeId: 'qOxYjLTO_Hw',
    thumbnail: 'start-thumb_03.webp',
    qrCode: 'N6pX2cQ8vM5d',
  },
  {
    id: 'start-1',
    rank: 'START',
    grade: '',
    name: '逆スタンス(両足)10秒',
    description: 'ライン上に両足で10秒間立つ(逆スタンス)',
    point: '・両手は横から上へあげる。\n・ラインに対して、足をまっすぐ乗せる。',
    youtubeId: 'a_4bGhtcIa4',
    thumbnail: 'start-thumb_04.webp',
    qrCode: 'A9sD4fG7hJ1k',
  },
  {
    id: 'static-10',
    rank: 'STATIC',
    grade: 'STEP01',
    name: 'ウォーク',
    description: '端から端までゆっくりと歩く',
    point: '・両手は横から上へあげる。\n・ラインに対して、足をまっすぐ乗せる。\n・膝を軽く曲げてバランスを整える。',
    youtubeId: 'byZq1PmwXRc',
    thumbnail: 'static-thumb_01.webp',
    qrCode: 'B7xQ3mN9vL2p',
  },
  {
    id: 'static-9',
    rank: 'STATIC',
    grade: 'STEP02',
    name: 'ウォーク→スクワット→ウォーク',
    description: '端から歩き始め、中央で座る、一度静止して立ち上がり最後まで歩く',
    point: '・背中を丸めないように、素早く膝を曲げる',
    youtubeId: 'wu-txyGgFYk',
    thumbnail: 'static-thumb_02.webp',
    qrCode: 'C4tY8rK1wZ6n',
  },
  {
    id: 'static-8',
    rank: 'STATIC',
    grade: 'STEP03',
    name: 'ドロップニー→フットプラント→クルック',
    description: 'ドロップニー：後ろ足をラインに掛け、しゃがむ\nフットプラント：ドロップニーの姿勢から、前足を伸ばす\nクルック：両足の膝を曲げて、脛でバランスを取る',
    point: '・技の形をしっかりと覚える\n・前足と後ろ足の重心を意識してバランスを取る',
    youtubeId: 'bBoIkVitpMI',
    thumbnail: 'static-thumb_03.webp',
    qrCode: 'D9vP2sM5qX8a',
  },
  {
    id: 'static-7',
    rank: 'STATIC',
    grade: 'STEP04',
    name: 'ドロップニー→フロントブッダ→ダブルフットプラント→フロントブッダ⇨ドロップニー',
    description: 'フロントブッダ：ラインに対して、まっすぐ足を組んで座る\nダブルフットプラント：足を組んだ状態で、両足を伸ばして座る',
    point: '・下半身の力を抜き、上半身でバランスを取る意識を持つ\n・後ろに重心をかけて、両足を伸ばす',
    youtubeId: 'gG-1VmKi4V8',
    thumbnail: 'static-thumb_04.webp',
    qrCode: 'E2nL7bR4cT9y',
  },
  {
    id: 'static-6',
    rank: 'STATIC',
    grade: 'STEP05',
    name: 'バックウォーク',
    description: '端から端まで後ろ向きで歩く',
    point: '・重心が後ろに行きすぎないよう意識してバランスを取る',
    youtubeId: 'lz-JUszkgOg',
    thumbnail: 'static-thumb_05.webp',
    qrCode: 'F6qW1zH8pK3m',
  },
  {
    id: 'static-5',
    rank: 'STATIC',
    grade: 'STEP06',
    name: 'ドロップニー→クルック→ダブルドロップニー→クルック',
    description: 'ダブルドロップニー：両足首をラインにかけ、膝を落とす。',
    point: '・クルックの状態から徐々に形を変えていく',
    youtubeId: 'PzWDOf56Mns',
    thumbnail: 'static-thumb_06.webp',
    qrCode: 'G3aV9xC2nS7r',
  },
  {
    id: 'static-4',
    rank: 'STATIC',
    grade: 'STEP07',
    name: 'インワード→ターン→ドロップニー→ターン→ドロップニー',
    description: '膝を前足の内側に入れて座り、反転する。さらに反転し、ドロップニーの状態を作る',
    point: '・頭を中心からずらさないように意識して反転する',
    youtubeId: 'BLoMDFNWxqk',
    thumbnail: 'static-thumb_07.webp',
    qrCode: 'H8mD4qT6wL1p',
  },
  {
    id: 'static-3',
    rank: 'STATIC',
    grade: 'STEP08',
    name: 'モンキー→ワンフットグラブ→Lシット→ワンフットレバー',
    description: 'モンキー：対角線上の手と足でバランスを取る\nワンフットグラブ：モンキーから片足を前に出して、つま先を掴む\nLシット：ラインを両手で掴み、横向きでお尻を浮かす。\nワンフットレバー：モンキーから片足を前に出してバランスを取る',
    point: '・焦らず技と技をゆっくりと繋いでいく',
    youtubeId: 'X3Xpz-uj0qI',
    thumbnail: 'static-thumb_08.webp',
    qrCode: 'J5rN2vX9cB6s',
  },
  {
    id: 'static-2',
    rank: 'STATIC',
    grade: 'STEP09',
    name: 'スタンド→サイドブッダ→サイドソール→サイドプランク→スクワット',
    description: 'サイドブッダ：ラインに対して、横を向き、足をクロスさせてあぐらの状態を作る\nサイドソール：足の裏と裏をくっつけて、側面でバランスを取る\nサイドプランク：ラインを片手で掴み、両足を伸ばし、横向きでバランスを取る',
    point: '・足の側面をラインにしっかりとグリップして技の状態を作る',
    youtubeId: 'TgZI22oDLKQ',
    thumbnail: 'static-thumb_09.webp',
    qrCode: 'K1yP7mQ4zD8t',
  },
  {
    id: 'static-1',
    rank: 'STATIC',
    grade: 'STEP10',
    name: 'モンキー→ガンビットスワップ→クルック',
    description: 'モンキーの状態から、ラインを掴んだままジャンプして反転し、クルックでキャッチする。',
    point: '・小さな円を描くように、意識して回る\n・キャッチする時は、体の向きをしっかりと反転した方向に向ける',
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
