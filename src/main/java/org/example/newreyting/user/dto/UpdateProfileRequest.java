package org.example.newreyting.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank String ism,
        @NotBlank String familiya,
        @NotBlank String login,
        /** Profil surati, data URL sifatida. Ixtiyoriy — null bo'lsa surat o'chiriladi/o'zgarmaydi. */
        String rasm,
        /** Faqat ADMIN tomonidan yuborilganda e'tiborga olinadi — menejer/supervayzerni boshqa
         * yuqori rolga (operator/menejer) qayta biriktirish uchun. Bo'sh bo'lsa egasi o'zgarmaydi. */
        Long ownerId
) {
}
