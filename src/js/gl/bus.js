// Resize and render subscriber lists for GL meshes. subscribe() returns a working unsubscribe
// (the reference's filtered on an id the functions never carried, so disposed meshes kept
// rendering after every page change — recorded as a fixed defect in the spec).
function list() {
  const subs = new Map();
  return {
    subscribe(fn) {
      const id = Symbol();
      subs.set(id, fn);
      return () => subs.delete(id);
    },
    call(arg) {
      subs.forEach((fn) => fn(arg));
    },
  };
}
export const resizeBus = list();
export const renderBus = list();
