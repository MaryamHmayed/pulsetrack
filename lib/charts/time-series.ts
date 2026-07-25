export type TimeSeriesDatum = {
  date: Date;
  value: number;
};

export type TimeSeriesGeometry = {
  domain: {
    minDateMs: number;
    maxDateMs: number;
    minValue: number;
    maxValue: number;
  };
  points: Array<TimeSeriesDatum & { x: number; y: number }>;
  xTicks: Array<{ date: Date; x: number }>;
  yTicks: Array<{ value: number; y: number }>;
  referenceBand: { top: number; bottom: number };
};

type ChartDimensions = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const defaultDimensions: ChartDimensions = {
  width: 640,
  height: 280,
  left: 58,
  right: 24,
  top: 24,
  bottom: 46,
};

function niceStep(range: number, targetTickCount = 5) {
  const roughStep = range / Math.max(1, targetTickCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const factor =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return factor * magnitude;
}

function uniqueDates(dates: Date[]) {
  const seen = new Set<number>();

  return dates.filter((date) => {
    const time = date.getTime();

    if (seen.has(time)) {
      return false;
    }

    seen.add(time);
    return true;
  });
}

export function buildTimeSeriesGeometry(
  data: TimeSeriesDatum[],
  referenceLow: number,
  referenceHigh: number,
  dimensions: ChartDimensions = defaultDimensions,
): TimeSeriesGeometry {
  if (data.length === 0) {
    throw new Error("Time-series geometry requires at least one data point.");
  }

  const sortedData = [...data].sort(
    (first, second) => first.date.getTime() - second.date.getTime(),
  );
  const minDateMs = sortedData[0].date.getTime();
  const maxDateMs = sortedData.at(-1)!.date.getTime();
  const rawMin = Math.min(referenceLow, ...sortedData.map(({ value }) => value));
  const rawMax = Math.max(
    referenceHigh,
    ...sortedData.map(({ value }) => value),
  );
  const rawRange = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.2, 1);
  const step = niceStep(rawRange * 1.2);
  let minValue = Math.floor((rawMin - rawRange * 0.1) / step) * step;
  let maxValue = Math.ceil((rawMax + rawRange * 0.1) / step) * step;

  if (minValue < 0 && rawMin >= 0) {
    minValue = 0;
  }

  if (minValue === maxValue) {
    maxValue = minValue + step;
  }

  const plotWidth = dimensions.width - dimensions.left - dimensions.right;
  const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
  const xForDate = (date: Date) =>
    minDateMs === maxDateMs
      ? dimensions.left + plotWidth / 2
      : dimensions.left +
        ((date.getTime() - minDateMs) / (maxDateMs - minDateMs)) * plotWidth;
  const yForValue = (value: number) =>
    dimensions.top +
    ((maxValue - value) / (maxValue - minValue)) * plotHeight;

  const yTicks: TimeSeriesGeometry["yTicks"] = [];

  for (
    let value = minValue;
    value <= maxValue + step / 100;
    value += step
  ) {
    const roundedValue = Number(value.toPrecision(12));
    yTicks.push({ value: roundedValue, y: yForValue(roundedValue) });
  }

  const middleDate = new Date(minDateMs + (maxDateMs - minDateMs) / 2);
  const xTickDates =
    minDateMs === maxDateMs
      ? [sortedData[0].date]
      : uniqueDates([
          sortedData[0].date,
          middleDate,
          sortedData.at(-1)!.date,
        ]);

  return {
    domain: { minDateMs, maxDateMs, minValue, maxValue },
    points: sortedData.map((datum) => ({
      ...datum,
      x: xForDate(datum.date),
      y: yForValue(datum.value),
    })),
    xTicks: xTickDates.map((date) => ({ date, x: xForDate(date) })),
    yTicks,
    referenceBand: {
      top: yForValue(referenceHigh),
      bottom: yForValue(referenceLow),
    },
  };
}
