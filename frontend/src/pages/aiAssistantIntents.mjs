export const assistantQuestionTree = {
  health: {
    title: 'Health',
    description: 'Check uptime, stability, service health, and downtime causes.',
    prompts: [
      { label: 'Show me the current health status', prompt: 'Show me the current health status' },
      { label: 'What is causing the recent downtime?', prompt: 'What is causing the recent downtime?' },
      { label: 'Is the device stable right now?', prompt: 'Is the device stable right now?' },
      { label: 'What should I do about slow response or uptime issues?', prompt: 'What should I do about slow response or uptime issues?' },
    ],
  },
  ssl: {
    title: 'SSL',
    description: 'Inspect certificate health, expiry, validity, and renewal urgency.',
    prompts: [
      { label: 'Show my SSL certificate details', prompt: 'Show my SSL certificate details' },
      { label: 'When does my SSL certificate expire?', prompt: 'When does my SSL certificate expire?' },
      { label: 'What happens if SSL expires?', prompt: 'What happens if SSL expires?' },
      { label: 'Is my SSL certificate healthy?', prompt: 'Is my SSL certificate healthy?' },
    ],
  },
  ports: {
    title: 'Ports',
    description: 'Review open ports, exposure, and unnecessary services.',
    prompts: [
      { label: 'Show me my open port details', prompt: 'Show me my open port details' },
      { label: 'What harm can unnecessary open ports cause?', prompt: 'What harm can unnecessary open ports cause?' },
      { label: 'Which ports should I close?', prompt: 'Which ports should I close?' },
      { label: 'Which ports are exposing the service?', prompt: 'Which ports are exposing the service?' },
    ],
  },
  device: {
    title: 'Device overview',
    description: 'Get a practical summary of the current security and availability posture.',
    prompts: [
      { label: 'Give me a device summary', prompt: 'Give me a device summary' },
      { label: 'What are the main security risks?', prompt: 'What are the main security risks?' },
      { label: 'What should I fix first?', prompt: 'What should I fix first?' },
      { label: 'Summarize the current monitoring status', prompt: 'Summarize the current monitoring status' },
    ],
  },
};

const intentMatchers = [
  {
    category: 'health',
    patterns: [/health status|current health|device stable|downtime|uptime|latency|slow response|stable right now|recent downtime/i],
  },
  {
    category: 'ssl',
    patterns: [/ssl|certificate|expire|expiry|renew|validity|certificate details/i],
  },
  {
    category: 'ports',
    patterns: [/port|open port|ports should i close|unnecessary open ports|exposing the service/i],
  },
  {
    category: 'device',
    patterns: [/device summary|security risks|fix first|monitoring status|overall summary|overview/i],
  },
];

export function resolveAssistantIntent(promptText = '') {
  const normalized = (promptText || '').trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const matched = intentMatchers.find(({ patterns }) => patterns.some((pattern) => pattern.test(normalized)));

  if (!matched) {
    return null;
  }

  return { category: matched.category };
}

export function getGuidanceSuggestions() {
  return Object.values(assistantQuestionTree).flatMap((group) => group.prompts.map((item) => ({ ...item, category: group.title })));
}
