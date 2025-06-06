import * as WeakProxy from './index.js';

const time = ms => new Promise($ => setTimeout($, ms));

const objHandler = {
  get: (target, prop) => {
    return target[prop];
  },
};

const arHandler = {
  ...objHandler,
  // needed to pass common array checks/tests
  // when the weakly proxied reference is *not* an array
  ownKeys: () => ['length'],
  getPrototypeOf: () => Array.prototype,
  getOwnPropertyDescriptor(target, key) {
    return key === 'length' ?
      { configurable: false, writable: true, value: 0 } :
      Reflect.getOwnPropertyDescriptor(target, key)
    ;
  },
};

const fnHandler = {
  ...objHandler,
  apply({ $ }, ...rest) {
    return Reflect.apply($, ...rest);
  },
};

let ob = { _: WeakProxy.OBJECT };
let ar = { _: WeakProxy.ARRAY };
let fn = { _: WeakProxy.FUNCTION, $: value => value };

let pob = WeakProxy.create(ob, objHandler);
let par = WeakProxy.create(ar, arHandler, WeakProxy.ARRAY);
let pfn = WeakProxy.create(fn, fnHandler, WeakProxy.FUNCTION);

try {
  WeakProxy.create({}, objHandler, 0);
  throw new Error('should have thrown');
} catch (expected) {}

console.assert(Array.isArray(par));
console.assert(par instanceof Array);
console.assert(Reflect.ownKeys(par).length === 1);
console.assert(Reflect.getOwnPropertyDescriptor(par, 'nope') === void 0);
console.assert(typeof pfn === 'function');
console.assert(pob._ === WeakProxy.OBJECT);
console.assert(par._ === WeakProxy.ARRAY);
console.assert(pfn._ === WeakProxy.FUNCTION);
console.assert(Object.hasOwn(par, 'length'));
console.assert(pfn(123) === 123);

const gone = [];
const fr = new FinalizationRegistry(value => {
  gone.push(value);
});

fr.register(ob, ob._);
fr.register(ar, ar._);
fr.register(fn, fn._);

await time(100);

ob = null;
ar = null;
fn = null;

await time(100);

gc();

try {
  pob._;
  throw new Error('should have thrown');
} catch (expected) {}
try {
  par._;
  throw new Error('should have thrown');
} catch (expected) {}
try {
  pfn._;
  throw new Error('should have thrown');
} catch (expected) {}

ar = WeakProxy.create([1, 2, 3], arHandler);
console.assert(ar.length === 3);
console.assert(ar[1] === 2);

fn = WeakProxy.create(function (a, b) { return Object(a + b); }, {
  apply: Reflect.apply,
  construct: Reflect.construct,
});
console.assert(fn(1, 2) == 3);
console.assert(new fn(1, 2) == 3);

await time(500);

console.assert(gone.length === 3);
console.assert(gone.sort().join(',') === '1,2,3');
