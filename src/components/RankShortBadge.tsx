type ShortRank = 'STA' | 'BOU';

interface RankShortBadgeProps {
  rank: ShortRank;
  className?: string;
}

const RANK_COLOR: Record<ShortRank, string> = {
  STA: 'bg-[#A9E8B1]',
  BOU: 'bg-purple-400',
};

export function RankShortBadge({ rank, className = '' }: RankShortBadgeProps) {
  return (
    <span
      className={`rank-short-badge inline-flex h-6 w-12 flex-none items-center justify-center rounded-full font-jost text-xs font-bold leading-none text-black ${RANK_COLOR[rank]} ${className}`}
    >
      {rank}
    </span>
  );
}
