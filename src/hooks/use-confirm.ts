import { useEffect, useState } from "react";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel: string;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface State {
  request: ConfirmRequest | null;
}

let memoryState: State = { request: null };
const listeners: Array<(state: State) => void> = [];

function dispatch(state: State) {
  memoryState = state;
  listeners.forEach((listener) => listener(memoryState));
}

function confirm(options: ConfirmOptions) {
  return new Promise<boolean>((resolve) => {
    memoryState.request?.resolve(false);
    dispatch({ request: { ...options, resolve } });
  });
}

function respondConfirm(confirmed: boolean) {
  memoryState.request?.resolve(confirmed);
  dispatch({ request: null });
}

function useConfirm() {
  const [state, setState] = useState<State>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return state;
}

export { useConfirm, confirm, respondConfirm };
