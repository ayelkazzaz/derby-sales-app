import { ACHIEVEMENTS } from '../../lib/content';
import { FeatureHeader } from '../Shared';

export function AchievementsScreen({ unlocked, onBack }: { unlocked: string[]; onBack: () => void }) {
  return (
    <div className="screen feature">
      <FeatureHeader title="Achievements" sub="Meaningful moments, not a scoreboard." onBack={onBack} />
      <div className="achv-grid">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.key} className={`achv-item ${unlocked.includes(a.key) ? 'unlocked' : 'locked'}`}>
            <p className="achv-label">{a.label}</p>
            <p className="achv-desc">{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
