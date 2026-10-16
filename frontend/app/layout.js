import "./globals.css";

export const metadata = {
  title: "Sleep Stage Predicter",
  description:
    "Estimate sleep stages from wrist accelerometer and heart-rate data. Research estimates, not a medical diagnosis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}