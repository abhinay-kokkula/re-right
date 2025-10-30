import { supabase, RewriteOption } from '../lib/supabase';

const rewriteStyles = [
  { name: 'Professional', tone: 'formal', description: 'Polished and business-appropriate' },
  { name: 'Casual', tone: 'informal', description: 'Friendly and conversational' },
  { name: 'Concise', tone: 'brief', description: 'Short and to the point' },
  { name: 'Creative', tone: 'expressive', description: 'Engaging and imaginative' },
  { name: 'Simplified', tone: 'simple', description: 'Easy to understand' },
];

function generateRewrite(text: string, style: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const words = text.split(/\s+/);

  switch (style) {
    case 'Professional': {
      let result = text
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/\bdon't\b/gi, 'do not')
        .replace(/\bi'm\b/gi, 'I am')
        .replace(/\bit's\b/gi, 'it is')
        .replace(/\byou're\b/gi, 'you are')
        .replace(/\bretty\b/gi, 'rather')
        .replace(/\bkinda\b/gi, 'somewhat')
        .replace(/\bgonna\b/gi, 'going to')
        .replace(/\bwanna\b/gi, 'want to');

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
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bdoes not\b/gi, "doesn't")
        .replace(/\bgoing to\b/gi, 'gonna')
        .replace(/\bwant to\b/gi, 'wanna')
        .replace(/Hello/gi, 'Hey')
        .replace(/Greetings/gi, 'Hi there');

      result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();

      const casualEndings = [' 😊', '!', ''];
      if (!/[.!?]$/.test(result)) {
        const ending = casualEndings[Math.floor(Math.random() * casualEndings.length)];
        result += ending || '.';
      }
      return result;
    }

    case 'Concise': {
      const essentialWords = words.filter(word => {
        const lower = word.toLowerCase().replace(/[.,!?;:]/, '');
        const skipWords = ['the', 'a', 'an', 'very', 'really', 'quite', 'rather', 'just', 'actually', 'basically'];
        return !skipWords.includes(lower) || word.length > 3;
      });

      let result = essentialWords.slice(0, Math.max(3, Math.ceil(words.length * 0.6))).join(' ');
      result = result.replace(/^./, str => str.toUpperCase());

      if (!/[.!?]$/.test(result)) {
        result += '.';
      }
      return result;
    }

    case 'Creative': {
      const openings = [
        'Imagine this: ',
        'Picture this: ',
        'Here\'s the thing: ',
        'Get this: ',
        'Listen up: '
      ];
      const closings = [
        ' Pretty cool, right?',
        ' Exciting stuff!',
        ' Amazing, isn\'t it?',
        '!',
        ' How awesome is that?'
      ];

      const opening = openings[Math.floor(Math.random() * openings.length)];
      const closing = closings[Math.floor(Math.random() * closings.length)];

      let result = text.replace(/^./, str => str.toLowerCase());
      return opening + result + closing;
    }

    case 'Simplified': {
      let result = text
        .replace(/\butilize\b/gi, 'use')
        .replace(/\bfacilitate\b/gi, 'help')
        .replace(/\bcommence\b/gi, 'start')
        .replace(/\bterminate\b/gi, 'end')
        .replace(/\bpurchase\b/gi, 'buy')
        .replace(/\bacquire\b/gi, 'get')
        .replace(/\bdemonstrate\b/gi, 'show')
        .replace(/\bnevertheless\b/gi, 'but')
        .replace(/\bhowever\b/gi, 'but')
        .replace(/\btherefore\b/gi, 'so')
        .replace(/\badditionally\b/gi, 'also')
        .replace(/\bsubsequently\b/gi, 'then');

      const simpleSentences = result.split(/[.!?]+/).filter(s => s.trim());
      result = simpleSentences.map(s => {
        const trimmed = s.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + '.';
      }).join(' ');

      return result;
    }

    default:
      return text;
  }
}

export async function rewriteText(originalText: string, userSession: string): Promise<RewriteOption[]> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewrite-text`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        text: originalText,
        styles: ['Professional', 'Casual', 'Concise', 'Creative', 'Simplified'],
      }),
    });

    if (!response.ok) {
      console.error('Edge function error:', await response.text());
      throw new Error('Failed to rewrite text');
    }

    const data = await response.json();
    return data.options || [];
  } catch (error) {
    console.error('Error calling rewrite API:', error);

    await new Promise(resolve => setTimeout(resolve, 1000));
    const options: RewriteOption[] = rewriteStyles.map((style) => ({
      text: generateRewrite(originalText, style.name),
      style: style.name,
      tone: style.description,
    }));
    return options;
  }
}

export async function saveRewriteHistory(
  originalText: string,
  options: RewriteOption[],
  userSession: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('rewrite_history')
    .insert({
      original_text: originalText,
      rewrite_options: options,
      user_session: userSession,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error saving history:', error);
    return null;
  }

  return data?.id || null;
}

export async function updateSelectedOption(id: string, selectedIndex: number): Promise<boolean> {
  const { error } = await supabase
    .from('rewrite_history')
    .update({ selected_option: selectedIndex })
    .eq('id', id);

  if (error) {
    console.error('Error updating selection:', error);
    return false;
  }

  return true;
}

export async function getRewriteHistory(userSession: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('rewrite_history')
    .select('*')
    .eq('user_session', userSession)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('rewrite_history')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting history:', error);
    return false;
  }

  return true;
}
