import { C } from "@/constants/theme";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "./icon-symbol";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const VISIBLE_TABS = ["index", "biblia", "calendario", "oracion"];
const ICONS: Record<string, string> = {
  index: "house.fill",
  biblia: "book.closed.fill",
  calendario: "calendar",
  oracion: "hands.sparkles",
};

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={s.outer}>
      <View style={s.inner}>
        {state.routes.filter((r) => VISIBLE_TABS.includes(r.name)).map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex((r) => r.name === route.name);
          const iconName = ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={s.tab} activeOpacity={0.7}>
              <IconSymbol name={iconName as any} size={22} color={isFocused ? C.gold : C.muted} />
              <View style={[s.dot, isFocused && s.dotActive]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  inner: {
    flexDirection: "row", borderRadius: 24, overflow: "hidden",
    backgroundColor: "rgba(13,27,42,0.94)",
    borderWidth: 1, borderColor: C.goldDim,
    paddingVertical: 8,
  },
  tab: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 4, gap: 2,
  },
  dot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: "transparent",
  },
  dotActive: { backgroundColor: C.gold },
});
