"use client";

interface ThemeLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeLogo({ className = "w-7 h-7 object-contain", style }: ThemeLogoProps) {
  return (
    <>
      <img src="/taskzen-lightmode.png" alt="TaskZen" className={`${className} dark:hidden`} style={style} />
      <img src="/taskzen.png"           alt="TaskZen" className={`${className} hidden dark:block`} style={style} />
    </>
  );
}
