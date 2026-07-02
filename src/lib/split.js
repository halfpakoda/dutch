// compute per-person totals from items, people and extra charges.
// items: [{id, name, price, qty, sharedBy: [personId]}]
// charges: [{id, name, amount, splitMode: 'proportional' | 'equal'}]
// people: [{id, name}]
export function computeSplit(items, people, charges) {
  const perPerson = {};
  people.forEach((p) => {
    perPerson[p.id] = { id: p.id, name: p.name, itemsTotal: 0, breakdown: [], chargesTotal: 0 };
  });

  items.forEach((item) => {
    const lineTotal = item.price * (item.qty || 1);
    const sharers = item.sharedBy || [];
    if (sharers.length === 0) return;
    const share = lineTotal / sharers.length;
    sharers.forEach((personId) => {
      if (!perPerson[personId]) return;
      perPerson[personId].itemsTotal += share;
      perPerson[personId].breakdown.push({ name: item.name, amount: share });
    });
  });

  const grandItemsTotal = Object.values(perPerson).reduce((sum, p) => sum + p.itemsTotal, 0);

  charges.forEach((charge) => {
    const amount = charge.amount || 0;
    if (charge.splitMode === 'equal') {
      const share = amount / (people.length || 1);
      people.forEach((p) => {
        perPerson[p.id].chargesTotal += share;
      });
    } else {
      // proportional to each person's item subtotal
      people.forEach((p) => {
        const proportion = grandItemsTotal > 0 ? perPerson[p.id].itemsTotal / grandItemsTotal : 1 / (people.length || 1);
        perPerson[p.id].chargesTotal += amount * proportion;
      });
    }
  });

  return people.map((p) => ({
    ...perPerson[p.id],
    total: perPerson[p.id].itemsTotal + perPerson[p.id].chargesTotal,
  }));
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}
