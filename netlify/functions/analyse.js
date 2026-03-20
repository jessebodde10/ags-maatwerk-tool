// netlify/functions/analyse.js
// Proxy tussen de browser en de Anthropic API.
// De API-sleutel staat ALLEEN hier op de server — nooit in de browser.

exports.handler = async (event) => {
  // Alleen POST toestaan
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API sleutel niet geconfigureerd op de server." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Ongeldig verzoek." }) };
  }

  const { b64, mediaType } = body;
  if (!b64) {
    return { statusCode: 400, body: JSON.stringify({ error: "Geen afbeelding meegestuurd." }) };
  }

  const prompt = `Je bent een expert vakspecialist bij AGS Products B.V. in Dordrecht, specialist in lood-, zink-, koper- en aluminiumwerk voor de dakdekkerij.

AGS PRODUCTASSORTIMENT (gebruik deze exacte benamingen):

AFVOEREN PLAT DAK:
- Loden Onderuitlopen / Loden Kiezelbakken / Loden Kiezelbakken Rond
- Loden Geprimerde Onderuitlopen / Loden Geprimerde Kiezelbakken
- Loden ECO Onderuitlopen / Loden ECO Kiezelbakken
- Loden VBD Onderuitlopen / Loden VBD Kiezelbakken 90° / Loden VBD Kiezelbakken 45°
- Loden DD Afvoeren / Loden Patent-Uitlopen / Loden Stadsuitlopen
- Loden Balkondoorvoeren
- Zinken Stadsuitlopen / Zinken Vergaarbakken
- ALU Onderuitlopen / ALU Kiezelbakken / ALU-PVC Onderuitlopen / ALU-PVC Kiezelbakken
- ALU Gestraalde Afvoeren / ALU Stadsuitlopen / AGS DakTap
- Trilago Onderuitlopen / Trilago Kiezelbakken
- JUAL Onderuitlopen / JUAL Kiezelbakken
- RVS Onderuitlopen / RVS Kiezelbakken
- PVC Onderuitlopen / PVC Kiezelbakken / PVC Stadsuitlopen / PVC Vergaarbakken
- PP Onderuitlopen / PP Kiezelbakken / PP Kiezelbakken Rond
- PE-EPDM Onderuitlopen / PE-EPDM Kiezelbakken / PE-EPDM Kiezelbakken Rond

NOODOVERSTORTEN:
- Loden Spuwers / Lood-Zink Spuwers / Lood-Koper Spuwers
- Loden Combi-Uitlopen / Loden Noodoverlopen
- ALU Spuwers / ALU-PVC Spuwers / ALU Noodoverlopen / ALU-PVC Noodoverlopen
- RVS Spuwers / RVS Noodoverlopen
- PVC Spuwers / PVC Noodoverlopen
- PP Spuwers / PP Noodoverlopen
- PE Spuwers / PE Noodoverlopen

ONTLUCHTINGEN:
- Loden Doorvoer Ontluchtingen / Loden Rioolontluchtingen / Loden ECO Rioolontluchtingen
- Zinken Ontluchtingen
- ALU Dubbelwandige Ontluchtingen / ALU-PVC Dubbelwandige Ontluchtingen
- ALU Rookgas Doorvoer Ontluchtingen
- PVC Dubbelwandige / PVC Enkelwandige Ontluchtingen
- PP Dubbelwandige / PP Enkelwandige Ontluchtingen / PP Dakventilatoren
- PE Dubbelwandige / PE Enkelwandige Ontluchtingen
- RVS Stormkragen / Regenkappen

MATERIAALCODES (gebruik exact):
Lood: Code 3 (1.25mm) / Code 4 (1.80mm) / Code 5 (2.24mm) / Code 6 (2.65mm) / Code 7 (3.15mm) / Code 8 (3.55mm) / Code 18 (2.00mm)
Zink/Titaanzink: 0.5mm / 0.6mm / 0.7mm / 0.8mm / 1.0mm
Koper: 0.5mm / 0.6mm / 0.7mm / Koper kops
Aluminium: 1.0mm / 1.5mm / 2.0mm
Overig: RVS 304 / RVS 316 / PVC / PP / PE / PE-EPDM

VAKTERMEN:
- Varkensoor = handmatige nabewerking vereist
- Zetmaat notatie 150-20-30 = breedte-zetting1-zetting2 in mm
- Kraalrand / Waterval / Diepen / Zetten / Solderen / Knippen / Lassen / Vouwen
- Stadsuitloop / Onderuitloop / Kiezelbak / Vergaarbak / Spuwer / Noodoverloop
- Doorvoer / Ontluchting / Balkondoorvoer

ANALYSE INSTRUCTIES:
- Alle onbenoemde getallen zijn millimeters (mm)
- Bij "Code 18" of "lood" → identificeer als Bladlood met bijbehorende Code
- Bij "zink" zonder dikte → vraag om bevestiging dikte
- Bij lengte > 3000mm → vermeld dat levering in delen plaatsvindt
- Koppel het getekende onderdeel aan het dichtstbijzijnde AGS product

Retourneer UITSLUITEND dit JSON zonder uitleg of markdown:
{"materiaaltype":"exacte tekst zoals op schets","ags_product":"officiële AGS productnaam","lengte_mm":number_or_null,"breedte_mm":number_or_null,"diepte_mm":number_or_null,"hoek_graden":number_or_null,"aantal":number,"bewerkingen":["string"],"producttype":"onderuitloop/kiezelbak/vergaarbak/spuwer/noodoverloop/ontluchting/stadsuitloop/daktrim/slabben/anders","beschrijving":"technische omschrijving max 1 zin","opmerkingen":"bijzonderheden of leeg","betrouwbaarheid":{"materiaal":"hoog/middel/laag","afmetingen":"hoog/middel/laag","bewerkingen":"hoog/middel/laag"}}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: b64,
              },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.error?.message || `API fout ${response.status}` }),
      };
    }

    const raw = (data.content || []).map(b => b.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: clean,
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server fout: " + err.message }),
    };
  }
};
