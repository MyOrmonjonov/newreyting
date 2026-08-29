package org.example.newreyting.employee;

/**
 * Ishchi uchun boshlang'ich liga — real oylik natija kiritilmagan davrda (masalan, oldin boshqa
 * joyda ishlab, tajribasi bilan qo'shilgan xodim uchun) reytingda qaysi liga bo'yicha ko'rsatilishini
 * belgilaydi. Natija kiritilgan oylarda bu maydon e'tiborga olinmaydi — liga har doim haqiqiy %'dan
 * hisoblanadi (RatingService).
 */
public enum Liga {
    DIAMOND, GOLD, SILVER, BRONZE, RISING;

    public String key() {
        return name().toLowerCase();
    }
}
