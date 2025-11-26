import type { Fiber } from '../types';

export function commitDeletion(fiber: Fiber, domParent: Node): void {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else if (fiber.child) {
    commitDeletion(fiber.child, domParent);
  }
} 