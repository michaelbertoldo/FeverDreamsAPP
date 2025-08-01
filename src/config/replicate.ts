// src/config/replicate.ts
import axios from 'axios';

const REPLICATE_API_TOKEN = 'YOUR_REPLICATE_API_TOKEN';

// Configure Axios instance for Replicate API
export const replicateApi = axios.create({
  baseURL: 'https://api.replicate.com/v1',
  headers: {
    'Authorization': `Token ${REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
} );

// Flux.Kontext model ID
export const FLUX_KONTEXT_MODEL = 'fofr/flux-kontext:1.0.0';

// Fallback model in case of issues
export const FALLBACK_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
