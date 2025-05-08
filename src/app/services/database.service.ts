import { Injectable } from '@angular/core';
import {CapacitorSQLite, SQLiteConnection, SQLiteDBConnection} from "@capacitor-community/sqlite";
import {Capacitor} from "@capacitor/core";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private platform: 'native' | 'web' = Capacitor.getPlatform() === 'web' ? 'web' : 'native';
  private localKey = 'favorites';

  constructor() {
    if (this.platform === 'web') this.initLocalStorageIfEmpty();
  }

  private initLocalStorageIfEmpty() {
    const data = localStorage.getItem(this.localKey);
    if (!data) localStorage.setItem(this.localKey, JSON.stringify([]));
  }

  private getLocalFavorites(): string[] {
    const data = localStorage.getItem(this.localKey);
    return data ? JSON.parse(data) : [];
  }

  private setLocalFavorites(ids: string[]) {
    localStorage.setItem(this.localKey, JSON.stringify(ids));
  }

  private async createConnection(): Promise<void> {
    if (!this.db) {
      this.db = await this.sqlite.createConnection('favorites.db', false, 'no-encryption', 1, false);
      await this.db.open();
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS FAVORITES (
          id TEXT PRIMARY KEY
        );
      `);
    }
  }

  async getFavorites(): Promise<string[]> {
    if (this.platform === 'web') return this.getLocalFavorites();
    await this.createConnection();
    const result = await this.db!.query('SELECT id FROM FAVORITES');
    return result.values?.map(row => row.id) || [];
  }

  async addFavorite(id: string): Promise<void> {
    if (this.platform === 'web') {
      const ids = this.getLocalFavorites();
      if (!ids.includes(id)) {
        ids.push(id);
        this.setLocalFavorites(ids);
      }
      return;
    }
    await this.createConnection();
    await this.db!.run('INSERT OR IGNORE INTO FAVORITES (id) VALUES (?)', [id]);
  }

  async removeFavorite(id: string): Promise<void> {
    if (this.platform === 'web') {
      const ids = this.getLocalFavorites().filter(pid => pid !== id);
      this.setLocalFavorites(ids);
      return;
    }
    await this.createConnection();
    await this.db!.run('DELETE FROM FAVORITES WHERE id = ?', [id]);
  }

  async isFavorite(id: string): Promise<boolean> {
    const ids = await this.getFavorites();
    return ids.includes(id);
  }
}
