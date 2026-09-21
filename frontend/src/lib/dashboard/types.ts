export interface ActionRequiredCards {
  expiredCoverageCount: number;
  expiringWithin30DaysCount: number;
  licenseOverDeployedCount: number;
  underRepairCount: number;
}

export interface OverviewCards {
  totalAssets: number;
  inUseCount: number;
  inStockCount: number;
  totalValue: number | null;
  newThisMonth: number;
}

export interface CategoryBreakdownItem {
  code: string;
  name: string;
  iconName: string | null;
  count: number;
}

export interface StatusBreakdownItem {
  code: string;
  name: string;
  colorToken: string;
  count: number;
}

export interface ExpiringSoonItem {
  assetId: number;
  assetTag: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  coverageEndDate: string;
  daysRemaining: number;
}

export interface RecentActivityItem {
  occurredAt: string;
  usernameSnapshot: string | null;
  action: string;
  entityType: string | null;
  entityLabel: string | null;
}

export interface DashboardSummary {
  actionRequired: ActionRequiredCards;
  overview: OverviewCards;
  byCategory: CategoryBreakdownItem[];
  byStatus: StatusBreakdownItem[];
  expiringSoon: ExpiringSoonItem[];
  recentActivity: RecentActivityItem[];
}
