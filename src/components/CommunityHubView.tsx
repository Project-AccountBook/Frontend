import React from 'react';
import { ChevronRight, Lightbulb, MessageSquare, ShoppingBag, TrendingUp } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface CommunityHubViewProps {
  onSelect: (tab: string) => void;
}

const ITEMS = [
  {
    id: 'qa',
    label: 'Q&A 게시판',
    shortLabel: 'Q&A',
    shortHint: '가계부·생활비 질문',
    description: '생활비·가계부 궁금한 점을 묻고 답해요',
    icon: MessageSquare,
  },
  {
    id: 'knowhow',
    label: '노하우 공유',
    shortLabel: '노하우',
    shortHint: '절약·관리 팁',
    description: '절약과 자산 관리 팁을 나눠요',
    icon: Lightbulb,
  },
  {
    id: 'groupbuy',
    label: '동네 공동구매',
    shortLabel: '공동구매',
    shortHint: '동네 이웃과 구매',
    description: '근처 이웃과 함께 구매해요',
    icon: ShoppingBag,
  },
  {
    id: 'comparison',
    label: '자산 비교',
    shortLabel: '자산 비교',
    shortHint: '또래·지출 비교',
    description: '비슷한 사용자와 자산·지출을 비교해요',
    icon: TrendingUp,
  },
] as const;

export const CommunityHubView: React.FC<CommunityHubViewProps> = ({ onSelect }) => {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    return (
      <div className="community-hub community-hub-app fade-in">
        <section className="community-hub-hero" aria-label="커뮤니티 안내">
          <h2 className="community-hub-hero-title">가계·생활 정보를 나누는 공간</h2>
          <p className="community-hub-hero-desc">메뉴를 선택하세요.</p>
        </section>

        <div className="community-hub-grid">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="community-hub-tile"
                onClick={() => onSelect(item.id)}
              >
                <span className="community-hub-tile-icon">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="community-hub-tile-copy">
                  <span className="community-hub-tile-label">{item.shortLabel}</span>
                  <span className="community-hub-tile-hint">{item.shortHint}</span>
                </span>
                <ChevronRight size={16} className="community-hub-tile-chevron" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

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
                <span className="community-hub-title">{item.label}</span>
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
