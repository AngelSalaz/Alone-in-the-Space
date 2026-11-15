export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

/** Gira una ficha 90° a la derecha: N→E→S→O→N. */
export function rotate(mask: number): number {
  return ((mask << 1) & 15) | ((mask >> 3) & 1);
}

export interface PipeResult {
  connected: boolean;
  /** Fichas alcanzadas desde el tanque, como "fila,columna". */
  visited: Set<string>;
}

/** Comprueba si el tanque (borde izquierdo) llega a la celda (borde derecho). */
export function analyze(tiles: number[][], sourceRow: number, targetRow: number): PipeResult {
  const rows = tiles.length;
  const cols = tiles[0].length;
  const visited = new Set<string>();
  if (!(tiles[sourceRow][0] & W)) return { connected: false, visited };

  const stack: [number, number][] = [[sourceRow, 0]];
  visited.add(`${sourceRow},0`);
  let connected = false;

  const visit = (r: number, c: number) => {
    const k = `${r},${c}`;
    if (!visited.has(k)) {
      visited.add(k);
      stack.push([r, c]);
    }
  };

  while (stack.length) {
    const [r, c] = stack.pop()!;
    const m = tiles[r][c];
    if (r === targetRow && c === cols - 1 && m & E) connected = true;
    if (m & N && r > 0 && tiles[r - 1][c] & S) visit(r - 1, c);
    if (m & E && c < cols - 1 && tiles[r][c + 1] & W) visit(r, c + 1);
    if (m & S && r < rows - 1 && tiles[r + 1][c] & N) visit(r + 1, c);
    if (m & W && c > 0 && tiles[r][c - 1] & E) visit(r, c - 1);
  }
  return { connected, visited };
}
