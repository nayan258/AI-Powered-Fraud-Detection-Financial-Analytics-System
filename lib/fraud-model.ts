export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  location: string;
  isFraud?: boolean; // True label if it exists in dataset
  riskScore?: number; // Model prediction 0-100
  prediction?: 'Fraud' | 'Legitimate';
}

export function generateSampleData(): Transaction[] {
  const categories = ['Retail', 'Travel', 'Food', 'Online', 'Entertainment', 'Utility'];
  const locations = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Dallas', 'Seattle', 'International'];
  const merchants = ['Amazon', 'Walmart', 'Uber', 'Starbucks', 'Delta Airlines', 'Netflix', 'Target', 'Apple Store', 'Unknown Foreign Merchant'];
  
  const now = new Date();
  const data: Transaction[] = [];

  for (let i = 0; i < 500; i++) {
    const isNormal = Math.random() > 0.05; // 5% fraud rate
    
    let amount = Math.random() * 200 + 5; // Normal amounts $5 - $205
    let category = categories[Math.floor(Math.random() * categories.length)];
    let location = locations[Math.floor(Math.random() * (locations.length - 1))];
    let merchant = merchants[Math.floor(Math.random() * (merchants.length - 1))];

    if (!isNormal) {
      amount = Math.random() * 5000 + 500; // Fraud amounts $500 - $5500
      location = locations[locations.length - 1]; // international
      merchant = merchants[merchants.length - 1]; // Unknown
    }

    const txDate = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

    data.push({
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      date: txDate.toISOString(),
      amount: parseFloat(amount.toFixed(2)),
      merchant,
      category,
      location,
      isFraud: !isNormal
    });
  }
  
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Simulates a Random Forest/Logistic Regression evaluation
export function analyzeTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map(tx => {
    let riskScore = 10; // Base risk

    // Feature: Amount size
    if (tx.amount > 1000) riskScore += 30;
    if (tx.amount > 5000) riskScore += 30;

    // Feature: Location
    if (tx.location === 'International') riskScore += 25;

    // Feature: Merchant
    if (tx.merchant.includes('Unknown')) riskScore += 20;

    // Output prediction
    const finalScore = Math.min(riskScore, 99);
    
    return {
      ...tx,
      riskScore: finalScore,
      prediction: finalScore > 65 ? 'Fraud' : 'Legitimate'
    };
  });
}
