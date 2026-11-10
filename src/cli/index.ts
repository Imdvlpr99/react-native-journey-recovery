#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { inspectSnapshot, formatReport } from './inspect';
import { computeChecksum } from '../utils/checksum';

export function runCli(args: string[] = process.argv.slice(2)): number {
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Usage:
  journey-recovery inspect <file.json>     Inspect and print detailed snapshot report
  journey-recovery verify <file.json>      Verify integrity (exit code 0 if valid, 1 if invalid)
  journey-recovery checksum <string>       Calculate 32-bit FNV-1a checksum for arbitrary string
    `);
    return 0;
  }

  if (command === 'checksum') {
    const target = args[1];
    if (!target) {
      console.error('Error: Please provide a string or payload to checksum.');
      return 1;
    }
    const sum = computeChecksum(target);
    console.log(`FNV-1a Checksum: ${sum}`);
    return 0;
  }

  if (command === 'inspect' || command === 'verify') {
    const filePath = args[1];
    if (!filePath) {
      console.error(`Error: Missing file path for "${command}" command.`);
      return 1;
    }

    const resolved = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      console.error(`Error: File not found: ${resolved}`);
      return 1;
    }

    try {
      const content = fs.readFileSync(resolved, 'utf8');
      const report = inspectSnapshot(content);

      if (command === 'inspect') {
        console.log(formatReport(report));
        return report.valid ? 0 : 1;
      }

      if (command === 'verify') {
        if (report.valid) {
          console.log(`PASS: Snapshot "${report.journeyId}" is valid and uncorrupted.`);
          return 0;
        } else {
          console.error(`FAIL: Snapshot "${report.journeyId}" rejected: ${report.rejectionReason}`);
          return 1;
        }
      }
    } catch (err: any) {
      console.error(`Error processing file: ${err.message}`);
      return 1;
    }
  }

  console.error(`Unknown command: "${command}". Run with --help for options.`);
  return 1;
}

if (process.env.NODE_ENV !== 'test') {
  const exitCode = runCli();
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
