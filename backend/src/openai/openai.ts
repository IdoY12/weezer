import OpenAI from 'openai';
import config from 'config';

const openAIClient = new OpenAI({
  apiKey: config.get<string>('openai.secret')
});

export default openAIClient