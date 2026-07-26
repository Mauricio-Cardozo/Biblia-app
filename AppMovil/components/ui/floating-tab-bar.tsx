import { C } from "@/constants/theme";
import { Animated, TouchableOpacity, View, StyleSheet } from "react-native";
import { IconSymbol } from "./icon-symbol";
import { tabBarScrollY } from "@/utils/scroll-state";
import { useEffect, useRef } from "react";

// ponytail: local types instead of @react-navigation/* imports (not direct deps)
interface TabBarState { routes: { key: string; name: string; params?: object }[]; index: number }
interface TabBarProps {
  state: TabBarState;
  descriptors: Record<string, object>;
  navigation: { emit: (e: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean }; navigate: (name: string, params?: object) => void };
}

const VISIBLE_TABS = ["index", "biblia", "calendario", "oracion"];
const HIDE_THRESHOLD = 50;
const ICONS: Record<string, string> = {
  index: "house.fill",
  biblia: "book.closed.fill",
  calendario: "calendar",
  oracion: "hands.sparkles",
};

export default function FloatingTabBar({ state, navigation }: TabBarProps) {
  const [translateY] = useState(() => new Animated.Value(0));
  const prevScrollY = useRef(0);
  const hidden = useRef(false);

  useEffect(() => {
    const listener = tabBarScrollY.addListener(({ value }) => {
      const diff = value - prevScrollY.current;
      if (value > HIDE_THRESHOLD && diff > 3 && !hidden.current) {
        hidden.current = true;
        Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }).start();
      } else if ((diff < -3 || value < HIDE_THRESHOLD) && hidden.current) {
        hidden.current = false;
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
      prevScrollY.current = value;
    });
    return () => tabBarScrollY.removeListener(listener);
  }, [translateY]);

  return (
    <Animated.View style={[s.outer, { transform: [{ translateY }] }]}>
      <View style={s.inner}>
        {state.routes.filter((r) => VISIBLE_TABS.includes(r.name)).map((route) => {
          const isFocused = state.index === state.routes.findIndex((r) => r.name === route.name);
          const iconName = ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={s.tab} activeOpacity={0.7} accessibilityLabel={route.name}>
              <IconSymbol name={iconName as any} size={22} color={isFocused ? C.gold : C.muted} />
              <View style={[s.dot, isFocused && s.dotActive]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
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
