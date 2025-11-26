import type { Fiber, Element } from '../types';
import { setWipFiber, setHookIndex } from '../component';
import { reconcileChildren } from './reconciliation';
import { createDom } from '../component';

// Exécution d'une unité de travail
export function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = typeof fiber.type === 'function';
  const isFragment = typeof fiber.type === 'symbol';
  const isContextProvider = fiber.type === 'CONTEXT_PROVIDER';
  
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else if (isFragment || isContextProvider) {
    updateFragmentComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  
  let nextFiber: Fiber | undefined = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  
  return null;
}

// Mise à jour des composants fonction
function updateFunctionComponent(fiber: Fiber): void {
  setWipFiber(fiber);
  setHookIndex(0);
  if (fiber.hooks) {
    fiber.hooks = [];
  } else {
    fiber.hooks = [];
  }
  
  const fn = fiber.type as Function;
  const children = [fn(fiber.props)];
  reconcileChildren(fiber, children as Element[]);
}

// Mise à jour des fragments
function updateFragmentComponent(fiber: Fiber): void {
  const children = fiber.props?.children || [];
  reconcileChildren(fiber, children);
}

// Mise à jour des composants hôtes
function updateHostComponent(fiber: Fiber): void {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  
  const children = fiber.props?.children || [];
  reconcileChildren(fiber, children);
} 