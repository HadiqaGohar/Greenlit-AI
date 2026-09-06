"""
Gemini Client - Uses official Google Gen AI SDK
Handles AI interactions for all Gemini-powered agents
Includes retry logic with exponential backoff and fallback models
"""

import asyncio
import logging
import random
from typing import Optional, List

from google import genai
from google.genai import types

from ..config import settings

logger = logging.getLogger(__name__)

# Fallback models if primary is overloaded
FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

MAX_RETRIES = 3
BASE_DELAY = 2  # seconds


class GeminiClient:
    """
    Google Gen AI SDK-based client for multi-agent system
    Uses Gemini models via the official google-genai package
    Includes retry logic with exponential backoff and fallback models
    """
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        self._async_client = None
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    def _get_client(self) -> genai.Client:
        """Get or create sync client"""
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client
    
    def _get_async_client(self) -> genai.Client:
        """Get or create async client"""
        if self._async_client is None:
            self._async_client = genai.Client(api_key=self.api_key)
        return self._async_client
    
    async def _call_gemini(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Make a single Gemini API call"""
        client = self._get_async_client()
        
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            top_p=0.9,
        )
        
        if system_prompt:
            config.system_instruction = system_prompt
        
        response = await client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=config
        )
        
        if response.text:
            return response.text.strip()
        else:
            raise Exception("Empty response from Gemini")
    
    async def generate_content(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2000
    ) -> str:
        """
        Generate content using Gemini model with retry and fallback.
        
        Retries up to MAX_RETRIES times with exponential backoff.
        If primary model fails, tries fallback models.
        """
        
        models_to_try = [self.model_name] + [
            m for m in FALLBACK_MODELS if m != self.model_name
        ]
        
        last_error = None
        
        for model in models_to_try:
            for attempt in range(MAX_RETRIES):
                try:
                    result = await self._call_gemini(
                        model=model,
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    logger.info(
                        f"Gemini response generated with {model} "
                        f"(attempt {attempt + 1}, {len(result)} chars)"
                    )
                    return result
                    
                except Exception as e:
                    last_error = e
                    error_str = str(e).lower()
                    
                    # Check if it's a retryable error (503, rate limit, overloaded)
                    is_retryable = any(
                        keyword in error_str
                        for keyword in [
                            "503",
                            "unavailable",
                            "overloaded",
                            "rate limit",
                            "too many requests",
                            "resource exhausted",
                            "deadline_exceeded",
                            "429",
                        ]
                    )
                    
                    if is_retryable and attempt < MAX_RETRIES - 1:
                        delay = BASE_DELAY * (2 ** attempt) + random.uniform(0, 1)
                        logger.warning(
                            f"Gemini API error with {model} (attempt {attempt + 1}/{MAX_RETRIES}): {e}. "
                            f"Retrying in {delay:.1f}s..."
                        )
                        await asyncio.sleep(delay)
                        continue
                    
                    # Non-retryable or last attempt for this model
                    logger.error(
                        f"Gemini API failed with {model} after {attempt + 1} attempts: {e}"
                    )
                    break  # Try next fallback model
        
        # All models failed
        raise Exception(
            f"Gemini API error after trying {len(models_to_try)} models: {last_error}"
        )
    
    async def close(self):
        """Clean up client resources"""
        self._client = None
        self._async_client = None


# Singleton instance for reuse across agents
_gemini_client_instance = None

async def get_gemini_client() -> GeminiClient:
    """Get shared Gemini client instance"""
    global _gemini_client_instance
    
    if _gemini_client_instance is None:
        _gemini_client_instance = GeminiClient()
    
    return _gemini_client_instance


async def close_gemini_client():
    """Close the shared Gemini client"""
    global _gemini_client_instance
    if _gemini_client_instance:
        await _gemini_client_instance.close()
        _gemini_client_instance = None
