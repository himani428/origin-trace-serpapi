import 'dotenv/config';
import express from 'express';
import type { HealthResponse, StreamEvent, TraceRequest } from '../shared/types';
import { buildTrace } from './provenance';
import { SCENARIOS, findScenario } from './sample';
import { STEPS, fetchEvidence } from './serpapi';

const app = express();
app.use(express.json({ limit: '10kb' }));

const apiKey = (process.env.SERPAPI_API_KEY || '').trim();
const demo = apiKey.length === 0;

const REGIONS = new Set(['in', 'us', 'gb', 'au']);
const LANGUAGES = new Set(['en', 'hi']);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

app.get('/api/health', (_req, res) => {
  const body: HealthResponse = {
    demo,
    scenarios: SCENARIOS.map(({ id, title, claim, blurb }) => ({ id, title, claim, blurb }))
  };
  res.json(body);
});

app.post('/api/trace', async (req, res) => {
  const body = (req.body ?? {}) as Partial<TraceRequest>;
  const claim = typeof body.claim === 'string' ? body.claim.trim() : '';

  if (claim.length < 8 || claim.length > 300) {
    res.status(400).json({ error: 'Enter a claim between 8 and 300 characters.' });
    return;
  }

  const gl = body.gl && REGIONS.has(body.gl) ? body.gl : process.env.SERPAPI_GL || 'in';
  const hl = body.hl && LANGUAGES.has(body.hl) ? body.hl : process.env.SERPAPI_HL || 'en';

  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: StreamEvent) => res.write(`${JSON.stringify(event)}\n`);

  try {
    send({ type: 'start', demo, steps: STEPS });

    if (demo) {
      const { scenario, exact } = findScenario(body.scenario, claim);
      for (const step of STEPS) {
        send({ type: 'step', id: step.id, status: 'running' });
        await sleep(280);
        const count = scenario.items.filter((i) =>
          step.id === 'news' ? i.engine === 'google_news'
            : step.id === 'web' ? i.engine === 'google'
              : step.id === 'factcheck' ? i.engine === 'google_factcheck'
                : i.engine === 'google_scholar'
        ).length;
        send({ type: 'step', id: step.id, status: 'done', count });
      }
      const warnings = [
        exact
          ? 'Demo mode: this case uses bundled sample data with fictional outlets. Add SERPAPI_API_KEY to the .env file to trace real claims.'
          : 'Demo mode: your wording did not match a sample case, so the first sample case is shown. Add SERPAPI_API_KEY to the .env file to trace real claims.'
      ];
      send({
        type: 'result',
        data: buildTrace(scenario.claim, scenario.items, {
          demo: true,
          engineCounts: {
            google_news: scenario.items.filter((i) => i.engine === 'google_news').length,
            google: scenario.items.filter((i) => i.engine === 'google').length,
            google_factcheck: scenario.items.filter((i) => i.engine === 'google_factcheck').length,
            google_scholar: scenario.items.filter((i) => i.engine === 'google_scholar').length
          },
          warnings,
          related: scenario.related,
          region: { gl, hl }
        })
      });
    } else {
      const fetched = await fetchEvidence(claim, apiKey, { gl, hl }, (id, status, detail) =>
        send({ type: 'step', id, status, count: detail?.count, message: detail?.message })
      );
      send({
        type: 'result',
        data: buildTrace(claim, fetched.items, {
          demo: false,
          engineCounts: fetched.engineCounts,
          warnings: fetched.warnings,
          related: fetched.related,
          region: { gl, hl }
        })
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error while tracing the claim.';
    console.error('[trace]', message);
    send({ type: 'error', message });
  } finally {
    res.end();
  }
});

const port = Number(process.env.PORT) || 5174;
app.listen(port, () => {
  console.log(`Origin Trace API listening on http://localhost:${port} (${demo ? 'demo mode' : 'live mode'})`);
});
