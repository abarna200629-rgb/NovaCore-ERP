package com.erp.backend.service.auth;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MailLogStore {
    public static final List<String> logs = Collections.synchronizedList(new ArrayList<>());

    public static void log(String msg) {
        logs.add(msg);
        if (logs.size() > 200) {
            logs.remove(0);
        }
        System.out.println(msg);
    }

    public static void logErr(String msg) {
        logs.add("ERROR: " + msg);
        if (logs.size() > 200) {
            logs.remove(0);
        }
        System.err.println(msg);
    }
}
