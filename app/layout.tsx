import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Construction Cost Calculator | Duo Tax Quantity Surveyors",
  description:
    "Estimate indicative construction costs by property type, floor area and finish level, with a transparent breakdown of how the estimate is calculated.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
