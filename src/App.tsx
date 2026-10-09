import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Container, Grid, Group, Stack, Text, Title, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { Scenario, StepInfo, StreamEvent, TraceResult } from '../shared/types';
import { fetchHealth, traceClaim } from './api';
import Brand from './components/Brand';
import CaseGallery from './components/CaseGallery';
import ClaimIntake from './components/ClaimIntake';
import Dossier from './components/Dossier';
import HistoryDrawer from './components/HistoryDrawer';
import Specimen from './components/Specimen';
import TraceProgress from './components/TraceProgress';
import type { StepState } from './components/TraceProgress';
import Panel from './components/Panel';
import { clearHistory, loadHistory, saveToHistory } from './history';
import { LIVE_EXAMPLES } from './meta';
import { useSurface } from './theme';

export default function App() {
  const s = useSurface();
  const scheme = useComputedColorScheme('light');
  const { setColorScheme } = useMantineColorScheme();
  const [historyOpen, historyHandlers] = useDisclosure(false);

  const [claim, setClaim] = useState('');
  const [gl, setGl] = useState('in');
  const [hl, setHl] = useState('en');
  const [demo, setDemo] = useState<boolean | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TraceResult[]>(() => loadHistory());

  useEffect(() => {
    fetchHealth()
      .then((health) => {
        setDemo(health.demo);
        setScenarios(health.scenarios);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not reach the API server on port 5174.')
      );
  }, []);

  const handleEvent = useCallback((event: StreamEvent) => {
    if (event.type === 'start') {
      setSteps(event.steps.map((step: StepInfo) => ({ ...step, status: 'pending' as const })));
    } else if (event.type === 'step') {
      setSteps((current) =>
        current.map((step) =>
          step.id === event.id ? { ...step, status: event.status, count: event.count ?? step.count, message: event.message } : step
        )
      );
    }
  }, []);

  const run = useCallback(
    async (text: string, scenario?: string) => {
      if (running) return;
      setRunning(true);
      setError(null);
      setResult(null);
      setSteps([]);
      setClaim(text);
      try {
        const data = await traceClaim({ claim: text, gl, hl, scenario }, handleEvent);
        setResult(data);
        setClaim(data.claim);
        setHistory(saveToHistory(data));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'The trace failed for an unknown reason.');
      } finally {
        setRunning(false);
      }
    },
    [running, gl, hl, handleEvent]
  );

  const reset = () => {
    setResult(null);
    setError(null);
    setClaim('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openFromHistory = (item: TraceResult) => {
    setResult(item);
    setClaim(item.claim);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHero = !result && !running;

  return (
    <Box style={{ minHeight: '100vh', background: s.page, color: s.ink }}>
      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: s.card,
          borderBottom: `1px solid ${s.edge}`
        }}
      >
        <Container size={1200} py="sm">
          <Group justify="space-between">
            <Box component="button" type="button" onClick={reset} style={{ all: 'unset', cursor: 'pointer' }} aria-label="Go to the start">
              <Brand />
            </Box>
            <Group gap="xs">
              {demo !== null && (
                <Badge size="lg" variant="light" color={demo ? 'orange' : 'teal'}>
                  {demo ? 'Demo mode' : 'Live SerpApi'}
                </Badge>
              )}
              <Button variant="subtle" onClick={historyHandlers.open}>
                History{history.length > 0 ? ` (${history.length})` : ''}
              </Button>
              <Button variant="subtle" onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}>
                {scheme === 'dark' ? 'Light theme' : 'Dark theme'}
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size={1200} py={{ base: 'lg', sm: 40 }}>
        <Stack gap={40}>
          {showHero && (
            <Grid gutter={48} align="center">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="lg">
                  <Title order={1} fz={{ base: 40, sm: 60 }} lh={1.02} style={{ letterSpacing: '-0.02em' }}>
                    Where did this claim come from?
                  </Title>
                  <Text fz={{ base: 'md', sm: 'lg' }} c="dimmed" maw={560}>
                    Paste a rumour or a forwarded message. Origin Trace searches Google News, the web, fact checkers, and scholarly
                    papers, then shows who said it first, who repeated it, and what officials say.
                  </Text>
                  <ClaimIntake
                    claim={claim}
                    gl={gl}
                    hl={hl}
                    loading={running}
                    onClaim={setClaim}
                    onRegion={setGl}
                    onLanguage={setHl}
                    onSubmit={() => run(claim)}
                  />
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }} visibleFrom="md">
                <Panel p="md">
                  <Specimen />
                  <Text size="sm" c="dimmed" mt="xs">
                    An example trace. A forum post spreads to outlets, then an official notice and a fact check appear.
                  </Text>
                </Panel>
              </Grid.Col>
            </Grid>
          )}

          {!showHero && (
            <ClaimIntake
              compact
              claim={claim}
              gl={gl}
              hl={hl}
              loading={running}
              onClaim={setClaim}
              onRegion={setGl}
              onLanguage={setHl}
              onSubmit={() => run(claim)}
            />
          )}

          {error && (
            <Alert color="red" title="Trace failed">
              {error}
            </Alert>
          )}

          {running && steps.length > 0 && <TraceProgress steps={steps} />}

          {result && !running && <Dossier key={`${result.fetchedAt}${result.claim}`} result={result} busy={running} onNewTrace={reset} onTrace={(text) => run(text)} />}

          {showHero && demo !== null && (
            <CaseGallery
              demo={demo}
              scenarios={scenarios}
              examples={LIVE_EXAMPLES}
              history={history}
              disabled={running}
              onPick={(text, scenarioId) => run(text, scenarioId)}
              onOpenHistory={openFromHistory}
            />
          )}
        </Stack>
      </Container>

      <Box component="footer" style={{ borderTop: `1px solid ${s.edge}` }}>
        <Container size={1200} py="lg">
          <Text size="sm" c="dimmed">
            Built for the SerpApi India Hackathon 2026. Search data comes from SerpApi. Results are a guide to the sources, so always
            open them.
          </Text>
        </Container>
      </Box>

      <HistoryDrawer
        opened={historyOpen}
        history={history}
        onClose={historyHandlers.close}
        onOpen={openFromHistory}
        onClear={() => setHistory(clearHistory())}
      />
    </Box>
  );
}
