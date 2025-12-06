// Global function to open add medication sheet - will be set by MedicationsScreen
let openAddMedicationSheet: (() => void) | null = null;

export function setOpenAddMedicationSheetFn(fn: (() => void) | null) {
  openAddMedicationSheet = fn;
}

export function getOpenAddMedicationSheetFn() {
  return openAddMedicationSheet;
}

