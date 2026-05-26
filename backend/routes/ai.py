import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from config import Config

ai_bp = Blueprint("ai", __name__)

SYSTEM_PROMPT = """Sen PatiBul uygulamasının yapay zeka destekli hayvan sağlığı asistanısın. 
Adın Pati.

Görevin:
- Yaralı, hasta veya zor durumda kalan hayvanlar için ilk yardım bilgisi vermek
- Yavru hayvanların beslenmesi, bakımı hakkında rehberlik etmek
- Sokak hayvanlarına nasıl yaklaşılacağı konusunda yardımcı olmak
- Acil durumlarda ne yapılması gerektiğini açıklamak
- Veterinere ne zaman gidilmesi gerektiğini belirtmek

Kurallar:
- SADECE hayvanlarla ilgili sorulara yanıt ver
- Hayvanlarla ilgisi olmayan sorulara "Ben sadece hayvan sağlığı ve bakımı konularında yardımcı olabiliyorum." de
- Yanıtların kısa, net ve uygulanabilir olsun
- Türkçe yanıt ver
- Acil durumlarda mutlaka veterinere yönlendir
- Emoji kullanarak daha anlaşılır yaz
- Kesin tıbbi teşhis koyma, genel ilk yardım bilgisi ver"""


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    data = request.get_json()
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "Mesaj zorunludur"}), 400

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {Config.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "max_tokens": 500,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    *messages,
                ],
            },
            timeout=20,
        )

        if response.status_code != 200:
            return jsonify({"error": "AI servisine ulaşılamadı"}), 500

        content = response.json()["choices"][0]["message"]["content"]
        return jsonify({"message": content}), 200

    except requests.Timeout:
        return jsonify({"error": "İstek zaman aşımına uğradı"}), 504
    except Exception as e:
        print(f"AI chat hatası: {str(e)}")
        return jsonify({"error": "Bir hata oluştu"}), 500