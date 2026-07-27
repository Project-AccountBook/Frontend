import React, { useEffect, useState } from 'react';
import {
  Shield,
  Trash2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  FileText,
  Wrench,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import type {
  AdminBoardResponse,
  AdminCommentResponse,
  BoardType,
  LikeReconcileReport,
  ReferenceType,
} from '../lib/boardApi';
import {
  adminDeleteBoard,
  adminDeleteComment,
  adminListBoards,
  adminListComments,
  adminReconcileLikes,
  adminReindexBoards,
  formatRelativeKo,
} from '../lib/boardApi';

type Tab = 'boards' | 'comments' | 'ops';
const PAGE_SIZE = 20;

export const AdminView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('boards');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--red-bg)',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              게시판 어드민
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              게시물/댓글 관리자 삭제 및 인프라 작업
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'boards'} onClick={() => setTab('boards')} icon={<FileText size={14} />} label="게시물" />
        <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')} icon={<MessageSquare size={14} />} label="댓글" />
        <TabBtn active={tab === 'ops'} onClick={() => setTab('ops')} icon={<Wrench size={14} />} label="운영 작업" />
      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            border: '1px solid var(--red-border)',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          {error}
        </div>
      )}
      {flash && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            border: '1px solid #86efac',
            background: '#f0fdf4',
            color: '#166534',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          {flash}
        </div>
      )}

      {tab === 'boards' && <BoardsPanel onError={setError} onFlash={setFlash} />}
      {tab === 'comments' && <CommentsPanel onError={setError} onFlash={setFlash} />}
      {tab === 'ops' && <OpsPanel onError={setError} onFlash={setFlash} />}
    </div>
  );
};

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabBtn: React.FC<TabBtnProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '10px',
      background: active ? 'var(--navy)' : 'white',
      color: active ? 'white' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
      fontSize: '13px',
      fontWeight: '700',
    }}
  >
    {icon}
    {label}
  </button>
);

interface PanelProps {
  onError: (m: string | null) => void;
  onFlash: (m: string | null) => void;
}

