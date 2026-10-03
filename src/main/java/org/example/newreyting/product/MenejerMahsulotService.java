package org.example.newreyting.product;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class MenejerMahsulotService {

    private final MenejerMahsulotRepository linkRepository;
    private final MahsulotRepository mahsulotRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public MenejerMahsulotService(MenejerMahsulotRepository linkRepository, MahsulotRepository mahsulotRepository,
                                   UserRepository userRepository, AuditService auditService) {
        this.linkRepository = linkRepository;
        this.mahsulotRepository = mahsulotRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /** Natija kiritishda ko'rsatiladigan mahsulotlar — menejerga hech narsa biriktirilmagan bo'lsa
     * (hali sozlanmagan), eski xatti-harakat saqlanadi: HAMMASI ko'rinadi. */
    public List<Mahsulot> visibleFor(Long menejerId) {
        List<MenejerMahsulot> links = linkRepository.findByMenejerId(menejerId);
        if (links.isEmpty()) {
            return mahsulotRepository.findAllByOrderByNomiAsc();
        }
        return links.stream()
                .map(MenejerMahsulot::getMahsulot)
                .sorted(Comparator.comparing(Mahsulot::getNomi))
                .toList();
    }

    /** Biriktirish oynasi uchun — aynan shu menejerga qo'lda belgilangan mahsulot ID'lari (bo'sh
     * bo'lishi mumkin, {@link #visibleFor} dagi "hammasi" fallback'i bu yerda qo'llanmaydi). */
    public List<Long> assignedIds(Long menejerId) {
        return linkRepository.findByMenejerId(menejerId).stream()
                .map(mm -> mm.getMahsulot().getId())
                .toList();
    }

    @Transactional
    public void setAssignments(Long menejerId, List<Long> mahsulotIds, User actor) {
        User menejer = userRepository.findById(menejerId)
                .orElseThrow(() -> new IllegalArgumentException("Menejer topilmadi"));
        if (menejer.getRole() != Role.MENEJER) {
            throw new IllegalArgumentException("Faqat menejerga mahsulot biriktirish mumkin");
        }
        linkRepository.deleteByMenejerId(menejerId);
        for (Long mahsulotId : mahsulotIds) {
            Mahsulot mahsulot = mahsulotRepository.findById(mahsulotId)
                    .orElseThrow(() -> new IllegalArgumentException("Mahsulot topilmadi"));
            linkRepository.save(new MenejerMahsulot(menejer, mahsulot));
        }
        auditService.record(actor, HarakatTuri.OZGARTIRDI,
                menejer.getFullName() + " uchun mahsulotlar biriktirmasi yangilandi (" + mahsulotIds.size() + " ta)");
    }
}
