const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { toolId } = req.body;

  const TOOLS = {
    knowthyself: {
      name: 'Know Thy Self — Personality Report',
      description: "A beautifully designed PDF personality report with deep AI-generated insights, strengths, blind spots, Conviction profile, career direction, and 90-day growth plan.",
      price: 1499,
    },
    relationshipstyle: {
      name: 'Relationship Style — Full Blueprint',
      description: "Your complete relationship profile across 4 dimensions — Love Language, Attachment Style, Conflict Style, and Connection Style. 10-page PDF.",
      price: 1499,
    },
    temperament: {
      name: 'Temperament Profile',
      description: 'Your complete temperament profile — primary and secondary type, blend insight, strengths, tendencies, work and relationship guides, and a 30-day personalized practice plan.',
      price: 1499,
    },
    leadership: {
      name: 'Leadership Profile',
      description: 'Your leadership score across 10 dimensions with your archetype, strengths, gaps, 90-day development plan, and team feedback guide.',
      price: 1499,
    },
    career: {
      name: 'Career Metrics',
      description: 'Your career readiness score across 10 dimensions with your archetype, strengths, gaps, and a 90-day career action plan.',
      price: 1499,
    },
    entrepreneur: {
      name: 'Entrepreneur Metrics',
      description: 'Your entrepreneur readiness score across 8 dimensions with your business archetype, strengths, gaps, and a 90-day growth plan.',
      price: 1499,
    },
    ideas: {
      name: 'Ideas Validator',
      description: 'Your idea validation score across 10 dimensions — problem clarity, market demand, uniqueness, founder fit, and a 90-day validation roadmap.',
      price: 1499,
    },
    stress: {
      name: 'Stress Pattern Analysis',
      description: 'Your complete stress profile across 10 dimensions — triggers, responses, coping, recovery, and a 30-day resilience plan.',
      price: 1499,
    },
    marriage: {
      name: 'Marriage Metrics',
      description: 'Your marriage health score across 10 dimensions with gender-specific insights, strengths, priority gaps, and a 30-day growth plan.',
      price: 1499,
    },
    eq: {
      name: 'Emotional Intelligence Report',
      description: "Your complete EQ profile across 4 dimensions — Self-Awareness, Self-Regulation, Empathy, and Social Skills. 10-page PDF + 30-day growth game + personal retake coupon.",
      price: 1499,
    },
    moneymindset: {
      name: 'Money Mindset — Full Blueprint + 30-Day Game',
      description: "Discover your Money Archetype. Get your personalized PDF blueprint with money wounds, strengths, daily declarations, and a 30-day mind rewire game.",
      price: 1499,
    },
  };

  const tool = TOOLS[toolId];
  if (!tool) return res.status(400).json({ error: 'Unknown tool' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe not configured' });

  const stripe = Stripe(key);
  const origin = req.headers.origin || 'https://allaitoolshop.com';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: tool.name,
            description: tool.description,
          },
          unit_amount: tool.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/?tool=${toolId}&session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/?cancelled=true`,
      metadata: { toolId },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
