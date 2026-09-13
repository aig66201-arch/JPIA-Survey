const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwz8zKhr8vFzwcS8FCUXIHtUVakEc2DcbRo9TvPlpTDzVfpmn55dfFNTB2l-5bAzqtG/exec";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json; charset=utf-8", ...cors}
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {status:204, headers:cors});
    }

    if (url.pathname === "/api/survey/names" && request.method === "GET") {
      try {
        const r = await fetch(APPS_SCRIPT_URL + "?action=getSubmittedNames", {
          method: "GET",
          headers: {"Accept":"application/json"}
        });

        const text = await r.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return json({
            success:false,
            message:"Apps Script returned an invalid response."
          }, 502);
        }

        if (
          !data ||
          typeof data !== "object" ||
          data.success !== true ||
          !Array.isArray(data.names)
        ) {
          return json({
            success:false,
            message:"Apps Script returned an invalid response."
          }, 502);
        }

        return json({
          success:true,
          names:data.names
        });
      } catch (e) {
        return json({
          success:false,
          message:"Unable to connect to the survey server."
        }, 502);
      }
    }

    if (url.pathname === "/api/survey" && request.method === "POST") {
      try {
        const body = await request.text();

        const r = await fetch(APPS_SCRIPT_URL, {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Accept":"application/json"
          },
          body
        });

        const text = await r.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return json({
            success:false,
            message:"Apps Script returned an invalid response."
          }, 502);
        }

        return json(data, r.status);
      } catch (e) {
        return json({
          success:false,
          message:"Unable to submit the survey."
        }, 502);
      }
    }

    // Cloudflare Assets serves /, /index.html, /survey.html, CSS, JS, etc.
    return env.ASSETS.fetch(request);
  }
};
