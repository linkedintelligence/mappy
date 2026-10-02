## Mappy - The AI for the Everyday Move

Mappy lets you search for places the way you naturally think.

Instead of filtering through dozens of categories and checkboxes, you can simply ask:

> "Find me a quiet cafe with Wi-Fi where I can study."

Mappy interprets your request, finds relevant places, ranks them according to your preferences, and explains why they match.

## ✨ Features

* 🧠 Natural-language place search
* 📍 Location-aware discovery
* 🗺️ Interactive map
* 🔎 Intent and preference extraction
* 📊 Multi-factor place ranking
* 📶 Wi-Fi and amenity detection
* ⭐ Support for available place ratings and star classifications
* 🏨 Hotel, cafe, restaurant, park, library and other place categories
* 🌍 OpenStreetMap-powered place data
* 🤖 Local AI support with Ollama
* 🧩 Rule-based fallback when AI is unavailable
* 🚫 No Google Maps API required
* 💸 Free to run locally

## 💡 Example

Instead of searching for:

```text
cafes
```

Try:

```text
A calm cafe with Wi-Fi where I can study for a few hours
```

Or:

```text
4 star hotel near central London
```

```text
Quiet restaurant for a date
```

```text
Park where I can walk and relax
```

Mappy turns natural language into structured search intent and uses that intent to rank nearby places.

## 🧠 How It Works

```text
User query
    ↓
Natural-language intent
    ↓
Place data retrieval
    ↓
Candidate places
    ↓
Preference matching
    ↓
Ranking
    ↓
Results + explanations
```

Mappy is designed around the idea that place discovery should understand **what you mean**, not just what category you typed.

## 🏗️ Architecture

Mappy currently uses:

* **Node.js + Express** for the application server
* **Qwen3 0.6B** through Ollama for local intent extraction
* **OpenStreetMap** for geographic and place data
* **Overpass API** for querying OpenStreetMap data
* **Leaflet** for interactive maps
* Deterministic ranking for predictable results
* Rule-based fallback for environments without a local AI model

## 🚀 Getting Started

### Requirements

* Node.js
* npm
* Ollama
* Qwen3 0.6B

### Install

Clone the repository:

```bash
git clone https://github.com/linkedintelligence/mappy.git
cd mappy
```

Install dependencies:

```bash
npm install
```

Install the local AI model:

```bash
ollama pull qwen3:0.6b
```

Start Ollama:

```bash
ollama serve
```

Start Mappy:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## 🌍 Data

Mappy uses OpenStreetMap data through Overpass.

Place availability and metadata depend on the coverage and quality of OpenStreetMap data in a particular area.

Mappy does not invent ratings, amenities, opening hours, or other place information when those details are unavailable.

## 🤖 AI

Mappy can use a locally running Qwen3 0.6B model to interpret natural-language searches.

For example:

```text
"quiet cafe with wifi and outdoor seating"
```

can be interpreted into multiple search preferences rather than being treated as a single keyword.

If the local AI model is unavailable, Mappy can fall back to deterministic rule-based intent extraction.

## 🔍 Ranking

Mappy evaluates candidate places using multiple signals, which can include:

* Category relevance
* Distance
* Amenities
* Wi-Fi availability
* Study and work suitability
* Outdoor features
* Family suitability
* Date-night preferences
* Budget-related signals
* Available ratings or star classifications
* Query keyword matches

The goal is to produce useful results without pretending that incomplete data is complete.

## 🗺️ Why OpenStreetMap?

Mappy uses OpenStreetMap because it provides an open geographic data ecosystem and allows developers to build applications without depending on proprietary map platforms.

However, public OpenStreetMap-related services are shared infrastructure and may have usage limits.

Production deployments should use appropriate infrastructure and follow the policies of the services they depend on.

## 📦 MapLink - The API for Mappy

Mappy can also be used as an API for applications that want natural-language place discovery.

Example:

```http
POST /search
Content-Type: application/json
```

```json
{
  "query": "Calm cafe with wifi",
  "lat": 51.5074,
  "lon": -0.1278,
  "limit": 5
}
```

The hosted MapLink API may be offered separately by Linked AI.

The MapLink API by Linked AI is paid software by Linked AI. However, the core Mappy is Open-Source.

## 🛠️ Development

Mappy is an experimental project from **Linked AI** focused on exploring natural-language interfaces for real-world discovery.

The project is actively evolving.

Expect changes to the architecture, ranking system, AI pipeline, API, and user interface as the project develops.

## 🗺️ Roadmap

Potential future features include:

- [ ] Personalized ranking
* [ ] Saved places
* [ ] Search history
* [ ] Place comparison
* [ ] Advanced preference profiles
* [ ] Mood and vibe search
* [ ] Crowd avoidance
* [ ] Multi-stop trip planning
* [ ] AI-generated itineraries
* [ ] Better place explanations
* [ ] Improved geographic search
* [ ] Hosted Mappy API
* [ ] Developer documentation
* [ ] More AI models
* [ ] Mobile application

## 🤝 Contributing

Contributions, ideas, bug reports, and experiments are welcome.

If you find a problem or have an idea for improving Mappy, open an issue or submit a pull request.

## 📄 License

Mappy is licensed under the **Apache License 2.0**.

See [`LICENSE`](LICENSE) for the full license text.

## 🧠 About Linked AI

**Linked AI** is a project exploring the capabilities of artificial intelligence and beyond.

We build, test, and open-source experiments across AI, intelligent systems, APIs, and emerging technology.

---

**Linked AI**

*Exploring what AI can do.*
