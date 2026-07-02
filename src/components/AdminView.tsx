import React, { useEffect, useState } from 'react';
import { Shield, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import type { BoardResponse } from '../lib/boardApi';
import {
  adminDeleteBoard,
  formatRelativeKo,
  listBoards,
} from '../lib/boardApi';

export const AdminView: React.FC = () => {
  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBoards(null, 0, 50);
      setBoards(data.content);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdminDelete = async (id: number) => {
    if (!window.confirm('관리자 권한으로 게시물을 삭제 표시하시겠습니까?')) return;
    try {
      await adminDeleteBoard(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

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
              justifyContent: 'center'
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
                letterSpacing: '-0.5px'
              }}
            >
              관리자 콘솔
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              게시물 관리자 삭제 표시
            </p>
          </div>
        </div>
        <button
          onClick={load}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'white',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: '700'
          }}
        >
          <RefreshCw size={14} />
          새로고침
        </button>
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
            fontSize: '13px'
          }}
        >
          <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          불러오는 중...
        </div>
      ) : boards.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          게시물이 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>제목</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>작성자</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>작성일</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((b) => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{b.id}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{b.type}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>{b.title}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{b.authorNickname}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                    {formatRelativeKo(b.createdAt)}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleAdminDelete(b.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'var(--red-bg)',
                        color: 'var(--red)',
                        border: '1px solid var(--red-border)',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      <Trash2 size={11} />
                      삭제 표시
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
