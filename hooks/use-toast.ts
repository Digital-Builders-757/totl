// ðŸš« Do not edit without updating .cursor/llm_rules.yaml
// This file is the single source of truth for toast actions/types.
// If modifying, ensure ActionType and Action interfaces remain consistent.
import * as React from "react";

export type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
};

type State = {
  toasts: ToasterToast[];
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

type ActionType = typeof actionTypes;

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> & { id: string } }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] };

const TOAST_REMOVE_DELAY = 1500;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.ADD_TOAST: {
      return { ...state, toasts: [action.toast, ...state.toasts] };
    }
    case actionTypes.UPDATE_TOAST: {
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };
    }
    case actionTypes.DISMISS_TOAST: {
      const id = action.toastId;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          id ? (t.id === id ? { ...t, duration: 0 } : t) : { ...t, duration: 0 }
        ),
      };
    }
    case actionTypes.REMOVE_TOAST: {
      const id = action.toastId;
      return { ...state, toasts: id ? state.toasts.filter((t) => t.id !== id) : [] };
    }
  }
  // ensure a return for TS (exhaustive switch)
  return state;
}

const ToastContext = React.createContext<{
  toasts: ToasterToast[];
  addToast: (toast: ToasterToast) => void;
  updateToast: (toast: Partial<ToasterToast> & { id: string }) => void;
  dismissToast: (toastId?: string) => void;
  removeToast: (toastId?: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  const addToast = React.useCallback((toast: ToasterToast) => {
    dispatch({ type: actionTypes.ADD_TOAST, toast });
  }, []);

  const updateToast = React.useCallback((toast: Partial<ToasterToast> & { id: string }) => {
    dispatch({ type: actionTypes.UPDATE_TOAST, toast });
  }, []);

  const dismissToast = React.useCallback((toastId?: string) => {
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
    setTimeout(() => dispatch({ type: actionTypes.REMOVE_TOAST, toastId }), TOAST_REMOVE_DELAY);
  }, []);

  const removeToast = React.useCallback((toastId?: string) => {
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, []);

  return React.createElement(
    ToastContext.Provider,
    { value: { toasts: state.toasts, addToast, updateToast, dismissToast, removeToast } },
    children
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const toast = React.useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      ctx.addToast({ ...props, id });
    },
    [ctx]
  );

  return { ...ctx, toast };
}
