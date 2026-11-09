import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDecimal } from '../src/lib/format.ts'

test('keeps exact 18-digit precision for asset amounts', () => {
  assert.equal(formatDecimal('0.000000000000000001'), '0.000000000000000001')
  assert.equal(formatDecimal('123456789012345678.123456789012345678'), '123,456,789,012,345,678.123456789012345678')
})

test('shows a minimum of two decimal places', () => {
  assert.equal(formatDecimal('1.250000000000000000'), '1.25')
  assert.equal(formatDecimal('30.5'), '30.50')
  assert.equal(formatDecimal('0'), '0.00')
})

test('handles numeric responses from a backend that was not restarted yet', () => {
  assert.equal(formatDecimal(1.25), '1.25')
  assert.equal(formatDecimal(30.5), '30.50')
})
