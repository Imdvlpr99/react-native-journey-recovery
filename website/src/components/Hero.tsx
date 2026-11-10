import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section style={{
      paddingBlock: '20px 48px',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '48px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <img
          src="./logo.png"
          alt="react-native-journey-recovery logo"
          style={{
            width: '76px',
            height: '76px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 25px rgba(56, 189, 248, 0.35))',
          }}
        />
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: 'var(--accent-cyan)',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          ⚡ Version 0.1.0 Ready for Production
        </div>
      </div>

      <h1 style={{
        fontSize: '44px',
        lineHeight: 1.15,
        fontWeight: 800,
        letterSpacing: '-1.2px',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #ffffff 30%, var(--accent-cyan) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Never make users start over.
      </h1>

      <p style={{
        fontSize: '18px',
        color: 'var(--text-secondary)',
        maxWidth: '740px',
        lineHeight: 1.6,
        marginBottom: '28px',
      }}>
        A developer-first recovery engine for React Native and Expo. Save persistent checkpoints, validate interrupted sessions, and seamlessly restore unfinished multi-screen workflows on Android and iOS.
      </p>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <a
          href="#quickstart"
          style={{
            background: 'var(--accent-cyan)',
            color: '#020617',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
          }}
        >
          Get Started in 3 Steps
        </a>

        <a
          href="#interactive-simulator"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Try Live Simulator
        </a>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '32px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(52, 211, 153, 0.08)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          color: 'var(--accent-emerald)',
          fontWeight: 600,
        }}>
          ✓ 108 Tests Passing (100% Coverage)
        </span>
        <span style={{
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          TypeScript Strict
        </span>
        <span style={{
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          Zero Native Swift/Kotlin Modules
        </span>
        <span style={{
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          Android &amp; iOS
        </span>
        <span style={{
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          MIT Licensed
        </span>
      </div>
    </section>
  );
};

