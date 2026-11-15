import type { Objective } from '../types';
import type { GameState } from './GameState';

export const ALL_DONE_TEXT =
  '¡Ya hiciste todo lo que se podía por ahora! Puedes explorar y repasar los datos curiosos.';

/** Devuelve la siguiente pista del primer objetivo pendiente (de empujoncito a solución). */
export function nextHint(state: GameState, objectives: Objective[]): string {
  const obj = objectives.find((o) => !state.check(o.doneIf));
  if (!obj) return ALL_DONE_TEXT;
  const text = obj.hints[Math.min(state.hintLevel(obj.id), obj.hints.length - 1)];
  state.bumpHint(obj.id, obj.hints.length);
  return text;
}
