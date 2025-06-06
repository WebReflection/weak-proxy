# weak-proxy

[![Coverage Status](https://coveralls.io/repos/github/WebReflection/weak-proxy/badge.svg?branch=main)](https://coveralls.io/github/WebReflection/weak-proxy?branch=main)

Utility to create weakly referenced proxies without retaining, or revealing, the underlying data these carry or represent.

```js
import { OBJECT, ARRAY, FUNCTION, create } from 'weak-proxy';

// Handler examples: if invoked, the `target` is the proxied reference

// Object handler
const objectHandler = {
  get(target, prop) {
    return retrieve_foreign_field(target._ptr, prop);
  },
};

// Array handler also for non-array references
const arrayHandler = {
  // needed to pass common array checks/tests
  // when the weakly proxied reference is *not* an array
  ownKeys: () => ['length'],
  getPrototypeOf: () => Array.prototype,
  getOwnPropertyDescriptor(target, key) {
    return key === 'length' ? this._length(target) : this._index(target, i);
  },
  // helpers for the getOwnPropertyDescriptor case
  _length({ _ptr }) {
    const value retrieve_foreign_list_len(_ptr);
    return { value, writable: true, enumerable: false, configurable: false };
  },
  _index({ _ptr }, i) {
    const value retrieve_foreign_field(_ptr, i);
    return { value, writable: true, enumerable: true, configurable: true };
  },
};

// Function handler also for non function references
const fnHandler = {
  ...objectHandler,
  apply(target, self, args) {
    const fn = retrieve_foreign_callback(target._ptr);
    return Reflect.apply(fn, self, args);
  },
  construct(target, ...rest) {
    const Class = retrieve_foreign_class(target._ptr);
    return Reflect.construct(Class, ...rest);
  }
};

// pointer-handling example -> Proxy `target`
let object = { _ptr: 1 };
let array = { _ptr: 2 };
let fn = { _ptr: 3 };

const po = create(object, objectHandler);
const pa = create(array, arrayHandler, ARRAY);
const pf = create(fn, fnHandler, FUNCTION);

typeof pf;                    // function
Array.isArray(pa);            // true
Object.hasOwn(pa, 'length');  // true
```

It is suggested, for the same guard, to create a single proxy and use *FinalizationRegistry* to be notified about that pointer, as example.

```js
const fr = new FinalizationRegistry(_ptr => {
  free_memory_or_decrease_counter_for(_ptr);
});

// example
fr.register(po, object._ptr);
fr.register(pa, array._ptr);
fr.register(pf, fn._ptr);
```

See [coveraje.js](./coverage.js) to concretely check everything works as expected.
