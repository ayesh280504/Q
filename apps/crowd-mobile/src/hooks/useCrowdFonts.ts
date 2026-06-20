import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";

export function useCrowdFonts() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });
  return loaded;
}
