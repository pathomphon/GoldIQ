import { describe, expect, it } from 'vitest';

import { createGold965Fixture, createGold9999Fixture } from './fixtures.js';

describe('mock Hua Seng Heng fixtures', () => {
  it('keeps 96.5 and 99.99 responses deliberately provider-shaped', () => {
    const gold965Fixture = createGold965Fixture(new Date('2026-07-17T14:21:41.000Z'));
    const gold9999Fixture = createGold9999Fixture(new Date('2026-07-17T14:21:44.820Z'));

    expect(gold965Fixture[0]).toMatchObject({
      GoldType: 'HSH',
      GoldCode: '96.50',
      Buy: '63,550',
      TimeUpdate: '2026-07-17T21:21:41.000',
    });
    expect(gold9999Fixture).toMatchObject({
      Buy: '65,890',
      TimeUpdate: '2026-07-17T21:21:44.820',
    });
  });
});
