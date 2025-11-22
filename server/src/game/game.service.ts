import { Injectable } from '@nestjs/common';
import { Ability, GameConfig, PieceDefinition } from './game.types';

@Injectable()
export class GameService {
  getConfig(): GameConfig {
    return {
      terminology: {
        reinforcementColumn: 'Colonne H - colonne des renforts',
        frontierRows: 'Frontière entre lignes 4 et 5',
        deploymentRows: 'Lignes 1 et 8 - zones de déploiement',
        reserveZone: 'Zone de réserve (pièces face cachée)'
      },
      victoryCondition: 'La victoire est assurée lorsque le général adverse est éliminé.',
      openingSequence: [
        'Chaque joueur prépare un deck de 20 pièces faces cachées placé en réserve.',
        'Lancer de pièce pour déterminer attaquant et défenseur.',
        'Chaque joueur place son général et choisit 4 pièces pour la colonne de renforts (face cachée sauf la plus proche du plateau).',
        "Le défenseur joue en premier. L'attaquant avance son général d'une case pour compenser.",
        'Tous les tours accordent des actions selon les effets de commandement actifs.'
      ],
      notes: [
        'Une action peut être un déplacement, une attaque ou l’utilisation d’un effet.',
        'Les haut gradés définissent une zone d’influence : toute action doit rester dans cette zone.',
        'Les pièces en réserve et dans la colonne des renforts sont face cachée sauf celle en première ligne des renforts.',
        'Si une pièce de renfort atteint le bord, elle peut être placée sur une case libre de la ligne de déploiement.',
        "Si une pièce adverse occupe la ligne d'apparition, aucune pièce ne peut entrer depuis les renforts.",
        'Les pièces avec déplacements non continus (ex: ninja) peuvent franchir des pièces.'
      ],
      pieces: this.buildPieces()
    };
  }

  private buildPieces(): PieceDefinition[] {
    const generalAbilities: Ability[] = [
      {
        name: 'Commandement suprême',
        type: 'passive',
        description: 'Octroie 2 points d’action supplémentaires au camp du général à chaque tour.'
      },
      {
        name: 'Chair à canon',
        type: 'passive',
        description: 'Lorsqu’attaqué, une unité adjacente (1 case) peut être sacrifiée à la place.'
      },
      {
        name: 'Parachutage',
        type: 'active',
        description: 'Déploie une pièce depuis la réserve directement sur le plateau.',
        charges: 2
      },
      {
        name: 'En avant !',
        type: 'active',
        description: 'Fait avancer une pièce alliée de 2 cases en avant.',
        charges: 3
      }
    ];

    const colonelAbilities: Ability[] = [
      {
        name: 'Relai de commandement',
        type: 'passive',
        description: 'Octroie 1 point d’action supplémentaire par tour.'
      },
      {
        name: 'Repli stratégique',
        type: 'active',
        description: 'Permet de reculer n’importe quelle pièce de 2 cases.',
        charges: 1
      }
    ];

    const infantryAbilities: Ability[] = [
      {
        name: 'Rage',
        type: 'active',
        description: 'Après avoir détruit une pièce, réalise immédiatement un nouveau déplacement.',
        charges: 3
      }
    ];

    const scoutAbilities: Ability[] = [
      {
        name: 'Adrénaline',
        type: 'active',
        description: 'Autorise un second déplacement dans le même tour.',
        charges: 3
      }
    ];

    return [
      {
        id: 'general',
        name: 'Général',
        category: 'high-rank',
        movement: 'Grille haut gradé (influence étendue autour de la pièce).',
        attack: 'Attaque dans la même portée que sa zone de déplacement.',
        influence: 'Toute action alliée doit se trouver dans sa zone d’influence.',
        abilities: generalAbilities
      },
      {
        id: 'colonel',
        name: 'Colonel',
        category: 'high-rank',
        movement: 'Grille haut gradé (similaire au général pour la portée et linéarité).',
        attack: 'Attaque dans la portée de déplacement.',
        influence: 'Etend la zone d’influence pour les actions alliées.',
        abilities: colonelAbilities
      },
      {
        id: 'infantryman',
        name: 'Fantassin',
        category: 'infantry',
        movement: 'Déplacement continu dans une grille limitée (selon image de référence).',
        attack: 'Attaque sur les cases atteignables en déplacement.',
        abilities: infantryAbilities
      },
      {
        id: 'scout',
        name: 'Éclaireur',
        category: 'scout',
        movement: 'Déplacement rapide avec éventuels sauts non continus.',
        attack: 'Attaque dans la même zone que son déplacement.',
        abilities: scoutAbilities
      }
    ];
  }
}
