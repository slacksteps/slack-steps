import { StaticPageHeader } from './GuideScreen';
import azCanImage from '../assets/images/az-can.webp';

interface AboutScreenProps {
  onBack: () => void;
}

const appInfo = {
  name: 'SLACK STEPS',
  version: 'Version 1.0.0 (2026年度版 基準対応)',
  description: [
    '本アプリ「SLACK STEPS」は、スラックラインの技術向上と、日々の練習に対するモチベーション維持を目的として開発された、次世代型の検定・学習管理システムです。',
    'STEP01からSTEP10までの体系的な検定基準に準拠し、各技の「お手本動画」や「成功のポイント」をいつでも手元で確認できるラーニング機能を搭載しています。さらに、現場での指導者が直感的に合格を承認できる「QRコード認証システム」を導入することで、レッスン中の一連の検定プロセスをデジタルでスマートに完結させます。',
    '子供たちが自発的に目標を設定し、ステップバイステップで挑戦を積み重ねていくプロセスを、テクノロジーの力で優しくサポートします。',
  ],
};

const producer = {
  name: 'AZ-CAN(我妻吉信)',
  bio: '日本におけるスラックラインの第一人者。スラックライン競技の最高峰リーグ「スラックラインプロリーグ」チェアマンを務める。第一回日本オープンスラックラインチャンピオンシップ優勝、ギボンワールドカップツアー総合7位という成績を収め注目を集める。',
};

export function AboutScreen({ onBack }: AboutScreenProps) {
  return (
    <div className="static-page about-page flex flex-col min-h-screen bg-background">
      <StaticPageHeader title="このアプリについて" onBack={onBack} />

      <div className="about-content flex-1 overflow-y-auto px-6 py-8 pb-16">
        {/* App name & version */}
        <div className="about-section mb-6">
          <p className="about-app-title font-jost font-bold text-2xl text-text-primary mb-1">
            {appInfo.name}
          </p>
          <p className="about-version font-jp text-sm text-text-secondary mb-5">
            {appInfo.version}
          </p>
          {appInfo.description.map((para, i) => (
            <p
              key={i}
              className={`about-paragraph font-jp text-sm text-text-primary leading-relaxed${i > 0 ? ' mt-3' : ''}`}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Producer section */}
        <div className="about-producer-section about-section mt-8">
          <p className="about-section-title font-jost font-bold text-base text-text-primary mb-4">
            PRODUCER / 監修
          </p>

          <div className="about-producer-profile flex gap-4 items-start">
            {azCanImage ? (
              <img
                src={azCanImage}
                alt={producer.name}
                className="about-producer-image w-20 h-20 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="about-producer-image w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
            )}
            <div className="about-producer-info flex-1 min-w-0">
              <p className="about-producer-name font-jp font-bold text-sm text-text-primary mb-2">
                {producer.name}
              </p>
              <p className="about-producer-text font-jp text-sm text-text-secondary leading-relaxed">
                {producer.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="about-copyright font-jost text-sm text-text-secondary mt-16">
          © 2026 AZ-CAN / SLACK STEPS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
