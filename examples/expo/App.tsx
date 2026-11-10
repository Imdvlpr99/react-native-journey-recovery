import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  RecoveryProvider,
  useJourney,
  useRecovery,
  MemoryStorageAdapter,
} from 'react-native-journey-recovery';

// In production Expo apps, use:
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AsyncStorageAdapter } from 'react-native-journey-recovery';
// const storage = new AsyncStorageAdapter(AsyncStorage);
const storage = new MemoryStorageAdapter();

interface BookingState {
  step: 'destination' | 'passengers' | 'review';
  city: string;
  travelDate: string;
  passengerName: string;
  passengerEmail: string;
}

function BookingScreen() {
  const recovery = useRecovery<BookingState>('flight-booking');
  const journey = useJourney<BookingState>('flight-booking', {
    version: 1,
    expiry: 24 * 60 * 60 * 1000, // 24 hours
  });

  const [step, setStep] = useState<BookingState['step']>('destination');
  const [city, setCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Resume prompt banner if previous booking session exists
  if (recovery.available && recovery.snapshot && step === 'destination' && !city) {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>✈️ Resume Unfinished Booking?</Text>
        <Text style={styles.bannerSubtitle}>
          You have an interrupted booking for {recovery.snapshot.data.city || 'your trip'}.
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              const data = await recovery.restore();
              setStep(data.step);
              setCity(data.city);
              setTravelDate(data.travelDate);
              setPassengerName(data.passengerName);
              setPassengerEmail(data.passengerEmail);
            }}
          >
            <Text style={styles.primaryButtonText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => recovery.discard()}
          >
            <Text style={styles.secondaryButtonText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (confirmed) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>🎉 Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Destination: {city}</Text>
        <Text style={styles.subtitle}>Passenger: {passengerName}</Text>
        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 20 }]}
          onPress={() => {
            setConfirmed(false);
            setStep('destination');
            setCity('');
            setTravelDate('');
            setPassengerName('');
            setPassengerEmail('');
          }}
        >
          <Text style={styles.primaryButtonText}>Book Another Flight</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Flight Booking Wizard</Text>
      <Text style={styles.stepIndicator}>Step: {step.toUpperCase()}</Text>

      {step === 'destination' && (
        <View style={styles.formSection}>
          <Text style={styles.label}>Destination City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tokyo, Paris"
            value={city}
            onChangeText={setCity}
          />
          <Text style={styles.label}>Travel Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={travelDate}
            onChangeText={setTravelDate}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              await journey.checkpoint({
                step: 'passengers',
                city,
                travelDate,
                passengerName,
                passengerEmail,
              });
              setStep('passengers');
            }}
          >
            <Text style={styles.primaryButtonText}>Continue to Passenger Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'passengers' && (
        <View style={styles.formSection}>
          <Text style={styles.label}>Passenger Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={passengerName}
            onChangeText={setPassengerName}
          />
          <Text style={styles.label}>Contact Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={passengerEmail}
            onChangeText={setPassengerEmail}
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              await journey.checkpoint({
                step: 'review',
                city,
                travelDate,
                passengerName,
                passengerEmail,
              });
              setStep('review');
            }}
          >
            <Text style={styles.primaryButtonText}>Review Reservation</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'review' && (
        <View style={styles.formSection}>
          <Text style={styles.label}>Review Summary</Text>
          <Text style={styles.summaryText}>Destination: {city}</Text>
          <Text style={styles.summaryText}>Date: {travelDate}</Text>
          <Text style={styles.summaryText}>Passenger: {passengerName} ({passengerEmail})</Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#2e7d32' }]}
            onPress={async () => {
              // Clear journey snapshot upon successful completion
              await journey.clear();
              setConfirmed(true);
            }}
          >
            <Text style={styles.primaryButtonText}>Confirm & Book</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <RecoveryProvider storage={storage}>
        <BookingScreen />
      </RecoveryProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { padding: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4a4a4a', marginTop: 4 },
  stepIndicator: { fontSize: 14, fontWeight: '600', color: '#0066cc', marginBottom: 20 },
  formSection: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
    marginTop: 10,
  },
  secondaryButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
  banner: {
    margin: 20,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: '#0d47a1', marginBottom: 4 },
  bannerSubtitle: { fontSize: 14, color: '#1565c0', marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  summaryText: { fontSize: 16, color: '#333', marginVertical: 4 },
});
