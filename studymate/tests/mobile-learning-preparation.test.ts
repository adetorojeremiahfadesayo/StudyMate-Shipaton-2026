import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { authenticate, generate, from, ownedCourse, materials } = vi.hoisted(() => ({
  authenticate: vi.fn(), generate: vi.fn(), from: vi.fn(), ownedCourse: vi.fn(), materials: vi.fn(),
}));
vi.mock('@/lib/route-helpers', () => ({ getAuthenticatedRouteSupabase: authenticate, unauthorizedResponse: () => Response.json({ error: 'Unauthorized' }, { status: 401 }) }));
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from } }));
vi.mock('@/lib/openai', () => ({ getChatCompletion: generate }));

beforeEach(() => {
  vi.clearAllMocks();
  authenticate.mockResolvedValue({ user: { id: 'test-user' } });
  ownedCourse.mockResolvedValue({ data: { id: 'test-course', name: 'Synthetic course', subject_type: 'law' }, error: null });
  materials.mockResolvedValue({ data: [{ file_name: 'synthetic.txt', ocr_text: 'Synthetic source text' }], error: null });
  from.mockImplementation((table: string) => {
    const chain = { select: vi.fn(), eq: vi.fn(), not: vi.fn(), maybeSingle: ownedCourse, order: materials };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.not.mockReturnValue(chain);
    if (!['courses', 'materials'].includes(table)) throw new Error('Unexpected database mutation');
    return chain;
  });
});
afterEach(() => vi.restoreAllMocks());

function request() {
  return new NextRequest('https://unit-test.invalid/api/agents/wiki', { method: 'POST', headers: { Authorization: 'Bearer unit-test-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: 'test-course' }) });
}

describe('mobile learning preparation', () => {
  it('passes the bearer request to authentication and reports live generation failure', async () => {
    generate.mockResolvedValue(null);
    const { POST } = await import('@/app/api/agents/wiki/route');
    const req = request(); const response = await POST(req);
    expect(authenticate).toHaveBeenCalledWith(req);
    expect(response.status).toBe(503);
    expect(from.mock.calls.map(([table]) => table)).toEqual(['courses', 'materials']);
  });
  it('denies an anonymous request before reading material', async () => {
    authenticate.mockResolvedValue(null);
    const { POST } = await import('@/app/api/agents/wiki/route');
    expect((await POST(request())).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
  it('denies an unowned course before generating any learning', async () => {
    ownedCourse.mockResolvedValue({ data: null, error: null });
    const { POST } = await import('@/app/api/agents/wiki/route');
    expect((await POST(request())).status).toBe(404);
    expect(generate).not.toHaveBeenCalled();
  });
});
