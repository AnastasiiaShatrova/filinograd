export async function yandexChat(system: string, user: string): Promise<string> {
  const res = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${process.env.YC_API_KEY}`,
    },
    body: JSON.stringify({
      modelUri: `gpt://${process.env.YC_FOLDER_ID}/yandexgpt-lite/latest`,
      completionOptions: { temperature: 0.9, maxTokens: "2000" },
      messages: [
        { role: "system", text: system },
        { role: "user", text: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`YandexGPT ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.result.alternatives[0].message.text as string;
}
