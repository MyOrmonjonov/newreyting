package org.example.newreyting.employee;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.config.DeleteRequiresForceException;
import org.example.newreyting.employee.dto.CreateIshchiRequest;
import org.example.newreyting.employee.dto.UpdateIshchiRequest;
import org.example.newreyting.rating.OylikYakunRepository;
import org.example.newreyting.result.OylikNatijaRepository;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class IshchiService {

    private final IshchiRepository ishchiRepository;
    private final UserRepository userRepository;
    private final OylikNatijaRepository natijaRepository;
    private final OylikYakunRepository oylikYakunRepository;
    private final AuditService auditService;

    public IshchiService(IshchiRepository ishchiRepository, UserRepository userRepository,
                          OylikNatijaRepository natijaRepository, OylikYakunRepository oylikYakunRepository,
                          AuditService auditService) {
        this.ishchiRepository = ishchiRepository;
        this.userRepository = userRepository;
        this.natijaRepository = natijaRepository;
        this.oylikYakunRepository = oylikYakunRepository;
        this.auditService = auditService;
    }

    /**
     * Rolga qarab ko'rinadigan ishchilar: ADMIN va OPERATOR — hammasi (tashkilot bo'ylab),
     * MENEJER — o'zi yaratgan supervayzerlarga tegishlilar (ID zanjiri, 1 pog'ona), SUPERVAYZER —
     * faqat o'ziniki.
     */
    public List<Ishchi> listVisibleTo(User currentUser) {
        return switch (currentUser.getRole()) {
            case ADMIN, OPERATOR -> ishchiRepository.findAllWithRefs();
            case MENEJER -> ishchiRepository.findAllBySupervayzerCreatedById(currentUser.getId());
            case SUPERVAYZER -> ishchiRepository.findAllBySupervayzerId(currentUser.getId());
        };
    }

    /** Joriy foydalanuvchi shu ishchi uchun ma'lumot kiritish/tahrirlash/o'chirish huquqiga ega-emasligini tekshiradi. */
    public boolean canManage(User currentUser, Ishchi ishchi) {
        User supervayzer = ishchi.getSupervayzer();
        return switch (currentUser.getRole()) {
            case ADMIN, OPERATOR -> true;
            case MENEJER -> supervayzer.getCreatedBy() != null
                    && supervayzer.getCreatedBy().getId().equals(currentUser.getId());
            case SUPERVAYZER -> supervayzer.getId().equals(currentUser.getId());
        };
    }

    public Ishchi getById(Long id) {
        return ishchiRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Agent topilmadi"));
    }

    /** Tahrirlash oynasi suratni oldindan to'ldirishi uchun — ro'yxat endi suratning o'zini emas,
     * faqat keshlanadigan URL'ini qaytaradi ({@link IshchiController#list}), shuning uchun
     * tahrirlashda haqiqiy (base64) qiymat shu alohida so'rov orqali olinadi. */
    public String getRasm(Long id, User currentUser) {
        Ishchi ishchi = getById(id);
        if (!canManage(currentUser, ishchi)) {
            throw new IllegalArgumentException("Bu agentni ko'rish huquqingiz yo'q");
        }
        return ishchi.getRasm();
    }

    @Transactional
    public Ishchi create(CreateIshchiRequest req, User currentUser) {
        User supervayzer = resolveSupervayzer(req.supervayzerId(), currentUser);

        Ishchi ishchi = new Ishchi(
                req.ism().trim(),
                req.familiya().trim(),
                supervayzer,
                req.ishGaKirganSana(),
                currentUser
        );
        ishchi.setBoshlangichLiga(parseLiga(req.boshlangichLiga()));
        ishchi.setRasm(validateRasm(req.rasm()));
        ishchi.setViloyat(parseViloyat(req.viloyat()));
        Ishchi saved = ishchiRepository.save(ishchi);
        auditService.record(currentUser, HarakatTuri.QOSHDI, "Agent: " + saved.getIsm() + " " + saved.getFamiliya());
        return saved;
    }

    @Transactional
    public Ishchi update(Long id, UpdateIshchiRequest req, User currentUser) {
        Ishchi ishchi = getById(id);
        if (!canManage(currentUser, ishchi)) {
            throw new IllegalArgumentException("Bu agentni tahrirlash huquqingiz yo'q");
        }
        User supervayzer = resolveSupervayzer(req.supervayzerId(), currentUser);

        ishchi.setIsm(req.ism().trim());
        ishchi.setFamiliya(req.familiya().trim());
        ishchi.setSupervayzer(supervayzer);
        ishchi.setIshGaKirganSana(req.ishGaKirganSana());
        ishchi.setActive(req.active());
        ishchi.setBoshlangichLiga(parseLiga(req.boshlangichLiga()));
        ishchi.setRasm(validateRasm(req.rasm()));
        ishchi.setViloyat(parseViloyat(req.viloyat()));
        auditService.record(currentUser, HarakatTuri.OZGARTIRDI, "Agent: " + ishchi.getIsm() + " " + ishchi.getFamiliya());
        return ishchi;
    }

    private Liga parseLiga(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Liga.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Noto'g'ri liga qiymati: " + value);
        }
    }

    private Viloyat parseViloyat(String value) {
        try {
            return Viloyat.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Noto'g'ri viloyat qiymati: " + value);
        }
    }

    private static final int MAX_RASM_LENGTH = 2_000_000;

    private String validateRasm(String rasm) {
        if (rasm == null || rasm.isBlank()) {
            return null;
        }
        if (rasm.length() > MAX_RASM_LENGTH) {
            throw new IllegalArgumentException("Surat hajmi juda katta");
        }
        return rasm;
    }

    @Transactional
    public void delete(Long id, User currentUser, boolean force) {
        Ishchi ishchi = getById(id);
        if (!canManage(currentUser, ishchi)) {
            throw new IllegalArgumentException("Bu agentni o'chirish huquqingiz yo'q");
        }
        long natijaCount = natijaRepository.countByIshchiId(id);
        long yakunCount = oylikYakunRepository.countByIshchiId(id);
        boolean hasNatijalar = natijaCount > 0 || yakunCount > 0;
        if (hasNatijalar && !force) {
            StringBuilder sb = new StringBuilder();
            sb.append("\"").append(ishchi.getIsm()).append(" ").append(ishchi.getFamiliya())
                    .append("\" agentini o'chirishga bog'liq ma'lumotlar bor: ");
            List<String> parts = new ArrayList<>();
            if (natijaCount > 0) parts.add(natijaCount + " ta oylik natija yozuvi");
            if (yakunCount > 0) parts.add(yakunCount + " ta muzlatilgan (yakunlangan oy) reyting yozuvi");
            sb.append(String.join(" va ", parts));
            sb.append(" — baribir o'chirilsa, shular ham butunlay o'chiriladi (bu agentning o'tgan oylardagi "
                    + "natijalari/reytingi tiklab bo'lmaydigan tarzda yo'qoladi). Davom etasizmi?");
            throw new DeleteRequiresForceException(sb.toString());
        }
        String nomi = ishchi.getIsm() + " " + ishchi.getFamiliya();
        if (hasNatijalar) {
            oylikYakunRepository.deleteByIshchiId(id);
            natijaRepository.deleteByIshchiId(id);
        }
        ishchiRepository.deleteById(id);
        auditService.record(currentUser, HarakatTuri.OCHIRDI,
                "Agent: " + nomi + (hasNatijalar ? " (bog'liq oylik natijalar bilan birga)" : ""));
    }

    private User resolveSupervayzer(Long requestedSupervayzerId, User currentUser) {
        if (currentUser.getRole() == Role.SUPERVAYZER) {
            return currentUser;
        }
        if (requestedSupervayzerId == null) {
            throw new IllegalArgumentException("Supervayzer tanlanishi shart");
        }
        User supervayzer = userRepository.findById(requestedSupervayzerId)
                .orElseThrow(() -> new IllegalArgumentException("Supervayzer topilmadi"));
        if (supervayzer.getRole() != Role.SUPERVAYZER) {
            throw new IllegalArgumentException("Tanlangan foydalanuvchi supervayzer emas");
        }
        if (currentUser.getRole() == Role.MENEJER
                && (supervayzer.getCreatedBy() == null || !supervayzer.getCreatedBy().getId().equals(currentUser.getId()))) {
            throw new IllegalArgumentException("Bu supervayzer sizning jamoangizga tegishli emas");
        }
        if (currentUser.getRole() == Role.OPERATOR
                && (supervayzer.getCreatedBy() == null || supervayzer.getCreatedBy().getCreatedBy() == null
                    || !supervayzer.getCreatedBy().getCreatedBy().getId().equals(currentUser.getId()))) {
            throw new IllegalArgumentException("Bu supervayzer sizning jamoangizga tegishli emas");
        }
        return supervayzer;
    }
}
