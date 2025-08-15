const {onRequest} = require('firebase-functions/v2/https');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const Replicate = require('replicate');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: '🎉 FeverDreams AI Party Game API Working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /test - Test endpoint',
      'POST /generate-image - Generate AI images with face blending'
    ]
  });
});

// 🎨 AI Image Generation with Flux Dev - FIXED FIRESTORE
app.post('/generate-image', async (req, res) => {
  try {
    const { prompt, selfieUrl, gameId, userId, promptId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    console.log(`🎨 Generating image for user ${userId}: "${prompt}"`);

    // FIXED: Handle undefined values for Firestore
    const generationData = {
      userId: userId || 'anonymous',
      gameId: gameId || `game_${Date.now()}`,
      promptId: promptId || `prompt_${Date.now()}`,
      prompt,
      status: 'pending',
      createdAt: new Date(),
      model: 'flux-dev'
    };

    // Save generation attempt to Firestore
    const generationRef = await db.collection('image_generations').add(generationData);

    try {
      // 🚀 PRIMARY: Flux Dev with face blending
      const input = {
        prompt: `${prompt}, cartoon style, funny, colorful, high quality, detailed, vibrant`,
        image: selfieUrl,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        width: 768,
        height: 768,
        strength: 0.8,
        seed: Math.floor(Math.random() * 1000000)
      };

      console.log('🚀 Calling Flux Dev with face blending...');
      const output = await replicate.run("black-forest-labs/flux-dev", { input });
      const imageUrl = Array.isArray(output) ? output[0] : output;

      // Update Firestore with success
      await db.collection('image_generations').doc(generationRef.id).update({
        status: 'completed',
        imageUrl,
        completedAt: new Date(),
        model: 'flux-dev'
      });

      console.log('✅ High-quality image generated with face blending!');
      res.json({
        success: true,
        imageUrl,
        prompt,
        model: "flux-dev",
        generationId: generationRef.id,
        quality: "high"
      });

    } catch (primaryError) {
      console.error('❌ Flux Dev with face failed:', primaryError);
      
      try {
        // 🔄 FALLBACK: Flux Dev without face
        console.log('🔄 Trying Flux Dev without face blending...');
        
        const fallbackInput = {
          prompt: `person ${prompt}, cartoon style, funny, colorful, high quality`,
          num_inference_steps: 25,
          guidance_scale: 3.5,
          width: 768,
          height: 768,
          seed: Math.floor(Math.random() * 1000000)
        };

        const fallbackOutput = await replicate.run("black-forest-labs/flux-dev", { 
          input: fallbackInput 
        });
        
        const fallbackImageUrl = Array.isArray(fallbackOutput) ? fallbackOutput[0] : fallbackOutput;
        
        // Update Firestore
        await db.collection('image_generations').doc(generationRef.id).update({
          status: 'completed_fallback',
          imageUrl: fallbackImageUrl,
          completedAt: new Date(),
          model: 'flux-dev-no-face'
        });
        
        console.log('✅ Fallback image generated successfully!');
        res.json({
          success: true,
          imageUrl: fallbackImageUrl,
          prompt,
          fallback: true,
          model: "flux-dev",
          generationId: generationRef.id,
          quality: "high"
        });

      } catch (fallbackError) {
        console.error('❌ All generation failed:', fallbackError);
        
        // Update Firestore with failure
        await db.collection('image_generations').doc(generationRef.id).update({
          status: 'failed',
          error: fallbackError.message,
          completedAt: new Date()
        });
        
        res.status(500).json({ 
          error: 'Image generation failed',
          details: fallbackError.message,
          generationId: generationRef.id
        });
      }
    }

  } catch (error) {
    console.error('❌ General error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

exports.api = onRequest({
  timeoutSeconds: 300,
  memory: '2GiB',
  region: 'us-central1'
}, app);