package org.example.newreyting.rating;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.rating.dto.RahbarNatijaBulkRequest;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Menejer/Supervayzer uchun qo'lda kiritiladigan TARIXIY oylik ball/foiz — {@link RahbarOylikNatija}
 * izohiga qarang. Faqat eski (tizimdan oldingi) oylarni migratsiya qilish uchun; joriy/yangi
 * oylar hamon agentlar natijasidan avtomatik hisoblanadi (RatingService).
 */
@Service
public class RahbarOylikNatijaService {

    private final RahbarOylikNatijaRepository natijaRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public RahbarOylikNatijaService(RahbarOylikNatijaRepository natijaRepository, UserRepository userRepository,
                                     AuditService auditService) {
        this.natijaRepository = natijaRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<RahbarOylikNatija> listByOy(LocalDate oy) {
        return natijaRepository.findAllByOy(oy.withDayOfMonth(1));
    }

    /** ADMIN/OPERATOR — menejer va supervayzer uchun; MENEJER — faqat supervayzer uchun. */
    private boolean canManage(User currentUser, Role targetRole) {
        if (targetRole != Role.MENEJER && targetRole != Role.SUPERVAYZER) {
            return false;
        }
        return switch (currentUser.getRole()) {
            case ADMIN, OPERATOR -> true;
            case MENEJER -> targetRole == Role.SUPERVAYZER;
            case SUPERVAYZER -> false;
        };
    }

    @Transactional
    public void saveBulk(RahbarNatijaBulkRequest req, User currentUser) {
        LocalDate oy = req.oy().withDayOfMonth(1);
        Set<String> nomlar = new LinkedHashSet<>();
        for (RahbarNatijaBulkRequest.Satr satr : req.satrlar()) {
            User target = userRepository.findById(satr.userId())
                    .orElseThrow(() -> new IllegalArgumentException("Foydalanuvchi topilmadi"));
            if (!canManage(currentUser, target.getRole())) {
                throw new IllegalArgumentException("\"" + target.getFullName() + "\" uchun ma'lumot kiritish huquqingiz yo'q");
            }
            RahbarOylikNatija natija = natijaRepository.findByUserIdAndOy(target.getId(), oy)
                    .orElseGet(() -> natijaRepository.save(new RahbarOylikNatija(target, oy, 0, 0)));
            natija.setPercent(satr.percent());
            natija.setBall(satr.ball());
            nomlar.add(target.getFullName());
        }
        if (!nomlar.isEmpty()) {
            auditService.record(currentUser, HarakatTuri.OZGARTIRDI, auditXabari(nomlar, oy));
        }
    }

    private static final int AUDIT_MAX_ISM = 5;

    private String auditXabari(Set<String> nomlar, LocalDate oy) {
        if (nomlar.size() <= AUDIT_MAX_ISM) {
            return String.join(", ", nomlar) + " — " + oy + " tarixiy natijasi";
        }
        String korsatilgan = String.join(", ", nomlar.stream().limit(AUDIT_MAX_ISM).toList());
        int qolgan = nomlar.size() - AUDIT_MAX_ISM;
        return korsatilgan + " va yana " + qolgan + " ta — " + oy + " tarixiy natijasi";
    }
}
