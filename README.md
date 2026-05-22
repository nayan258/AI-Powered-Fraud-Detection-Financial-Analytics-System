# FraudShield AI

An AI-Powered Fraud Detection and Financial Analytics Dashboard built with Next.js, React, Tailwind CSS, Recharts, and the Gemini API.

## Features
- **Upload Dataset**: Upload CSV transaction history to simulate Machine Learning model evaluation using PapaParse.
- **Analytics Visualization**: Interactive Recharts displaying Time-Series transaction volumes, Categories, and Risk Score scatter plots.
- **AI Insights**: Connects securely to the Google Gemini API to generate executive-level financial risk reports.
- **Real-Time Simulation**: Heuristics-based JS ML classifier identifies anomalies automatically.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI**: Google Gemini API (`@google/genai`)
- **Parsing**: PapaParse (CSV)

## Folder Structure
- `/app` - Next.js App Router (Page, Layout, API Routes)
- `/lib` - Fraud simulation model logic and utilities
- `/components` - Shared UI elements (if applicable)

## Running the Project
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. View the application at `http://localhost:3000`

> **Note**: For Gemini Insights, ensure `GEMINI_API_KEY` is set in your environment variables.
