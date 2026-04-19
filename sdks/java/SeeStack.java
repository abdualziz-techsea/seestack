// seeStack Java SDK — single-file, JDK-only. No OAuth, no external IdP.
//
// Usage:
//   SeeStack seestack = new SeeStack("ask_live_...", "http://localhost:8080", "production");
//   try { riskyWork(); } catch (Exception e) { seestack.captureException(e); }
//
// Compile + run standalone:
//   javac SeeStack.java
//   java SeeStack   # runs the demo main() below

package sdks.java;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class SeeStack {

    private final String apiKey;
    private final String endpoint;
    private final String environment;
    private final HttpClient http;

    public SeeStack(String apiKey, String endpoint, String environment) {
        if (apiKey == null || apiKey.isBlank())
            throw new IllegalArgumentException("apiKey is required");
        this.apiKey = apiKey;
        this.endpoint = endpoint.replaceAll("/+$", "");
        this.environment = environment;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    /** Send a thrown Throwable to /ingest/v1/errors. Returns the HTTP status code. */
    public int captureException(Throwable ex) {
        List<String> frames = new ArrayList<>();
        for (StackTraceElement st : ex.getStackTrace()) frames.add(st.toString());
        String body = "{"
                + "\"exceptionClass\":" + json(ex.getClass().getName()) + ","
                + "\"message\":"        + json(String.valueOf(ex.getMessage())) + ","
                + "\"stackTrace\":"     + jsonStringArray(frames) + ","
                + "\"level\":\"error\","
                + "\"environment\":"    + json(environment)
                + "}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(endpoint + "/ingest/v1/errors"))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("X-SeeStack-Key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();
        try {
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            return res.statusCode();
        } catch (Exception e) {
            return -1;
        }
    }

    // ── JSON helpers (no Jackson dep) ─────────────────────────────
    private static String json(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n");  break;
                case '\r': sb.append("\\r");  break;
                case '\t': sb.append("\\t");  break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        return sb.append('"').toString();
    }

    private static String jsonStringArray(List<String> items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(json(items.get(i)));
        }
        return sb.append(']').toString();
    }

    // ── Demo ───────────────────────────────────────────────────────
    public static void main(String[] args) {
        String key = System.getenv("SEESTACK_API_KEY");
        String endpoint = System.getenv().getOrDefault("SEESTACK_ENDPOINT", "http://localhost:8080");
        if (key == null || key.isBlank()) {
            System.err.println("SEESTACK_API_KEY env var is required");
            System.exit(1);
        }
        SeeStack sdk = new SeeStack(key, endpoint, "production");
        try {
            Object user = null;
            user.toString(); // intentional NPE
        } catch (Exception e) {
            int status = sdk.captureException(e);
            System.out.println("sent NPE, status=" + status);
        }
    }
}
