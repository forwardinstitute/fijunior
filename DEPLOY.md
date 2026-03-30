# Forward HQ - Deployment Guide

## Step 1: Push to GitHub

```bash
cd forward-hq
git init
git add .
git commit -m "Forward HQ - work experience platform"
gh repo create forward-hq --private --push --source .
```

Or create a repo manually at github.com and push to it.

## Step 2: Connect to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo "forward-hq"
3. Vercel will auto-detect it as Next.js

## Step 3: Add Environment Variables

In Vercel project settings (Settings > Environment Variables), add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ufxfqdjaxwbrxnzgjyey.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeGZxZGpheHdicnhuemdqeWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjAxNjAsImV4cCI6MjA5MDQzNjE2MH0.AFDpBVxX_XAzlMNXvKwxNJd4uwocmKenKrjdtashGQ4` |
| `ANTHROPIC_API_KEY` | Your Claude API key from console.anthropic.com |

## Step 4: Deploy

Hit "Deploy" in Vercel. Done.

## Getting your Claude API key

1. Go to https://console.anthropic.com
2. Settings > API Keys > Create Key
3. Copy the key (starts with `sk-ant-`)
4. Paste it as the ANTHROPIC_API_KEY in Vercel

## Adding/editing players

Players are in the Supabase `players` table. Go to:
https://supabase.com/dashboard/project/ufxfqdjaxwbrxnzgjyey/editor

To add a new player:
```sql
INSERT INTO players (name, display_name, age, bio, has_data_lab)
VALUES ('grace', 'Grace', 14, 'Loves science', true);
```

Set `has_data_lab` to `true` for age 12+, `false` for younger kids.
