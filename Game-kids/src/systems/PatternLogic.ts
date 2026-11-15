/** Casillas del tablero que no coinciden con el dibujo objetivo ([fila, columna]). */
export function patternMismatches(state: number[][], target: number[][]): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < target.length; r++) {
    for (let c = 0; c < target[r].length; c++) {
      if ((state[r]?.[c] ?? 0) !== target[r][c]) out.push([r, c]);
    }
  }
  return out;
}

export function emptyBoard(size: number): number[][] {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}
