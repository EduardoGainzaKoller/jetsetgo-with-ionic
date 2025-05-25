import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActionSheetController,
  ModalController,
  IonAvatar,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { FooterComponent } from '../../components/footer/footer.component';
import { DetailPopUpComponent } from '../../components/detail-pop-up/detail-pop-up.component';
import { Pokemon } from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { DatabaseService } from '../../services/database.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    FooterComponent,
    DetailPopUpComponent
  ],
  templateUrl: './favourites.page.html',
  styleUrls: ['./favourites.page.scss']
})
export class FavouritesPage implements OnInit, OnDestroy {
  pokemons: Pokemon[] = [];
  loading = false;
  private destroy$ = new Subject<void>();
  private pokemonService = inject(PokemonService);
  private databaseService = inject(DatabaseService);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  ngOnInit() {
    this.loadFavorites();

    this.databaseService.favoritePokemons$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favoritePokemons => {
        this.pokemons = favoritePokemons;
        console.log('Pokemon favoritos actualizados:', favoritePokemons.length);
      });

    this.databaseService.favoritesChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(change => {
        console.log(`Pokemon ${change.pokemonId} ${change.isLiked ? 'aÃ±adido a' : 'removido de'} favoritos`);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFavorites() {
    this.loading = true;
    this.databaseService.getFavoritePokemons().subscribe({
      next: (pokemons) => {
        this.pokemons = pokemons;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando favoritos:', error);
        this.loading = false;
      }
    });
  }

  trackByPokemon(_i: number, p: Pokemon): string {
    return p.id;
  }

  async presentActionSheet({ pokemon }: { pokemon: Pokemon }) {
    const actionSheet = await this.actionSheetController.create({
      header: pokemon.nombre || 'Pokemon Options',
      buttons: [
        {
          text: 'View Details',
          icon: 'information-circle',
          handler: () => this.openDetailPopup(pokemon)
        },
        {
          text: 'Remove from Favorites',
          icon: 'heart-dislike',
          role: 'destructive',
          handler: async () => {
            try {
              await this.databaseService.removeFavorite(pokemon.id);
              console.log(`${pokemon.nombre} removed from favorites`);
            } catch (error) {
              console.error('Error removing favorite:', error);
            }
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private async openDetailPopup(pokemon: Pokemon) {
    const modal = await this.modalController.create({
      component: DetailPopUpComponent,
      componentProps: { pokemon }
    });
    await modal.present();
  }

  async removeFavorite(pokemon: Pokemon, event: Event) {
    event.stopPropagation();
    try {
      await this.databaseService.removeFavorite(pokemon.id);
      console.log(`${pokemon.nombre} removed from favorites`);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  async refreshFavorites(event?: any) {
    this.loadFavorites();
    if (event) {
      setTimeout(() => {
        event.target.complete();
      }, 1000);
    }
  }

  get hasFavorites(): boolean {
    return this.pokemons.length > 0;
  }

  get isLoading(): boolean {
    return this.loading;
  }
}
