"""
LEGACY FLASK ENTRYPOINT

Este projeto foi padronizado para usar o backend Node/Express em:
`projeto-shineray/backend/server.js`

Este arquivo existe apenas para evitar confusao durante a transicao.
"""

from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/")
def legacy_index():
    return jsonify(
        {
            "message": "Backend Flask descontinuado.",
            "use_backend": "Node/Express em backend/server.js",
            "api_base_url": "http://localhost:5000/api",
        }
    )


@app.route("/api/<path:_path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def legacy_api(_path):
    return (
        jsonify(
            {
                "error": "API Flask descontinuada",
                "details": "Use o backend Node/Express em backend/server.js",
            }
        ),
        410,
    )


if __name__ == "__main__":
    app.run(debug=True, port=5050)
