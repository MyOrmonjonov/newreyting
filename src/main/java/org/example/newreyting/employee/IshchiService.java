package org.example.newreyting.employee;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.employee.dto.CreateIshchiRequest;
import org.example.newreyting.employee.dto.UpdateIshchiRequest;
import org.example.newreyting.result.OylikNatijaRepository;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IshchiService {

    private final IshchiRepository ishchiRepository;
    private final UserRepository userRepository;
    private final OylikNatijaRepository natijaRepository;
    private final AuditService auditService;

    public IshchiService(IshchiRepository ishchiRepository, UserRepository userRepository,
                          OylikNatijaRepository natijaRepository, AuditService auditService) {
        this.ishchiRepository = ishchiRepository;
        this.userRepository = userRepository;
        this.natijaRepository = natijaRepository;
        this.auditService = auditService;
    }

    /**
     * Rolga qarab ko'rinadigan ishchilar (ID zanjiri bo'yicha): ADMIN — hammasi, OPERATOR — o'zi
     * yaratgan menejerlarga tegishli supervayzerlarning ishchilari, MENEJER — o'zi yaratgan
     * supervayzerlarga tegishlilar, SUPERVAYZER — faqat o'ziniki.
     */
    public List<Ishchi> listVisibleTo(User currentUser) {
        return switch (currentUser.getRole()) {
            case ADMIN -> ishchiRepository.findAllWithRefs();
            case OPERATOR -> ishchiRepository.findAllBySupervayzerCreatedByCreatedById(currentUser.getId());
            case MENEJER -> ishchiRepository.findAllBySupervayzerCreatedById(currentUser.getId());
            case SUPERVAYZER -> ishchiRepository.findAllBySupervayzerId(currentUser.getId());
        };
    }

    /** Joriy foydalanuvchi shu ishchi uchun ma'lumot kiritish/tahrirlash/o'chirish huquqiga ega-emasligini tekshiradi. */
    public boolean canManage(User currentUser, Ishchi ishchi) {
        User supervayzer = ishchi.getSupervayzer();
        return switch (currentUser.getRole()) {
            case ADMIN -> true;
            case OPERATOR -> supervayzer.getCreatedBy() != null
                    && supervayzer.getCreatedBy().getCreatedBy() != null
                    && supervayzer.getCreatedBy().getCreatedBy().getId().equals(currentUser.getId());
            case MENEJER -> supervayzer.getCreatedBy() != null
                    && supervayzer.getCreatedBy().getId().equals(currentUser.getId());
            case SUPERVAYZER -> supervayzer.getId().equals(currentUser.getId());
        };
    }

    public Ishchi getById(Long id) {
        return ishchiRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Ishchi topilmadi"));
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
        Ishchi saved = ishchiRepository.save(ishchi);
        auditService.record(currentUser, HarakatTuri.QOSHDI, "Ishchi: " + saved.getIsm() + " " + saved.getFamiliya());
        return saved;
    }

    @Transactional
    public Ishchi update(Long id, UpdateIshchiRequest req, User currentUser) {
        Ishchi ishchi = getById(id);
        if (!canManage(currentUser, ishchi)) {
            throw new IllegalArgumentException("Bu ishchini tahrirlash huquqingiz yo'q");
        }
        User supervayzer = resolveSupervayzer(req.supervayzerId(), currentUser);

        ishchi.setIsm(req.ism().trim());
        ishchi.setFamiliya(req.familiya().trim());
        ishchi.setSupervayzer(supervayzer);
        ishchi.setIshGaKirganSana(req.ishGaKirganSana());
        ishchi.setActive(req.active());
        ishchi.setBoshlangichLiga(parseLiga(req.boshlangichLiga()));
        ishchi.setRasm(validateRasm(req.rasm()));
        auditService.record(currentUser, HarakatTuri.OZGARTIRDI, "Ishchi: " + ishchi.getIsm() + " " + ishchi.getFamiliya());
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
    public void delete(Long id, User currentUser) {
        Ishchi ishchi = getById(id);
        if (!canManage(currentUser, ishchi)) {
            throw new IllegalArgumentException("Bu ishchini o'chirish huquqingiz yo'q");
        }
        if (natijaRepository.existsByIshchiId(id)) {
            throw new IllegalArgumentException(
                    "\"" + ishchi.getIsm() + " " + ishchi.getFamiliya() + "\" ishchisini o'chirib bo'lmaydi — unga bog'liq oylik natijalar mavjud");
        }
        String nomi = ishchi.getIsm() + " " + ishchi.getFamiliya();
        ishchiRepository.deleteById(id);
        auditService.record(currentUser, HarakatTuri.OCHIRDI, "Ishchi: " + nomi);
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
