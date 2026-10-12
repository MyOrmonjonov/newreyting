package org.example.newreyting.user;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.config.DeleteRequiresForceException;
import org.example.newreyting.employee.Ishchi;
import org.example.newreyting.employee.IshchiRepository;
import org.example.newreyting.product.MenejerMahsulotRepository;
import org.example.newreyting.rating.OylikYakunRepository;
import org.example.newreyting.rating.RahbarOylikNatijaRepository;
import org.example.newreyting.result.OylikNatijaRepository;
import org.example.newreyting.user.dto.CreateUserRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final IshchiRepository ishchiRepository;
    private final OylikNatijaRepository natijaRepository;
    private final OylikYakunRepository oylikYakunRepository;
    private final MenejerMahsulotRepository menejerMahsulotRepository;
    private final RahbarOylikNatijaRepository rahbarOylikNatijaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, IshchiRepository ishchiRepository,
                        OylikNatijaRepository natijaRepository, OylikYakunRepository oylikYakunRepository,
                        MenejerMahsulotRepository menejerMahsulotRepository,
                        RahbarOylikNatijaRepository rahbarOylikNatijaRepository,
                        PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.ishchiRepository = ishchiRepository;
        this.natijaRepository = natijaRepository;
        this.oylikYakunRepository = oylikYakunRepository;
        this.menejerMahsulotRepository = menejerMahsulotRepository;
        this.rahbarOylikNatijaRepository = rahbarOylikNatijaRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional
    public User create(CreateUserRequest req, Role role, User creator) {
        if (userRepository.existsByLoginIgnoreCase(req.login())) {
            throw new IllegalArgumentException("Bu login band: " + req.login());
        }
        User createdBy = resolveOwner(req.ownerId(), role, creator);
        User user = new User(
                req.ism().trim(),
                req.familiya().trim(),
                req.login().trim(),
                passwordEncoder.encode(req.password()),
                role,
                createdBy
        );
        User saved = userRepository.save(user);
        auditService.record(creator, HarakatTuri.QOSHDI, saved.getFullName());
        return saved;
    }

    /**
     * ADMIN yoki OPERATOR SUPERVAYZERni to'g'ridan-to'g'ri yarata oladi, lekin shu holatda uni
     * o'ziga bog'lab qo'ysa (createdBy=ADMIN/OPERATOR), natijada u MENEJER ro'yxatida umuman
     * ko'rinmay, "egasiz" bo'lib qolar edi — ID zanjiri (createdBy) orqali ishlaydigan ko'rinish
     * cheklovi (listByRoleVisibleTo) uni hech qaysi menejerga ko'rsatmaydi. Shuning uchun
     * bir nechta menejer bo'lishi mumkinligi sababli ADMIN/OPERATOR ownerId yuborsa, shu
     * tanlangan menejer yoziladi (UI'da bu maydon shart — jamoa.tsx `showOwnerField`).
     * MENEJER uchun ega tanlash UI'da yo'q — tizimda bitta umumiy operator bor va har doim
     * shunga avtomatik biriktiriladi (soleOperator).
     */
    private User resolveOwner(Long ownerId, Role role, User creator) {
        if (role == Role.MENEJER) {
            return creator.getRole() == Role.OPERATOR ? creator : soleOperator();
        }
        if (role == Role.SUPERVAYZER && ownerId != null
                && (creator.getRole() == Role.ADMIN || creator.getRole() == Role.OPERATOR)) {
            return validateOwner(ownerId, Role.MENEJER);
        }
        return creator;
    }

    /** Tizimdagi yagona operator — menejerlarni shunga avtomatik biriktirish uchun. */
    private User soleOperator() {
        List<User> operators = userRepository.findByRoleOrderByFamiliyaAsc(Role.OPERATOR);
        if (operators.isEmpty()) {
            throw new IllegalArgumentException("Hali operator qo'shilmagan — avval operator qo'shing");
        }
        return operators.get(0);
    }

    private User validateOwner(Long ownerId, Role expectedOwnerRole) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Tanlangan foydalanuvchi topilmadi"));
        if (owner.getRole() != expectedOwnerRole) {
            throw new IllegalArgumentException("Noto'g'ri ega tanlandi");
        }
        return owner;
    }

    /** Faqat ADMIN chaqiradigan ro'yxatlar uchun (masalan operatorlar) — cheklovsiz. */
    public List<User> listByRole(Role role) {
        return userRepository.findByRoleOrderByFamiliyaAsc(role);
    }

    /**
     * Ko'rinish ro'yxati: ADMIN va OPERATOR — hammasi (tashkilot bo'ylab, kim yaratganidan
     * qat'iy nazar — operator tizimdagi barcha menejer va supervayzerlarni ko'rishi/boshqarishi
     * kerak), MENEJER — faqat o'zi yaratgan supervayzerlar.
     */
    public List<User> listByRoleVisibleTo(Role role, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.OPERATOR) {
            return userRepository.findByRoleOrderByFamiliyaAsc(role);
        }
        return userRepository.findByRoleAndCreatedByIdOrderByFamiliyaAsc(role, currentUser.getId());
    }

    /** Foydalanuvchi o'zining joriy parolini bilib, yangisiga almashtiradi. */
    @Transactional
    public void changeOwnPassword(User user, String oldPassword, String newPassword) {
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Joriy parol noto'g'ri");
        }
        // `user` @AuthenticationPrincipal orqali oldingi (JwtAuthFilter) so'rovda yuklangan,
        // shu tranzaksiya doirasida detached — save() chaqirmasak o'zgarish bazaga yozilmaydi.
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.record(user, HarakatTuri.OZGARTIRDI, "O'z paroli");
    }

    /** Yuqori rol (masalan Admin) quyi rol foydalanuvchisining parolini eskisini bilmasdan yangilaydi. */
    @Transactional
    public void resetPassword(Long userId, Role expectedRole, String newPassword, User actor) {
        User user = findByIdAndRole(userId, expectedRole);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        auditService.record(actor, HarakatTuri.OZGARTIRDI, user.getFullName() + " paroli");
    }

    /** Yuqori rol foydalanuvchini faollashtiradi/faolsizlantiradi — ishdan ketgan xodim hisobini yopish uchun. */
    @Transactional
    public void setActive(Long userId, Role expectedRole, boolean active, User actor) {
        User user = findByIdAndRole(userId, expectedRole);
        user.setActive(active);
        auditService.record(actor, active ? HarakatTuri.OZGARTIRDI : HarakatTuri.OCHIRDI,
                user.getFullName() + (active ? " faollashtirildi" : " faolsizlantirildi"));
    }

    /**
     * Ism/familiya, login va suratni tahrirlash (parol alohida oqim orqali o'zgaradi).
     * ownerId faqat SUPERVAYZERni ADMIN yoki OPERATOR tahrirlaganda e'tiborga olinadi —
     * boshqa menejerga qayta biriktirish uchun. Menejer uchun ega tushunchasi yo'q (bitta
     * umumiy operatorga doim biriktirilgan bo'ladi, qayta biriktirish kerak emas).
     */
    @Transactional
    public User updateProfile(Long userId, Role expectedRole, String ism, String familiya, String login, String rasm,
                               Long ownerId, User actor) {
        User user = findByIdAndRole(userId, expectedRole);
        String trimmedLogin = login.trim();
        if (!trimmedLogin.equalsIgnoreCase(user.getLogin()) && userRepository.existsByLoginIgnoreCase(trimmedLogin)) {
            throw new IllegalArgumentException("Bu login band: " + trimmedLogin);
        }
        user.setIsm(ism.trim());
        user.setFamiliya(familiya.trim());
        user.setLogin(trimmedLogin);
        user.setRasm(rasm);
        if ((actor.getRole() == Role.ADMIN || actor.getRole() == Role.OPERATOR) && ownerId != null && expectedRole == Role.SUPERVAYZER) {
            user.setCreatedBy(validateOwner(ownerId, Role.MENEJER));
        }
        auditService.record(actor, HarakatTuri.OZGARTIRDI, user.getFullName());
        return user;
    }

    /** Ta'sir hisobi — "force" o'chirish tasdiqlash xabari uchun (rekursiv: bolalar/nabira
     * foydalanuvchilar va ularning agentlari/oylik natijalari ham sanaladi). */
    private static final class DeleteImpact {
        int childUsers;
        int agents;
        long natijaRecords;

        boolean hasAnything() {
            return childUsers > 0 || agents > 0;
        }
    }

    private void collectImpact(User user, DeleteImpact impact) {
        for (User child : userRepository.findByCreatedById(user.getId())) {
            impact.childUsers++;
            collectImpact(child, impact);
        }
        if (user.getRole() == Role.SUPERVAYZER) {
            List<Ishchi> agents = ishchiRepository.findAllBySupervayzerId(user.getId());
            impact.agents += agents.size();
            for (Ishchi a : agents) {
                impact.natijaRecords += natijaRepository.countByIshchiId(a.getId());
                impact.natijaRecords += oylikYakunRepository.countByIshchiId(a.getId());
            }
        }
    }

    private String buildImpactMessage(User user, DeleteImpact impact) {
        List<String> parts = new ArrayList<>();
        if (impact.childUsers > 0) {
            parts.add(impact.childUsers + " ta u yaratgan/boshqargan foydalanuvchi (menejer/supervayzer)");
        }
        if (impact.agents > 0) {
            parts.add(impact.agents + " ta agent");
        }
        if (impact.natijaRecords > 0) {
            parts.add(impact.natijaRecords + " ta oylik natija/reyting yozuvi");
        }
        return "\"" + user.getFullName() + "\"ni o'chirishga bog'liq ma'lumotlar bor: " + String.join(", ", parts)
                + " — baribir o'chirilsa, shular ham butunlay o'chiriladi (tiklab bo'lmaydigan tarzda yo'qoladi). Davom etasizmi?";
    }

    /** Userni (va kerak bo'lsa pastidagi hammasini — nabira foydalanuvchilar, agentlar, ularning
     * oylik natijalari) rekursiv o'chiradi. Avval bolalar, keyin o'zi — FK tartibiga mos. */
    private void cascadeDelete(User user) {
        for (User child : userRepository.findByCreatedById(user.getId())) {
            cascadeDelete(child);
        }
        if (user.getRole() == Role.SUPERVAYZER) {
            List<Ishchi> agents = ishchiRepository.findAllBySupervayzerId(user.getId());
            for (Ishchi a : agents) {
                oylikYakunRepository.deleteByIshchiId(a.getId());
                natijaRepository.deleteByIshchiId(a.getId());
            }
            ishchiRepository.deleteAll(agents);
        }
        ishchiRepository.clearCreatedBy(user.getId());
        menejerMahsulotRepository.deleteByMenejerId(user.getId());
        rahbarOylikNatijaRepository.deleteByUserId(user.getId());
        userRepository.delete(user);
    }

    /** Haqiqiy o'chirish. {@code force=false} bo'lsa va bog'liq ma'lumotlar (u yaratgan
     * foydalanuvchilar, supervayzer bo'lsa — agentlari) mavjud bo'lsa, aniq sonlar bilan
     * tasdiqlash so'raladi ({@link DeleteRequiresForceException}); {@code force=true} bo'lsa,
     * hammasi rekursiv ravishda birga o'chiriladi. */
    @Transactional
    public void delete(Long userId, Role expectedRole, User actor, boolean force) {
        User user = findByIdAndRole(userId, expectedRole);
        DeleteImpact impact = new DeleteImpact();
        collectImpact(user, impact);
        if (impact.hasAnything() && !force) {
            throw new DeleteRequiresForceException(buildImpactMessage(user, impact));
        }
        String nomi = user.getFullName();
        cascadeDelete(user);
        auditService.record(actor, HarakatTuri.OCHIRDI,
                nomi + (impact.hasAnything() ? " (bog'liq foydalanuvchilar/agentlar bilan birga)" : ""));
    }

    private User findByIdAndRole(Long userId, Role expectedRole) {
        return userRepository.findByIdAndRoleFetchCreatedBy(userId, expectedRole)
                .orElseThrow(() -> new IllegalArgumentException("Foydalanuvchi topilmadi"));
    }
}
