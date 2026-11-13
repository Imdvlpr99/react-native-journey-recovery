import { useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import {
  RecoveryProvider,
  useJourney,
  useRecovery,
  type RecoveryEvent,
  type StorageAdapter,
} from 'react-native-journey-recovery';

type Step = 'shipping' | 'delivery' | 'payment' | 'review';

type Checkout = {
  step: Step;
  name: string;
  street: string;
  city: string;
  delivery: 'standard' | 'express';
  cardNumber: string; // excluded from every checkpoint
};

const STEPS: Step[] = ['shipping', 'delivery', 'payment', 'review'];
const TITLES: Record<Step, string> = {
  shipping: 'Shipping address',
  delivery: 'Delivery',
  payment: 'Payment',
  review: 'Review order',
};
const EMPTY: Checkout = { step: 'shipping', name: '', street: '', city: '', delivery: 'standard', cardNumber: '' };
const PRICE = 129;
const SHIPPING = { standard: 0, express: 9 };

/* ------------------------------------------------------------------ */
/* App root                                                            */
/* ------------------------------------------------------------------ */

export function App({ storage, onRecovery }: { storage: StorageAdapter; onRecovery?: (e: RecoveryEvent) => void }) {
  return (
    <RecoveryProvider
      storage={storage}
      onRecovery={onRecovery}
      options={{
        appState: AppState, // flush pending saves when the app backgrounds
        autoSave: true,
        debounceMs: 400,
        defaultExpiry: 10 * 60 * 1000, // 10 minutes
      }}
    >
      <CheckoutScreen />
    </RecoveryProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Checkout screen                                                     */
/* ------------------------------------------------------------------ */

function CheckoutScreen() {
  const recovery = useRecovery<Checkout>('checkout');
  const journey = useJourney<Checkout>('checkout');

  const [form, setForm] = useState<Checkout>(EMPTY);
  const [decided, setDecided] = useState(false); // user answered the resume prompt
  const [ordered, setOrdered] = useState(false);

  // Every change is checkpointed (debounced). The card number never reaches storage.
  const update = (patch: Partial<Checkout>) => {
    const next = { ...form, ...patch };
    setForm(next);
    journey.checkpoint(next, { exclude: ['cardNumber'] });
  };

  const stepIndex = STEPS.indexOf(form.step);
  const goTo = (offset: number) => update({ step: STEPS[stepIndex + offset] });

  const placeOrder = async () => {
    await journey.clear(); // done: nothing left to resume
    setOrdered(true);
  };

  // 1. Checking storage
  if (recovery.status === 'checking') {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  // 2. A valid checkpoint exists: offer to resume
  if (!decided && recovery.available && recovery.snapshot) {
    const saved = recovery.snapshot.data;
    return (
      <Prompt
        title="Pick up where you left off?"
        body={`You started a checkout ${timeAgo(recovery.updatedAt)}. You were on step ${
          STEPS.indexOf(saved.step) + 1
        } of 4: ${TITLES[saved.step].toLowerCase()}.`}
        primary="Resume checkout"
        onPrimary={async () => {
          const data = await recovery.restore();
          setForm({ ...EMPTY, ...data });
          setDecided(true);
        }}
        secondary="Start over"
        onSecondary={async () => {
          await recovery.discard();
          setDecided(true);
        }}
      />
    );
  }

  // 3. A checkpoint exists but cannot be trusted
  if (!decided && (recovery.status === 'expired' || recovery.status === 'invalid')) {
    const expired = recovery.status === 'expired';
    const code = (recovery.error as { code?: string } | null)?.code;
    return (
      <Prompt
        tone="warn"
        title={expired ? 'Your saved checkout expired' : "We couldn't restore your checkout"}
        body={
          expired
            ? 'Saved progress is kept for 10 minutes. Please start again.'
            : `The saved data failed its integrity check${code ? ` (${code})` : ''}, so it was not restored.`
        }
        primary="Start a new checkout"
        onPrimary={async () => {
          await recovery.discard();
          setDecided(true);
        }}
      />
    );
  }

  // 4. Order placed
  if (ordered) {
    return (
      <View style={[styles.screen, styles.center, styles.pad]}>
        <View style={styles.successMark}>
          <Text style={styles.successTick}>✓</Text>
        </View>
        <Text style={styles.h1}>Order placed</Text>
        <Text style={[styles.muted, styles.textCenter]}>The checkpoint was cleared, so there is nothing to resume.</Text>
        <Button
          label="Start a new checkout"
          onPress={() => {
            setForm(EMPTY);
            setOrdered(false);
          }}
          style={styles.mtLarge}
        />
      </View>
    );
  }

  // 5. The checkout flow
  const canContinue =
    form.step === 'shipping'
      ? Boolean(form.name && form.street && form.city)
      : form.step === 'payment'
        ? form.cardNumber.replace(/\D/g, '').length >= 12
        : true;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Step {stepIndex + 1} of 4</Text>
        <Text style={styles.h1}>{TITLES[form.step]}</Text>
        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.progressBar, i <= stepIndex && styles.progressBarOn]} />
          ))}
        </View>
        <Text style={styles.saved} aria-live="polite">
          {journey.status === 'active' ? 'Progress saved on this device' : ' '}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        {form.step === 'shipping' && (
          <>
            <Field label="Full name" value={form.name} onChangeText={(name) => update({ name })} placeholder="Ada Lovelace" />
            <Field label="Street" value={form.street} onChangeText={(street) => update({ street })} placeholder="12 Analytical Way" />
            <Field label="City" value={form.city} onChangeText={(city) => update({ city })} placeholder="London" />
          </>
        )}

        {form.step === 'delivery' && (
          <>
            <Option
              title="Standard"
              detail="3–5 business days · Free"
              selected={form.delivery === 'standard'}
              onPress={() => update({ delivery: 'standard' })}
            />
            <Option
              title="Express"
              detail="Next business day · $9"
              selected={form.delivery === 'express'}
              onPress={() => update({ delivery: 'express' })}
            />
          </>
        )}

        {form.step === 'payment' && (
          <>
            <Field
              label="Card number"
              value={form.cardNumber}
              onChangeText={(cardNumber) => update({ cardNumber })}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              maxLength={19}
            />
            <View style={styles.note}>
              <Text style={styles.noteText}>
                The card number is excluded from checkpoints. If you resume later, you will be asked for it again.
              </Text>
            </View>
          </>
        )}

        {form.step === 'review' && (
          <View style={styles.card}>
            <Row label="Trail Runner 2" value={`$${PRICE}`} />
            <Row label={`Delivery (${form.delivery})`} value={`$${SHIPPING[form.delivery]}`} />
            <View style={styles.divider} />
            <Row label="Total" value={`$${PRICE + SHIPPING[form.delivery]}`} strong />
            <Text style={[styles.muted, styles.mtLarge]}>
              Ship to {form.name}, {form.street}, {form.city}
            </Text>
            <Text style={styles.muted}>Card ending {form.cardNumber.replace(/\D/g, '').slice(-4) || '····'}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {stepIndex > 0 && <Button label="Back" variant="secondary" onPress={() => goTo(-1)} style={styles.flex1} />}
        {form.step === 'review' ? (
          <Button label="Place order" onPress={placeOrder} style={styles.flex2} />
        ) : (
          <Button label="Continue" disabled={!canContinue} onPress={() => goTo(1)} style={styles.flex2} />
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* UI pieces                                                           */
/* ------------------------------------------------------------------ */

function Prompt(props: {
  title: string;
  body: string;
  primary: string;
  onPrimary: () => void;
  secondary?: string;
  onSecondary?: () => void;
  tone?: 'default' | 'warn';
}) {
  return (
    <View style={[styles.screen, styles.center, styles.pad]}>
      <View style={[styles.card, styles.prompt]}>
        <View style={[styles.badge, props.tone === 'warn' && styles.badgeWarn]}>
          <Text style={[styles.badgeText, props.tone === 'warn' && styles.badgeTextWarn]}>
            {props.tone === 'warn' ? '!' : '↺'}
          </Text>
        </View>
        <Text style={styles.h2}>{props.title}</Text>
        <Text style={styles.muted}>{props.body}</Text>
        <Button label={props.primary} onPress={props.onPrimary} style={styles.mtLarge} />
        {props.secondary && props.onSecondary && (
          <Button label={props.secondary} variant="secondary" onPress={props.onSecondary} style={styles.mtSmall} />
        )}
      </View>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        aria-label={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={COLORS.placeholder}
        inputMode={props.inputMode}
        maxLength={props.maxLength}
        style={styles.input}
      />
    </View>
  );
}

function Option(props: { title: string; detail: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      role="radio"
      aria-selected={props.selected}
      onPress={props.onPress}
      style={[styles.option, props.selected && styles.optionOn]}
    >
      <View style={[styles.radio, props.selected && styles.radioOn]}>
        {props.selected && <View style={styles.radioDot} />}
      </View>
      <View style={styles.flex1}>
        <Text style={styles.optionTitle}>{props.title}</Text>
        <Text style={styles.muted}>{props.detail}</Text>
      </View>
    </Pressable>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.rowStrong : styles.rowLabel}>{label}</Text>
      <Text style={strong ? styles.rowStrong : styles.rowLabel}>{value}</Text>
    </View>
  );
}

function Button(props: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const secondary = props.variant === 'secondary';
  return (
    <Pressable
      role="button"
      onPress={props.onPress}
      disabled={props.disabled}
      aria-disabled={props.disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        props.disabled && styles.buttonDisabled,
        pressed && !props.disabled && styles.buttonPressed,
        props.style,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{props.label}</Text>
    </Pressable>
  );
}

function timeAgo(timestamp?: number): string {
  if (!timestamp) return 'earlier';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)} min ago`;
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const COLORS = {
  bg: '#F5F6F8',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#5B6779',
  border: '#E2E8F0',
  placeholder: '#94A3B8',
  accent: '#15803D',
  accentSoft: '#DCFCE7',
  warn: '#B45309',
  warnSoft: '#FEF3C7',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 20 },
  body: { flex: 1 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  textCenter: { textAlign: 'center' },
  mtSmall: { marginTop: 8 },
  mtLarge: { marginTop: 20 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  eyebrow: { fontSize: 12, fontWeight: '600', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  h1: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 4, marginBottom: 6 },
  h2: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  muted: { fontSize: 14, lineHeight: 20, color: COLORS.muted },
  saved: { fontSize: 12, color: COLORS.muted, marginTop: 8, minHeight: 16 },

  progress: { flexDirection: 'row', gap: 4, marginTop: 4 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressBarOn: { backgroundColor: COLORS.accent },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { height: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.card },

  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.card, marginBottom: 12 },
  optionOn: { borderColor: COLORS.accent, backgroundColor: '#F7FDF9' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.placeholder, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: COLORS.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },

  note: { padding: 12, borderRadius: 10, backgroundColor: COLORS.accentSoft },
  noteText: { fontSize: 13, lineHeight: 19, color: '#14532D' },

  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  prompt: { width: '100%', alignItems: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 15, color: COLORS.text },
  rowStrong: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },

  badge: { alignSelf: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  badgeWarn: { backgroundColor: COLORS.warnSoft },
  badgeText: { fontSize: 22, fontWeight: '700', color: COLORS.accent },
  badgeTextWarn: { color: COLORS.warn },

  successMark: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTick: { fontSize: 30, fontWeight: '700', color: COLORS.accent },

  footer: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderColor: COLORS.border },
  button: { height: 48, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonSecondary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  buttonTextSecondary: { color: COLORS.text },
});
