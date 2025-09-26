from flask import Flask, render_template, jsonify, request
from src.helper import download_hugging_face_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.vectorstores import VectorStoreRetriever
import ollama
from dotenv import load_dotenv
import os
import math
import time
import requests
import json

app = Flask(__name__)

load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
WHATSAPP_VERIFY_TOKEN = os.environ.get('WHATSAPP_VERIFY_TOKEN') or ""
WHATSAPP_TOKEN = os.environ.get('WHATSAPP_TOKEN') or ""
WHATSAPP_PHONE_ID = os.environ.get('WHATSAPP_PHONE_ID') or ""
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN') or ""
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID') or ""
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM') or ""

os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY or ""

embeddings = download_hugging_face_embeddings()

index_name = "medical-chatbot"
docsearch = PineconeVectorStore.from_existing_index(
    index_name=index_name,
    embedding=embeddings
)

retriever = docsearch.as_retriever(search_type="mmr", search_kwargs={"k": 3, "fetch_k": 12})

retriever_hospitals: VectorStoreRetriever = docsearch.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 4, "fetch_k": 16, "filter": {"doc_type": "hospital_list"}},
)

retriever_odia: VectorStoreRetriever = docsearch.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 3, "fetch_k": 12, "filter": {"lang": "or"}},
)

retriever_hospitals_odia: VectorStoreRetriever = docsearch.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 4, "fetch_k": 16, "filter": {"doc_type": "hospital_list", "lang": "or"}},
)

def normalize_lang(code: str) -> str:
    mapping = {"en": "English", "hi": "Hindi", "or": "Odia"}
    return mapping.get((code or "en").lower(), "English")

# --- Simple geocoding utilities ---
_geo_cache = {}

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def geocode_place(query: str):
    key = query.strip().lower()
    if key in _geo_cache:
        return _geo_cache[key]
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1},
            headers={"User-Agent": "medibot/1.0 (contact: example@example.com)"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data:
                item = data[0]
                lat = float(item.get("lat"))
                lon = float(item.get("lon"))
                display_name = item.get("display_name")
                result = {"lat": lat, "lng": lon, "address": display_name}
                _geo_cache[key] = result
                time.sleep(1.0)
                return result
    except Exception as _:
        pass
    _geo_cache[key] = None
    return None

def build_hospital_list_from_text(user_lat: float, user_lng: float, raw_text: str, max_items: int = 10):
    lines = [l.strip(" -•\t").strip() for l in (raw_text or "").split("\n") if l.strip()]
    hospitals = []
    for line in lines:
        if len(hospitals) >= max_items:
            break
        geo = geocode_place(line)
        if not geo:
            continue
        distance_km = _haversine_km(user_lat, user_lng, geo["lat"], geo["lng"]) if user_lat is not None and user_lng is not None else None
        hospitals.append({
            "name": line,
            "address": geo.get("address"),
            "lat": geo.get("lat"),
            "lng": geo.get("lng"),
            "distance_km": round(distance_km, 2) if distance_km is not None else None,
            "map_url": f"https://maps.google.com/?q={requests.utils.quote(line)}"
        })
    hospitals.sort(key=lambda h: (h["distance_km"] is None, h.get("distance_km", 0)))
    return hospitals[:max_items]

def fetch_hospitals_from_osm(user_lat: float, user_lng: float, radius_m: int = 7000, max_items: int = 12):
    try:
        query = f"""
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:{radius_m},{user_lat},{user_lng});
          way["amenity"="hospital"](around:{radius_m},{user_lat},{user_lng});
          relation["amenity"="hospital"](around:{radius_m},{user_lat},{user_lng});
        );
        out center {max_items};
        """
        resp = requests.post(
            "https://overpass-api.de/api/interpreter",
            data=query,
            headers={"User-Agent": "medibot/1.0 (contact: example@example.com)"},
            timeout=25,
        )
        results = []
        if resp.status_code == 200:
            data = resp.json()
            for el in data.get("elements", [])[:max_items*2]:
                tags = el.get("tags", {})
                name = tags.get("name")
                if not name:
                    continue
                lat = el.get("lat") or (el.get("center") or {}).get("lat")
                lon = el.get("lon") or (el.get("center") or {}).get("lon")
                if lat is None or lon is None:
                    continue
                dist = _haversine_km(user_lat, user_lng, float(lat), float(lon))
                results.append({
                    "name": name,
                    "address": tags.get("addr:full") or tags.get("addr:street"),
                    "lat": float(lat),
                    "lng": float(lon),
                    "distance_km": round(dist, 2),
                    "map_url": f"https://maps.google.com/?q={requests.utils.quote(name)}@{lat},{lon}",
                })
        results.sort(key=lambda h: h.get("distance_km", 1e9))
        return results[:max_items]
    except Exception:
        return []

def get_llama2_response(prompt):
    response = ollama.chat(model='llama2', messages=[{'role': 'user', 'content': prompt}])
    return response['message']['content']

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        msg = data.get('message', '')
        lang = data.get('language', 'en')
        lat = data.get('lat')
        lng = data.get('lng')

        if not msg:
            return jsonify({"error": "No message provided"}), 400

        target_language = normalize_lang(lang)
        # For now, we do not translate, but you can add translation logic here if needed

        # Choose retriever based on language (Odia -> Odia-only materials)
        active_retriever = retriever_odia if target_language == "Odia" else retriever

        # Retrieve relevant documents
        relevant_docs = active_retriever.get_relevant_documents(msg)
        context = "\n".join([doc.page_content for doc in relevant_docs])
        prompt = f"You are a helpful medical assistant. Use the following context to answer the question.\n\nContext:\n{context}\n\nQuestion: {msg}\nAnswer:"
        final_answer = get_llama2_response(prompt)

        sources = []
        for d in relevant_docs or []:
            meta = d.metadata if hasattr(d, "metadata") else {}
            sources.append({
                "source": meta.get("source"),
                "preview": (d.page_content[:200] + ("..." if len(d.page_content) > 200 else "")) if hasattr(d, "page_content") else None
            })

        # If coordinates provided, append a short list of nearby hospitals using the hospitals retriever
        if lat is not None and lng is not None:
            hospitals_struct = fetch_hospitals_from_osm(float(lat), float(lng))
            list_lines = []
            for h in hospitals_struct[:8]:
                info = f"{h['name']}" + (f" — {h['distance_km']} km" if h.get('distance_km') is not None else "")
                list_lines.append(f"- {info}")
            if list_lines:
                hospitals_section = "\n".join(list_lines)
                final_answer = f"{final_answer}\n\nNearby hospitals:\n{hospitals_section}"

        return jsonify({"response": final_answer, "sources": sources})
    except Exception as e:
        err_msg = str(e)
        print(f"/api/chat error: {err_msg}")
        if app.debug:
            return jsonify({"error": err_msg}), 500
        return jsonify({"error": "An error occurred processing your request"}), 500

@app.route("/test-bot")
def test_bot():
    return render_template('index.html')

@app.route("/alerts")
def alerts():
    return render_template('index.html')

@app.route("/nearby-hospitals")
def nearby_hospitals():
    return render_template('index.html')

@app.route("/api/nearby-hospitals", methods=["POST"])
def api_nearby_hospitals():
    try:
        data = request.json or {}
        lat = data.get("lat")
        lng = data.get("lng")
        lang = data.get("language", "en")

        if lat is None or lng is None:
            return jsonify({"error": "Missing lat/lng"}), 400

        hospitals = fetch_hospitals_from_osm(float(lat), float(lng))
        return jsonify({
            "hospitals": hospitals
        })
    except Exception as e:
        err = str(e)
        print(f"/api/nearby-hospitals error: {err}")
        return jsonify({"error": "Failed to fetch nearby hospitals"}), 500

@app.route("/features")
def features():
    return render_template('index.html')

# --- WhatsApp Cloud API integration ---
@app.route('/webhook', methods=['GET'])
def verify_webhook():
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    if mode == 'subscribe' and token == WHATSAPP_VERIFY_TOKEN:
        return challenge, 200
    return 'Forbidden', 403

def wa_send_message(phone_number_id: str, to: str, text: str) -> bool:
    if not WHATSAPP_TOKEN or not phone_number_id or not to:
        return False
    try:
        url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {WHATSAPP_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text[:4000]},
        }
        resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=15)
        return resp.status_code in (200, 201)
    except Exception:
        return False

