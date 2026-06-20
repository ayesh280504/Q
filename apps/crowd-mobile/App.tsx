import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useCrowdFonts } from "./src/hooks/useCrowdFonts";
import HomeScreen from "./src/screens/HomeScreen";
import NearbyScreen from "./src/screens/NearbyScreen";
import RequestScreen from "./src/screens/RequestScreen";
import { crowdRequestUrl } from "./src/ble/nearbyScan";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "./src/theme";

type Screen = "home" | "nearby" | "request";

export default function App() {
  const fontsLoaded = useCrowdFonts();
  const [screen, setScreen] = useState<Screen>("home");
  const [code, setCode] = useState("");
  const [requestUrl, setRequestUrl] = useState<string | null>(null);

  function joinWithCode(sessionCode: string) {
    const c = sessionCode.trim().toUpperCase();
    setCode(c);
    setRequestUrl(crowdRequestUrl(c));
    setScreen("request");
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.pink} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === "home" && (
        <HomeScreen
          code={code}
          onCode={setCode}
          onNearby={() => setScreen("nearby")}
          onJoin={() => joinWithCode(code)}
        />
      )}
      {screen === "nearby" && (
        <NearbyScreen onJoin={joinWithCode} onBack={() => setScreen("home")} />
      )}
      {screen === "request" && requestUrl && code && (
        <RequestScreen url={requestUrl} sessionCode={code} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
});
