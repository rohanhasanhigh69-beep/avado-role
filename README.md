<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0f39e75e-228f-4cf9-863a-e38b04bc9e3c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## NSFW / Adult Content

An explicit adult Banglish roleplay dataset has been integrated.

- Source file: `public/assets/nsfw_banglish_roleplay_dataset.jsonl`
- Converted pairs: `src/data/nsfwBanglishDataset.ts`
- The engine automatically includes these responses when the character relation is romantic/spouse or when explicit keywords are detected in the user message.

All content is 18+ consensual adult roleplay.
