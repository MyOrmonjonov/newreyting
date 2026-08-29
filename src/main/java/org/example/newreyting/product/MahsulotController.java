package org.example.newreyting.product;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.product.dto.MahsulotRequest;
import org.example.newreyting.product.dto.MahsulotResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mahsulotlar")
public class MahsulotController {

    private final MahsulotService mahsulotService;

    public MahsulotController(MahsulotService mahsulotService) {
        this.mahsulotService = mahsulotService;
    }

    @GetMapping
    public List<MahsulotResponse> list() {
        return mahsulotService.list().stream().map(MahsulotResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public MahsulotResponse create(@Valid @RequestBody MahsulotRequest req, @AuthenticationPrincipal AppUserDetails principal) {
        return MahsulotResponse.from(mahsulotService.create(req, principal.getUser()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public MahsulotResponse update(@PathVariable Long id, @Valid @RequestBody MahsulotRequest req,
                                    @AuthenticationPrincipal AppUserDetails principal) {
        return MahsulotResponse.from(mahsulotService.update(id, req, principal.getUser()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        mahsulotService.delete(id, principal.getUser());
    }
}
