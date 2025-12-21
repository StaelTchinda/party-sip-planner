# Party Sip Planner - Cocktail Voting App

A collaborative cocktail voting app for party planning. Vote on cocktails, manage shortlists, and generate shopping lists based on popular choices.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Backend Setup with JSONBin.io

This app uses [JSONBin.io](https://jsonbin.io/) as a backend service to store votes, shortlists, and configuration. JSONBin.io supports CORS and works seamlessly with browser-based applications. Follow these steps to set up your backend:

### Step 1: Create a JSONBin.io Account

1. Go to [https://jsonbin.io/](https://jsonbin.io/)
2. Sign up for a free account using:
   - Google OAuth
   - Twitter OAuth
   - Facebook OAuth
   - GitHub OAuth

### Step 2: Create an Access Key

1. After logging in, navigate to the [API Keys page](https://jsonbin.io/api-keys)
2. Click "Create Access Key" or "New Access Key"
3. Configure the access key with the following permissions:
   - ✅ **Read** - Required to fetch the app state
   - ✅ **Update** - Required to save votes and changes
   - ❌ **Delete** - Not needed (can be disabled for security)
4. **Copy and securely store your access key** - you'll need it in the next step
   - ⚠️ **Important**: Access keys are only shown once when created. Make sure to copy it immediately.
   - 💡 **Security Tip**: Using an access key with limited permissions is more secure than using your Master Key

### Step 3: Create Your Bin

1. Go to the [JSONBin.io dashboard](https://jsonbin.io/app/home)
2. Click "Create Bin" or "New Bin"
3. Paste the following initial data structure:

```json
{
  "shortlist": [],
  "votesByUser": {},
  "tagsByCocktail": {},
  "config": {
    "maxIngredients": 30,
    "maxLiquors": 3
  }
}
```

4. Click "Create" to save the bin
5. **Copy the Bin ID** from the URL or bin details - you'll need it in the next step

### Step 4: Use the Bin ID and Access Key in Your App

1. Start your development server:
   ```sh
   npm run dev
   ```

2. Open your app in the browser and add the bin ID and access key as URL parameters:
   ```
   http://localhost:8080/?bin=YOUR_BIN_ID&access=YOUR_ACCESS_KEY
   ```
   
   Replace:
   - `YOUR_BIN_ID` with the bin ID you copied in Step 3
   - `YOUR_ACCESS_KEY` with the access key you created in Step 2

3. **Optional**: Add `&view=admin` to access admin features:
   ```
   http://localhost:8080/?bin=YOUR_BIN_ID&access=YOUR_ACCESS_KEY&view=admin
   ```

### Step 5: Initial Data Setup

```json
{
  "shortlist": [],
  "votesByUser": {},
  "tagsByCocktail": {},
  "config": {
    "maxIngredients": 30,
    "maxLiquors": 3
  }
}
```

**Data Structure Notes:**
- `shortlist`: Array of cocktail IDs (strings) that are available for voting
- `votesByUser`: Object mapping user IDs to arrays of cocktail IDs they've voted for
- `tagsByCocktail`: Object mapping cocktail IDs to arrays of custom tags
- `config`: Configuration object with `maxIngredients` and `maxLiquors` limits

### Step 5: Verify It's Working

1. **Check Initial Load:**
   - The app should load without showing the "Demo mode" banner
   - Open browser DevTools (F12) → Console tab
   - You should see a successful GET request to `api.jsonbin.io`

2. **Test Saving:**
   - Try voting on a cocktail
   - Check the Console for any error messages
   - In the Network tab, look for a PUT request to `api.jsonbin.io/v3/b/YOUR_BIN_ID`
   - A successful save will show status `200` with the updated JSON in the response

3. **Verify Persistence:**
   - Refresh the page - your votes should persist
   - The bin should still contain your vote data

4. **Manual Verification:**
   - Visit `https://jsonbin.io/app/bin/YOUR_BIN_ID` in your browser (replace YOUR_BIN_ID)
   - You should see your JSON data
   - After voting, refresh this page to see if `votesByUser` has been updated

### Troubleshooting

**Problem: "Demo mode" banner still shows**
- Make sure you've added `?bin=YOUR_BIN_ID&access=YOUR_ACCESS_KEY` to the URL
- Verify both the bin ID and access key are correct (no extra spaces or characters)
- Check that your bin exists in the JSONBin.io dashboard

**Problem: Votes not saving / "Failed to update" errors**

1. **Check the Browser Console:**
   - Open DevTools (F12) → Console tab
   - Look for error messages when you try to vote
   - **The error message will show the specific HTTP status code and reason**
   - Common errors:
     - `401 Unauthorized` - Access key is invalid. Verify your access key in the JSONBin.io dashboard.
     - `403 Forbidden` - Access key doesn't have write permissions. Check your access key permissions.
     - `404 Not Found` - Bin ID is incorrect. Verify your bin ID is correct.
     - `400 Bad Request` - Invalid data format. Check the console for details.
     - `CORS error` - JSONBin.io supports CORS, so this should not occur. If it does, check your network settings.

2. **Verify Access Key Permissions:**
   - Log into your JSONBin.io dashboard
   - Go to the API Keys section
   - Check that your access key has **Read** and **Update** permissions enabled
   - If your key only has Read permission, create a new access key with Update permission
   - You can also edit the existing key to add Update permission

3. **Verify Bin ID and Access Key Format:**
   - Make sure your bin ID and access key don't have extra spaces or line breaks
   - Copy them directly from the JSONBin.io dashboard
   - The bin ID should be a string like `"65abc123def456"`
   - The access key should be a long string of characters

4. **Check Network Requests:**
   - Open DevTools (F12) → Network tab
   - Try voting on a cocktail
   - Look for the PUT request to `api.jsonbin.io/v3/b/YOUR_BIN_ID`
   - Check the request headers - you should see `X-Access-Key: YOUR_ACCESS_KEY`
   - Check the response status and error message
   - A successful response should return status `200`

5. **Test the API Directly:**
   - Try making a request manually using curl:
     ```bash
     curl -X PUT https://api.jsonbin.io/v3/b/YOUR_BIN_ID \
       -H "X-Access-Key: YOUR_ACCESS_KEY" \
       -H "Content-Type: application/json" \
       -d '{"shortlist":[],"votesByUser":{},"tagsByCocktail":{},"config":{"maxIngredients":30,"maxLiquors":3}}'
     ```
   - If this fails, check the error message for details

**Problem: Empty shortlist shows no cocktails**
- This is expected behavior - when the shortlist is empty, the app shows popular cocktails
- To add cocktails to the shortlist, use the Admin panel (`&view=admin` in URL)
- The shortlist will be saved to JSONBin.io when you update it

**Problem: Access Key Not Working**
- Verify your access key is active in the JSONBin.io dashboard
- Check if your account has any usage limits or restrictions
- Make sure your access key has both **Read** and **Update** permissions enabled
- If you only have Read permission, you won't be able to save votes
- Try creating a new access key with Read and Update permissions

**Problem: CORS (Cross-Origin) Errors**
- JSONBin.io fully supports CORS and browser requests
- If you see CORS errors, it's likely a network or configuration issue
- Make sure you're using `https://` (not `http://`)
- Check that your browser isn't blocking requests

### Example: Complete URL with Filters

You can also add filter parameters to share specific views:

```
http://localhost:8080/?bin=YOUR_BIN_ID&access=YOUR_ACCESS_KEY&view=admin&search=margarita&alcoholic=alcoholic&tags=sweet,refreshing
```

- `bin`: Your JSONBin.io bin ID (required for saving)
- `access`: Your JSONBin.io access key (required for saving)
- `view`: Set to `admin` for admin panel access
- `search`: Search query for cocktail names
- `alcoholic`: Filter by `alcoholic`, `non-alcoholic`, or `all`
- `tags`: Comma-separated list of tags to filter by

### Data Structure Reference

The app stores this JSON structure in your JSONBin.io bin:

```typescript
{
  shortlist: string[];              // Array of cocktail IDs
  votesByUser: {                    // User votes
    [userId: string]: string[];      // Map of user ID to array of cocktail IDs
  };
  tagsByCocktail: {                 // Custom tags
    [cocktailId: string]: string[]; // Map of cocktail ID to array of tags
  };
  config: {                         // App configuration
    maxIngredients: number;         // Maximum ingredients to show
    maxLiquors: number;             // Maximum liquors to show
  };
}
```

### Important Notes About JSONBin.io

- **CORS Support**: JSONBin.io fully supports CORS and browser-based requests - no proxy needed!
- **API Authentication**: All requests require an access key in the `X-Access-Key` header
- **Access Key Permissions**: Create an access key with **Read** and **Update** permissions (not Delete)
- **Security Best Practice**: Using a restricted access key is more secure than using your Master Key
- **Rate Limits**: Free tier has generous rate limits - check JSONBin.io's documentation for details
- **Data Persistence**: Data is persisted in JSONBin.io's cloud storage
- **API Base URL**: The app uses `https://api.jsonbin.io/v3` - this is the correct base URL

### Alternative: Using Without Backend

If you don't want to set up JSONBin.io, the app works in "demo mode":
- Open the app without the `bin` and `access` parameters
- You can browse and vote, but votes won't persist after refresh
- Popular cocktails will be shown automatically
- This is useful for testing and demonstration purposes

### Getting Help

If you're still experiencing issues:
1. Check the browser console (F12) for specific error messages
2. Verify your bin ID and access key are correct
3. Check JSONBin.io's API documentation: [https://jsonbin.io/api-reference](https://jsonbin.io/api-reference)
4. Review the Network tab in DevTools to see the actual HTTP requests and responses
5. Visit your bin in the JSONBin.io dashboard to verify it exists and contains data
6. Make sure your access key has both Read and Update permissions enabled
