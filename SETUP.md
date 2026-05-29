# SIGNATUREWITHIN Setup

## Environment Variables (set in Vercel Dashboard → Settings → Environment Variables)

STRIPE_SECRET_KEY=sk_live_...
GROQ_API_KEY=gsk_...
BREVO_API_KEY=...
CRON_SECRET=signaturewithin-cron-2026   ← add this exactly

## Cron Job
The /api/publish-daily endpoint runs at 8am UTC daily.
It updates the sitemap with articles scheduled for that day.

## Article Queue
Articles are published based on their datePublished field.
Articles with a future date are hidden from the blog listing but exist on the server.
2 new articles go live per day automatically.

## To add more articles to the queue
1. Write the article and save to /public/blog/
2. Set datePublished to a future date in the article schema
3. Deploy — the cron will make it visible on the correct date
