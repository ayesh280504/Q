import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import ShareQrFab from "../components/ShareQrFab";
import { colors } from "../theme";

type Props = {
  url: string;
  sessionCode: string;
};

export default function RequestScreen({ url, sessionCode }: Props) {
  return (
    <View style={styles.root}>
      <WebView
        source={{ uri: url }}
        style={styles.web}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        setSupportMultipleWindows={false}
      />
      <ShareQrFab sessionCode={sessionCode} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  web: { flex: 1, backgroundColor: colors.bg },
});
