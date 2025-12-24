import type { Fiber, Hook, SenseElement } from "./types";

let nextUnitOfWork: Fiber | null = null;
let currentRoot: Fiber | null = null;
let wipRoot: Fiber | null = null;
let deletions: Fiber[] = [];

let wipFiber: Fiber | null = null;
let hookIndex: number = 0;

export function createElement(
  type: any,
  props: any,
  ...children: any[]
): SenseElement {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat(Infinity)
        .filter((child) => child != null && child !== false)
        .map((child) =>
          typeof child === "object" && child.type
            ? child
            : createTextElement(child),
        ),
    },
    key: props?.key || null,
  };
}

export function createTextElement(text: string | number): SenseElement {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: String(text),
      children: [],
    },
  };
}

function render(element: SenseElement, container: Node) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
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

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children || []);
}

function reconcileChildren(wipFiber: Fiber, elements: SenseElement[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling: Fiber | null = null;

  const oldFiberMap = new Map<string | number, Fiber>();
  let tempOldFiber = oldFiber;
  while (tempOldFiber) {
    if (tempOldFiber.key != null) {
      oldFiberMap.set(tempOldFiber.key, tempOldFiber);
    }
    tempOldFiber = tempOldFiber.sibling;
  }

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    let matchingOldFiber: Fiber | null = null;
    if (element?.key != null && oldFiberMap.has(element.key)) {
      matchingOldFiber = oldFiberMap.get(element.key)!;
      oldFiberMap.delete(element.key);
    } else {
      matchingOldFiber = oldFiber!;
    }

    const sameType =
      matchingOldFiber && element && element.type === matchingOldFiber.type;

    if (sameType && matchingOldFiber) {
      newFiber = {
        type: matchingOldFiber.type,
        props: element!.props,
        dom: matchingOldFiber.dom,
        parent: wipFiber,
        alternate: matchingOldFiber,
        effectTag: "UPDATE",
        key: element!.key,
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
        key: element.key,
      };
    }
    if (matchingOldFiber && !sameType) {
      matchingOldFiber.effectTag = "DELETION";
      deletions.push(matchingOldFiber);
    }

    if (oldFiber && (!element?.key || element.key === oldFiber.key)) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber!;
    } else if (element && prevSibling) {
      prevSibling!.sibling = newFiber!;
    }

    prevSibling = newFiber;
    index++;
  }

  oldFiberMap.forEach((fiber) => {
    fiber.effectTag = "DELETION";
    deletions.push(fiber);
  });
}

function createDom(fiber: Fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);
  return dom;
}

function updateDom(dom: any, prevProps: any, nextProps: any) {
  const isEvent = (key: string) => key.startsWith("on");
  const isProperty = (key: string) =>
    key !== "children" && !isEvent(key) && key !== "key";
  const isNew = (prev: any, next: any) => (key: string) =>
    prev[key] !== next[key];
  const isGone = (_prev: any, next: any) => (key: string) => !(key in next);

  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      if (name in dom) {
        dom[name] = "";
      }
      if (dom.hasAttribute && dom.hasAttribute(name)) {
        dom.removeAttribute(name);
      }
    });

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      if (name === "className") {
        dom.className = nextProps[name];
      } else if (name === "style" && typeof nextProps[name] === "object") {
        Object.assign(dom.style, nextProps[name]);
      } else if (name in dom) {
        dom[name] = nextProps[name];
      } else {
        dom.setAttribute(name, nextProps[name]);
      }
    });

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot?.child);
  commitEffects(wipRoot?.child || null);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitEffects(fiber: Fiber | null) {
  if (!fiber) return;

  fiber.hooks
    ?.filter((h) => h.tag === "EFFECT" && h.cleanup)
    .forEach((hook) => {
      if (typeof hook.cleanup === "function") {
        hook.cleanup();
      }
    });

  fiber.hooks
    ?.filter((h) => h.tag === "EFFECT" && h.callback)
    .forEach((hook) => {
      const cleanupFunction = hook.callback!();
      if (cleanupFunction) {
        hook.cleanup = cleanupFunction;
      }
    });

  commitEffects(fiber.child || null);
  commitEffects(fiber.sibling || null);
}

function commitWork(fiber?: Fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber!.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, domParent: Node) {
  if (fiber.dom) {
    if (domParent.contains(fiber.dom)) {
      domParent.removeChild(fiber.dom);
    }
  } else {
    if (fiber.child) {
      commitDeletion(fiber.child, domParent);
    }
  }
}

function useState<T>(initial: T): [T, (action: any) => void] {
  if (!wipFiber) {
    throw new Error("useState must be called inside a component");
  }

  const oldHook =
    wipFiber?.alternate?.hooks && wipFiber.alternate.hooks[hookIndex];

  const hook: Hook = {
    tag: "STATE",
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions?.forEach((action) => {
    hook.state = action instanceof Function ? action(hook.state) : action;
  });

  const setState = (action: any) => {
    hook.queue!.push(action);
    wipRoot = {
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber!.hooks!.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function useEffect(callback: () => Function | void, deps: any[]) {
  const oldHook =
    wipFiber?.alternate?.hooks && wipFiber.alternate.hooks[hookIndex];

  const hasChanged =
    !oldHook ||
    !deps ||
    !oldHook.deps ||
    deps.length !== oldHook.deps.length ||
    deps.some((dep, i) => !Object.is(dep, oldHook.deps![i]));

  const hook: Hook = {
    tag: "EFFECT",

    callback: hasChanged ? callback : undefined,

    cleanup: oldHook?.cleanup,
    deps,
  };

  wipFiber!.hooks!.push(hook);
  hookIndex++;
}

function Fragment(props: { children?: any }) {
  return props.children;
}

export const Sense = {
  createElement,
  render,
  useState,
  useEffect,
  Fragment,
};
