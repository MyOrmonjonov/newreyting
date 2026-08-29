package org.example.newreyting.employee;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.employee.dto.CreateIshchiRequest;
import org.example.newreyting.employee.dto.IshchiResponse;
import org.example.newreyting.employee.dto.UpdateIshchiRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ishchilar")
@PreAuthorize("hasAnyRole('ADMIN','OPERATOR','MENEJER','SUPERVAYZER')")
public class IshchiController {

    private final IshchiService ishchiService;

    public IshchiController(IshchiService ishchiService) {
        this.ishchiService = ishchiService;
    }

    @GetMapping
    public List<IshchiResponse> list(@AuthenticationPrincipal AppUserDetails principal) {
        return ishchiService.listVisibleTo(principal.getUser()).stream().map(IshchiResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IshchiResponse create(@Valid @RequestBody CreateIshchiRequest req,
                                  @AuthenticationPrincipal AppUserDetails principal) {
        return IshchiResponse.from(ishchiService.create(req, principal.getUser()));
    }

    @PutMapping("/{id}")
    public IshchiResponse update(@PathVariable Long id, @Valid @RequestBody UpdateIshchiRequest req,
                                  @AuthenticationPrincipal AppUserDetails principal) {
        return IshchiResponse.from(ishchiService.update(id, req, principal.getUser()));
    }
}
