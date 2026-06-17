module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Ticker required' });

  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  try {
    const [quoteRes, overviewRes] = await Promise.all([
      fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${key}`),
      fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${key}`)
    ]);

    const quoteData = await quoteRes.json();
    const overviewData = await overviewRes.json();
    const quote = quoteData['Global Quote'];

    if (!quote || !quote['05. price']) {
      return res.status(404).json({ error: `No data found for: ${ticker}` });
    }

    return res.status(200).json({
      ticker: ticker.toUpperCase(),
      currentPrice: parseFloat(quote['05. price']) || null,
      change: parseFloat(quote['09. change']) || null,
      changePct: quote['10. change percent'] || null,
      companyName: overviewData['Name'] || ticker,
      sector: overviewData['Sector'] || 'Unknown',
      industry: overviewData['Industry'] || 'Unknown',
      marketCap: overviewData['MarketCapitalization'] || null,
      peRatio: parseFloat(overviewData['PERatio']) || null,
      pbRatio: parseFloat(overviewData['PriceToBookRatio']) || null,
      eps: parseFloat(overviewData['EPS']) || null,
      dividendYield: parseFloat(overviewData['DividendYield']) || null,
      high52Week: parseFloat(overviewData['52WeekHigh']) || null,
      low52Week: parseFloat(overviewData['52WeekLow']) || null,
      beta: parseFloat(overviewData['Beta']) || null,
      profitMargin: parseFloat(overviewData['ProfitMargin']) || null,
      returnOnEquity: parseFloat(overviewData['ReturnOnEquityTTM']) || null,
      revenueTTM: parseFloat(overviewData['RevenueTTM']) || null,
      analystTargetPrice: parseFloat(overviewData['AnalystTargetPrice']) || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
