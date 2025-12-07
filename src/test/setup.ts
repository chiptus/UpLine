import "@testing-library/jest-dom/vitest";

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
