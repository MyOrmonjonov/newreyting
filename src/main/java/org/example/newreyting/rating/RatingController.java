package org.example.newreyting.rating;

import org.example.newreyting.rating.dto.AgentResponse;
import org.example.newreyting.rating.dto.RankedUserResponse;
import org.example.newreyting.rating.dto.ScoreboardRowResponse;
import org.example.newreyting.rating.dto.YillikOyResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Hisoblangan reyting — faqat o'qish, login talab qilmaydi (ochiq reyting sahifalari uchun). */
@RestController
@RequestMapping("/api/reyting")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @GetMapping("/ishchi")
    public List<AgentResponse> ishchi(@RequestParam LocalDate oy) {
        return ratingService.computeIshchiReyting(oy);
    }

    @GetMapping("/supervayzer")
    public List<RankedUserResponse> supervayzer(@RequestParam LocalDate oy) {
        return ratingService.computeSupervayzerReyting(oy);
    }

    @GetMapping("/menejer")
    public List<RankedUserResponse> menejer(@RequestParam LocalDate oy) {
        return ratingService.computeMenejerReyting(oy);
    }

    @GetMapping("/supervayzer/tarix")
    public List<ScoreboardRowResponse> supervayzerTarix(@RequestParam(defaultValue = "5") int oyCount) {
        return ratingService.computeSupervayzerTarix(oyCount);
    }

    @GetMapping("/yillik")
    public List<YillikOyResponse> yillik(@RequestParam int yil) {
        return ratingService.computeYillikStatistika(yil);
    }
}
