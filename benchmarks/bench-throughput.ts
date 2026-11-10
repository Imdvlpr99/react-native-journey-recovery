import { CheckpointManager } from '../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../src/storage/MemoryStorageAdapter';
import { computeChecksum } from '../src/utils/checksum';

async function runBenchmark() {
  console.log('--- react-native-journey-recovery Throughput Benchmark ---');

  // 1. FNV-1a Hashing Throughput
  const samplePayload = JSON.stringify({
    step: 'review',
    origin: 'SFO',
    destination: 'HND',
    passengers: 2,
    cabin: 'business',
    ancillaries: ['wifi', 'extra-baggage', 'priority-boarding'],
    history: Array.from({ length: 50 }, (_, i) => ({ timestamp: Date.now() - i * 1000, action: `action_${i}` }))
  });

  const HASH_ITERATIONS = 50_000;
  const hashStart = performance.now();
  for (let i = 0; i < HASH_ITERATIONS; i++) {
    computeChecksum(samplePayload);
  }
  const hashDuration = performance.now() - hashStart;
  const hashOpsSec = Math.round((HASH_ITERATIONS / hashDuration) * 1000);
  console.log(`FNV-1a Checksum: ${HASH_ITERATIONS.toLocaleString()} ops in ${hashDuration.toFixed(2)}ms (${hashOpsSec.toLocaleString()} ops/sec)`);

  // 2. CheckpointManager Write Queue Throughput (Concurrent Serialized Saves)
  const storage = new MemoryStorageAdapter();
  const manager = new CheckpointManager(storage, {
    maxSizeBytes: 1024 * 1024
  });

  const CONCURRENT_WRITES = 1_000;
  const writeStart = performance.now();
  await Promise.all(
    Array.from({ length: CONCURRENT_WRITES }, (_, i) =>
      manager.save('benchmark-journey', {
        step: `step_${i % 10}`,
        count: i,
        timestamp: Date.now()
      })
    )
  );
  const writeDuration = performance.now() - writeStart;
  const writeOpsSec = Math.round((CONCURRENT_WRITES / writeDuration) * 1000);
  console.log(`Concurrent Writes (Serialized Promise Queue): ${CONCURRENT_WRITES.toLocaleString()} writes in ${writeDuration.toFixed(2)}ms (${writeOpsSec.toLocaleString()} ops/sec)`);

  // 3. Checkpoint Read & Verification Throughput
  const READ_ITERATIONS = 5_000;
  const readStart = performance.now();
  for (let i = 0; i < READ_ITERATIONS; i++) {
    await manager.get('benchmark-journey');
  }
  const readDuration = performance.now() - readStart;
  const readOpsSec = Math.round((READ_ITERATIONS / readDuration) * 1000);
  console.log(`Checkpoint Read & Verify: ${READ_ITERATIONS.toLocaleString()} reads in ${readDuration.toFixed(2)}ms (${readOpsSec.toLocaleString()} ops/sec)`);

  console.log('-----------------------------------------------------------');
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
