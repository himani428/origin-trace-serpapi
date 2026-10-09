import { Button, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { LANGUAGE_OPTIONS, REGION_OPTIONS } from '../meta';
import Panel from './Panel';

interface Props {
  claim: string;
  gl: string;
  hl: string;
  loading: boolean;
  compact?: boolean;
  onClaim: (value: string) => void;
  onRegion: (value: string) => void;
  onLanguage: (value: string) => void;
  onSubmit: () => void;
}

export default function ClaimIntake({
  claim,
  gl,
  hl,
  loading,
  compact = false,
  onClaim,
  onRegion,
  onLanguage,
  onSubmit
}: Props) {
  const ready = claim.trim().length >= 8;

  if (compact) {
    return (
      <Panel p="sm">
        <Group gap="sm" wrap="nowrap" align="flex-end">
          <TextInput
            aria-label="Claim to trace"
            placeholder="Trace another claim"
            value={claim}
            onChange={(event) => onClaim(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && ready && !loading) onSubmit();
            }}
            style={{ flex: 1 }}
            maxLength={300}
          />
          <Button onClick={onSubmit} loading={loading} disabled={!ready}>
            Trace claim
          </Button>
        </Group>
      </Panel>
    );
  }

  return (
    <Panel p="lg" style={{ boxShadow: '0 18px 40px -24px rgba(14, 26, 43, 0.35)' }}>
      <Stack gap="md">
        <Textarea
          label="Claim to trace"
          description="Paste a forwarded message or a one line claim. Hindi works too."
          placeholder="Example: City metro fares will double from next month"
          value={claim}
          onChange={(event) => onClaim(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && ready && !loading) onSubmit();
          }}
          minRows={3}
          autosize
          size="md"
          maxLength={300}
        />
        <Group gap="sm" align="flex-end">
          <Select label="Region" data={REGION_OPTIONS} value={gl} onChange={(v) => v && onRegion(v)} allowDeselect={false} w={170} />
          <Select label="Language" data={LANGUAGE_OPTIONS} value={hl} onChange={(v) => v && onLanguage(v)} allowDeselect={false} w={140} />
          <Button size="md" onClick={onSubmit} loading={loading} disabled={!ready} ml="auto">
            Trace this claim
          </Button>
        </Group>
        <Text size="xs" c="dimmed">
          Press Ctrl and Enter to trace. Each trace runs four searches and uses four SerpApi credits.
        </Text>
      </Stack>
    </Panel>
  );
}
