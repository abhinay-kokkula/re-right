import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RewriteRequest {
  text: string;
  styles: string[];
}

interface RewriteOption {
  text: string;
  style: string;
  tone: string;
}

const styleDescriptions: Record<string, string> = {
  Professional: 'Polished and business-appropriate',
  Casual: 'Friendly and conversational',
  Concise: 'Short and to the point',
  Creative: 'Engaging and imaginative',
  Simplified: 'Easy to understand',
};

async function callOpenRouterAPI(text: string, style: string): Promise<string> {
  const stylePrompts: Record<string, string> = {
    Professional: 'Rewrite the following text in a professional, formal tone suitable for business communication. Expand contractions and use polished language:',
    Casual: 'Rewrite the following text in a casual, friendly, conversational tone. Use contractions and informal language:',
    Concise: 'Rewrite the following text to be brief and concise while maintaining the core message. Remove unnecessary words:',
    Creative: 'Rewrite the following text in a creative, engaging, and imaginative way. Make it exciting and captivating:',
    Simplified: 'Rewrite the following text using simple, easy-to-understand language. Replace complex words with simpler alternatives:',
  };

  const prompt = `${stylePrompts[style] || stylePrompts.Professional}\n\n"${text}"\n\nProvide only the rewritten text without any explanation or additional commentary.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'HTTP-Referer': 'https://re-right.app',
        'X-Title': 'RE-right Content Rewriter',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', await response.text());
      return generateFallbackRewrite(text, style);
    }

    const data = await response.json();
    const rewrittenText = data.choices?.[0]?.message?.content?.trim();

    if (!rewrittenText) {
      return generateFallbackRewrite(text, style);
    }

    return rewrittenText.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    return generateFallbackRewrite(text, style);
  }
}

function generateFallbackRewrite(text: string, style: string): string {
  const words = text.split(/\s+/);

  switch (style) {
    case 'Professional': {
      let result = text
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/\bdon't\b/gi, 'do not')
        .replace(/\bi'm\b/gi, 'I am')
        .replace(/\bit's\b/gi, 'it is')
        .replace(/\byou're\b/gi, 'you are');

      if (!/^[A-Z]/.test(result)) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
      }
      if (!/[.!?]$/.test(result)) {
        result += '.';
      }
      return result;
    }

    case 'Casual': {
      let result = text
        .replace(/\bcannot\b/gi, "can't")
        .replace(/\bwill not\b/gi, "won't")
        .replace(/\bdo not\b/gi, "don't");

      result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
      if (!/[.!?]$/.test(result)) {
        result += '!';
      }
      return result;
    }

    case 'Concise': {
      const essentialWords = words.filter(word => {
        const lower = word.toLowerCase().replace(/[.,!?;:]/, '');
        const skipWords = ['the', 'a', 'an', 'very', 'really', 'quite'];
        return !skipWords.includes(lower);
      });

      let result = essentialWords.slice(0, Math.ceil(words.length * 0.6)).join(' ');
      if (!/[.!?]$/.test(result)) {
        result += '.';
      }
      return result;
    }

    case 'Creative': {
      return `Imagine this: ${text.toLowerCase()} Pretty cool, right?`;
    }

    case 'Simplified': {
      let result = text
        .replace(/\butilize\b/gi, 'use')
        .replace(/\bfacilitate\b/gi, 'help')
        .replace(/\bcommence\b/gi, 'start');

      return result.charAt(0).toUpperCase() + result.slice(1);
    }

    default:
      return text;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, styles }: RewriteRequest = await req.json();

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const stylesToProcess = styles || ['Professional', 'Casual', 'Concise', 'Creative', 'Simplified'];

    const rewritePromises = stylesToProcess.map(async (style) => {
      const rewrittenText = await callOpenRouterAPI(text, style);
      return {
        text: rewrittenText,
        style: style,
        tone: styleDescriptions[style] || 'Alternative style',
      };
    });

    const options: RewriteOption[] = await Promise.all(rewritePromises);

    return new Response(
      JSON.stringify({ options }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process rewrite request' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});