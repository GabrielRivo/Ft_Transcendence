import type { Fiber } from '../types';
import { PORTAL_TYPE } from '../portal';

export function commitDeletion(fiber: Fiber, domParent: Node): void {
  // console.log("Deleting fiber:", fiber.type, fiber);
  
  // Si c'est un portal, ses enfants sont dans le container du portal, pas dans domParent...
  if (fiber.type === PORTAL_TYPE) {
    const portalContainer = fiber.props?.container;
    if (portalContainer) {
      let child = fiber.child;
      while (child) {
        commitDeletion(child, portalContainer);
        child = child.sibling;
      }
    }
    return;
  }
  
  if (fiber.dom) {
    console.log("Removing DOM node:", fiber.dom);

    // gestion des refs cleanup
    if (fiber.props && fiber.props.ref) {
      if (typeof fiber.props.ref === 'function') {
          fiber.props.ref(null);
      } else if (typeof fiber.props.ref === 'object' && 'current' in fiber.props.ref) {
          fiber.props.ref.current = null;
      }
    }

    // Vérifier que le noeud est bien un enfant du parent avant de le supprimer
    if (domParent.contains(fiber.dom)) {
      domParent.removeChild(fiber.dom);
    }
  } else {
    // re check plus tard // WARNING
    let child = fiber.child;
    while (child) {
      commitDeletion(child, domParent);
      child = child.sibling;
    }
  }
}
