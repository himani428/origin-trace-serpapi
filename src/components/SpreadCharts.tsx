import { useMemo } from 'react';
import { AreaChart, BarChart } from '@mantine/charts';
import { Stack, Text, Title } from '@mantine/core';
import type { Evidence } from '../../shared/types';

const DAY_MS = 86_400_000;

const SERIES = [
  { name: 'Official', color: 'verify.6', kind: 'primary' },
  { name: 'Fact check', color: 'check.6', kind: 'factcheck' },
  { name: 'News', color: 'press.6', kind: 'news' },
  { name: 'Web', color: 'web.6', kind: 'web' }
] as const;

function dayLabel(time: number): string {
  return new Date(time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function SpreadCharts({ evidence }: { evidence: Evidence[] }) {
  const prepared = useMemo(() => {
    const dated = evidence.filter((e) => e.publishedAt && e.kind !== 'scholar');
    if (dated.length < 2) return null;

    const buckets = new Map<number, Record<string, number>>();
    for (const item of dated) {
      const day = Math.floor(Date.parse(item.publishedAt as string) / DAY_MS) * DAY_MS;
      const bucket = buckets.get(day) ?? { Official: 0, 'Fact check': 0, News: 0, Web: 0 };
      const series = SERIES.find((x) => x.kind === item.kind);
      if (series) bucket[series.name] += 1;
      buckets.set(day, bucket);
    }

    const days = [...buckets.keys()].sort((a, b) => a - b);
    const first = days[0];
    const last = days[days.length - 1];
    const range: number[] = [];
    if ((last - first) / DAY_MS <= 45) {
      for (let t = first; t <= last; t += DAY_MS) range.push(t);
    } else {
      range.push(...days);
    }

    let running = 0;
    const perDay = range.map((t) => ({ day: dayLabel(t), ...(buckets.get(t) ?? { Official: 0, 'Fact check': 0, News: 0, Web: 0 }) }));
    const cumulative = range.map((t) => {
      const b = buckets.get(t);
      if (b) running += b.Official + b['Fact check'] + b.News + b.Web;
      return { day: dayLabel(t), Sources: running };
    });

    const activeSeries = SERIES.filter((x) => perDay.some((row) => Number((row as Record<string, number | string>)[x.name]) > 0)).map(
      ({ name, color }) => ({ name, color })
    );

    return { perDay, cumulative, activeSeries };
  }, [evidence]);

  if (!prepared) {
    return (
      <Text c="dimmed" size="sm">
        At least two dated sources are needed to chart the spread.
      </Text>
    );
  }

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={4}>Sources per day</Title>
        <Text size="sm" c="dimmed">
          Bars show how many sources appeared each day, split by type. A tall news bar followed by an official bar usually
          means a correction.
        </Text>
        <BarChart
          h={260}
          data={prepared.perDay}
          dataKey="day"
          type="stacked"
          series={prepared.activeSeries}
          withLegend
          yAxisProps={{ allowDecimals: false }}
          tickLine="y"
          gridAxis="y"
        />
      </Stack>
      <Stack gap="xs">
        <Title order={4}>Total sources over time</Title>
        <Text size="sm" c="dimmed">
          A steep early climb means the claim spread quickly. A flat line after an official source appears means the story ended.
        </Text>
        <AreaChart
          h={220}
          data={prepared.cumulative}
          dataKey="day"
          series={[{ name: 'Sources', color: 'press.6' }]}
          curveType="monotone"
          withDots
          yAxisProps={{ allowDecimals: false }}
          gridAxis="y"
          tickLine="y"
        />
      </Stack>
    </Stack>
  );
}