// -------- Boards panel --------
const BoardsPanel: React.FC<PanelProps> = ({ onError, onFlash }) => {
  const [type, setType] = useState<BoardType | ''>('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<AdminBoardResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    onError(null);
    try {
      const data = await adminListBoards(type || null, includeDeleted, page, PAGE_SIZE);
      setRows(data.content);
      setTotalPages(Math.max(1, data.totalPages));
      setTotal(data.totalElements);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, includeDeleted, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(`게시물 #${id} 를 관리자 삭제 표시하시겠습니까?`)) return;
    try {
      await adminDeleteBoard(id);
      onFlash(`게시물 #${id} 삭제 표시 완료`);
      await load();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div>
      <div
        className="card"
        style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <select
          value={type}
          onChange={(e) => {
            setPage(0);
            setType(e.target.value as BoardType | '');
          }}
          style={selectStyle}
        >
          <option value="">전체 타입</option>
          <option value="QNA">QNA</option>
          <option value="KNOWHOW">KNOWHOW</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setPage(0);
              setIncludeDeleted(e.target.checked);
            }}
          />
          소프트 삭제 포함
        </label>
        <button onClick={load} style={refreshBtnStyle}>
          <RefreshCw size={13} />
          새로고침
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
          총 <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> 건
        </span>
      </div>

      {loading ? (
        <div className="card" style={loaderStyle}>불러오는 중...</div>
      ) : rows.length === 0 ? (
        <div className="card" style={loaderStyle}>결과가 없습니다.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>제목</th>
                <th style={thStyle}>작성자 ID</th>
                <th style={thStyle}>조회</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>작성일</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} style={rowStyle(b.userDeleted)}>
                  <td style={tdStyle}>{b.id}</td>
                  <td style={tdStyle}>{b.type}</td>
                  <td style={{ ...tdStyle, maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.title}
                  </td>
                  <td style={tdStyle}>#{b.userId}</td>
                  <td style={tdStyle}>{b.views}</td>
                  <td style={tdStyle}>
                    <StatusBadges adminDeleted={b.adminDeleted} userDeleted={b.userDeleted} />
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatRelativeKo(b.createdAt)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => handleDelete(b.id)} disabled={b.adminDeleted} style={deleteBtnStyle(b.adminDeleted)}>
                      <Trash2 size={11} />
                      {b.adminDeleted ? '완료' : '삭제 표시'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

// -------- Comments panel --------
const CommentsPanel: React.FC<PanelProps> = ({ onError, onFlash }) => {
  const [referenceType, setReferenceType] = useState<ReferenceType | ''>('');
  const [referenceIdInput, setReferenceIdInput] = useState('');
  const [referenceId, setReferenceId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<AdminCommentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    onError(null);
    try {
      const data = await adminListComments(referenceType || null, referenceId, page, PAGE_SIZE);
      setRows(data.content);
      setTotalPages(Math.max(1, data.totalPages));
      setTotal(data.totalElements);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceType, referenceId, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(`댓글 #${id} 를 관리자 삭제 표시하시겠습니까?`)) return;
    try {
      await adminDeleteComment(id);
      onFlash(`댓글 #${id} 삭제 표시 완료`);
      await load();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div>
      <div
        className="card"
        style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <select
          value={referenceType}
          onChange={(e) => {
            setPage(0);
            setReferenceType(e.target.value as ReferenceType | '');
          }}
          style={selectStyle}
        >
          <option value="">전체 도메인</option>
          <option value="QNA">QNA</option>
          <option value="KNOWHOW">KNOWHOW</option>
          <option value="GROUPPURCHASE">GROUPPURCHASE</option>
        </select>
        <input
          type="number"
          placeholder="referenceId (선택)"
          value={referenceIdInput}
          onChange={(e) => setReferenceIdInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(0);
              setReferenceId(referenceIdInput ? Number(referenceIdInput) : null);
            }
          }}
          style={{ ...selectStyle, minWidth: '160px' }}
        />
        <button
          onClick={() => {
            setPage(0);
            setReferenceId(referenceIdInput ? Number(referenceIdInput) : null);
          }}
          style={refreshBtnStyle}
        >
          필터 적용
        </button>
        <button onClick={load} style={refreshBtnStyle}>
          <RefreshCw size={13} />
          새로고침
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
          총 <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> 건
        </span>
      </div>

      {loading ? (
        <div className="card" style={loaderStyle}>불러오는 중...</div>
      ) : rows.length === 0 ? (
        <div className="card" style={loaderStyle}>결과가 없습니다.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>도메인</th>
                <th style={thStyle}>ref ID</th>
                <th style={thStyle}>parent</th>
                <th style={thStyle}>작성자</th>
                <th style={thStyle}>본문</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>작성일</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={rowStyle(c.userDeleted)}>
                  <td style={tdStyle}>{c.id}</td>
                  <td style={tdStyle}>{c.referenceType}</td>
                  <td style={tdStyle}>{c.referenceId}</td>
                  <td style={tdStyle}>{c.parentId ?? '—'}</td>
                  <td style={tdStyle}>#{c.userId}</td>
                  <td style={{ ...tdStyle, maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.content}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadges adminDeleted={c.adminDeleted} userDeleted={c.userDeleted} />
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatRelativeKo(c.createdAt)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => handleDelete(c.id)} disabled={c.adminDeleted} style={deleteBtnStyle(c.adminDeleted)}>
                      <Trash2 size={11} />
                      {c.adminDeleted ? '완료' : '삭제 표시'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

// -------- Ops panel --------
const OpsPanel: React.FC<PanelProps> = ({ onError, onFlash }) => {
  const [reindexing, setReindexing] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [lastReport, setLastReport] = useState<LikeReconcileReport | null>(null);
  const [lastReindexCount, setLastReindexCount] = useState<number | null>(null);

  const handleReindex = async () => {
    if (!window.confirm('모든 게시물을 Elasticsearch 에 재색인합니다. 진행할까요?')) return;
    setReindexing(true);
    onError(null);
    try {
      const count = await adminReindexBoards();
      setLastReindexCount(count);
      onFlash(`재색인 완료: ${count} 문서`);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setReindexing(false);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    onError(null);
    try {
      const r = await adminReconcileLikes(500);
      setLastReport(r);
      onFlash(`정합성 검증 완료: scanned=${r.scanned}, mismatched=${r.mismatched}, corrected=${r.corrected}`);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={cardTitleStyle}>Elasticsearch 재색인</h3>
        <p style={cardDescStyle}>
          모든 게시물을 태그와 함께 ES 에 다시 색인합니다. `BoardDocument` 스키마 변경 후 최초 1회 실행하세요.
        </p>
        <button onClick={handleReindex} disabled={reindexing} style={opsBtnStyle('var(--purple)')}>
          {reindexing ? '재색인 중...' : '전체 재색인 실행'}
        </button>
        {lastReindexCount !== null && (
          <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            마지막 결과: <strong>{lastReindexCount}</strong> 문서
          </p>
        )}
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <h3 style={cardTitleStyle}>좋아요 카운터 정합성</h3>
        <p style={cardDescStyle}>
          Redis `like:count:*` 를 SCAN 하며 DB COUNT 와 비교. drift 시 DB 정본으로 정정.
          매시 7분 자동 실행되며 여기서 수동 트리거할 수 있습니다.
        </p>
        <button onClick={handleReconcile} disabled={reconciling} style={opsBtnStyle('var(--blue)')}>
          {reconciling ? '검증 중...' : '정합성 검증 실행 (최대 500 키)'}
        </button>
        {lastReport && (
          <div
            style={{
              marginTop: '12px',
              fontSize: '12px',
              display: 'flex',
              gap: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            <span>scanned: <strong style={{ color: 'var(--text-primary)' }}>{lastReport.scanned}</strong></span>
            <span>mismatched: <strong style={{ color: lastReport.mismatched > 0 ? 'var(--red)' : 'var(--text-primary)' }}>{lastReport.mismatched}</strong></span>
            <span>corrected: <strong style={{ color: 'var(--text-primary)' }}>{lastReport.corrected}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

// -------- Shared helpers --------
const StatusBadges: React.FC<{ adminDeleted: boolean; userDeleted: boolean }> = ({ adminDeleted, userDeleted }) => {
  if (adminDeleted) {
    return (
      <span style={badgeStyle('#fef2f2', 'var(--red)', 'var(--red-border)')}>관리자 삭제</span>
    );
  }
  if (userDeleted) {
    return (
      <span style={badgeStyle('#f1f5f9', 'var(--text-secondary)', 'var(--border)')}>유저 삭제</span>
    );
  }
  return <span style={badgeStyle('#dcfce7', '#16a34a', '#86efac')}>정상</span>;
};

const Pager: React.FC<{ page: number; totalPages: number; onChange: (p: number) => void }> = ({ page, totalPages, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
    <button
      onClick={() => onChange(Math.max(0, page - 1))}
      disabled={page === 0}
      style={{ ...pagerBtnStyle, opacity: page === 0 ? 0.4 : 1 }}
    >
      <ChevronLeft size={14} />
    </button>
    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
      {page + 1} / {totalPages}
    </span>
    <button
      onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
      disabled={page + 1 >= totalPages}
      style={{ ...pagerBtnStyle, opacity: page + 1 >= totalPages ? 0.4 : 1 }}
    >
      <ChevronRight size={14} />
    </button>
  </div>
);

// -------- Inline styles (compact table) --------
const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'white',
  fontSize: '13px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
};

const refreshBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '8px',
  background: 'white',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  fontWeight: 700,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: 700,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  color: 'var(--text-primary)',
};

const rowStyle = (userDeleted: boolean): React.CSSProperties => ({
  borderTop: '1px solid var(--border)',
  opacity: userDeleted ? 0.6 : 1,
});

const deleteBtnStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 10px',
  borderRadius: '8px',
  background: disabled ? '#f1f5f9' : 'var(--red-bg)',
  color: disabled ? 'var(--text-muted)' : 'var(--red)',
  border: `1px solid ${disabled ? 'var(--border)' : 'var(--red-border)'}`,
  fontSize: '12px',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const loaderStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
};

const pagerBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'white',
};

const badgeStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '10px',
  background: bg,
  color,
  border: `1px solid ${border}`,
});

const cardTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: '6px',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: '12px',
};

const opsBtnStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 16px',
  borderRadius: '10px',
  background: bg,
  color: 'white',
  fontSize: '13px',
  fontWeight: 700,
});
