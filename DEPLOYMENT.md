# GEIAL Deployment Guide

This guide will help you deploy GEIAL to production using Netlify and Supabase.

## Prerequisites

- Netlify account
- Supabase account
- OpenAI API key
- GitHub repository (optional, for automatic deployments)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Set a strong database password
4. Wait for the project to be created

### 1.2 Enable Extensions

1. Go to Database → Extensions
2. Enable the following extensions:
   - `uuid-ossp`
   - `vector` (pgvector)

### 1.3 Run Database Schema

1. Go to SQL Editor
2. Copy and paste the contents of `database/schema.sql`
3. Run the SQL script
4. Verify that all tables and functions are created

### 1.4 Set up Storage

1. Go to Storage
2. Create a new bucket named `reports`
3. Set the bucket to public (for now, you can restrict later with RLS)
4. Configure CORS if needed

### 1.5 Get API Keys

1. Go to Settings → API
2. Copy the following:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)

## Step 2: Netlify Setup

### 2.1 Create Netlify Site

1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

### 2.2 Set Environment Variables

In Netlify dashboard, go to Site settings → Environment variables and add:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

### 2.3 Deploy

1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at `https://your-site-name.netlify.app`

## Step 3: OpenAI Setup

### 3.1 Get API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an account or sign in
3. Go to API Keys
4. Create a new secret key
5. Copy the key (starts with `sk-`)

### 3.2 Add Credits

1. Go to Billing
2. Add payment method
3. Add credits to your account
4. Monitor usage to avoid unexpected charges

## Step 4: Domain Setup (Optional)

### 4.1 Custom Domain

1. In Netlify dashboard, go to Domain settings
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable HTTPS (automatic with Netlify)

### 4.2 SSL Certificate

Netlify automatically provides SSL certificates for all domains.

## Step 5: Security Configuration

### 5.1 Supabase RLS

The database schema includes Row Level Security policies. Verify they're working:

1. Test with different user accounts
2. Ensure users can only access their own data
3. Check that service role can access all data

### 5.2 Environment Variables

- Never commit `.env` files to version control
- Use Netlify's environment variable system
- Rotate API keys regularly
- Monitor API usage

### 5.3 CORS Configuration

If you need to configure CORS for Supabase:

1. Go to Supabase → Settings → API
2. Add your Netlify domain to allowed origins
3. Configure CORS headers as needed

## Step 6: Monitoring and Maintenance

### 6.1 Set up Monitoring

1. Monitor Netlify function execution times
2. Set up alerts for failed deployments
3. Monitor OpenAI API usage and costs
4. Track Supabase database performance

### 6.2 Backup Strategy

1. Supabase automatically backs up your database
2. Consider additional backups for critical data
3. Export data regularly for compliance

### 6.3 Performance Optimization

1. Monitor function cold starts
2. Optimize database queries
3. Use CDN for static assets
4. Implement caching where appropriate

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Function Errors**
   - Check environment variables
   - Verify API keys are correct
   - Check function logs in Netlify dashboard

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure extensions are enabled

4. **PDF Processing Failures**
   - Check file size limits (10MB)
   - Verify PDF is not corrupted
   - Check OpenAI API quota

### Getting Help

1. Check Netlify function logs
2. Check Supabase logs
3. Review browser console for frontend errors
4. Check OpenAI API status

## Production Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Storage bucket created
- [ ] Netlify site deployed
- [ ] Environment variables set
- [ ] OpenAI API key configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] RLS policies tested
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Performance optimized
- [ ] Security reviewed

## Scaling Considerations

### Horizontal Scaling

- Netlify Functions auto-scale
- Supabase handles database scaling
- Consider multiple regions for global users

### Cost Optimization

- Monitor OpenAI API usage
- Optimize function execution time
- Use Supabase's free tier efficiently
- Consider caching strategies

### Performance

- Use CDN for static assets
- Optimize database queries
- Implement proper indexing
- Monitor and optimize function cold starts

## Support

For deployment issues:

1. Check the logs in Netlify dashboard
2. Review Supabase logs
3. Check OpenAI API status
4. Review this guide for common solutions
5. Open an issue in the repository

Remember to keep your API keys secure and never commit them to version control!
