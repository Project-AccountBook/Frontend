import type { GroupPurchaseResponse, GroupPurchaseCategoryResponse } from '../api';

export type GroupBuyStatusType = 'blue' | 'red' | 'grey';

export interface DashboardGroupBuyItem {
  id: number;
  category: string;
  status: string;
  statusType: GroupBuyStatusType;
  title: string;
  progress: number;
  progressBarColor: string;
  price: number;
}

export function getGroupBuyProgressBarColor(statusType: GroupBuyStatusType): string {
  if (statusType === 'blue') return '#3b82f6';
  if (statusType === 'red') return '#ef4444';
  return '#cbd5e1';
}

export function mapGroupPurchaseStatus(
  status: GroupPurchaseResponse['status'],
  deadline: string
): { status: string; statusType: GroupBuyStatusType } {
  if (status === 'SUCCESS') {
    return { status: '모집 성공', statusType: 'blue' };
  }
  if (status === 'FAILED') {
    return { status: '무산됨', statusType: 'grey' };
  }
  if (status === 'CLOSED') {
    return { status: '거래 종료', statusType: 'grey' };
  }
  if (status === 'BLIND') {
    return { status: '블라인드', statusType: 'grey' };
  }

  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { status: '마감임박', statusType: 'red' };
  }
  if (diffDays <= 2) {
    return { status: `마감임박 (D-${diffDays})`, statusType: 'red' };
  }
  return { status: `모집중 (D-${diffDays})`, statusType: 'blue' };
}

export function mapToDashboardGroupBuyItem(
  item: GroupPurchaseResponse,
  categories: Pick<GroupPurchaseCategoryResponse, 'id' | 'name'>[]
): DashboardGroupBuyItem {
  const categoryName = categories.find((cat) => cat.id === item.categoryId)?.name ?? '기타';
  const { status, statusType } = mapGroupPurchaseStatus(item.status, item.deadline);

  return {
    id: item.id,
    category: categoryName,
    status,
    statusType,
    title: item.title,
    progress: Math.round(item.achievementRate),
    progressBarColor: getGroupBuyProgressBarColor(statusType),
    price: item.price
  };
}
