const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSPzh8mr2_gdiYmEcpKmdPNX79gRTumxNdU0pXfM04vIGSqjQO_6R6RFCCwY2t9k73/exec";

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
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, {status:204, headers:cors});

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return fetch(new URL("/survey.html", request.url), request);
    }

    if (url.pathname === "/api/survey/names" && request.method === "GET") {
      try {
        const r = await fetch(APPS_SCRIPT_URL + "?action=getSubmittedNames", {
          headers: {"Accept":"application/json"}
        });
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); }
        catch { return json({success:false,message:"Apps Script returned an invalid response."},502); }
        if (Array.isArray(data)) return json({success:true,names:data});
        return json({success:data.success !== false,names:data.names || [],message:data.message || ""},r.status);
      } catch (e) {
        return json({success:false,message:"Unable to connect to the survey server."},502);
      }
    }

    if (url.pathname === "/api/survey" && request.method === "POST") {
      try {
        const body = await request.text();
        const r = await fetch(APPS_SCRIPT_URL, {
          method:"POST",
          headers: {"Content-Type":"application/json"},
          body
        });
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); }
        catch { return json({success:false,message:"Apps Script returned an invalid response."},502); }
        return json(data,r.status);
      } catch (e) {
        return json({success:false,message:"Unable to submit the survey."},502);
      }
    }

    return new Response("Not Found",{status:404});
  }
};