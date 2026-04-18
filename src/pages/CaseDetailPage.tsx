import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CaseDetail from '../components/CaseDetail/CaseDetail';
import { useAppDispatch, useAppSelector } from '../store';
import { setCurrentCase } from '../store/slices/casesSlice';
import { db } from '../db';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentCase = useAppSelector((s) => s.cases.currentCase);
  const cases = useAppSelector((s) => s.cases.items);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      // Try from Redux state first
      const found = cases.find((c) => c.id === id);
      if (found) {
        dispatch(setCurrentCase(found));
      } else {
        // Fallback to DB
        const fromDb = await db.getCaseById(id);
        if (fromDb) {
          dispatch(setCurrentCase(fromDb));
        } else {
          navigate('/');
        }
      }
    };
    load();
    return () => { dispatch(setCurrentCase(null)); };
  }, [id, cases, dispatch, navigate]);

  if (!currentCase) {
    return (
      <div className="loading-detail">
        <div className="spinner" />
        <p>加载中...</p>
        <style>{`
          .loading-detail {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loading-detail p { color: #6b7280; margin: 0; }
        `}</style>
      </div>
    );
  }

  return <CaseDetail caseData={currentCase} />;
}
