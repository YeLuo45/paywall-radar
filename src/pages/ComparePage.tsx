import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setFolders, setItems } from '../store/slices/favoritesSlice';
import { db } from '../db';
import CompareReport from '../components/Report/CompareReport';

export default function ComparePage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    const [foldersData, itemsData] = await Promise.all([
      db.getAllFolders(),
      db.getAllFavoriteItems(),
    ]);
    dispatch(setFolders(foldersData));
    dispatch(setItems(itemsData));
  };
  return <CompareReport />;
}
