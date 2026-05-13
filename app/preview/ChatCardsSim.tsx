"use client";

import ChatCard, { type ChatCardData } from "../components/ChatCards";
import { StatusBar, GestureNav } from "../components/AppChrome";
import { typography } from "../lib/typography";

// Every card type with representative fixture data
const CARDS: { label: string; data: ChatCardData }[] = [
  {
    label: "Spend Overview",
    data: {
      type: "spend-overview",
      month: "Feb",
      amount: 78400,
      comparisonText: "12% higher than your average",
      chartData: [
        { label: "Sep", value: 58000 },
        { label: "Oct", value: 63200 },
        { label: "Nov", value: 71000 },
        { label: "Dec", value: 89500 },
        { label: "Jan", value: 66800 },
        { label: "Feb", value: 78400 },
      ],
      average: 67200,
      highlightIndex: 5,
    },
  },
  {
    label: "Category Breakdown",
    data: {
      type: "category-breakdown",
      month: "Feb",
      amount: 78400,
      subtext: "across 12 categories",
      showAll: true,
      categories: [
        { name: "Food & Delivery", amount: 22400, pct: 29, color: "#ff9a17", icon: "\ud83c\udf54" },
        { name: "Shopping", amount: 18600, pct: 24, color: "#d30ad7", icon: "\ud83d\udecd\ufe0f" },
        { name: "Transport", amount: 11200, pct: 14, color: "#2b6acf", icon: "\ud83d\ude97" },
        { name: "Subscriptions", amount: 8400, pct: 11, color: "#00a63e", icon: "\ud83d\udcf1" },
        { name: "Utilities", amount: 7800, pct: 10, color: "#ce1d26", icon: "\ud83d\udca1" },
        { name: "Other", amount: 10000, pct: 13, color: "#8e949d", icon: "\ud83d\udce6" },
      ],
    },
  },
  {
    label: "Goal Progress \u2014 Ahead",
    data: {
      type: "goal-progress",
      name: "Trip to Japan",
      pct: 62,
      saved: 93000,
      target: 150000,
      daysLabel: "11 days ahead",
      status: "ahead",
    },
  },
  {
    label: "Goal Progress \u2014 Behind",
    data: {
      type: "goal-progress",
      name: "Trip to Japan",
      pct: 38,
      saved: 57000,
      target: 150000,
      daysLabel: "14 days behind",
      status: "behind",
    },
  },
  {
    label: "Goal Progress \u2014 On Track",
    data: {
      type: "goal-progress",
      name: "Trip to Japan",
      pct: 50,
      saved: 75000,
      target: 150000,
      daysLabel: "On track",
      status: "on-track",
    },
  },
  {
    label: "Investment Product (FD)",
    data: {
      type: "investment-product",
      productType: "Fixed Deposit",
      amount: 15000,
      rate: "7.25% p.a.",
      tenure: "1 year",
      amountOptions: [
        { label: "\u20b910k", value: 10000 },
        { label: "\u20b915k", value: 15000 },
        { label: "\u20b918k", value: 18000 },
      ],
      accountLabel: "Savings xx1234",
      activated: false,
    },
  },
  {
    label: "Investment Product (Activated)",
    data: {
      type: "investment-product",
      productType: "Fixed Deposit",
      amount: 15000,
      rate: "7.25% p.a.",
      tenure: "1 year",
      amountOptions: [
        { label: "\u20b910k", value: 10000 },
        { label: "\u20b915k", value: 15000 },
        { label: "\u20b918k", value: 18000 },
      ],
      accountLabel: "Savings xx1234",
      activated: true,
    },
  },
  {
    label: "Savings Plan",
    data: {
      type: "savings-plan",
      name: "Trip to Japan",
      target: 150000,
      timeline: "Dec 2025",
      existingSavings: 30000,
      monthlyAmount: 8500,
      productType: "RD",
      productLabel: "Recurring Deposit",
      rate: "6.5% p.a.",
      pct: 20,
      timelineLabel: "11 months \u00b7 Dec 2025",
    },
  },
  {
    label: "Merchant Concentration",
    data: {
      type: "merchant-concentration",
      month: "Feb",
      totalSpend: 78400,
      totalMerchants: 23,
      merchants: [
        { name: "Swiggy", amount: 14200, pct: 18, color: "#ff9a17" },
        { name: "Amazon", amount: 12800, pct: 16, color: "#d30ad7" },
        { name: "Uber", amount: 8400, pct: 11, color: "#2b6acf" },
        { name: "BigBasket", amount: 6200, pct: 8, color: "#00a63e" },
        { name: "Zomato", amount: 5800, pct: 7, color: "#ce1d26" },
      ],
    },
  },
  {
    label: "Category MoM",
    data: {
      type: "category-mom",
      thisMonth: "Feb",
      lastMonth: "Jan",
      categories: [
        { name: "Food", thisValue: 22400, lastValue: 18000, color: "#ff9a17" },
        { name: "Shopping", thisValue: 18600, lastValue: 21000, color: "#d30ad7" },
        { name: "Transport", thisValue: 11200, lastValue: 9800, color: "#2b6acf" },
        { name: "Utilities", thisValue: 7800, lastValue: 7200, color: "#00a63e" },
        { name: "Fun", thisValue: 6000, lastValue: 8400, color: "#ce1d26" },
      ],
    },
  },
  {
    label: "Spend Trend",
    data: {
      type: "spend-trend",
      month: "Feb",
      chartData: [
        { label: "Sep", value: 58000 },
        { label: "Oct", value: 63200 },
        { label: "Nov", value: 71000 },
        { label: "Dec", value: 89500 },
        { label: "Jan", value: 66800 },
        { label: "Feb", value: 78400 },
      ],
      average: 67200,
      highlightIndex: 5,
    },
  },
  {
    label: "Spending Heatmap",
    data: {
      type: "spending-heatmap",
      month: "Feb",
      year: 2025,
      startDay: 5,
      dailySpend: [
        3200, 0, 1800, 4500, 2200, 6800, 1200,
        900, 3400, 5100, 2800, 0, 7200, 1500,
        2100, 4200, 3800, 1100, 8500, 2400, 600,
        3900, 5600, 2000, 1400, 4800, 3100, 7800,
      ],
      maxSpend: 8500,
    },
  },
  {
    label: "Payment Mode Donut",
    data: {
      type: "payment-mode-donut-v2",
      month: "Feb",
      totalSpend: 78400,
      modes: [
        { name: "UPI", amount: 41200, pct: 53, color: "#d30ad7" },
        { name: "Credit Card", amount: 22100, pct: 28, color: "#2b6acf" },
        { name: "Debit Card", amount: 9400, pct: 12, color: "#ff9a17" },
        { name: "NEFT/IMPS", amount: 3800, pct: 5, color: "#00a63e" },
        { name: "Cash", amount: 1900, pct: 2, color: "#8e949d" },
      ],
    },
  },
  {
    label: "Transaction Table",
    data: {
      type: "transaction-table",
      title: "Recent transactions",
      transactions: [
        { date: "28 Feb", merchant: "Swiggy", amount: 486, category: "Food" },
        { date: "27 Feb", merchant: "Amazon", amount: 2499, category: "Shopping" },
        { date: "27 Feb", merchant: "Uber", amount: 342, category: "Transport" },
        { date: "26 Feb", merchant: "BigBasket", amount: 1850, category: "Groceries" },
        { date: "25 Feb", merchant: "Zomato", amount: 720, category: "Food" },
      ],
    },
  },
  {
    label: "Obligations List",
    data: {
      type: "obligations-list-v2",
      items: [
        { id: "v2-1", payee: "Satya Prak", amount: 21700, type: "Rent/EMI", seenMonths: "3/4 months" },
        { id: "v2-2", payee: "Satishk019", amount: 4000, type: "P2P", seenMonths: "3/4 months" },
        { id: "v2-3", payee: "Vinod Kumar", amount: 3000, type: "P2P", seenMonths: "3/4 months" },
        { id: "v2-4", payee: "Mukesh Kumar", amount: 2500, type: "P2P", seenMonths: "4/4 months" },
        { id: "v2-5", payee: "Delhi Metro", amount: 1500, type: "Utility", seenMonths: "3/4 months" },
      ],
      monthlyIncome: 27000,
    },
  },
  {
    label: "Add to Pot",
    data: {
      type: "add-to-pot",
      goalName: "Trip to Japan",
      amount: 5000,
      fromAccount: "Savings xx1234",
      activated: false,
    },
  },
];

export default function ChatCardsSim() {
  return (
    <div style={{ width: 360, height: 780, overflow: "hidden", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StatusBar />
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ ...typography.headerH4, color: "rgba(0,0,0,0.9)", margin: 0 }}>
          Chat Cards
        </p>
        <p style={{ ...typography.bodySmall, color: "rgba(0,0,0,0.5)", margin: 0, marginTop: -12 }}>
          {CARDS.length} card types
        </p>
        {CARDS.map((c) => (
          <div key={c.label}>
            <p style={{ ...typography.metadata, textTransform: "uppercase", color: "rgba(0,0,0,0.4)", margin: 0, marginBottom: 6 }}>
              {c.label}
            </p>
            <ChatCard card={{ ...c.data }} />
          </div>
        ))}
        <div style={{ height: 24 }} />
      </div>
      <GestureNav />
    </div>
  );
}
