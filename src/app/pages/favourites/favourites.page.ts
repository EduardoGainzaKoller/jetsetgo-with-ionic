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
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { FooterComponent } from '../../components/footer/footer.component';
// ruta corregida al folder `details-pop-up`
import { DetailPopUpComponent } from '../../components/detail-pop-up/detail-pop-up.component';
import { Pokemon } from '../../models/pokemon';
import { PokemonService } from '../../services/pokemon.service';
import { DatabaseService } from '../../services/database.service';

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
export class FavouritesPage implements OnInit {
  pokemons: Pokemon[] = [];
  favorites: string[] = [];

  private pokemonService = inject(PokemonService);
  private databaseService = inject(DatabaseService);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  ngOnInit() {
    this.databaseService.favoritesChanged$.subscribe(() => this.loadFavorites());
    this.loadFavorites();
  }

  private async loadFavorites() {
    this.favorites = await this.databaseService.getFavorites();
    this.pokemons = [];
    for (const id of this.favorites) {
      if (this.pokemons.find(p => p.id === id)) continue;
      this.pokemonService.getPokemonById(id)
        .subscribe(p => this.pokemons.push(p));
    }
  }

  trackByPokemon(_i: number, p: Pokemon) {
    return p.id;
  }

  async presentActionSheet({ pokemon }: { pokemon: Pokemon }) {
    const as = await this.actionSheetController.create({
      header: 'Options',
      buttons: [
        {
          text: 'Details',
          icon: 'information-circle',
          handler: () => this.openDetailPopup(pokemon)
        },
        {
          text: 'Remove',
          icon: 'trash',
          handler: async () => {
            await this.databaseService.removeFavorite(pokemon.id);
          }
        },
        { text: 'Cancel', icon: 'close', role: 'cancel' }
      ]
    });
    await as.present();
  }

  private async openDetailPopup(pokemon: Pokemon) {
    const m = await this.modalController.create({
      component: DetailPopUpComponent,
      componentProps: { pokemon }
    });
    await m.present();
  }
}
