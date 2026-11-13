/**
 * Minimal typings for the subset of React Native the playground uses.
 * At build time `react-native` is aliased to `react-native-web`. The full `react-native`
 * type package is not installed for the docs site, so only what the demo needs is declared here.
 */
declare module 'react-native' {
  import type { ComponentType, ReactNode } from 'react';

  type StyleValue = { [key: string]: string | number | undefined | StyleValue | StyleValue[] };
  export type ViewStyle = StyleValue;
  export type StyleProp = StyleValue | false | null | undefined | readonly StyleProp[];

  interface BaseProps {
    style?: StyleProp;
    testID?: string;
    role?: string;
    'aria-label'?: string;
    'aria-live'?: 'polite' | 'assertive' | 'off';
    children?: ReactNode;
  }

  export const View: ComponentType<BaseProps>;
  export const Text: ComponentType<BaseProps & { numberOfLines?: number; selectable?: boolean }>;
  export const ScrollView: ComponentType<
    BaseProps & { contentContainerStyle?: StyleProp; keyboardShouldPersistTaps?: 'always' | 'handled' | 'never' }
  >;
  export const ActivityIndicator: ComponentType<BaseProps & { color?: string; size?: 'small' | 'large' | number }>;
  export const TextInput: ComponentType<
    BaseProps & {
      value?: string;
      onChangeText?: (text: string) => void;
      placeholder?: string;
      placeholderTextColor?: string;
      inputMode?: 'text' | 'numeric' | 'email' | 'tel';
      autoComplete?: string;
      maxLength?: number;
    }
  >;
  export const Pressable: ComponentType<
    Omit<BaseProps, 'style'> & {
      onPress?: () => void;
      disabled?: boolean;
      'aria-selected'?: boolean;
      'aria-disabled'?: boolean;
      style?: StyleProp | ((state: { pressed: boolean; hovered?: boolean; focused?: boolean }) => StyleProp);
    }
  >;
  export const StyleSheet: {
    create<T extends Record<string, StyleValue>>(styles: T): T;
    hairlineWidth: number;
  };
  export const AppState: {
    currentState: string;
    addEventListener(type: 'change', listener: (state: string) => void): { remove: () => void };
  };
}

declare module '*?raw' {
  const content: string;
  export default content;
}
