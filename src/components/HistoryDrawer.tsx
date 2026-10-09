import { Badge, Button, Drawer, Group, Stack, Text } from '@mantine/core';
import type { TraceResult } from '../../shared/types';
import { TONE_META, scoreColor } from '../meta';
import { formatDate } from '../report';
import Panel from './Panel';

interface Props {
  opened: boolean;
  history: TraceResult[];
  onClose: () => void;
  onOpen: (item: TraceResult) => void;
  onClear: () => void;
}

export default function HistoryDrawer({ opened, history, onClose, onOpen, onClear }: Props) {
  return (
    <Drawer opened={opened} onClose={onClose} title="Trace history" position="right" size="md">
      <Stack gap="sm">
        {history.length === 0 && (
          <Text c="dimmed" size="sm">
            Traces you run are saved in this browser. Nothing leaves your device.
          </Text>
        )}
        {history.map((item) => (
          <Panel key={`${item.claim}${item.fetchedAt}`} p="md">
            <Text fw={600} lineClamp={2}>
              {item.claim}
            </Text>
            <Group gap="xs" mt={6}>
              <Badge color={TONE_META[item.verdict.tone].color} variant="light">
                {item.verdict.label}
              </Badge>
              <Badge color={scoreColor(item.score)} variant="outline">
                Coverage {item.score}
              </Badge>
              {item.demo && (
                <Badge color="gray" variant="light">
                  Sample
                </Badge>
              )}
            </Group>
            <Group justify="space-between" mt="sm">
              <Text size="xs" c="dimmed">
                {formatDate(item.fetchedAt)}
              </Text>
              <Button
                size="xs"
                variant="default"
                onClick={() => {
                  onOpen(item);
                  onClose();
                }}
              >
                Reopen
              </Button>
            </Group>
          </Panel>
        ))}
        {history.length > 0 && (
          <Button variant="subtle" color="red" onClick={onClear}>
            Clear history
          </Button>
        )}
      </Stack>
    </Drawer>
  );
}
