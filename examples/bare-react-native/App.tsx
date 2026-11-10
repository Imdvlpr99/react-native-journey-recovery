import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  RecoveryProvider,
  useJourney,
  useRecovery,
  MemoryStorageAdapter,
} from 'react-native-journey-recovery';

// In bare React Native apps:
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AsyncStorageAdapter } from 'react-native-journey-recovery';
// const storage = new AsyncStorageAdapter(AsyncStorage);
const storage = new MemoryStorageAdapter();

interface KycJourneyData {
  step: 'id_verification' | 'address' | 'confirmation';
  fullName: string;
  idNumber: string;
  street: string;
  city: string;
  country: string;
}

function KycForm() {
  const recovery = useRecovery<KycJourneyData>('kyc-verification');
  const journey = useJourney<KycJourneyData>('kyc-verification', {
    version: 1,
    expiry: 72 * 60 * 60 * 1000, // 3 days
  });

  const [step, setStep] = useState<KycJourneyData['step']>('id_verification');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Recovery Prompt Banner
  if (recovery.available && recovery.snapshot && step === 'id_verification' && !fullName) {
    return (
      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>Resume Your KYC Application?</Text>
        <Text style={styles.promptSubtitle}>
          We found unfinished verification details saved earlier.
        </Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={async () => {
              const restored = await recovery.restore();
              setStep(restored.step);
              setFullName(restored.fullName);
              setIdNumber(restored.idNumber);
              setStreet(restored.street);
              setCity(restored.city);
              setCountry(restored.country);
            }}
          >
            <Text style={styles.btnPrimaryText}>Resume Verification</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => recovery.discard()}
          >
            <Text style={styles.btnSecondaryText}>Start Fresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Documents Submitted!</Text>
        <Text style={styles.subtitle}>Your identity is under review.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Identity Verification (KYC)</Text>
      <Text style={styles.step}>Current Step: {step}</Text>

      {step === 'id_verification' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Legal Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
          />
          <Text style={styles.label}>National ID / Passport Number</Text>
          <TextInput
            style={styles.input}
            placeholder="A1234567"
            value={idNumber}
            onChangeText={setIdNumber}
          />
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={async () => {
              await journey.checkpoint({
                step: 'address',
                fullName,
                idNumber,
                street,
                city,
                country,
              });
              setStep('address');
            }}
          >
            <Text style={styles.btnPrimaryText}>Next: Residential Address</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'address' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Street Address</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Financial Way"
            value={street}
            onChangeText={setStreet}
          />
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="New York"
            value={city}
            onChangeText={setCity}
          />
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            placeholder="United States"
            value={country}
            onChangeText={setCountry}
          />
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={async () => {
              await journey.checkpoint({
                step: 'confirmation',
                fullName,
                idNumber,
                street,
                city,
                country,
              });
              setStep('confirmation');
            }}
          >
            <Text style={styles.btnPrimaryText}>Review & Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'confirmation' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Review Details</Text>
          <Text style={styles.reviewItem}>Name: {fullName}</Text>
          <Text style={styles.reviewItem}>ID: {idNumber}</Text>
          <Text style={styles.reviewItem}>Address: {street}, {city}, {country}</Text>

          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: '#2e7d32' }]}
            onPress={async () => {
              // Final submission: clear checkpoint
              await journey.clear();
              setSubmitted(true);
            }}
          >
            <Text style={styles.btnPrimaryText}>Confirm & Submit Identity</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <RecoveryProvider
        storage={storage}
        options={{
          userId: 'user_active_session',
          flushOnBackground: true,
        }}
      >
        <KycForm />
      </RecoveryProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#4b5563', marginTop: 4 },
  step: { fontSize: 13, color: '#6366f1', fontWeight: '600', marginBottom: 16 },
  formGroup: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  btnPrimary: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  btnSecondary: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSecondaryText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  promptCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  promptTitle: { fontSize: 17, fontWeight: '700', color: '#312e81', marginBottom: 4 },
  promptSubtitle: { fontSize: 14, color: '#4338ca', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  reviewItem: { fontSize: 15, color: '#1f2937', marginVertical: 3 },
});

