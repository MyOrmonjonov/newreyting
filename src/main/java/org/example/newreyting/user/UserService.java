package org.example.newreyting.user;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.employee.IshchiRepository;
import org.example.newreyting.user.dto.CreateUserRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final IshchiRepository ishchiRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, IshchiRepository ishchiRepository,
                        PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.ishchiRepository = ishchiRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional
    public User create(CreateUserRequest req, Role role, User createdBy) {
        if (userRepository.existsByLoginIgnoreCase(req.login())) {
            throw new IllegalArgumentException("Bu login band: " + req.login());
        }
        User user = new User(
                req.ism().trim(),
                req.familiya().trim(),
                req.login().trim(),
                passwordEncoder.encode(req.password()),
                role,
                createdBy
        );
        User saved = userRepository.save(user);
        auditService.record(createdBy, HarakatTuri.QOSHDI, saved.getFullName());
        return saved;
    }

    /** Faqat ADMIN chaqiradigan ro'yxatlar uchun (masalan operatorlar) — cheklovsiz. */
    public List<User> listByRole(Role role) {
        return userRepository.findByRoleOrderByFamiliyaAsc(role);
    }

    /**
     * ID zanjiri bo'yicha cheklangan ro'yxat: ADMIN — hammasi, OPERATOR — o'zi yaratgan
     * menejerlar / ularning supervayzerlari, MENEJER — o'zi yaratgan supervayzerlar.
     */
    public List<User> listByRoleVisibleTo(Role role, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return userRepository.findByRoleOrderByFamiliyaAsc(role);
        }
        if (currentUser.getRole() == Role.OPERATOR && role == Role.SUPERVAYZER) {
            return userRepository.findByRoleAndCreatedByCreatedByIdOrderByFamiliyaAsc(role, currentUser.getId());
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

    /** Ism/familiyani tahrirlash (login/parol alohida oqimlar orqali o'zgaradi). */
    @Transactional
    public User updateProfile(Long userId, Role expectedRole, String ism, String familiya, User actor) {
        User user = findByIdAndRole(userId, expectedRole);
        user.setIsm(ism.trim());
        user.setFamiliya(familiya.trim());
        auditService.record(actor, HarakatTuri.OZGARTIRDI, user.getFullName());
        return user;
    }

    /** Haqiqiy o'chirish — faqat unga bog'liq (u yaratgan/boshqargan) faol ma'lumot bo'lmasa. */
    @Transactional
    public void delete(Long userId, Role expectedRole, User actor) {
        User user = findByIdAndRole(userId, expectedRole);
        if (userRepository.existsByCreatedById(userId)) {
            throw new IllegalArgumentException(
                    "\"" + user.getFullName() + "\"ni o'chirib bo'lmaydi — u yaratgan foydalanuvchilar mavjud, avval ularni o'chiring/qayta biriktiring");
        }
        if (expectedRole == Role.SUPERVAYZER && ishchiRepository.existsBySupervayzerId(userId)) {
            throw new IllegalArgumentException(
                    "\"" + user.getFullName() + "\"ni o'chirib bo'lmaydi — unga biriktirilgan ishchilar mavjud, avval ularni boshqa supervayzerga o'tkazing yoki o'chiring");
        }
        ishchiRepository.clearCreatedBy(userId);
        String nomi = user.getFullName();
        userRepository.deleteById(userId);
        auditService.record(actor, HarakatTuri.OCHIRDI, nomi);
    }

    private User findByIdAndRole(Long userId, Role expectedRole) {
        return userRepository.findById(userId)
                .filter(u -> u.getRole() == expectedRole)
                .orElseThrow(() -> new IllegalArgumentException("Foydalanuvchi topilmadi"));
    }
}
