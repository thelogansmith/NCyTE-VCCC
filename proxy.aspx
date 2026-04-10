<%@ Page Language="C#" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Net" %>
<%@ Import Namespace="System.Web.Configuration" %>
<script runat="server">
    protected void Page_Load(object sender, EventArgs e)
    {
        // Only accept POST requests from same origin
        if (Request.HttpMethod != "POST")
        {
            Response.StatusCode = 405;
            Response.End();
            return;
        }

        // Read API key and model endpoint from web.config AppSettings
        string apiKey   = WebConfigurationManager.AppSettings["CyberlabApiKey"];
        string apiBase  = WebConfigurationManager.AppSettings["CyberlabApiBase"];

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiBase))
        {
            Response.StatusCode = 500;
            Response.Write("{\"error\":\"Proxy not configured.\"}");
            Response.End();
            return;
        }

        // Read the JSON body sent by chatbot.js
        string requestBody;
        using (var reader = new StreamReader(Request.InputStream))
            requestBody = reader.ReadToEnd();

        try
        {
            // Forward to Cyberlab API
            var webRequest = (HttpWebRequest)WebRequest.Create(apiBase + "/chat/completions");
            webRequest.Method      = "POST";
            webRequest.ContentType = "application/json";
            webRequest.Headers.Add("Authorization", "Bearer " + apiKey);
            // Accept self-signed certs on internal lab network
            webRequest.ServerCertificateValidationCallback = (s, cert, chain, err) => true;
            webRequest.Timeout = 60000;

            byte[] bodyBytes = System.Text.Encoding.UTF8.GetBytes(requestBody);
            webRequest.ContentLength = bodyBytes.Length;
            using (var stream = webRequest.GetRequestStream())
                stream.Write(bodyBytes, 0, bodyBytes.Length);

            using (var webResponse = (HttpWebResponse)webRequest.GetResponse())
            using (var responseStream = new StreamReader(webResponse.GetResponseStream()))
            {
                string responseBody = responseStream.ReadToEnd();
                Response.ContentType = "application/json";
                Response.StatusCode  = (int)webResponse.StatusCode;
                Response.Write(responseBody);
            }
        }
        catch (WebException ex)
        {
            if (ex.Response != null)
            {
                using (var errStream = new StreamReader(ex.Response.GetResponseStream()))
                {
                    Response.StatusCode  = (int)((HttpWebResponse)ex.Response).StatusCode;
                    Response.ContentType = "application/json";
                    Response.Write(errStream.ReadToEnd());
                }
            }
            else
            {
                Response.StatusCode = 502;
                Response.ContentType = "application/json";
                Response.Write("{\"error\":\"" + ex.Message + "\", \"status\":\""
                    + ex.Status.ToString() + "\"}");
            }
        }
        catch (Exception ex)
        {
            Response.StatusCode = 500;
            Response.ContentType = "application/json";
            Response.Write("{\"error\":\"" + ex.Message + "\"}");
        }

        Response.End();
    }
</script>
