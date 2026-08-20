import os
import bcrypt
import pickle
import requests as http_requests
import feedparser
import urllib.parse
import re
import json
import hashlib
import hmac
import secrets
import smtplib
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader
import io
import google.generativeai as genai
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import motor.motor_asyncio
from passlib.context import CryptContext
import jwt as pyjwt
import razorpay
from bson import ObjectId
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from sklearn.ensemble import IsolationForest

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

# ── MongoDB (Motor async client) ───────────────────────────────────────────────
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/cognivault")
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = mongo_client.get_default_database()
users_col = db["users"]
workspaces_col = db["workspaces"]
tickets_col = db["supporttickets"]
enterprise_col = db["enterprise_proposals"]

# ── Auth helpers ──────────────────────────────────────────────────────────────
JWT_SECRET = os.environ.get("JWT_SECRET", "super_secret_jwt_key_change_in_production")
EMAIL_USER = os.environ.get("EMAIL_USER", "")
EMAIL_PASS = os.environ.get("EMAIL_PASS", "")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

class DummyPwdContext:
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    def verify(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

pwd_context = DummyPwdContext()

# OTP store (in-memory, same as Node.js)
otp_store: dict = {}

limiter = Limiter(key_func=get_remote_address, default_limits=["50/minute"])
app = FastAPI(title="CogniVault AI Classification Engine")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:5000",   # Node.js backend (server-to-server calls)
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ML Models ──────────────────────────────────────────────────
print("Loading Scikit-Learn Models...")
try:
    with open("vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)
    print("Models loaded successfully!")
except FileNotFoundError:
    print("WARNING: ML models not found!")
    vectorizer = None
    model = None

# ── VADER ──────────────────────────────────────────────────────
analyzer = SentimentIntensityAnalyzer()

# ══════════════════════════════════════════════════════════════════
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "FastAPI AI Engine is running"}


# ══════════════════════════════════════════════════════════════════
@app.post("/api/ai/classify")
async def classify_document(file: UploadFile = File(...)):
    if not model or not vectorizer:
        raise HTTPException(status_code=500, detail="ML Model not initialized.")
    contents = await file.read()
    filename = file.filename.lower()
    extracted_text = ""
    try:
        if filename.endswith(".pdf"):
            pdf_reader = PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + " "
        else:
            extracted_text = contents.decode("utf-8", errors="ignore")
        if not extracted_text.strip():
            return {"classification": "Unknown (Empty Document)", "confidence": 0.0}
        X_test = vectorizer.transform([extracted_text])
        prediction = model.predict(X_test)[0]
        probabilities = model.predict_proba(X_test)[0]
        confidence = float(max(probabilities)) * 100
        return {"classification": prediction, "confidence": round(confidence, 2), "message": "AI Classification complete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


# ══════════════════════════════════════════════════════════════════
#  /api/vendor/suggest — Clearbit Autocomplete (free, no key)
#  Solves the entity resolution problem — user picks the exact company
# ══════════════════════════════════════════════════════════════════
@app.get("/api/vendor/suggest")
def vendor_suggest(q: str = Query(...)):
    # TLD → Country + Flag mapping
    TLD_MAP = {
        'in': ('India', '🇮🇳'), 'co.in': ('India', '🇮🇳'),
        'uk': ('United Kingdom', '🇬🇧'), 'co.uk': ('United Kingdom', '🇬🇧'),
        'au': ('Australia', '🇦🇺'), 'com.au': ('Australia', '🇦🇺'),
        'de': ('Germany', '🇩🇪'), 'fr': ('France', '🇫🇷'),
        'ca': ('Canada', '🇨🇦'), 'jp': ('Japan', '🇯🇵'),
        'cn': ('China', '🇨🇳'), 'sg': ('Singapore', '🇸🇬'),
        'ae': ('UAE', '🇦🇪'), 'nz': ('New Zealand', '🇳🇿'),
        'za': ('South Africa', '🇿🇦'), 'br': ('Brazil', '🇧🇷'),
        'mx': ('Mexico', '🇲🇽'), 'nl': ('Netherlands', '🇳🇱'),
        'se': ('Sweden', '🇸🇪'), 'no': ('Norway', '🇳🇴'),
        'dk': ('Denmark', '🇩🇰'), 'fi': ('Finland', '🇫🇮'),
        'it': ('Italy', '🇮🇹'), 'es': ('Spain', '🇪🇸'),
        'com': ('USA / Global', '🌐'), 'io': ('Global', '🌐'),
        'co': ('Global', '🌐'), 'net': ('Global', '🌐'),
        'org': ('Global', '🌐'),
    }

    def get_country(domain):
        if not domain:
            return ('Unknown', '')
        # Try compound TLDs first (co.in, co.uk, com.au)
        parts = domain.split('.')
        if len(parts) >= 3:
            compound = '.'.join(parts[-2:])
            if compound in TLD_MAP:
                return TLD_MAP[compound]
        tld = parts[-1] if parts else 'com'
        return TLD_MAP.get(tld, ('Unknown', ''))

    # Nationality adjective → (Country, Flag)  — overrides TLD when found
    NATIONALITY_MAP = {
        'indian': ('India', '🇮🇳'),
        'american': ('USA', '🇺🇸'),
        'british': ('United Kingdom', '🇬🇧'),
        'english': ('United Kingdom', '🇬🇧'),
        'german': ('Germany', '🇩🇪'),
        'french': ('France', '🇫🇷'),
        'canadian': ('Canada', '🇨🇦'),
        'japanese': ('Japan', '🇯🇵'),
        'chinese': ('China', '🇨🇳'),
        'australian': ('Australia', '🇦🇺'),
        'dutch': ('Netherlands', '🇳🇱'),
        'swedish': ('Sweden', '🇸🇪'),
        'norwegian': ('Norway', '🇳🇴'),
        'danish': ('Denmark', '🇩🇰'),
        'finnish': ('Finland', '🇫🇮'),
        'singaporean': ('Singapore', '🇸🇬'),
        'south korean': ('South Korea', '🇰🇷'),
        'korean': ('South Korea', '🇰🇷'),
        'irish': ('Ireland', '🇮🇪'),
        'swiss': ('Switzerland', '🇨🇭'),
        'italian': ('Italy', '🇮🇹'),
        'spanish': ('Spain', '🇪🇸'),
        'brazilian': ('Brazil', '🇧🇷'),
        'mexican': ('Mexico', '🇲🇽'),
        'emirati': ('UAE', '🇦🇪'),
        'south african': ('South Africa', '🇿🇦'),
        'israeli': ('Israel', '🇮🇱'),
        'taiwanese': ('Taiwan', '🇹🇼'),
        'russian': ('Russia', '🇷🇺'),
        'pakistani': ('Pakistan', '🇵🇰'),
        'bangladeshi': ('Bangladesh', '🇧🇩'),
    }

    def get_wiki_info(company_name):
        """
        Quick Wikipedia lookup. Returns:
          city    — HQ city (e.g. "Bengaluru")
          country — Country name (e.g. "India")  ← from nationality adjective in text
          flag    — Flag emoji (e.g. "🇮🇳")
        All can be None if not found.
        """
        try:
            wr = http_requests.get(
                "https://en.wikipedia.org/w/api.php",
                params={"action": "query", "format": "json", "prop": "extracts",
                        "exintro": 1, "explaintext": 1, "redirects": 1,
                        "exsentences": 3, "titles": company_name},
                timeout=4
            )
            pages = wr.json().get("query", {}).get("pages", {})
            page = next(iter(pages.values()))
            if "missing" in page:
                return None, None, None

            extract = page.get("extract", "").lower()

            # 1. Extract country from nationality adjective
            # e.g. "Infosys is an Indian multinational..."
            wiki_country, wiki_flag = None, None
            # Try multi-word nationalities first
            for nat, (country, flag) in NATIONALITY_MAP.items():
                if f' {nat} ' in extract or f' {nat}\n' in extract:
                    wiki_country, wiki_flag = country, flag
                    break

            # 2. Extract HQ city
            # e.g. "headquartered in Bengaluru" / "based in Pune"
            hq_match = re.search(
                r'(?:headquartered|based|located|founded)\s+in\s+([a-z][a-z\s,]+?)(?:\.|,|\s+and|\s+india|\s+india\b)',
                extract
            )
            wiki_city = None
            if hq_match:
                raw = hq_match.group(1).strip().split(',')[0].strip().title()
                # Ignore if city name is too long (likely a sentence fragment)
                if len(raw.split()) <= 3:
                    wiki_city = raw

            return wiki_city, wiki_country, wiki_flag

        except Exception:
            return None, None, None

    try:
        url = f"https://autocomplete.clearbit.com/v1/companies/suggest?query={urllib.parse.quote(q)}"
        resp = http_requests.get(url, timeout=5)
        if resp.status_code != 200:
            return []

        companies = resp.json()
        enhanced = []
        for c in companies[:6]:
            tld_country, tld_flag = get_country(c.get('domain', ''))
            # Wikipedia gives more accurate country than TLD (e.g. Infosys uses .com but is Indian)
            wiki_city, wiki_country, wiki_flag = get_wiki_info(c.get('name', ''))
            # Prefer Wikipedia country; fall back to TLD
            final_country = wiki_country or tld_country
            final_flag = wiki_flag or tld_flag
            enhanced.append({
                "name": c.get("name"),
                "domain": c.get("domain"),
                "logo": c.get("logo"),
                "country": final_country,
                "flag": final_flag,
                "city": wiki_city,
            })
        return enhanced
    except Exception:
        return []


# ══════════════════════════════════════════════════════════════════
#  /api/vendor/screen — Multi-Source OSINT Engine
#  Sources: Google News RSS + DuckDuckGo Instant Answer + Wikipedia
#  domain param = unique company identifier (from Clearbit selection)
# ══════════════════════════════════════════════════════════════════
GENERIC = {
    'technologies','technology','solutions','services','systems',
    'limited','ltd','inc','corp','corporation','pvt','private',
    'consulting','group','enterprises','company','co','llc','llp',
    'infotech','infosystems','software','digital','global','india'
}

@app.get("/api/vendor/screen")
def screen_vendor(name: str = Query(...), domain: str = Query(None)):
    try:
        signals = []
        compound_scores = []
        sources_used = []

        # Strip generic suffixes → core brand name
        core_words = name.strip().split()
        while core_words and core_words[-1].lower().rstrip('.') in GENERIC:
            core_words.pop()
        core_name = ' '.join(core_words) if core_words else name
        name_keywords = [w.lower() for w in core_words if len(w) > 2]

        def vader(text):
            if not text or not text.strip():
                return None
            return analyzer.polarity_scores(text)["compound"]

        def make_signal(title, source, date, url, c):
            t = "positive" if c >= 0.05 else "negative" if c <= -0.05 else "neutral"
            return {"type": t, "source": source, "text": title, "date": date, "url": url, "compound": round(c, 3)}

        # ── SOURCE 1: Google News RSS ──────────────────────────────
        def fetch_rss(q):
            enc = urllib.parse.quote(q)
            return feedparser.parse(f"https://news.google.com/rss/search?q={enc}&hl=en-US&gl=US&ceid=US:en")

        # Search priority: domain-scoped → full name → core name
        search_queries = []
        if domain:
            search_queries.append(f"{core_name} {domain}")
        search_queries.append(name)
        if core_name.lower() != name.lower():
            search_queries.append(core_name)

        news_found = 0
        seen_titles = set()
        for sq in search_queries:
            feed = fetch_rss(sq)
            for entry in feed.entries[:25]:
                title = entry.get("title", "")
                if not title or title in seen_titles:
                    continue
                summary = re.sub(r"<[^>]+>", "", entry.get("summary", ""))
                source = entry.get("source", {}).get("title", "Google News")
                date = entry.get("published", "")[:10]
                link = entry.get("link", "")
                # Relevance: at least one keyword must appear in title
                if not any(kw in title.lower() for kw in name_keywords):
                    continue
                seen_titles.add(title)
                c = vader(f"{title}. {summary}")
                if c is not None:
                    compound_scores.append(c)
                    signals.append(make_signal(title, source, date, link, c))
                    news_found += 1
            if news_found >= 5:
                break

        if news_found > 0:
            sources_used.append("Google News")

        # ── SOURCE 2: DuckDuckGo Instant Answer API (free, no key) ──
        ddg_info = {"found": False}
        try:
            ddg_q = domain if domain else core_name
            ddg_url = (
                f"https://api.duckduckgo.com/?q={urllib.parse.quote(ddg_q)}"
                f"&format=json&no_html=1&skip_disambig=1"
            )
            ddg_resp = http_requests.get(ddg_url, timeout=6, headers={"User-Agent": "Mozilla/5.0"})
            ddg_data = ddg_resp.json()
            abstract = ddg_data.get("Abstract", "")
            if abstract and len(abstract) > 30:
                c = vader(abstract)
                if c is not None:
                    compound_scores.append(c * 0.6)
                ddg_info = {
                    "found": True,
                    "abstract": abstract[:400] + "..." if len(abstract) > 400 else abstract,
                    "source": ddg_data.get("AbstractSource", "DuckDuckGo"),
                    "url": ddg_data.get("AbstractURL", ""),
                    "official_site": ddg_data.get("OfficialWebsite", ""),
                }
                sources_used.append("DuckDuckGo")
        except Exception:
            pass

        # ── SOURCE 3: Wikipedia API ────────────────────────────────
        wiki_info = {"found": False}
        for wq in ([core_name, name] if core_name != name else [name]):
            try:
                wr = http_requests.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={"action":"query","format":"json","prop":"extracts",
                            "exintro":1,"explaintext":1,"redirects":1,"titles":wq},
                    timeout=6
                )
                pages = wr.json().get("query", {}).get("pages", {})
                page = next(iter(pages.values()))
                if "missing" not in page:
                    extract = page.get("extract", "")
                    if extract and len(extract) > 50:
                        c = vader(extract[:600])
                        if c is not None:
                            compound_scores.append(c * 0.4)
                        wiki_info = {
                            "found": True,
                            "title": page.get("title", name),
                            "summary": (extract[:350] + "...") if len(extract) > 350 else extract,
                        }
                        sources_used.append("Wikipedia")
                        break
            except Exception:
                pass

        # ── SCORE ──────────────────────────────────────────────────
        company_found = ddg_info["found"] or wiki_info["found"]

        if not compound_scores:
            return {
                "score": None,
                "insufficient_coverage": True,
                "company_found": company_found,
                "name": name,
                "wiki": wiki_info,
                "ddg": ddg_info,
                "signals": [],
                "sources_used": sources_used,
            }

        avg_compound = sum(compound_scores) / len(compound_scores)

        # "No Adverse Media" rule:
        # Company verified (DDG/Wiki) but zero news scandals → neutral-positive baseline
        if news_found == 0 and company_found:
            trust_score = max(58, round((avg_compound + 1) / 2 * 90 + 5))
            no_adverse_media = True
        else:
            trust_score = round(max(5, min(95, (avg_compound + 1) / 2 * 90 + 5)))
            no_adverse_media = False

        pos = sum(1 for s in signals if s["type"] == "positive")
        neg = sum(1 for s in signals if s["type"] == "negative")
        neu = sum(1 for s in signals if s["type"] == "neutral")

        return {
            "score": trust_score,
            "avg_compound": round(avg_compound, 3),
            "article_count": news_found,
            "sentiment_breakdown": {"positive": pos, "negative": neg, "neutral": neu},
            "signals": signals[:12],
            "wiki": wiki_info,
            "ddg": ddg_info,
            "sources_used": sources_used,
            "insufficient_coverage": False,
            "no_adverse_media": no_adverse_media,
            "company_found": company_found,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════
#  /api/shield/analyze — Communication Shield (Tier 2)
#  Analyzes incoming vendor emails/messages for phishing, urgency,
#  and financial fraud.
# ══════════════════════════════════════════════════════════════════
class CommunicationRequest(BaseModel):
    sender: str
    subject: str
    body: str

@app.post("/api/shield/analyze")
def analyze_communication(req: CommunicationRequest):
    try:
        text_to_analyze = f"{req.subject}\n\n{req.body}"
        text_lower = text_to_analyze.lower()
        
        flags = []
        score = 0 # 0 to 100, where 100 is max threat

        # 1. URGENCY MANIPULATION HEURISTICS
        urgency_patterns = [
            (r'\b(?:immediate|urgent|final)\b', 'urgency modifier'),
            (r'\b(?:within|in) (?:24|48|72) hours\b', 'time limit'),
            (r'\b(?:account|license|access) (?:will be )?(?:suspended|terminated)\b', 'access loss threat'),
            (r'\b(?:overdue|past due|final notice)\b', 'overdue notice'),
            (r'\bact immediately\b', 'immediate action'),
            (r'\bdo not delay\b', 'urgency'),
        ]
        
        urgency_count = 0
        for pattern, label in urgency_patterns:
            matches = re.finditer(pattern, text_lower)
            for match in matches:
                flags.append({
                    "category": "urgency",
                    "text": match.group(0),
                    "reason": label
                })
                urgency_count += 1
                score += 15

        # 2. FINANCIAL / PAYMENT REQUEST HEURISTICS
        financial_patterns = [
            (r'\b(?:new|updated) (?:bank|routing|payment) (?:details|instructions|info)\b', 'payment details change'),
            (r'\brouting (?:number|details)\b', 'routing info request'),
            (r'\bwire\b', 'wire transfer request'),
            (r'\b(?:bitcoin|crypto|cryptocurrency)\b', 'crypto request (highly suspicious)'),
            (r'\bwestern union\b', 'untraceable payment method'),
            (r'\b(?:invoice|payment) (?:is )?(?:past due|overdue)\b', 'invoice pressure'),
        ]
        
        financial_count = 0
        for pattern, label in financial_patterns:
            matches = re.finditer(pattern, text_lower)
            for match in matches:
                flags.append({
                    "category": "financial",
                    "text": match.group(0),
                    "reason": label
                })
                financial_count += 1
                score += 25

        # 3. PHISHING / SPOOFING HEURISTICS
        phishing_patterns = [
            (r'\bverify your account\b', 'account verification request'),
            (r'\bclick here\b', 'suspicious call to action'),
            (r'\bkindly (?:click|open|view)\b', 'unusual phrasing'),
            (r'\bdear (?:customer|user)\b', 'generic greeting'),
            (r'\blogin immediately\b', 'forced login'),
            (r'\bconfidentially\b', 'secrecy pressure'),
        ]
        
        phishing_count = 0
        for pattern, label in phishing_patterns:
            matches = re.finditer(pattern, text_lower)
            for match in matches:
                flags.append({
                    "category": "phishing",
                    "text": match.group(0),
                    "reason": label
                })
                phishing_count += 1
                score += 20

        # Check sender domain matching (basic heuristic)
        # If sender says it's from "support@paypal.com" but body has weird links, etc.
        # Here we just check for obvious free email providers if it claims to be a vendor
        free_email_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
        sender_lower = req.sender.lower()
        is_free_email = any(domain in sender_lower for domain in free_email_domains)
        if is_free_email and financial_count > 0:
            flags.append({
                "category": "phishing",
                "text": req.sender,
                "reason": "free email provider asking for financial changes"
            })
            score += 30

        # 4. SENTIMENT (VADER) as a modifier
        sentiment = analyzer.polarity_scores(text_to_analyze)
        # High negative sentiment (threatening) adds to score
        if sentiment['compound'] < -0.3:
            score += 10
            
        # Cap score at 100
        threat_score = min(100, score)
        
        # Determine Verdict
        if threat_score >= 70:
            verdict = "High Risk"
            action = "Quarantine & Verify via Phone"
        elif threat_score >= 30:
            verdict = "Suspicious"
            action = "Review Carefully"
        else:
            verdict = "Safe"
            action = "Standard Processing"

        # Extract context snippets around flags
        for flag in flags:
            # Find the flag text in the original text (case insensitive)
            pattern = re.compile(re.escape(flag['text']), re.IGNORECASE)
            match = pattern.search(text_to_analyze)
            if match:
                start = max(0, match.start() - 40)
                end = min(len(text_to_analyze), match.end() + 40)
                snippet = text_to_analyze[start:end].replace('\n', ' ')
                if start > 0: snippet = "..." + snippet
                if end < len(text_to_analyze): snippet = snippet + "..."
                flag['context'] = snippet
            else:
                flag['context'] = flag['text']

        return {
            "threat_score": threat_score,
            "verdict": verdict,
            "recommended_action": action,
            "flags": flags,
            "sentiment": sentiment
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════
#  /api/graph/explore — Knowledge Graph (Tier 3)
#  Uses Wikipedia to find relationships (links/categories) for a given entity
# ══════════════════════════════════════════════════════════════════
@app.get("/api/graph/explore")
def explore_graph(q: str = Query(...)):
    try:
        # Fetch page extract and links
        headers = {
            "User-Agent": "CogniVault/1.0 (contact@cognivault.com) Python-requests"
        }
        wr = http_requests.get(
            "https://en.wikipedia.org/w/api.php",
            headers=headers,
            params={
                "action": "query",
                "format": "json",
                "prop": "extracts|links",
                "exintro": 1,
                "explaintext": 1,
                "redirects": 1,
                "titles": q,
                "pllimit": 40, # Get up to 40 related links
                "plnamespace": 0 # Only article links
            },
            timeout=8
        )
        data = wr.json()
        pages = data.get("query", {}).get("pages", {})
        page = next(iter(pages.values()))
        
        if "missing" in page:
            return {"nodes": [], "links": []}

        root_title = page.get("title", q)
        extract = page.get("extract", "")
        links = page.get("links", [])

        nodes = []
        graph_links = []
        
        # Add Root Node
        nodes.append({
            "id": root_title,
            "name": root_title,
            "val": 20, # Size
            "group": 1, # Color grouping
            "desc": (extract[:200] + "...") if len(extract) > 200 else extract
        })

        # Add child nodes and link them to root
        # We try to filter out generic years or dates if possible
        for i, link in enumerate(links):
            child_title = link.get("title")
            # Basic filter to avoid linking to generic years
            if re.match(r'^\d{4}$', child_title):
                continue
                
            nodes.append({
                "id": child_title,
                "name": child_title,
                "val": 5, # Smaller size
                "group": (i % 5) + 2 # Different colors
            })
            graph_links.append({
                "source": root_title,
                "target": child_title
            })

        return {
            "nodes": nodes,
            "links": graph_links
        }

    except Exception as e:
        print("Graph Explore Error:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════
#  /api/drafter/generate — Generative AI Drafter (Tier 3)
#  Smart Clause Engine: Dynamically assembles legal contracts based on risk
# ══════════════════════════════════════════════════════════════════
class DraftRequest(BaseModel):
    document_type: str
    vendor_name: str
    risk_level: str
    jurisdiction: str
    effective_date: str
    special_instructions: Optional[str] = ""

@app.post("/api/drafter/generate")
def generate_draft(req: DraftRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        special_section = ""
        if req.special_instructions and req.special_instructions.strip():
            special_section = f"""
        - SPECIAL INSTRUCTIONS (MUST be incorporated into the contract):
          {req.special_instructions.strip()}
        """
        
        prompt = f"""
        You are an expert AI Legal Drafter for CogniVault Enterprise.
        Draft a highly professional, enterprise-grade {req.document_type}.
        
        Parameters:
        - Disclosing Party: CogniVault Enterprise
        - Receiving Party / Vendor Name: {req.vendor_name}
        - Risk Level Assessment: {req.risk_level}
        - Jurisdiction: {req.jurisdiction}
        - Effective Date: {req.effective_date}
        {special_section}
        
        Instructions:
        - Output the contract in clean HTML format. Use standard tags (<h1>, <h2>, <p>, <ul>, <li>, <strong>).
        - DO NOT wrap the output in ```html code blocks. Just output the raw HTML string.
        - Ensure it includes a preamble, base clauses appropriate for the document type, and a Governing Law clause for {req.jurisdiction}.
        - CRITICAL: Adapt the strictness of the clauses (especially audit rights, security, and termination) based on the {req.risk_level} risk level.
        - If special instructions were provided, weave them naturally into the relevant sections of the contract. Do not list them separately.
        """
        response = model.generate_content(prompt)
        return {"document": response.text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════
#  /api/oracle/query — Compliance Oracle (Tier 3)
#  Fast keyword-matching and compliance heuristic lookup engine
# ══════════════════════════════════════════════════════════════════
class OracleRequest(BaseModel):
    query: str
    countryCode: Optional[str] = None

def get_live_compliance_context(query: str) -> str:
    """Searches DuckDuckGo and scrapes the top 2 results for live context."""
    try:
        results = DDGS().text(query + " regulation compliance law update", max_results=2)
        if not results: return ""
        
        context = ""
        for r in results:
            url = r.get('href')
            if not url: continue
            try:
                resp = requests.get(url, timeout=3)
                soup = BeautifulSoup(resp.text, 'html.parser')
                text = ' '.join(soup.stripped_strings)
                context += f"\n--- Source: {url} ---\n{text[:1500]}\n"
            except Exception:
                pass
        return context
    except Exception as e:
        print(f"Scraping Error: {e}")
        return ""

@app.post("/api/oracle/query")
def query_oracle(req: OracleRequest):
    import json
    try:
        q = req.query.strip()
        if not q:
            return {
                "response": "Please ask a question about corporate compliance (e.g., GDPR, HIPAA, SOC 2, CCPA, data breaches, or deletion rights).",
                "matches": [],
                "confidence": 0.0,
                "topic_insight": None
            }
            
        print("Scraping live web context...")
        live_context = get_live_compliance_context(q)
            
        model = genai.GenerativeModel('gemini-2.5-flash')
        user_country = f"User Location Country Code: {req.countryCode}" if req.countryCode else ""
        
        prompt = f"""
        You are the CogniVault Compliance Oracle, an expert in global corporate compliance (GDPR, HIPAA, SOC 2, etc.).
        
        {user_country}
        User Query: "{q}"
        
        [LIVE WEB CONTEXT] (Use this to provide up-to-date information if relevant):
        {live_context}
        
        Analyze the query and provide a detailed, accurate response. Use the Live Web Context if it helps answer the query with recent facts.
        You MUST return your response as a valid JSON object matching the exact structure below. Do not include markdown blocks like ```json.
        
        {{
            "response": "Detailed markdown explanation answering the query. Be thorough and professional.",
            "confidence": 98.5,
            "topic_insight": {{
                "topic": "The main regulatory topic (e.g., GDPR Right to Erasure)",
                "gdpr": "Relevant GDPR article or context (if applicable, else omit or put null)",
                "hipaa": "Relevant HIPAA rule (if applicable, else omit or put null)",
                "actionable_step": "One immediate step the enterprise should take to comply."
            }}
        }}
        """
        
        response = model.generate_content(prompt)
        resp_text = response.text.strip()
        
        if resp_text.startswith("```json"):
            resp_text = resp_text[7:-3]
        elif resp_text.startswith("```"):
            resp_text = resp_text[3:-3]
            
        parsed_resp = json.loads(resp_text)
        
        return {
            "response": parsed_resp.get("response", "Compliance analysis complete."),
            "matches": [],
            "confidence": parsed_resp.get("confidence", 95.0),
            "topic_insight": parsed_resp.get("topic_insight", None)
        }
        
    except json.JSONDecodeError:
        return {
             "response": resp_text,
             "matches": [],
             "confidence": 85.0,
             "topic_insight": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════
#  /api/fraud/analyze — Forensic AI using Gemini
# ══════════════════════════════════════════════════════════════════
@app.post("/api/fraud/analyze")
@app.post("/api/fraud/analyze")
async def analyze_fraud(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename.lower()
    extracted_text = ""
    
    try:
        if filename.endswith(".pdf"):
            pdf_reader = PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + " "
        else:
            extracted_text = contents.decode("utf-8", errors="ignore")
            
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Empty document")
            
        prompt = """
        You are an expert Forensic Financial Auditor and Fraud Detection AI.
        Analyze the following invoice or financial document text for signs of fraud, anomalies, or suspicious activity.
        Extract any identified threats into a strictly formatted JSON object. 
        If no threats are found, return an empty array for hotspots.
        
        Required JSON structure:
        {
          "threatLevel": "High" | "Medium" | "Low",
          "summary": "A short 1-2 sentence explanation of the findings.",
          "hotspots": [
            {
              "id": 1,
              "vendor": "Name of Vendor",
              "location": "City, Country Code (e.g. Lagos, NG)",
              "risk": "High" | "Medium",
              "type": "Type of Fraud (e.g. Bank Routing Change, Spoofed Domain, Over-billing)",
              "amount": "The flagged dollar amount if any",
              "date": "YYYY-MM-DD HH:MM",
              "action": "Suggested Action (e.g. Auto-Block, Manual Audit)",
              "lat": <float representing the exact real-world latitude of the location>,
              "lng": <float representing the exact real-world longitude of the location>
            }
          ]
        }
        
        Document Text:
        """ + extracted_text

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        result_json = json.loads(response.text)
        return result_json
        
    except Exception as e:
        print("Fraud Analysis Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════
#  /api/forecaster/predict — AI Financial Forecaster (Python Data Science Engine)
# ══════════════════════════════════════════════════════════════════
@app.get("/api/forecaster/predict")
def predict_financials(ticker: str = Query(..., description="Stock ticker symbol or company name")):
    try:
        resolved_ticker = ticker.upper()
        
        # 1. Web Scrape Live Market Data using yfinance
        stock = yf.Ticker(resolved_ticker)
        hist = stock.history(period="2y", interval="1mo")
        
        # If no data found, assume it's a company name and search Yahoo Finance
        if hist.empty:
            search_res = http_requests.get(
                f"https://query2.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(ticker)}",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            if search_res.status_code == 200:
                quotes = search_res.json().get('quotes', [])
                if quotes and 'symbol' in quotes[0]:
                    resolved_ticker = quotes[0]['symbol']
                    # Try fetching again with the resolved ticker
                    stock = yf.Ticker(resolved_ticker)
                    hist = stock.history(period="2y", interval="1mo")
                    
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No financial data found for '{ticker}'. Try a different public company name.")
        
        # 2. Data Analysis with Pandas
        df = hist.copy()
        df.reset_index(inplace=True)
        # We will forecast the Closing price, simulating revenue/valuation
        df = df[['Date', 'Close']].dropna()
        # Convert Date to an ordinal number for regression
        df['Date_Ordinal'] = pd.to_datetime(df['Date']).map(pd.Timestamp.toordinal)
        
        # Format historical data for UI
        historical_data = []
        for index, row in df.iterrows():
            historical_data.append({
                "date": row['Date'].strftime('%Y-%m'),
                "value": float(row['Close'])
            })
            
        # 3. Machine Learning Time-Series Forecasting
        X = df[['Date_Ordinal']].values
        y = df['Close'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict next 24 months
        last_date = pd.to_datetime(df['Date'].iloc[-1])
        predicted_data = []
        
        for i in range(1, 25):
            # Add i months
            next_date = last_date + pd.DateOffset(months=i)
            next_ordinal = np.array([[next_date.toordinal()]])
            pred_value = model.predict(next_ordinal)[0]
            
            # Add a slight random walk / noise based on historical standard deviation to make it look realistic
            std_dev = df['Close'].std() * 0.1
            noise = np.random.normal(0, std_dev)
            pred_value = max(0, pred_value + noise) # Ensure no negative values
            
            predicted_data.append({
                "date": next_date.strftime('%Y-%m'),
                "value": float(pred_value)
            })
            
        currency_symbol = "$"
        try:
            currency_code = stock.info.get('currency', 'USD')
            currency_symbols = {'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'C$'}
            currency_symbol = currency_symbols.get(currency_code, currency_code + ' ')
        except Exception:
            pass
            
        return {
            "ticker": ticker.upper(),
            "historical": historical_data,
            "predicted": predicted_data,
            "currency": currency_symbol,
            "message": "Forecast generated successfully using Python Data Science Engine."
        }
        
    except Exception as e:
        print("Forecaster Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════
#  /api/forecaster/predict-private — AI Financial Forecaster (Private Docs)
# ══════════════════════════════════════════════════════════════════
@app.get("/api/forecaster/predict-private")
def predict_financials_private(filename: str = Query(..., description="Filename of the uploaded document")):
    try:
        file_path = os.path.join(os.path.dirname(__file__), '..', 'backend-node', 'uploads', filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Document file not found.")

        historical_data = []
        dates = []
        values = []
        currency = '$'

        if filename.lower().endswith('.csv'):
            # Parse CSV directly with pandas
            try:
                df = pd.read_csv(file_path)
                date_col = next((c for c in df.columns if 'date' in c.lower() or 'month' in c.lower()), None)
                val_col = next((c for c in df.columns if c.lower() in ['revenue', 'value', 'amount', 'cost', 'net_profit', 'sales']), None)
                
                if not date_col or not val_col:
                    raise Exception("CSV must contain a Date column and a Revenue/Value column.")
                
                df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
                df = df.dropna(subset=[date_col, val_col])
                df = df.sort_values(by=date_col)
                
                for _, row in df.iterrows():
                    val = float(row[val_col])
                    d = row[date_col]
                    historical_data.append({"date": d.strftime('%Y-%m'), "value": val})
                    dates.append(d.toordinal())
                    values.append(val)
                
            except Exception as e:
                print("CSV Parse Error:", e)
                raise HTTPException(status_code=400, detail="Failed to parse financial records from CSV. Make sure it has Date and Revenue columns.")
                
        else:
            # Not a CSV, use NLP on the document text
            text = ""
            try:
                if filename.lower().endswith('.pdf'):
                    reader = PdfReader(file_path)
                    text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
                else:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        text = f.read()
            except Exception as e:
                print("Error reading file:", e)
                raise HTTPException(status_code=500, detail="Failed to parse document text.")
                
            if not text.strip():
                raise HTTPException(status_code=400, detail="Document is empty or could not be parsed.")
                
            model = genai.GenerativeModel('gemini-2.5-flash')
            prompt = f"""
            You are an expert financial analyst. Read the following contract text and extract three parameters:
            1. "base_monthly_cost": The estimated starting monthly cost (integer). If it's an annual cost, divide by 12. If not found, estimate a reasonable default (e.g. 10000).
            2. "annual_escalation_percentage": The annual price increase/inflation percentage mentioned in the contract (float). E.g. if it says "5% increase", return 5.0. If not found, default to 3.0.
            3. "currency": The currency symbol used in the document (e.g., "$", "₹", "€", "£"). If not found, default to "$".
            
            Return ONLY a JSON object with these two keys. No markdown formatting, no backticks.
            
            Contract Text:
            {text[:10000]}
            """
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3]
            elif response_text.startswith('```'):
                response_text = response_text[3:-3]
                
            try:
                extracted = json.loads(response_text)
                base_cost = float(extracted.get('base_monthly_cost', 10000))
                escalation = float(extracted.get('annual_escalation_percentage', 3.0))
                currency = extracted.get('currency', '$')
            except:
                base_cost = 10000.0
                escalation = 3.0
                currency = '$'
                
            now = pd.Timestamp.now()
            current_cost = base_cost
            monthly_growth = (1 + (escalation/100)) ** (1/12)
            
            for i in range(12, 0, -1):
                d = now - pd.DateOffset(months=i)
                noise = np.random.normal(0, base_cost * 0.02) 
                val = current_cost + noise
                historical_data.append({"date": d.strftime('%Y-%m'), "value": float(val)})
                dates.append(d.toordinal())
                values.append(val)
                current_cost *= monthly_growth

        if not dates or not values:
            raise HTTPException(status_code=400, detail="No historical data found or extracted.")

        # 4. Scikit-Learn Regression
        X = np.array(dates).reshape(-1, 1)
        y = np.array(values)
        
        lr_model = LinearRegression()
        lr_model.fit(X, y)
        
        predicted_data = []
        last_date = pd.Timestamp.fromordinal(dates[-1]) if dates else pd.Timestamp.now()
        for i in range(1, 25):
            future_date = last_date + pd.DateOffset(months=i)
            pred = lr_model.predict(np.array([[future_date.toordinal()]]))[0]
            predicted_data.append({
                "date": future_date.strftime('%Y-%m'),
                "value": max(0, float(pred))
            })
            
        return {
            "historical": historical_data,
            "predicted": predicted_data,
            "currency": currency
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print("Forecaster Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def send_email(to: str, subject: str, html: str):
    """Send an HTML email via Gmail SMTP. Mirrors Node's nodemailer setup."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f'"CogniVault" <{EMAIL_USER}>'
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to, msg.as_string())
    except Exception as e:
        print(f"Email send error: {e}")

def get_pricing_details(plan: str, billing_cycle: str, country_code: str):
    """Mirrors Node's getPricingDetails helper exactly."""
    is_india = country_code == "+91"
    currency = "INR" if is_india else "USD"
    total = 0
    if is_india:
        if plan == "basic":
            total = 7599*6 if billing_cycle == "halfYearly" else (7199*12 if billing_cycle == "yearly" else 7999)
        elif plan == "moderate":
            total = 25499*6 if billing_cycle == "halfYearly" else (24999*12 if billing_cycle == "yearly" else 25999)
        elif plan == "advanced":
            total = 40999*6 if billing_cycle == "halfYearly" else (39999*12 if billing_cycle == "yearly" else 41999)
    else:
        if plan == "basic":
            total = 94*6 if billing_cycle == "halfYearly" else (89*12 if billing_cycle == "yearly" else 99)
        elif plan == "moderate":
            total = 304*6 if billing_cycle == "halfYearly" else (299*12 if billing_cycle == "yearly" else 309)
        elif plan == "advanced":
            total = 489*6 if billing_cycle == "halfYearly" else (479*12 if billing_cycle == "yearly" else 499)
    return {"amountInSubunits": round(total * 100), "currency": currency}

def make_jwt(payload: dict) -> str:
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=7)
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")

def doc_to_dict(doc) -> dict:
    """Convert a MongoDB document to a JSON-serializable dict."""
    if doc is None:
        return None
    d = dict(doc)
    for k, v in d.items():
        if isinstance(v, ObjectId):
            d[k] = str(v)
        elif isinstance(v, datetime):
            if v.tzinfo is None:
                from datetime import timezone
                v = v.replace(tzinfo=timezone.utc)
            d[k] = v.isoformat()
        elif isinstance(v, list):
            d[k] = [str(x) if isinstance(x, ObjectId) else x for x in v]
    if "_id" in d and isinstance(d["_id"], str):
        d["id"] = d["_id"]
    return d


# ══════════════════════════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

class OtpRequestBody(BaseModel):
    email: str

class OtpVerifyBody(BaseModel):
    name: Optional[str] = None
    email: str
    otp: str

class ChangePasswordBody(BaseModel):
    userId: str
    newPassword: str

class UpdateProfileBody(BaseModel):
    userId: str
    name: str

class CreateOrderBody(BaseModel):
    plan: str
    billingCycle: str
    countryCode: Optional[str] = "+91"

class VerifyPaymentBody(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    name: str
    email: str
    company: str
    plan: Optional[str] = "moderate"
    billingCycle: Optional[str] = "monthly"

class RenewPaymentBody(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    workspaceId: str
    plan: str
    billingCycle: Optional[str] = "monthly"

class SupportTicketBody(BaseModel):
    name: str
    email: str
    message: str

class AdminReplyBody(BaseModel):
    replyMessage: str


# ══════════════════════════════════════════════════════════════════════════════
#  AUTH ROUTES — Python/FastAPI replaces backend-node/routes/auth.js
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register")
async def register(body: RegisterBody):
    if not body.name or not body.email or not body.password:
        raise HTTPException(status_code=400, detail="All fields are required.")
    import re as _re
    if not _re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", body.email):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    existing = await users_col.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed = pwd_context.hash(body.password)
    user_doc = {
        "name": body.name.strip(),
        "email": body.email.lower().strip(),
        "password": hashed,
        "isTemporaryPassword": False,
        "role": "admin",
        "tier": "free_trial",
        "isAdmin": False,
        "documentsUploaded": 0,
        "createdAt": datetime.now(timezone.utc)
    }
    await users_col.insert_one(user_doc)
    return {"message": "Account created successfully. Please sign in."}


@app.post("/api/auth/login")
async def login(body: LoginBody):
    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user = await users_col.find_one({"email": body.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="No account found with this email address.")

    if not pwd_context.verify(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    # Fetch workspace if linked
    workspace = None
    if user.get("workspace"):
        workspace = await workspaces_col.find_one({"_id": user["workspace"]})

    tier = (workspace.get("subscription_tier") if workspace else None) or user.get("tier", "free_trial")
    workspace_id = str(workspace["_id"]) if workspace else None

    payload = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "admin"),
        "isAdmin": user.get("isAdmin", False),
        "workspaceId": workspace_id,
        "tier": tier,
    }
    token = make_jwt(payload)

    return {
        "token": token,
        "requirePasswordChange": user.get("isTemporaryPassword", False),
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "admin"),
            "isAdmin": user.get("isAdmin", False),
            "workspaceId": workspace_id,
            "tier": tier,
            "documentsUploaded": user.get("documentsUploaded", 0),
            "createdAt": user["createdAt"].isoformat() if isinstance(user.get("createdAt"), datetime) else str(user.get("createdAt", "")),
            "workspace": doc_to_dict(workspace)
        }
    }


@app.post("/api/auth/request-otp")
async def request_otp(body: OtpRequestBody):
    if not body.email:
        raise HTTPException(status_code=400, detail="Email is required")

    import random
    otp = str(random.randint(100000, 999999))
    otp_store[body.email.lower()] = {
        "otp": otp,
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=10)
    }

    html = f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">CogniVault</h1>
  </div>
  <div style="padding: 40px 24px; text-align: center; color: #374151;">
    <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Your Verification Code</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">Use the following 6-digit code to verify your email address and start your free trial.</p>
    <div style="background-color: #f3f4f6; padding: 24px; border-radius: 12px; display: inline-block;">
      <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">{otp}</h1>
    </div>
    <p style="font-size: 13px; color: #6b7280; margin-top: 32px;">This code will expire in 10 minutes.</p>
  </div>
  <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Securely sent via CogniVault Mailer</p>
  </div>
</div>"""

    send_email(body.email, "Your CogniVault Trial OTP", html)
    return {"message": "OTP sent successfully"}


@app.post("/api/auth/verify-otp")
async def verify_otp(body: OtpVerifyBody):
    key = body.email.lower()
    record = otp_store.get(key)
    now = datetime.now(timezone.utc)

    if not record or record["otp"] != body.otp or record["expiresAt"] < now:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    del otp_store[key]

    user = await users_col.find_one({"email": key})
    if not user:
        # Create workspace and user
        workspace_doc = {
            "name": f"{body.name or 'Trial'}'s Workspace",
            "subscription_tier": "free_trial",
            "createdAt": datetime.now(timezone.utc)
        }
        ws_result = await workspaces_col.insert_one(workspace_doc)

        dummy_password = pwd_context.hash(secrets.token_hex(16))
        user_doc = {
            "name": body.name or "Trial User",
            "email": key,
            "password": dummy_password,
            "isTemporaryPassword": False,
            "role": "admin",
            "tier": "free_trial",
            "isAdmin": False,
            "workspace": ws_result.inserted_id,
            "documentsUploaded": 0,
            "createdAt": datetime.now(timezone.utc)
        }
        result = await users_col.insert_one(user_doc)
        user = await users_col.find_one({"_id": result.inserted_id})

    workspace = await workspaces_col.find_one({"_id": user.get("workspace")})
    workspace_id = str(workspace["_id"]) if workspace else None
    created_at_iso = user["createdAt"].isoformat() if isinstance(user.get("createdAt"), datetime) else str(user.get("createdAt", ""))

    payload = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "admin"),
        "isAdmin": user.get("isAdmin", False),
        "workspaceId": workspace_id,
        "tier": user.get("tier", "free_trial")
    }
    token = make_jwt(payload)
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "admin"),
            "isAdmin": user.get("isAdmin", False),
            "workspaceId": workspace_id,
            "tier": user.get("tier", "free_trial"),
            "documentsUploaded": user.get("documentsUploaded", 0),
            "createdAt": created_at_iso,
            "workspace": doc_to_dict(workspace)
        }
    }


@app.post("/api/auth/change-password")
async def change_password(body: ChangePasswordBody):
    if not body.userId or not body.newPassword:
        raise HTTPException(status_code=400, detail="Missing fields")
    try:
        user = await users_col.find_one({"_id": ObjectId(body.userId)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed = pwd_context.hash(body.newPassword)
    await users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed, "isTemporaryPassword": False}}
    )
    return {"message": "Password changed successfully"}


@app.put("/api/auth/profile")
async def update_profile(body: UpdateProfileBody):
    try:
        user = await users_col.find_one({"_id": ObjectId(body.userId)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await users_col.update_one({"_id": user["_id"]}, {"$set": {"name": body.name}})
    return {"message": "Profile updated", "name": body.name}


# ── Razorpay Payment Routes ────────────────────────────────────────────────────

@app.post("/api/auth/create-order")
async def create_order(body: CreateOrderBody):
    if body.plan == "enterprise":
        raise HTTPException(status_code=400, detail="Enterprise plan requires custom invoicing.")
    pricing = get_pricing_details(body.plan, body.billingCycle, body.countryCode or "+91")
    try:
        rz_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = rz_client.order.create({
            "amount": pricing["amountInSubunits"],
            "currency": pricing["currency"],
            "receipt": f"receipt_order_{int(datetime.now().timestamp())}"
        })
        return {"orderId": order["id"], "amount": order["amount"], "currency": order["currency"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating Razorpay order: {str(e)}")


@app.post("/api/auth/verify-payment")
async def verify_payment(body: VerifyPaymentBody):
    if not body.name or not body.email or not body.company:
        raise HTTPException(status_code=400, detail="Name, email, and company are required.")

    # Verify Razorpay signature using HMAC-SHA256 (mirrors Node crypto logic exactly)
    sign_data = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected_sign = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        sign_data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if body.razorpay_signature != expected_sign:
        raise HTTPException(status_code=400, detail="Invalid payment signature.")

    if body.razorpay_signature != expected_sign:
        raise HTTPException(status_code=400, detail="Invalid payment signature.")

    existing_user = await users_col.find_one({"email": body.email.lower().strip()})
    
    # ── CASE 1: EXISTING CLIENT RENEWAL ──
    if existing_user:
        ws_id = existing_user.get("workspace")
        workspace = await workspaces_col.find_one({"_id": ws_id}) if ws_id else None

        now_utc = datetime.now(timezone.utc)
        base_date = now_utc
        if workspace and workspace.get("subscriptionEndDate"):
            current_end_date = workspace.get("subscriptionEndDate")
            if isinstance(current_end_date, str):
                try:
                    current_end_date = datetime.fromisoformat(current_end_date.replace("Z", "+00:00"))
                except Exception:
                    current_end_date = now_utc
            if isinstance(current_end_date, datetime):
                if current_end_date.tzinfo is None:
                    current_end_date = current_end_date.replace(tzinfo=timezone.utc)
                if current_end_date > now_utc:
                    base_date = current_end_date

        duration_months = 12 if body.billingCycle == "yearly" else (6 if body.billingCycle == "halfYearly" else 1)
        new_end_date = base_date + timedelta(days=30 * duration_months)

        if ws_id:
            await workspaces_col.update_one(
                {"_id": ws_id},
                {"$set": {
                    "subscription_tier": body.plan or "moderate",
                    "billing_cycle": body.billingCycle or "monthly",
                    "subscriptionEndDate": new_end_date
                }}
            )

        # Dispatch Branded Receipt Email for Existing User (NO temporary credentials sent)
        formatted_exp = new_end_date.strftime("%d-%m-%Y")
        payment_id = body.razorpay_payment_id or "pay_test_override"
        order_id = body.razorpay_order_id or "ord_test_override"
        
        receipt_html = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b101d; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; font-size: 28px; font-weight: 900; margin: 0;">CogniVault</h1>
            <p style="color: #10b981; font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">✓ Official Subscription Renewal Receipt</p>
          </div>

          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hi {existing_user.get('name', 'Valued Client')},</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Thank you for renewing your CogniVault subscription! Your account access is active and your subscription period has been successfully extended.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: #cbd5e1; font-size: 13px;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Plan Tier:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">{(body.plan or 'moderate').upper()} TIER</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Billing Cycle:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">{(body.billingCycle or 'monthly').upper()}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Payment ID:</td>
                <td style="padding: 10px 0; text-align: right; font-family: monospace; font-weight: 700; color: #6366f1;">{payment_id}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Order ID:</td>
                <td style="padding: 10px 0; text-align: right; font-family: monospace; font-weight: 700; color: #94a3b8;">{order_id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8; font-weight: 700;">New Expiry Date:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #10b981; font-size: 15px;">{formatted_exp}</td>
              </tr>
            </table>

            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
              You can log in to your account anytime using your existing password.
            </p>
          </div>

          <div style="text-align: center;">
            <a href="http://localhost:5173/login" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
              Log In to CogniVault →
            </a>
          </div>

          <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
            CogniVault Billing System • Official Electronic Receipt
          </p>
        </div>
        """
        try:
            send_email(existing_user["email"], "CogniVault Subscription Renewal Confirmation", receipt_html)
        except Exception as mail_err:
            print("Failed to send renewal receipt email:", mail_err)

        return {"isExistingUser": True, "message": "Subscription renewed successfully for existing account."}

    # ── CASE 2: NEW CLIENT REGISTRATION ──
    raw_password = secrets.token_hex(6).upper() + "A1!"
    hashed = pwd_context.hash(raw_password)

    now_utc = datetime.now(timezone.utc)
    duration_months = 12 if body.billingCycle == "yearly" else (6 if body.billingCycle == "halfYearly" else 1)
    new_end_date = now_utc + timedelta(days=30 * duration_months)

    workspace_doc = {
        "name": f"{body.company} Workspace",
        "subscription_tier": body.plan or "moderate",
        "billing_cycle": body.billingCycle or "monthly",
        "subscriptionEndDate": new_end_date,
        "createdAt": now_utc
    }
    ws_result = await workspaces_col.insert_one(workspace_doc)

    user_doc = {
        "name": body.name.strip(),
        "email": body.email.lower().strip(),
        "password": hashed,
        "isTemporaryPassword": True,
        "role": "manager",
        "isAdmin": False,
        "workspace": ws_result.inserted_id,
        "documentsUploaded": 0,
        "createdAt": now_utc
    }
    await users_col.insert_one(user_doc)

    user = await users_col.find_one({"email": body.email.lower().strip()})
    await workspaces_col.update_one(
        {"_id": ws_result.inserted_id},
        {"$set": {"owner": user["_id"], "members": [user["_id"]]}}
    )

    formatted_exp = new_end_date.strftime("%d-%m-%Y")
    payment_id = body.razorpay_payment_id or "pay_test_override"
    order_id = body.razorpay_order_id or "ord_test_override"

    welcome_html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b101d; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; font-size: 28px; font-weight: 900; margin: 0;">CogniVault</h1>
        <p style="color: #10b981; font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">✓ Account Setup & Official Payment Receipt</p>
      </div>

      <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Welcome, {body.name}!</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Thank you for subscribing to CogniVault for <strong>{body.company}</strong>. Your intelligence platform workspace is ready.
        </p>

        <div style="background-color: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #cbd5e1; font-size: 13px;"><strong>Login Email:</strong> <span style="color: #ffffff;">{body.email.lower()}</span></p>
          <p style="margin: 4px 0; color: #cbd5e1; font-size: 13px;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 16px; color: #818cf8; font-weight: 800;">{raw_password}</span></p>
        </div>

        <h3 style="color: #ffffff; font-size: 15px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0; color: #cbd5e1; font-size: 13px;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;">Plan Tier:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #ffffff;">{(body.plan or 'moderate').upper()} TIER</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;">Billing Cycle:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #ffffff;">{(body.billingCycle or 'monthly').upper()}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;">Payment ID:</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: 700; color: #6366f1;">{payment_id}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;">Order ID:</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: 700; color: #94a3b8;">{order_id}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #94a3b8; font-weight: 700;">Expiry Date:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #10b981; font-size: 14px;">{formatted_exp}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="http://localhost:5173/login" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
          Log In to Your Workspace →
        </a>
      </div>

      <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
        CogniVault Billing System • Official Electronic Receipt
      </p>
    </div>
    """
    try:
        send_email(body.email.lower().strip(), "Welcome to CogniVault - Your Credentials & Receipt", welcome_html)
    except Exception as mail_err:
        print("Failed to send welcome receipt email:", mail_err)

    return {"isExistingUser": False, "message": "Payment verified and account created successfully."}


@app.post("/api/auth/renew-payment")
async def renew_payment(body: RenewPaymentBody):
    try:
        ws_id = ObjectId(body.workspaceId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid workspace ID")

    workspace = await workspaces_col.find_one({"_id": ws_id})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Calculate base date for extension: if subscription is active in future, stack on top!
    now_utc = datetime.now(timezone.utc)
    current_end_date = workspace.get("subscriptionEndDate")
    base_date = now_utc

    if current_end_date:
        if isinstance(current_end_date, str):
            try:
                current_end_date = datetime.fromisoformat(current_end_date.replace("Z", "+00:00"))
            except Exception:
                current_end_date = now_utc
        if isinstance(current_end_date, datetime):
            if current_end_date.tzinfo is None:
                current_end_date = current_end_date.replace(tzinfo=timezone.utc)
            if current_end_date > now_utc:
                base_date = current_end_date

    duration_months = 12 if body.billingCycle == "yearly" else (6 if body.billingCycle == "halfYearly" else 1)
    new_end_date = base_date + timedelta(days=30 * duration_months)

    await workspaces_col.update_one(
        {"_id": ws_id},
        {"$set": {
            "subscription_tier": body.plan,
            "billing_cycle": body.billingCycle,
            "subscriptionEndDate": new_end_date
        }}
    )

    updated_ws = await workspaces_col.find_one({"_id": ws_id})

    # Dispatch branded electronic payment receipt email
    owner = None
    if workspace.get("owner"):
        owner = await users_col.find_one({"_id": workspace["owner"]})

    if owner and owner.get("email"):
        formatted_exp = new_end_date.strftime("%d-%m-%Y")
        payment_id = body.razorpay_payment_id or "pay_test_override"
        order_id = body.razorpay_order_id or "ord_test_override"
        
        receipt_html = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b101d; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; font-size: 28px; font-weight: 900; margin: 0;">CogniVault</h1>
            <p style="color: #10b981; font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">✓ Official Payment Receipt</p>
          </div>

          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hi {owner.get('name', 'Valued Client')},</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Thank you for your payment! Your workspace subscription for <strong>{workspace.get('name', 'CogniVault Workspace')}</strong> has been successfully renewed.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: #cbd5e1; font-size: 13px;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Plan Tier:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">{body.plan.upper()} TIER</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Billing Cycle:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">{body.billingCycle.upper()}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Payment ID:</td>
                <td style="padding: 10px 0; text-align: right; font-family: monospace; font-weight: 700; color: #6366f1;">{payment_id}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 10px 0; color: #94a3b8;">Order ID:</td>
                <td style="padding: 10px 0; text-align: right; font-family: monospace; font-weight: 700; color: #94a3b8;">{order_id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8; font-weight: 700;">New Expiry Date:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #10b981; font-size: 15px;">{formatted_exp}</td>
              </tr>
            </table>

            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
              Your active subscription access is updated automatically in your dashboard.
            </p>
          </div>

          <div style="text-align: center;">
            <a href="http://localhost:5173/vault" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
              Go to Your Workspace Vault →
            </a>
          </div>

          <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
            CogniVault Billing System • Official Electronic Receipt
          </p>
        </div>
        """
        try:
            send_email(owner["email"], f"Receipt for CogniVault Subscription Renewal - {workspace.get('name')}", receipt_html)
        except Exception as mail_err:
            print("Failed to send receipt email:", mail_err)

    return {
        "message": "Subscription renewed successfully!",
        "workspace": doc_to_dict(updated_ws)
    }


# ══════════════════════════════════════════════════════════════════════════════
#  SUPPORT TICKET ROUTES — Python/FastAPI replaces backend-node/routes/support.js
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/support")
async def submit_ticket(body: SupportTicketBody):
    if not body.name or not body.email or not body.message:
        raise HTTPException(status_code=400, detail="All fields are required")

    ticket_doc = {
        "name": body.name,
        "email": body.email,
        "message": body.message,
        "status": "Open",
        "adminReply": "",
        "createdAt": datetime.now(timezone.utc)
    }
    result = await tickets_col.insert_one(ticket_doc)
    ticket_doc["_id"] = str(result.inserted_id)

    # Auto-reply to user
    auto_reply_html = f"""
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Request Received</h2>
  <p>Hello <strong>{body.name}</strong>,</p>
  <p>Thank you for contacting CogniVault Enterprise Support. We have safely received your message:</p>
  <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 1rem; margin-left: 0; color: #6b7280; font-style: italic;">
    {body.message}
  </blockquote>
  <p>Our team is reviewing your query and will respond as soon as possible.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
  <p style="font-size: 0.875rem; color: #9ca3af;">Best regards,<br/><strong>CogniVault Team</strong></p>
</div>"""
    send_email(body.email, "We have received your query - CogniVault", auto_reply_html)

    ticket_doc["createdAt"] = ticket_doc["createdAt"].isoformat()
    return {"message": "Ticket submitted successfully", "ticket": ticket_doc}


@app.get("/api/support")
async def get_tickets():
    cursor = tickets_col.find().sort("createdAt", -1)
    tickets = []
    async for doc in cursor:
        tickets.append(doc_to_dict(doc))
    return tickets


@app.post("/api/support/{ticket_id}/reply")
async def reply_ticket(ticket_id: str, body: AdminReplyBody):
    if not body.replyMessage:
        raise HTTPException(status_code=400, detail="Reply message is required")

    try:
        ticket = await tickets_col.find_one({"_id": ObjectId(ticket_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ticket ID")
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    await tickets_col.update_one(
        {"_id": ticket["_id"]},
        {"$set": {"status": "Closed", "adminReply": body.replyMessage, "repliedAt": datetime.now(timezone.utc)}}
    )

    reply_html = f"""
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Support Response</h2>
  <p>Hello <strong>{ticket['name']}</strong>,</p>
  <p>Regarding your recent query:</p>
  <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 1rem; margin-left: 0; color: #6b7280; font-style: italic;">
    {ticket['message']}
  </blockquote>
  <p style="margin-top: 1.5rem; font-size: 1.1rem;">{body.replyMessage.replace(chr(10), '<br/>')}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
  <p style="font-size: 0.875rem; color: #9ca3af;">Best regards,<br/><strong>CogniVault Support Team</strong></p>
</div>"""
    send_email(ticket["email"], "Re: Your Support Query - CogniVault", reply_html)

    updated = await tickets_col.find_one({"_id": ticket["_id"]})
    return {"message": "Reply sent and ticket closed successfully", "ticket": doc_to_dict(updated)}


# ══════════════════════════════════════════════════════════════════
#  ENTERPRISE PROPOSALS ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.post("/api/enterprise")
async def submit_enterprise(body: SupportTicketBody):
    if not body.name or not body.email or not body.message:
        raise HTTPException(status_code=400, detail="All fields are required")

    ticket_doc = {
        "name": body.name,
        "email": body.email,
        "message": body.message,
        "status": "Open",
        "adminReply": "",
        "createdAt": datetime.now(timezone.utc)
    }
    result = await enterprise_col.insert_one(ticket_doc)
    ticket_doc["_id"] = str(result.inserted_id)

    auto_reply_html = f"""
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">Enterprise Inquiry Received</h2>
  <p>Hello <strong>{body.name}</strong>,</p>
  <p>Thank you for reaching out to CogniVault Enterprise. We have received your proposal requirements:</p>
  <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 1rem; margin-left: 0; color: #6b7280; font-style: italic;">
    {body.message.replace(chr(10), '<br/>')}
  </blockquote>
  <p>An enterprise architect will review your requirements and reach out within 24 hours.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
  <p style="font-size: 0.875rem; color: #9ca3af;">Best regards,<br/><strong>CogniVault Enterprise Team</strong></p>
</div>"""
    send_email(body.email, "Your Enterprise Inquiry - CogniVault", auto_reply_html)

    ticket_doc["createdAt"] = ticket_doc["createdAt"].isoformat()
    return {"message": "Proposal submitted successfully", "ticket": ticket_doc}

@app.get("/api/enterprise")
async def get_enterprise_proposals():
    cursor = enterprise_col.find().sort("createdAt", -1)
    tickets = []
    async for doc in cursor:
        tickets.append(doc_to_dict(doc))
    return tickets

@app.post("/api/enterprise/{ticket_id}/reply")
async def reply_enterprise(ticket_id: str, body: AdminReplyBody):
    if not body.replyMessage:
        raise HTTPException(status_code=400, detail="Reply message is required")

    try:
        ticket = await enterprise_col.find_one({"_id": ObjectId(ticket_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
    if not ticket:
        raise HTTPException(status_code=404, detail="Proposal not found")

    await enterprise_col.update_one(
        {"_id": ticket["_id"]},
        {"$set": {"status": "Closed", "adminReply": body.replyMessage, "repliedAt": datetime.now(timezone.utc)}}
    )

    reply_html = f"""
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4f46e5;">CogniVault Enterprise Response</h2>
  <p>Hello <strong>{ticket['name']}</strong>,</p>
  <p>Regarding your recent enterprise inquiry:</p>
  <p style="margin-top: 1.5rem; font-size: 1.1rem;">{body.replyMessage.replace(chr(10), '<br/>')}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
  <p style="font-size: 0.875rem; color: #9ca3af;">Best regards,<br/><strong>CogniVault Enterprise Team</strong></p>
</div>"""
    send_email(ticket["email"], "Re: Your Enterprise Inquiry - CogniVault", reply_html)

    updated = await enterprise_col.find_one({"_id": ticket["_id"]})
    return {"message": "Reply sent successfully", "ticket": doc_to_dict(updated)}


# ══════════════════════════════════════════════════════════════════
#  NEW NLP & ML ENDPOINTS (Presidio & IsolationForest)
# ══════════════════════════════════════════════════════════════════

from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_anonymizer import AnonymizerEngine
from sklearn.ensemble import IsolationForest

class RedactRequest(BaseModel):
    text: str

class ThreatAnomalyRequest(BaseModel):
    download_count_last_60s: int
    user_tenure_days: int = 30
    off_hours_flag: int = 0

print("Loading NLP and Anomaly Models...")
try:
    analyzer_engine = AnalyzerEngine()
    
    # Add a custom aggressive recognizer for SSNs (catch-all for XXX-XX-XXXX formats including test data)
    ssn_pattern = Pattern(name="aggressive_ssn", regex=r"\b\d{3}-\d{2}-\d{4}\b", score=0.9)
    ssn_recognizer = PatternRecognizer(supported_entity="US_SSN", patterns=[ssn_pattern])
    analyzer_engine.registry.add_recognizer(ssn_recognizer)
    
    # Custom recognizer for Routing Numbers
    routing_pattern = Pattern(name="routing_num", regex=r"\b\d{9}\b", score=0.8)
    routing_recognizer = PatternRecognizer(supported_entity="ROUTING_NUMBER", patterns=[routing_pattern], context=["routing", "aba", "transit"])
    analyzer_engine.registry.add_recognizer(routing_recognizer)
    
    # Custom recognizer for Account Numbers
    account_pattern = Pattern(name="account_num", regex=r"\b\d{8,12}\b", score=0.8)
    account_recognizer = PatternRecognizer(supported_entity="ACCOUNT_NUMBER", patterns=[account_pattern], context=["account", "acct"])
    analyzer_engine.registry.add_recognizer(account_recognizer)
    
    anonymizer_engine = AnonymizerEngine()
    
    # Simple synthetic training for Isolation Forest
    clf_threat = IsolationForest(contamination=0.1, random_state=42)
    X_train = np.array([
        [1, 30, 0], [2, 100, 0], [0, 50, 0], [3, 200, 1], [4, 10, 0],
        [1, 5, 0], [2, 60, 0], [5, 40, 0], [0, 10, 1], [1, 300, 0],
        [30, 1, 1], [25, 2, 0] # Anomalies
    ])
    clf_threat.fit(X_train)
    print("NLP and Anomaly Models loaded successfully!")
except Exception as e:
    print(f"WARNING: NLP/ML init failed: {e}")
    analyzer_engine = None
    anonymizer_engine = None
    clf_threat = None

@app.post("/api/ai/redact")
async def ai_redact(req: RedactRequest):
    if not analyzer_engine or not anonymizer_engine:
        raise HTTPException(status_code=500, detail="NLP models not initialized.")
    try:
        results = analyzer_engine.analyze(
            text=req.text, 
            entities=["PERSON", "EMAIL_ADDRESS", "US_SSN", "PHONE_NUMBER", "CREDIT_CARD", "US_BANK_NUMBER", "ORGANIZATION", "LOCATION", "IP_ADDRESS", "ROUTING_NUMBER", "ACCOUNT_NUMBER"], 
            language='en',
            score_threshold=0.4 # Lower threshold to catch more potential PII
        )
        anonymized_result = anonymizer_engine.anonymize(text=req.text, analyzer_results=results)
        return {"redacted_text": anonymized_result.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/threat/anomaly")
async def check_anomaly(req: ThreatAnomalyRequest):
    if not clf_threat:
        raise HTTPException(status_code=500, detail="ML Anomaly model not initialized.")
    
    features = np.array([[req.download_count_last_60s, req.user_tenure_days, req.off_hours_flag]])
    prediction = clf_threat.predict(features)[0]
    
    is_anomaly = bool(prediction == -1)
    if req.download_count_last_60s > 6:
        is_anomaly = True

    return {
        "is_anomaly": is_anomaly,
        "score": float(clf_threat.decision_function(features)[0])
    }