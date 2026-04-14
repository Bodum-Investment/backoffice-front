import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { getUser, getUserPortfolio, getUserTrades, suspendUser } from '@/api/users';
import { useToast } from '@/hooks/useToast';
import type { UserDetailResponse, UserPortfolioResponse, UserTradeHistoryResponse } from '@/types/user';
import FormModal from '@/components/common/FormModal';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/common/Pagination';
import { formatDate, formatKRW, formatPercent, formatQuantity, formatNumber, profitColorClass, ASSET_TYPE_LABEL, TRADE_TYPE_LABEL, TRADE_SOURCE_LABEL } from '@/utils/format';
import '@/styles/pages/users.css';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';

  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 정지 모달
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  // 포트폴리오
  const [portfolio, setPortfolio] = useState<UserPortfolioResponse | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // 거래 내역
  const [trades, setTrades] = useState<UserTradeHistoryResponse[]>([]);
  const [tradesPage, setTradesPage] = useState(0);
  const [tradesTotalPages, setTradesTotalPages] = useState(0);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradeFilters, setTradeFilters] = useState({ assetType: '', tradeSource: '' });

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    getUser(Number(userId))
      .then(setUser)
      .catch(() => showToast('error', '회원 정보 조회에 실패했습니다'))
      .finally(() => setIsLoading(false));
  }, [userId, showToast]);

  // 포트폴리오 탭 (이미 조회된 데이터가 있으면 재요청하지 않음)
  useEffect(() => {
    if (activeTab !== 'portfolio' || !userId || portfolio !== null) return;
    setPortfolioLoading(true);
    getUserPortfolio(Number(userId))
      .then(setPortfolio)
      .catch(() => showToast('error', '포트폴리오 조회에 실패했습니다'))
      .finally(() => setPortfolioLoading(false));
  }, [activeTab, userId, showToast, portfolio]);

  // 거래 내역 탭
  const fetchTrades = useCallback(async () => {
    if (!userId) return;
    setTradesLoading(true);
    try {
      const result = await getUserTrades(Number(userId), { ...tradeFilters, page: tradesPage });
      setTrades(result.content);
      setTradesTotalPages(result.totalPages);
    } catch {
      showToast('error', '거래 내역 조회에 실패했습니다');
    } finally {
      setTradesLoading(false);
    }
  }, [userId, tradeFilters, tradesPage, showToast]);

  useEffect(() => {
    if (activeTab === 'trades') {
      fetchTrades();
    }
  }, [activeTab, fetchTrades]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSuspend = async () => {
    if (suspendReason.trim().length < 1 || suspendReason.length > 1000) return;
    setIsSuspending(true);
    try {
      await suspendUser(Number(userId), suspendReason);
      showToast('success', '회원이 정지되었습니다');
      setShowSuspendModal(false);
      setSuspendReason('');
      const updated = await getUser(Number(userId));
      setUser(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('USER_ALREADY_SUSPENDED')) {
        showToast('error', '이미 정지된 회원입니다');
      } else if (msg.includes('USER_DELETED')) {
        showToast('error', '삭제된 회원은 정지할 수 없습니다');
      } else {
        showToast('error', '정지 처리에 실패했습니다');
      }
    } finally {
      setIsSuspending(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <div className="table-empty">회원을 찾을 수 없습니다</div>;

  return (
    <div className="user-detail">
      <h2 className="page-title">회원 상세</h2>

      <div className="tabs">
        <button
          className={`tabs__item ${activeTab === 'info' ? 'tabs__item--active' : ''}`}
          onClick={() => handleTabChange('info')}
        >
          기본 정보
        </button>
        <button
          className={`tabs__item ${activeTab === 'portfolio' ? 'tabs__item--active' : ''}`}
          onClick={() => handleTabChange('portfolio')}
        >
          포트폴리오
        </button>
        <button
          className={`tabs__item ${activeTab === 'trades' ? 'tabs__item--active' : ''}`}
          onClick={() => handleTabChange('trades')}
        >
          거래 내역
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="user-info">
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">ID</span>
              <span className="info-value">{user.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">이메일</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">닉네임</span>
              <span className="info-value">{user.nickname}</span>
            </div>
            <div className="info-row">
              <span className="info-label">역할</span>
              <span className="info-value">{user.role}</span>
            </div>
            <div className="info-row">
              <span className="info-label">상태</span>
              <span className="info-value"><StatusBadge value={user.status} /></span>
            </div>
            <div className="info-row">
              <span className="info-label">가입일</span>
              <span className="info-value">{formatDate(user.createdAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">수정일</span>
              <span className="info-value">{formatDate(user.updatedAt)}</span>
            </div>
          </div>

          {user.status === 'ACTIVE' && (
            <div className="user-actions">
              <button className="btn btn--danger" onClick={() => setShowSuspendModal(true)}>
                회원 정지
              </button>
            </div>
          )}
          {user.status === 'SUSPENDED' && (
            <p className="user-status-notice">이미 정지된 회원입니다</p>
          )}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="user-portfolio">
          {portfolioLoading ? (
            <LoadingSpinner />
          ) : portfolio ? (
            <>
              <div className="portfolio-summary">
                <div className="summary-card">
                  <h4>지갑</h4>
                  <div className="summary-row">
                    <span>잔고</span>
                    <span>{formatKRW(portfolio.wallet.balance)}</span>
                  </div>
                  <div className="summary-row">
                    <span>초기 잔고</span>
                    <span>{formatKRW(portfolio.wallet.initialBalance)}</span>
                  </div>
                  <div className="summary-row">
                    <span>총 자산</span>
                    <span>{formatKRW(portfolio.wallet.totalAssetValue)}</span>
                  </div>
                  <div className="summary-row">
                    <span>총 수익률</span>
                    <span className={profitColorClass(portfolio.wallet.totalReturnRate)}>
                      {formatPercent(portfolio.wallet.totalReturnRate)}
                    </span>
                  </div>
                </div>

                <div className="summary-card">
                  <h4>포트폴리오</h4>
                  <div className="summary-row">
                    <span>총 평가</span>
                    <span>{formatKRW(portfolio.portfolio.totalEvaluation)}</span>
                  </div>
                  <div className="summary-row">
                    <span>총 수익</span>
                    <span className={profitColorClass(portfolio.portfolio.totalProfitRate)}>
                      {formatKRW(portfolio.portfolio.totalProfitAmount)} ({formatPercent(portfolio.portfolio.totalProfitRate)})
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>암호화폐</span>
                    <span className={profitColorClass(portfolio.portfolio.cryptoProfitRate)}>
                      {formatKRW(portfolio.portfolio.cryptoEvaluation)} ({formatPercent(portfolio.portfolio.cryptoProfitRate)})
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>주식</span>
                    <span className={profitColorClass(portfolio.portfolio.stockProfitRate)}>
                      {formatKRW(portfolio.portfolio.stockEvaluation)} ({formatPercent(portfolio.portfolio.stockProfitRate)})
                    </span>
                  </div>
                </div>
              </div>

              {portfolio.portfolio.holdings.length > 0 && (
                <div className="table-wrapper">
                  <h4>보유 종목</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>유형</th>
                        <th>종목코드</th>
                        <th>종목명</th>
                        <th>수량</th>
                        <th>평균매수가</th>
                        <th>현재가</th>
                        <th>평가금액</th>
                        <th>수익금</th>
                        <th>수익률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.portfolio.holdings.map((h, idx) => (
                        <tr key={idx} style={{ cursor: 'default' }}>
                          <td>{ASSET_TYPE_LABEL[h.assetType]}</td>
                          <td>{h.assetCode}</td>
                          <td>{h.assetName}</td>
                          <td>{formatQuantity(h.quantity, h.assetType)}</td>
                          <td>{formatNumber(h.avgBuyPrice)}</td>
                          <td>{formatNumber(h.currentPrice)}</td>
                          <td>{formatKRW(h.evaluationAmount)}</td>
                          <td className={profitColorClass(h.profitRate)}>{formatKRW(h.profitAmount)}</td>
                          <td className={profitColorClass(h.profitRate)}>{formatPercent(h.profitRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="table-empty">포트폴리오 정보가 없습니다</div>
          )}
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="user-trades">
          <div className="search-form">
            <div className="form-group">
              <label>자산 유형</label>
              <select
                value={tradeFilters.assetType}
                onChange={(e) => { setTradeFilters((f) => ({ ...f, assetType: e.target.value })); setTradesPage(0); }}
              >
                <option value="">전체</option>
                <option value="CRYPTO">암호화폐</option>
                <option value="STOCK">주식</option>
              </select>
            </div>
            <div className="form-group">
              <label>거래 소스</label>
              <select
                value={tradeFilters.tradeSource}
                onChange={(e) => { setTradeFilters((f) => ({ ...f, tradeSource: e.target.value })); setTradesPage(0); }}
              >
                <option value="">전체</option>
                <option value="MANUAL">수동</option>
                <option value="BOT">자동</option>
              </select>
            </div>
          </div>

          {tradesLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>유형</th>
                      <th>종목코드</th>
                      <th>종목명</th>
                      <th>매매</th>
                      <th>수량</th>
                      <th>가격</th>
                      <th>총액</th>
                      <th>소스</th>
                      <th>봇 사유</th>
                      <th>거래일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="table-empty">거래 내역이 없습니다</td>
                      </tr>
                    ) : (
                      trades.map((t) => (
                        <tr key={t.tradeId} style={{ cursor: 'default' }}>
                          <td>{t.tradeId}</td>
                          <td>{ASSET_TYPE_LABEL[t.assetType]}</td>
                          <td>{t.assetCode}</td>
                          <td>{t.assetName}</td>
                          <td>{TRADE_TYPE_LABEL[t.tradeType]}</td>
                          <td>{formatQuantity(t.quantity, t.assetType)}</td>
                          <td>{formatNumber(t.price)}</td>
                          <td>{formatKRW(t.totalAmount)}</td>
                          <td>{TRADE_SOURCE_LABEL[t.tradeSource]}</td>
                          <td>{t.botReason ?? '-'}</td>
                          <td>{formatDate(t.tradedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={tradesPage} totalPages={tradesTotalPages} onPageChange={setTradesPage} />
            </>
          )}
        </div>
      )}

      <FormModal
        isOpen={showSuspendModal}
        title="회원 정지"
        onSubmit={handleSuspend}
        onCancel={() => { setShowSuspendModal(false); setSuspendReason(''); }}
        submitLabel="정지"
        isLoading={isSuspending}
      >
        <div className="form-group">
          <label>정지 사유</label>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="정지 사유를 입력하세요 (최대 1000자)"
            maxLength={1000}
            rows={4}
          />
          <span className="char-count">{suspendReason.length}/1000</span>
        </div>
      </FormModal>
    </div>
  );
}
