import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { responses, azureChat, directConstructor, azureConstructor } = vi.hoisted(() => ({
  responses: vi.fn(), azureChat: vi.fn(), directConstructor: vi.fn(), azureConstructor: vi.fn(),
}));
vi.mock('openai', () => ({
  default: class { responses = { create: responses }; constructor(config: unknown) { directConstructor(config); } },
  AzureOpenAI: class { chat = { completions: { create: azureChat } }; constructor(config: unknown) { azureConstructor(config); } },
}));

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv('STUDYMATE_AI_PROVIDER', 'openai');
  vi.stubEnv('OPENAI_API_KEY', 'unit-test-only');
  vi.stubEnv('OPENAI_MODEL', 'gpt-5.4-mini');
  vi.stubEnv('STUDYMATE_OPENAI_MODEL_FALLBACK', '');
  for (const tier of ['LIGHT', 'STANDARD', 'COMPLEX']) vi.stubEnv(`STUDYMATE_OPENAI_MODEL_${tier}`, '');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('backend AI provider', () => {
  it('uses Responses with source instructions, bounded output and storage disabled', async () => {
    responses.mockResolvedValueOnce({ status: 'completed', output_text: ' A grounded explanation. ' });
    const { getChatCompletionText } = await import('@/lib/openai');
    expect(await getChatCompletionText('Synthetic course excerpt', 'Use only supplied sources', { maxTokens: 500 })).toBe('A grounded explanation.');
    expect(responses).toHaveBeenCalledWith({ model: 'gpt-5.4-mini', instructions: 'Use only supplied sources', input: 'Synthetic course excerpt', max_output_tokens: 500, store: false });
    expect(directConstructor).toHaveBeenCalledWith({ apiKey: 'unit-test-only', timeout: 60000, maxRetries: 0 });
    expect(azureConstructor).not.toHaveBeenCalled();
  });

  it('withholds incomplete or empty responses', async () => {
    responses.mockResolvedValueOnce({ status: 'incomplete', output_text: 'Truncated lesson' })
      .mockResolvedValueOnce({ status: 'completed', output_text: '' });
    const { getChatCompletionText } = await import('@/lib/openai');
    expect(await getChatCompletionText('source', 'instructions')).toBeNull();
    expect(await getChatCompletionText('source', 'instructions')).toBeNull();
  });

  it('returns failure without changing provider or logging private error text', async () => {
    responses.mockRejectedValueOnce(Object.assign(new Error('private document or key'), { status: 401, code: 'invalid_api_key' }));
    const { getChatCompletionText } = await import('@/lib/openai');
    expect(await getChatCompletionText('source', 'instructions')).toBeNull();
    expect(azureConstructor).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private document or key');
  });

  it('keeps JSON parsing without logging malformed generated content', async () => {
    responses.mockResolvedValueOnce({ status: 'completed', output_text: '```json\n{"pages":[]}\n```' })
      .mockResolvedValueOnce({ status: 'completed', output_text: 'private malformed output' });
    const { getChatCompletion } = await import('@/lib/openai');
    expect(await getChatCompletion('source', 'instructions')).toEqual({ pages: [] });
    expect(await getChatCompletion('source', 'instructions')).toBeNull();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private malformed output');
  });

  it('does not make any SDK request without the OpenAI key', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const { getChatCompletionText } = await import('@/lib/openai');
    expect(await getChatCompletionText('source', 'instructions')).toBeNull();
    expect(responses).not.toHaveBeenCalled();
  });

  it('preserves explicitly selected Azure deployment routing', async () => {
    vi.stubEnv('STUDYMATE_AI_PROVIDER', 'azure');
    vi.stubEnv('AZURE_OPENAI_ENDPOINT', 'https://unit-test.openai.azure.com');
    vi.stubEnv('AZURE_OPENAI_KEY', 'azure-unit-test-only');
    vi.stubEnv('STUDYMATE_MODEL_STANDARD', 'custom-azure-deployment');
    azureChat.mockResolvedValueOnce({ choices: [{ message: { content: 'Azure result' } }] });
    const { getChatCompletionText } = await import('@/lib/openai');
    expect(await getChatCompletionText('source', 'instructions')).toBe('Azure result');
    expect(azureChat.mock.calls[0][0].model).toBe('custom-azure-deployment');
    expect(responses).not.toHaveBeenCalled();
  });
});
