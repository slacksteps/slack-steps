export type Rank = 'Start' | 'Static' | 'Bounce';

export interface Technique {
  id: string;
  rank: Rank;
  grade: string;
  name: string;
  description: string;
  point: string;
  youtubeId: string;
  thumbnail: string;
  qrCode: string;
  videoUrl: string;
  cleared: boolean;
}
