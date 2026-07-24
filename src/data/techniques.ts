import { Technique, Rank } from '../types/technique';
import { Skill, skills, SkillRank } from './skills';

const RANK_TO_TECHNIQUE_RANK: Record<SkillRank, Rank> = {
  START: 'Start',
  STATIC: 'Static',
  BOUNCE: 'Bounce',
};

function getGradeNumber(grade: string): string {
  return grade.replace(/\D/g, '');
}

function getLevelLabel(skill: Skill): string {
  const gradeNumber = Number(getGradeNumber(skill.grade));
  if (skill.rank === 'START') return '';

  const stepNumber = 11 - gradeNumber;
  return `STEP${String(stepNumber).padStart(2, '0')}`;
}

function toTechnique(skill: Skill): Technique {
  return {
    id: skill.id,
    rank: RANK_TO_TECHNIQUE_RANK[skill.rank],
    grade: skill.grade,
    gradeNumber: getGradeNumber(skill.grade),
    levelLabel: getLevelLabel(skill),
    name: skill.name,
    description: skill.description,
    point: skill.point,
    tips: [...skill.tips],
    youtubeId: skill.youtubeId ?? '',
    thumbnail: skill.thumbnail,
    qrCode: skill.qrCode,
    videoUrl: skill.youtubeId ?? '',
    cleared: skill.id === 'start-4',
  };
}

export const allTechniques = skills.map(toTechnique);

export const startTechniques = allTechniques.filter((technique) => technique.rank === 'Start');
export const staticTechniques = allTechniques.filter((technique) => technique.rank === 'Static');
export const bounceTechniques = allTechniques.filter((technique) => technique.rank === 'Bounce');

export const getTechniquesByRank = (rank: Rank): Technique[] => {
  if (rank === 'Start') return startTechniques;
  if (rank === 'Static') return staticTechniques;
  return bounceTechniques;
};
