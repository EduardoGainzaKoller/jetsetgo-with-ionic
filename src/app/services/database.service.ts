import { inject, Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { BehaviorSubject, Observable, Subject, combineLatest, of, switchMap, map, catchError } from 'rxjs';
import { UserService } from "./user.service";
import {
  Firestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  collectionData,
  getDocs, onSnapshot
} from '@angular/fire/firestore';
import { Auth } from "@angular/fire/auth";
import { User } from "firebase/auth";
import { Pokemon } from '../models/pokemon';
import { PokemonService } from './pokemon.service';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  isWeb: boolean = true;
  private readonly DB_NAME = 'favoritePokemonDB';

  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();
  userId: string | undefined = "";

  private favoritesChangedSubject = new Subject<{pokemonId: string, isLiked: boolean}>();
  public favoritesChanged$ = this.favoritesChangedSubject.asObservable();

  private favoritePokemonsSubject = new BehaviorSubject<Pokemon[]>([]);
  public favoritePokemons$ = this.favoritePokemonsSubject.asObservable();

  userService: UserService = inject(UserService);

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private pokemonService: PokemonService,
    private platform: Platform
  ) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.init();

    this.auth.onAuthStateChanged(
      (user: User | null) => {
        this.userId = user?.uid;
        console.log('Estado de autenticaci贸n cambi贸, usuario:', user);
        this.userSubject.next(user);
        if (user) {
          this.loadFavoritePokemons();
        } else {
          console.log('No hay usuario autenticado');
          this.favoritePokemonsSubject.next([]);
        }
      },
      (error) => {
        console.error('Error en el estado de autenticaci贸n:', error);
        this.userSubject.next(null);
      }
    );
  }

  private async init() {
    await this.platform.ready();
    this.isWeb = Capacitor.getPlatform() === 'web';

    if (!this.isWeb) {
      try {
        this.db = await this.sqlite.createConnection(
          this.DB_NAME,
          false,
          'no-encryption',
          1,
          false
        );
        await this.db.open();
        await this.createTableIfNotExists();
        await this.syncFavoritesFromFirestore();
      } catch (error) {
        console.error('SQLite Init Error:', error);
      }
    }
  }

  private async createTableIfNotExists() {
    if (!this.db) return;
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS favoritePokemons (
        id TEXT PRIMARY KEY
      )
    `;
    await this.db.execute(createTableQuery);
  }

  private async syncFavoritesFromFirestore() {
    if (!this.userId || !this.db) return;

    try {
      const favoritePokemonsCollection = collection(this.firestore, `/users/${this.userId}/favoritePokemons`);
      const querySnapshot = await getDocs(favoritePokemonsCollection);

      for (const docSnap of querySnapshot.docs) {
        const pokemonId = docSnap.id;
        await this.db.run(`INSERT OR REPLACE INTO favoritePokemons (id) VALUES (?)`, [pokemonId]);
      }
    } catch (error) {
      console.error('Error sincronizando favoritos desde Firestore a SQLite:', error);
    }
  }

  async isFavorite(pokemonId: string): Promise<boolean> {
    if (!this.userId) return false;

    if (this.isWeb) {
      const pokemonDocRef = doc(this.firestore, `users/${this.userId}/favoritePokemons/${pokemonId}`);
      const snapshot = await getDoc(pokemonDocRef);
      return snapshot.exists();
    } else if (this.db) {
      const res = await this.db.query(`SELECT id FROM favoritePokemons WHERE id = ?`, [pokemonId]);
      return !!(res.values && res.values.length > 0);
    }
    return false;
  }

  isPokemonFavoriteRealtime(pokemonId: string): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      if (!this.userId || !this.firestore) {
        observer.next(false);
        observer.complete();
        return;
      }

      const pokemonDocRef = doc(this.firestore, `users/${this.userId}/favoritePokemons/${pokemonId}`);

      const unsubscribe = onSnapshot(pokemonDocRef, (docSnap) => {
        observer.next(docSnap.exists());
      }, (error) => {
        console.error('Error in real-time favorite check:', error);
        observer.next(false);
      });

      return unsubscribe;
    });
  }

  async addFavorite(pokemonId: string): Promise<void> {
    if (!this.userId) return;

    try {
      if (this.isWeb) {
        const pokemonDocRef = doc(this.firestore, `users/${this.userId}/favoritePokemons/${pokemonId}`);
        await setDoc(pokemonDocRef, { likedAt: new Date() });
      } else if (this.db) {
        await this.db.run(`INSERT OR REPLACE INTO favoritePokemons (id) VALUES (?)`, [pokemonId]);
        try {
          const pokemonDocRef = doc(this.firestore, `users/${this.userId}/favoritePokemons/${pokemonId}`);
          await setDoc(pokemonDocRef, { likedAt: new Date() });
        } catch (error) {
          console.error('Error sincronizando favorito en Firestore:', error);
        }
      }

      this.favoritesChangedSubject.next({pokemonId, isLiked: true});
      this.loadFavoritePokemons();

    } catch (error) {
      console.error('Error al agregar favorito:', error);
      throw error;
    }
  }

  async removeFavorite(pokemonId: string): Promise<void> {
    if (!this.userId) return;

    try {
      if (this.isWeb) {
        const pokemonDocRef = doc(this.firestore, `users/${this.userId}/favoritePokemons/${pokemonId}`);
        await deleteDoc(pokemonDocRef);
      } else if (this.db) {
        await this.db.run(`DELETE FROM favoritePokemons WHERE id = ?`, [pokemonId]);
        try {
          const pokemonDocRef = doc(this.firestore, `users/${this.userId}/favoritePokemons/${pokemonId}`);
          await deleteDoc(pokemonDocRef);
        } catch (error) {
          console.error('Error sincronizando eliminaci贸n en Firestore:', error);
        }
      }

      this.favoritesChangedSubject.next({pokemonId, isLiked: false});
      this.loadFavoritePokemons();

    } catch (error) {
      console.error('Error al quitar favorito:', error);
      throw error;
    }
  }

  private loadFavoritePokemons(): void {
    this.getFavoritePokemons().subscribe({
      next: (pokemons) => {
        this.favoritePokemonsSubject.next(pokemons);
      },
      error: (error) => {
        console.error('Error cargando favoritos:', error);
        this.favoritePokemonsSubject.next([]);
      }
    });
  }

  getFavoritePokemons(): Observable<Pokemon[]> {
    if (this.isWeb) {
      const favoritePokemonsCollection = collection(this.firestore, `/users/${this.userId}/favoritePokemons`);

      return collectionData(favoritePokemonsCollection, { idField: 'id' }).pipe(
        switchMap(favoritePokemons => {
          const pokemonIds = favoritePokemons.map(item => item.id);
          if (pokemonIds.length === 0) {
            return of([]);
          }

          const pokemonObservables = pokemonIds.map(id => this.pokemonService.getPokemonById(id));
          return combineLatest(pokemonObservables).pipe(
            map(pokemons => pokemons.filter(pokemon => pokemon !== null))
          );
        }),
        catchError(error => {
          console.error('Error fetching favorite pokemons from Firestore:', error);
          return of([]);
        })
      );
    } else {
      return new Observable<Pokemon[]>(subscriber => {
        this.db?.query(`SELECT id FROM favoritePokemons`)
          .then(res => {
            const pokemonIds = res.values?.map(row => row.id) || [];
            if (pokemonIds.length === 0) {
              subscriber.next([]);
              return;
            }

            const pokemonObservables = pokemonIds.map(id => this.pokemonService.getPokemonById(id));
            combineLatest(pokemonObservables).pipe(
              map(pokemons => pokemons.filter(pokemon => pokemon !== null))
            ).subscribe({
              next: pokemons => subscriber.next(pokemons),
              error: err => {
                console.error('SQLite error:', err);
                subscriber.next([]);
              }
            });
          })
          .catch(err => {
            console.error('SQLite fetch error:', err);
            subscriber.next([]);
          });
      });
    }
  }

  async getFavorites(): Promise<string[]> {
    if (!this.userId) return [];

    if (this.isWeb) {
      const favoritePokemonsCollection = collection(this.firestore, `/users/${this.userId}/favoritePokemons`);
      const querySnapshot = await getDocs(favoritePokemonsCollection);
      return querySnapshot.docs.map(doc => doc.id);
    } else if (this.db) {
      const result = await this.db.query('SELECT id FROM favoritePokemons');
      return result.values?.map(row => row.id) || [];
    }
    return [];
  }

  async togglePokemonFavorite(pokemonId: string): Promise<boolean> {
    const isCurrentlyFavorite = await this.isFavorite(pokemonId);

    if (isCurrentlyFavorite) {
      await this.removeFavorite(pokemonId);
      return false;
    } else {
      await this.addFavorite(pokemonId);
      return true;
    }
  }
}
