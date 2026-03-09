import { createAtom } from "~/lib/atomic-zustand";
import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";

export default createAtom(({ set, get }) => {
  const init = async () => {
    try {
      const wizardCompleted = await AsyncStorage.getItem(
        STORAGE_KEYS.PERMISSION_WIZARD_COMPLETED,
      );
      if (wizardCompleted === "true") {
        set("completed", true);
      }
    } catch (error) {
      console.error("Error initializing permission wizard:", error);
    }
  };

  return {
    default: {
      completed: false,
      currentStep: "welcome", // 'welcome' or 'hero'
      basicPermissionsGranted: false,
      heroPermissionsGranted: false,
    },
    actions: {
      init,
      setCompleted: (completed) => {
        set("completed", completed);
        if (completed) {
          AsyncStorage.setItem(
            STORAGE_KEYS.PERMISSION_WIZARD_COMPLETED,
            "true",
          ).catch((error) => {
            console.error("Error saving permission wizard status:", error);
          });
        }
      },
      setCurrentStep: (step) => set("currentStep", step),
      setBasicPermissionsGranted: (granted) =>
        set("basicPermissionsGranted", granted),
      setHeroPermissionsGranted: (granted) =>
        set("heroPermissionsGranted", granted),
      reset: () => {
        set("completed", false);
        set("currentStep", "welcome");
        set("basicPermissionsGranted", false);
        set("heroPermissionsGranted", false);
      },
    },
  };
});
