package com.seestack.modules.security.service;

import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;

/**
 * Basic Port Exposure Check.
 *
 * Intentionally limited:
 *  - fixed, small list of ports
 *  - single TCP connect attempt per port with short timeout
 *  - no threading, no range scanning, no banner grabbing
 *  - uses only java.net — no external binaries or libraries
 *
 * For educational/demo use only. This is NOT a penetration test and
 * NOT a vulnerability scanner.
 */
@Component
@NullMarked
public class PortScanner {

    public static final List<Integer> COMMON_PORTS = List.of(22, 80, 443, 3306, 5432, 6379, 8080, 8443);
    private static final int CONNECT_TIMEOUT_MS = 1500;

    public ScanResult scan(String target) {
        String host = sanitizeTarget(target);
        InetAddress addr;
        try {
            addr = InetAddress.getByName(host);
        } catch (UnknownHostException e) {
            return ScanResult.failure("Unable to resolve host: " + host);
        }

        List<Integer> open = new ArrayList<>();
        List<Integer> closed = new ArrayList<>();

        for (int port : COMMON_PORTS) {
            if (checkPort(addr, port)) {
                open.add(port);
            } else {
                closed.add(port);
            }
        }

        return ScanResult.success(addr.getHostAddress(), open, closed);
    }

    private boolean checkPort(InetAddress addr, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(addr, port), CONNECT_TIMEOUT_MS);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private String sanitizeTarget(String raw) {
        String t = raw.trim().toLowerCase();
        if (t.startsWith("http://"))  t = t.substring(7);
        if (t.startsWith("https://")) t = t.substring(8);
        int slash = t.indexOf('/');
        if (slash >= 0) t = t.substring(0, slash);
        int colon = t.indexOf(':');
        if (colon >= 0) t = t.substring(0, colon);
        return t;
    }

    public record ScanResult(
            boolean success,
            String resolvedHost,
            List<Integer> openPorts,
            List<Integer> closedPorts,
            String errorMessage
    ) {
        static ScanResult success(String host, List<Integer> open, List<Integer> closed) {
            return new ScanResult(true, host, open, closed, "");
        }
        static ScanResult failure(String msg) {
            return new ScanResult(false, "", List.of(), List.of(), msg);
        }
    }
}
