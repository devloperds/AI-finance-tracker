import { useEffect, useRef } from "react";
import {
  ColorType,
  LineSeries,
  LineStyle,
  createChart,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import { css } from "../../utils/cssUtil";

export type TimePoint = {
  time: string | number;
  value: number;
};

function toLineData(points: TimePoint[]): LineData[] {
  return points.map((p) => {
    if (typeof p.time === "number") return { time: p.time as Time, value: p.value };
    const normalized = /^(\d{4}-\d{2})$/.test(p.time) ? `${p.time}-01` : p.time;
    return { time: normalized as Time, value: p.value };
  });
}

type Props = {
  height?: number;
  expensesActual: TimePoint[];
  expensesProjected?: TimePoint[];
  incomeActual?: TimePoint[];
  incomeProjected?: TimePoint[];
};

const TimeSeriesChart = ({
  height = 300,
  expensesActual,
  expensesProjected = [],
  incomeActual = [],
  incomeProjected = [],
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRefs = useRef<{ [key: string]: ISeriesApi<"Line"> }>({});

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: css("--background-secondary", "#ffffff") },
        textColor: css("--text-color", "#1b1b1b"),
      },
      grid: {
        vertLines: { color: css("--border-light", "#e5e7eb") },
        horzLines: { color: css("--border-light", "#e5e7eb") },
      },
    });
    chartRef.current = chart;

    const expActual = chart.addSeries(LineSeries);
    expActual.applyOptions({
      color: css("--error-color", "#ef4444"),
      lineStyle: LineStyle.Solid,
      title: "Expenses",
    });
    expActual.setData(toLineData(expensesActual));
    seriesRefs.current["expensesActual"] = expActual;

    if (expensesProjected.length > 0) {
      const expProj = chart.addSeries(LineSeries);
      expProj.applyOptions({
        color: css("--warning-color", "#f59e0b"),
        lineStyle: LineStyle.Dotted,
        title: "Expenses (Projected)",
      });
      expProj.setData(toLineData(expensesProjected));
      seriesRefs.current["expensesProjected"] = expProj;
    }

    if (incomeActual.length > 0) {
      const incActual = chart.addSeries(LineSeries);
      incActual.applyOptions({
        color: css("--success-color", "#10b981"),
        lineStyle: LineStyle.Solid,
        title: "Income",
      });
      incActual.setData(toLineData(incomeActual));
      seriesRefs.current["incomeActual"] = incActual;
    }

    if (incomeProjected.length > 0) {
      const incProj = chart.addSeries(LineSeries);
      incProj.applyOptions({
        color: css("--info-color", "#3b82f6"),
        lineStyle: LineStyle.Dotted,
        title: "Income (Projected)",
      });
      incProj.setData(toLineData(incomeProjected));
      seriesRefs.current["incomeProjected"] = incProj;
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = {};
    };
  }, [height, expensesActual, expensesProjected, incomeActual, incomeProjected]);

  return <div ref={containerRef} style={{ width: "100%", position: "relative" }} />;
};

export default TimeSeriesChart;
