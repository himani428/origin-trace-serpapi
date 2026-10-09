import { Accordion, Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import type { Related } from '../../shared/types';

interface Props {
  related: Related;
  demo: boolean;
  disabled: boolean;
  onTrace: (claim: string) => void;
}

export default function RelatedPanel({ related, demo, disabled, onTrace }: Props) {
  if (related.questions.length === 0 && related.searches.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Google did not return related questions or searches for this claim.
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      {related.questions.length > 0 && (
        <Stack gap="xs">
          <Title order={4}>What people also ask</Title>
          <Text size="sm" c="dimmed">
            Questions Google shows next to this claim. They often point to the real story. These came with the main search, so they cost no extra credits.
          </Text>
          <Accordion variant="separated" radius="md">
            {related.questions.map((q) => (
              <Accordion.Item key={q.question} value={q.question}>
                <Accordion.Control>{q.question}</Accordion.Control>
                <Accordion.Panel>
                  {q.snippet && <Text size="sm">{q.snippet}</Text>}
                  {q.link && (
                    <Anchor href={q.link} target="_blank" rel="noopener noreferrer" size="sm" mt={6} display="block">
                      {q.source || q.link}
                    </Anchor>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      )}

      {related.searches.length > 0 && (
        <Stack gap="xs">
          <Title order={4}>Related searches</Title>
          <Text size="sm" c="dimmed">
            {demo ? 'In live mode, choosing one starts a new trace on that wording.' : 'Choose one to run a new trace on that wording.'}
          </Text>
          <Group gap="xs">
            {related.searches.map((query) => (
              <Button key={query} variant="default" size="xs" disabled={disabled || demo} onClick={() => onTrace(query)}>
                {query}
              </Button>
            ))}
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
