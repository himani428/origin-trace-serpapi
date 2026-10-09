import { Badge, Group, Progress, RingProgress, Stack, Text } from '@mantine/core';
import type { TraceResult } from '../../shared/types';
import { TONE_META, scoreColor } from '../meta';
import Panel from './Panel';

export default function ScoreCard({ result }: { result: TraceResult }) {
  const tone = TONE_META[result.verdict.tone].color;
  const color = scoreColor(result.score);

  return (
    <Panel accent={`var(--mantine-color-${tone}-6)`} h="100%">
      <Stack gap="md">
        <Group wrap="nowrap" gap="lg" align="center">
          <RingProgress
            size={132}
            thickness={13}
            roundCaps
            sections={[{ value: result.score, color: `${color}.6` }]}
            label={
              <div style={{ textAlign: 'center' }}>
                <Text fz={30} fw={700} lh={1} ff="var(--mantine-font-family-headings)">
                  {result.score}
                </Text>
                <Text size="xs" c="dimmed">
                  of 100
                </Text>
              </div>
            }
          />
          <div>
            <Badge color={tone} variant="light" mb={6}>
              Finding
            </Badge>
            <Text fw={700} fz={20} lh={1.2} ff="var(--mantine-font-family-headings)">
              {result.verdict.label}
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {result.verdict.detail}
            </Text>
          </div>
        </Group>

        <div>
          <Text fw={600} size="sm" mb={2}>
            Verification coverage
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            How much checkable material exists for this claim. It does not say whether the claim is true.
          </Text>
          <Stack gap="xs">
            {result.scoreFactors.map((factor) => (
              <div key={factor.id} title={factor.note}>
                <Group justify="space-between" mb={2}>
                  <Text size="sm">{factor.label}</Text>
                  <Text size="sm" c="dimmed">
                    {factor.points} of {factor.max}
                  </Text>
                </Group>
                <Progress value={(factor.points / factor.max) * 100} color={`${color}.6`} size="sm" />
              </div>
            ))}
          </Stack>
        </div>
      </Stack>
    </Panel>
  );
}
