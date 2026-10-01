import { afterEach, describe, expect, it, vi } from 'vitest';
import { retrieveStudyContext } from '@/lib/foundry-iq';
import { DEMO_COURSE } from '@/lib/demo-data';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('OpenAI course context', () => {
  it('uses saved course sources without calling the former retrieval provider', async () => {
    vi.stubEnv('STUDYMATE_AI_PROVIDER', 'openai');
    vi.stubEnv('FOUNDRY_IQ_ENDPOINT', 'https://unit-test.invalid');
    vi.stubEnv('FOUNDRY_IQ_KEY', 'unit-test-only');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const pages = [{ title: 'Negligence', type: 'concept', content: 'Duty, breach, causation and damage.', source_material: 'synthetic.txt' }];
    const result = await retrieveStudyContext({ courseId: 'test-course', query: 'Negligence', wikiPages: pages });
    expect(result.pages).toEqual(pages); expect(result.citations).toEqual(['Negligence']);
    expect(result.usedFoundryIq).toBe(false); expect(fetchMock).not.toHaveBeenCalled();
  });
  it('never replaces missing production material with the sample course', async () => {
    vi.stubEnv('STUDYMATE_AI_PROVIDER', 'openai');
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
    const result = await retrieveStudyContext({ courseId: DEMO_COURSE.id, query: 'Negligence', wikiPages: [] });
    expect(result.pages).toEqual([]); expect(result.citations).toEqual([]);
  });
});
