const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSPzh8mr2_gdiYmEcpKmdPNX79gRTumxNdU0pXfM04vIGSqjQO_6R6RFCCwY2t9k73/exec";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...cors
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // API: load submitted names from Google Apps Script.
    if (url.pathname === "/api/survey/names" && request.method === "GET") {
      try {
        const r = await fetch(APPS_SCRIPT_URL + "?action=getSubmittedNames", {
          method: "GET",
          redirect: "follow",
          headers: { "Accept": "application/json" }
        });

        const text = await r.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return json({
            success: false,
            message: "Apps Script returned an invalid response."
          }, 502);
        }

        if (Array.isArray(data)) {
          return json({ success: true, names: data });
        }

        return json({
          success: data.success !== false,
          names: Array.isArray(data.names) ? data.names : [],
          message: data.message || ""
        }, r.status);
      } catch (error) {
        return json({
          success: false,
          message: "Unable to connect to the survey server."
        }, 502);
      }
    }

    // API: submit survey to Google Apps Script.
    if (url.pathname === "/api/survey" && request.method === "POST") {
      try {
        const body = await request.text();

        const r = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          redirect: "follow",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body
        });

        const text = await r.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return json({
            success: false,
            message: "Apps Script returned an invalid response."
          }, 502);
        }

        return json(data, r.status);
      } catch (error) {
        return json({
          success: false,
          message: "Unable to submit the survey."
        }, 502);
      }
    }

    // Everything that is not an API route is a static asset.
    // This is the critical part: the Worker must explicitly ask the
    // Cloudflare Assets binding to serve public/survey.html.
    return env.ASSETS.fetch(request);
  }
};
