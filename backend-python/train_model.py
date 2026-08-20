import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier

# 1. Dummy Dataset for Legal Documents
# In a real enterprise app, this would be a massive CSV of real contracts.
texts = [
    "This Non-Disclosure Agreement (NDA) is entered into to protect confidential information.",
    "The Receiving Party shall keep all Trade Secrets strictly confidential.",
    "This Employment Contract establishes the salary and benefits for the new hire.",
    "The employee will receive a base salary of $100,000 per annum.",
    "This Vendor Services Agreement outlines the software deliverables.",
    "The contractor shall provide API integration services by the deadline.",
    "The tenant agrees to pay rent on the first of every month.",
    "This Commercial Lease Agreement covers the office space."
]

labels = [
    "NDA",
    "NDA",
    "Employment Contract",
    "Employment Contract",
    "Vendor Agreement",
    "Vendor Agreement",
    "Lease Agreement",
    "Lease Agreement"
]

print("Starting ML Training Pipeline...")

# 2. Text Vectorization (Converting text into numbers)
vectorizer = TfidfVectorizer(stop_words='english')
X = vectorizer.fit_transform(texts)

# 3. Model Training (Random Forest)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, labels)

print("Model trained successfully!")

# 4. Save the Model and Vectorizer to disk (.pkl files)
with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved to model.pkl and vectorizer.pkl")
