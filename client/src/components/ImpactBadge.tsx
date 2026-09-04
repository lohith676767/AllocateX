import { classifyImpactScore, formatScore, IMPACT_CLASSIFICATION_TONE } from '../lib/format';
import { TONE_CLASSES } from './StatusBadge';

/**
 * Same HIGH/MEDIUM/LOW classification used across Projects, Allocations and
 * proposal review — always derived from the score, never a separate field,
 * so the label can never drift from the number it describes.
 */
export default function ImpactBadge({ score, small }: { score: number; small?: boolean }) {
  const classification = classifyImpactScore(score);
  const tone = IMPACT_CLASSIFICATION_TONE[classification];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${TONE_CLASSES[tone]} ${
        small ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2 py-[3px] text-[11.5px]'
      }`}
      title={`Impact Score: ${formatScore(score)}`}
    >
      <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current" />
      {classification}
    </span>
  );
}
