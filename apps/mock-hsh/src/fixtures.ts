function bangkokLocalTimestamp(date: Date): string {
  return new Date(date.getTime() + 7 * 60 * 60 * 1_000).toISOString().slice(0, 23);
}

export function createGold965Fixture(now = new Date()): readonly object[] {
  const timeUpdate = bangkokLocalTimestamp(now);

  return [
    {
      GoldType: 'HSH',
      GoldCode: '96.50',
      Buy: '63,550',
      Sell: '63,640',
      TimeUpdate: timeUpdate,
      BuyChange: -20,
      SellChange: -20,
      Status: 'Open',
    },
    {
      GoldType: 'REF',
      GoldCode: '96.50',
      Buy: '63,500',
      Sell: '63,690',
      TimeUpdate: timeUpdate,
      BuyChange: -20,
      SellChange: -20,
      Status: 'Open',
    },
    {
      GoldType: 'JEWEL',
      GoldCode: '96.50',
      Buy: '62,231.8',
      Sell: '64,500',
      TimeUpdate: timeUpdate,
      BuyChange: 0,
      SellChange: 0,
      Status: 'Open',
    },
  ];
}

export function createGold9999Fixture(now = new Date()): object {
  return {
    Buy: '65,890',
    Sell: '65,965',
    TimeUpdate: bangkokLocalTimestamp(now),
    Status: 'Open',
  };
}
