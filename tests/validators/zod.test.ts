import { describe, it, expect } from 'vitest';
import { createZodValidator, ZodSchemaLike } from '../../src/validators/zod';
import { SnapshotValidator } from '../../src/core/SnapshotValidator';
import { JourneySnapshot } from '../../src/types/checkpoint';

describe('Zod Validation Integration', () => {
  // Mock standard Zod schema to test integration without hard peer dependency
  interface FlightBooking {
    flightNumber: string;
    seats: number;
    destination: string;
  }

  const mockFlightSchema: ZodSchemaLike<FlightBooking> = {
    safeParse: (data: any) => {
      if (typeof data !== 'object' || data === null) {
        return {
          success: false,
          error: { message: 'Expected object' },
        };
      }
      const issues: Array<{ message: string; path: string[] }> = [];
      if (typeof data.flightNumber !== 'string') {
        issues.push({ message: 'Expected string for flightNumber', path: ['flightNumber'] });
      }
      if (typeof data.seats !== 'number' || data.seats <= 0) {
        issues.push({ message: 'Expected positive number for seats', path: ['seats'] });
      }
      if (typeof data.destination !== 'string') {
        issues.push({ message: 'Expected string for destination', path: ['destination'] });
      }

      if (issues.length > 0) {
        return {
          success: false,
          error: { issues },
        };
      }

      return {
        success: true,
        data: data as FlightBooking,
      };
    },
  };

  it('validates matching payload successfully', () => {
    const validator = createZodValidator(mockFlightSchema);
    const validData = {
      flightNumber: 'GA-102',
      seats: 2,
      destination: 'HND',
    };

    expect(validator(validData)).toBe(true);
  });

  it('throws descriptive error on invalid payload containing field paths', () => {
    const validator = createZodValidator(mockFlightSchema);
    const invalidData = {
      flightNumber: 12345, // invalid type
      seats: -1, // invalid value
      destination: 'HND',
    };

    expect(() => validator(invalidData)).toThrowError(
      /Zod validation failed: flightNumber: Expected string for flightNumber; seats: Expected positive number for seats/
    );
  });

  it('integrates seamlessly with SnapshotValidator', () => {
    const zodValidator = createZodValidator(mockFlightSchema);
    const snapshotValidator = new SnapshotValidator();

    const snapshot: JourneySnapshot<FlightBooking> = {
      id: 'flight-101',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
      data: {
        flightNumber: 'SQ-321',
        seats: 1,
        destination: 'SIN',
      },
    };

    const result = snapshotValidator.validate(snapshot, { validate: zodValidator });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();

    // With invalid data payload
    const invalidSnapshot: JourneySnapshot<any> = {
      ...snapshot,
      data: { flightNumber: null, seats: 'two', destination: 99 },
    };

    const invalidResult = snapshotValidator.validate(invalidSnapshot, {
      validate: zodValidator,
    });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error?.message).toContain('Zod validation failed');
  });
});

