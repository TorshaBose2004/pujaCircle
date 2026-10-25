import assert from 'node:assert/strict';
import { markDayOffSchema, blockHoursSchema } from '../schemas/availability.schema.js';
import {
  toISTDateString,
  toISTTimeString,
  parseISTDateTime,
  AvailabilityService,
} from '../services/availability.service.js';

async function runTests() {
  console.log('--- Running Availability System Tests ---');

  // Test 1: Validation Schemas
  console.log('Test 1: markDayOffSchema validations');
  const validDayOff = markDayOffSchema.parse({ date: '2026-11-01', reason: 'Family Festival' });
  assert.equal(validDayOff.date, '2026-11-01');
  assert.equal(validDayOff.reason, 'Family Festival');

  assert.throws(() => {
    markDayOffSchema.parse({ date: 'invalid-date' });
  }, /Date must be formatted as YYYY-MM-DD/);

  console.log('Test 2: blockHoursSchema validations');
  const validBlock = blockHoursSchema.parse({
    date: '2026-11-01',
    startTime: '13:00',
    endTime: '15:30',
    reason: 'Lunch & Rest',
  });
  assert.equal(validBlock.startTime, '13:00');
  assert.equal(validBlock.endTime, '15:30');

  // Invalid when end <= start
  assert.throws(() => {
    blockHoursSchema.parse({
      date: '2026-11-01',
      startTime: '16:00',
      endTime: '14:00',
    });
  }, /End time must be later than start time/);

  assert.throws(() => {
    blockHoursSchema.parse({
      date: '2026-11-01',
      startTime: '14:00',
      endTime: '14:00',
    });
  }, /End time must be later than start time/);

  // Test 3: Timezone Helpers (Asia/Kolkata)
  console.log('Test 3: Timezone helpers consistency (Asia/Kolkata)');
  const parsedDate = parseISTDateTime('2026-11-05', '07:30');
  // 07:30 IST is 02:00 UTC
  assert.equal(parsedDate.toISOString(), '2026-11-05T02:00:00.000Z');

  // Format back from Date object into IST string
  const istDateStr = toISTDateString(parsedDate);
  const istTimeStr = toISTTimeString(parsedDate);
  assert.equal(istDateStr, '2026-11-05');
  assert.equal(istTimeStr, '07:30');

  // Test 4: Check that blockHours rejects end <= start
  console.log('Test 4: blockHours rejects invalid time range');
  const service = new AvailabilityService();
  await assert.rejects(
    async () => {
      await service.blockHours('dummy-id', '2026-11-05', '18:00', '15:00');
    },
    /End time must be later than start time/
  );

  console.log('✅ All availability logic and timezone tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
