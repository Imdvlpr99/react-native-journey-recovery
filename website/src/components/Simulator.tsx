import React, { useState, useEffect, useRef } from 'react';
import { computeChecksum } from '../../../src/utils/checksum';

interface BookingFormData {
  passengerName: string;
  seatClass: string;
  ffNumber: string;
  ccNumber: string;
}

export const Simulator: React.FC = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    passengerName: '',
    seatClass: 'economy',
    ffNumber: '',
    ccNumber: '',
  });

  const [storedRaw, setStoredRaw] = useState<string | null>(null);
  const [isProcessKilled, setIsProcessKilled] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'RUNNING' | 'KILLED' | 'RECOVERED'>('RUNNING');
  const [recoveryBanner, setRecoveryBanner] = useState<{ show: boolean; title: string; desc: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const debounceTimer = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Debounced auto-save checkpoint
  const triggerSave = (data: BookingFormData) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      // Exclude credit card
      const safeData = {
        passengerName: data.passengerName,
        seatClass: data.seatClass,
        ffNumber: data.ffNumber,
      };

      const checksum = computeChecksum(JSON.stringify(safeData));
      const snapshot = {
        _formatVersion: 1,
        id: 'flight-booking',
        version: 1,
        createdAt: Date.now() - 60000,
        updatedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        status: 'active',
        checksum,
        data: safeData,
      };

      setStoredRaw(JSON.stringify(snapshot, null, 2));
    }, 400);
  };

  const handleChange = (field: keyof BookingFormData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    triggerSave(updated);
  };

  const simulateKill = () => {
    // Clear UI inputs (simulating RAM memory loss upon process termination)
    setFormData({
      passengerName: '',
      seatClass: 'economy',
      ffNumber: '',
      ccNumber: '',
    });
    setIsProcessKilled(true);
    setEngineStatus('KILLED');
    setRecoveryBanner(null);
  };

  const simulateRelaunch = () => {
    setIsProcessKilled(false);
    setEngineStatus('RECOVERED');

    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw);
        const expected = computeChecksum(JSON.stringify(parsed.data));

        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          setRecoveryBanner({
            show: true,
            title: 'Session Expired',
            desc: 'Your saved draft booking has passed its 24-hour expiration policy.',
          });
        } else if (parsed.checksum && parsed.checksum !== expected) {
          setRecoveryBanner({
            show: true,
            title: 'Checksum Mismatch (Corrupted Storage)',
            desc: 'Stored payload checksum does not match data. Restoration blocked for safety.',
          });
        } else {
          setRecoveryBanner({
            show: true,
            title: 'Resume Flight Booking?',
            desc: `Pick up where you left off for passenger "${parsed.data.passengerName || 'Passenger'}"?`,
          });
        }
      } catch {
        setRecoveryBanner({
          show: true,
          title: 'Malformed Storage',
          desc: 'Cannot parse stored JSON.',
        });
      }
    }
  };

  const handleResume = () => {
    if (storedRaw) {
      const parsed = JSON.parse(storedRaw);
      setFormData({
        passengerName: parsed.data.passengerName || '',
        seatClass: parsed.data.seatClass || 'economy',
        ffNumber: parsed.data.ffNumber || '',
        ccNumber: '', // sensitive field was never saved!
      });
      setRecoveryBanner(null);
      showToast('State successfully restored from checkpoint!');
    }
  };

  const handleDiscard = () => {
    setStoredRaw(null);
    setRecoveryBanner(null);
    setFormData({
      passengerName: '',
      seatClass: 'economy',
      ffNumber: '',
      ccNumber: '',
    });
    showToast('Checkpoint discarded. Clean slate.');
  };

  const simulateTamper = () => {
    if (!storedRaw) {
      showToast('Please type in the form first to create a checkpoint!');
      return;
    }
    const parsed = JSON.parse(storedRaw);
    parsed.data.passengerName = 'UNAUTHORIZED_TAMPER_NAME';
    setStoredRaw(JSON.stringify(parsed, null, 2));
    showToast('Storage tampered! Click "Kill Process" and "Re-launch" to see checksum protection.');
  };

  const simulateExpire = () => {
    if (!storedRaw) {
      showToast('Please type in the form first to create a checkpoint!');
      return;
    }
    const parsed = JSON.parse(storedRaw);
    parsed.expiresAt = Date.now() - 5000; // expired
    setStoredRaw(JSON.stringify(parsed, null, 2));
    showToast('Checkpoint expired! Click "Kill Process" and "Re-launch" to see TTL expiry guard.');
  };

  const simulateRevalidate = () => {
    showToast('TanStack Query: Invalidation dispatched for ["flight-seats"] & ["pricing"]. Cache refreshed.');
  };

  // Inspect storage metrics
  let payloadBytes = 0;
  let checksumVal = 'NONE';
  let integrityStatus = 'IDLE';
  let integrityColor = 'var(--text-muted)';

  if (storedRaw) {
    payloadBytes = new TextEncoder().encode(storedRaw).length;
    try {
      const parsed = JSON.parse(storedRaw);
      checksumVal = parsed.checksum || 'NONE';
      const expected = computeChecksum(JSON.stringify(parsed.data));
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        integrityStatus = 'EXPIRED';
        integrityColor = 'var(--accent-amber)';
      } else if (parsed.checksum && parsed.checksum !== expected) {
        integrityStatus = 'TAMPERED / CORRUPTED';
        integrityColor = 'var(--accent-rose)';
      } else {
        integrityStatus = 'VERIFIED';
        integrityColor = 'var(--accent-emerald)';
      }
    } catch {
      integrityStatus = 'INVALID JSON';
      integrityColor = 'var(--accent-rose)';
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '28px',
      flexWrap: 'wrap',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      padding: '24px',
      marginBlock: '20px',
      position: 'relative',
    }}>
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'var(--accent-cyan)',
          color: '#020617',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          zIndex: 30,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          {toastMessage}
        </div>
      )}

      {/* Phone Mockup */}
      <div style={{ flex: '1', minWidth: '320px', maxWidth: '380px' }}>
        <div style={{
          background: '#000000',
          border: '10px solid #1e293b',
          borderRadius: '40px',
          padding: '20px 14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          minHeight: '580px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          <div style={{
            width: '120px',
            height: '18px',
            background: '#1e293b',
            borderRadius: '0 0 12px 12px',
            margin: '-20px auto 14px auto',
          }} />

          {/* Screen Content */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{
              padding: '12px 16px',
              background: '#0f172a',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Flight Check-in</span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: engineStatus === 'KILLED' ? '#7f1d1d' : engineStatus === 'RECOVERED' ? '#0c4a6e' : '#064e3b',
                color: engineStatus === 'KILLED' ? '#f87171' : engineStatus === 'RECOVERED' ? '#38bdf8' : '#34d399',
              }}>
                {engineStatus}
              </span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
              {/* Recovery Banner */}
              {recoveryBanner?.show && (
                <div style={{
                  background: '#1e293b',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid var(--accent-cyan)',
                  padding: '12px',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                    {recoveryBanner.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    {recoveryBanner.desc}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleResume}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--accent-cyan)',
                        color: '#020617',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Resume
                    </button>
                    <button
                      onClick={handleDiscard}
                      style={{
                        padding: '5px 12px',
                        background: '#334155',
                        color: '#f8fafc',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}

              {/* Form Controls */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Passenger Full Name
                </label>
                <input
                  type="text"
                  value={formData.passengerName}
                  onChange={(e) => handleChange('passengerName', e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Seat Selection
                </label>
                <select
                  value={formData.seatClass}
                  onChange={(e) => handleChange('seatClass', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="economy">Economy (18B)</option>
                  <option value="premium">Premium Economy (10A)</option>
                  <option value="business">Business Class (3F)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Frequent Flyer #
                </label>
                <input
                  type="text"
                  value={formData.ffNumber}
                  onChange={(e) => handleChange('ffNumber', e.target.value)}
                  placeholder="e.g. FF-99120"
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Credit Card Number (Safeguarded / Excluded)
                </label>
                <input
                  type="password"
                  value={formData.ccNumber}
                  onChange={(e) => handleChange('ccNumber', e.target.value)}
                  placeholder="•••• •••• •••• •••• (Never saved)"
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  onClick={() => {
                    handleDiscard();
                    showToast('Flight Check-in confirmed! Checkpoint cleared.');
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--accent-cyan)',
                    color: '#020617',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Complete Flight Check-in
                </button>
              </div>
            </div>
          </div>

          {/* Process Killed Overlay */}
          {isProcessKilled && (
            <div style={{
              position: 'absolute',
              inset: '20px 14px',
              background: 'rgba(2, 6, 23, 0.96)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              gap: '14px',
              zIndex: 20,
            }}>
              <span style={{ fontSize: '32px' }}>💥</span>
              <h4 style={{ color: 'var(--accent-rose)', fontSize: '16px' }}>OS Process Killed</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Simulating Android/iOS background memory reclamation (SIGKILL). React state is erased, but persistent checkpoint is intact in storage!
              </p>
              <button
                onClick={simulateRelaunch}
                style={{
                  background: 'var(--accent-cyan)',
                  color: '#020617',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🔄 Re-launch App
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Control Panel */}
      <div style={{ flex: '1.4', minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ fontSize: '15px', color: '#f8fafc', marginBottom: '6px' }}>
            ⚡ Process & Chaos Controls
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Simulate real-world mobile operating system interruptions and data safety guards:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <button
              onClick={simulateKill}
              style={{
                padding: '10px 12px',
                background: '#1e293b',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              💥 Kill Process (Crash)
            </button>

            <button
              onClick={simulateTamper}
              style={{
                padding: '10px 12px',
                background: '#1e293b',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              👾 Tamper Storage
            </button>

            <button
              onClick={simulateExpire}
              style={{
                padding: '10px 12px',
                background: '#1e293b',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ⏳ Force Expiration
            </button>

            <button
              onClick={simulateRevalidate}
              style={{
                padding: '10px 12px',
                background: '#1e293b',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🔄 Query Cache Invalidate
            </button>
          </div>
        </div>

        {/* Live Diagnostics */}
        <div style={{
          background: 'var(--code-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
              🔍 Live Storage Payload
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              @rn_journey:flight-booking
            </span>
          </div>

          <pre style={{
            background: '#040711',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            maxHeight: '190px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {storedRaw || '// Type in the passenger form above to see active checkpointing in real time...'}
          </pre>

          {/* Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SIZE</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {payloadBytes} B
              </div>
            </div>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CHECKSUM</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                {checksumVal}
              </div>
            </div>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>INTEGRITY</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: integrityColor }}>
                {integrityStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

