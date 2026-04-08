import type { AssetType, TradeType, TradeSource, UserStatus } from './common';

export interface UserListResponse {
  id: number;
  email: string;
  nickname: string;
  role: string;
  status: UserStatus;
  createdAt: string;
}

export interface UserDetailResponse {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  assetType: AssetType;
  assetCode: string;
  assetName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  evaluationAmount: number;
  profitAmount: number;
  profitRate: number;
}

export interface Portfolio {
  balance: number;
  holdings: Holding[];
  totalEvaluation: number;
  totalProfitAmount: number;
  totalProfitRate: number;
  cryptoEvaluation: number;
  cryptoProfitRate: number;
  stockEvaluation: number;
  stockProfitRate: number;
}

export interface Wallet {
  balance: number;
  initialBalance: number;
  totalAssetValue: number;
  totalReturnRate: number;
}

export interface UserPortfolioResponse {
  portfolio: Portfolio;
  wallet: Wallet;
}

export interface UserTradeHistoryResponse {
  tradeId: number;
  assetType: AssetType;
  assetCode: string;
  assetName: string;
  tradeType: TradeType;
  quantity: number;
  price: number;
  totalAmount: number;
  tradeSource: TradeSource;
  botReason: string | null;
  tradedAt: string | null;
}

export interface UserSuspendRequest {
  reason: string;
}
