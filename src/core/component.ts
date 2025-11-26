import type { Element, TextElement, Props, Fiber } from './types';

// Variables globales pour gérer l'état
export let currentFiber: Fiber | null = null;
export let wipRoot: Fiber | null = null;
export let currentRoot: Fiber | null = null;
export let deletions: Fiber[] = [];
export let hookIndex = 0;
export let wipFiber: Fiber | null = null;

// Setters pour les variables globales (utilisés par render.ts)
export function setWipRoot(value: Fiber | null): void {
  wipRoot = value;
}

export function setCurrentRoot(value: Fiber | null): void {
  currentRoot = value;
}

export function setDeletions(value: Fiber[]): void {
  deletions = value;
}

export function setHookIndex(value: number): void {
  hookIndex = value;
}

export function setWipFiber(value: Fiber | null): void {
  wipFiber = value;
}

// Getters pour les variables globales
export function getWipRoot(): Fiber | null {
  return wipRoot;
}

export function getCurrentRoot(): Fiber | null {
  return currentRoot;
}

export function getDeletions(): Fiber[] {
  return deletions;
}

export function getHookIndex(): number {
  return hookIndex;
}

export function getWipFiber(): Fiber | null {
  return wipFiber;
}

// Fragment components
export const Fragment = Symbol('Fragment');

export function FragmentComponent(props: { children?: any[] }): Element {
  return {
    type: Fragment,
    props: {
      children: props.children || [],
    },
  };
}

// Fonction pour JSX (alias de createElement)
export function createComponent(type: string | Function, props: Props | null, ...children: any[]): Element {
  return createElement(type, props, ...children);
}

// Création d'éléments (équivalent à React.createElement)
export function createElement(type: string | Function, props: Props | null, ...children: any[]): Element {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

export function createTextElement(text: any): TextElement {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// Création de nœuds DOM
export function createDom(fiber: Fiber): Node {
  const dom = fiber.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props || {});
  return dom;
}

// Mise à jour des propriétés DOM
export function updateDom(dom: any, prevProps: Props, nextProps: Props): void {
  const isEvent = (key: string): boolean => key.startsWith("on");
  const isProperty = (key: string): boolean => key !== "children" && !isEvent(key);
  const isNew = (prev: Props, next: Props) => (key: string): boolean => prev[key] !== next[key];
  const isGone = (prev: Props, next: Props) => (key: string): boolean => !(key in next);

  // Supprimer les anciens event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Supprimer les anciennes propriétés
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = "";
    });

  // Ajouter ou mettre à jour les propriétés
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // Ajouter les nouveaux event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
} 