import { describe, expect, it } from 'vitest';

import { validateEnvironment } from './environment.schema';

describe('Research Agent environment contract', () => {
  it('requires an API key only when the Research Agent is enabled', () => {
    expect(() => validateEnvironment({ RESEARCH_AGENT_ENABLED: 'false' })).not.toThrow();
    expect(() => validateEnvironment({ RESEARCH_AGENT_ENABLED: 'true' })).toThrow(
      /OPENAI_API_KEY is required/,
    );
    expect(() =>
      validateEnvironment({
        RESEARCH_AGENT_ENABLED: 'true',
        OPENAI_API_KEY: 'test-only-key',
      }),
    ).not.toThrow();
  });

  it('does not require an OpenAI API key for the Ollama provider', () => {
    expect(() =>
      validateEnvironment({
        RESEARCH_AGENT_ENABLED: 'true',
        RESEARCH_AGENT_PROVIDER: 'ollama',
      }),
    ).not.toThrow();
  });
});
