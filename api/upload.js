export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { image, mediaType } = req.body;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "uber-commandes";

    // Signature
    const crypto = await import("crypto");
    const signStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha256").update(signStr).digest("hex");

    const formData = new URLSearchParams();
    formData.append("file", `data:${mediaType || "image/jpeg"};base64,${image}`);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("folder", folder);
    formData.append("signature", signature);

    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });

    const data = await r.json();
    if (data.secure_url) {
      res.status(200).json({ url: data.secure_url });
    } else {
      res.status(500).json({ error: "Upload failed", details: data });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
