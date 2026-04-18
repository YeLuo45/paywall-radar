import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setFolders, setItems } from '../store/slices/favoritesSlice';
import { db } from '../db';
import FavoritesView from '../components/Favorites/FavoritesView';

export default function FavoritesPage() {
  const dispatch = useAppDispatch();
  const folders = useAppSelector((s) => s.favorites.folders);

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

  return <FavoritesView />;
}
