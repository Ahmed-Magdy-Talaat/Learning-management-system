import { Document } from "mongoose";

interface MonthData {
  month: string;
  count: number;
}

export async function generateLast12MonthsData<T extends Document>(
  data: T[]
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);
  for (let i = 11; i >= 0; --i) {
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i * 28
    );
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - 28
    );
    const monthYear = endDate.toLocaleDateString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const count = data.filter(
      (user: any) => user.createdAt > startDate && user.createdAt < endDate
    ).length;
    last12Months.push({ month: monthYear, count });
    console.log(count);
  }
  return { last12Months };
}
