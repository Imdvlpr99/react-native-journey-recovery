import React, { useState, useMemo } from 'react';
import { computeChecksum } from '../../../src/utils/checksum';
import { inspectSnapshot } from '../../../src/cli/inspect';
import { CodeBlock } from './CodeBlock';

interface Preset {
  name: string;
  id: string;
  version: number;
  expiryHours: number;
  sampleData: Record<string, unknown>;
  tsType: string;
}

const PRESETS: Preset[] = [
  {
    name: 'E-Commerce Checkout',
    id: 'cart-checkout',
    version: 1,
    expiryHours: 24,
    sampleData: {
      step: 'shipping',
      cartItems: [
        { id: 'prod_99', name: 'Noise-Cancelling Headphones', qty: 1, price: 199.99 },
      ],
      shippingAddress: {
        fullName: 'Jane Doe',
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        zipCode: '97477',
      },
      selectedShippingMethod: 'express',
    },
    tsType: `export interface CheckoutState {
  step: 'shipping' | 'billing' | 'review';
  cartItems: Array<{ id: string; name: string; qty: number; price: number }>;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    zipCode: string;
  };
  selectedShippingMethod: 'standard' | 'express';
}`,
  },
  {
    name: 'Fintech KYC Identity Verification',
    id: 'kyc-application',
    version: 2,
    expiryHours: 12,
    sampleData: {
      applicantTier: 'individual_verified',
      legalName: 'Alexander Vance',
      dob: '1992-04-15',
      idType: 'passport',
      documentId: 'P98421034',
      addressConfirmed: true,
      step: 'document_scan',
    },
    tsType: `export interface KYCState {
  applicantTier: 'individual_basic' | 'individual_verified';
  legalName: string;
  dob: string;
  idType: 'passport' | 'driving_license';
  documentId: string;
  addressConfirmed: boolean;
  step: 'personal_details' | 'document_scan' | 'biometric_selfie';
}`,
  },
  {
    name: 'Healthcare Patient Intake',
    id: 'patient-intake',
    version: 1,
    expiryHours: 4,
    sampleData: {
      patientId: 'PT-88910',
      reasonForVisit: 'Routine annual cardiology checkup',
      allergies: ['Penicillin', 'Peanuts'],
      primaryPhysician: 'Dr. Gregory House',
      consentSigned: true,
      currentStep: 'medical_history',
    },
    tsType: `export interface PatientIntakeState {
  patientId: string;
  reasonForVisit: string;
  allergies: string[];
  primaryPhysician: string;
  consentSigned: boolean;
  currentStep: 'demographics' | 'medical_history' | 'consent';
}`,
  },
];

export const SchemaPlayground: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const activePreset = PRESETS[selectedPresetIndex];

  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(PRESETS[0].sampleData, null, 2)
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'typescript' | 'hook'>('editor');

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setJsonText(JSON.stringify(PRESETS[index].sampleData, null, 2));
  };

  // Real-time inspection & diagnostics
  const report = useMemo(() => {
    try {
      const parsedData = JSON.parse(jsonText);
      const serialized = JSON.stringify(parsedData);
      const checksum = computeChecksum(serialized);

      const snapshot = {
        _formatVersion: 1,
        id: activePreset.id,
        version: activePreset.version,
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        expiresAt: Date.now() + activePreset.expiryHours * 3600000,
        status: 'active',
        checksum,
        data: parsedData,
      };

      return inspectSnapshot(JSON.stringify(snapshot));
    } catch (e: any) {
      return {
        valid: false,
        journeyId: activePreset.id,
        version: activePreset.version,
        createdAt: 'invalid',
        updatedAt: 'invalid',
        expiresAt: null,
        isExpired: false,
        checksum: { stored: '', computed: '', matches: false },
        byteSize: typeof TextEncoder !== 'undefined'
          ? new TextEncoder().encode(jsonText).length
          : jsonText.length,
        status: 'corrupted',
        data: null,
        rejectionReason: `JSON Syntax Error: ${e.message}`,
      };
    }
  }, [jsonText, activePreset]);

  const hookSnippet = `import { useJourney, useRecovery } from 'react-native-journey-recovery';
import type { ${activePreset.name.replace(/[^a-zA-Z]/g, '')}State } from './types';

export function FlowScreen() {
  // 1. Detect and restore interrupted progress
  const recovery = useRecovery<${activePreset.name.replace(/[^a-zA-Z]/g, '')}State>('${activePreset.id}');

  // 2. Incremental auto-saving with schema migration
  const journey = useJourney<${activePreset.name.replace(/[^a-zA-Z]/g, '')}State>('${activePreset.id}', {
    version: ${activePreset.version},
    expiry: ${activePreset.expiryHours} * 60 * 60 * 1000, // ${activePreset.expiryHours} hours
  });

  // Checkpoint on step transition or state update
  const handleNextStep = async (updatedData: ${activePreset.name.replace(/[^a-zA-Z]/g, '')}State) => {
    await journey.checkpoint(updatedData);
  };

  // Complete and wipe storage
  const handleFinalSubmit = async () => {
    await journey.clear();
  };
}`;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      overflow: 'hidden',
      marginTop: '24px',
    }}>
      {/* Header & Presets */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'rgba(30, 41, 59, 0.4)',
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            🧪 Interactive Schema & Checkpoint Playground
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Prototype journey schemas, observe live 32-bit FNV-1a hashing, and generate types.
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESETS.map((preset, idx) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(idx)}
              style={{
                background: selectedPresetIndex === idx ? 'var(--accent-cyan)' : 'var(--bg-primary)',
                color: selectedPresetIndex === idx ? '#020617' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        paddingInline: '24px',
      }}>
        <button
          onClick={() => setActiveTab('editor')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'editor' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            color: activeTab === 'editor' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          JSON State Editor
        </button>
        <button
          onClick={() => setActiveTab('typescript')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'typescript' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            color: activeTab === 'typescript' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          TypeScript Contract
        </button>
        <button
          onClick={() => setActiveTab('hook')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'hook' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            color: activeTab === 'hook' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Generated Hook Code
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: '380px' }}>
        <div style={{ padding: '20px', borderRight: '1px solid var(--border-color)' }}>
          {activeTab === 'editor' && (
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '340px',
                background: 'var(--code-bg)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                padding: '16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
              }}
            />
          )}

          {activeTab === 'typescript' && (
            <CodeBlock code={activePreset.tsType} language="typescript" />
          )}

          {activeTab === 'hook' && (
            <CodeBlock code={hookSnippet} language="typescript" />
          )}
        </div>

        {/* Live Diagnostics Sidebar */}
        <div style={{ padding: '20px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Snapshot Status
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              background: report.valid ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: report.valid ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              border: `1px solid ${report.valid ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}>
              <span>{report.valid ? '✅ ELIGIBLE FOR RESTORE' : '❌ REJECTED'}</span>
            </div>
            {report.rejectionReason && (
              <div style={{ fontSize: '12px', color: 'var(--accent-rose)', marginTop: '6px' }}>
                {report.rejectionReason}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Byte Footprint</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {report.byteSize} B
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Schema Version</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                v{report.version}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Computed FNV-1a Checksum</div>
            <code style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--accent-amber)',
              background: 'var(--code-bg)',
              padding: '6px 8px',
              borderRadius: '4px',
              marginTop: '6px',
              wordBreak: 'break-all',
            }}>
              {report.checksum.computed || 'n/a'}
            </code>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recommended TTL Expiry</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              ⏱️ {activePreset.expiryHours} hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

