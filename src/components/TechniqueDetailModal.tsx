import { useState } from 'react';
import { Technique } from '../types/technique';
import { getImageUrl } from '../utils/images';
import { getYouTubeEmbedUrl } from '../data/skills';
import { TechniqueName } from './TechniqueName';

interface TechniqueDetailModalProps {
  technique: Technique;
  onClose: () => void;
}

const rankBadgeConfig: Record<string, { label: string; className: string }> = {
  Start:    { label: 'START',    className: 'modal-rank-badge-start bg-blue-400 text-text-primary' },
  Static: { label: 'STATIC', className: 'modal-rank-badge-static bg-green-400 text-text-primary' },
  Bounce: { label: 'BOUNCE', className: 'modal-rank-badge-bounce bg-purple-400 text-text-primary' },
};

export function TechniqueDetailModal({ technique, onClose }: TechniqueDetailModalProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getImageUrl(technique.thumbnail);
  const showImage = imageUrl && !imgError;
  const badge = rankBadgeConfig[technique.rank] ?? rankBadgeConfig.Start;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(technique.youtubeId);

  return (
    <div
      className="modal-overlay fixed inset-0 z-[90] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="skill-detail-modal w-full max-w-md bg-card rounded-t-3xl animate-slide-up"
        style={{ height: 'calc(100dvh - 40px)', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable inner */}
        <div className="skill-detail-modal-scroll overflow-y-auto flex-1">

          {/* Rank badge — centered */}
          <div className="flex justify-center pt-5 pb-3 px-5">
            <span className={`modal-rank-badge inline-block font-jost font-bold text-sm px-5 py-1.5 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {/* Title row: thumb + level + name */}
          <div className="modal-title-row flex justify-center items-center gap-3 px-5 pb-4">
            <div className="modal-skill-thumb w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
              {showImage ? (
                <img
                  src={imageUrl}
                  alt={technique.name}
                  className="modal-skill-thumb-image w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full" />
              )}
            </div>
            {technique.rank !== 'Start' && (
              <div className="modal-grade flex items-baseline gap-1">
                <span className="modal-grade-number text-2xl font-bold text-text-primary leading-none whitespace-nowrap">
                  {technique.levelLabel}
                </span>
              </div>
            )}
            <TechniqueName
              name={technique.name}
              className="modal-skill-name font-jp font-bold text-xl text-text-primary leading-tight"
            />
          </div>

          {/* Media — full width, no side padding */}
          <div className="modal-media w-full aspect-video bg-gray-100 relative overflow-hidden">
            {youtubeEmbedUrl ? (
              <iframe
                src={youtubeEmbedUrl}
                title={technique.name}
                className="skill-detail-video-frame w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : showImage ? (
              <img
                src={imageUrl}
                alt={technique.name}
                className="modal-media-image w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="modal-video-placeholder w-full h-full bg-accent-light flex items-center justify-center">
                {technique.rank !== 'Start' && (
                  <span className="grade-number text-5xl text-white/60">{technique.levelLabel}</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="modal-description font-jp text-base text-text-primary px-5 pt-5 pb-1 leading-relaxed">
            {technique.description}
          </p>

          {/* Point */}
          <div className="modal-point px-5 pt-4 pb-2">
            <p className="modal-point-label font-jost font-bold text-sm tracking-widest text-text-primary mb-1">
              POINT
            </p>
            <p className="modal-point-text font-jp text-base text-text-primary leading-relaxed">
              {technique.point}
            </p>
          </div>

          {technique.tips.length > 0 && (
            <div className="modal-tips px-5 pt-2 pb-2">
              <p className="modal-tips-label font-jost font-bold text-sm tracking-widest text-text-primary mb-1">
                TIPS
              </p>
              <ul className="modal-tips-list list-disc pl-5">
                {technique.tips.map((tip) => (
                  <li key={tip} className="modal-tips-item font-jp text-sm text-text-primary leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Close button */}
          <div className="modal-actions flex justify-center px-5 pt-6 pb-10">
            <button
              onClick={onClose}
              className="modal-close-button px-16 py-3.5 rounded-full border-2 border-black font-jost font-bold text-text-primary tracking-widest text-sm bg-card"
            >
              CLOSE
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
