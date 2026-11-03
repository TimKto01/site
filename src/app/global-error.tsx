"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ru">
      <head>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          background: "#fcfcf7",
          color: "#263e30",
          fontFamily: "Arial, sans-serif",
          padding: "40px",
          lineHeight: 1.7,
        }}
      >
        <p>GREENSTORE</p>
        <h1>Магазин временно недоступен</h1>
        <p>
          Не удалось загрузить данные. Попробуйте открыть страницу ещё раз
          немного позже.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "12px 20px",
            border: "1px solid #263e30",
            borderRadius: "24px",
            cursor: "pointer",
          }}
        >
          Повторить
        </button>
      </body>
    </html>
  );
}
