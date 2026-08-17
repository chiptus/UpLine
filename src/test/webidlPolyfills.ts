// Polyfill for ArrayBuffer.prototype.resizable and SharedArrayBuffer.prototype.growable
// These are needed by webidl-conversions package
if (
  typeof ArrayBuffer !== "undefined" &&
  !Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "resizable")
) {
  Object.defineProperty(ArrayBuffer.prototype, "resizable", {
    get() {
      return false;
    },
    configurable: true,
  });
}

if (
  typeof SharedArrayBuffer !== "undefined" &&
  !Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "growable")
) {
  Object.defineProperty(SharedArrayBuffer.prototype, "growable", {
    get() {
      return false;
    },
    configurable: true,
  });
}

// Polyfill for webidl-conversions and whatwg-url
if (typeof globalThis.Set === "undefined") {
  globalThis.Set = Set;
}
if (typeof globalThis.Map === "undefined") {
  globalThis.Map = Map;
}
if (typeof globalThis.WeakMap === "undefined") {
  globalThis.WeakMap = WeakMap;
}
if (typeof globalThis.WeakSet === "undefined") {
  globalThis.WeakSet = WeakSet;
}
