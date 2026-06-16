export const INITIAL_DATA = {
  properties: [
    { id: 1, name: '412 Elm Street', address: '412 Elm St, Belmont NC 28012', owner: 'Patricia Wells', ownerEmail: 'pwells@email.com', rent: 1850, status: 'occupied', tenant: 'Marcus Johnson' },
    { id: 2, name: '88 Oakwood Drive', address: '88 Oakwood Dr, Gastonia NC 28054', owner: 'James Thornton', ownerEmail: 'jthornton@email.com', rent: 2200, status: 'occupied', tenant: 'Sarah Chen' },
    { id: 3, name: '17 Maple Court', address: '17 Maple Ct, Charlotte NC 28201', owner: 'Sandra Kim', ownerEmail: 'skim@email.com', rent: 1600, status: 'occupied', tenant: 'David Rivera' },
    { id: 4, name: '55 Pine Ridge Rd', address: '55 Pine Ridge Rd, Belmont NC 28012', owner: 'Patricia Wells', ownerEmail: 'pwells@email.com', rent: 1750, status: 'vacant', tenant: null },
    { id: 5, name: '201 Lakeview Blvd', address: '201 Lakeview Blvd, Gastonia NC 28056', owner: 'Robert Chang', ownerEmail: 'rchang@email.com', rent: 2400, status: 'occupied', tenant: 'Emily Torres' },
  ],
  tenants: [
    { id: 1, name: 'Marcus Johnson', email: 'mjohnson@email.com', phone: '704-555-0101', propertyId: 1, rentAmount: 1850, leaseStart: '2025-01-01', leaseEnd: '2026-12-31', paymentStatus: 'paid', daysLate: 0, depositHeld: 1850 },
    { id: 2, name: 'Sarah Chen', email: 'schen@email.com', phone: '704-555-0102', propertyId: 2, rentAmount: 2200, leaseStart: '2025-03-01', leaseEnd: '2027-03-31', paymentStatus: 'paid', daysLate: 0, depositHeld: 2200 },
    { id: 3, name: 'David Rivera', email: 'drivera@email.com', phone: '704-555-0103', propertyId: 3, rentAmount: 1600, leaseStart: '2025-09-01', leaseEnd: '2026-09-30', paymentStatus: 'late', daysLate: 8, depositHeld: 1600 },
    { id: 4, name: 'Emily Torres', email: 'etorres@email.com', phone: '704-555-0104', propertyId: 5, rentAmount: 2400, leaseStart: '2025-01-15', leaseEnd: '2027-01-31', paymentStatus: 'paid', daysLate: 0, depositHeld: 2400 },
  ],
  expenses: [
    { id: 1, propertyId: 1, contractorId: 1, description: 'Fix kitchen sink leak', amount: 150, date: '2026-06-03', category: 'Plumbing' },
    { id: 2, propertyId: 3, contractorId: 2, description: 'Monthly cleaning service', amount: 120, date: '2026-06-01', category: 'Cleaning' },
    { id: 3, propertyId: 2, contractorId: 3, description: 'HVAC annual service', amount: 280, date: '2026-06-10', category: 'HVAC' },
    { id: 4, propertyId: 5, contractorId: 1, description: 'Replace water heater', amount: 650, date: '2026-06-05', category: 'Plumbing' },
    { id: 5, propertyId: 1, contractorId: 4, description: 'Exterior painting touch-up', amount: 200, date: '2026-06-08', category: 'Maintenance' },
  ],
  contractors: [
    { id: 1, name: "Mike's Plumbing", type: 'Plumber', phone: '704-555-0201', email: 'mike@mikesplumbing.com' },
    { id: 2, name: 'Clean Sweep LLC', type: 'Cleaning', phone: '704-555-0202', email: 'info@cleansweep.com' },
    { id: 3, name: 'Climate Pro HVAC', type: 'HVAC', phone: '704-555-0203', email: 'service@climatepro.com' },
    { id: 4, name: 'Handy Pro Services', type: 'Maintenance', phone: '704-555-0204', email: 'hello@handypro.com' },
  ],
  maintenance: [
    { id: 1, propertyId: 1, tenantName: 'Marcus Johnson', issue: 'Leaking faucet in bathroom', priority: 'medium', status: 'in-progress', contractorId: 1, dateReported: '2026-06-10', dateResolved: null, notes: 'Plumber scheduled for June 18' },
    { id: 2, propertyId: 3, tenantName: 'David Rivera', issue: 'AC not cooling properly', priority: 'high', status: 'open', contractorId: null, dateReported: '2026-06-13', dateResolved: null, notes: '' },
    { id: 3, propertyId: 2, tenantName: 'Sarah Chen', issue: 'Garbage disposal broken', priority: 'low', status: 'resolved', contractorId: 4, dateReported: '2026-05-28', dateResolved: '2026-06-02', notes: 'Replaced unit' },
  ],
  rentPayments: [
    { id: 1, tenantId: 1, propertyId: 1, amount: 1850, datePaid: '2026-06-01', month: 'June 2026', method: 'ACH', status: 'paid' },
    { id: 2, tenantId: 2, propertyId: 2, amount: 2200, datePaid: '2026-06-01', month: 'June 2026', method: 'Check', status: 'paid' },
    { id: 3, tenantId: 4, propertyId: 5, amount: 2400, datePaid: '2026-06-03', month: 'June 2026', method: 'ACH', status: 'paid' },
  ],
  mgmtFeePercent: 8,
  currentMonth: 'June 2026',
}

export const fmt = (n) => (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export const calcOwnerPayout = (property, expenses, mgmtFee) => {
  const propExpenses = expenses.filter(e => e.propertyId === property.id)
  const totalExpenses = propExpenses.reduce((s, e) => s + e.amount, 0)
  const mgmtFeeAmt = property.rent * (mgmtFee / 100)
  const ownerPayout = property.rent - totalExpenses - mgmtFeeAmt
  return { totalExpenses, mgmtFeeAmt, ownerPayout, propExpenses }
}
