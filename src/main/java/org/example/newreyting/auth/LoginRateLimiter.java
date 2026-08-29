package org.example.newreyting.auth;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Login endpointini brute-force urinishlardan himoya qiladi — xotirada saqlanadigan
 * oddiy hisoblagich (bitta instansiya uchun yetarli, tarqatilgan cache talab qilmaydi).
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<String, Deque<Instant>> failedAttemptsByLogin = new ConcurrentHashMap<>();

    public boolean isBlocked(String login) {
        return activeFailures(login).size() >= MAX_ATTEMPTS;
    }

    public void recordFailure(String login) {
        activeFailures(login).addLast(Instant.now());
    }

    public void recordSuccess(String login) {
        failedAttemptsByLogin.remove(key(login));
    }

    private Deque<Instant> activeFailures(String login) {
        Deque<Instant> attempts = failedAttemptsByLogin.computeIfAbsent(key(login), k -> new ConcurrentLinkedDeque<>());
        Instant cutoff = Instant.now().minus(WINDOW);
        while (true) {
            Instant oldest = attempts.peekFirst();
            if (oldest == null || !oldest.isBefore(cutoff)) break;
            attempts.pollFirst();
        }
        return attempts;
    }

    private String key(String login) {
        return login.trim().toLowerCase();
    }
}
