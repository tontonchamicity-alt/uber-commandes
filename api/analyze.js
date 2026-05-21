export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { image, mediaType } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
            { type: "text", text: `Regarde cette image et extrait le nom du client et le code de commande Uber Eats.
Le nom est souvent en gras en haut du ticket (ex: "Rabir D.").
Le code est une courte séquence alphanumérique (ex: "6A569").
Réponds UNIQUEMENT en JSON sans markdown :
{"found": true, "name": "nom trouvé", "code": "code trouvé"}
Si tu ne vois vraiment rien : {"found": false, "name": "Inconnu", "code": "Inconnu"}` }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = (data.content || []).find(b => b.type === "text")?.text || '{"found":false,"name":"Inconnu","code":"Inconnu"}';
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(result);
  } catch(e) {
    res.status(200).json({ found: false, name: "Inconnu", code: "Inconnu", error: e.message });
  }
}
