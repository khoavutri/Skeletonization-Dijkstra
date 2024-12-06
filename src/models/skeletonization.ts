class Point {
  constructor(public x: number, public y: number) {}
}

class Skeletonization {
  public readonly width: number;

  public readonly height: number;

  private grayscalePixelData: any;

  toWhite: Point[] = [];

  nbrs: number[][] = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
  ];

  nbrGroups: number[][][] = [
    [
      [0, 2, 4],
      [2, 4, 6],
    ],
    [
      [0, 2, 6],
      [0, 4, 6],
    ],
  ];

  constructor(grayscalePixelData: any, width: number, height: number) {
    this.grayscalePixelData = [];
    for (let i = 0; i < grayscalePixelData.length; i += 4) {
      this.grayscalePixelData.push(grayscalePixelData[i]);
    }
    this.width = width;
    this.height = height;
  }

  thinImage(): void {
    let firstStep = false;
    let hasChanged: boolean;
    let dem = 0;
    do {
      hasChanged = false;
      firstStep = !firstStep;

      for (let y = 1; y < this.height; y++) {
        for (let x = 1; x < this.width; x++) {
          dem++;
          if (this.grayscalePixelData[x + y * this.width] !== 255) continue;
          const numberNegighbor = this.numNeighbors(x, y);
          if (numberNegighbor < 2 || numberNegighbor > 6) {
            continue;
          }

          if (this.numTransitions(x, y) !== 1) continue;

          if (!this.atLeastOneIsWhite(x, y, firstStep ? 0 : 1)) continue;

          this.toWhite.push(new Point(x, y));
          hasChanged = true;
        }
      }

      for (const p of this.toWhite) {
        this.grayscalePixelData[p.x + p.y * this.width] = 0;
      }
      this.toWhite = [];
    } while (firstStep || hasChanged);
  }

  data = () => {
    const dataList = new Uint8ClampedArray(this.grayscalePixelData.length * 4);
    for (let i = 0; i < this.grayscalePixelData.length; i++) {
      dataList[i * 4] = this.grayscalePixelData[i]; // Red
      dataList[i * 4 + 1] = this.grayscalePixelData[i]; // Green
      dataList[i * 4 + 2] = this.grayscalePixelData[i]; // Blue
      dataList[i * 4 + 3] = 255; // Alpha
    }
    // === 255 ? 0 : 255
    return new ImageData(dataList, this.width, this.height);
  };

  numNeighbors(x: number, y: number): number {
    let count = 0;
    for (let i = 0; i < this.nbrs.length - 1; i++) {
      const newX = x + this.nbrs[i][0];
      const newY = y + this.nbrs[i][1];
      if (this.grayscalePixelData[newX + newY * this.width] === 255) {
        count++;
      }
    }
    return count;
  }

  numTransitions(x: number, y: number): number {
    let count = 0;
    for (let i = 0; i < this.nbrs.length - 1; i++) {
      const newX = x + this.nbrs[i][0];
      const newY = y + this.nbrs[i][1];

      const newNbX = x + this.nbrs[i + 1][0];
      const newNbY = y + this.nbrs[i + 1][1];

      if (this.grayscalePixelData[newX + newY * this.width] === 0) {
        if (this.grayscalePixelData[newNbX + newNbY * this.width] === 255) {
          count++;
        }
      }
    }
    return count;
  }

  atLeastOneIsWhite(x: number, y: number, step: number): boolean {
    const group = this.nbrGroups[step];
    let count = 0;

    for (let i = 0; i < 2; i++) {
      for (const j of group[i]) {
        const nbr = this.nbrs[j];
        if (
          this.grayscalePixelData[x + nbr[0] + (y + nbr[1]) * this.width] === 0
        ) {
          count++;
          break;
        }
      }
    }
    return count > 1;
  }
}

export { Skeletonization };
