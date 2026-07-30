export default function setup() {
  // Polyfill for ArrayBuffer.prototype.resizable and SharedArrayBuffer.prototype.growable
  // These are needed by webidl-conversions package which is loaded before test setup files
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
}
