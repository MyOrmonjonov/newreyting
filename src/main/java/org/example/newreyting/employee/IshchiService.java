package org.example.newreyting.employee;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.branch.Filial;
import org.example.newreyting.branch.FilialRepository;
import org.example.newreyting.employee.dto.CreateIshchiRequest;
import org.example.newreyting.employee.dto.UpdateIshchiRequest;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IshchiService {

    private final IshchiRepository ishchiRepository;
    private final FilialRepository filialRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public IshchiService(IshchiRepository ishchiRepository, FilialRepository filialRepository,
                          UserRepository userRepository, AuditService auditService) {
        this.ishchiRepository = ishchiRepository;
        this.filialRepository = filialRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /** Rolga qarab ko'rinadigan ishchilar: ADMIN/OPERATOR — hammasi, MENEJER — o'z supervayzerlariga tegishlilar, SUPERVAYZER — faqat o'ziniki. */
    public List<Ishchi> listVisibleTo(User currentUser) {
        return switch (currentUser.getRole()) {
            case ADMIN, OPERATOR -> ishchiRepository.findAllWithRefs();
            case MENEJER -> ishchiRepository.findAllBySupervayzerCreatedById(currentUser.getId());
            case SUPERVAYZER -> ishchiRepository.findAllBySupervayzerId(currentUser.getId());
        };
    }

    /** Joriy foydalanuvchi shu ishchi uchun ma'lumot kiritish/tahrirlash huquqiga ega-emasligini tekshiradi. */
    public boolean canManage(User currentUser, Ishchi ishchi) {
        return switch (currentUser.getRole()) {
            case ADMIN, OPERATOR -> true;
            case MENEJER -> ishchi.getSupervayzer().getCreatedBy() != null
                    && ishchi.getSupervayzer().getCreatedBy().getId().equals(currentUser.getId());
            case SUPERVAYZER -> ishchi.getSupervayzer().getId().equals(currentUser.getId());
        };
    }

    public Ishchi getById(Long id) {
        return ishchiRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Ishchi topilmadi"));
    }

    @Transactional
    public Ishchi create(CreateIshchiRequest req, User currentUser) {
        Filial filial = filialRepository.findById(req.filialId())
                .orElseThrow(() -> new IllegalArgumentException("Filial topilmadi"));

        User supervayzer = resolveSupervayzer(req.supervayzerId(), currentUser);

        Ishchi ishchi = new Ishchi(
                req.ism().trim(),
                req.familiya().trim(),
                filial,
                supervayzer,
                req.ishGaKirganSana(),
                currentUser
        );
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
        Filial filial = filialRepository.findById(req.filialId())
                .orElseThrow(() -> new IllegalArgumentException("Filial topilmadi"));
        User supervayzer = resolveSupervayzer(req.supervayzerId(), currentUser);

        ishchi.setIsm(req.ism().trim());
        ishchi.setFamiliya(req.familiya().trim());
        ishchi.setFilial(filial);
        ishchi.setSupervayzer(supervayzer);
        ishchi.setIshGaKirganSana(req.ishGaKirganSana());
        ishchi.setActive(req.active());
        auditService.record(currentUser, HarakatTuri.OZGARTIRDI, "Ishchi: " + ishchi.getIsm() + " " + ishchi.getFamiliya());
        return ishchi;
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
        return supervayzer;
    }
}
