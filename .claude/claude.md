# MergeCheck - Testing Guide

## Quick Testing with Manual Review Trigger

Since webhooks require ngrok and a running local server, we've added a **manual review trigger** for easy testing.

### How to Test Reviews Locally:

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open dashboard:** http://localhost:3000/dashboard

3. **Activate a repository:** Toggle the switch to enable reviews

4. **Trigger a review manually:**
   - Click the "Test Review" button next to the repository
   - Enter a PR number (e.g., `1`)
   - Click "Trigger Review"

5. **Wait ~60 seconds** for the review to process

6. **Check results:**
   - Go to Reviews page
   - Click on the review to see issues found

### Testing with Webhooks (Optional):

If you want to test the full webhook flow:

1. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

2. **Update GitHub webhook URL:**
   - Go to your GitHub App settings
   - Update webhook URL to ngrok URL (e.g., `https://xxx.ngrok.io/api/webhooks/github`)

3. **Open or update a PR** on a tracked repository

4. **Webhook triggers automatically** and creates review

### Troubleshooting:

**"Repository not found" error:**
- Make sure the repository is toggled ON in the dashboard
- The repository must exist in your GitHub account

**"Failed to fetch PR" error:**
- Check that the PR number exists
- Make sure your GitHub token has access to the repository

**Review stuck in "pending":**
- Check console logs for errors
- Verify Groq API key is valid
- Check that the review processing endpoint is working

---

For full implementation details, see `/Users/akshad/Documents/akshadPersonal/merge-check/frontend/.claude/claude.md` in the frontend directory.
