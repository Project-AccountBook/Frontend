import React from 'react';
import { ChevronRight, Lightbulb, MessageSquare, ShoppingBag, TrendingUp } from 'lucide-react';

interface CommunityHubViewProps {
  onSelect: (tab: string) => void;
}

const ITEMS = [
  {
    id: 'qa',
    label: 'Q&A 게시판',
    description: '생활비·가계부 궁금한 점을 묻고 답해요',
    icon: MessageSquare,
  },
  {
    id: 'knowhow',
    label: '노하우 공유',
    description: '절약과 자산 관리 팁을 나눠요',
    icon: Lightbulb,
  },
  {
    id: 'groupbuy',
    label: '동네 공동구매',
    description: '근처 이웃과 함께 구매해요',
    icon: ShoppingBag,
    isHot: true,
  },
  {
    id: 'comparison',
    label: '자산 비교',
    description: '비슷한 사용자와 자산·지출을 비교해요',
    icon: TrendingUp,
  },
] as const;

export const CommunityHubView: React.FC<CommunityHubViewProps> = ({ onSelect }) => {
  return (
    <div className="community-hub fade-in">
      <div className="dashboard-view-header">
        <div>
          <h1>커뮤니티</h1>
          <p>질문하고, 노하우를 나누고, 함께 구매해요</p>
        </div>
      </div>

      <div className="community-hub-list">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="community-hub-item"
              onClick={() => onSelect(item.id)}
            >
              <span className="community-hub-icon">
                <Icon size={20} />
              </span>
              <span className="community-hub-copy">
                <span className="community-hub-title">
                  {item.label}
                  {'isHot' in item && item.isHot ? <span className="sidebar-item-hot">HOT</span> : null}
                </span>
                <span className="community-hub-desc">{item.description}</span>
              </span>
              <ChevronRight size={18} className="community-hub-chevron" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
