import React, { createContext, useContext } from "react";

type ComposeSheetContextValue = {
  openComposeSheet: () => void;
};

const ComposeSheetContext = createContext<ComposeSheetContextValue | undefined>(
  undefined
);

export const ComposeSheetProvider = ComposeSheetContext.Provider;

export const useComposeSheet = () => {
  const ctx = useContext(ComposeSheetContext);
  if (!ctx) {
    throw new Error("useComposeSheet must be used within ComposeSheetProvider");
  }
  return ctx;
};
