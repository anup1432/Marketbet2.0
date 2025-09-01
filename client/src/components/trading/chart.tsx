import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface ChartProps {
  priceHistory: Array<{
    id: string;
    price: string;
    timestamp: string;
  }>;
}

export default function Chart({ priceHistory }: ChartProps) {
  // Transform data for chart
  const chartData = (priceHistory || []).map((item, index) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    }),
    price: parseFloat(item.price || "0"),
    index: index,
  })).slice(-20); // Show last 20 data points

  // Calculate price change
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1]?.price || 67890.45 : 67890.45;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2]?.price || currentPrice : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-gray-700">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
