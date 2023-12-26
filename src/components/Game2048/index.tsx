//牌的信息
export class Game2048Tile {
  i: number;
  j: number;
  value: number;
  key: string;
  overlaid: boolean;

  constructor(
    i: number,
    j: number,
    value: number,
    key: string,
    overlaid: boolean
  ) {
    this.i = i;
    this.j = j;
    this.value = value;
    this.key = key;
    this.overlaid = overlaid;
  }
}

export enum Direction {
  Up,
  Right,
  Down,
  Left,
}

interface Game2048Options {
  onUpdate?: (tiles: Game2048Tile[]) => void;
  onScoreAdd?: (value: number) => void;
  onMaxMerge?: (value: number) => void;
  onGameOver?: () => void;
  on2048?: (gameOver?: boolean) => void;
  state?: number[] | null;
}

export default class Game2048 {
  protected _options: Game2048Options;

  constructor(options: Game2048Options) {
    this._options = options;
  }
}
