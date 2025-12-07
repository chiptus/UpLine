import "@testing-library/jest-dom/vitest";

// Polyfill for ArrayBuffer.prototype.resizable and SharedArrayBuffer.prototype.growable
// These are needed by webidl-conversions package
if (typeof ArrayBuffer !== "undefined" && !Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "resizable")) {
  Object.defineProperty(ArrayBuffer.prototype, "resizable", {
    get() {
      return false;
    },
    configurable: true,
  });
}

if (typeof SharedArrayBuffer !== "undefined" && !Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "growable")) {
  Object.defineProperty(SharedArrayBuffer.prototype, "growable", {
    get() {
      return false;
    },
    configurable: true,
  });
}

// Polyfill for webidl-conversions and whatwg-url
if (typeof global.Set === "undefined") {
  global.Set = Set;
}
if (typeof global.Map === "undefined") {
  global.Map = Map;
}
if (typeof global.WeakMap === "undefined") {
  global.WeakMap = WeakMap;
}
if (typeof global.WeakSet === "undefined") {
  global.WeakSet = WeakSet;
}
