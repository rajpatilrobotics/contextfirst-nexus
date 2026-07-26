"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { CaseCommand, CaseState } from "../../lib/contracts";
import {
  applyCaseCommand,
  createInitialCaseState,
  loadCaseState,
  saveCaseState,
  type CaseCommandResult,
} from "../../lib/state";

export type CaseStateContextValue = {
  state: CaseState;
  dispatchCaseCommand: (command: CaseCommand) => CaseCommandResult;
};

const CaseStateContext = createContext<CaseStateContextValue | null>(null);

function replaceState(_state: CaseState, nextState: CaseState) {
  return nextState;
}

export function CaseStateProvider({
  children,
  initialState,
  onStateChange,
  useSessionPersistence = true,
}: {
  children: ReactNode;
  initialState?: CaseState;
  onStateChange?: (state: CaseState) => void | Promise<void>;
  useSessionPersistence?: boolean;
}) {
  const [state, setState] = useReducer(
    replaceState,
    initialState ?? createInitialCaseState(),
  );
  const stateRef = useRef(state);
  const hydratedRef = useRef(Boolean(initialState) || !useSessionPersistence);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (
      hydratedRef.current ||
      !useSessionPersistence ||
      typeof window === "undefined"
    )
      return;
    hydratedRef.current = true;
    const restored = loadCaseState(window.sessionStorage);
    const restoredState = restored.ok ? restored.state : restored.resetState;
    stateRef.current = restoredState;
    setState(restoredState);
  }, [useSessionPersistence]);

  const dispatchCaseCommand = useCallback((command: CaseCommand) => {
    const result = applyCaseCommand(stateRef.current, command);
    if (!result.ok) return result;

    stateRef.current = result.state;
    setState(result.state);
    if (useSessionPersistence && typeof window !== "undefined") {
      saveCaseState(window.sessionStorage, result.state);
    }
    if (onStateChange) {
      void onStateChange(result.state);
    }
    return result;
  }, [onStateChange, useSessionPersistence]);

  const value = useMemo(
    () => ({ state, dispatchCaseCommand }),
    [dispatchCaseCommand, state],
  );

  return <CaseStateContext.Provider value={value}>{children}</CaseStateContext.Provider>;
}

export function useCaseState(): CaseStateContextValue {
  const value = useContext(CaseStateContext);
  if (!value) {
    throw new Error("useCaseState must be used inside CaseShell.");
  }
  return value;
}
