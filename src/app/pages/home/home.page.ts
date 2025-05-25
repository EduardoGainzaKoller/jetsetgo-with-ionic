import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActionSheetController,
  ModalController,
  IonAvatar,
  IonButton,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { FooterComponent } from '../../components/footer/footer.component';
import { DetailPopUpComponent } from '../../components/detail-pop-up/detail-pop-up.component';
import { Pokemon } from '../../models/pokemon';
import { PokemonService } from 'src/app/services/pokemon.service';
import { DatabaseService } from '../../services/database.service';
import { InfiniteScrollCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-home',
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
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonAvatar,
    IonButton,
    FooterComponent,
    DetailPopUpComponent
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  pokemons: Pokemon[] = [];

  limit = 20;
  lastName: string | null = null;
  loading = false;
  disableInfiniteScroll = false;

  private pokemonService = inject(PokemonService);
  private databaseService = inject(DatabaseService);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  ngOnInit() {
    this.loadFirstPokemons();
  }

  loadFirstPokemons() {
    this.loading = true;
    this.pokemonService.getFirstBatch(this.limit).subscribe(list => {
      this.pokemons = list;
      this.loading = false;
      if (list.length > 0) {
        this.lastName = list[list.length - 1].nombre;
      }
      if (list.length < this.limit) {
        this.disableInfiniteScroll = true;
      }
    });
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    if (this.loading || this.disableInfiniteScroll) return;
    this.loading = true;
    this.pokemonService.getNextBatch(this.limit, this.lastName!).subscribe(list => {
      this.pokemons.push(...list);
      this.loading = false;
      event.target.complete();
      if (list.length > 0) {
        this.lastName = list[list.length - 1].nombre;
      }
      if (list.length < this.limit) {
        this.disableInfiniteScroll = true;
        event.target.disabled = true;
      }
    });
  }

  async presentActionSheet({ pokemon }: { pokemon: Pokemon }) {

    const isFavorite = await this.databaseService.isFavorite(pokemon.id);

    const sheet = await this.actionSheetController.create({
      header: 'Options',
      buttons: [
        {
          text: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
          icon: isFavorite ? 'heart-dislike' : 'heart',
          handler: async () => {
            try {
              if (isFavorite) {
                await this.databaseService.removeFavorite(pokemon.id);
                console.log(`${pokemon.nombre} removed from favorites`);
              } else {
                await this.databaseService.addFavorite(pokemon.id);
                console.log(`${pokemon.nombre} added to favorites`);
              }
            } catch (error) {
              console.error('Error toggling favorite:', error);
            }
          }
        },
        {
          text: 'Details',
          icon: 'information-circle',
          handler: () => this.openDetailPopup(pokemon)
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await sheet.present();
  }

  private async openDetailPopup(pokemon: Pokemon) {
    const m = await this.modalController.create({
      component: DetailPopUpComponent,
      componentProps: { pokemon }
    });
    await m.present();
  }

  trackByPokemon(_i: number, p: Pokemon): string {
    return p.id;
  }

  async toggleFavorite(pokemon: Pokemon, event: Event) {
    event.stopPropagation();
    try {
      const newState = await this.databaseService.togglePokemonFavorite(pokemon.id);
      console.log(`${pokemon.nombre} ${newState ? 'added to' : 'removed from'} favorites`);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  async isPokemonFavorite(pokemonId: string): Promise<boolean> {
    return await this.databaseService.isFavorite(pokemonId);
  }
}
