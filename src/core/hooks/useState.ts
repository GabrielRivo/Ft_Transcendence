import type { Hook } from '../types';
import { 
  getWipFiber, 
  getHookIndex, 
  setHookIndex, 
  getCurrentRoot, 
  setWipRoot, 
  setDeletions 
} from '../component';
import { setNextUnitOfWork } from '../fiber';

// Hook useState
export function useState<T>(initial: T): [T, (action: T | ((prev: T) => T)) => void] {
  const wipFiber = getWipFiber();
  if (!wipFiber) throw new Error("useState called outside of component");
  
  const oldHook = wipFiber.alternate &&
                  wipFiber.alternate.hooks &&
                  wipFiber.alternate.hooks[getHookIndex()] as Hook & { state: T, queue: any[] };
  
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [] as any[],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  });

  const setState = (action: T | ((prev: T) => T)) => {
    hook.queue.push(action);
    const currentRoot = getCurrentRoot();
    if (!currentRoot) return;
    
    const wipRoot = {
      type: "ROOT",
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    setWipRoot(wipRoot);
    setNextUnitOfWork(wipRoot);
    setDeletions([]);
  };

  if (wipFiber.hooks) {
    wipFiber.hooks.push(hook);
  }
  setHookIndex(getHookIndex() + 1);
  return [hook.state, setState];
} 