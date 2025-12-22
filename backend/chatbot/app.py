
from flask import Flask, request, jsonify
import os
import openai
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Set the API key directly in the code
# In a production environment, use environment variables
os.environ["GROQ_API_KEY"] = "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"

client = openai.OpenAI(
  base_url="https://api.groq.com/openai/v1",
  api_key=os.environ.get("GROQ_API_KEY")
)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000,
        )
        response = completion.choices[0].message.content
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
