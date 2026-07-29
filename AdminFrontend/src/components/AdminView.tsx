import React, { useEffect, useState } from 'react';
import {
  Trash2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  Search
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
  adminDeleteBoardsBulk,
  adminDeleteComment,
  adminDeleteCommentsBulk,
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

  // Auto-hide flash messages
  useEffect(() => {
    if (flash) {
      const timer = setTimeout(() => setFlash(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #1e1b4b 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        color: 'white',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '12px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Sparkles size={24} color="#a5b4fc" />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                커뮤니티 관리 센터
              </h1>
            </div>
            <p style={{ color: '#a5b4fc', margin: 0, fontSize: '15px', lineHeight: 1.5, maxWidth: '400px' }}>
              게시물, 댓글 및 시스템 인프라를 한눈에 관리하고 모니터링하세요.
            </p>
          </div>
          
          {/* Quick Stats - Mock data for aesthetic presentation */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(10px)',
              padding: '16px 24px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>오늘 새 글</div>
              <div style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#34d399" />
                +24
              </div>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(10px)',
              padding: '16px 24px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>신고 접수</div>
              <div style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                <AlertTriangle size={20} />
                3건
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'boards'} onClick={() => setTab('boards')} icon={<FileText size={16} />} label="게시물 관리" />
        <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')} icon={<MessageSquare size={16} />} label="댓글 관리" />
        <TabBtn active={tab === 'ops'} onClick={() => setTab('ops')} icon={<Sliders size={16} />} label="인프라/운영" />
      </div>

      {error && (
        <div className="fade-in" style={{
          padding: '16px 20px',
          marginBottom: '24px',
          borderRadius: '12px',
          border: '1px solid #fecaca',
          background: '#fef2f2',
          color: '#ef4444',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 6px rgba(239,68,68,0.1)'
        }}>
          <AlertCircle size={18} />
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}
      
      {flash && (
        <div className="fade-in" style={{
          padding: '16px 20px',
          marginBottom: '24px',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          background: '#f0fdf4',
          color: '#16a34a',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 6px rgba(34,197,94,0.1)'
        }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 500 }}>{flash}</span>
        </div>
      )}

      <div style={{ minHeight: '500px' }}>
        {tab === 'boards' && <BoardsPanel onError={setError} onFlash={setFlash} />}
        {tab === 'comments' && <CommentsPanel onError={setError} onFlash={setFlash} />}
        {tab === 'ops' && <OpsPanel onError={setError} onFlash={setFlash} />}
      </div>
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
      gap: '8px',
      padding: '12px 24px',
      borderRadius: '14px',
      background: active ? 'var(--navy)' : 'white',
      color: active ? 'white' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
      fontSize: '14px',
      fontWeight: '700',
      transition: 'all 0.2s ease',
      boxShadow: active ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
      transform: active ? 'translateY(-2px)' : 'none'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = '#f8fafc';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.transform = 'none';
      }
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
  
  // New States for Sorting, Bulk, Modal
  const [sortCol, setSortCol] = useState<'id'|'views'|'createdAt'>('id');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailModal, setDetailModal] = useState<AdminBoardResponse | null>(null);

  const load = async () => {
    setLoading(true);
    onError(null);
    setSelectedIds(new Set());
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
      onFlash(`게시물 #${id} 삭제 처리되었습니다.`);
      await load();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}개의 게시물을 일괄 삭제하시겠습니까?`)) return;
    
    try {
      const idsArray = Array.from(selectedIds);
      await adminDeleteBoardsBulk(idsArray);
      onFlash(`총 ${idsArray.length}개의 게시물이 일괄 삭제되었습니다.`);
    } catch (e) {
      onError(`일괄 삭제 중 오류 발생: ${(e as Error).message}`);
    } finally {
      await load();
    }
  };

  const toggleSort = (col: 'id'|'views'|'createdAt') => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(true); }
  };

  const sortedRows = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortCol === 'id') cmp = a.id - b.id;
    if (sortCol === 'views') cmp = a.views - b.views;
    if (sortCol === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDesc ? -cmp : cmp;
  });

  const allSelected = sortedRows.length > 0 && selectedIds.size === sortedRows.filter(r => !r.adminDeleted).length;

  return (
    <div className="fade-in">
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <select
            value={type}
            onChange={(e) => {
              setPage(0);
              setType(e.target.value as BoardType | '');
            }}
            style={selectStyle}
          >
            <option value="">전체 타입</option>
            <option value="QNA">QnA</option>
            <option value="KNOWHOW">노하우</option>
          </select>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setPage(0);
                setIncludeDeleted(e.target.checked);
              }}
              style={{ width: '16px', height: '16px', accentColor: 'var(--navy)' }}
            />
            소프트 삭제 포함
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            전체 <strong style={{ color: 'var(--navy)', fontSize: '16px' }}>{total}</strong> 건
          </span>
          <button onClick={load} style={refreshBtnStyle}>
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleBulkDelete}
          disabled={selectedIds.size === 0}
          style={{
            ...opsBtnStyle(selectedIds.size > 0 ? '#ef4444' : '#f1f5f9'),
            color: selectedIds.size > 0 ? 'white' : '#94a3b8',
            padding: '10px 16px',
            fontSize: '14px'
          }}
        >
          <Trash2 size={16} style={{ marginRight: '6px' }} />
          선택 일괄 삭제 ({selectedIds.size})
        </button>
      </div>

      {loading ? (
        <div style={loaderStyle}>데이터를 불러오는 중입니다...</div>
      ) : sortedRows.length === 0 ? (
        <div style={loaderStyle}>검색 결과가 없습니다.</div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid var(--border)'
        }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                <th style={{...thStyle, width: '40px', textAlign: 'center'}}>
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(sortedRows.filter(r => !r.adminDeleted).map(r => r.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    style={{ accentColor: 'var(--navy)' }}
                  />
                </th>
                <th 
                  style={{...thStyle, width: '60px', textAlign: 'center', cursor: 'pointer'}}
                  onClick={() => toggleSort('id')}
                >
                  ID {sortCol === 'id' && (sortDesc ? '↓' : '↑')}
                </th>
                <th style={{...thStyle, width: '100px'}}>분류</th>
                <th style={thStyle}>제목</th>
                <th style={{...thStyle, width: '100px'}}>작성자</th>
                <th 
                  style={{...thStyle, width: '80px', textAlign: 'center', cursor: 'pointer'}}
                  onClick={() => toggleSort('views')}
                >
                  조회수 {sortCol === 'views' && (sortDesc ? '↓' : '↑')}
                </th>
                <th style={{...thStyle, width: '100px', textAlign: 'center'}}>상태</th>
                <th 
                  style={{...thStyle, width: '120px', textAlign: 'right', cursor: 'pointer'}}
                  onClick={() => toggleSort('createdAt')}
                >
                  작성일 {sortCol === 'createdAt' && (sortDesc ? '↓' : '↑')}
                </th>
                <th style={{ ...thStyle, width: '100px', textAlign: 'right', paddingRight: '24px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((b) => (
                <tr key={b.id} style={rowStyle(b.userDeleted)} onClick={() => setDetailModal(b)}>
                  <td style={{...tdStyle, textAlign: 'center'}} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(b.id)}
                      disabled={b.adminDeleted}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(b.id);
                        else newSet.delete(b.id);
                        setSelectedIds(newSet);
                      }}
                      style={{ accentColor: 'var(--navy)' }}
                    />
                  </td>
                  <td style={{...tdStyle, textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)'}}>
                    {b.id}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle(b.type === 'QNA' ? '#eff6ff' : '#fdf4ff', b.type === 'QNA' ? '#2563eb' : '#c026d3', 'transparent'),
                      padding: '4px 10px',
                    }}>
                      {b.type === 'QNA' ? 'QnA' : b.type === 'KNOWHOW' ? '노하우' : b.type}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, cursor: 'pointer' }}>
                    {b.title}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        👤
                      </div>
                      <span style={{ color: 'var(--text-secondary)' }}>#{b.userId}</span>
                    </div>
                  </td>
                  <td style={{...tdStyle, textAlign: 'center', color: 'var(--text-secondary)'}}>{b.views}</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <StatusBadges adminDeleted={b.adminDeleted} userDeleted={b.userDeleted} />
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', textAlign: 'right', fontSize: '13px' }}>
                    {formatRelativeKo(b.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', paddingRight: '24px' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDelete(b.id)} 
                      disabled={b.adminDeleted} 
                      style={deleteBtnStyle(b.adminDeleted)}
                      title={b.adminDeleted ? "이미 삭제됨" : "게시물 삭제"}
                    >
                      <Trash2 size={14} />
                      {b.adminDeleted ? '삭제됨' : '삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />

      {/* Detail Modal */}
      {detailModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setDetailModal(null)}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '32px',
            width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                게시물 상세 보기
              </h2>
              <button onClick={() => setDetailModal(null)} style={{ color: 'var(--text-secondary)', fontSize: '24px', fontWeight: 'bold' }}>×</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{...badgeStyle(detailModal.type === 'QNA' ? '#eff6ff' : '#fdf4ff', detailModal.type === 'QNA' ? '#2563eb' : '#c026d3', 'transparent'), marginRight: '8px'}}>
                {detailModal.type === 'QNA' ? 'QnA' : detailModal.type === 'KNOWHOW' ? '노하우' : detailModal.type}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>작성자 ID: #{detailModal.userId} | 조회수: {detailModal.views}</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', lineHeight: 1.4 }}>
              {detailModal.title}
            </h3>
            <div style={{
              background: '#f8fafc', padding: '24px', borderRadius: '16px',
              fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
              {detailModal.content}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => {
                  handleDelete(detailModal.id);
                  setDetailModal(null);
                }} 
                disabled={detailModal.adminDeleted}
                style={{ ...opsBtnStyle(detailModal.adminDeleted ? '#f1f5f9' : '#ef4444'), color: detailModal.adminDeleted ? '#94a3b8' : 'white' }}
              >
                {detailModal.adminDeleted ? '삭제됨' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
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

  // New States for Sorting, Bulk, Modal
  const [sortCol, setSortCol] = useState<'id'|'createdAt'>('id');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailModal, setDetailModal] = useState<AdminCommentResponse | null>(null);

  const load = async () => {
    setLoading(true);
    onError(null);
    setSelectedIds(new Set());
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
    if (!window.confirm(`댓글 #${id} 를 관리자 삭제 처리하시겠습니까?`)) return;
    try {
      await adminDeleteComment(id);
      onFlash(`댓글 #${id} 삭제 처리되었습니다.`);
      await load();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}개의 댓글을 일괄 삭제하시겠습니까?`)) return;
    
    try {
      const idsArray = Array.from(selectedIds);
      await adminDeleteCommentsBulk(idsArray);
      onFlash(`총 ${idsArray.length}개의 댓글이 일괄 삭제되었습니다.`);
    } catch (e) {
      onError(`일괄 삭제 중 오류 발생: ${(e as Error).message}`);
    } finally {
      await load();
    }
  };

  const toggleSort = (col: 'id'|'createdAt') => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(true); }
  };

  const sortedRows = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortCol === 'id') cmp = a.id - b.id;
    if (sortCol === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDesc ? -cmp : cmp;
  });

  const allSelected = sortedRows.length > 0 && selectedIds.size === sortedRows.filter(r => !r.adminDeleted).length;

  return (
    <div className="fade-in">
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <select
            value={referenceType}
            onChange={(e) => {
              setPage(0);
              setReferenceType(e.target.value as ReferenceType | '');
            }}
            style={selectStyle}
          >
            <option value="">모든 도메인</option>
            <option value="QNA">QnA</option>
            <option value="KNOWHOW">노하우</option>
            <option value="GROUPPURCHASE">공동구매</option>
          </select>
          <input
            type="number"
            placeholder="참조 ID (게시글 번호)"
            value={referenceIdInput}
            onChange={(e) => setReferenceIdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(0);
                setReferenceId(referenceIdInput ? Number(referenceIdInput) : null);
              }
            }}
            style={{ ...selectStyle, width: '180px' }}
          />
          <button
            onClick={() => {
              setPage(0);
              setReferenceId(referenceIdInput ? Number(referenceIdInput) : null);
            }}
            style={{
              ...refreshBtnStyle,
              background: 'var(--navy)',
              color: 'white',
              border: 'none',
              padding: '10px 16px'
            }}
          >
            검색
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            총 <strong style={{ color: 'var(--navy)', fontSize: '16px' }}>{total}</strong> 건
          </span>
          <button onClick={load} style={refreshBtnStyle}>
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleBulkDelete}
          disabled={selectedIds.size === 0}
          style={{
            ...opsBtnStyle(selectedIds.size > 0 ? '#ef4444' : '#f1f5f9'),
            color: selectedIds.size > 0 ? 'white' : '#94a3b8',
            padding: '10px 16px',
            fontSize: '14px'
          }}
        >
          <Trash2 size={16} style={{ marginRight: '6px' }} />
          선택 일괄 삭제 ({selectedIds.size})
        </button>
      </div>

      {loading ? (
        <div style={loaderStyle}>데이터를 불러오는 중입니다...</div>
      ) : sortedRows.length === 0 ? (
        <div style={loaderStyle}>검색 결과가 없습니다.</div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid var(--border)'
        }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                <th style={{...thStyle, width: '40px', textAlign: 'center'}}>
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(sortedRows.filter(r => !r.adminDeleted).map(r => r.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    style={{ accentColor: 'var(--navy)' }}
                  />
                </th>
                <th 
                  style={{...thStyle, width: '60px', textAlign: 'center', cursor: 'pointer'}}
                  onClick={() => toggleSort('id')}
                >
                  ID {sortCol === 'id' && (sortDesc ? '↓' : '↑')}
                </th>
                <th style={{...thStyle, width: '120px'}}>도메인</th>
                <th style={{...thStyle, width: '80px', textAlign: 'center'}}>Ref ID</th>
                <th style={{...thStyle, width: '80px', textAlign: 'center'}}>Parent</th>
                <th style={{...thStyle, width: '100px'}}>작성자</th>
                <th style={thStyle}>댓글 내용</th>
                <th style={{...thStyle, width: '100px', textAlign: 'center'}}>상태</th>
                <th 
                  style={{...thStyle, width: '120px', textAlign: 'right', cursor: 'pointer'}}
                  onClick={() => toggleSort('createdAt')}
                >
                  작성일 {sortCol === 'createdAt' && (sortDesc ? '↓' : '↑')}
                </th>
                <th style={{ ...thStyle, width: '100px', textAlign: 'right', paddingRight: '24px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((c) => (
                <tr key={c.id} style={rowStyle(c.userDeleted)} onClick={() => setDetailModal(c)}>
                  <td style={{...tdStyle, textAlign: 'center'}} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(c.id)}
                      disabled={c.adminDeleted}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(c.id);
                        else newSet.delete(c.id);
                        setSelectedIds(newSet);
                      }}
                      style={{ accentColor: 'var(--navy)' }}
                    />
                  </td>
                  <td style={{...tdStyle, textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)'}}>
                    {c.id}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle(
                        c.referenceType === 'QNA' ? '#eff6ff' : c.referenceType === 'KNOWHOW' ? '#fdf4ff' : '#ecfdf5',
                        c.referenceType === 'QNA' ? '#2563eb' : c.referenceType === 'KNOWHOW' ? '#c026d3' : '#059669',
                        'transparent'
                      ),
                      padding: '4px 10px',
                    }}>
                      {c.referenceType === 'QNA' ? 'QnA' : c.referenceType === 'KNOWHOW' ? '노하우' : c.referenceType === 'GROUPPURCHASE' ? '공동구매' : c.referenceType}
                    </span>
                  </td>
                  <td style={{...tdStyle, textAlign: 'center', fontWeight: 600}}>#{c.referenceId}</td>
                  <td style={{...tdStyle, textAlign: 'center', color: 'var(--text-secondary)'}}>
                    {c.parentId ? `#${c.parentId}` : '—'}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        👤
                      </div>
                      <span style={{ color: 'var(--text-secondary)' }}>#{c.userId}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    {c.content}
                  </td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <StatusBadges adminDeleted={c.adminDeleted} userDeleted={c.userDeleted} />
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', textAlign: 'right', fontSize: '13px' }}>
                    {formatRelativeKo(c.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', paddingRight: '24px' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDelete(c.id)} 
                      disabled={c.adminDeleted} 
                      style={deleteBtnStyle(c.adminDeleted)}
                      title={c.adminDeleted ? "이미 삭제됨" : "댓글 삭제"}
                    >
                      <Trash2 size={14} />
                      {c.adminDeleted ? '삭제됨' : '삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />

      {/* Detail Modal */}
      {detailModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setDetailModal(null)}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '32px',
            width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                댓글 상세 보기
              </h2>
              <button onClick={() => setDetailModal(null)} style={{ color: 'var(--text-secondary)', fontSize: '24px', fontWeight: 'bold' }}>×</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                ...badgeStyle(
                  detailModal.referenceType === 'QNA' ? '#eff6ff' : detailModal.referenceType === 'KNOWHOW' ? '#fdf4ff' : '#ecfdf5',
                  detailModal.referenceType === 'QNA' ? '#2563eb' : detailModal.referenceType === 'KNOWHOW' ? '#c026d3' : '#059669',
                  'transparent'
                ), marginRight: '8px'
              }}>
                {detailModal.referenceType === 'QNA' ? 'QnA' : detailModal.referenceType === 'KNOWHOW' ? '노하우' : detailModal.referenceType === 'GROUPPURCHASE' ? '공동구매' : detailModal.referenceType}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                게시물 ID: #{detailModal.referenceId} | 작성자 ID: #{detailModal.userId} {detailModal.parentId && `| 부모 댓글: #${detailModal.parentId}`}
              </span>
            </div>
            <div style={{
              background: '#f8fafc', padding: '24px', borderRadius: '16px',
              fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
              {detailModal.content}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => {
                  handleDelete(detailModal.id);
                  setDetailModal(null);
                }} 
                disabled={detailModal.adminDeleted}
                style={{ ...opsBtnStyle(detailModal.adminDeleted ? '#f1f5f9' : '#ef4444'), color: detailModal.adminDeleted ? '#94a3b8' : 'white' }}
              >
                {detailModal.adminDeleted ? '삭제됨' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
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
    if (!window.confirm('모든 게시물의 검색 데이터를 최신 상태로 동기화합니다. 진행할까요?')) return;
    setReindexing(true);
    onError(null);
    try {
      const count = await adminReindexBoards();
      setLastReindexCount(count);
      onFlash(`검색 동기화 완료: 성공적으로 ${count}개의 게시물을 업데이트했습니다.`);
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
      onFlash(`통계 수정 완료: ${r.corrected}건의 좋아요 수치 오류를 바로잡았습니다.`);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#f3e8ff',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <Search size={32} color="#a855f7" />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          검색 최적화 (동기화)
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px', marginBottom: '32px', minHeight: '44px' }}>
          게시판의 모든 글과 태그를 최신 상태로 검색 엔진에 업데이트합니다. 검색 결과가 실제 게시물과 다를 때 실행해 주세요.
        </p>
        <button 
          onClick={handleReindex} 
          disabled={reindexing} 
          style={{
            ...opsBtnStyle('linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'),
            width: '100%',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          {reindexing ? (
            <><RefreshCw size={18} className="spin" style={{ marginRight: '8px' }} /> 동기화 진행 중...</>
          ) : (
            <><ArrowUpRight size={18} style={{ marginRight: '8px' }} /> 검색 최적화 실행</>
          )}
        </button>
        {lastReindexCount !== null && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', textAlign: 'center' }}>
            마지막 결과: <strong>{lastReindexCount}</strong>개 문서 색인됨
          </div>
        )}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#e0f2fe',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={32} color="#0ea5e9" />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          좋아요 통계 오류 수정
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px', marginBottom: '32px', minHeight: '44px' }}>
          서버 임시 저장소와 실제 데이터베이스 간의 좋아요 수치 차이를 찾아내고, 올바르게 맞춰줍니다. (최대 500건)
        </p>
        <button 
          onClick={handleReconcile} 
          disabled={reconciling} 
          style={{
            ...opsBtnStyle('linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'),
            width: '100%',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          {reconciling ? (
            <><RefreshCw size={18} className="spin" style={{ marginRight: '8px' }} /> 수정 진행 중...</>
          ) : (
            <><ArrowUpRight size={18} style={{ marginRight: '8px' }} /> 통계 오류 수정 실행</>
          )}
        </button>
        {lastReport && (
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            background: '#f8fafc', 
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>스캔된 키:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{lastReport.scanned}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>불일치 발견:</span>
              <strong style={{ color: lastReport.mismatched > 0 ? '#ef4444' : 'var(--text-primary)' }}>{lastReport.mismatched}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>수정 완료:</span>
              <strong style={{ color: '#10b981' }}>{lastReport.corrected}</strong>
            </div>
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
      <span style={badgeStyle('#fef2f2', '#ef4444', 'transparent')}>🚨 관리자 삭제</span>
    );
  }
  if (userDeleted) {
    return (
      <span style={badgeStyle('#f8fafc', '#64748b', 'transparent')}>🗑️ 유저 삭제</span>
    );
  }
  return <span style={badgeStyle('#ecfdf5', '#10b981', 'transparent')}>✅ 정상</span>;
};

const Pager: React.FC<{ page: number; totalPages: number; onChange: (p: number) => void }> = ({ page, totalPages, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px', paddingBottom: '32px' }}>
    <button
      onClick={() => onChange(Math.max(0, page - 1))}
      disabled={page === 0}
      style={{ ...pagerBtnStyle, opacity: page === 0 ? 0.3 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
    >
      <ChevronLeft size={16} color="var(--text-primary)" />
    </button>
    <div style={{ 
      padding: '8px 16px', 
      background: 'white', 
      borderRadius: '12px', 
      fontSize: '14px', 
      fontWeight: 600,
      color: 'var(--text-primary)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid var(--border)'
    }}>
      {page + 1} <span style={{ color: 'var(--text-muted)', margin: '0 4px', fontWeight: 400 }}>/</span> {totalPages}
    </div>
    <button
      onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
      disabled={page + 1 >= totalPages}
      style={{ ...pagerBtnStyle, opacity: page + 1 >= totalPages ? 0.3 : 1, cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer' }}
    >
      <ChevronRight size={16} color="var(--text-primary)" />
    </button>
  </div>
);

// -------- Inline styles (compact table) --------
const selectStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  background: 'white',
  fontSize: '14px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  minWidth: '140px',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const refreshBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  borderRadius: '10px',
  background: 'white',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

const thStyle: React.CSSProperties = {
  padding: '16px 20px',
  textAlign: 'left',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tdStyle: React.CSSProperties = {
  padding: '16px 20px',
  color: 'var(--text-primary)',
};

const rowStyle = (userDeleted: boolean): React.CSSProperties => ({
  borderTop: '1px solid var(--border)',
  opacity: userDeleted ? 0.5 : 1,
  transition: 'background-color 0.2s',
  cursor: 'default'
});

const deleteBtnStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  background: disabled ? '#f8fafc' : '#fef2f2',
  color: disabled ? '#94a3b8' : '#ef4444',
  border: 'none',
  fontSize: '13px',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s',
  minWidth: '80px'
});

const loaderStyle: React.CSSProperties = {
  padding: '80px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
  background: 'white',
  borderRadius: '16px',
  border: '1px solid var(--border)',
  fontSize: '15px',
  fontWeight: 500
};

const pagerBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  transition: 'all 0.2s'
};

const badgeStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 700,
  padding: '6px 12px',
  borderRadius: '8px',
  background: bg,
  color,
  border: `1px solid ${border}`,
  whiteSpace: 'nowrap'
});

const opsBtnStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 20px',
  borderRadius: '12px',
  background: bg,
  color: 'white',
  fontSize: '15px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 0.1s, box-shadow 0.2s',
});
