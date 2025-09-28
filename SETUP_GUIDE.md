# CycleBees Setup Guide

Follow these steps to get your CycleBees WhatsApp Service Alert system up and running.

## Quick Start Checklist

- [ ] Set up Supabase database
- [ ] Configure Razorpay account
- [ ] Set environment variables
- [ ] Test the application

## Step 1: Database Setup (Supabase)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and click "New Project"
3. Choose organization, enter project name: `cyclebees-service`
4. Set a strong database password
5. Wait for project to be ready (~2 minutes)

### Run Database Schema
1. In your Supabase project, go to **SQL Editor**
2. Open the file `database/schema.sql` from this project
3. Copy all the SQL content and paste it into SQL Editor
4. Click "Run" to create all tables and functions
5. Verify tables are created in **Table Editor**

### Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ`)

## Step 2: Razorpay Setup

### Create Account
1. Go to [razorpay.com](https://razorpay.com)
2. Sign up for a business account
3. Complete KYC verification (may take 1-2 days)
4. For testing, you can use Test Mode immediately

### Get API Keys
1. In Razorpay Dashboard, go to **Account & Settings** → **API Keys**
2. Generate new API keys for Test Mode
3. Copy:
   - **Key Id** (starts with `rzp_test_`)
   - **Key Secret** (keep this secure)

### Setup Webhook (After Deployment)
1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click "Add New Webhook"
3. URL: `https://your-domain.com/api/webhooks/razorpay`
4. Active Events: Select all payment-related events
5. Copy the **Webhook Secret**

## Step 3: Environment Variables

1. In your project root, copy `.env.local.example` to `.env.local`
2. Fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Razorpay Configuration  
RZP_KEY=rzp_test_yourkey
RZP_SECRET=your_secret_key
RZP_WEBHOOK_SECRET=your_webhook_secret

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_BASE_URL=http://localhost:3000/admin
```

## Step 4: Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test the System

### Create Test Request
1. Go to `/admin/new`
2. Fill in test customer details:
   - Order ID: `TEST001`
   - Bike: `Honda Activa`
   - Customer: `Test Customer`
   - Phone: `919876543210` (without +)
3. Add repair items and replacement parts
4. Click "Save Request"

### Test Customer Flow
1. Copy the generated order URL
2. Open in new tab/incognito window
3. Select services and try payment flow
4. Use Razorpay test cards for payment testing

## Step 6: Production Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_BASE_URL` to your domain

### Update Razorpay Webhook
1. Update webhook URL to your production domain
2. Switch to Live Mode when ready for real payments

## Troubleshooting

### Database Issues
- Check Supabase project status
- Verify all tables are created
- Check RLS policies if needed

### API Errors
- Check browser console for errors
- Verify environment variables
- Check Supabase logs in dashboard

### Payment Issues
- Verify Razorpay credentials
- Check webhook is receiving events
- Test with Razorpay test cards

### WhatsApp Issues
- Verify phone number format (no + prefix)
- Test WhatsApp links in mobile browser
- Check URL encoding of messages

## Need Help?

1. Check the main `README.md` for API documentation
2. Review the `projectPRD.md` for full requirements
3. Check Supabase and Razorpay documentation
4. Test with small amounts first in Test Mode

## Security Notes

- Never commit `.env.local` file
- Use strong webhook secrets
- Enable HTTPS for production
- Regularly rotate API keys