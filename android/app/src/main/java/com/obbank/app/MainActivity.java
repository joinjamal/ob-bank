package com.obbank.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int OB_BANK_NAVY = Color.rgb(7, 17, 31);

    @Override
    public void onCreate(Bundle savedInstanceState) {
        getWindow().setStatusBarColor(OB_BANK_NAVY);
        getWindow().setNavigationBarColor(OB_BANK_NAVY);
        getWindow().getDecorView().setBackgroundColor(OB_BANK_NAVY);
        super.onCreate(savedInstanceState);

        View webView = getBridge().getWebView();
        webView.setBackgroundColor(OB_BANK_NAVY);
    }
}
