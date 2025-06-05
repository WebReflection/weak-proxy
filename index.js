const { isArray } = Array;

export const OBJECT = 1;
export const ARRAY = 2;
export const FUNCTION = 3;

/** @typedef {typeof OBJECT | typeof ARRAY | typeof FUNCTION} TYPE */

const prefix = 'This proxied ';
const suffix = ' has been garbage collected';

export const errors = {
  object: prefix + 'object' + suffix,
  array: prefix + 'array' + suffix,
  function: prefix + 'function' + suffix,
};

const objectGuards = new WeakMap;
const arrayGuards = new WeakMap;
const functionGuards = new WeakMap;

// each handler must receive the original reference or fail
const objectDeref = wr => (wr.deref() || raise(errors.object));
const arrayDeref = ([wr]) => (wr.deref() || raise(errors.array));
const functionDeref = bound => (bound().deref() || raise(errors.function));

const raise = message => {
  throw new ReferenceError(message);
};

// each type requires a different guard due to the different deref functions
const set = (wm, handler, deref) => {
  const guarded = {};
  for (const key in handler) {
    const method = handler[key];
    if (typeof method === 'function') {
      guarded[key] = (ref, ..._) => method.call(handler, deref(ref), ..._);
    }
  }
  wm.set(handler, guarded);
  return guarded;
};

/**
 * @param {any} target
 * @param {ProxyHandler<any>} handler
 * @param {TYPE} [type]
 * @returns {unknown}
 */
export const create = (target, handler, type = typeof target === 'function' ? FUNCTION : isArray(target) ? ARRAY : OBJECT) => {
  switch (type) {
    case OBJECT: return new Proxy(
      new WeakRef(target),
      objectGuards.get(handler) || set(objectGuards, handler, objectDeref)
    );
    case ARRAY: return new Proxy(
      [new WeakRef(target)],
      arrayGuards.get(handler) || set(arrayGuards, handler, arrayDeref)
    );
    case FUNCTION: return new Proxy(
      Function.bind(new WeakRef(target)),
      functionGuards.get(handler) || set(functionGuards, handler, functionDeref)
    );
    default: throw new TypeError('Unsupported proxy type: ' + String(type));
  }
};

function Function() {
  return this;
}
