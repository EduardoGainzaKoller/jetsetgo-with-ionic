import {inject, Injectable} from '@angular/core';
import {CapacitorSQLite, SQLiteConnection, SQLiteDBConnection} from "@capacitor-community/sqlite";
import {Capacitor} from "@capacitor/core";
import { BehaviorSubject } from 'rxjs';
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private platform: 'native' | 'web' = Capacitor.getPlatform() === 'web' ? 'web' : 'native';
  private localKey = 'favorites';
  favoritesChanged$ = new BehaviorSubject<void>(undefined);
  userService: UserService = inject(UserService);

  constructor() {
    if (this.platform === 'web') this.initLocalStorageIfEmpty();
  }

  private initLocalStorageIfEmpty() {
    const data = localStorage.getItem(this.localKey);
    if (!data) localStorage.setItem(this.localKey, JSON.stringify([]));
  }

  private getLocalFavorites(): string[] {
    const uid = this.userService.getCurrentUserUID();
    if (!uid) return [];
    const data = localStorage.getItem(this.localKey);
    const allFavorites = data ? JSON.parse(data) : {};
    return allFavorites[uid] || [];
  }

  private setLocalFavorites(ids: string[]) {
    const uid = this.userService.getCurrentUserUID();
    if (!uid) return;
    const data = localStorage.getItem(this.localKey);
    const allFavorites = data ? JSON.parse(data) : {};
    allFavorites[uid] = ids;
    localStorage.setItem(this.localKey, JSON.stringify(allFavorites));
  }

  private async createConnection(): Promise<void> {
    if (!this.db) {
      this.db = await this.sqlite.createConnection('favorites.db', false, 'no-encryption', 1, false);
      await this.db.open();
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS FAVORITES (
                                               uid TEXT,
                                               id TEXT,
                                               PRIMARY KEY (uid, id)
          );
      `);
    }
  }

  async getFavorites(): Promise<string[]> {
    const uid = this.userService.getCurrentUserUID();
    if (!uid) return [];
    if (this.platform === 'web') return this.getLocalFavorites();
    await this.createConnection();
    const result = await this.db!.query('SELECT id FROM FAVORITES WHERE uid = ?', [uid]);
    return result.values?.map(row => row.id) || [];
  }

  async addFavorite(id: string): Promise<void> {
    const uid = this.userService.getCurrentUserUID();
    if (!uid) return;
    if (this.platform === 'web') {
      const ids = this.getLocalFavorites();
      if (!ids.includes(id)) {
        ids.push(id);
        this.setLocalFavorites(ids);
        this.favoritesChanged$.next();
      }
      return;
    }
    await this.createConnection();
    await this.db!.run('INSERT OR IGNORE INTO FAVORITES (uid, id) VALUES (?, ?)', [uid, id]);
    this.favoritesChanged$.next();
  }

  async removeFavorite(id: string): Promise<void> {
    const uid = this.userService.getCurrentUserUID();
    if (!uid) return;
    if (this.platform === 'web') {
      const ids = this.getLocalFavorites().filter(pid => pid !== id);
      this.setLocalFavorites(ids);
      this.favoritesChanged$.next();
      return;
    }
    await this.createConnection();
    await this.db!.run('DELETE FROM FAVORITES WHERE uid = ? AND id = ?', [uid, id]);
    this.favoritesChanged$.next();
  }


  async isFavorite(id: string): Promise<boolean> {
    const ids = await this.getFavorites();
    return ids.includes(id);
  }
}
