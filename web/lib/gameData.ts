export type PieceId = 'general' | 'colonel' | 'infantryman' | 'scout';

export interface Ability {
  name: string;
  type: 'passive' | 'active';
  description: string;
  charges?: number;
}

export interface Piece {
  id: PieceId;
  name: string;
  category: 'high-rank' | 'infantry' | 'scout';
  movement: string;
  attack: string;
  influence?: string;
  abilities: Ability[];
}

export interface GameRules {
  terminology: {
    reinforcementColumn: string;
    frontierRows: string;
    deploymentRows: string;
    reserveZone: string;
  };
  turnFlow: string[];
  tacticalNotes: string[];
}

export const pieces: Piece[] = [
  {
    id: 'general',
    name: 'Général',
    category: 'high-rank',
    movement: 'Grille de haut gradé, contrôle une large zone d’influence.',
    attack: 'Attaque sur les cases dans sa portée de déplacement.',
    influence: 'Toute action alliée doit rester dans sa zone d’influence.',
    abilities: [
      {
        name: 'Commandement suprême',
        type: 'passive',
        description: 'Octroie 2 points d’action par tour à votre camp.'
      },
      {
        name: 'Chair à canon',
        type: 'passive',
        description: 'Sacrifie une pièce adjacente pour éviter une attaque subie.'
      },
      {
        name: 'Parachutage',
        type: 'active',
        description: 'Déploie une pièce depuis la réserve sur le plateau.',
        charges: 2
      },
      {
        name: 'En avant !',
        type: 'active',
        description: 'Fait avancer une pièce alliée de 2 cases.',
        charges: 3
      }
    ]
  },
  {
    id: 'colonel',
    name: 'Colonel',
    category: 'high-rank',
    movement: 'Grille de haut gradé, relais de commandement.',
    attack: 'Portée équivalente à sa grille de déplacement.',
    influence: 'Étend la zone d’action grâce à son commandement.',
    abilities: [
      {
        name: 'Relai de commandement',
        type: 'passive',
        description: 'Octroie 1 point d’action par tour.'
      },
      {
        name: 'Repli stratégique',
        type: 'active',
        description: 'Fait reculer une pièce de 2 cases.',
        charges: 1
      }
    ]
  },
  {
    id: 'infantryman',
    name: 'Fantassin',
    category: 'infantry',
    movement: 'Déplacement continu sur une grille réduite.',
    attack: 'Frappe dans les cases qu’il peut atteindre en se déplaçant.',
    abilities: [
      {
        name: 'Rage',
        type: 'active',
        description: 'Permet un nouveau déplacement après une destruction.',
        charges: 3
      }
    ]
  },
  {
    id: 'scout',
    name: 'Éclaireur',
    category: 'scout',
    movement: 'Déplacements rapides, sauts possibles selon la grille non continue.',
    attack: 'Attaque dans la même zone que ses déplacements.',
    abilities: [
      {
        name: 'Adrénaline',
        type: 'active',
        description: 'Autorise un second déplacement dans le même tour.',
        charges: 3
      }
    ]
  }
];

export const rules: GameRules = {
  terminology: {
    reinforcementColumn: 'Colonne H (colonne des renforts)',
    frontierRows: 'Frontière entre les lignes 4 et 5',
    deploymentRows: 'Lignes 1 et 8 (déploiement)',
    reserveZone: 'Zone de réserve (pièces face cachée)'
  },
  turnFlow: [
    'Déterminer attaquant/défenseur via un jet de pièce.',
    'Placer le général et quatre pièces dans la colonne des renforts (face cachée, sauf la plus proche).',
    "Le défenseur joue en premier; l'attaquant avance son général d'une case.",
    'À chaque tour : déplacer une pièce, utiliser un effet ou effectuer une attaque.',
    'Si un renfort atteint le bord, il peut être placé sur la ligne de déploiement.',
    "Si l'adversaire occupe la ligne d'apparition, aucun renfort ne peut être placé.",
    'Les haut gradés définissent la zone où les actions alliées sont autorisées.'
  ],
  tacticalNotes: [
    'Les pièces en réserve et renforts sont face cachée sauf celle en première ligne.',
    'Les combos d’unités peuvent débloquer des effets (à définir).',
    'Les pièces ne traversent pas les autres sauf celles à déplacement non continu (ex: ninja).',
    'Victoire obtenue lorsque le général adverse est éliminé.'
  ]
};
