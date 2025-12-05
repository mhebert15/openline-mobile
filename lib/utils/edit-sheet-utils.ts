// Global function to open edit sheet - will be set by ProfileSettingsContent
let openEditSheet: (() => void) | null = null;

export function setOpenEditSheetFn(fn: (() => void) | null) {
  openEditSheet = fn;
}

export function getOpenEditSheetFn() {
  return openEditSheet;
}

