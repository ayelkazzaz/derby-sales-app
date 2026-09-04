import { FEATURES } from '../lib/content';
import { FeatureHeader, FeatureRow } from './Shared';

const TITLES: Record<string, string> = { spark: 'Spark', play: 'Play', us: 'Us', vault: 'Vault' };

export function CategoryScreen({ category, coupleId, onOpen, onBack }: { category: string; coupleId: string | null; onOpen: (key: string) => void; onBack: () => void }) {
  const list = FEATURES.filter((f) => f.category === category);
  return (
    <div className="screen feature">
      <FeatureHeader title={TITLES[category] || category} onBack={onBack} />
      <div className="feature-list">
        {list.map((f) => <FeatureRow key={f.key} f={f} status={f.requiresPairing && !coupleId ? 'Pair first' : 'Open'} onOpen={onOpen} />)}
        {category === 'us' && (
          <button className="feature-row" onClick={() => onOpen('achievements')}>
            <span className="row-bar cat-us" />
            <span className="row-body"><span className="row-label">Achievements</span><span className="row-blurb">Meaningful moments you’ve unlocked together.</span></span>
            <span className="row-status">Open</span>
          </button>
        )}
      </div>
    </div>
  );
}