@app.route('/webhook', methods=['POST'])
def receive_webhook():
    data = request.get_json(silent=True) or {}
    try:
        entry = (data.get('entry') or [{}])[0]
        changes = (entry.get('changes') or [{}])[0]
        value = changes.get('value') or {}
        messages = value.get('messages') or []
        if not messages:
            return jsonify({"status": "ignored"}), 200

        msg = messages[0]
        from_number = msg.get('from')
        phone_number_id = (value.get('metadata') or {}).get('phone_number_id') or WHATSAPP_PHONE_ID
        text = (msg.get('text') or {}).get('body') or ''

        # Use local LLM for WhatsApp as well
        relevant_docs = retriever.get_relevant_documents(text)
        context = "\n".join([doc.page_content for doc in relevant_docs])
        prompt = f"You are a helpful medical assistant. Use the following context to answer the question.\n\nContext:\n{context}\n\nQuestion: {text}\nAnswer:"
        answer = get_llama2_response(prompt)

        wa_send_message(phone_number_id, from_number, answer)
        return jsonify({"status": "ok"}), 200
    except Exception:
        return jsonify({"status": "error"}), 200

# --- Twilio WhatsApp webhook (no business WA needed) ---
@app.route('/twilio/whatsapp', methods=['POST'])
def twilio_whatsapp():
    try:
        from_number = request.form.get('From')
        to_number = request.form.get('To')
        body = request.form.get('Body') or ''

        relevant_docs = retriever.get_relevant_documents(body)
        context = "\n".join([doc.page_content for doc in relevant_docs])
        prompt = f"You are a helpful medical assistant. Use the following context to answer the question.\n\nContext:\n{context}\n\nQuestion: {body}\nAnswer:"
        answer = get_llama2_response(prompt)

        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM:
            try:
                twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
                payload = {
                    'From': TWILIO_WHATSAPP_FROM,
                    'To': from_number,
                    'Body': answer[:1600],
                }
                resp = requests.post(twilio_url, data=payload, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN), timeout=15)
                _ = resp.status_code
            except Exception:
                pass
        return ('', 200)
    except Exception:
        return ('', 200)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)































