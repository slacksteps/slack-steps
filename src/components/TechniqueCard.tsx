import { useState } from 'react';
import { Technique } from '../types/technique';
import { getImageUrl } from '../utils/images';
import clearIcon from '../assets/icons/icn-clear.svg';
import { TechniqueName } from './TechniqueName';

interface TechniqueCardProps {
  technique: Technique;
  onTap: () => void;
  showGrade?: boolean;
}

export function TechniqueCard({ technique, onTap, showGrade = true }: TechniqueCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getImageUrl(technique.thumbnail);
  const showImage = imageUrl && !imgError;

  return (
    <button
      onClick={onTap}
      className={`skill-card${technique.cleared ? ' skill-card-cleared' : ''} relative w-full bg-card rounded-2xl p-2 text-left card-shadow flex items-center gap-3 transition-transform duration-150 ease-out active:scale-[0.98]`}
    >
      {/* Clear badge */}
      {technique.cleared && (
        <div className="skill-clear-icon absolute top-2.5 right-2.5 z-10">
          <img src={clearIcon} alt="cleared" className="w-6 h-6" />
        </div>
      )}

      {/* Circular thumbnail */}
      <div className="skill-thumb w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
        {showImage ? (
          <img
            src={imageUrl}
            alt={technique.name}
            className="skill-thumb-image w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <TechniqueName
          name={technique.name}
          className="skill-title font-jp font-bold text-sm text-text-primary leading-tight"
        />
      </div>

      {/* Grade — bottom right */}
      {showGrade && (
        <div className="skill-grade flex items-end gap-0.5 self-end pb-0.5">
          <span className="skill-grade-number grade-number text-2xl text-text-primary leading-none">
            {technique.gradeNumber}
          </span>
          <span className="skill-grade-label font-jp text-xs text-text-primary mb-0.5">級</span>
        </div>
      )}
    </button>
  );
}
