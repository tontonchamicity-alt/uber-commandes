export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

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
          { type: "text", text: `Analyse cette image. Cherche tout texte visible : nom de personne, numéro de commande, référence, code. Même si c'est partiel ou flou, essaie d'extraire quelque chose.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"found": true/false, "name": "nom trouvé ou Inconnu", "code": "code ou numéro trouvé ou Inconnu"}
Si tu vois du texte mais pas clairement un ticket Uber, essaie quand même d'extraire un nom et un code.
found doit être true dès que tu vois du texte lisible dans l'image.` }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = (data.content || []).find(b => b.type === "text")?.text || '{"found":false,"name":"Inconnu","code":"Inconnu"}';
  try {
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(result);
  } catch {
    res.status(200).json({ found: false, name: "Inconnu", code: "Inconnu" });
  }
}
