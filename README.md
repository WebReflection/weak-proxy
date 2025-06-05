# weak-proxy

Utility to create weakly referenced proxies without retaining, or revealing, the underlying data these carry or represent.

```js
import { OBJECT, ARRAY, FUNCTION, create } from 'weak-proxy';

// handlers for the 3 kind (or 2: OBJECT & FUNCTION)
const objectHandler = {};
const arrayHandler = {
  ...objectHandler,
  ownKeys(target) {
    return ['length'];
  }
};
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

// pointer-handling example
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