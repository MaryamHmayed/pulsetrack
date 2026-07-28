"use client";

import { useState } from "react";
import { buildTimeSeriesGeometry } from "@/lib/charts/time-series";
import { formatShortDateUtc } from "@/lib/format/date";

type LabTrendResult = {
  collectedDate: Date;
  value: number;
  valueText: string;
  unit: string;
  refLow: number | null;
  refLowText: string | null;
  refHigh: number | null;
  refHighText: string | null;
};

type LabTrendChartProps = {
  idPrefix: string;
  title: string;
  results: LabTrendResult[];
};

const width = 640;
const height = 280;
const plotLeft = 58;
const plotRight = 616;
const plotTop = 24;
const plotBottom = 234;

function formatTick(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function LabTrendChart({
  idPrefix,
  title,
  results,
}: LabTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState(
    Math.max(results.length - 1, 0),
  );

  if (results.length === 0) {
    return (
      <article className="rounded-xl border border-dashed border-[#bfd6df] bg-[#fbfdfe] p-5">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <div className="flex min-h-56 items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-slate-700">No results yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Import a CSV containing this test to begin the trend.
            </p>
          </div>
        </div>
      </article>
    );
  }

  const orderedResults = [...results].sort(
    (first, second) =>
      first.collectedDate.getTime() - second.collectedDate.getTime(),
  );
  const latest = orderedResults.at(-1)!;
  const selectedIndex = Math.min(activeIndex, orderedResults.length - 1);
  const selected = orderedResults[selectedIndex];
  const latestWithRange = orderedResults.findLast(
    (result) =>
      result.refLow !== null &&
      result.refHigh !== null &&
      result.refLowText !== null &&
      result.refHighText !== null,
  );
  const geometry = buildTimeSeriesGeometry(
    orderedResults.map((result) => ({
      date: result.collectedDate,
      value: result.value,
    })),
    latestWithRange?.refLow ?? null,
    latestWithRange?.refHigh ?? null,
  );
  const linePath = geometry.points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
  const titleId = `${idPrefix}-chart-title`;
  const descriptionId = `${idPrefix}-chart-description`;

  return (
    <article className="min-w-0 rounded-xl border border-[#dce7ec] bg-[#fbfdfe] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900" id={titleId}>
            {title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {latestWithRange
              ? `Reference ${latestWithRange.refLowText}-${latestWithRange.refHighText} ${latestWithRange.unit}`
              : "Reference range unavailable"}
          </p>
        </div>
        <p aria-live="polite" className="text-right">
          <span className="block text-lg font-bold text-teal-800">
            {selected.valueText}{" "}
            <span className="text-sm font-medium">{selected.unit}</span>
          </span>
          <span className="block text-xs text-slate-500">
            {selectedIndex === orderedResults.length - 1 ? "Latest" : "Selected"}{" "}
            · {formatShortDateUtc(selected.collectedDate)}
          </span>
        </p>
      </div>
      <p className="sr-only" id={descriptionId}>
        {orderedResults.length} {title} result
        {orderedResults.length === 1 ? "" : "s"}, from{" "}
        {formatShortDateUtc(orderedResults[0].collectedDate)} to{" "}
        {formatShortDateUtc(latest.collectedDate)}. Latest result is{" "}
        {latest.valueText} {latest.unit}.
        {latestWithRange
          ? " The most recent recorded reference range is shown."
          : " No reference range was supplied."}
      </p>

      <svg
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="mt-4 block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {geometry.referenceBand ? (
          <rect
            fill="#d8f1f2"
            height={geometry.referenceBand.bottom - geometry.referenceBand.top}
            opacity="0.65"
            width={plotRight - plotLeft}
            x={plotLeft}
            y={geometry.referenceBand.top}
          />
        ) : null}

        {geometry.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              stroke="#dce7ec"
              strokeWidth="1"
              x1={plotLeft}
              x2={plotRight}
              y1={tick.y}
              y2={tick.y}
            />
            <text
              fill="#60758a"
              fontSize="11"
              textAnchor="end"
              x={plotLeft - 9}
              y={tick.y + 4}
            >
              {formatTick(tick.value)}
            </text>
          </g>
        ))}

        <line
          stroke="#8ba5b4"
          strokeWidth="1"
          x1={plotLeft}
          x2={plotRight}
          y1={plotBottom}
          y2={plotBottom}
        />
        <line
          stroke="#8ba5b4"
          strokeWidth="1"
          x1={plotLeft}
          x2={plotLeft}
          y1={plotTop}
          y2={plotBottom}
        />

        {geometry.xTicks.map((tick, index) => (
          <g key={tick.date.toISOString()}>
            <line
              stroke="#8ba5b4"
              x1={tick.x}
              x2={tick.x}
              y1={plotBottom}
              y2={plotBottom + 5}
            />
            <text
              fill="#60758a"
              fontSize="11"
              textAnchor={
                geometry.xTicks.length === 1
                  ? "middle"
                  : index === 0
                    ? "start"
                    : index === geometry.xTicks.length - 1
                      ? "end"
                      : "middle"
              }
              x={tick.x}
              y={plotBottom + 20}
            >
              {formatShortDateUtc(tick.date)}
            </text>
          </g>
        ))}

        <text
          fill="#60758a"
          fontSize="11"
          textAnchor="middle"
          transform="rotate(-90 13 129)"
          x="13"
          y="129"
        >
          {latest.unit}
        </text>

        {geometry.points.length > 1 ? (
          <path
            d={linePath}
            fill="none"
            stroke="#1098a3"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ) : null}

        <line
          aria-hidden="true"
          stroke="#1098a3"
          strokeDasharray="4 5"
          strokeOpacity="0.35"
          x1={geometry.points[selectedIndex].x}
          x2={geometry.points[selectedIndex].x}
          y1={plotTop}
          y2={plotBottom}
        />

        {geometry.points.map((point, index) => (
          <circle
            aria-label={`${formatShortDateUtc(point.date)}: ${formatTick(point.value)} ${latest.unit}`}
            cx={point.x}
            cy={point.y}
            fill={selectedIndex === index ? "#1098a3" : "#ffffff"}
            className="cursor-pointer outline-none focus-visible:stroke-[#073a5a]"
            key={`${point.date.toISOString()}-${index}`}
            onClick={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActiveIndex(index);
              }
            }}
            onMouseEnter={() => setActiveIndex(index)}
            r={selectedIndex === index ? 7 : 5}
            role="button"
            stroke="#1098a3"
            strokeWidth="3"
            tabIndex={0}
          />
        ))}
      </svg>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        {geometry.referenceBand ? (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-5 rounded-sm bg-[#d8f1f2]"
            />
            Most recent recorded reference range
          </span>
        ) : (
          <span>Reference range not supplied</span>
        )}
        {orderedResults.length === 1 ? (
          <span>One result; another is needed to establish a trend.</span>
        ) : (
          <span>{orderedResults.length} results</span>
        )}
      </div>
      <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
        Select or focus a point to inspect its date and value.
      </p>
    </article>
  );
}
