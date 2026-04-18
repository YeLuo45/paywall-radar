import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setCases } from '../store/slices/casesSlice';
import { db } from '../db';
import TrendAnalysis from '../components/Report/TrendAnalysis';

export default function TrendsPage() {
  const dispatch = useAppDispatch();
  const cases = useAppSelector((s) => s.cases.items);
  useEffect(() => {
    if (cases.length === 0) {
      loadData();
    }
  }, []);
  const loadData = async () => {
    const casesData = await db.getAllCases();
    dispatch(setCases(casesData));
  };
  return <TrendAnalysis />;
}
