package org.example.newreyting.config;

/**
 * O'chirish bloklangan, chunki bog'liq ma'lumotlar mavjud — lekin foydalanuvchi "baribir
 * o'chirish" (force=true) bilan qayta so'rasa, davom etish mumkin. {@link ApiExceptionHandler}
 * buni oddiy {@link IllegalArgumentException}dan farqli javob (requiresForce=true) bilan qaytaradi,
 * shunda frontend aniq "tasdiqlab, baribir o'chirish" dialogini ko'rsatadi.
 */
public class DeleteRequiresForceException extends RuntimeException {

    public DeleteRequiresForceException(String message) {
        super(message);
    }
}
