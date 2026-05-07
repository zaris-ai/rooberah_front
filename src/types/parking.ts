export type Unit = {
  id: number;
  title: string;
};

export type SpotState = 'free' | 'occupied' | 'mine';

export type Spot = {
  id: number;
  unitId: number;
  code: string;
  row: number;
  col: number;
  state: 'free' | 'occupied' | 'mine';
  occupiedByTelegramUserId?: string | null;
  occupiedByUsername?: string | null;
  occupiedByFirstName?: string | null;
  occupiedByLastName?: string | null;
};

export type ActiveSession =
  | {
      spotCode: string;
      unitTitle: string;
      enteredAt: string;
    }
  | null;