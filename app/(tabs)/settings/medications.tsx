import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
} from "react-native";
import { useAuth } from "@/lib/contexts/AuthContext";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { supabase } from "@/lib/supabase/client";
import { MedicalRepMedicationDisplay } from "@/lib/types/database.types";
import {
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottomsheet";
import { X, Trash2, Edit2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { setOpenAddMedicationSheetFn } from "@/lib/utils/add-medication-sheet-utils";

interface MedicationOption {
  medication_id: string;
  dosage_id: string;
  brand_name: string;
  generic_name: string | null;
  manufacturer: string | null;
  therapeutic_class: string | null;
  strength_text: string;
  form: string | null;
  package_size: string | null;
}

function MedicationsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{ openAdd?: string }>();
  const [medications, setMedications] = useState<MedicalRepMedicationDisplay[]>(
    []
  );
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [editingMedication, setEditingMedication] =
    useState<MedicalRepMedicationDisplay | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editAvailableDosages, setEditAvailableDosages] = useState<
    MedicationOption[]
  >([]);
  const [loadingEditDosages, setLoadingEditDosages] = useState(false);
  const [selectedEditDosage, setSelectedEditDosage] =
    useState<MedicationOption | null>(null);
  const [masterMedications, setMasterMedications] = useState<
    MedicationOption[]
  >([]);
  const [loadingMasterMedications, setLoadingMasterMedications] =
    useState(false);
  const [selectedMedicationDosage, setSelectedMedicationDosage] =
    useState<MedicationOption | null>(null);
  const [addNotes, setAddNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingMedication, setAddingMedication] = useState(false);

  // Edit modal state - no longer using bottom sheet context

  // Add medication modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddOpen = () => {
    setIsAddModalOpen(true);
  };
  const handleAddClose = () => {
    setIsAddModalOpen(false);
    setSelectedMedicationDosage(null);
    setAddNotes("");
    setSearchQuery("");
  };

  // Fetch medications for medical rep
  const fetchMedications = async () => {
    if (!user || user.user_type !== "medical_rep") {
      setMedications([]);
      return;
    }

    setLoadingMedications(true);
    try {
      // First, get the medical_rep_id
      const { data: medicalRep, error: repError } = await supabase
        .from("medical_reps")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (repError || !medicalRep) {
        console.error("Error fetching medical rep:", repError);
        setMedications([]);
        setLoadingMedications(false);
        return;
      }

      const medicalRepId = (medicalRep as { id: string }).id;

      // Fetch medications with joins
      const { data: medicationsData, error: medicationsError } = await supabase
        .from("medical_rep_medications")
        .select(
          `
            id,
            medical_rep_id,
            medication_dosage_id,
            notes,
            is_active,
            medication_dosages (
              id,
              strength_text,
              form,
              package_size,
              ndc_code,
              medications (
                id,
                brand_name,
                generic_name,
                manufacturer,
                therapeutic_class,
                route,
                form
              )
            )
          `
        )
        .eq("medical_rep_id", medicalRepId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (medicationsError) {
        console.error("Error fetching medications:", medicationsError);
        setMedications([]);
        setLoadingMedications(false);
        return;
      }

      // Transform the data to match our display interface
      const transformedMedications: MedicalRepMedicationDisplay[] = (
        medicationsData || []
      )
        .filter(
          (item: any) =>
            item.medication_dosages && item.medication_dosages.medications
        )
        .map((item: any) => {
          const dosage = item.medication_dosages;
          const medication = dosage?.medications;

          return {
            id: item.id,
            medical_rep_id: item.medical_rep_id,
            medication_dosage_id: item.medication_dosage_id,
            notes: item.notes,
            is_active: item.is_active,
            medication: {
              id: medication?.id || "",
              brand_name: medication?.brand_name || "",
              generic_name: medication?.generic_name || null,
              manufacturer: medication?.manufacturer || null,
              therapeutic_class: medication?.therapeutic_class || null,
              route: medication?.route || null,
              form: medication?.form || null,
            },
            dosage: {
              id: dosage?.id || "",
              strength_text: dosage?.strength_text || "",
              form: dosage?.form || null,
              package_size: dosage?.package_size || null,
              ndc_code: dosage?.ndc_code || null,
            },
          };
        });

      setMedications(transformedMedications);
    } catch (error) {
      console.error("Unexpected error fetching medications:", error);
      setMedications([]);
    } finally {
      setLoadingMedications(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [user]);

  // Expose add modal open function globally
  useEffect(() => {
    setOpenAddMedicationSheetFn(handleAddOpen);
    return () => {
      setOpenAddMedicationSheetFn(null);
    };
  }, [handleAddOpen]);

  // Listen for openAdd param
  useFocusEffect(
    React.useCallback(() => {
      if (params.openAdd === "true") {
        handleAddOpen();
        router.setParams({ openAdd: undefined });
      }
    }, [params.openAdd, router])
  );

  useEffect(() => {
    if (params.openAdd === "true") {
      handleAddOpen();
      router.setParams({ openAdd: undefined });
    }
  }, [params.openAdd, router]);

  // Fetch master medications list
  const fetchMasterMedications = async () => {
    setLoadingMasterMedications(true);
    try {
      const { data, error } = await supabase
        .from("medications")
        .select(
          `
          id,
          brand_name,
          generic_name,
          manufacturer,
          therapeutic_class,
          medication_dosages (
            id,
            strength_text,
            form,
            package_size
          )
        `
        )
        .eq("is_active", true)
        .order("brand_name", { ascending: true });

      if (error) {
        throw error;
      }

      // Transform data to flat list of medication options
      const options: MedicationOption[] = [];
      (data || []).forEach((med: any) => {
        const dosages = med.medication_dosages || [];
        if (dosages.length === 0) {
          // If no dosages, add medication without dosage
          options.push({
            medication_id: med.id,
            dosage_id: "",
            brand_name: med.brand_name,
            generic_name: med.generic_name,
            manufacturer: med.manufacturer,
            therapeutic_class: med.therapeutic_class,
            strength_text: "",
            form: null,
            package_size: null,
          });
        } else {
          dosages.forEach((dosage: any) => {
            if (dosage.is_active !== false) {
              options.push({
                medication_id: med.id,
                dosage_id: dosage.id,
                brand_name: med.brand_name,
                generic_name: med.generic_name,
                manufacturer: med.manufacturer,
                therapeutic_class: med.therapeutic_class,
                strength_text: dosage.strength_text,
                form: dosage.form,
                package_size: dosage.package_size,
              });
            }
          });
        }
      });

      setMasterMedications(options);
    } catch (error) {
      console.error("Error fetching master medications:", error);
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>
                Failed to load medications. Please try again.
              </ToastDescription>
            </Toast>
          );
        },
      });
    } finally {
      setLoadingMasterMedications(false);
    }
  };

  useEffect(() => {
    if (isAddModalOpen) {
      fetchMasterMedications();
    }
  }, [isAddModalOpen]);

  // Filter medications based on search query
  const filteredMedications = masterMedications.filter((med) => {
    const query = searchQuery.toLowerCase();
    return (
      med.brand_name.toLowerCase().includes(query) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(query)) ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(query))
    );
  });

  // Handle adding medication
  const handleAddMedication = async () => {
    if (!selectedMedicationDosage || !user) {
      return;
    }

    try {
      setAddingMedication(true);

      // Get medical_rep_id
      const { data: medicalRep, error: repError } = await supabase
        .from("medical_reps")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (repError || !medicalRep) {
        throw new Error("Medical rep not found");
      }

      const medicalRepId = (medicalRep as { id: string }).id;

      // Check if this medication dosage is already associated
      const { data: existing } = await supabase
        .from("medical_rep_medications")
        .select("id")
        .eq("medical_rep_id", medicalRepId)
        .eq("medication_dosage_id", selectedMedicationDosage.dosage_id)
        .eq("is_active", true)
        .maybeSingle();

      if (existing) {
        toast.show({
          placement: "top",
          render: ({ id }) => {
            return (
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Already Added</ToastTitle>
                <ToastDescription>
                  This medication is already in your list.
                </ToastDescription>
              </Toast>
            );
          },
        });
        setAddingMedication(false);
        return;
      }

      // Add the medication
      const { error } = await supabase.from("medical_rep_medications").insert({
        medical_rep_id: medicalRepId,
        medication_dosage_id: selectedMedicationDosage.dosage_id,
        notes: addNotes || null,
        is_active: true,
      } as never);

      if (error) {
        throw error;
      }

      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Medication Added</ToastTitle>
              <ToastDescription>
                {selectedMedicationDosage.brand_name} has been added to your
                list.
              </ToastDescription>
            </Toast>
          );
        },
      });

      handleAddClose();
      await fetchMedications();
    } catch (error: any) {
      console.error("Error adding medication:", error);
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Add Failed</ToastTitle>
              <ToastDescription>
                {error.message || "Failed to add medication. Please try again."}
              </ToastDescription>
            </Toast>
          );
        },
      });
    } finally {
      setAddingMedication(false);
    }
  };

  const handleEdit = (medication: MedicalRepMedicationDisplay) => {
    setEditingMedication(medication);
    setEditNotes(medication.notes || "");
    // Set initial selected dosage
    const initialDosage: MedicationOption = {
      medication_id: medication.medication.id,
      dosage_id: medication.dosage.id,
      brand_name: medication.medication.brand_name,
      generic_name: medication.medication.generic_name,
      manufacturer: medication.medication.manufacturer,
      therapeutic_class: medication.medication.therapeutic_class,
      strength_text: medication.dosage.strength_text,
      form: medication.dosage.form,
      package_size: medication.dosage.package_size,
    };
    setSelectedEditDosage(initialDosage);
    // Fetch available dosages for this medication
    fetchEditDosages(medication.medication.id);
  };

  const handleEditClose = () => {
    setEditingMedication(null);
    setEditNotes("");
    setSelectedEditDosage(null);
    setEditAvailableDosages([]);
  };

  // Fetch available dosages for editing
  const fetchEditDosages = async (medicationId: string) => {
    setLoadingEditDosages(true);
    try {
      const { data, error } = await supabase
        .from("medication_dosages")
        .select(
          `
          id,
          strength_text,
          form,
          package_size,
          medications (
            id,
            brand_name,
            generic_name,
            manufacturer,
            therapeutic_class
          )
        `
        )
        .eq("medication_id", medicationId)
        .eq("is_active", true)
        .order("strength_text", { ascending: true });

      if (error) {
        throw error;
      }

      // Transform to MedicationOption format
      const options: MedicationOption[] =
        (data || []).map((dosage: any) => ({
          medication_id: dosage.medications.id,
          dosage_id: dosage.id,
          brand_name: dosage.medications.brand_name,
          generic_name: dosage.medications.generic_name,
          manufacturer: dosage.medications.manufacturer,
          therapeutic_class: dosage.medications.therapeutic_class,
          strength_text: dosage.strength_text,
          form: dosage.form,
          package_size: dosage.package_size,
        })) || [];

      setEditAvailableDosages(options);
    } catch (error: any) {
      console.error("Error fetching edit dosages:", error);
    } finally {
      setLoadingEditDosages(false);
    }
  };

  const handleDelete = (medication: MedicalRepMedicationDisplay) => {
    Alert.alert(
      "Remove Medication",
      `Are you sure you want to remove ${medication.medication.brand_name} from your list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("medical_rep_medications")
                .update({ is_active: false } as never)
                .eq("id", medication.id);

              if (error) {
                throw error;
              }

              toast.show({
                placement: "top",
                render: ({ id }) => {
                  return (
                    <Toast
                      nativeID={`toast-${id}`}
                      action="success"
                      variant="solid"
                    >
                      <ToastTitle>Medication Removed</ToastTitle>
                      <ToastDescription>
                        {medication.medication.brand_name} has been removed from
                        your list.
                      </ToastDescription>
                    </Toast>
                  );
                },
              });

              // Refresh the list
              await fetchMedications();
            } catch (error: any) {
              console.error("Error removing medication:", error);
              toast.show({
                placement: "top",
                render: ({ id }) => {
                  return (
                    <Toast
                      nativeID={`toast-${id}`}
                      action="error"
                      variant="solid"
                    >
                      <ToastTitle>Error</ToastTitle>
                      <ToastDescription>
                        Failed to remove medication. Please try again.
                      </ToastDescription>
                    </Toast>
                  );
                },
              });
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingMedication || !selectedEditDosage) return;

    try {
      setSaving(true);

      // Check if the selected dosage is already in the user's list (excluding current)
      const existingMedication = medications.find(
        (med) =>
          med.medication.id === selectedEditDosage.medication_id &&
          med.dosage.id === selectedEditDosage.dosage_id &&
          med.id !== editingMedication.id
      );

      if (existingMedication) {
        toast.show({
          placement: "top",
          render: ({ id }) => {
            return (
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Duplicate Medication</ToastTitle>
                <ToastDescription>
                  This strength and package combination is already in your list.
                </ToastDescription>
              </Toast>
            );
          },
        });
        setSaving(false);
        return;
      }

      // Update medication dosage and notes
      const updateData: any = {
        notes: editNotes || null,
      };

      // Only update medication_dosage_id if it changed
      if (selectedEditDosage.dosage_id !== editingMedication.dosage.id) {
        updateData.medication_dosage_id = selectedEditDosage.dosage_id;
      }

      const { error } = await supabase
        .from("medical_rep_medications")
        .update(updateData as never)
        .eq("id", editingMedication.id);

      if (error) {
        throw error;
      }

      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Medication Updated</ToastTitle>
              <ToastDescription>
                {selectedEditDosage.dosage_id !== editingMedication.dosage.id
                  ? `${editingMedication.medication.brand_name} has been updated with new strength/package.`
                  : `Notes for ${editingMedication.medication.brand_name} have been updated.`}
              </ToastDescription>
            </Toast>
          );
        },
      });

      handleEditClose();
      await fetchMedications();
    } catch (error: any) {
      console.error("Error updating medication:", error);
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Update Failed</ToastTitle>
              <ToastDescription>
                Failed to update medication. Please try again.
              </ToastDescription>
            </Toast>
          );
        },
      });
    } finally {
      setSaving(false);
    }
  };

  if (user?.user_type !== "medical_rep") {
    return (
      <AnimatedTabScreen>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-base text-gray-600 text-center">
            Medications are only available for medical representatives.
          </Text>
        </View>
      </AnimatedTabScreen>
    );
  }

  return (
    <>
      <BottomSheet>
        <AnimatedTabScreen>
          <ScrollView className="flex-1 bg-gray-50">
            {loadingMedications ? (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#0086c9" />
              </View>
            ) : medications.length === 0 ? (
              <View className="bg-white p-6 mb-2">
                <Text className="text-base text-gray-600 text-center">
                  No medications listed
                </Text>
              </View>
            ) : (
              <View className="bg-white p-6 mb-2">
                {medications.map((med, index) => (
                  <View
                    key={med.id}
                    className="border border-gray-200 rounded-lg p-4"
                    style={{
                      marginBottom: index < medications.length - 1 ? 16 : 0,
                    }}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1" style={{ flexShrink: 1 }}>
                        <Text className="text-base font-semibold text-gray-900">
                          {med.medication.brand_name}
                        </Text>
                        {med.medication.generic_name && (
                          <Text className="text-sm text-gray-600 mt-1">
                            {med.medication.generic_name}
                          </Text>
                        )}
                      </View>
                      <View
                        className="flex-row gap-2 ml-2"
                        style={{ flexShrink: 0 }}
                      >
                        <TouchableOpacity
                          onPress={() => handleEdit(med)}
                          style={{ padding: 8 }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                        >
                          <Edit2 size={18} color="#0086c9" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(med)}
                          style={{ padding: 8 }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View className="mt-2">
                      {med.dosage.strength_text && (
                        <Text className="text-sm text-gray-600 mb-1">
                          <Text className="font-medium">Strength: </Text>
                          {med.dosage.strength_text}
                          {med.dosage.form && ` (${med.dosage.form})`}
                        </Text>
                      )}
                      {med.medication.manufacturer && (
                        <Text className="text-sm text-gray-600 mb-1">
                          <Text className="font-medium">Manufacturer: </Text>
                          {med.medication.manufacturer}
                        </Text>
                      )}
                      {med.medication.therapeutic_class && (
                        <Text className="text-sm text-gray-600 mb-1">
                          <Text className="font-medium">Class: </Text>
                          {med.medication.therapeutic_class}
                        </Text>
                      )}
                      {med.dosage.package_size && (
                        <Text className="text-sm text-gray-600 mb-1">
                          <Text className="font-medium">Package: </Text>
                          {med.dosage.package_size}
                        </Text>
                      )}
                      {med.notes && (
                        <Text className="text-sm text-gray-600 mt-2 italic">
                          {med.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Edit Medication Modal */}
          <Modal
            visible={!!editingMedication}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleEditClose}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
              <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
                  <TouchableOpacity onPress={handleEditClose} className="p-2">
                    <X size={24} color="#111827" />
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-gray-900">
                    Edit Medication
                  </Text>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    disabled={saving}
                    className="p-2"
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#0086c9" />
                    ) : (
                      <Text
                        style={{
                          color: "#0086c9",
                          fontWeight: "600",
                          fontSize: 16,
                        }}
                      >
                        Save
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Content */}
                {editingMedication && (
                  <ScrollView className="flex-1">
                    <View className="px-4 py-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-2">
                        {editingMedication.medication.brand_name}
                      </Text>
                      {editingMedication.medication.generic_name && (
                        <Text className="text-sm text-gray-600 mb-4">
                          {editingMedication.medication.generic_name}
                        </Text>
                      )}

                      {/* Dosage Selection */}
                      <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                          Strength & Package
                        </Text>
                        {loadingEditDosages ? (
                          <View className="py-4">
                            <ActivityIndicator size="small" color="#0086c9" />
                          </View>
                        ) : editAvailableDosages.length === 0 ? (
                          <Text className="text-sm text-gray-500">
                            No other dosages available
                          </Text>
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-2"
                          >
                            <View className="flex-row gap-2">
                              {editAvailableDosages.map((dosage) => {
                                const isSelected =
                                  selectedEditDosage?.dosage_id ===
                                  dosage.dosage_id;
                                return (
                                  <TouchableOpacity
                                    key={dosage.dosage_id}
                                    onPress={() =>
                                      setSelectedEditDosage(dosage)
                                    }
                                    className={`border rounded-lg p-3 ${
                                      isSelected
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white"
                                    }`}
                                    style={{ minWidth: 120 }}
                                  >
                                    <View>
                                      <Text
                                        className={`text-sm font-medium ${
                                          isSelected
                                            ? "text-blue-900"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        {dosage.strength_text}
                                        {dosage.form && ` (${dosage.form})`}
                                      </Text>
                                      {dosage.package_size && (
                                        <Text
                                          className={`text-xs mt-1 ${
                                            isSelected
                                              ? "text-blue-700"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          {dosage.package_size}
                                        </Text>
                                      )}
                                      {isSelected && (
                                        <View className="mt-2 items-center">
                                          <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                                            <Text className="text-white text-xs font-bold">
                                              ✓
                                            </Text>
                                          </View>
                                        </View>
                                      )}
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </ScrollView>
                        )}
                        {selectedEditDosage && (
                          <Text className="text-xs text-gray-500 mt-1">
                            Selected: {selectedEditDosage.strength_text}
                            {selectedEditDosage.form &&
                              ` (${selectedEditDosage.form})`}
                            {selectedEditDosage.package_size &&
                              ` • ${selectedEditDosage.package_size}`}
                          </Text>
                        )}
                      </View>

                      <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                          Notes
                        </Text>
                        <TextInput
                          value={editNotes}
                          onChangeText={setEditNotes}
                          placeholder="Add notes about this medication..."
                          multiline
                          numberOfLines={4}
                          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-900"
                          style={{
                            backgroundColor: "#F9FAFB",
                            borderColor: "#E5E7EB",
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            fontSize: 16,
                            color: "#111827",
                            minHeight: 100,
                            textAlignVertical: "top",
                          }}
                        />
                      </View>
                    </View>
                  </ScrollView>
                )}
              </View>
            </SafeAreaView>
          </Modal>
        </AnimatedTabScreen>
      </BottomSheet>

      {/* Add Medication Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleAddClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <AddMedicationModalContent
            onClose={handleAddClose}
            selectedMedicationDosage={selectedMedicationDosage}
            setSelectedMedicationDosage={setSelectedMedicationDosage}
            addNotes={addNotes}
            setAddNotes={setAddNotes}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loadingMasterMedications={loadingMasterMedications}
            filteredMedications={filteredMedications}
            addingMedication={addingMedication}
            handleAddMedication={handleAddMedication}
            fetchMasterMedications={fetchMasterMedications}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

// Add Medication Modal Content
function AddMedicationModalContent({
  onClose,
  selectedMedicationDosage,
  setSelectedMedicationDosage,
  addNotes,
  setAddNotes,
  searchQuery,
  setSearchQuery,
  loadingMasterMedications,
  filteredMedications,
  addingMedication,
  handleAddMedication,
  fetchMasterMedications,
}: {
  onClose: () => void;
  selectedMedicationDosage: MedicationOption | null;
  setSelectedMedicationDosage: (med: MedicationOption | null) => void;
  addNotes: string;
  setAddNotes: (notes: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadingMasterMedications: boolean;
  filteredMedications: MedicationOption[];
  addingMedication: boolean;
  handleAddMedication: () => Promise<void>;
  fetchMasterMedications: () => Promise<void>;
}) {
  useEffect(() => {
    fetchMasterMedications();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* Fixed Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={onClose} className="p-2">
          <X size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          Add Medication
        </Text>
        <TouchableOpacity
          onPress={handleAddMedication}
          disabled={!selectedMedicationDosage || addingMedication}
          className="p-2"
        >
          {addingMedication ? (
            <ActivityIndicator size="small" color="#0086c9" />
          ) : (
            <Text
              style={{
                color: selectedMedicationDosage ? "#0086c9" : "#9CA3AF",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Add
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Fixed Search */}
      <View className="px-4 py-4 border-b border-gray-200">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search medications..."
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-900"
          style={{
            backgroundColor: "#F9FAFB",
            borderColor: "#E5E7EB",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: "#111827",
          }}
        />
      </View>

      {/* Scrollable Medication List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
      >
        {loadingMasterMedications ? (
          <View style={{ paddingVertical: 48 }}>
            <ActivityIndicator size="large" color="#0086c9" />
          </View>
        ) : filteredMedications.length === 0 ? (
          <View style={{ paddingVertical: 48, paddingHorizontal: 16 }}>
            <Text className="text-center text-gray-500">
              {searchQuery
                ? "No medications found matching your search"
                : "No medications available"}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            {filteredMedications.map((med, index) => {
              const isSelected =
                selectedMedicationDosage?.dosage_id === med.dosage_id;
              return (
                <TouchableOpacity
                  key={`${med.medication_id}-${med.dosage_id}-${index}`}
                  onPress={() => setSelectedMedicationDosage(med)}
                  className={`border rounded-lg p-4 mb-3 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold ${
                          isSelected ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {med.brand_name}
                      </Text>
                      {med.generic_name && (
                        <Text
                          className={`text-sm mt-1 ${
                            isSelected ? "text-blue-700" : "text-gray-600"
                          }`}
                        >
                          {med.generic_name}
                        </Text>
                      )}
                      {med.strength_text && (
                        <Text
                          className={`text-sm mt-1 ${
                            isSelected ? "text-blue-700" : "text-gray-600"
                          }`}
                        >
                          {med.strength_text}
                          {med.form && ` (${med.form})`}
                        </Text>
                      )}
                      {med.manufacturer && (
                        <Text
                          className={`text-xs mt-1 ${
                            isSelected ? "text-blue-600" : "text-gray-500"
                          }`}
                        >
                          {med.manufacturer}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <View className="ml-2">
                        <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
                          <Text className="text-white text-xs font-bold">
                            ✓
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Fixed Notes Section */}
      {selectedMedicationDosage && (
        <View className="px-4 py-4 border-t border-gray-200 bg-white">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Notes (Optional)
          </Text>
          <TextInput
            value={addNotes}
            onChangeText={setAddNotes}
            placeholder="Add notes about this medication..."
            multiline
            numberOfLines={3}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-900"
            style={{
              backgroundColor: "#F9FAFB",
              borderColor: "#E5E7EB",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: "#111827",
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>
      )}
    </View>
  );
}

export default MedicationsScreen;
