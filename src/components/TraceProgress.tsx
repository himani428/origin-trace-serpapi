import { Group, Loader, Stack, Text, Title } from '@mantine/core';
import Panel from './Panel';

export interface StepState {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  count?: number;
  message?: string;
}

const DESCRIPTION: Record<string, string> = {
  news: 'Who reported the claim, and when',
  web: 'Forums, blogs, official pages, and related questions',
  factcheck: 'Results from fact checking organisations',
  scholar: 'Papers and studies on the topic'
};

export default function TraceProgress({ steps }: { steps: StepState[] }) {
  return (
    <Panel>
      <Title order={3} mb="md">
        Tracing the claim
      </Title>
      <Stack gap="sm">
        {steps.map((step) => (
          <Group key={step.id} justify="space-between" wrap="nowrap" align="flex-start">
            <div>
              <Text fw={600}>{step.label}</Text>
              <Text size="sm" c="dimmed">
                {DESCRIPTION[step.id]}
              </Text>
              {step.status === 'error' && step.message && (
                <Text size="sm" c="red" mt={4}>
                  {step.message}
                </Text>
              )}
            </div>
            <Group gap="xs" wrap="nowrap">
              {step.status === 'running' && <Loader size="xs" />}
              <Text size="sm" fw={600} c={step.status === 'error' ? 'red' : step.status === 'done' ? 'green' : 'dimmed'}>
                {step.status === 'pending' && 'Waiting'}
                {step.status === 'running' && 'Searching'}
                {step.status === 'done' && `${step.count ?? 0} results`}
                {step.status === 'error' && 'Failed'}
              </Text>
            </Group>
          </Group>
        ))}
      </Stack>
      <Text size="sm" c="dimmed" mt="md">
        Matching sources, reading dates, classifying sources, and building the timeline happens next.
      </Text>
    </Panel>
  );
}
