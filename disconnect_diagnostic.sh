#!/bin/bash
# disconnect_diagnostic.sh - Find the exact disconnect point

echo "🔍 DISCONNECT DIAGNOSTIC TEST"
echo "=============================="

# Test 1: Check your token works directly with Replicate
echo "1. Testing your token directly with Replicate API..."
RESPONSE1=$(curl -s -H "Authorization: Token $YOUR_TOKEN_HERE" \
  https://api.replicate.com/v1/account)

if [[ $RESPONSE1 == *"username"* ]]; then
  echo "✅ Your token works directly with Replicate"
else
  echo "❌ Your token doesn't work directly with Replicate"
  echo "Response: $RESPONSE1"
fi

echo ""

# Test 2: Check server has token
echo "2. Testing server token configuration..."
RESPONSE2=$(curl -s http://172.20.10.2:3000/test)
echo "Server response: $RESPONSE2"

if [[ $RESPONSE2 == *"tokenExists\":true"* ]]; then
  echo "✅ Server has token configured"
else
  echo "❌ Server missing token"
fi

echo ""

# Test 3: Test server's direct API call
echo "3. Testing server's direct API connection..."
RESPONSE3=$(curl -s -X POST http://172.20.10.2:3000/test-direct-api)
echo "Direct API test: $RESPONSE3"

echo ""

# Test 4: Test image generation endpoint
echo "4. Testing image generation..."
RESPONSE4=$(curl -s -X POST http://172.20.10.2:3000/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test robot dancing","userId":"debug"}')

echo "Generation response: $RESPONSE4"

if [[ $RESPONSE4 == *"replicate.delivery"* ]] || [[ $RESPONSE4 == *"pbxt.replicate.delivery"* ]]; then
  echo "🎉 SUCCESS: Real AI image generated!"
elif [[ $RESPONSE4 == *"placeholder"* ]] || [[ $RESPONSE4 == *"picsum"* ]]; then
  echo "❌ PROBLEM: Returning placeholder images"
elif [[ $RESPONSE4 == *"error"* ]]; then
  echo "❌ PROBLEM: Generation failed with error"
else
  echo "❓ UNKNOWN: Unexpected response format"
fi

echo ""
echo "🎯 DIAGNOSIS COMPLETE"
echo "Check the results above to identify the disconnect point."
