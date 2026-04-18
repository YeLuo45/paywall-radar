import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setSubscriptions,
  setChangeRecords,
} from '../store/slices/subscriptionsSlice';
import { db } from '../db';
import SubscriptionsView from '../components/Sync/SubscriptionsView';

export default function SubscriptionsPage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    const [subs, records] = await Promise.all([
      db.getAllSubscriptions(),
      db.getChangeRecords(),
    ]);
    dispatch(setSubscriptions(subs));
    dispatch(setChangeRecords(records));
  };
  return <SubscriptionsView />;
}
