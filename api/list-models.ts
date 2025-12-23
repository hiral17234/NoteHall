export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key missing" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        headers: {
          "x-goog-api-key": apiKey,
        },
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("LIST MODELS ERROR:", err);
    return res.status(500).json({ error: "Failed to list models" });
  }
}
