// Global state bus. Writing any property emits an event of the same name with the new value,
// and objects assigned into it are wrapped so their properties emit too — `state.work.FOOTAGE = 2`
// emits "FOOTAGE". Every cross-module signal in the site (PRELOADER_CLICKED, LOADED_WEBGL,
// SLIDER_SETTLED, ON_QUEUE, FOOTAGE, ANIMATE_IN, page) travels this way.
class Emitter {
  events = {};
  on(name, fn) {
    (this.events[name] ||= []).push(fn);
  }
  off(name, fn) {
    if (this.events[name]) this.events[name] = this.events[name].filter((f) => f !== fn);
  }
  emit(name, value) {
    this.events[name]?.forEach((f) => f(value));
  }
}

const emitter = new Emitter();

function wrap(obj) {
  return new Proxy(obj, {
    set(target, key, value, receiver) {
      emitter.emit(key, value);
      return Reflect.set(target, key, value, receiver);
    },
  });
}

const store = new Proxy(
  {},
  {
    set(target, key, value, receiver) {
      if (typeof value === 'object' && value !== null) value = wrap(value);
      emitter.emit(key, value);
      return Reflect.set(target, key, value, receiver);
    },
  },
);

export const state = new Proxy(store, {
  get(target, key) {
    if (key === 'on') return emitter.on.bind(emitter);
    if (key === 'off') return emitter.off.bind(emitter);
    return target[key];
  },
  set(target, key, value, receiver) {
    return Reflect.set(store, key, value, receiver);
  },
});
