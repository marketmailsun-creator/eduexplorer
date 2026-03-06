package ai.eduexplorer.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fix: Google blocks OAuth in WebViews by detecting "; wv" in the user-agent.
        // When present, Google redirects OAuth to Chrome (external browser), which can
        // never route back to the Capacitor app — the user is stuck on a loading screen.
        // Stripping "; wv" makes the WebView appear as a standard mobile browser, so
        // Google OAuth stays fully within the app's WebView instead of opening Chrome.
        WebView webView = getBridge().getWebView();
        String originalUA = webView.getSettings().getUserAgentString();
        String cleanUA = originalUA.replace("; wv", "");
        webView.getSettings().setUserAgentString(cleanUA);
    }
}
