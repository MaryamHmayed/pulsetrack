import { formatShortDateUtc } from "@/lib/format/date";

type AssessmentScore = {
  completedAt: Date;
  score: number;
};

type AssessmentScoreChartProps = {
  scores: AssessmentScore[];
};

const width = 640;
const height = 300;
const plot = {
  left: 58,
  right: 548,
  top: 22,
  bottom: 246,
};
const scoreMaximum = 24;

const riskBands = [
  { label: "Very high", min: 18.5, max: 24, fill: "#fee2e2" },
  { label: "High", min: 12.5, max: 18.5, fill: "#ffedd5" },
  { label: "Moderate", min: 6.5, max: 12.5, fill: "#fef9c3" },
  { label: "Low", min: 0, max: 6.5, fill: "#d1fae5" },
] as const;

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

export function AssessmentScoreChart({ scores }: AssessmentScoreChartProps) {
  if (scores.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
        <p className="text-sm font-medium text-slate-700">
          No completed scores yet
        </p>
        <p className="mt-2 text-sm text-slate-500">
          The DSMA-8 score trend will appear after a patient submits an
          assessment.
        </p>
      </div>
    );
  }

  const orderedScores = [...scores].sort(
    (first, second) =>
      first.completedAt.getTime() - second.completedAt.getTime(),
  );
  const firstDateMs = orderedScores[0].completedAt.getTime();
  const lastDateMs = orderedScores.at(-1)!.completedAt.getTime();
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const xForDate = (date: Date) =>
    firstDateMs === lastDateMs
      ? plot.left + plotWidth / 2
      : plot.left +
        ((date.getTime() - firstDateMs) / (lastDateMs - firstDateMs)) *
          plotWidth;
  const yForScore = (score: number) =>
    plot.top + ((scoreMaximum - score) / scoreMaximum) * plotHeight;
  const points = orderedScores.map((assessment) => ({
    ...assessment,
    x: xForDate(assessment.completedAt),
    y: yForScore(assessment.score),
  }));
  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
  const middleDate = new Date(firstDateMs + (lastDateMs - firstDateMs) / 2);
  const xTicks =
    firstDateMs === lastDateMs
      ? [orderedScores[0].completedAt]
      : uniqueDates([
          orderedScores[0].completedAt,
          middleDate,
          orderedScores.at(-1)!.completedAt,
        ]);
  const latest = orderedScores.at(-1)!;

  return (
    <div className="mt-6 min-w-0 rounded-xl border border-[#dce7ec] bg-[#fbfdfe] p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            DSMA-8 score history
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Higher scores indicate greater self-management risk.
          </p>
        </div>
        <p className="text-right">
          <span className="block text-lg font-bold text-teal-800">
            {latest.score}/24
          </span>
          <span className="block text-xs text-slate-500">
            Latest · {formatShortDateUtc(latest.completedAt)}
          </span>
        </p>
      </div>

      <svg
        aria-labelledby="assessment-score-title assessment-score-description"
        className="mt-3 block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id="assessment-score-title">DSMA-8 score history</title>
        <desc id="assessment-score-description">
          {orderedScores.length} completed assessment
          {orderedScores.length === 1 ? "" : "s"}. Scores range from{" "}
          {Math.min(...orderedScores.map(({ score }) => score))} to{" "}
          {Math.max(...orderedScores.map(({ score }) => score))} out of 24.
          Latest score is {latest.score}.
        </desc>

        {riskBands.map((band) => {
          const top = yForScore(band.max);
          const bottom = yForScore(band.min);

          return (
            <g key={band.label}>
              <rect
                fill={band.fill}
                height={bottom - top}
                opacity="0.7"
                width={plotWidth}
                x={plot.left}
                y={top}
              />
              <text
                fill="#49677c"
                fontSize="11"
                x={plot.right + 10}
                y={top + (bottom - top) / 2 + 4}
              >
                {band.label}
              </text>
            </g>
          );
        })}

        {[0, 6, 12, 18, 24].map((tick) => (
          <g key={tick}>
            <line
              stroke="#c9dce4"
              strokeWidth="1"
              x1={plot.left}
              x2={plot.right}
              y1={yForScore(tick)}
              y2={yForScore(tick)}
            />
            <text
              fill="#60758a"
              fontSize="11"
              textAnchor="end"
              x={plot.left - 9}
              y={yForScore(tick) + 4}
            >
              {tick}
            </text>
          </g>
        ))}

        <line
          stroke="#8ba5b4"
          x1={plot.left}
          x2={plot.left}
          y1={plot.top}
          y2={plot.bottom}
        />
        <line
          stroke="#8ba5b4"
          x1={plot.left}
          x2={plot.right}
          y1={plot.bottom}
          y2={plot.bottom}
        />

        {xTicks.map((date, index) => {
          const x = xForDate(date);

          return (
            <g key={date.toISOString()}>
              <line
                stroke="#8ba5b4"
                x1={x}
                x2={x}
                y1={plot.bottom}
                y2={plot.bottom + 5}
              />
              <text
                fill="#60758a"
                fontSize="11"
                textAnchor={
                  xTicks.length === 1
                    ? "middle"
                    : index === 0
                      ? "start"
                      : index === xTicks.length - 1
                        ? "end"
                        : "middle"
                }
                x={x}
                y={plot.bottom + 20}
              >
                {formatShortDateUtc(date)}
              </text>
            </g>
          );
        })}

        <text
          fill="#60758a"
          fontSize="11"
          textAnchor="middle"
          transform="rotate(-90 14 134)"
          x="14"
          y="134"
        >
          Score (0–24)
        </text>

        {points.length > 1 ? (
          <path
            d={linePath}
            fill="none"
            stroke="#1098a3"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ) : null}

        {points.map((point, index) => (
          <circle
            cx={point.x}
            cy={point.y}
            fill="#ffffff"
            key={`${point.completedAt.toISOString()}-${index}`}
            r="5"
            stroke="#1098a3"
            strokeWidth="3"
          >
            <title>
              {formatShortDateUtc(point.completedAt)}: {point.score} out of 24
            </title>
          </circle>
        ))}
      </svg>

      {orderedScores.length === 1 ? (
        <p className="mt-1 text-right text-xs text-slate-500">
          One completed assessment; another is needed to establish a trend.
        </p>
      ) : null}
    </div>
  );
}
