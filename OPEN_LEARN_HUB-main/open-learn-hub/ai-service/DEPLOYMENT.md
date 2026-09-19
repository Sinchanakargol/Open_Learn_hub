# AI Service Deployment Guide

## Overview

This is a Python FastAPI service that provides AI-powered features for Open Learn Hub.

## Render Deployment

### Configuration

1. **Build Command**: `pip install -r requirements.txt`
2. **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
3. **Environment**: Python 3

### Environment Variables

Required environment variables in Render:

```env
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://open-learn-hub.onrender.com,http://localhost:5173

# Gemini API Key (optional, but required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Port Configuration

Render automatically provides the `PORT` environment variable. The start command uses `$PORT` to bind to the correct port.

## Features

The AI service provides these endpoints:

- `/` - Health check
- `/status` - Service status and Gemini connection check
- `/recommend` - AI-powered course recommendations
- `/adaptive-quiz/next` - Adaptive quiz question selection
- `/sentiment` - Sentiment analysis
- `/analyze-mood` - Mood analysis with UI recommendations
- `/chat` - Chat with Gemini AI assistant
- `/generate-flashcards` - Generate flashcards from content
- `/generate-note-summary` - Generate note summaries
- `/generate-study-plan` - Generate personalized study plans
- `/generate-quiz` - Generate quiz questions
- `/predict-performance` - Predict student performance
- `/predict-dropout` - Predict dropout risk
- `/predict-grade` - Predict final grade
- `/recommend-study-time` - Recommend study time

## Gemini API Key

To get a Gemini API key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your Render environment variables as `GEMINI_API_KEY`

**Note**: Without a Gemini API key, the service will still work but will use fallback responses for AI-powered features.

## CORS Configuration

The service automatically allows origins specified in the `ALLOWED_ORIGINS` environment variable. Make sure to include:
- Your backend URL (e.g., `https://open-learn-hub.onrender.com`)
- Your frontend URL (e.g., `https://your-app.vercel.app`)
- Localhost for development

## Health Check

Test if the service is running:

```bash
curl https://your-ai-service.onrender.com/status
```

Expected response:
```json
{
  "service": "running",
  "gemini_enabled": true,
  "gemini_connection": true,
  "message": "Gemini API connected successfully"
}
```

## Troubleshooting

### 502 Bad Gateway
- Check Render logs for startup errors
- Verify Python version is 3.9 or higher
- Ensure all dependencies installed correctly

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your backend URL
- Check that URLs don't have trailing slashes

### Gemini API Errors
- Verify `GEMINI_API_KEY` is set correctly
- Check API key has not exceeded quota
- Service will use fallbacks if Gemini is unavailable
