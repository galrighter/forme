// סמל RM — placeholder לפי ה-brand spec (עד שייבנה מונוגרם וקטורי סופי).
// ריבוע גרפיט עם RM ב-Archivo וריבוע קובלט מסובב בפינה.
export default function Monogram({ size = 38 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center font-display font-semibold text-graphite"
      style={{
        width: size,
        height: size,
        border: "1.5px solid var(--color-graphite)",
        fontSize: size * 0.4,
        letterSpacing: "1px",
      }}
      aria-hidden="true"
    >
      RM
      <div
        className="absolute bg-cobalt"
        style={{
          bottom: -4,
          insetInlineStart: -4,
          width: 8,
          height: 8,
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}
