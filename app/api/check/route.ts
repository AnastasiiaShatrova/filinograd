import { NextResponse } from "next/server";
import { redis } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const report: Record<string, any> = {};

  // 1. Проверяем наличие ключей
  report["1_переменные"] = {
    YC_FOLDER_ID: process.env.YC_FOLDER_ID ? "✅ Заполнен" : "❌ Пусто",
    YC_API_KEY: process.env.YC_API_KEY ? "✅ Заполнен" : "❌ Пусто",
    UPSTASH_URL: process.env.UPSTASH_REDIS_REST_URL ? "✅ Заполнен" : "❌ Пусто",
    UPSTASH_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? "✅ Заполнен" : "❌ Пусто",
  };

  // 2. Проверяем базу Upstash
  try {
    await redis.set("test_ping", "ok", { ex: 60 });
    const ping = await redis.get("test_ping");
    report["2_база_данных_Upstash"] = ping === "ok" ? "✅ Работает отлично" : "⚠️ Не вернула ответ";
  } catch (e: any) {
    report["2_база_данных_Upstash"] = `❌ Ошибка: ${e.message}`;
  }

  // 3. Проверяем Яндекс
  try {
    const res = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${process.env.YC_API_KEY}`,
      },
      body: JSON.stringify({
        modelUri: `gpt://${process.env.YC_FOLDER_ID}/yandexgpt-lite/latest`,
        completionOptions: { temperature: 0.5, maxTokens: "50" },
        messages: [{ role: "user", text: "Привет" }],
      }),
    });

    const body = await res.text();
    if (res.ok) {
      report["3_нейросеть_Яндекс"] = "✅ Работает отлично, ответ получен!";
    } else {
      report["3_нейросеть_Яндекс"] = `❌ Яндекс вернул ошибку ${res.status}: ${body}`;
    }
  } catch (e: any) {
    report["3_нейросеть_Яндекс"] = `❌ Не удалось отправить запрос: ${e.message}`;
  }

  return NextResponse.json(report);
}
