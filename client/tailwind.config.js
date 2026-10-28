const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: v('ink'), panel: v('panel'), raised: v('raised'), line: v('line'), fg: v('fg'), mute: v('mute'), accent: v('accent'), warn: v('warn'), bad: v('bad') },
      fontFamily: { sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] },
    },
  },
  plugins: [],
};
